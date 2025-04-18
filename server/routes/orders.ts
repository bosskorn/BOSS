import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';

const router = Router();

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await storage.getAllOrders();
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ'
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await storage.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(`Error fetching order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ'
    });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const orderData = req.body;
    const order = await storage.createOrder(orderData);
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อใหม่'
    });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    const orderData = req.body;
    const order = await storage.updateOrder(req.params.id, orderData);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(`Error updating order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดตคำสั่งซื้อ'
    });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await storage.deleteOrder(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    res.json({
      success: true,
      message: 'ลบคำสั่งซื้อสำเร็จ'
    });
  } catch (error) {
    console.error(`Error deleting order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ'
    });
  }
});

// Get summary data for dashboard
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await storage.getOrdersSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching orders summary:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปยอดขาย'
    });
  }
});

export default router;
