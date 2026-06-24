import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import { sendEmail } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';

const generateToken = (payload: object, secret: string, expiresIn: string): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// ============================================================
// ADMIN LOGIN
// ============================================================
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const [rows]: any = await pool.query(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1',
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = generateToken(
      { id: admin.id, email: admin.email, role: admin.role, name: admin.full_name },
      process.env.JWT_SECRET as string,
      process.env.JWT_EXPIRES_IN || '7d'
    );

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: { id: admin.id, name: admin.full_name, email: admin.email, role: admin.role },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ============================================================
// LECTURER REGISTER
// ============================================================
export const lecturerRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, staff_id, department, password } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone || !staff_id || !password) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }

    // Check duplicate email or staff_id
    const [existing]: any = await pool.query(
      'SELECT id FROM lecturers WHERE email = ? OR staff_id = ?',
      [email.toLowerCase().trim(), staff_id.trim()]
    );

    if (existing.length) {
      res.status(409).json({ success: false, message: 'Email or Staff ID already registered.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO lecturers (full_name, email, phone, staff_id, department, password_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        full_name.trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        staff_id.trim(),
        department || 'Biotechnology',
        password_hash,
      ]
    );

    // Notify admin
    const [adminRows]: any = await pool.query('SELECT email FROM admins LIMIT 1');
    if (adminRows.length) {
      await sendEmail({
        to: adminRows[0].email,
        subject: 'New Lecturer Registration Pending Approval',
        html: `
          <h2>New Lecturer Registration</h2>
          <p>A new lecturer account is pending approval:</p>
          <ul>
            <li><strong>Name:</strong> ${full_name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Staff ID:</strong> ${staff_id}</li>
            <li><strong>Department:</strong> ${department || 'Biotechnology'}</li>
          </ul>
          <p>Please log in to the admin dashboard to approve or reject this account.</p>
        `,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending administrator approval.',
    });
  } catch (error) {
    console.error('Lecturer register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ============================================================
// LECTURER LOGIN
// ============================================================
export const lecturerLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const [rows]: any = await pool.query(
      'SELECT * FROM lecturers WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const lecturer = rows[0];

    if (lecturer.status === 'pending') {
      res.status(403).json({ success: false, message: 'Your account is pending approval by an administrator.' });
      return;
    }

    if (lecturer.status === 'rejected') {
      res.status(403).json({ success: false, message: 'Your account registration was rejected. Please contact the department.' });
      return;
    }

    if (lecturer.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact the administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, lecturer.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    await pool.query('UPDATE lecturers SET last_login = NOW() WHERE id = ?', [lecturer.id]);

    const token = generateToken(
      { id: lecturer.id, email: lecturer.email, role: 'lecturer', name: lecturer.full_name },
      process.env.JWT_SECRET as string,
      process.env.JWT_EXPIRES_IN || '7d'
    );

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: lecturer.id,
          name: lecturer.full_name,
          email: lecturer.email,
          staff_id: lecturer.staff_id,
          department: lecturer.department,
          role: 'lecturer',
        },
      },
    });
  } catch (error) {
    console.error('Lecturer login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const [rows]: any = await pool.query(
      'SELECT id, full_name FROM lecturers WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });

    if (!rows.length) return;

    const lecturer = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE lecturers SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, expires, lecturer.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/lecturer/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request - Biotech Portal',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${lecturer.full_name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background:#006400;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }

    const [rows]: any = await pool.query(
      'SELECT id FROM lecturers WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );

    if (!rows.length) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    await pool.query(
      'UPDATE lecturers SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [password_hash, rows[0].id]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET CURRENT USER PROFILE
// ============================================================
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let profile;

    if (user.role === 'lecturer') {
      const [rows]: any = await pool.query(
        'SELECT id, full_name, email, phone, staff_id, department, status, profile_photo, bio, last_login, created_at FROM lecturers WHERE id = ?',
        [user.id]
      );
      profile = rows[0];
    } else {
      const [rows]: any = await pool.query(
        'SELECT id, full_name, email, role, last_login, created_at FROM admins WHERE id = ?',
        [user.id]
      );
      profile = rows[0];
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
