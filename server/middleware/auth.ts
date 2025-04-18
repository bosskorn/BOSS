import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'ไม่มีโทเค็น การเข้าถึงถูกปฏิเสธ'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'โทเค็นไม่ถูกต้อง'
    });
  }
};

// Admin-only middleware
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false, 
      message: 'ไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ ต้องเป็นผู้ดูแลระบบเท่านั้น'
    });
  }
  
  next();
};
