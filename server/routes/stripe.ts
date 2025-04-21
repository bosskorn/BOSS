/**
 * Stripe API integration for payment processing
 */
import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middlewares/auth';
import { generateUniqueId } from '../utils';

// ตรวจสอบค่า STRIPE_SECRET_KEY
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

// สร้าง Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Type assertion เพื่อแก้ปัญหา TypeScript
  appInfo: {
    name: 'BLUEDASH',
    version: '1.0.0',
  },
});

const router = Router();

// สร้าง Stripe checkout session
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      amount: z.number().min(20),
      successUrl: z.string().url().optional(),
      cancelUrl: z.string().url().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: result.error.flatten(),
      });
    }

    const { amount, successUrl, cancelUrl } = result.data;
    const userId = req.user?.id as number;

    // สร้างรหัสอ้างอิงสำหรับการชำระเงิน
    const referenceId = `TOP-${generateUniqueId(8)}`;

    // บันทึกข้อมูลการชำระเงินลงในฐานข้อมูล
    const topup = await storage.createTopUp({
      userId,
      referenceId,
      amount: amount.toString(),
      method: 'credit_card',
      status: 'pending',
      stripeSessionId: '', // จะอัปเดตค่านี้หลังจากสร้าง session
    });

    // สร้าง Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'BLUEDASH Credit Top-up',
              description: `Reference ID: ${referenceId}`,
            },
            unit_amount: Math.round(amount * 100), // แปลงเป็นสตางค์
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/topup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/topup/cancel`,
      client_reference_id: referenceId,
      customer_email: req.user?.email || undefined,
      metadata: {
        userId: userId.toString(),
        referenceId,
      },
    });

    // อัปเดต stripeSessionId
    await storage.updateTopUp(topup.id, {
      stripeSessionId: session.id,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment session',
      error: error.message,
    });
  }
});

// ตรวจสอบสถานะการชำระเงิน
router.get('/checkout-session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // ตรวจสอบว่า session ID นี้ตรงกับข้อมูลในระบบหรือไม่
    const topup = await storage.getTopupByStripeSessionId(sessionId);
    if (!topup) {
      return res.status(404).json({
        success: false,
        message: 'Payment session not found',
      });
    }

    // ตรวจสอบว่าเป็นเจ้าของการเติมเงินจริงหรือไม่
    if (topup.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this payment session',
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // ตรวจสอบสถานะการชำระเงิน
    if (session.payment_status === 'paid' && topup.status !== 'completed') {
      // อัพเดตสถานะการเติมเงิน
      await storage.updateTopUpStatus(topup.id, 'completed');

      // อัพเดตยอดเงินในบัญชีผู้ใช้
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const currentBalance = parseFloat(user.balance || '0');
        const topupAmount = parseFloat(topup.amount);
        const newBalance = currentBalance + topupAmount;

        await storage.updateUserBalance(user.id, newBalance);
      }
    }

    res.json({
      success: true,
      session,
      topup,
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve checkout session',
      error: error.message,
    });
  }
});

// Webhook สำหรับรับการแจ้งเตือนจาก Stripe
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET is not set. Webhook verification is disabled.');
    return res.status(400).send('Webhook verification is not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ตรวจสอบประเภทของ event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // อัพเดตสถานะการเติมเงิน
      const topup = await storage.getTopupByStripeSessionId(session.id);
      if (topup && topup.status !== 'completed') {
        // อัพเดตสถานะการเติมเงิน
        await storage.updateTopUpStatus(topup.id, 'completed');

        // อัพเดตยอดเงินในบัญชีผู้ใช้
        const user = await storage.getUser(topup.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance || '0');
          const topupAmount = parseFloat(topup.amount);
          const newBalance = currentBalance + topupAmount;

          await storage.updateUserBalance(user.id, newBalance);
        }
      }
      break;
    }
    // สามารถเพิ่ม case อื่นๆ ได้ตามต้องการ
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

export default router;