import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

// Environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// เพิ่มการประกาศ type เพื่อให้ TypeScript รู้จัก user property ใน Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware สำหรับการตรวจสอบว่าผู้ใช้ได้เข้าสู่ระบบหรือไม่
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  // แสดงข้อมูลการตรวจสอบต่างๆ
  console.log('Auth middleware check:');
  console.log('- isAuthenticated:', req.isAuthenticated());
  console.log('- user:', req.user?.id, req.user?.username);
  console.log('- sessionID:', req.sessionID);
  console.log('- cookies:', req.headers.cookie);
  console.log('- auth header:', req.headers.authorization);
  
  // ตรวจสอบการเข้าสู่ระบบด้วย session ก่อน (Passport.js)
  if (req.isAuthenticated()) {
    console.log('Authentication successful via session for:', req.user?.username);
    return next();
  }
  
  // ถ้าไม่มีการเข้าสู่ระบบด้วย session ให้ตรวจสอบ JWT token
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // แยก "Bearer" ออกจาก token
    
    if (token) {
      try {
        // ตรวจสอบความถูกต้องของ token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        console.log('Token verification successful for user ID:', decoded.id);
        
        // ดึงข้อมูลผู้ใช้จาก ID ที่อยู่ใน token
        const user = await storage.getUser(decoded.id);
        
        if (user) {
          // กำหนดข้อมูลผู้ใช้ให้กับ request
          req.user = user;
          console.log('Authentication successful via token for:', user.username);
          return next();
        }
      } catch (error: any) {
        console.error('Token verification error:', error.message);
      }
    }
  }
  
  // ถ้าไม่มีการเข้าสู่ระบบทั้ง session และ token
  console.log('Authentication failed: Neither session nor token auth succeeded');
  return res.status(401).json({
    success: false,
    message: "ไม่ได้เข้าสู่ระบบ",
  });
};

// Middleware สำหรับการตรวจสอบว่าผู้ใช้มีสิทธิ์ในการเข้าถึงข้อมูลหรือไม่
// โดยจะตรวจสอบว่าข้อมูลที่ต้องการเข้าถึงเป็นของผู้ใช้นั้นหรือไม่
export const checkOwnership = (idParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "กรุณาเข้าสู่ระบบ",
      });
    }

    // ถ้าผู้ใช้เป็น admin ให้ผ่านไปได้เลย
    if (req.user?.role === 'admin') {
      return next();
    }

    // ในกรณีของการดึงข้อมูล userId ต้องตรงกับ user.id ของผู้ใช้ที่เข้าสู่ระบบ
    const resourceUserId = Number(req.query.userId || req.body.userId);
    if (resourceUserId && resourceUserId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
      });
    }

    // ในกรณีที่ต้องการเข้าถึงข้อมูลผู้ใช้โดยตรงผ่าน id
    if (idParam && req.params[idParam]) {
      const resourceId = Number(req.params[idParam]);
      
      // ถ้าเป็นข้อมูลผู้ใช้ (User) โดยตรง
      if (req.baseUrl.includes('/api/users') && resourceId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของผู้ใช้อื่น",
        });
      }
    }

    next();
  };
};

// Middleware สำหรับตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "กรุณาเข้าสู่ระบบ",
    });
  }
  
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ เฉพาะผู้ดูแลระบบเท่านั้น",
    });
  }
  
  next();
};