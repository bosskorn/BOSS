import { Router, Request, Response } from 'express';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { storage } from '../storage';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const router = Router();
const scryptAsync = promisify(scrypt);

// Validation schema สำหรับการลงทะเบียนผู้ดูแลระบบ
const adminRegisterSchema = insertUserSchema.extend({
  email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
  phone: z.string().min(9, { message: 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัว' }),
  adminKey: z.string().min(6, { message: 'รหัสสำหรับผู้ดูแลระบบไม่ถูกต้อง' }),
});

// รหัสผู้ดูแลระบบสำหรับการลงทะเบียน
const ADMIN_KEYS = {
  'PURPLEDASH2025': 'admin',  // รหัสสำหรับผู้ดูแลระบบระดับสูงสุด
};

// ฟังก์ชันแฮชรหัสผ่าน
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// API ลงทะเบียนผู้ดูแลระบบ
router.post('/register/admin', async (req: Request, res: Response) => {
  try {
    // ตรวจสอบความถูกต้องของข้อมูล
    const validation = adminRegisterSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: validation.error.format(),
      });
    }
    
    const { adminKey, ...userData } = validation.data;
    
    // ตรวจสอบรหัสผู้ดูแลระบบ
    if (!ADMIN_KEYS[adminKey as keyof typeof ADMIN_KEYS]) {
      return res.status(403).json({
        success: false,
        message: 'รหัสผู้ดูแลระบบไม่ถูกต้องหรือหมดอายุ',
      });
    }
    
    // ตรวจสอบว่ามีชื่อผู้ใช้นี้อยู่ในระบบแล้วหรือไม่
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว',
      });
    }
    
    // ตรวจสอบว่ามีอีเมลนี้อยู่ในระบบแล้วหรือไม่
    if (userData.email) {
      const users = await storage.getUserByEmail(userData.email);
      if (users) {
        return res.status(409).json({
          success: false,
          message: 'อีเมลนี้มีอยู่ในระบบแล้ว',
        });
      }
    }
    
    // แฮชรหัสผ่านก่อนบันทึกลงฐานข้อมูล
    const hashedPassword = await hashPassword(userData.password);
    
    // บันทึกข้อมูลลงในฐานข้อมูล
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: 'admin', // ตั้งค่าบทบาทเป็นผู้ดูแลระบบ
    });
    
    // ลบรหัสผ่านออกจากข้อมูลที่ส่งกลับ
    const { password, ...userWithoutPassword } = newUser;
    
    // ล็อกอินผู้ใช้โดยอัตโนมัติ
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ โปรดลองเข้าสู่ระบบด้วยตนเอง',
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'ลงทะเบียนผู้ดูแลระบบสำเร็จ',
        user: userWithoutPassword,
      });
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่ภายหลัง',
    });
  }
});

export default router;