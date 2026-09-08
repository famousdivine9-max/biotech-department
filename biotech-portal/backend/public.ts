import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [payments, materials, lecturers] = await Promise.all([
      pool.query("SELECT COUNT(*) as total FROM payments WHERE payment_status = 'successful'"),
      pool.query("SELECT COUNT(*) as total FROM materials WHERE is_active = true"),
      pool.query("SELECT COUNT(*) as total FROM lecturers WHERE status = 'approved'"),
    ]);
    res.json({ success: true, data: { total_payments: parseInt(payments.rows[0].total), total_materials: parseInt(materials.rows[0].total), total_lecturers: parseInt(lecturers.rows[0].total) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/settings', async (req: Request, res: Response) => {
  try {
    const safeKeys = ['site_name', 'department_name', 'faculty_name', 'university_name', 'contact_email', 'contact_phone', 'department_logo', 'faculty_logo', 'homepage_banner', 'paystack_public_key', 'departmental_dues', 'processing_fee'];
    const result = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key = ANY($1)', [safeKeys]);
    const settings: any = {};
    result.rows.forEach((row: any) => { settings[row.setting_key] = row.setting_value; });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/academic', async (req: Request, res: Response) => {
  try {
    const [sessions, levels, semesters, courses] = await Promise.all([
      pool.query('SELECT * FROM academic_sessions WHERE is_active = true ORDER BY created_at DESC'),
      pool.query('SELECT * FROM levels WHERE is_active = true ORDER BY sort_order'),
      pool.query('SELECT * FROM semesters WHERE is_active = true ORDER BY id'),
      pool.query(`SELECT c.*, l.name as level_name, s.name as semester_name FROM courses c LEFT JOIN levels l ON c.level_id = l.id LEFT JOIN semesters s ON c.semester_id = s.id WHERE c.is_active = true ORDER BY c.course_code`),
    ]);
    res.json({ success: true, data: { sessions: sessions.rows, levels: levels.rows, semesters: semesters.rows, courses: courses.rows } });
  } catch (error) {
    console.error('Academic error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/announcements', async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM announcements WHERE is_published = true AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 10");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/latest-materials', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT m.*, l.full_name as lecturer_name, lv.name as level_name, s.name as semester_name FROM materials m LEFT JOIN lecturers l ON m.lecturer_id = l.id LEFT JOIN levels lv ON m.level_id = lv.id LEFT JOIN semesters s ON m.semester_id = s.id WHERE m.is_active = true ORDER BY m.created_at DESC LIMIT 6`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
