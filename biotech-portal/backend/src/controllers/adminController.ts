import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

// ============================================================
// DASHBOARD ANALYTICS
// ============================================================
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [revenue]: any = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'successful'"
    );
    const [payments]: any = await pool.query(
      "SELECT COUNT(*) AS total FROM payments WHERE payment_status = 'successful'"
    );
    const [lecturers]: any = await pool.query(
      "SELECT COUNT(*) AS total, SUM(status='approved') AS approved, SUM(status='pending') AS pending FROM lecturers"
    );
    const [materials]: any = await pool.query('SELECT COUNT(*) AS total FROM materials WHERE is_active = 1');
    const [downloads]: any = await pool.query('SELECT COALESCE(SUM(download_count), 0) AS total FROM materials');

    // Revenue charts
    const [dailyRevenue]: any = await pool.query(`
      SELECT DATE(payment_date) AS date, SUM(amount) AS revenue, COUNT(*) AS count
      FROM payments WHERE payment_status = 'successful' AND payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(payment_date) ORDER BY date ASC
    `);

    const [weeklyRevenue]: any = await pool.query(`
      SELECT YEARWEEK(payment_date, 1) AS week,
             MIN(DATE(payment_date)) AS week_start,
             SUM(amount) AS revenue, COUNT(*) AS count
      FROM payments WHERE payment_status = 'successful' AND payment_date >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
      GROUP BY YEARWEEK(payment_date, 1) ORDER BY week ASC
    `);

    const [monthlyRevenue]: any = await pool.query(`
      SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, SUM(amount) AS revenue, COUNT(*) AS count
      FROM payments WHERE payment_status = 'successful' AND payment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(payment_date, '%Y-%m') ORDER BY month ASC
    `);

    const [annualRevenue]: any = await pool.query(`
      SELECT YEAR(payment_date) AS year, SUM(amount) AS revenue, COUNT(*) AS count
      FROM payments WHERE payment_status = 'successful'
      GROUP BY YEAR(payment_date) ORDER BY year ASC
    `);

    // Recent activities
    const [recentActivities]: any = await pool.query(`
      SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 15
    `);

    // Recent payments
    const [recentPayments]: any = await pool.query(`
      SELECT full_name, matric_number, amount, academic_session, payment_date, payment_status
      FROM payments ORDER BY created_at DESC LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: {
          total_revenue: parseFloat(revenue[0].total),
          total_payments: payments[0].total,
          total_lecturers: lecturers[0].total,
          approved_lecturers: lecturers[0].approved,
          pending_lecturers: lecturers[0].pending,
          total_materials: materials[0].total,
          total_downloads: downloads[0].total,
        },
        charts: { dailyRevenue, weeklyRevenue, monthlyRevenue, annualRevenue },
        recentActivities,
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// LECTURER MANAGEMENT
// ============================================================
export const getAllLecturers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    let query = `
      SELECT l.*, a.full_name AS approved_by_name
      FROM lecturers l
      LEFT JOIN admins a ON l.approved_by = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) { query += ' AND l.status = ?'; params.push(status); }
    if (search) {
      query += ' AND (l.full_name LIKE ? OR l.email LIKE ? OR l.staff_id LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = parseInt(String(limit));
    const offset = (pageNum - 1) * limitNum;

    const [countRows]: any = await pool.query(
      query.replace('SELECT l.*, a.full_name AS approved_by_name', 'SELECT COUNT(*) AS total'),
      params
    );

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows]: any = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map((l: any) => { delete l.password_hash; return l; }),
      pagination: { total: countRows[0].total, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Get all lecturers error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateLecturerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status.' });
      return;
    }

    const [rows]: any = await pool.query('SELECT * FROM lecturers WHERE id = ?', [id]);
    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Lecturer not found.' });
      return;
    }

    await pool.query(
      `UPDATE lecturers SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [status, req.user!.id, id]
    );

    await pool.query(
      'INSERT INTO lecturer_approvals (lecturer_id, admin_id, action, reason) VALUES (?, ?, ?, ?)',
      [id, req.user!.id, status, reason || null]
    );

    res.json({ success: true, message: `Lecturer ${status} successfully.` });
  } catch (error) {
    console.error('Update lecturer status error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const resetLecturerPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      return;
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE lecturers SET password_hash = ? WHERE id = ?', [password_hash, id]);

    await pool.query(
      `INSERT INTO activity_logs (actor_type, actor_id, actor_name, action, description) VALUES ('admin', ?, ?, 'reset_password', ?)`,
      [req.user!.id, req.user!.name, `Reset password for lecturer ID ${id}`]
    );

    res.json({ success: true, message: 'Lecturer password reset successfully.' });
  } catch (error) {
    console.error('Reset lecturer password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const deleteLecturer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM lecturers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Lecturer deleted successfully.' });
  } catch (error) {
    console.error('Delete lecturer error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// PAYMENT MANAGEMENT
// ============================================================
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, session, status, level, date_from, date_to, page = '1', limit = '20' } = req.query;

    let query = 'SELECT p.*, r.receipt_number FROM payments p LEFT JOIN receipts r ON p.id = r.payment_id WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (p.full_name LIKE ? OR p.matric_number LIKE ? OR r.receipt_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (session) { query += ' AND p.academic_session = ?'; params.push(session); }
    if (status) { query += ' AND p.payment_status = ?'; params.push(status); }
    if (level) { query += ' AND p.level = ?'; params.push(level); }
    if (date_from) { query += ' AND DATE(p.payment_date) >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND DATE(p.payment_date) <= ?'; params.push(date_to); }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = parseInt(String(limit));
    const offset = (pageNum - 1) * limitNum;

    const [countRows]: any = await pool.query(
      query.replace('SELECT p.*, r.receipt_number', 'SELECT COUNT(*) AS total'),
      params
    );

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows]: any = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total: countRows[0].total, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// SETTINGS MANAGEMENT
// ============================================================
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query('SELECT setting_key, setting_value, setting_type, description FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, data: settings, raw: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    await pool.query(
      'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [value, req.user!.id, key]
    );

    res.json({ success: true, message: 'Setting updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateBulkSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ success: false, message: 'Settings object required.' });
      return;
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
        [value, req.user!.id, key]
      );
    }

    res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update bulk settings error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const uploadBrandingImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Image file is required.' });
      return;
    }

    const { type } = req.params;
    const validTypes = ['department_logo', 'faculty_logo', 'homepage_banner', 'favicon'];

    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid image type.' });
      return;
    }

    const { url } = await uploadImageToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'biotech-portal/branding'
    );

    await pool.query(
      'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [url, req.user!.id, type]
    );

    res.json({ success: true, message: 'Image uploaded successfully.', data: { url } });
  } catch (error) {
    console.error('Upload branding image error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image.' });
  }
};

// ============================================================
// ACADEMIC SETTINGS
// ============================================================
export const getAcademicData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [sessions]: any = await pool.query('SELECT * FROM academic_sessions ORDER BY session_name DESC');
    const [levels]: any = await pool.query('SELECT * FROM levels ORDER BY sort_order ASC');
    const [semesters]: any = await pool.query('SELECT * FROM semesters ORDER BY id ASC');
    const [courses]: any = await pool.query(`
      SELECT c.*, l.name AS level_name, s.name AS semester_name
      FROM courses c
      LEFT JOIN levels l ON c.level_id = l.id
      LEFT JOIN semesters s ON c.semester_id = s.id
      ORDER BY c.course_code ASC
    `);

    res.json({ success: true, data: { sessions, levels, semesters, courses } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createAcademicSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { session_name, is_current } = req.body;

    if (is_current) {
      await pool.query('UPDATE academic_sessions SET is_current = 0');
    }

    await pool.query(
      'INSERT INTO academic_sessions (session_name, is_current) VALUES (?, ?)',
      [session_name, is_current ? 1 : 0]
    );

    res.status(201).json({ success: true, message: 'Academic session created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { course_code, course_title, level_id, semester_id, credit_units } = req.body;

    await pool.query(
      'INSERT INTO courses (course_code, course_title, level_id, semester_id, credit_units) VALUES (?, ?, ?, ?, ?)',
      [course_code.toUpperCase().trim(), course_title.trim(), level_id || null, semester_id || null, credit_units || 2]
    );

    res.status(201).json({ success: true, message: 'Course created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error or duplicate course code.' });
  }
};

// ============================================================
// ANNOUNCEMENTS
// ============================================================
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, is_published, expires_at } = req.body;

    await pool.query(
      `INSERT INTO announcements (title, content, admin_id, is_published, published_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        content.trim(),
        req.user!.id,
        is_published ? 1 : 0,
        is_published ? new Date() : null,
        expires_at || null,
      ]
    );

    res.status(201).json({ success: true, message: 'Announcement created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { published_only } = req.query;
    let query = 'SELECT * FROM announcements WHERE 1=1';
    if (published_only === 'true') {
      query += ' AND is_published = 1 AND (expires_at IS NULL OR expires_at > NOW())';
    }
    query += ' ORDER BY created_at DESC';
    const [rows]: any = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
