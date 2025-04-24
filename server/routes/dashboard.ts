import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { db, pool } from '../db';
import { eq, sql, desc, and, gte, lt, count, asc } from 'drizzle-orm';
import { orders, customers, users } from '@shared/schema';
import { format, subDays, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { auth } from '../auth';

const router = express.Router();

/**
 * API สำหรับดึงข้อมูลสรุปสำหรับหน้า Dashboard
 * - ยอดขายวันนี้
 * - ยอดขายเดือนนี้
 * - ยอดขายย้อนหลัง 7 วัน
 * - คำสั่งซื้อล่าสุด
 * - สถิติการจัดส่ง
 */
router.get('/summary', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    // สร้าง SQL ด้วย raw queries แทนการใช้ ORM
    
    // 1. ดึงยอดขายวันนี้
    const todayStart = startOfDay(new Date());
    const todayQuery = `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE user_id = $1
        AND created_at >= $2
    `;
    const todayResult = await pool.query(todayQuery, [
      userId,
      todayStart
    ]);
    const todayTotal = parseFloat(todayResult.rows[0]?.total || '0');
    
    // 2. ดึงยอดขายเดือนนี้
    const monthStart = startOfMonth(new Date());
    const monthQuery = `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE user_id = $1
        AND created_at >= $2
    `;
    const monthResult = await pool.query(monthQuery, [
      userId,
      monthStart
    ]);
    const monthTotal = parseFloat(monthResult.rows[0]?.total || '0');
    
    // 3. ดึงยอดขายย้อนหลัง 7 วัน
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daySalesQuery = `
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE user_id = $1
          AND created_at >= $2
          AND created_at < $3
      `;
      const daySalesResult = await pool.query(daySalesQuery, [
        userId,
        dayStart,
        nextDay
      ]);
      
      last7Days.push({
        date: format(day, 'yyyy-MM-dd'),
        total: parseFloat(daySalesResult.rows[0]?.total || '0')
      });
    }
    
    // 4. ดึงคำสั่งซื้อล่าสุดที่รอดำเนินการ (สถานะ pending) 5 รายการ
    const latestOrdersQuery = `
      SELECT id, order_number, total_amount, created_at, status, customer_id
      FROM orders
      WHERE user_id = $1
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const latestOrdersResult = await pool.query(latestOrdersQuery, [userId]);
    const ordersResult = latestOrdersResult.rows;
    
    // สร้างรายการคำสั่งซื้อที่แสดงข้อมูลในแดชบอร์ด
    const latestOrders = [];
    for (const order of ordersResult) {
      // กรณีที่ไม่มีผู้รับ ใช้ "ลูกค้า BD" หรือ "ลูกค้า PD" ตามคำนำหน้า Order Number
      let orderPrefix = order.order_number ? order.order_number.substring(0, 2) : "BD";
      let customerName = `ลูกค้า ${orderPrefix}`;
      
      // ถ้ามี customerId ให้ค้นหาข้อมูลลูกค้า
      if (order.customer_id) {
        const customerQuery = `
          SELECT name FROM customers
          WHERE id = $1
          LIMIT 1
        `;
        const customerResult = await pool.query(customerQuery, [order.customer_id]);
        
        if (customerResult.rows.length > 0) {
          customerName = customerResult.rows[0].name;
        }
      }
      
      latestOrders.push({
        id: order.order_number || order.id.toString(),
        customer: customerName,
        total: parseFloat(order.total_amount),
        date: order.created_at?.toISOString() || new Date().toISOString(),
        status: order.status
      });
    }
    
    // 5. สถิติเพิ่มเติม - ยอดคำสั่งซื้อทั้งหมด
    const totalOrdersQuery = `
      SELECT COUNT(*) as count
      FROM orders
      WHERE user_id = $1
    `;
    const totalOrdersResult = await pool.query(totalOrdersQuery, [userId]);
    const totalOrdersCount = parseInt(totalOrdersResult.rows[0].count);
    
    // 6. จำนวนคำสั่งซื้อตามสถานะ
    const orderStatusCounts: Record<string, number> = {};
    
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (const status of statuses) {
      const statusCountQuery = `
        SELECT COUNT(*) as count
        FROM orders
        WHERE user_id = $1
          AND status = $2
      `;
      const statusCountResult = await pool.query(statusCountQuery, [userId, status]);
      
      orderStatusCounts[status] = parseInt(statusCountResult.rows[0].count);
    }
    
    // 7. ค่าจัดส่งทั้งหมดเดือนนี้
    const monthShippingQuery = `
      SELECT COALESCE(SUM(shipping_cost), 0) as total
      FROM orders
      WHERE user_id = $1
        AND created_at >= $2
    `;
    const monthShippingResult = await pool.query(monthShippingQuery, [
      userId,
      monthStart
    ]);
    const monthShippingTotal = parseFloat(monthShippingResult.rows[0]?.total || '0');
    
    // ส่งข้อมูลทั้งหมดกลับไป
    res.json({
      success: true,
      data: {
        todayTotal,
        monthTotal,
        totalOrdersCount,
        orderStatusCounts,
        monthShippingTotal,
        last7Days,
        latestOrders
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้',
      error: (error as Error).message 
    });
  }
});

export default router;