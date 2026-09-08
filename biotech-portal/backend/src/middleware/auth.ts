import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const authenticate = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

export const requireAdmin = (req: any, res: Response, next: NextFunction): void => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    return;
  }
  next();
};

export const requireLecturer = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.role !== 'lecturer') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(403).json({ success: false, message: 'Access denied. Lecturer account required.' });
    return;
  }
  try {
    const result = await pool.query('SELECT status FROM lecturers WHERE id = $1', [req.user.id]);
    if (!result.rows.length || result.rows[0].status !== 'approved') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(403).json({ success: false, message: 'Your account is not approved or has been suspended.' });
      return;
    }
    next();
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const requireSuperAdmin = (req: any, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }
  next();
};
