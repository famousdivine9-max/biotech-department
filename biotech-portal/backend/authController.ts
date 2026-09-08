import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';

export const adminLogin = async (req: any, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }
    const result = await pool.query('SELECT * FROM admins WHERE email = $1 AND is_active = true', [email]);
    const admin = result.rows[0];
    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, name: admin.full_name },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );
    res.json({
      success: true,
      data: {
        token,
        user: { id: admin.id, name: admin.full_name, full_name: admin.full_name, email: admin.email, role: admin.role }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const lecturerRegister = async (req: any, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, staff_id, department, password } = req.body;
    if (!full_name || !email || !phone || !staff_id || !password) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }
    const existing = await pool.query('SELECT id FROM lecturers WHERE email = $1 OR staff_id = $2', [email, staff_id]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Email or Staff ID already registered.' });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      'INSERT INTO lecturers (full_name, email, phone, staff_id, department, password_hash, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [full_name, email, phone, staff_id, department || 'Biotechnology', password_hash, 'pending']
    );
    res.status(201).json({ success: true, message: 'Registration successful. Awaiting admin approval.' });
  } catch (error) {
    console.error('Lecturer register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const lecturerLogin = async (req: any, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }
    const result = await pool.query('SELECT * FROM lecturers WHERE email = $1', [email]);
    const lecturer = result.rows[0];
    if (!lecturer) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    if (lecturer.status !== 'approved') {
      res.status(403).json({ success: false, message: 'Your account is pending admin approval or has been suspended.' });
      return;
    }
    const isValid = await bcrypt.compare(password, lecturer.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    await pool.query('UPDATE lecturers SET last_login = NOW() WHERE id = $1', [lecturer.id]);
    const token = jwt.sign(
      { id: lecturer.id, email: lecturer.email, role: 'lecturer', name: lecturer.full_name },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );
    res.json({
      success: true,
      token,
      data: {
        token,
        user: { id: lecturer.id, name: lecturer.full_name, full_name: lecturer.full_name, email: lecturer.email, role: 'lecturer', staff_id: lecturer.staff_id, department: lecturer.department }
      }
    });
  } catch (error) {
    console.error('Lecturer login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const forgotPassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ success: false, message: 'Email is required.' }); return; }
    const result = await pool.query('SELECT id FROM lecturers WHERE email = $1', [email]);
    if (result.rows.length === 0) { res.json({ success: true, message: 'If that email exists, a reset link has been sent.' }); return; }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE lecturers SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3', [token, expires, email]);
    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const resetPassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) { res.status(400).json({ success: false, message: 'Token and new password are required.' }); return; }
    const result = await pool.query('SELECT id FROM lecturers WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [token]);
    if (result.rows.length === 0) { res.status(400).json({ success: false, message: 'Invalid or expired reset token.' }); return; }
    const password_hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE lecturers SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [password_hash, result.rows[0].id]);
    res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (user.role === 'lecturer') {
      const result = await pool.query('SELECT id, full_name, email, phone, staff_id, department, status, created_at FROM lecturers WHERE id = $1', [user.id]);
      res.json({ success: true, data: result.rows[0] });
    } else {
      const result = await pool.query('SELECT id, full_name, email, role, created_at FROM admins WHERE id = $1', [user.id]);
      res.json({ success: true, data: result.rows[0] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
