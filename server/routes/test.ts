import { Router } from 'express';
import { auth } from '../middleware/auth';
import { createFlashExpressShipping } from '../services/flash-express';

const router = Router();

// API สำหรับทดสอบการสร้างเลขพัสดุจาก Flash Express API
router.post('/test-flash-express', async (req, res) => {
  try {
    const { 
      orderNumber,
      senderInfo,
      recipientInfo,
      parcelInfo,
      isCOD,
      codAmount
    } = req.body;

    console.log('ทดสอบสร้างเลขพัสดุด้วยข้อมูล:', JSON.stringify(req.body, null, 2));

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ Flash Express API ต้องการ
    const flashExpressRequestData = {
      outTradeNo: orderNumber,
      srcName: senderInfo.name,
      srcPhone: senderInfo.phone,
      srcProvinceName: senderInfo.province,
      srcCityName: senderInfo.district,
      srcDistrictName: senderInfo.subdistrict,
      srcPostalCode: senderInfo.zipcode,
      srcDetailAddress: senderInfo.address,
      dstName: recipientInfo.name,
      dstPhone: recipientInfo.phone,
      dstProvinceName: recipientInfo.province,
      dstCityName: recipientInfo.district,
      dstDistrictName: recipientInfo.subdistrict,
      dstPostalCode: recipientInfo.zipcode,
      dstDetailAddress: recipientInfo.address,
      articleCategory: 1,  // 1: เสื้อผ้า, 2: อิเล็กทรอนิกส์, 3: เอกสาร, 4: อื่นๆ
      expressCategory: 1,  // 1: ปกติ, 2: ด่วน
      weight: parseFloat(parcelInfo.weight) * 1000,  // แปลงเป็นกรัม
      width: parseFloat(parcelInfo.width),
      length: parseFloat(parcelInfo.length),
      height: parseFloat(parcelInfo.height),
      insured: 0,  // ไม่ซื้อประกัน
      codEnabled: isCOD ? 1 : 0,
      codAmount: isCOD ? codAmount * 100 : undefined,  // แปลงเป็นสตางค์
      subItemTypes: isCOD ? [
        { 
          itemName: "สินค้าทดสอบ", 
          itemQuantity: 1 
        }
      ] : undefined
    };

    // เรียกใช้ Flash Express API
    const flashExpressResponse = await createFlashExpressShipping(flashExpressRequestData);

    console.log('ผลการทดสอบ Flash Express API:', JSON.stringify(flashExpressResponse, null, 2));

    return res.json({
      success: true,
      result: flashExpressResponse
    });
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ Flash Express API:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการทดสอบ'
    });
  }
});

export default router;