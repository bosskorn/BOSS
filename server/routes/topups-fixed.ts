import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage';
import { db } from '../db';
import { insertTopupSchema, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import generatePayload from 'promptpay-qr';
import crypto from 'crypto';
import QRCode from 'qrcode';

const router = Router();

/**
 * สร้างรายการเติมเงินใหม่
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    // สร้างรหัสอ้างอิง
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 12);
    const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
    const prefix = req.body.method === 'prompt_pay' ? 'PP' : 
                req.body.method === 'credit_card' ? 'CC' : 'BT';
    const referenceId = `${prefix}${timestamp}${random}`;
    
    // ตรวจสอบข้อมูลด้วย zod schema
    const validatedData = insertTopupSchema.parse({
      ...req.body,
      userId: req.user?.id,
      referenceId: referenceId,
    });

    // สร้าง QR Code สำหรับ PromptPay แบบใช้งานได้จริง
    if (validatedData.method === 'prompt_pay' && !validatedData.qrCodeUrl) {
      try {
        // ใช้ promptpay-qr library เพื่อสร้าง payload สำหรับ QR Code
        // PromptPay ID เป็นเบอร์โทรศัพท์ เลขประจำตัวประชาชน หรือเลขทะเบียนนิติบุคคล
        const promptpayId = "0891234567"; // แทนที่ด้วย PromptPay ID จริงของร้าน
        const amount = parseFloat(validatedData.amount);
        
        // สร้าง payload สำหรับ QR Code PromptPay
        const payload = generatePayload(promptpayId, { amount });
        
        // สร้าง QR Code โดยตรงด้วย qrcode library และแปลงเป็น data URL
        const qrDataURL = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'H',
          type: 'image/jpeg',
          quality: 0.92,
          margin: 1,
          width: 250,
        });
        
        // อัพเดตข้อมูลการเติมเงินด้วย QR Code URL
        validatedData.qrCodeUrl = qrDataURL;
      } catch (qrError) {
        console.error('เกิดข้อผิดพลาดในการสร้าง QR Code:', qrError);
      }
    }
    
    // สร้างรายการเติมเงินในฐานข้อมูล
    const topup = await storage.createTopUp(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'สร้างรายการเติมเงินสำเร็จ',
      data: topup
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างรายการเติมเงิน:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายการเติมเงิน'
    });
  }
});

/**
 * ดึงประวัติการเติมเงินของผู้ใช้
 */
router.get('/history', auth, async (req: Request, res: Response) => {
  try {
    // ดึงประวัติการเติมเงินของผู้ใช้
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

    // ตรวจสอบสถานะการชำระเงินกับ Stripe API
    if (topup.status === 'pending') {
      // ตรวจสอบว่ามี stripeSessionId หรือไม่
      if (topup.stripeSessionId) {
        try {
          // นำเข้า Stripe
          const Stripe = require('stripe');
          // สร้าง Stripe instance
          if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
          }
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16' as any,
          });
          
          // ตรวจสอบสถานะการชำระเงินจริงกับ Stripe API
          let paymentStatus = 'unknown';
          
          // ลองตรวจสอบเป็น Payment Intent (สำหรับ PromptPay)
          const paymentIntent = await stripe.paymentIntents.retrieve(topup.stripeSessionId);
          
          console.log("Payment Intent Status:", paymentIntent.status);
          paymentStatus = paymentIntent.status;
          
          // ตรวจสอบสถานะการชำระเงิน - Stripe status: succeeded, requires_payment_method, requires_confirmation, etc.
          if (paymentIntent.status === 'succeeded') {
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
            
            return res.json({
              success: true,
              message: 'ชำระเงินสำเร็จ',
              data: {
                topup: updatedTopup,
                user: updatedUser
              }
            });
          } else {
            // ยังไม่มีการชำระเงิน
            return res.json({
              success: true,
              message: 'กำลังรอการชำระเงิน',
              data: {
                topup,
                paymentStatus: paymentStatus
              }
            });
          }
        } catch (error: any) {
          console.error('Error checking Stripe payment status:', error);
          return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน',
            error: error.message
          });
        }
      } else {
        // ไม่พบข้อมูล Stripe Session
        return res.json({
          success: true,
          message: 'กำลังรอการชำระเงิน (ไม่พบข้อมูลการชำระเงิน)',
          data: {
            topup
          }
        });
      }
    } else if (topup.status === 'completed') {
      // กรณีชำระเงินสำเร็จแล้ว
      const user = await storage.getUser(req.user!.id);
      
      return res.json({
        success: true,
        message: 'ชำระเงินสำเร็จ',
        data: {
          topup,
          user
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          topup,
          user: await storage.getUser(req.user!.id)
        }
      });
    }
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการเติมเงิน:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการเติมเงิน',
      error: error.message
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
    
    return res.json({
      success: true,
      message: 'ยกเลิกรายการเติมเงินสำเร็จ',
      data: updatedTopup
    });
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกรายการเติมเงิน:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกรายการเติมเงิน',
      error: error.message
    });
  }
});

export default router;