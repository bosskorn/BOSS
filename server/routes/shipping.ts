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

/**
 * API สำหรับสร้างการจัดส่งใหม่
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    // สร้างเลขติดตามการจัดส่งสมมติ
    const trackingNumber = `TRK${Date.now()}`;

    res.json({
      success: true,
      trackingNumber: trackingNumber,
      sortCode: 'SC001',
      message: 'สร้างการจัดส่งสำเร็จ'
    });
  } catch (error: any) {
    console.error('Error creating shipping:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shipping'
    });
  }
});

/**
 * API สำหรับตรวจสอบสถานะการจัดส่ง
 */
router.get('/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }

    // สร้างข้อมูลสถานะการจัดส่งสมมติ
    const status = {
      trackingNumber,
      status: 'ในระบบขนส่ง',
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'รับพัสดุแล้ว',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          location: 'ศูนย์กระจายสินค้า'
        },
        {
          status: 'ในระบบขนส่ง',
          timestamp: new Date().toISOString(),
          location: 'ระหว่างการจัดส่ง'
        }
      ]
    };

    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track shipment'
    });
  }
});

/**
 * API สำหรับวิเคราะห์ที่อยู่
 */
router.post('/analyze-address', auth, async (req: Request, res: Response) => {
  try {
    const { fullAddress } = req.body;

    if (!fullAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    // วิเคราะห์ที่อยู่แบบง่าย
    const addressComponents = {
      address: fullAddress,
      province: 'กรุงเทพมหานคร',
      district: 'พระนคร',
      subdistrict: 'พระบรมมหาราชวัง',
      zipcode: '10200'
    };

    res.json({
      success: true,
      address: addressComponents
    });
  } catch (error: any) {
    console.error('Error analyzing address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze address'
    });
  }
});

export default router;