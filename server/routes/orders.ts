
import express from 'express';
import { auth } from '../auth';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import dotenv from 'dotenv';
import { db } from '../db';
import { orders, orderItems } from '@shared/schema';
import { eq, and, desc, like, ilike, or, sql } from 'drizzle-orm';
import { storage } from '../storage';

dotenv.config();

const router = express.Router();

// กำหนด Express routes สำหรับการจัดการออเดอร์

// สร้างออเดอร์ใหม่
router.post('/', auth, async (req, res) => {
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

    // สร้างออเดอร์ใหม่ในฐานข้อมูลด้วย Drizzle
    const [newOrder] = await db.insert(orders).values({
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
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // สร้าง orderItems สำหรับแต่ละรายการสินค้า
    const orderItemsData = items.map((item: any) => ({
      orderId: newOrder.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      price: item.price,
      options: item.options || {},
      createdAt: new Date()
    }));

    // บันทึก items ทั้งหมด
    const newOrderItems = await db.insert(orderItems).values(orderItemsData).returning();

    // ส่งคืนข้อมูลทั้งหมด
    const orderWithItems = {
      ...newOrder,
      items: newOrderItems
    };

    res.status(201).json({
      success: true,
      message: 'สร้างออเดอร์สำเร็จ',
      order: orderWithItems
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
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // คิวรี่พารามิเตอร์
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || undefined;
    const search = req.query.search as string || undefined;
    
    // คำนวณการข้ามข้อมูล
    const skip = (page - 1) * limit;

    try {
      // ดึงข้อมูลออเดอร์ด้วย SQL โดยตรง เพื่อหลีกเลี่ยงปัญหากับ Drizzle
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM orders 
        WHERE user_id = $1
      `;
      
      let params = [userId];
      
      if (status && status !== 'all') {
        countQuery += ` AND status = $2`;
        params.push(status);
      }
      
      if (search) {
        const paramIndex = params.length + 1;
        countQuery += ` AND order_number ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
      }
      
      // นับจำนวนออเดอร์ทั้งหมด
      const countResult = await db.execute(countQuery, params);
      const totalOrders = parseInt(countResult.rows[0].total || '0');
      
      // สร้าง query เพื่อดึงข้อมูลออเดอร์
      let ordersQuery = `
        SELECT * FROM orders 
        WHERE user_id = $1
      `;
      
      params = [userId];
      
      if (status && status !== 'all') {
        ordersQuery += ` AND status = $2`;
        params.push(status);
      }
      
      if (search) {
        const paramIndex = params.length + 1;
        ordersQuery += ` AND order_number ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
      }
      
      // ใช้พารามิเตอร์ที่ถูกต้องและตรวจสอบว่าเป็นตัวเลข
      const limitParam = Number(limit);
      const skipParam = Number(skip);
      params.push(limitParam, skipParam);
      
      ordersQuery += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      
      
      // ดึงข้อมูลออเดอร์
      const ordersResult = await db.execute(ordersQuery, params);
      const ordersData = ordersResult.rows;
      
      // ดึงข้อมูล order items สำหรับแต่ละออเดอร์
      const orderIds = ordersData.map(order => order.id);
      
      let orderItemsData = [];
      if (orderIds.length > 0) {
        // ใช้ parameterized query เพื่อป้องกัน SQL injection
        const placeholders = orderIds.map((_, idx) => `$${idx + 1}`).join(',');
        const orderItemsQuery = `
          SELECT * FROM order_items 
          WHERE order_id IN (${placeholders})
        `;
        const orderItemsResult = await db.execute(orderItemsQuery, orderIds);
        orderItemsData = orderItemsResult.rows;
      }
      
      // จัดกลุ่ม order items ตาม orderId
      const orderItemsMap = orderItemsData.reduce((acc, item) => {
        const orderId = item.order_id;
        if (!acc[orderId]) {
          acc[orderId] = [];
        }
        acc[orderId].push(item);
        return acc;
      }, {} as Record<number, any[]>);
      
      // เพิ่ม items เข้าไปในแต่ละออเดอร์
      const ordersWithItems = ordersData.map(order => ({
        ...order,
        items: orderItemsMap[order.id] || []
      }));
      
      // คำนวณจำนวนหน้าทั้งหมด
      const totalPages = Math.ceil(totalOrders / limit);
      
      res.json({
        success: true,
        orders: ordersWithItems,
        pagination: {
          total: totalOrders,
          page,
          limit,
          totalPages
        }
      });
    } catch (sqlError) {
      console.error('SQL Error:', sqlError);
      throw new Error(`Database error: ${sqlError.message}`);
    }
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
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    res.json({
      success: true,
      order
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
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    // ใช้ Drizzle ORM แทน Prisma
    const orderData = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, userId)
      ));
    
    if (!orderData || orderData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    // อัปเดตออเดอร์
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
    
    // ดึงข้อมูล items
    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    
    res.json({
      success: true,
      message: 'อัปเดตสถานะออเดอร์สำเร็จ',
      order: {
        ...updatedOrder,
        items: orderItemsData
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

// อัปเดตข้อมูลการติดตามและการจัดส่ง
router.patch('/:id/tracking', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    const { trackingNumber, shippingMethod, sortCode } = req.body;
    
    // ใช้ Drizzle ORM แทน Prisma
    const orderData = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, userId)
      ));
    
    if (!orderData || orderData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    // อัปเดตออเดอร์
    const [updatedOrder] = await db
      .update(orders)
      .set({
        trackingNumber,
        shippingMethod,
        sortCode,
        status: 'shipped',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
    
    // ดึงข้อมูล items
    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    
    res.json({
      success: true,
      message: 'อัปเดตข้อมูลการติดตามสำเร็จ',
      order: {
        ...updatedOrder,
        items: orderItemsData
      }
    });
  } catch (error) {
    console.error('Error updating tracking info:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการติดตาม',
      error: (error as Error).message
    });
  }
});

// ลบออเดอร์
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    // ลบรายการสินค้าก่อน
    await prisma.orderItem.deleteMany({
      where: {
        orderId
      }
    });
    
    // จากนั้นลบออเดอร์
    await prisma.order.delete({
      where: {
        id: orderId
      }
    });
    
    res.json({
      success: true,
      message: 'ลบออเดอร์สำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบออเดอร์',
      error: (error as Error).message
    });
  }
});

// ค้นหาออเดอร์จากหมายเลขการติดตาม
router.get('/tracking/:trackingNumber', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const trackingNumber = req.params.trackingNumber;
    
    const order = await prisma.order.findFirst({
      where: {
        trackingNumber,
        userId
      },
      include: {
        items: true
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์จากหมายเลขการติดตาม'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error finding order by tracking number:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาออเดอร์',
      error: (error as Error).message
    });
  }
});

// ค้นหาออเดอร์จากหมายเลขออเดอร์
router.get('/order-number/:orderNumber', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderNumber = req.params.orderNumber;
    
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId
      },
      include: {
        items: true
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์จากหมายเลขออเดอร์'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error finding order by order number:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาออเดอร์',
      error: (error as Error).message
    });
  }
});

// สร้างออเดอร์จำนวนมาก (Bulk)
router.post('/bulk', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    const { orders } = req.body;
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีข้อมูลออเดอร์ที่จะนำเข้า'
      });
    }
    
    const createdOrders = [];
    
    for (const orderData of orders) {
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
        codAmount
      } = orderData;
      
      // สร้างหมายเลขออเดอร์แบบสุ่ม
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      
      // สร้างออเดอร์ใหม่ในฐานข้อมูล
      const newOrder = await prisma.order.create({
        data: {
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
          status: 'pending',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              price: item.price,
              options: item.options || {}
            }))
          }
        },
        include: {
          items: true
        }
      });
      
      createdOrders.push(newOrder);
    }
    
    res.status(201).json({
      success: true,
      message: `สร้างออเดอร์สำเร็จ ${createdOrders.length} รายการ`,
      orders: createdOrders
    });
  } catch (error) {
    console.error('Error creating bulk orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างออเดอร์จำนวนมาก',
      error: (error as Error).message
    });
  }
});

// เพิ่ม endpoint สำหรับตรวจสอบการค้นหาออเดอร์จากหมายเลขการติดตามของลูกค้า (Merchant Tracking)
router.get('/merchant-tracking/:merchantTracking', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const merchantTracking = req.params.merchantTracking;
    
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          contains: merchantTracking
        },
        userId
      },
      include: {
        items: true
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์จากหมายเลขการติดตามของลูกค้า'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error finding order by merchant tracking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาออเดอร์',
      error: (error as Error).message
    });
  }
});

// API สำหรับสร้างออเดอร์ใหม่
router.post('/create', async (req, res) => {
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
