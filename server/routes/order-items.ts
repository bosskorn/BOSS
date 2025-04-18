import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';

const router = Router();

// Get order items by order ID
router.get('/order-items/:orderId', auth, async (req, res) => {
  try {
    const items = await storage.getOrderItems(parseInt(req.params.orderId));
    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error(`Error fetching order items for order ${req.params.orderId}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า'
    });
  }
});

// Create order item
router.post('/order-items', auth, async (req, res) => {
  try {
    const itemData = req.body;
    const item = await storage.createOrderItem(itemData);
    res.status(201).json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error creating order item:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายการสินค้าใหม่'
    });
  }
});

export default router;