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
    const settingsResult = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('departmental_dues', 'processing_fee')");
    const settings: any = {};
    settingsResult.rows.forEach((row: any) => { settings[row.setting_key] = parseFloat(row.setting_value); });
    const dues_amount = settings.departmental_dues || 1000;
    const processing_fee = settings.processing_fee || 100;
    const total = dues_amount + processing_fee;
    const amount_kobo = Math.ceil(total * 100);
    const reference = `BTH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const sessionResult = await pool.query('SELECT id FROM academic_sessions WHERE session_name = $1', [academic_session]);
    const session_id = sessionResult.rows[0]?.id || null;
    await pool.query(
      `INSERT INTO payments (full_name, matric_number, email, phone, level, academic_session, session_id, amount, dues_amount, processing_fee, paystack_reference, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')`,
      [full_name, matric_number, email, phone, level, academic_session, session_id, total, dues_amount, processing_fee, reference]
    );
    const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
      email, amount: amount_kobo, reference,
      metadata: { full_name, matric_number, level, academic_session }
    }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } });
    res.json({ success: true, data: { authorization_url: paystackRes.data.data.authorization_url, reference, amount: total, dues_amount, processing_fee } });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment initiation.' });
  }
};

export const verifyPayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { reference } = req.query;
    if (!reference) { res.status(400).json({ success: false, message: 'Reference is required.' }); return; }
    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } });
    const data = paystackRes.data.data;
    if (data.status !== 'success') { res.status(400).json({ success: false, message: 'Payment not successful.' }); return; }
    const paymentResult = await pool.query('SELECT * FROM payments WHERE paystack_reference = $1', [reference]);
    if (paymentResult.rows.length === 0) { res.status(404).json({ success: false, message: 'Payment not found.' }); return; }
    const payment = paymentResult.rows[0];
    if (payment.payment_status === 'successful') {
      const receiptResult = await pool.query('SELECT * FROM receipts WHERE payment_id = $1', [payment.id]);
      res.json({ success: true, ...receiptResult.rows[0] }); return;
    }
    await pool.query("UPDATE payments SET payment_status = 'successful', paystack_transaction_id = $1, payment_date = NOW() WHERE paystack_reference = $2", [String(data.id), reference]);
    const updatedPayment = await pool.query('SELECT id FROM payments WHERE paystack_reference = $1', [reference]);
    const payment_id = updatedPayment.rows[0].id;
    const receipt_number = `BTH-${new Date().getFullYear()}-${String(payment_id).padStart(5, '0')}`;
    await pool.query(
      `INSERT INTO receipts (payment_id, receipt_number, matric_number, full_name, email, academic_session, level, amount_paid, payment_reference, transaction_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
    if (hash !== req.headers['x-paystack-signature']) { res.status(400).json({ success: false, message: 'Invalid signature.' }); return; }
    const { event, data } = req.body;
    if (event === 'charge.success') {
      const reference = data.reference;
      const paymentResult = await pool.query('SELECT * FROM payments WHERE paystack_reference = $1', [reference]);
      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];
        if (payment.payment_status !== 'successful') {
          await pool.query("UPDATE payments SET payment_status = 'successful', paystack_transaction_id = $1, payment_date = NOW() WHERE paystack_reference = $2", [String(data.id), reference]);
          const receipt_number = `BTH-${new Date().getFullYear()}-${String(payment.id).padStart(5, '0')}`;
          const existing = await pool.query('SELECT id FROM receipts WHERE payment_id = $1', [payment.id]);
          if (existing.rows.length === 0) {
            await pool.query(
              `INSERT INTO receipts (payment_id, receipt_number, matric_number, full_name, email, academic_session, level, amount_paid, payment_reference, transaction_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [payment.id, receipt_number, payment.matric_number, payment.full_name, payment.email, payment.academic_session, payment.level, payment.amount, reference, String(data.id)]
            );
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
};

export const findReceipt = async (req: any, res: Response): Promise<void> => {
  try {
    const { search_type, search_value } = req.body;
    if (!search_type || !search_value) { res.status(400).json({ success: false, message: 'Search type and value are required.' }); return; }
    let query = 'SELECT r.*, p.phone FROM receipts r LEFT JOIN payments p ON r.payment_id = p.id WHERE ';
    const params = [search_value];
    if (search_type === 'matric_number') query += 'r.matric_number = $1';
    else if (search_type === 'receipt_number') query += 'r.receipt_number = $1';
    else if (search_type === 'payment_reference') query += 'r.payment_reference = $1';
    else { res.status(400).json({ success: false, message: 'Invalid search type.' }); return; }
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
    const r = result.rows[0];

    // Get logos from settings
    const settingsResult = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('department_logo', 'faculty_logo', 'department_name', 'university_name')"
    );
    const s: any = {};
    settingsResult.rows.forEach((row: any) => { s[row.setting_key] = row.setting_value; });

    const deptLogo = s.department_logo || '';
    const fulLogo = s.faculty_logo || '';
    const deptName = s.department_name || 'Department of Biotechnology';
    const uniName = s.university_name || 'Federal University Lokoja';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt ${r.receipt_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: Arial, sans-serif; 
    width: 80mm; 
    margin: 0 auto; 
    padding: 8mm 5mm; 
    color: #1f2937; 
    background: white;
    font-size: 11px;
  }
  .logos { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    gap: 10px; 
    margin-bottom: 8px; 
  }
  .logo-img { 
    width: 40px; 
    height: 40px; 
    object-fit: contain; 
    border-radius: 50%;
  }
  .header { text-align: center; border-bottom: 2px solid #15803d; padding-bottom: 8px; margin-bottom: 8px; }
  .dept-name { font-size: 12px; font-weight: bold; color: #15803d; line-height: 1.3; }
  .uni-name { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .receipt-title { 
    text-align: center; 
    font-size: 11px; 
    font-weight: bold; 
    text-transform: uppercase; 
    letter-spacing: 1px;
    margin: 8px 0 4px;
    color: #1f2937;
  }
  .receipt-number { 
    text-align: center;
    background: #f0fdf4; 
    border: 1px solid #15803d; 
    padding: 4px 8px; 
    border-radius: 4px; 
    font-family: monospace; 
    font-size: 12px; 
    font-weight: bold; 
    color: #15803d;
    margin-bottom: 8px;
  }
  .divider { border: none; border-top: 1px dashed #d1d5db; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; }
  .label { color: #6b7280; font-size: 10px; flex: 1; }
  .value { font-weight: 600; font-size: 10px; text-align: right; flex: 1; }
  .amount-box { 
    background: #f0fdf4; 
    border: 1px solid #15803d; 
    border-radius: 4px; 
    padding: 6px 8px; 
    margin: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .amount-label { font-size: 11px; font-weight: bold; color: #1f2937; }
  .amount-value { font-size: 14px; font-weight: bold; color: #15803d; }
  .stamp { 
    text-align: center; 
    border: 2px solid #15803d; 
    border-radius: 50%; 
    width: 50px; 
    height: 50px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    margin: 8px auto;
    color: #15803d;
    font-weight: bold;
    font-size: 10px;
    line-height: 1.2;
  }
  .footer { 
    text-align: center; 
    margin-top: 8px; 
    padding-top: 6px; 
    border-top: 1px dashed #d1d5db; 
    color: #9ca3af; 
    font-size: 9px;
    line-height: 1.5;
  }
  @media print { 
    body { width: 80mm; margin: 0; padding: 5mm; }
    @page { size: 80mm auto; margin: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logos">
      ${fulLogo ? `<img src="${fulLogo}" class="logo-img" alt="FUL Logo">` : ''}
      ${deptLogo ? `<img src="${deptLogo}" class="logo-img" alt="Dept Logo">` : ''}
    </div>
    <div class="dept-name">${deptName}</div>
    <div class="uni-name">${uniName}</div>
  </div>

  <div class="receipt-title">Payment Receipt</div>
  <div class="receipt-number">${r.receipt_number}</div>

  <hr class="divider">

  <div class="row">
    <span class="label">Name</span>
    <span class="value">${r.full_name}</span>
  </div>
  <div class="row">
    <span class="label">Matric No</span>
    <span class="value">${r.matric_number}</span>
  </div>
  <div class="row">
    <span class="label">Level</span>
    <span class="value">${r.level}</span>
  </div>
  <div class="row">
    <span class="label">Session</span>
    <span class="value">${r.academic_session}</span>
  </div>
  <div class="row">
    <span class="label">Date</span>
    <span class="value">${new Date(r.issued_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
  </div>
  <div class="row">
    <span class="label">Ref</span>
    <span class="value" style="font-size:8px">${r.payment_reference}</span>
  </div>

  <hr class="divider">

  <div class="amount-box">
    <span class="amount-label">TOTAL PAID</span>
    <span class="amount-value">₦${parseFloat(r.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
  </div>

  <div style="display:flex;justify-content:center">
    <div class="stamp">PAID<br>✓</div>
  </div>

  <div class="footer">
    <p>Departmental Dues Payment</p>
    <p>This receipt is electronically generated</p>
    <p>and is valid without a signature.</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
