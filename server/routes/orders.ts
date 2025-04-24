import express from 'express';
import { auth } from '../auth';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import dotenv from 'dotenv';
import { db } from '../db';
import { pool } from '../db';
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
      codAmount
    } = req.body;

    // สร้างหมายเลขออเดอร์
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    try {
      // สร้างออเดอร์ใหม่
      const [newOrder] = await db.insert(orders).values({
        userId,
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        shippingAddress,
        shippingProvince,
        shippingDistrict,
        shippingSubdistrict,
        shippingZipcode,
        note: note || '',
        totalAmount: total,
        shippingMethod,
        shippingCost,
        isCOD: isCOD || false,
        codAmount: codAmount || 0,
        status: 'pending'
      }).returning();

      // เพิ่มรายการสินค้าสำหรับออเดอร์นี้
      const orderItemsForInsertion = items.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId || 0,
        productName: item.productName,
        productSku: item.productSku || '',
        quantity: item.quantity,
        price: item.price,
        options: item.options || {}
      }));

      // บันทึกรายการสินค้า
      const savedItems = await db.insert(orderItems).values(orderItemsForInsertion).returning();

      res.json({
        success: true,
        message: 'สร้างออเดอร์สำเร็จ',
        order: {
          ...newOrder,
          items: savedItems
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${(dbError as Error).message}`);
    }
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
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      });
    }
    
    // คิวรี่พารามิเตอร์
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || 'all';
    const search = req.query.search as string || '';
    
    // คำนวณการข้ามข้อมูล
    const skip = (page - 1) * limit;

    try {
      // นับจำนวนออเดอร์ทั้งหมด
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = $1';
      const countParams = [userId];
      
      let paramIndex = 1;
      
      if (status && status !== 'all') {
        paramIndex++;
        countQuery += ` AND status = $${paramIndex}`;
        countParams.push(status);
      }
      
      if (search) {
        paramIndex++;
        countQuery += ` AND order_number ILIKE $${paramIndex}`;
        countParams.push(`%${search}%`);
      }
      
      console.log('Count Query:', countQuery, 'Params:', countParams);
      
      const countResult = await pool.query(countQuery, countParams);
      const totalOrders = parseInt(countResult.rows[0]?.total || '0');
      
      console.log('Total orders count:', totalOrders);
      
      // สร้าง SQL สำหรับดึงข้อมูลออเดอร์
      let ordersQuery = 'SELECT * FROM orders WHERE user_id = $1';
      const ordersParams = [userId];
      
      paramIndex = 1;
      
      if (status && status !== 'all') {
        paramIndex++;
        ordersQuery += ` AND status = $${paramIndex}`;
        ordersParams.push(status);
      }
      
      if (search) {
        paramIndex++;
        ordersQuery += ` AND order_number ILIKE $${paramIndex}`;
        ordersParams.push(`%${search}%`);
      }
      
      ordersQuery += ' ORDER BY created_at DESC';
      
      paramIndex++;
      ordersQuery += ` LIMIT $${paramIndex}`;
      ordersParams.push(limit);
      
      paramIndex++;
      ordersQuery += ` OFFSET $${paramIndex}`;
      ordersParams.push(skip);
      
      console.log('Orders Query:', ordersQuery, 'Params:', ordersParams);
      
      // ดึงข้อมูลออเดอร์
      const ordersResult = await pool.query(ordersQuery, ordersParams);
      const ordersData = ordersResult.rows;
      
      // ดึงข้อมูล order items สำหรับแต่ละออเดอร์
      const orderIds = ordersData.map((order: any) => order.id);
      
      let orderItemsData: any[] = [];
      if (orderIds.length > 0) {
        try {
          // ใช้ parameterized query เพื่อป้องกัน SQL injection
          const placeholders = orderIds.map((_: any, idx: any) => `$${idx + 1}`).join(',');
          const orderItemsQuery = `
            SELECT * FROM order_items 
            WHERE order_id IN (${placeholders})
          `;
          console.log('Order Items Query:', orderItemsQuery);
          console.log('Order IDs:', orderIds);
          
          const orderItemsResult = await pool.query(orderItemsQuery, orderIds);
          orderItemsData = orderItemsResult.rows;
        } catch (err) {
          console.error('Error fetching order items:', err);
          // ในกรณีที่มีข้อผิดพลาดให้ใช้อาร์เรย์ว่าง
          orderItemsData = [];
        }
      }
      
      // จัดกลุ่ม order items ตาม orderId
      const orderItemsMap: Record<number, any[]> = {};
      
      for (const item of orderItemsData) {
        const orderId = item.order_id;
        if (!orderItemsMap[orderId]) {
          orderItemsMap[orderId] = [];
        }
        orderItemsMap[orderId].push(item);
      }
      
      // เพิ่ม items เข้าไปในแต่ละออเดอร์
      const ordersWithItems = ordersData.map((order: any) => ({
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
    } catch (sqlError: any) {
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
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      });
    }
    
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    // ค้นหาออเดอร์ด้วย raw SQL เพื่อหลีกเลี่ยงปัญหา ORM
    const findOrderQuery = 'SELECT * FROM orders WHERE id = $1 AND user_id = $2';
    const findOrderResult = await pool.query(findOrderQuery, [orderId, userId]);
    
    if (findOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    // อัปเดตออเดอร์
    const updateOrderQuery = 'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 AND user_id = $4 RETURNING *';
    const updateOrderResult = await pool.query(updateOrderQuery, [status, new Date(), orderId, userId]);
    const updatedOrder = updateOrderResult.rows[0];
    
    // ดึงข้อมูล items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    const itemsResult = await pool.query(itemsQuery, [orderId]);
    const orderItems = itemsResult.rows;
    
    res.json({
      success: true,
      message: 'อัปเดตสถานะออเดอร์สำเร็จ',
      order: {
        ...updatedOrder,
        items: orderItems
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
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      });
    }
    
    const orderId = parseInt(req.params.id);
    const { trackingNumber, shippingMethod, sortCode } = req.body;
    
    // ค้นหาออเดอร์ด้วย raw SQL
    const findOrderQuery = 'SELECT * FROM orders WHERE id = $1 AND user_id = $2';
    const findOrderResult = await pool.query(findOrderQuery, [orderId, userId]);
    
    if (findOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    // อัปเดตออเดอร์
    const updateOrderQuery = `
      UPDATE orders 
      SET tracking_number = $1, shipping_method = $2, sort_code = $3, status = $4, updated_at = $5 
      WHERE id = $6 AND user_id = $7 
      RETURNING *
    `;
    const updateOrderResult = await pool.query(
      updateOrderQuery, 
      [trackingNumber, shippingMethod, sortCode, 'shipped', new Date(), orderId, userId]
    );
    const updatedOrder = updateOrderResult.rows[0];
    
    // ดึงข้อมูล items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    const itemsResult = await pool.query(itemsQuery, [orderId]);
    const orderItems = itemsResult.rows;
    
    res.json({
      success: true,
      message: 'อัปเดตข้อมูลการติดตามสำเร็จ',
      order: {
        ...updatedOrder,
        items: orderItems
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
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      });
    }
    
    const orderId = parseInt(req.params.id);
    
    // ค้นหาออเดอร์ด้วย raw SQL
    const findOrderQuery = 'SELECT * FROM orders WHERE id = $1 AND user_id = $2';
    const findOrderResult = await pool.query(findOrderQuery, [orderId, userId]);
    
    if (findOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์'
      });
    }
    
    // ลบรายการสินค้าก่อน
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
    
    // จากนั้นลบออเดอร์
    await pool.query('DELETE FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    
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
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      });
    }
    
    const trackingNumber = req.params.trackingNumber;
    
    // ค้นหาออเดอร์ด้วย raw SQL
    const findOrderQuery = 'SELECT * FROM orders WHERE tracking_number = $1 AND user_id = $2';
    const findOrderResult = await pool.query(findOrderQuery, [trackingNumber, userId]);
    
    if (findOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์จากหมายเลขการติดตาม'
      });
    }
    
    const order = findOrderResult.rows[0];
    
    // ดึงข้อมูล items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    const itemsResult = await pool.query(itemsQuery, [order.id]);
    const orderItems = itemsResult.rows;
    
    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
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
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต' 
      });
    }
    
    const orderNumber = req.params.orderNumber;
    
    // ค้นหาออเดอร์ด้วย raw SQL
    const findOrderQuery = 'SELECT * FROM orders WHERE order_number = $1 AND user_id = $2';
    const findOrderResult = await pool.query(findOrderQuery, [orderNumber, userId]);
    
    if (findOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์จากหมายเลขออเดอร์'
      });
    }
    
    const order = findOrderResult.rows[0];
    
    // ดึงข้อมูล items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = $1';
    const itemsResult = await pool.query(itemsQuery, [order.id]);
    const orderItems = itemsResult.rows;
    
    res.json({
      success: true,
      order: {
        ...order,
        items: orderItems
      }
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
      try {
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
        
        // ใช้ raw SQL เพื่อสร้างออเดอร์
        const orderInsertQuery = `
          INSERT INTO orders (
            user_id, order_number, customer_name, customer_phone, customer_email,
            shipping_address, shipping_province, shipping_district, shipping_subdistrict,
            shipping_zipcode, note, total_amount, shipping_method, shipping_cost, is_cod,
            cod_amount, status, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING *
        `;
        
        const now = new Date();
        
        const orderInsertResult = await pool.query(orderInsertQuery, [
          userId, orderNumber, customerName, customerPhone, customerEmail || '',
          shippingAddress, shippingProvince, shippingDistrict, shippingSubdistrict,
          shippingZipcode, note || '', total, shippingMethod, shippingCost || 0, isCOD || false,
          codAmount || 0, 'pending', now, now
        ]);
        
        const newOrder = orderInsertResult.rows[0];
        
        // เพิ่มรายการสินค้า
        const orderItemsData = [];
        
        for (const item of items) {
          const itemInsertQuery = `
            INSERT INTO order_items (
              order_id, product_id, product_name, product_sku, quantity, price, options
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          
          const itemInsertResult = await pool.query(itemInsertQuery, [
            newOrder.id,
            item.productId || 0,
            item.productName,
            item.productSku || '',
            item.quantity,
            item.price,
            item.options || {}
          ]);
          
          orderItemsData.push(itemInsertResult.rows[0]);
        }
        
        createdOrders.push({
          ...newOrder,
          items: orderItemsData
        });
      } catch (orderError) {
        console.error('Error creating individual order:', orderError);
        // ข้ามออเดอร์ที่มีปัญหาและดำเนินการต่อ
      }
    }
    
    res.json({
      success: true,
      message: `สร้าง ${createdOrders.length} ออเดอร์สำเร็จ`,
      orders: createdOrders
    });
  } catch (error) {
    console.error('Error creating bulk orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างออเดอร์',
      error: (error as Error).message
    });
  }
});

export default router;