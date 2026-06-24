import { Request, Response } from 'express';
import pool from '../config/database';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// UPLOAD MATERIAL (Lecturer)
// ============================================================
export const uploadMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'PDF file is required.' });
      return;
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
      return;
    }

    // Validate file size (50MB)
    const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB || '50')) * 1024 * 1024;
    if (req.file.size > maxSize) {
      res.status(400).json({ success: false, message: `File size must not exceed ${process.env.MAX_FILE_SIZE_MB || 50}MB.` });
      return;
    }

    const { title, course_code, level, semester, academic_session, description } = req.body;

    if (!title || !course_code || !level || !semester || !academic_session) {
      res.status(400).json({ success: false, message: 'Title, course code, level, semester, and session are required.' });
      return;
    }

    // Upload to Cloudinary
    const { url, public_id } = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'biotech-portal/materials',
      'raw'
    );

    // Get IDs for level, semester, session
    const [levelRows]: any = await pool.query('SELECT id FROM levels WHERE name = ?', [level]);
    const [semesterRows]: any = await pool.query('SELECT id FROM semesters WHERE name = ?', [semester]);
    const [sessionRows]: any = await pool.query('SELECT id FROM academic_sessions WHERE session_name = ?', [academic_session]);
    const [courseRows]: any = await pool.query('SELECT id FROM courses WHERE course_code = ?', [course_code.toUpperCase()]);

    const [result]: any = await pool.query(
      `INSERT INTO materials
       (lecturer_id, title, description, course_code, course_id, level_id, semester_id, session_id,
        file_url, file_public_id, file_size, file_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        title.trim(),
        description?.trim() || null,
        course_code.toUpperCase().trim(),
        courseRows.length ? courseRows[0].id : null,
        levelRows.length ? levelRows[0].id : null,
        semesterRows.length ? semesterRows[0].id : null,
        sessionRows.length ? sessionRows[0].id : null,
        url,
        public_id,
        req.file.size,
        req.file.originalname,
      ]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (actor_type, actor_id, actor_name, action, description)
       VALUES ('lecturer', ?, ?, 'material_upload', ?)`,
      [req.user!.id, req.user!.name, `Uploaded material: ${title} (${course_code})`]
    );

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully.',
      data: { id: result.insertId, title, course_code, file_url: url },
    });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload material.' });
  }
};

// ============================================================
// GET PUBLIC MATERIALS (Student access)
// ============================================================
export const getPublicMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level, semester, session, course_code, lecturer_id, search, page = '1', limit = '20' } = req.query;

    let query = `
      SELECT m.id, m.title, m.description, m.course_code, m.file_url, m.file_size, m.file_name,
             m.download_count, m.created_at,
             l.full_name AS lecturer_name, l.staff_id,
             lv.name AS level_name,
             s.name AS semester_name,
             ac.session_name
      FROM materials m
      JOIN lecturers l ON m.lecturer_id = l.id AND l.status = 'approved'
      LEFT JOIN levels lv ON m.level_id = lv.id
      LEFT JOIN semesters s ON m.semester_id = s.id
      LEFT JOIN academic_sessions ac ON m.session_id = ac.id
      WHERE m.is_active = 1
    `;
    const params: any[] = [];

    if (level) { query += ' AND lv.name = ?'; params.push(level); }
    if (semester) { query += ' AND s.name = ?'; params.push(semester); }
    if (session) { query += ' AND ac.session_name = ?'; params.push(session); }
    if (course_code) { query += ' AND m.course_code = ?'; params.push(String(course_code).toUpperCase()); }
    if (lecturer_id) { query += ' AND m.lecturer_id = ?'; params.push(lecturer_id); }
    if (search) {
      query += ' AND (m.title LIKE ? OR m.description LIKE ? OR m.course_code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
    const offset = (pageNum - 1) * limitNum;

    // Count total
    const countQuery = query.replace(
      /SELECT.*?FROM materials/s,
      'SELECT COUNT(*) AS total FROM materials'
    );
    const [countRows]: any = await pool.query(countQuery, params);
    const total = countRows[0].total;

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows]: any = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get public materials error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// TRACK DOWNLOAD
// ============================================================
export const trackDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows]: any = await pool.query(
      'SELECT id, file_url, file_name FROM materials WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    // Increment download count
    await pool.query('UPDATE materials SET download_count = download_count + 1 WHERE id = ?', [id]);

    // Log download
    await pool.query(
      'INSERT INTO material_downloads (material_id, ip_address, user_agent) VALUES (?, ?, ?)',
      [id, req.ip, req.headers['user-agent'] || null]
    );

    res.json({ success: true, data: { file_url: rows[0].file_url, file_name: rows[0].file_name } });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET LECTURER MATERIALS
// ============================================================
export const getLecturerMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, course_code, page = '1', limit = '20' } = req.query;
    const lecturerId = req.user!.id;

    let query = `
      SELECT m.*, lv.name AS level_name, s.name AS semester_name, ac.session_name
      FROM materials m
      LEFT JOIN levels lv ON m.level_id = lv.id
      LEFT JOIN semesters s ON m.semester_id = s.id
      LEFT JOIN academic_sessions ac ON m.session_id = ac.id
      WHERE m.lecturer_id = ?
    `;
    const params: any[] = [lecturerId];

    if (search) {
      query += ' AND (m.title LIKE ? OR m.course_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (course_code) { query += ' AND m.course_code = ?'; params.push(course_code); }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(50, 20);
    const offset = (pageNum - 1) * limitNum;

    const [countRows]: any = await pool.query(
      query.replace('SELECT m.*, lv.name AS level_name, s.name AS semester_name, ac.session_name', 'SELECT COUNT(*) AS total'),
      params
    );

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows]: any = await pool.query(query, params);
    const total = countRows[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get lecturer materials error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// UPDATE MATERIAL
// ============================================================
export const updateMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, course_code, level, semester, academic_session } = req.body;

    const [rows]: any = await pool.query(
      'SELECT * FROM materials WHERE id = ? AND lecturer_id = ?',
      [id, req.user!.id]
    );

    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Material not found or access denied.' });
      return;
    }

    const material = rows[0];
    let fileUrl = material.file_url;
    let filePublicId = material.file_public_id;
    let fileName = material.file_name;
    let fileSize = material.file_size;

    // If new file uploaded, replace old one
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
        return;
      }

      if (filePublicId) {
        try { await deleteFromCloudinary(filePublicId, 'raw'); } catch (e) { /* non-fatal */ }
      }

      const uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'biotech-portal/materials', 'raw');
      fileUrl = uploaded.url;
      filePublicId = uploaded.public_id;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    const [levelRows]: any = level ? await pool.query('SELECT id FROM levels WHERE name = ?', [level]) : [[]];
    const [semesterRows]: any = semester ? await pool.query('SELECT id FROM semesters WHERE name = ?', [semester]) : [[]];
    const [sessionRows]: any = academic_session ? await pool.query('SELECT id FROM academic_sessions WHERE session_name = ?', [academic_session]) : [[]];

    await pool.query(
      `UPDATE materials SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         course_code = COALESCE(?, course_code),
         level_id = COALESCE(?, level_id),
         semester_id = COALESCE(?, semester_id),
         session_id = COALESCE(?, session_id),
         file_url = ?, file_public_id = ?, file_name = ?, file_size = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        title?.trim() || null,
        description?.trim() || null,
        course_code?.toUpperCase().trim() || null,
        levelRows.length ? levelRows[0].id : null,
        semesterRows.length ? semesterRows[0].id : null,
        sessionRows.length ? sessionRows[0].id : null,
        fileUrl, filePublicId, fileName, fileSize,
        id,
      ]
    );

    res.json({ success: true, message: 'Material updated successfully.' });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// DELETE MATERIAL
// ============================================================
export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    let query = 'SELECT * FROM materials WHERE id = ?';
    const params: any[] = [id];

    // Lecturers can only delete their own
    if (user.role === 'lecturer') {
      query += ' AND lecturer_id = ?';
      params.push(user.id);
    }

    const [rows]: any = await pool.query(query, params);
    if (!rows.length) {
      res.status(404).json({ success: false, message: 'Material not found or access denied.' });
      return;
    }

    const material = rows[0];
    if (material.file_public_id) {
      try { await deleteFromCloudinary(material.file_public_id, 'raw'); } catch (e) { /* non-fatal */ }
    }

    await pool.query('DELETE FROM materials WHERE id = ?', [id]);

    res.json({ success: true, message: 'Material deleted successfully.' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
