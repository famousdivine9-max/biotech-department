import { Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { generateReceiptPDF } from '../services/pdfService';
import { sendEmail } from '../services/emailService';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY as string;

// ============================================================
// INITIATE PAYMENT
// ============================================================
export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, matric_number, email, phone, level, department, academic_session } = req.body;

    // Validate required fields
    if (!full_name || !matric_number || !email || !phone || !level || !academic_session) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email address.' });
      return;
    }

    // Get payment amounts from settings
    const [settingsRows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('departmental_dues', 'processing_fee')"
    );

    const settings: Record<string, number> = {};
    settingsRows.forEach((s: any) => { settings[s.setting_key] = parseFloat(s.setting_value); });

    const dues_amount = settings.departmental_dues || 2000;
    const processing_fee = settings.processing_fee || 100;
    const total_amount = dues_amount + processing_fee;

    // Check for existing SUCCESSFUL payment this session
    const [existingPayment]: any = await pool.query(
      "SELECT id FROM payments WHERE matric_number = ? AND academic_session = ? AND payment_status = 'successful'",
      [matric_number.toUpperCase().trim(), academic_session]
    );

    if (existingPayment.length) {
      res.status(409).json({
        success: false,
        message: 'A successful payment already exists for this matric number in this academic session.',
      });
      return;
    }

    // Get session ID
    const [sessionRows]: any = await pool.query(
      'SELECT id FROM academic_sessions WHERE session_name = ?',
      [academic_session]
    );
    const session_id = sessionRows.length ? sessionRows[0].id : null;

    // Generate unique reference
    const reference = `BIOTECH-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;

    // Save pending payment
    await pool.query(
      `INSERT INTO payments
       (full_name, matric_number, email, phone, level, department, session_id, academic_session,
        amount, dues_amount, processing_fee, paystack_reference, payment_status, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        full_name.trim(),
        matric_number.toUpperCase().trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        level,
        department || 'Biotechnology',
        session_id,
        academic_session,
        total_amount,
        dues_amount,
        processing_fee,
        reference,
        req.ip,
      ]
    );

    // Initialize Paystack transaction
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email.toLowerCase().trim(),
        amount: Math.round(total_amount * 100), // Paystack uses kobo
        reference,
        metadata: {
          full_name,
          matric_number: matric_number.toUpperCase().trim(),
          phone,
          level,
          academic_session,
          custom_fields: [
            { display_name: 'Full Name', variable_name: 'full_name', value: full_name },
            { display_name: 'Matric Number', variable_name: 'matric_number', value: matric_number },
            { display_name: 'Level', variable_name: 'level', value: level },
            { display_name: 'Academic Session', variable_name: 'academic_session', value: academic_session },
          ],
        },
        callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paystackResponse.data.status) {
      throw new Error('Failed to initialize Paystack transaction');
    }

    res.json({
      success: true,
      message: 'Payment initialized.',
      data: {
        reference,
        authorization_url: paystackResponse.data.data.authorization_url,
        access_code: paystackResponse.data.data.access_code,
        amount: total_amount,
        dues_amount,
        processing_fee,
      },
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize payment. Please try again.' });
  }
};

// ============================================================
// VERIFY PAYMENT (Called after Paystack redirect)
// ============================================================
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.query as { reference: string };

    if (!reference) {
      res.status(400).json({ success: false, message: 'Payment reference is required.' });
      return;
    }

    // Check existing payment record
    const [paymentRows]: any = await pool.query(
      'SELECT * FROM payments WHERE paystack_reference = ?',
      [reference]
    );

    if (!paymentRows.length) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    const payment = paymentRows[0];

    // Already verified
    if (payment.payment_status === 'successful') {
      const [receiptRows]: any = await pool.query(
        'SELECT * FROM receipts WHERE payment_id = ?',
        [payment.id]
      );
      res.json({
        success: true,
        message: 'Payment already verified.',
        data: { payment, receipt: receiptRows[0] || null },
      });
      return;
    }

    // Verify with Paystack
    const paystackVerify = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const { data: paystackData } = paystackVerify.data;

    if (paystackData.status !== 'success') {
      await pool.query(
        "UPDATE payments SET payment_status = 'failed', updated_at = NOW() WHERE paystack_reference = ?",
        [reference]
      );
      res.status(400).json({ success: false, message: 'Payment was not successful.' });
      return;
    }

    // Verify amount matches
    const expectedAmount = Math.round(payment.amount * 100);
    if (paystackData.amount < expectedAmount) {
      await pool.query(
        "UPDATE payments SET payment_status = 'failed', updated_at = NOW() WHERE paystack_reference = ?",
        [reference]
      );
      res.status(400).json({ success: false, message: 'Payment amount mismatch. Contact support.' });
      return;
    }

    // Update payment to successful
    await pool.query(
      `UPDATE payments
       SET payment_status = 'successful',
           paystack_transaction_id = ?,
           payment_channel = ?,
           payment_date = NOW(),
           metadata = ?,
           updated_at = NOW()
       WHERE paystack_reference = ?`,
      [
        String(paystackData.id),
        paystackData.channel,
        JSON.stringify(paystackData),
        reference,
      ]
    );

    // Generate receipt number
    const year = new Date().getFullYear();
    const receiptNumber = `BTH-${year}-${String(payment.id).padStart(6, '0')}`;

    // Create receipt
    await pool.query(
      `INSERT INTO receipts
       (payment_id, receipt_number, matric_number, full_name, email, academic_session,
        level, amount_paid, payment_reference, transaction_id, issued_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        payment.id,
        receiptNumber,
        payment.matric_number,
        payment.full_name,
        payment.email,
        payment.academic_session,
        payment.level,
        payment.amount,
        reference,
        String(paystackData.id),
      ]
    );

    // Fetch fresh receipt
    const [receiptRows]: any = await pool.query(
      'SELECT * FROM receipts WHERE payment_id = ?',
      [payment.id]
    );
    const receipt = receiptRows[0];

    // Fetch updated payment
    const [updatedPayment]: any = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [payment.id]
    );

    // Send email receipt
    try {
      await sendEmail({
        to: payment.email,
        subject: `Payment Receipt - ${receiptNumber}`,
        html: buildReceiptEmailHTML(receipt, updatedPayment[0]),
      });
    } catch (emailError) {
      console.error('Email send error (non-fatal):', emailError);
    }

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (actor_type, actor_name, action, description, ip_address)
       VALUES ('student', ?, 'payment_successful', ?, ?)`,
      [
        payment.full_name,
        `Payment of ₦${payment.amount} received. Receipt: ${receiptNumber}`,
        req.ip,
      ]
    );

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      data: { payment: updatedPayment[0], receipt },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
};

// ============================================================
// PAYSTACK WEBHOOK
// ============================================================
export const paystackWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const reference = data.reference;
      const [rows]: any = await pool.query(
        "SELECT * FROM payments WHERE paystack_reference = ? AND payment_status = 'pending'",
        [reference]
      );

      if (rows.length) {
        // Delegate to verify logic
        await pool.query(
          `UPDATE payments SET payment_status = 'successful', paystack_transaction_id = ?,
           payment_channel = ?, payment_date = NOW() WHERE paystack_reference = ?`,
          [String(data.id), data.channel, reference]
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
};

// ============================================================
// RECEIPT RECOVERY
// ============================================================
export const findReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search_type, search_value } = req.body;

    const validTypes = ['matric_number', 'receipt_number', 'payment_reference'];
    if (!validTypes.includes(search_type)) {
      res.status(400).json({ success: false, message: 'Invalid search type.' });
      return;
    }

    const columnMap: Record<string, string> = {
      matric_number: 'r.matric_number',
      receipt_number: 'r.receipt_number',
      payment_reference: 'r.payment_reference',
    };

    const [rows]: any = await pool.query(
      `SELECT r.*, p.phone, p.level, p.dues_amount, p.processing_fee, p.payment_channel, p.payment_date
       FROM receipts r
       JOIN payments p ON r.payment_id = p.id
       WHERE ${columnMap[search_type]} = ? AND p.payment_status = 'successful'
       ORDER BY r.issued_at DESC`,
      [search_value.toUpperCase().trim()]
    );

    if (!rows.length) {
      res.status(404).json({ success: false, message: 'No receipt found with the provided details.' });
      return;
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Find receipt error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// DOWNLOAD RECEIPT PDF
// ============================================================
export const downloadReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receipt_number } = req.params;

    const [rows]: any = await pool.query(
      `SELECT r.*, p.phone, p.level, p.dues_amount, p.processing_fee, p.payment_channel, p.payment_date
       FROM receipts r
       JOIN payments p ON r.payment_id = p.id
       WHERE r.receipt_number = ? AND p.payment_status = 'successful'`,
      [receipt_number.toUpperCase()]
    );

    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Receipt not found.' });
      return;
    }

    const receipt = rows[0];

    // Update reissue count
    await pool.query(
      'UPDATE receipts SET reissued_count = reissued_count + 1, last_reissued_at = NOW() WHERE receipt_number = ?',
      [receipt_number]
    );

    // Generate PDF settings
    const [settingsRows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('department_name', 'faculty_name', 'university_name', 'department_logo')"
    );
    const siteSettings: Record<string, string> = {};
    settingsRows.forEach((s: any) => { siteSettings[s.setting_key] = s.setting_value; });

    const pdfBuffer = await generateReceiptPDF(receipt, siteSettings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${receipt_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipt PDF.' });
  }
};

// ============================================================
// HELPER: Build receipt email HTML
// ============================================================
function buildReceiptEmailHTML(receipt: any, payment: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Payment Receipt</title></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#006400;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:22px;">Payment Receipt</h1>
        <p style="margin:5px 0 0;opacity:0.9;">Department of Biotechnology - Federal University Lokoja</p>
      </div>
      <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
        <div style="background:#f0f9f0;padding:15px;border-radius:6px;margin-bottom:20px;text-align:center;">
          <p style="color:#006400;font-size:18px;margin:0;font-weight:bold;">Receipt No: ${receipt.receipt_number}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Student Name</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${receipt.full_name}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Matric Number</td><td style="padding:8px;border-bottom:1px solid #eee;">${receipt.matric_number}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Level</td><td style="padding:8px;border-bottom:1px solid #eee;">${receipt.level}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Academic Session</td><td style="padding:8px;border-bottom:1px solid #eee;">${receipt.academic_session}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount Paid</td><td style="padding:8px;border-bottom:1px solid #eee;color:#006400;font-weight:bold;">₦${parseFloat(receipt.amount_paid).toLocaleString()}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Payment Reference</td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${receipt.payment_reference}</td></tr>
          <tr><td style="padding:8px;color:#666;">Date Issued</td><td style="padding:8px;">${new Date(receipt.issued_at).toLocaleString('en-NG')}</td></tr>
        </table>
        <p style="margin-top:20px;padding:10px;background:#fff9f0;border-left:4px solid #F59E0B;font-size:13px;">
          Keep this receipt for future reference. You may download a PDF copy from the portal using your Matric Number or Receipt Number.
        </p>
        <p style="text-align:center;color:#666;font-size:12px;margin-top:20px;">
          Department of Biotechnology | Faculty of Life Sciences | Federal University Lokoja
        </p>
      </div>
    </body>
    </html>
  `;
}
