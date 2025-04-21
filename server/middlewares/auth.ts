/**
 * ตรวจสอบการเข้าถึง API โดยใช้ JWT หรือ Session
 */
import { Request, Response, NextFunction } from 'express';

/**
 * ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
 * ถ้ายังไม่ได้เข้าสู่ระบบจะส่งสถานะ 401 Unauthorized
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // แสดงข้อมูลการตรวจสอบสิทธิ์ (debug)
  console.log('Auth middleware check:');
  console.log('- isAuthenticated:', req.isAuthenticated());
  console.log('- user:', req.user ? `${req.user.id} ${req.user.username}` : 'undefined');
  console.log('- sessionID:', req.sessionID);
  console.log('- cookies:', req.headers.cookie);
  console.log('- auth header:', req.headers.authorization);

  if (req.isAuthenticated()) {
    // ผู้ใช้เข้าสู่ระบบผ่าน session
    console.log(`Authentication successful via session for: ${req.user.username}`);
    return next();
  }
  
  // ถ้าไม่มีสิทธิ์เข้าถึง
  return res.status(401).json({
    success: false,
    message: 'Unauthorized'
  });
}

/**
 * ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
 * ถ้าไม่ใช่ Admin จะส่งสถานะ 403 Forbidden
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Forbidden: Admin access required'
  });
}