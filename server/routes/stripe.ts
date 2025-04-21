import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { storage } from '../storage';
import { auth } from '../middleware/auth';
import { fromZodError } from 'zod-validation-error';

// สร้าง Stripe instance
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

// สร้าง Router
const router = Router();

// Schema สำหรับตรวจสอบข้อมูลที่ส่งมา
const createCheckoutSessionSchema = z.object({
  amount: z.number().min(1).max(50000),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * สร้าง Checkout Session สำหรับการชำระเงินด้วยบัตรเครดิต/เดบิต
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีการส่งข้อมูลที่ถูกต้องมาหรือไม่
    const validation = createCheckoutSessionSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = fromZodError(validation.error).message;
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    const { amount, successUrl, cancelUrl } = validation.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }

    // สร้างรายการเติมเงินในฐานข้อมูล
    const referenceId = `TOP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const topup = await storage.createTopUp({
      userId,
      amount: amount.toString(),
      method: 'credit_card',
      status: 'pending',
      referenceId,
    });

    // กำหนด URL สำหรับ success และ cancel
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const success_url = successUrl || `${baseUrl}/topup-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = cancelUrl || `${baseUrl}/topup-cancel?session_id={CHECKOUT_SESSION_ID}`;

    // สร้าง Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'เติมเงินเข้าบัญชี BLUEDASH',
              description: `รหัสอ้างอิง: ${referenceId}`,
              images: ['https://i.imgur.com/EHyR2nP.png'], // ใส่ URL ของโลโก้ (ถ้ามี)
            },
            unit_amount: Math.round(amount * 100), // แปลงเป็นสตางค์
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      client_reference_id: referenceId,
      metadata: {
        userId: userId.toString(),
        topupId: topup.id.toString(),
        referenceId,
      },
    });

    // อัพเดตรายการเติมเงินด้วย sessionId
    await storage.updateTopUpStripeSession(topup.id, session.id);

    // ส่งข้อมูลกลับไปยังผู้ใช้
    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง Checkout Session',
      error: error.message
    });
  }
});

/**
 * ตรวจสอบสถานะของ Checkout Session
 * GET /api/stripe/check-session/:sessionId
 */
router.get('/check-session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบ sessionId'
      });
    }

    // ดึงข้อมูล Session จาก Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // ดึงข้อมูลการเติมเงินจากฐานข้อมูล
    const topup = await storage.getTopupByStripeSessionId(sessionId);
    
    if (!topup) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการเติมเงิน'
      });
    }

    // ตรวจสอบว่าเป็นข้อมูลของผู้ใช้คนเดียวกันหรือไม่
    if (topup.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
      });
    }

    // ตรวจสอบสถานะการชำระเงิน
    if (session.payment_status === 'paid' && topup.status !== 'completed') {
      // อัพเดตสถานะการเติมเงินเป็น completed
      await storage.updateTopUpStatus(topup.id, 'completed');
      
      // อัพเดตยอดเงินในบัญชีผู้ใช้
      const amount = parseFloat(topup.amount);
      const user = await storage.addUserBalance(userId, amount);
      
      // ส่งข้อมูลกลับไปยังผู้ใช้
      return res.status(200).json({
        success: true,
        message: 'ชำระเงินสำเร็จ',
        session,
        topup: {
          ...topup,
          user
        }
      });
    }
    
    // กรณียังไม่มีการชำระเงิน
    return res.status(200).json({
      success: true,
      session,
      topup
    });
  } catch (error: any) {
    console.error('Error checking Stripe session:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน',
      error: error.message
    });
  }
});

/**
 * รับการแจ้งเตือนจาก Stripe Webhook
 * POST /api/stripe/webhook
 * หมายเหตุ: ในการใช้งานจริงควรตั้งค่า webhook secret และตรวจสอบ signature
 */
router.post('/webhook', async (req, res) => {
  const payload = req.body;
  
  try {
    // ตรวจสอบว่าเป็น event ที่เกี่ยวข้องกับการชำระเงินหรือไม่
    if (payload.type === 'checkout.session.completed') {
      const session = payload.data.object;
      
      // ตรวจสอบว่ามี client_reference_id หรือไม่
      if (session.client_reference_id) {
        // ดึงข้อมูลการเติมเงินจากฐานข้อมูล
        const topup = await storage.getTopupByReferenceId(session.client_reference_id);
        
        if (topup && topup.status !== 'completed') {
          // อัพเดตสถานะการเติมเงินเป็น completed
          await storage.updateTopUpStatus(topup.id, 'completed');
          
          // อัพเดตยอดเงินในบัญชีผู้ใช้
          const amount = parseFloat(topup.amount);
          await storage.addUserBalance(topup.userId, amount);
          
          console.log(`Topup completed via webhook: ${topup.id}, amount: ${amount}`);
        }
      }
    }
    
    // ตอบกลับ Stripe ว่าได้รับ event แล้ว
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error);
    return res.status(400).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผล webhook',
      error: error.message
    });
  }
});

/**
 * สร้าง PromptPay QR Code สำหรับการชำระเงิน
 * POST /api/stripe/create-promptpay
 */
router.post('/create-promptpay', auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีการส่งข้อมูลที่ถูกต้องมาหรือไม่
    const validation = createCheckoutSessionSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = fromZodError(validation.error).message;
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    const { amount } = validation.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อน'
      });
    }

    // สร้างรายการเติมเงินในฐานข้อมูล
    const referenceId = `PP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const topup = await storage.createTopUp({
      userId,
      amount: amount.toString(),
      method: 'prompt_pay',
      status: 'pending',
      referenceId,
    });

    try {
      // สร้าง PaymentIntent สำหรับ PromptPay
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // แปลงเป็นสตางค์
        currency: 'thb',
        payment_method_types: ['promptpay'],
        metadata: {
          userId: userId.toString(),
          topupId: topup.id.toString(),
          referenceId,
        },
      });

      // สร้าง Payment Method สำหรับ PromptPay
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'promptpay',
        billing_details: {
          email: req.user?.email || undefined,
          name: req.user?.fullname || undefined,
        },
      });

      // ยืนยัน PaymentIntent ด้วย Payment Method
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id,
        {
          payment_method: paymentMethod.id,
        }
      );

      // อัพเดตรายการเติมเงินด้วย paymentIntentId
      await storage.updateTopUp(topup.id, {
        stripeSessionId: paymentIntent.id,
        qrCodeUrl: confirmedPaymentIntent.next_action?.promptpay_display_qr_code?.image_url_png,
      });

      // ส่งข้อมูลกลับไปยังผู้ใช้
      return res.status(200).json({
        success: true,
        paymentIntentId: paymentIntent.id,
        qrCodeUrl: confirmedPaymentIntent.next_action?.promptpay_display_qr_code?.image_url_png,
        topup,
      });
    } catch (stripeError: any) {
      console.error('Error creating Stripe PromptPay:', stripeError);
      
      // อัพเดตสถานะการเติมเงินเป็น failed
      await storage.updateTopUp(topup.id, {
        status: 'failed',
        notes: `Stripe Error: ${stripeError.message}`,
      });
      
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้าง PromptPay QR Code',
        error: stripeError.message
      });
    }
  } catch (error: any) {
    console.error('Error creating PromptPay QR Code:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง PromptPay QR Code',
      error: error.message
    });
  }
});

export default router;