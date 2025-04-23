import { Router, Request, Response } from 'express';
import { createFlashOrder } from '../services/flash-express';
import { auth } from '../auth';

const router = Router();

// Endpoint สำหรับทดสอบการสร้างออเดอร์ Flash Express โดยตรงจากข้อมูลทดสอบ
router.post('/test-create-order', auth, async (req: Request, res: Response) => {
  try {
    console.log('ทดสอบการสร้างออเดอร์ Flash Express จากข้อมูลทดสอบ');
    
    // ข้อมูลทดสอบสำหรับ Flash Express API
    const testOrderData = {
      // ข้อมูลผู้ส่ง
      srcName: "กรธนภัทร นาคคงคำ", 
      srcPhone: "0829327325",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "ลาดพร้าว",
      srcDistrictName: "จรเข้บัว",
      srcPostalCode: "10230",
      srcDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      
      // ข้อมูลผู้รับ (ใช้ข้อมูลเดียวกับผู้ส่งเพื่อทดสอบ)
      dstName: "กรธนภัทร นาคคงคำ",
      dstPhone: "0829327325",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "ลาดพร้าว",
      dstDistrictName: "จรเข้บัว",
      dstPostalCode: "10230",
      dstDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      
      // ข้อมูลพัสดุ
      weight: 1,
      merchantID: "711296",
      codEnabled: 0,
      insured: 0,
      opdInsureEnabled: 0,
      
      // ข้อมูลประเภทพัสดุและบริการ (ฟิลด์ที่จำเป็นต้องมี)
      expressCategory: 1, // 1 = ธรรมดา (ตามเอกสาร Flash Express)
      articleCategory: 1, // 1 = สินค้าทั่วไป
      
      // ข้อมูลการชำระเงิน
      settlementType: 1, // 1 = ผู้ส่งเป็นผู้ชำระ
      payType: 1, // เพิ่ม payType ด้วย
      
      // ข้อมูลสินค้า
      itemCategory: 1,
      subItemTypes: [{itemName: "สินค้า", itemQuantity: 1}]
    };
    
    console.log('ส่งข้อมูลทดสอบไปยัง Flash Express API:', JSON.stringify(testOrderData, null, 2));
    
    // เรียกใช้ service เพื่อสร้างออเดอร์
    const result = await createFlashOrder(testOrderData);
    
    console.log('Flash Express API Response (Test):', JSON.stringify(result, null, 2));
    
    // ส่งผลลัพธ์กลับไปยังผู้ใช้
    return res.json({
      success: true,
      message: 'สร้างออเดอร์ Flash Express สำเร็จ',
      trackingNumber: result.pno,
      sortCode: result.sortingCode,
      data: result
    });
    
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบสร้างออเดอร์ Flash Express:', error);
    
    let errorMessage = 'ไม่สามารถสร้างออเดอร์ได้';
    let errorDetails = '';
    
    if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.error_msg || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
      errorDetails = JSON.stringify(error.response.data, null, 2);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: errorDetails || error.toString(),
      originalError: error.response?.data || null
    });
  }
});

export default router;