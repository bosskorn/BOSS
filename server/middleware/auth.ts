import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

// เพิ่มการประกาศ type เพื่อให้ TypeScript รู้จัก user property ใน Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware สำหรับการตรวจสอบว่าผู้ใช้ได้เข้าสู่ระบบหรือไม่
export const auth = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth middleware:', req.isAuthenticated(), req.user?.id, req.sessionID);
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "กรุณาเข้าสู่ระบบ",
    });
  }
  
  console.log('User authenticated:', req.user?.username);
  next();
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