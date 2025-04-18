import { Router } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// ดึงข้อมูลลูกค้าทั้งหมดของผู้ใช้ที่เข้าสู่ระบบ
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }
    
    const customers = await storage.getCustomersByUserId(req.user.id);
    return res.json({ success: true, customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า',
      error: error.message
    });
  }
});

// ดึงข้อมูลลูกค้าตาม ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }
    
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'ID ลูกค้าไม่ถูกต้อง' });
    }
    
    const customer = await storage.getCustomer(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงข้อมูลลูกค้านี้หรือไม่
    if (customer.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้านี้' });
    }
    
    return res.json({ success: true, customer });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า',
      error: error.message 
    });
  }
});

// สร้างลูกค้าใหม่
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }
    
    const customerData = { ...req.body, userId: req.user.id };
    
    const newCustomer = await storage.createCustomer(customerData);
    
    return res.status(201).json({ success: true, customer: newCustomer });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสร้างลูกค้า',
      error: error.message 
    });
  }
});

// อัปเดตข้อมูลลูกค้า
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }
    
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: 'ID ลูกค้าไม่ถูกต้อง' });
    }
    
    // ตรวจสอบว่าลูกค้านี้เป็นของผู้ใช้นี้หรือไม่
    const existingCustomer = await storage.getCustomer(customerId);
    if (!existingCustomer) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
    }
    
    if (existingCustomer.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูลลูกค้านี้' });
    }
    
    const updatedCustomer = await storage.updateCustomer(customerId, req.body);
    
    return res.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า',
      error: error.message 
    });
  }
});

export default router;