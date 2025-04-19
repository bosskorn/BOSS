import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage';
import { insertTopupSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

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

    // สร้างรหัสอ้างอิงถ้าไม่มีการส่งมา
    if (!validatedData.referenceId) {
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 12);
      const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
      const prefix = validatedData.method === 'prompt_pay' ? 'PP' : 
                   validatedData.method === 'credit_card' ? 'CC' : 'BT';
      validatedData.referenceId = `${prefix}${timestamp}${random}`;
    }

    // สร้าง QR Code URL สำหรับ PromptPay (จำลอง)
    if (validatedData.method === 'prompt_pay' && !validatedData.qrCodeUrl) {
      // ในการใช้งานจริงควรใช้ API สร้าง QR Code จริง
      validatedData.qrCodeUrl = `https://promptpay.io/0891234567/${validatedData.amount}`;
    }

    // สร้างรายการเติมเงินในฐานข้อมูล
    const topup = await storage.createTopup(validatedData);

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
      const updatedTopup = await storage.updateTopup(topup.id, {
        status: 'completed'
      });
      
      // อัพเดตยอดเงินของผู้ใช้
      const user = await storage.getUser(req.user!.id);
      if (user && user.balance !== null) {
        const currentBalance = parseFloat(user.balance.toString() || '0');
        const topupAmount = parseFloat(topup.amount.toString() || '0');
        const newBalance = currentBalance + topupAmount;
        
        await storage.updateUser(user.id, {
          balance: newBalance.toString()
        });
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
 * ยกเลิกรายการเติมเงิน
 */
router.put('/cancel/:id', auth, async (req: Request, res: Response) => {
  try {
    const topupId = parseInt(req.params.id);
    
    // ดึงข้อมูลรายการเติมเงิน
    const topup = await storage.getTopup(topupId);
    
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
    const updatedTopup = await storage.updateTopup(topup.id, {
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