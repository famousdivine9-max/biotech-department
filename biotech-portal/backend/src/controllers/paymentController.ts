import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import pool from '../config/database';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export const initiatePayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { full_name, matric_number, email, phone, level, academic_session } = req.body;
    if (!full_name || !matric_number || !email || !phone || !level || !academic_session) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    // Get settings
    const settingsResult = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('departmental_dues', 'processing_fee')");
    const settings: any = {};
    settingsResult.rows.forEach((row: any) => { settings[row.setting_key] = parseFloat(row.setting_value); });

    const dues_amount = settings.departmental_dues || 1000;
    const processing_fee = settings.processing_fee || 200;
    const total = dues_amount + processing_fee;
    const amount_kobo = Math.ceil(total * 100);

    const reference = `BTH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get session ID
    const sessionResult = await pool.query('SELECT id FROM academic_sessions WHERE session_name = $1', [academic_session]);
    const session_id = sessionResult.rows[0]?.id || null;

    // Save pending payment
    await pool.query(
      `INSERT INTO payments (full_name, matric_number, email, phone, level, academic_session, session_id, amount, dues_amount, processing_fee, paystack_reference, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')`,
      [full_name, matric_number, email, phone, level, academic_session, session_id, total, dues_amount, processing_fee, reference]
    );

    // Initialize Paystack
    const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: amount_kobo,
      reference,
      metadata: { full_name, matric_number, level, academic_session }
    }, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    res.json({
      success: true,
      data: {
        authorization_url: paystackRes.data.data.authorization_url,
        reference,
        amount: total,
        dues_amount,
        processing_fee
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment initiation.' });
  }
};

export const verifyPayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { reference } = req.query;
    if (!reference) {
      res.status(400).json({ success: false, message: 'Reference is required.' });
      return;
    }

    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const data = paystackRes.data.data;
    if (data.status !== 'success') {
      res.status(400).json({ success: false, message: 'Payment not successful.' });
      return;
    }

    // Check payment exists
    const paymentResult = await pool.query('SELECT * FROM payments WHERE paystack_reference = $1', [reference]);
    if (paymentResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Payment not found.' });
      return;
    }

    const payment = paymentResult.rows[0];
    if (payment.payment_status === 'successful') {
      const receiptResult = await pool.query('SELECT * FROM receipts WHERE payment_id = $1', [payment.id]);
      res.json({ success: true, ...receiptResult.rows[0] });
      return;
    }

    // Update payment
    await pool.query(
      "UPDATE payments SET payment_status = 'successful', paystack_transaction_id = $1, payment_date = NOW() WHERE paystack_reference = $2",
      [String(data.id), reference]
    );

    // Generate receipt number
    const updatedPayment = await pool.query('SELECT id FROM payments WHERE paystack_reference = $1', [reference]);
    const payment_id = updatedPayment.rows[0].id;
    const receipt_number = `BTH-${new Date().getFullYear()}-${String(payment_id).padStart(5, '0')}`;

    // Create receipt
    await pool.query(
      `INSERT INTO receipts (payment_id, receipt_number, matric_number, full_name, email, academic_session, level, amount_paid, payment_reference, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [payment_id, receipt_number, payment.matric_number, payment.full_name, payment.email, payment.academic_session, payment.level, payment.amount, reference, String(data.id)]
    );

    const receiptResult = await pool.query('SELECT * FROM receipts WHERE payment_id = $1', [payment_id]);
    res.json({ success: true, ...receiptResult.rows[0] });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
};

export const paystackWebhook = async (req: any, res: Response): Promise<void> => {
  try {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      res.status(400).json({ success: false, message: 'Invalid signature.' });
      return;
    }

    const { event, data } = req.body;
    if (event === 'charge.success') {
      const reference = data.reference;
      await pool.query(
        "UPDATE payments SET payment_status = 'successful', payment_date = NOW() WHERE paystack_reference = $1 AND payment_status = 'pending'",
        [reference]
      );
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
};

export const findReceipt = async (req: any, res: Response): Promise<void> => {
  try {
    const { search_type, search_value } = req.body;
    if (!search_type || !search_value) {
      res.status(400).json({ success: false, message: 'Search type and value are required.' });
      return;
    }

    let query = 'SELECT r.*, p.phone FROM receipts r LEFT JOIN payments p ON r.payment_id = p.id WHERE ';
    const params = [search_value];

    if (search_type === 'matric_number') query += 'r.matric_number = $1';
    else if (search_type === 'receipt_number') query += 'r.receipt_number = $1';
    else if (search_type === 'payment_reference') query += 'r.payment_reference = $1';
    else {
      res.status(400).json({ success: false, message: 'Invalid search type.' });
      return;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, receipts: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const downloadReceipt = async (req: any, res: Response): Promise<void> => {
  try {
    const { receipt_number } = req.params;
    const result = await pool.query('SELECT * FROM receipts WHERE receipt_number = $1', [receipt_number]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Receipt not found.' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
