import { Request, Response, NextFunction } from 'express';

/**
 * ตรวจสอบการ authenticate ของผู้ใช้
 * Middleware นี้ใช้ตรวจสอบว่าผู้ใช้ได้เข้าสู่ระบบแล้วหรือไม่
 */
export const auth = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth middleware check:');
  console.log('- isAuthenticated:', req.isAuthenticated());
  console.log('- user:', req.user?.id, req.user?.username);
  console.log('- sessionID:', req.sessionID);
  console.log('- cookies:', req.headers.cookie);
  console.log('- auth header:', req.headers.authorization);
  
  if (req.isAuthenticated()) {
    console.log(`Authentication successful via session for: ${req.user?.username}`);
    return next();
  }

  // ตรวจสอบ Bearer token (ถ้ามี)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // ตรวจสอบ token (ในระบบจริงควรใช้ JWT verify)
    if (token) {
      // เพิ่มรหัสสำหรับตรวจสอบ token เช่น JWT verification ตรงนี้
      console.log(`Authentication successful via token: ${token.substring(0, 10)}...`);
      return next();
    }
  }

  console.log('Authentication failed');
  return res.status(401).json({ 
    success: false, 
    message: 'กรุณาเข้าสู่ระบบก่อน' 
  });
};

export default auth;