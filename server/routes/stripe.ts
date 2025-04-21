/**
 * เส้นทาง API สำหรับการเชื่อมต่อกับ Stripe
 */
import { Router } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { generateUniqueId } from '../utils';
import { requireAuth } from '../middlewares/auth';

// ตรวจสอบว่ามีการตั้งค่า Stripe API Key หรือไม่
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('กรุณาตั้งค่า STRIPE_SECRET_KEY ในไฟล์ .env');
}

// สร้าง Stripe instance ด้วย Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const router = Router();

// สร้าง payment intent สำหรับการชำระเงินครั้งเดียว
router.post('/create-payment-intent', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 100 || amount > 50000) {
      return res.status(400).json({ 
        success: false, 
        message: 'จำนวนเงินไม่ถูกต้อง (ขั้นต่ำ 100 บาท สูงสุด 50,000 บาท)'
      });
    }

    // แปลงเป็นหน่วยสตางค์ (บาท x 100)
    const amountInSatang = Math.round(amount * 100);
    
    // สร้าง unique reference ID
    const referenceId = generateUniqueId();
    
    // สร้าง payment intent สำหรับการชำระเงินครั้งเดียว
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSatang,
      currency: 'thb',
      payment_method_types: ['card'],
      metadata: {
        userId: req.user.id.toString(),
        referenceId
      }
    });

    // สร้างรายการเติมเงินใหม่
    await storage.createTopUp({
      userId: req.user.id,
      amount,
      method: 'credit_card',
      status: 'pending',
      referenceId: referenceId,
      stripeSessionId: paymentIntent.id
    });

    // ส่ง client secret กลับไปยัง client
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      sessionId: paymentIntent.id
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้าง payment intent:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสร้าง payment intent' 
    });
  }
});

// ตรวจสอบสถานะการชำระเงิน
router.get('/check-payment/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // ดึงข้อมูล payment intent จาก Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(sessionId);
    
    // ตรวจสอบสถานะการชำระเงิน
    if (paymentIntent.status === 'succeeded') {
      // อัพเดตสถานะการเติมเงินในฐานข้อมูล
      const topUp = await storage.getTopUpByStripeSessionId(sessionId);
      
      if (topUp && topUp.status === 'pending') {
        // อัพเดตสถานะเป็นสำเร็จ
        await storage.updateTopUpStatus(topUp.id, 'completed');
        
        // เพิ่มเงินในบัญชีผู้ใช้
        const user = await storage.getUser(req.user.id);
        const newBalance = parseFloat(user.balance) + topUp.amount;
        await storage.updateUserBalance(req.user.id, newBalance);
        
        // ดึงข้อมูลผู้ใช้ที่อัพเดตแล้ว
        const updatedUser = await storage.getUser(req.user.id);
        
        return res.json({
          success: true,
          paid: true,
          message: 'ชำระเงินสำเร็จ',
          data: {
            user: updatedUser
          }
        });
      } else {
        return res.json({
          success: true,
          paid: true,
          message: 'ชำระเงินสำเร็จแล้ว (อัพเดตแล้ว)'
        });
      }
    } else {
      return res.json({
        success: true,
        paid: false,
        message: 'ยังไม่ได้ชำระเงิน',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน' 
    });
  }
});

// ยกเลิกการชำระเงิน
router.post('/cancel-payment/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // ดึงข้อมูล payment intent จาก Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(sessionId);
    
    // ตรวจสอบสถานะการชำระเงินว่ายังไม่สำเร็จหรือไม่
    if (paymentIntent.status !== 'succeeded') {
      // ยกเลิก payment intent
      await stripe.paymentIntents.cancel(sessionId);
      
      // อัพเดตสถานะการเติมเงินในฐานข้อมูล
      const topUp = await storage.getTopUpByStripeSessionId(sessionId);
      
      if (topUp && topUp.status === 'pending') {
        // อัพเดตสถานะเป็นยกเลิก
        await storage.updateTopUpStatus(topUp.id, 'failed');
      }
      
      return res.json({
        success: true,
        message: 'ยกเลิกการชำระเงินเรียบร้อยแล้ว'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกการชำระเงินที่สำเร็จแล้วได้'
      });
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน' 
    });
  }
});

export default router;