import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';
import { insertShippingMethodSchema } from '@shared/schema';
import { getFlashExpressShippingOptions } from '../services/flash-express';

const router = Router();

// API สำหรับดึงข้อมูลวิธีการจัดส่งทั้งหมด
router.get('/', auth, async (req, res) => {
  try {
    // ดึงข้อมูลวิธีการจัดส่งของผู้ใช้ที่ล็อกอินเท่านั้น
    const userId = req.user!.id;
    const shippingMethods = await storage.getShippingMethodsByUserId(userId);
    
    res.json({ success: true, shippingMethods });
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิธีการจัดส่ง' });
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

// API สำหรับดึงข้อมูลค่าจัดส่งจาก Flash Express
router.post('/flash-express/rates', auth, async (req, res) => {
  try {
    const { fromAddress, toAddress, weight } = req.body;
    
    if (!fromAddress || !toAddress) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุที่อยู่ต้นทางและปลายทาง'
      });
    }
    
    // เรียก API Flash Express เพื่อดึงข้อมูลค่าจัดส่ง
    const shippingRates = await getFlashExpressShippingOptions(
      fromAddress,
      toAddress,
      weight || 1.0
    );
    
    res.json({
      success: true,
      shippingRates
    });
  } catch (error) {
    console.error('Error fetching Flash Express shipping rates:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าจัดส่ง'
    });
  }
});

export default router;