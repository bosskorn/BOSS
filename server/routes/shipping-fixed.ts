/**
 * เส้นทาง API สำหรับการจัดส่ง - ฉบับทดแทน
 */
import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';

const router = express.Router();

/**
 * API สำหรับดึงตัวเลือกการจัดส่ง
 */
router.post('/options', auth, async (req: Request, res: Response) => {
  try {
    // ตัวเลือกการจัดส่งเริ่มต้น
    const defaultOptions = [
      {
        id: 1,
        name: 'บริการส่งด่วน',
        price: 60,
        deliveryTime: '1-2 วัน',
        provider: 'บริการจัดส่ง',
        serviceId: 'EXPRESS-FAST',
        logo: '/assets/shipping-icon.png'
      },
      {
        id: 2,
        name: 'บริการส่งธรรมดา',
        price: 40,
        deliveryTime: '2-3 วัน',
        provider: 'บริการจัดส่ง',
        serviceId: 'EXPRESS-NORMAL',
        logo: '/assets/shipping-icon.png'
      }
    ];

    res.json({
      success: true,
      options: defaultOptions
    });
  } catch (error: any) {
    console.error('Error getting shipping options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shipping options'
    });
  }
});

export default router;