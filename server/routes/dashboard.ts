import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { eq, sql, desc, and, gte, lt, count } from 'drizzle-orm';
import { orders, customers, users } from '@shared/schema';
import { format, subDays, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { auth } from '../middleware/auth';

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
    
    // 1. ดึงยอดขายวันนี้
    const todayStart = startOfDay(new Date());
    const todaySales = await db.select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as('total')
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        gte(orders.createdAt, todayStart)
      )
    );
    
    const todayTotal = todaySales[0]?.total || 0;
    
    // 2. ดึงยอดขายเดือนนี้
    const monthStart = startOfMonth(new Date());
    const monthSales = await db.select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as('total')
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        gte(orders.createdAt, monthStart)
      )
    );
    
    const monthTotal = monthSales[0]?.total || 0;
    
    // 3. ดึงยอดขายย้อนหลัง 7 วัน
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daySales = await db.select({
        total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as('total')
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          gte(orders.createdAt, dayStart),
          lt(orders.createdAt, nextDay)
        )
      );
      
      last7Days.push({
        date: format(day, 'yyyy-MM-dd'),
        total: Number(daySales[0]?.total) || 0
      });
    }
    
    // 4. ดึงคำสั่งซื้อล่าสุดที่รอดำเนินการ (สถานะ pending) 5 รายการ พร้อมข้อมูลลูกค้า
    const ordersResult = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      status: orders.status,
      customerId: orders.customerId
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, 'pending')
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(5);
    
    // สร้างรายการคำสั่งซื้อที่แสดงข้อมูลในแดชบอร์ด
    const latestOrders = [];
    for (const order of ordersResult) {
      // กรณีที่ไม่มีผู้รับ ใช้ "ลูกค้า BD" หรือ "ลูกค้า PD" ตามคำนำหน้า Order Number
      let orderPrefix = order.orderNumber ? order.orderNumber.substring(0, 2) : "BD";
      let customerName = `ลูกค้า ${orderPrefix}`;
      
      // ถ้ามี customerId ให้ค้นหาข้อมูลลูกค้า
      if (order.customerId) {
        const customerResult = await db.select({
          name: customers.name
        })
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .limit(1);
        
        if (customerResult.length > 0) {
          customerName = customerResult[0].name;
        }
      }
      
      latestOrders.push({
        id: order.orderNumber || order.id.toString(),
        customer: customerName,
        total: Number(order.totalAmount),
        date: order.createdAt?.toISOString() || new Date().toISOString(),
        status: order.status
      });
    }
    
    // 5. สถิติเพิ่มเติม - ยอดคำสั่งซื้อทั้งหมด
    const totalOrdersCount = await db.select({
      count: count(orders.id)
    })
    .from(orders)
    .where(eq(orders.userId, userId));
    
    // 6. จำนวนคำสั่งซื้อตามสถานะ
    const orderStatusCounts = {};
    
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (const status of statuses) {
      const statusCount = await db.select({
        count: count(orders.id)
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, status)
      ));
      
      orderStatusCounts[status] = statusCount[0].count;
    }
    
    // 7. ค่าจัดส่งทั้งหมดเดือนนี้
    const shippingCosts = await db.select({
      total: sql<number>`COALESCE(SUM(${orders.shippingCost}), 0)`.as('total')
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        gte(orders.createdAt, monthStart)
      )
    );
    
    const monthShippingTotal = shippingCosts[0]?.total || 0;
    
    // ส่งข้อมูลทั้งหมดกลับไป
    res.json({
      success: true,
      data: {
        todayTotal: Number(todayTotal),
        monthTotal: Number(monthTotal),
        totalOrdersCount: totalOrdersCount[0].count,
        orderStatusCounts,
        monthShippingTotal: Number(monthShippingTotal),
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
