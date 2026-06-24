// lecturer.ts
import { Router } from 'express';
import { authenticate, requireLecturer } from '../middleware/auth';
import pool from '../config/database';

const router = Router();
router.use(authenticate, requireLecturer);

router.get('/profile', async (req: any, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT l.*, COUNT(m.id) AS total_materials,
              COALESCE(SUM(m.download_count), 0) AS total_downloads
       FROM lecturers l
       LEFT JOIN materials m ON l.id = m.lecturer_id AND m.is_active = 1
       WHERE l.id = ? GROUP BY l.id`,
      [req.user.id]
    );
    const profile = rows[0];
    delete profile.password_hash;
    res.json({ success: true, data: profile });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
