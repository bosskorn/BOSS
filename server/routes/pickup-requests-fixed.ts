import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { auth } from '../auth';
import { users, pickupRequests, orders } from '@shared/schema';
import { eq, and, gte, lte, inArray, desc, isNotNull } from 'drizzle-orm';
import { flashExpressPickupRequest } from '../services/flash-express-pickup';

const router = express.Router();

// สร้างคำขอเรียกรถเข้ารับพัสดุแบบอัตโนมัติตามเวลา
router.post('/auto-schedule', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    // ดึงข้อมูลผู้ใช้
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // ข้อมูลคำขอจากคำขอ
    const { date, trackingNumbers, notes } = req.body;

    if (!date || !trackingNumbers || trackingNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุวันที่และเลขพัสดุ' 
      });
    }

    // เวลา Cut-off คือ 10:00 น.
    const currentDate = new Date();
    const requestDate = new Date(date);
    const cutoffTime = new Date(currentDate);
    cutoffTime.setHours(10, 0, 0, 0);

    // ตรวจสอบว่าเวลาปัจจุบันเกินเวลา Cut-off หรือไม่
    // ถ้าเกินเวลา Cut-off ให้เลื่อนวันที่เข้ารับพัสดุเป็นวันถัดไป
    if (currentDate > cutoffTime) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      requestDate.setDate(tomorrow.getDate());
    }

    // กำหนดช่วงเวลาเข้ารับพัสดุ (ใช้ช่วงเวลาตามที่ Flash Express รองรับ)
    const requestTimeSlot = "09:00-12:00"; // สามารถเปลี่ยนเป็นช่วงเวลาอื่นตามต้องการ

    // สร้างเลขอ้างอิงการเรียกรถ
    const requestId = `PICK${Date.now()}`;

    // เตรียมข้อมูลสำหรับบันทึกลงฐานข้อมูล
    const pickupRequestData = {
      requestId,
      provider: 'Flash Express',
      requestDate,
      requestTimeSlot,
      status: "pending" as const,
      trackingNumbers,
      pickupAddress: user.address || '',
      contactName: user.fullname || '',
      contactPhone: user.phone || '',
      notes,
      userId
    };

    // บันทึกข้อมูลลงฐานข้อมูล
    await db.insert(pickupRequests).values([pickupRequestData]);

    // ส่งคำขอเรียกรถไปที่ Flash Express ทันที
    try {
      const pickupResponse = await flashExpressPickupRequest({
        trackingNumbers,
        requestDate,
        requestTimeSlot,
        pickupAddress: user.address || '',
        contactName: user.fullname || '',
        contactPhone: user.phone || '',
        province: user.province || '',
        district: user.district || '',
        subdistrict: user.subdistrict || '',
        zipcode: user.zipcode || '',
      });

      // อัพเดตข้อมูลในฐานข้อมูล
      await db.update(pickupRequests)
        .set({
          status: "requested" as const,
          requestedAt: new Date(),
          responseData: pickupResponse
        })
        .where(eq(pickupRequests.requestId, requestId));

      return res.json({
        success: true,
        message: 'บันทึกคำขอเรียกรถเข้ารับพัสดุสำเร็จและทำการร้องขอแล้ว',
        requestId,
        requestDate,
        trackingNumbers,
        response: pickupResponse
      });
    } catch (apiError: any) {
      console.error('Error requesting pickup from Flash Express:', apiError);

      // อัพเดตข้อมูลในฐานข้อมูลเป็นสถานะล้มเหลว
      await db.update(pickupRequests)
        .set({
          status: "failed" as const,
          notes: `เกิดข้อผิดพลาดในการเรียกรถ: ${apiError.message || 'ไม่ทราบสาเหตุ'}`
        })
        .where(eq(pickupRequests.requestId, requestId));

      return res.status(400).json({
        success: false,
        message: 'บันทึกคำขอเรียกรถสำเร็จแต่เกิดข้อผิดพลาดในการเรียกรถจาก Flash Express',
        error: apiError.message || 'ไม่ทราบสาเหตุ',
        requestId
      });
    }
  } catch (error: any) {
    console.error('Error creating pickup request:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกคำขอเรียกรถเข้ารับพัสดุ',
      error: error.message
    });
  }
});

// ดึงรายการคำขอเรียกรถทั้งหมดของผู้ใช้
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    // ดึงข้อมูลคำขอเรียกรถทั้งหมดของผู้ใช้
    const pickupRequestList = await db.query.pickupRequests.findMany({
      where: eq(pickupRequests.userId, userId),
      orderBy: [desc(pickupRequests.createdAt)]
    });

    return res.json({
      success: true,
      pickupRequests: pickupRequestList
    });
  } catch (error: any) {
    console.error('Error fetching pickup requests:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอเรียกรถ',
      error: error.message
    });
  }
});

// ดึงข้อมูลคำขอเรียกรถตาม ID
router.get('/:requestId', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    const { requestId } = req.params;

    // ดึงข้อมูลคำขอเรียกรถตาม ID
    const pickupRequestData = await db.query.pickupRequests.findFirst({
      where: and(
        eq(pickupRequests.requestId, requestId),
        eq(pickupRequests.userId, userId)
      )
    });

    if (!pickupRequestData) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอเรียกรถ' });
    }

    return res.json({
      success: true,
      pickupRequest: pickupRequestData
    });
  } catch (error: any) {
    console.error('Error fetching pickup request:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอเรียกรถ',
      error: error.message
    });
  }
});

// ยกเลิกคำขอเรียกรถ
router.post('/:requestId/cancel', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    const { requestId } = req.params;

    // ตรวจสอบว่ามีคำขอเรียกรถนี้อยู่หรือไม่
    const pickupRequestData = await db.query.pickupRequests.findFirst({
      where: and(
        eq(pickupRequests.requestId, requestId),
        eq(pickupRequests.userId, userId)
      )
    });

    if (!pickupRequestData) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอเรียกรถ' });
    }

    // ตรวจสอบว่าสถานะเป็น pending หรือ requested เท่านั้น
    if (pickupRequestData.status !== 'pending' && pickupRequestData.status !== 'requested') {
      return res.status(400).json({ 
        success: false, 
        message: 'ไม่สามารถยกเลิกคำขอเรียกรถนี้ได้ เนื่องจากสถานะไม่อยู่ในช่วงที่ยกเลิกได้' 
      });
    }

    // อัพเดตสถานะเป็นล้มเหลว (failed) เมื่อยกเลิก
    await db.update(pickupRequests)
      .set({ 
        status: "failed" as const,
        notes: `ยกเลิกโดยผู้ใช้เมื่อ ${new Date().toISOString()}`
      })
      .where(eq(pickupRequests.requestId, requestId));

    // หากเป็นคำขอที่ส่งไปยัง Flash Express แล้ว ให้ส่งคำขอยกเลิกไปยัง Flash Express API
    // (ส่วนนี้จะต้องเพิ่มการเรียกใช้ API ยกเลิกของ Flash Express)

    return res.json({
      success: true,
      message: 'ยกเลิกคำขอเรียกรถสำเร็จ',
      requestId
    });
  } catch (error: any) {
    console.error('Error cancelling pickup request:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกคำขอเรียกรถ',
      error: error.message
    });
  }
});

// เรียกรถหลังจากสร้างออเดอร์เสร็จแล้ว (เรียกใช้จากส่วนอื่นของระบบ)
router.post('/request-after-order', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    // ดึงข้อมูลผู้ใช้
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    // ข้อมูลคำขอจากคำขอ
    const { orderId, trackingNumber, requestDate: customRequestDate, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุรหัสออเดอร์' 
      });
    }

    // หากไม่มีเลขพัสดุ ให้ใช้อาร์เรย์ว่าง
    const trackingNumberArray = trackingNumber ? [trackingNumber] : [];

    // ดึงข้อมูลออเดอร์ (ถ้ามี)
    let orderNumber = "TEST";
    let order = null;
    
    try {
      order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
      });
      
      if (order) {
        orderNumber = order.orderNumber;
      }
    } catch (error) {
      console.log("ไม่พบออเดอร์ในระบบ หรือเกิดข้อผิดพลาดในการค้นหา ใช้ข้อมูลสำหรับทดสอบแทน");
    }

    // เวลา Cut-off คือ 10:00 น.
    const currentDate = new Date();
    const requestDate = new Date();
    const cutoffTime = new Date(currentDate);
    cutoffTime.setHours(10, 0, 0, 0);

    // ตรวจสอบว่าเวลาปัจจุบันเกินเวลา Cut-off หรือไม่
    // ถ้าเกินเวลา Cut-off ให้เลื่อนวันที่เข้ารับพัสดุเป็นวันถัดไป
    if (currentDate > cutoffTime) {
      requestDate.setDate(currentDate.getDate() + 1);
    }

    // กำหนดช่วงเวลาเข้ารับพัสดุ (ใช้ช่วงเวลาตามที่ Flash Express รองรับ)
    const requestTimeSlot = "09:00-12:00"; // สามารถเปลี่ยนเป็นช่วงเวลาอื่นตามต้องการ

    // สร้างเลขอ้างอิงการเรียกรถ
    const requestId = `PICK${Date.now()}`;

    // ถ้ามีการระบุวันที่เรียกรถเข้ามา ให้ใช้วันที่ที่ระบุแทน
    let finalRequestDate = requestDate;
    if (customRequestDate) {
      finalRequestDate = new Date(customRequestDate);
    }

    // เตรียมข้อมูลสำหรับบันทึกลงฐานข้อมูล
    const pickupRequestData = {
      requestId,
      provider: 'Flash Express',
      requestDate: finalRequestDate,
      requestTimeSlot,
      status: "pending" as const,
      trackingNumbers: trackingNumberArray,
      pickupAddress: user.address || '',
      contactName: user.fullname || '',
      contactPhone: user.phone || '',
      notes: `สร้างอัตโนมัติจาก #${orderNumber}`,
      userId
    };

    // บันทึกข้อมูลลงฐานข้อมูล
    await db.insert(pickupRequests).values([pickupRequestData]);

    // ถ้ามีการระบุหมายเหตุเพิ่มเติม
    let noteText = `สร้างอัตโนมัติจาก #${orderNumber}`;
    if (notes) {
      noteText = notes;
    }
    
    // อัพเดตหมายเหตุในข้อมูลคำขอเรียกรถ
    await db.update(pickupRequests)
      .set({ notes: noteText })
      .where(eq(pickupRequests.requestId, requestId));

    // ส่งคำขอเรียกรถไปที่ Flash Express ทันที
    try {
      const pickupResponse = await flashExpressPickupRequest({
        trackingNumbers: trackingNumberArray,
        requestDate: finalRequestDate,
        requestTimeSlot,
        pickupAddress: user.address || '',
        contactName: user.fullname || '',
        contactPhone: user.phone || '',
        province: user.province || '',
        district: user.district || '',
        subdistrict: user.subdistrict || '',
        zipcode: user.zipcode || '',
      });

      // อัพเดตข้อมูลในฐานข้อมูล
      await db.update(pickupRequests)
        .set({
          status: "requested" as const,
          requestedAt: new Date(),
          responseData: pickupResponse
        })
        .where(eq(pickupRequests.requestId, requestId));

      return res.json({
        success: true,
        message: 'บันทึกคำขอเรียกรถเข้ารับพัสดุสำเร็จและทำการร้องขอแล้ว',
        requestId,
        requestDate: finalRequestDate,
        trackingNumbers: trackingNumberArray,
        response: pickupResponse
      });
    } catch (apiError: any) {
      console.error('Error requesting pickup from Flash Express:', apiError);

      // อัพเดตข้อมูลในฐานข้อมูลเป็นสถานะล้มเหลว
      await db.update(pickupRequests)
        .set({
          status: "failed" as const,
          notes: `เกิดข้อผิดพลาดในการเรียกรถ: ${apiError.message || 'ไม่ทราบสาเหตุ'}`
        })
        .where(eq(pickupRequests.requestId, requestId));

      return res.status(400).json({
        success: false,
        message: 'บันทึกคำขอเรียกรถสำเร็จแต่เกิดข้อผิดพลาดในการเรียกรถจาก Flash Express',
        error: apiError.message || 'ไม่ทราบสาเหตุ',
        requestId
      });
    }
  } catch (error: any) {
    console.error('Error creating pickup request after order:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกคำขอเรียกรถเข้ารับพัสดุ',
      error: error.message
    });
  }
});

export default router;