import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { db } from '../db';
import { orders, orderItems } from '@shared/schema';
import { eq, and, desc, like, ilike, or, sql } from 'drizzle-orm';
import { storage } from '../storage';
import { auth } from '../auth';

const router = express.Router();

// สร้างออเดอร์ใหม่
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingProvince,
      shippingDistrict,
      shippingSubdistrict,
      shippingZipcode,
      note,
      items,
      total,
      shippingMethod,
      shippingCost,
      isCOD,
      codAmount,
      trackingNumber,
      sortCode
    } = req.body;

    // สร้างหมายเลขออเดอร์แบบสุ่ม
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    // สร้างออเดอร์ใหม่ในฐานข้อมูล
    const newOrder = await storage.createOrder({
      userId,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      shippingProvince,
      shippingDistrict,
      shippingSubdistrict,
      shippingZipcode,
      note,
      total,
      shippingMethod,
      shippingCost,
      isCOD,
      codAmount,
      trackingNumber,
      sortCode,
      status: 'pending',
    });

    // เพิ่มรายการสินค้าในออเดอร์
    for (const item of items) {
      await storage.createOrderItem({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        price: item.price,
        options: item.options || {}
      });
    }

    // ดึงข้อมูลออเดอร์พร้อมรายการสินค้า
    const orderWithItems = await storage.getOrder(newOrder.id);
    const orderItems = await storage.getOrderItems(newOrder.id);

    res.status(201).json({
      success: true,
      message: 'สร้างออเดอร์สำเร็จ',
      order: {
        ...orderWithItems,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างออเดอร์',
      error: (error as Error).message
    });
  }
});

// ดึงข้อมูลออเดอร์ทั้งหมดของผู้ใช้
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }
    
    const orders = await storage.getOrdersByUserId(userId);
    
    for (const order of orders) {
      const items = await storage.getOrderItems(order.id);
      (order as any).items = items;
    }
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
      error: (error as Error).message
    });
  }
});

// ดึงข้อมูลออเดอร์ตาม ID
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }
    
    const orderId = parseInt(req.params.id);
    
    const order = await storage.getOrder(orderId);
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    const items = await storage.getOrderItems(orderId);
    
    res.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์',
      error: (error as Error).message
    });
  }
});

// อัปเดตสถานะออเดอร์
router.patch('/:id/status', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }
    
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    const order = await storage.getOrder(orderId);
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    const updatedOrder = await storage.updateOrder(orderId, { status });
    
    if (!updatedOrder) {
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะออเดอร์'
      });
    }
    
    const items = await storage.getOrderItems(orderId);
    
    res.json({
      success: true,
      message: 'อัปเดตสถานะออเดอร์สำเร็จ',
      order: {
        ...updatedOrder,
        items
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะออเดอร์',
      error: (error as Error).message
    });
  }
});

// API สำหรับสร้างออเดอร์ใหม่
router.post('/create', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    console.log('ข้อมูลการสร้างออเดอร์ที่ได้รับ:', orderData);

    // สร้างออเดอร์จริงในระบบ (จำลอง - ให้เปลี่ยนตามระบบจริง)
    // ในตัวอย่างนี้เราแค่ส่งกลับข้อมูลที่ได้รับมาพร้อมกับ ID สุ่ม
    const createdOrder = {
      id: Math.floor(Math.random() * 10000),
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'สร้างออเดอร์สำเร็จ',
      order: createdOrder
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างออเดอร์:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างออเดอร์',
      error: (error as Error).message
    });
  }
});

export default router;