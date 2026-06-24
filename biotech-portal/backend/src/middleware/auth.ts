import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface AuthRequest extends Request {
  user?: any;
}

interface JWTPayload {
  id: number;
  email: string;
  role: string;
  name: string;
}

export const authenticate = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  }
};

export const requireAdmin = (
  req: any,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    return;
  }
  next();
};

export const requireLecturer = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== 'lecturer') {
    res.status(403).json({ success: false, message: 'Access denied. Lecturer account required.' });
    return;
  }
  const [rows]: any = await pool.query(
    'SELECT status FROM lecturers WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length || rows[0].status !== 'approved') {
    res.status(403).json({ success: false, message: 'Your account is not approved or has been suspended.' });
    return;
  }
  next();
};

export const requireSuperAdmin = (
  req: any,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
    return;
  }
  next();
};
