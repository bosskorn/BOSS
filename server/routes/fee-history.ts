import { Router } from 'express';
import { db } from '../db';
import { auth } from '../middleware/auth';
import { feeHistory } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

const router = Router();

// ดึงประวัติค่าธรรมเนียมของผู้ใช้
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
      });
    }

    // ดึงประวัติค่าธรรมเนียมของผู้ใช้ เรียงจากใหม่ไปเก่า
    const feeHistoryList = await db
      .select()
      .from(feeHistory)
      .where(eq(feeHistory.userId, req.user.id))
      .orderBy(desc(feeHistory.createdAt));

    // ส่งข้อมูลกลับไปยังผู้ใช้
    res.json({
      success: true,
      data: feeHistoryList
    });
  } catch (error) {
    console.error('Error fetching fee history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติค่าธรรมเนียม'
    });
  }
});

// ดึงประวัติค่าธรรมเนียมตาม ID
router.get('/:id', auth, async (req, res) => {
  try {
    const feeId = parseInt(req.params.id, 10);
    if (isNaN(feeId)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบ ID ไม่ถูกต้อง'
      });
    }

    // ดึงข้อมูลค่าธรรมเนียม
    const [feeHistoryItem] = await db
      .select()
      .from(feeHistory)
      .where(eq(feeHistory.id, feeId));

    if (!feeHistoryItem) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลค่าธรรมเนียมนี้'
      });
    }

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (feeHistoryItem.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
      });
    }

    // ส่งข้อมูลกลับไปยังผู้ใช้
    res.json({
      success: true,
      data: feeHistoryItem
    });
  } catch (error) {
    console.error(`Error fetching fee history ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติค่าธรรมเนียม'
    });
  }
});

export default router;