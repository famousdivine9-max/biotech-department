import { Request, Response } from 'express';
import pool from '../config/database';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { resource_type: 'raw', folder: 'biotech-materials', public_id: filename },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result!.secure_url, public_id: result!.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(public_id: string): Promise<void> {
  await cloudinary.v2.uploader.destroy(public_id, { resource_type: 'raw' });
}

export const uploadMaterial = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, course_code, level, semester, academic_session, description } = req.body;
    const file = req.file;
    if (!title || !course_code || !level || !semester || !academic_session) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }
    if (!file) {
      res.status(400).json({ success: false, message: 'PDF file is required.' });
      return;
    }
    const lecturer_id = req.user.id;
    const levelResult = await pool.query('SELECT id FROM levels WHERE name = $1', [level]);
    const semesterResult = await pool.query('SELECT id FROM semesters WHERE name = $1', [semester]);
    const sessionResult = await pool.query('SELECT id FROM academic_sessions WHERE session_name = $1', [academic_session]);
    const courseResult = await pool.query('SELECT id FROM courses WHERE course_code = $1', [course_code]);
    const level_id = levelResult.rows[0]?.id || null;
    const semester_id = semesterResult.rows[0]?.id || null;
    const session_id = sessionResult.rows[0]?.id || null;
    const course_id = courseResult.rows[0]?.id || null;
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
    await pool.query(
      `INSERT INTO materials (lecturer_id, title, description, course_code, course_id, level_id, semester_id, session_id, file_url, file_public_id, file_size, file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [lecturer_id, title, description || '', course_code, course_id, level_id, semester_id, session_id, uploadResult.url, uploadResult.public_id, file.size, file.originalname]
    );
    res.json({ success: true, message: 'Material uploaded successfully.' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload.' });
  }
};

export const getPublicMaterials = async (req: any, res: Response): Promise<void> => {
  try {
    const { search = '', level = '', semester = '', page = '1', limit = '20' } = req.query;
    let query = `SELECT m.*, l.full_name as lecturer_name, lv.name as level_name, s.name as semester_name, ac.session_name FROM materials m LEFT JOIN lecturers l ON m.lecturer_id = l.id LEFT JOIN levels lv ON m.level_id = lv.id LEFT JOIN semesters s ON m.semester_id = s.id LEFT JOIN academic_sessions ac ON m.session_id = ac.id WHERE m.is_active = true`;
    const params: any[] = [];
    let idx = 1;
    if (search) { query += ` AND (m.title ILIKE $${idx} OR m.course_code ILIKE $${idx+1})`; params.push(`%${search}%`, `%${search}%`); idx += 2; }
    if (level) { query += ` AND lv.name ILIKE $${idx}`; params.push(`%${level}%`); idx++; }
    if (semester) { query += ` AND s.name ILIKE $${idx}`; params.push(`%${semester}%`); idx++; }
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const offset = (pageNum - 1) * limitNum;
    query += ` ORDER BY m.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(limitNum, offset);
    const result = await pool.query(query, params);
    res.json({ success: true, materials: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getLecturerMaterials = async (req: any, res: Response): Promise<void> => {
  try {
    const lecturer_id = req.user.id;
    const result = await pool.query(
      `SELECT m.*, lv.name as level_name, s.name as semester_name, ac.session_name FROM materials m LEFT JOIN levels lv ON m.level_id = lv.id LEFT JOIN semesters s ON m.semester_id = s.id LEFT JOIN academic_sessions ac ON m.session_id = ac.id WHERE m.lecturer_id = $1 ORDER BY m.created_at DESC`,
      [lecturer_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get lecturer materials error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const trackDownload = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE materials SET download_count = download_count + 1 WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateMaterial = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, course_code, level, semester, academic_session, description } = req.body;
    const file = req.file;
    const lecturer_id = req.user.id;
    const existing = await pool.query('SELECT * FROM materials WHERE id = $1 AND lecturer_id = $2', [id, lecturer_id]);
    if (existing.rows.length === 0) { res.status(404).json({ success: false, message: 'Material not found.' }); return; }
    let file_url = existing.rows[0].file_url;
    let file_public_id = existing.rows[0].file_public_id;
    if (file) {
      if (file_public_id) await deleteFromCloudinary(file_public_id);
      const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);
      file_url = uploadResult.url;
      file_public_id = uploadResult.public_id;
    }
    const levelResult = await pool.query('SELECT id FROM levels WHERE name = $1', [level]);
    const semesterResult = await pool.query('SELECT id FROM semesters WHERE name = $1', [semester]);
    const sessionResult = await pool.query('SELECT id FROM academic_sessions WHERE session_name = $1', [academic_session]);
    await pool.query(
      `UPDATE materials SET title=$1, course_code=$2, level_id=$3, semester_id=$4, session_id=$5, description=$6, file_url=$7, file_public_id=$8, updated_at=NOW() WHERE id=$9`,
      [title, course_code, levelResult.rows[0]?.id, semesterResult.rows[0]?.id, sessionResult.rows[0]?.id, description, file_url, file_public_id, id]
    );
    res.json({ success: true, message: 'Material updated.' });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const deleteMaterial = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lecturer_id = req.user.id;
    const existing = await pool.query('SELECT file_public_id FROM materials WHERE id = $1 AND lecturer_id = $2', [id, lecturer_id]);
    if (existing.rows.length === 0) { res.status(404).json({ success: false, message: 'Material not found.' }); return; }
    if (existing.rows[0].file_public_id) await deleteFromCloudinary(existing.rows[0].file_public_id);
    await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json({ success: true, message: 'Material deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const adminDeleteMaterial = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT file_public_id FROM materials WHERE id = $1', [id]);
    if (existing.rows.length === 0) { res.status(404).json({ success: false, message: 'Material not found.' }); return; }
    if (existing.rows[0].file_public_id) await deleteFromCloudinary(existing.rows[0].file_public_id);
    await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json({ success: true, message: 'Material deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
