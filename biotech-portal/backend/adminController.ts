import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

export const getDashboardStats = async (req: any, res: Response): Promise<void> => {
  try {
    const [revenue, payments, lecturers, materials, downloads, pending] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(amount_paid), 0) as total FROM receipts"),
      pool.query("SELECT COUNT(*) as total FROM payments WHERE payment_status = 'successful'"),
      pool.query("SELECT COUNT(*) as total FROM lecturers"),
      pool.query("SELECT COUNT(*) as total FROM materials"),
      pool.query("SELECT COALESCE(SUM(download_count), 0) as total FROM materials"),
      pool.query("SELECT COUNT(*) as total FROM lecturers WHERE status = 'pending'"),
    ]);
    const activity = await pool.query("SELECT 'payment' as type, 'Payment received' as description, created_at FROM payments WHERE payment_status = 'successful' ORDER BY created_at DESC LIMIT 10");
    res.json({
      success: true,
      cards: {
        total_revenue: parseFloat(revenue.rows[0].total),
        total_payments: parseInt(payments.rows[0].total),
        total_lecturers: parseInt(lecturers.rows[0].total),
        total_materials: parseInt(materials.rows[0].total),
        total_downloads: parseInt(downloads.rows[0].total),
        pending_lecturers: parseInt(pending.rows[0].total),
      },
      charts: { daily: [], weekly: [], monthly: [], annual: [] },
      recent_activity: activity.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getAllLecturers = async (req: any, res: Response): Promise<void> => {
  try {
    const { search = '', status = '' } = req.query;
    let query = 'SELECT l.*, (SELECT COUNT(*) FROM materials m WHERE m.lecturer_id = l.id) as material_count FROM lecturers l WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (search) { query += ` AND (l.full_name ILIKE $${idx} OR l.email ILIKE $${idx+1} OR l.staff_id ILIKE $${idx+2})`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); idx += 3; }
    if (status) { query += ` AND l.status = $${idx}`; params.push(status); idx++; }
    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, lecturers: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Get lecturers error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateLecturerStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE lecturers SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    res.json({ success: true, message: `Lecturer ${status} successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const resetLecturerPassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const temp_password = Math.random().toString(36).slice(-8);
    const password_hash = await bcrypt.hash(temp_password, 12);
    await pool.query('UPDATE lecturers SET password_hash = $1 WHERE id = $2', [password_hash, id]);
    res.json({ success: true, temp_password });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const deleteLecturer = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM lecturers WHERE id = $1', [id]);
    res.json({ success: true, message: 'Lecturer deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getAllPayments = async (req: any, res: Response): Promise<void> => {
  try {
    const { search = '', status = 'successful' } = req.query;
    let query = `SELECT p.*, r.receipt_number FROM payments p LEFT JOIN receipts r ON p.id = r.payment_id WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;
    if (status) { query += ` AND p.payment_status = $${idx}`; params.push(status); idx++; }
    if (search) { query += ` AND (p.full_name ILIKE $${idx} OR p.matric_number ILIKE $${idx+1} OR r.receipt_number ILIKE $${idx+2})`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); idx += 3; }
    query += ' ORDER BY p.created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(amount_paid), 0) as total FROM receipts");
    res.json({ success: true, payments: result.rows, total: result.rows.length, total_revenue: parseFloat(totalRevenue.rows[0].total) });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getSettings = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings: any = {};
    result.rows.forEach((row: any) => { settings[row.setting_key] = row.setting_value; });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateBulkSettings = async (req: any, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query('UPDATE settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2', [value, key]);
    }
    res.json({ success: true, message: 'Settings updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateSetting = async (req: any, res: Response): Promise<void> => {
  try {
    const { key, value } = req.body;
    await pool.query('UPDATE settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2', [value, key]);
    res.json({ success: true, message: 'Setting updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const uploadBrandingImage = async (req: any, res: Response): Promise<void> => {
  try {
    res.json({ success: true, url: '' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getAcademicData = async (req: any, res: Response): Promise<void> => {
  try {
    const [sessions, levels, semesters, courses] = await Promise.all([
      pool.query('SELECT * FROM academic_sessions ORDER BY created_at DESC'),
      pool.query('SELECT * FROM levels ORDER BY sort_order'),
      pool.query('SELECT * FROM semesters ORDER BY id'),
      pool.query(`SELECT c.*, l.name as level_name, s.name as semester_name FROM courses c LEFT JOIN levels l ON c.level_id = l.id LEFT JOIN semesters s ON c.semester_id = s.id ORDER BY c.course_code`),
    ]);
    res.json({ success: true, data: { sessions: sessions.rows, levels: levels.rows, semesters: semesters.rows, courses: courses.rows } });
  } catch (error) {
    console.error('Academic data error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createAcademicSession = async (req: any, res: Response): Promise<void> => {
  try {
    const { session_name } = req.body;
    await pool.query('INSERT INTO academic_sessions (session_name) VALUES ($1)', [session_name]);
    res.json({ success: true, message: 'Session created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const { course_code, course_title, level_id, semester_id } = req.body;
    await pool.query('INSERT INTO courses (course_code, course_title, level_id, semester_id) VALUES ($1, $2, $3, $4)', [course_code, course_title, level_id, semester_id]);
    res.json({ success: true, message: 'Course created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getAnnouncements = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ success: true, announcements: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createAnnouncement = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, content, expires_at } = req.body;
    await pool.query('INSERT INTO announcements (title, content, is_published, published_at, expires_at) VALUES ($1, $2, true, NOW(), $3)', [title, content, expires_at || null]);
    res.json({ success: true, message: 'Announcement created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const deleteAnnouncement = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
