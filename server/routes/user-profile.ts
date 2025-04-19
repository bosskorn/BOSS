import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';

const router = Router();
const scryptAsync = promisify(scrypt);

// Schema สำหรับการอัพเดตโปรไฟล์
const profileUpdateSchema = z.object({
  fullname: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// Schema สำหรับการเปลี่ยนรหัสผ่าน
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

// ฟังก์ชันสำหรับการแฮชรหัสผ่าน
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// ฟังก์ชันสำหรับการเปรียบเทียบรหัสผ่าน
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// API สำหรับดึงข้อมูลผู้ใช้ปัจจุบัน (ใช้ร่วมกับ /api/user ที่มีอยู่แล้ว)

// API สำหรับอัพเดตโปรไฟล์ผู้ใช้
router.put('/profile', auth, async (req: Request, res: Response) => {
  try {
    // ตรวจสอบข้อมูลที่ส่งเข้ามา
    const validatedData = profileUpdateSchema.parse(req.body);
    
    // ดึง userId จาก session
    const userId = req.user!.id;
    
    // อัพเดตข้อมูลผู้ใช้
    const updatedUser = await storage.updateUser(userId, {
      fullname: validatedData.fullname,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      // ยังไม่มีฟิลด์ address ในฐานข้อมูล จะต้องเพิ่มเติมภายหลัง
    });
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }
    
    // อัพเดตข้อมูลผู้ใช้ใน session
    req.user = updatedUser;
    
    // ส่งข้อมูลผู้ใช้ที่อัพเดตแล้วกลับไป
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลไม่ถูกต้อง', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลผู้ใช้' });
  }
});

// API สำหรับเปลี่ยนรหัสผ่าน
router.put('/password', auth, async (req: Request, res: Response) => {
  try {
    // ตรวจสอบข้อมูลที่ส่งเข้ามา
    const validatedData = passwordUpdateSchema.parse(req.body);
    
    // ดึง userId จาก session
    const userId = req.user!.id;
    
    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }
    
    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isPasswordValid = await comparePasswords(validatedData.currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }
    
    // แฮชรหัสผ่านใหม่
    const hashedPassword = await hashPassword(validatedData.newPassword);
    
    // อัพเดตรหัสผ่านในฐานข้อมูล
    const updatedUser = await storage.updateUser(userId, {
      password: hashedPassword
    });
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }
    
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Error changing password:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลไม่ถูกต้อง', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

export default router;