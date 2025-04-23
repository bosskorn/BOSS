import { Router, Request, Response } from 'express';
import { createHash, createHmac } from 'crypto';

const router = Router();

// ตัวแปรสำหรับการทดสอบ
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID || 'CBE1930';
const API_KEY = process.env.FLASH_EXPRESS_API_KEY || '7b0812f944c8d222fb5b5e08bc7e21983211e212d4153acbe2863b36523eafd2';

// API สำหรับทดสอบลายเซ็นอย่างง่าย
router.get('/test-simple-signature', (req: Request, res: Response) => {
  try {
    console.log('=== ทดสอบลายเซ็นอย่างง่าย ===');
    
    // ข้อมูลสำหรับทดสอบลายเซ็นตามตัวอย่างในเอกสาร Flash Express
    const simpleTestData = {
      mchId: MERCHANT_ID,
      nonceStr: 'yyv6YJP436wCkdpNdghC',
      body: 'test'
    };
    
    console.log('ข้อมูลทดสอบ:', simpleTestData);
    
    // จัดเรียงข้อมูลตามลำดับอักษร ASCII
    const keys = Object.keys(simpleTestData).sort();
    console.log('Keys เรียงตาม ASCII:', keys);
    
    // สร้าง stringA (key=value แล้วเชื่อมด้วย &)
    const stringA = keys.map(key => `${key}=${simpleTestData[key as keyof typeof simpleTestData]}`).join('&');
    console.log('stringA:', stringA);
    
    // สร้าง stringSignTemp ด้วยการเติม &key=API_KEY
    const stringSignTemp = `${stringA}&key=${API_KEY}`;
    console.log('stringSignTemp:', stringSignTemp);
    
    // ใช้ SHA-256 สร้างลายเซ็น
    const sign = createHash('sha256')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
    
    console.log('ลายเซ็นที่ได้ (SHA-256):', sign);
    
    // ทดสอบอีกแบบด้วย HMAC (เผื่อว่า Flash Express ต้องการแบบนี้จริงๆ)
    const sign2 = createHmac('sha256', API_KEY)
      .update(stringA)
      .digest('hex')
      .toUpperCase();
    
    console.log('ลายเซ็นแบบ HMAC:', sign2);
    console.log('=== จบการทดสอบลายเซ็น ===');
    
    // ส่งผลลัพธ์กลับไป
    res.json({
      success: true,
      message: 'ผลการทดสอบลายเซ็นอย่างง่าย',
      data: {
        testData: simpleTestData,
        stringA,
        stringSignTemp,
        signature: sign,
        hmacSignature: sign2,
        merchantId: MERCHANT_ID,
        apiKeyFirstChars: API_KEY ? API_KEY.substring(0, 5) + '...' : 'ไม่ได้กำหนด'
      }
    });
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบลายเซ็น:', error);
    res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาด: ${error.message}`,
      error: error.stack
    });
  }
});

export default router;