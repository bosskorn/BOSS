/**
 * เส้นทาง API สำหรับบริการขนส่งแบบจำลอง 
 * ใช้สำหรับการทดสอบระบบโดยไม่ต้องเชื่อมต่อกับบริการขนส่งจริง
 */

import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getMockShippingOptions,
  createMockShipment,
  getMockTrackingInfo,
  MOCK_THAI_PROVINCES
} from '../services/mock-shipping';

const router = Router();

/**
 * รับตัวเลือกการจัดส่งแบบจำลอง
 */
router.post('/options', auth, async (req, res) => {
  try {
    const { address, weight = 1, dimensions, value } = req.body;
    
    if (!address || !address.province) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลที่อยู่ไม่ถูกต้อง'
      });
    }
    
    // สร้างข้อมูลที่อยู่ต้นทาง (ใช้ข้อมูลผู้ใช้หรือค่าเริ่มต้น)
    const fromAddress = {
      province: 'กรุงเทพมหานคร',
      district: 'บางรัก',
      zipcode: '10500'
    };
    
    // สร้างข้อมูลที่อยู่ปลายทาง
    const toAddress = {
      province: address.province,
      district: address.district || '',
      zipcode: address.zipcode || '10200' // ถ้าไม่มีรหัสไปรษณีย์ใช้ค่าเริ่มต้น
    };
    
    const options = await getMockShippingOptions(
      fromAddress, 
      toAddress, 
      {
        weight: parseFloat(weight) || 1,
        width: dimensions?.width,
        height: dimensions?.height,
        length: dimensions?.length,
        parcelValue: value
      }
    );
    
    return res.json({
      success: true,
      options
    });
  } catch (error: any) {
    console.error('Error getting mock shipping options:', error);
    
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการดึงข้อมูลการจัดส่ง: ${error.message}`
    });
  }
});

/**
 * สร้างการจัดส่งแบบจำลอง
 */
router.post('/create', auth, async (req, res) => {
  try {
    const {
      sender,
      recipient,
      weight = 1,
      dimensions,
      value = 0,
      shippingCode,
      isCOD = false,
      codAmount = 0
    } = req.body;
    
    if (!sender || !recipient || !shippingCode) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ครบถ้วน'
      });
    }
    
    const result = await createMockShipment(
      sender,
      recipient,
      {
        weight: parseFloat(weight) || 1,
        width: dimensions?.width,
        height: dimensions?.height,
        length: dimensions?.length,
        parcelValue: value,
        isCOD,
        codAmount
      },
      shippingCode
    );
    
    return res.json({
      success: true,
      trackingNumber: result.trackingNumber,
      price: result.price
    });
  } catch (error: any) {
    console.error('Error creating mock shipment:', error);
    
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการสร้างการจัดส่ง: ${error.message}`
    });
  }
});

/**
 * ติดตามสถานะการจัดส่งแบบจำลอง
 */
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'ไม่ระบุเลขพัสดุ'
      });
    }
    
    const trackingInfo = await getMockTrackingInfo(trackingNumber);
    
    return res.json({
      success: true,
      trackingInfo
    });
  } catch (error: any) {
    console.error('Error tracking mock shipment:', error);
    
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการติดตามพัสดุ: ${error.message}`
    });
  }
});

/**
 * ดึงข้อมูลจังหวัดและรหัสไปรษณีย์
 */
router.get('/provinces', (req, res) => {
  try {
    return res.json({
      success: true,
      provinces: MOCK_THAI_PROVINCES
    });
  } catch (error: any) {
    console.error('Error getting provinces:', error);
    
    return res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการดึงข้อมูลจังหวัด: ${error.message}`
    });
  }
});

export default router;