import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage';
import { db } from '../db';
import { insertTopupSchema, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import generatePayload from 'promptpay-qr';
import crypto from 'crypto';

const router = Router();

/**
 * สร้างรายการเติมเงินใหม่
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    // ตรวจสอบข้อมูลด้วย zod schema
    const validatedData = insertTopupSchema.parse({
      ...req.body,
      userId: req.user?.id,
    });

    // สร้างรหัสอ้างอิงทุกครั้ง
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 12);
    const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
    const prefix = validatedData.method === 'prompt_pay' ? 'PP' : 
                validatedData.method === 'credit_card' ? 'CC' : 'BT';
    const referenceId = `${prefix}${timestamp}${random}`;

    // สร้าง QR Code สำหรับ PromptPay แบบใช้งานได้จริง
    if (validatedData.method === 'prompt_pay' && !validatedData.qrCodeUrl) {
      try {
        // ใช้ promptpay-qr library เพื่อสร้าง payload สำหรับ QR Code
        // PromptPay ID เป็นเบอร์โทรศัพท์ เลขประจำตัวประชาชน หรือเลขทะเบียนนิติบุคคล
        const promptpayId = "0891234567"; // แทนที่ด้วย PromptPay ID จริงของร้าน
        const amount = parseFloat(validatedData.amount);
        
        // สร้าง payload สำหรับ QR Code PromptPay
        const payload = generatePayload(promptpayId, { amount });
        
        // URL encode payload เพื่อส่งไปยัง QR Code generator
        const encodedPayload = encodeURIComponent(payload);
        
        // ใช้บริการสร้าง QR Code แบบสาธารณะ พร้อมกับส่ง payload ที่ถูกต้อง
        validatedData.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedPayload}`;
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้าง PromptPay QR Code:', error);
        validatedData.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=error`;
      }
    }

    // สร้างรายการเติมเงินในฐานข้อมูล
    const topup = await storage.createTopUp({
      ...validatedData,
      referenceId: referenceId
    });

    res.status(201).json({
      success: true,
      data: topup
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างรายการเติมเงิน:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างรายการเติมเงิน'
    });
  }
});

/**
 * ดึงประวัติการเติมเงินของผู้ใช้
 */
router.get('/history', auth, async (req: Request, res: Response) => {
  try {
    const history = await storage.getTopupsByUserId(req.user!.id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงประวัติการเติมเงิน:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติการเติมเงิน'
    });
  }
});

/**
 * ตรวจสอบสถานะการเติมเงิน
 */
router.get('/check/:referenceId', auth, async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    
    // ดึงข้อมูลรายการเติมเงิน
    const topup = await storage.getTopupByReferenceId(referenceId);
    
    if (!topup) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการเติมเงินที่ระบุ'
      });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของรายการหรือไม่
    if (topup.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงรายการนี้'
      });
    }

    // จำลองการตรวจสอบสถานะการชำระเงิน (ในระบบจริงควรตรวจสอบกับ API ของผู้ให้บริการชำระเงิน)
    // ในตัวอย่างนี้จะอัพเดตสถานะเป็น completed ทันทีเพื่อการทดสอบ
    if (topup.status === 'pending') {
      // อัพเดตสถานะเป็น completed
      const updatedTopup = await storage.updateTopUp(topup.id, {
        status: 'completed'
      });
      
      // อัพเดตยอดเงินของผู้ใช้
      const user = await storage.getUser(req.user!.id);
      if (user) {
        // Convert balance to number for calculation, default to 0 if null
        const currentBalance = user.balance ? parseFloat(user.balance.toString()) : 0;
        const topupAmount = parseFloat(topup.amount.toString());
        const newBalance = currentBalance + topupAmount;
        
        // ใช้ db.update โดยตรงเพื่อแก้ปัญหา TypeScript
        await db.update(users)
          .set({ balance: newBalance.toString(), updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
      
      // ดึงข้อมูลผู้ใช้ที่อัพเดตแล้ว
      const updatedUser = await storage.getUser(req.user!.id);
      
      res.json({
        success: true,
        message: 'ชำระเงินสำเร็จ',
        data: {
          topup: updatedTopup,
          user: updatedUser
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          topup,
          user: await storage.getUser(req.user!.id)
        }
      });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการเติมเงิน:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการเติมเงิน'
    });
  }
});

/**
 * ยกเลิกรายการเติมเงิน - รับ referenceId
 */
router.put('/cancel/:referenceId', auth, async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    
    // ดึงข้อมูลรายการเติมเงินโดยใช้ referenceId
    const topup = await storage.getTopupByReferenceId(referenceId);
    
    if (!topup) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายการเติมเงินที่ระบุ'
      });
    }
    
    // ตรวจสอบว่าเป็นเจ้าของรายการหรือไม่
    if (topup.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงรายการนี้'
      });
    }
    
    // ตรวจสอบว่าสามารถยกเลิกได้หรือไม่ (ต้องมีสถานะเป็น pending)
    if (topup.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกรายการที่ดำเนินการไปแล้ว'
      });
    }
    
    // อัพเดตสถานะเป็น failed
    const updatedTopup = await storage.updateTopUp(topup.id, {
      status: 'failed',
      notes: 'ยกเลิกโดยผู้ใช้'
    });
    
    res.json({
      success: true,
      message: 'ยกเลิกรายการเติมเงินสำเร็จ',
      data: updatedTopup
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกรายการเติมเงิน:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกรายการเติมเงิน'
    });
  }
});

export default router;