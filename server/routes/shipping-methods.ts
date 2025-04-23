import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * API สำหรับการดึงวิธีการจัดส่ง
 */
router.get('/', auth, async (req, res) => {
  try {
    // ข้อมูลการจัดส่งจำลอง
    const shippingMethods = [
      {
        id: 1,
        name: 'ส่งด่วน',
        price: 60,
        estimatedDeliveryDays: 1,
        provider: 'บริการจัดส่ง',
        icon: '⚡',
        isActive: true
      },
      {
        id: 2,
        name: 'ส่งธรรมดา',
        price: 40,
        estimatedDeliveryDays: 3,
        provider: 'บริการจัดส่ง',
        icon: '🚚',
        isActive: true
      }
    ];

    res.json({
      success: true,
      methods: shippingMethods
    });
  } catch (error: any) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch shipping methods'
    });
  }
});

/**
 * API สำหรับดึงวิธีการชำระเงิน
 */
router.get('/payment-methods', auth, async (req, res) => {
  try {
    // ข้อมูลการชำระเงินจำลอง
    const paymentMethods = [
      {
        id: 1,
        name: 'เก็บเงินปลายทาง (COD)',
        fee: 20,
        isActive: true
      },
      {
        id: 2,
        name: 'โอนเงินล่วงหน้า',
        fee: 0,
        isActive: true
      }
    ];

    res.json({
      success: true,
      methods: paymentMethods
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment methods'
    });
  }
});

// API สำหรับดึงข้อมูลวิธีการจัดส่งตามรหัส
router.get('/:id', auth, async (req, res) => {
  try {
    const shippingMethodId = parseInt(req.params.id);
    if (isNaN(shippingMethodId)) {
      return res.status(400).json({ success: false, message: 'รหัสวิธีการจัดส่งไม่ถูกต้อง' });
    }

    const shippingMethod = await storage.getShippingMethod(shippingMethodId);

    if (!shippingMethod) {
      return res.status(404).json({ success: false, message: 'ไม่พบวิธีการจัดส่ง' });
    }

    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงวิธีการจัดส่งนี้หรือไม่
    if (shippingMethod.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงวิธีการจัดส่งนี้' });
    }

    res.json({ success: true, data: shippingMethod });
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิธีการจัดส่ง' });
  }
});

// API สำหรับสร้างวิธีการจัดส่งใหม่
router.post('/', auth, async (req, res) => {
  try {
    // ตรวจสอบและแปลงข้อมูลตาม schema
    const shippingMethodData = insertShippingMethodSchema.parse(req.body);

    // เพิ่ม userId ให้กับข้อมูลวิธีการจัดส่ง
    const shippingMethodWithUser = {
      ...shippingMethodData,
      userId: req.user!.id
    };

    // บันทึกข้อมูลลงฐานข้อมูล
    const newShippingMethod = await storage.createShippingMethod(shippingMethodWithUser);

    res.status(201).json({ success: true, message: 'สร้างวิธีการจัดส่งสำเร็จ', data: newShippingMethod });
  } catch (error) {
    console.error('Error creating shipping method:', error);
    res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างวิธีการจัดส่ง', error: error });
  }
});

// API สำหรับดึงข้อมูลค่าจัดส่ง
router.post('/rates', auth, async (req, res) => {
  try {
    const { fromAddress, toAddress, weight } = req.body;

    if (!fromAddress || !toAddress) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุที่อยู่ต้นทางและปลายทาง'
      });
    }

    if (!fromAddress.zipcode || !toAddress.zipcode) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสไปรษณีย์ต้นทางและปลายทาง'
      });
    }

    console.log('=== เรียกใช้ API เพื่อดึงข้อมูลค่าจัดส่ง ===');
    console.log('ข้อมูลที่ส่ง:', JSON.stringify({
      จาก: fromAddress.zipcode,
      ไปยัง: {
        province: toAddress.province || 'กรุงเทพมหานคร',
        district: toAddress.district || 'ลาดพร้าว',
        subdistrict: toAddress.subdistrict || 'ลาดพร้าว',
        zipcode: toAddress.zipcode
      },
      น้ำหนัก: weight || 1.0
    }, null, 2));

    // ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น
    const defaultShippingRates = [
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

    console.log('ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น');
    res.json({
      success: true,
      shippingRates: defaultShippingRates,
      isDefault: true
    });
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าจัดส่ง',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// API สำหรับสร้างการจัดส่ง
router.post('/shipping', auth, async (req, res) => {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุข้อมูลคำสั่งซื้อ'
      });
    }

    console.log('กำลังสร้างการจัดส่ง:', JSON.stringify(orderData, null, 2));

    // สร้างเลขติดตามการจัดส่งสมมติ
    const trackingNumber = `TRK${Date.now()}`;
    const sortCode = 'SC001';

    console.log('สร้างการจัดส่งสำเร็จ:', {
      trackingNumber,
      sortCode
    });

    res.json({
      success: true,
      trackingNumber: trackingNumber,
      sortCode: sortCode,
      message: 'สร้างการจัดส่งสำเร็จ'
    });
  } catch (error: any) {
    console.error('Error creating shipping:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างการจัดส่ง',
      error: error?.message || String(error)
    });
  }
});

/**
 * API สำหรับ Flash Express
 */
router.post('/flash-express/shipping', auth, async (req, res) => {
  try {
    // ส่งต่อคำขอไปยัง Flash Express API
    const response = await fetch('http://localhost:5000/api/flash-express/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error forwarding request to Flash Express API:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ Flash Express',
    });
  }
});

export default router;