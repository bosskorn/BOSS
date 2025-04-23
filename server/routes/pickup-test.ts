import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { auth } from '../auth';
import { users, pickupRequests } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { flashExpressPickupRequest } from '../services/flash-express-pickup';

const router = express.Router();

// API เฉพาะเพื่อทดสอบการเรียกรถโดยไม่ผูกกับออเดอร์จริง
router.post('/test-pickup-call', auth, async (req: Request, res: Response) => {
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
    const { trackingNumber, requestDate: customRequestDate, notes } = req.body;

    // หากไม่มีเลขพัสดุ ให้ใช้อาร์เรย์ว่าง
    const trackingNumberArray = trackingNumber ? [trackingNumber] : [];

    // เวลาปัจจุบัน
    const currentDate = new Date();
    const defaultRequestDate = new Date();
    defaultRequestDate.setDate(currentDate.getDate() + 1); // ค่าเริ่มต้นเป็นวันพรุ่งนี้

    // ถ้ามีการระบุวันที่เรียกรถเข้ามา ให้ใช้วันที่ที่ระบุแทน
    const finalRequestDate = customRequestDate ? new Date(customRequestDate) : defaultRequestDate;

    // กำหนดช่วงเวลาเข้ารับพัสดุ
    const requestTimeSlot = "09:00-12:00";

    // สร้างเลขอ้างอิงการเรียกรถ
    const requestId = `TEST${Date.now()}`;

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
      notes: notes || 'ทดสอบการเรียกรถ',
      userId
    };

    // บันทึกข้อมูลลงฐานข้อมูล
    await db.insert(pickupRequests).values([pickupRequestData]);

    try {
      // ส่งคำขอเรียกรถไปที่ Flash Express
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
    console.error('Error creating test pickup request:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกคำขอเรียกรถเข้ารับพัสดุ',
      error: error.message
    });
  }
});

export default router;