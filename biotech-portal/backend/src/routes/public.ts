import { Router } from 'express';
import pool from '../config/database';

const router = Router();

// Public stats for homepage
router.get('/stats', async (_req, res) => {
  try {
    const [materials]: any = await pool.query('SELECT COUNT(*) AS total FROM materials WHERE is_active = 1');
    const [payments]: any = await pool.query("SELECT COUNT(*) AS total FROM payments WHERE payment_status = 'successful'");
    const [downloads]: any = await pool.query('SELECT COALESCE(SUM(download_count), 0) AS total FROM materials');
    const [lecturers]: any = await pool.query("SELECT COUNT(*) AS total FROM lecturers WHERE status = 'approved'");

    res.json({
      success: true,
      data: {
        total_materials: materials[0].total,
        total_payments: payments[0].total,
        total_downloads: downloads[0].total,
        total_lecturers: lecturers[0].total,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Announcements for homepage
router.get('/announcements', async (_req, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, title, content, published_at FROM announcements WHERE is_published = 1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY published_at DESC LIMIT 5'
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Latest materials for homepage
router.get('/latest-materials', async (_req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT m.id, m.title, m.course_code, m.download_count, m.created_at,
             l.full_name AS lecturer_name, lv.name AS level_name, s.name AS semester_name
      FROM materials m
      JOIN lecturers l ON m.lecturer_id = l.id AND l.status = 'approved'
      LEFT JOIN levels lv ON m.level_id = lv.id
      LEFT JOIN semesters s ON m.semester_id = s.id
      WHERE m.is_active = 1
      ORDER BY m.created_at DESC LIMIT 6
    `);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Site settings (public-safe keys only)
router.get('/settings', async (_req, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT setting_key, setting_value FROM settings
       WHERE setting_key IN ('site_name','department_name','faculty_name','university_name',
         'contact_email','contact_phone','office_address','department_logo','faculty_logo',
         'homepage_banner','favicon','departmental_dues','processing_fee','paystack_public_key')`
    );
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, data: settings });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Academic data for filters
router.get('/academic', async (_req, res) => {
  try {
    const [sessions]: any = await pool.query('SELECT * FROM academic_sessions WHERE is_active = 1 ORDER BY session_name DESC');
    const [levels]: any = await pool.query('SELECT * FROM levels WHERE is_active = 1 ORDER BY sort_order ASC');
    const [semesters]: any = await pool.query('SELECT * FROM semesters WHERE is_active = 1 ORDER BY id ASC');
    const [courses]: any = await pool.query('SELECT course_code, course_title FROM courses WHERE is_active = 1 ORDER BY course_code ASC');
    const [lecturers]: any = await pool.query("SELECT id, full_name, staff_id FROM lecturers WHERE status = 'approved' ORDER BY full_name ASC");
    res.json({ success: true, data: { sessions, levels, semesters, courses, lecturers } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
