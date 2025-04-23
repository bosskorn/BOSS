import { Router, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { auth } from '../auth';

const router = Router();

// ค่าคงที่สำหรับ Flash Express API
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID || "CBE1930";
const API_KEY = process.env.FLASH_EXPRESS_API_KEY;
const BASE_URL = 'https://open-api.flashexpress.com/open';

// ฟังก์ชันสำหรับสร้างลายเซ็นดิจิตอล (signature) สำหรับ Flash Express API
function createSignature(params: Record<string, any>): string {
  // 1. เรียงพารามิเตอร์ตามรหัส ASCII
  const sortedParams = Object.keys(params).sort().reduce(
    (result: Record<string, any>, key: string) => {
      result[key] = params[key];
      return result;
    }, 
    {}
  );

  // 2. แปลงเป็น URL-encoded string
  const queryString = Object.entries(sortedParams)
    .map(([key, value]) => {
      // ละเว้นค่าว่างหรือ undefined
      if (value === undefined || value === null || value === '') {
        return null;
      }
      
      // แปลง Array เป็น JSON string
      if (Array.isArray(value)) {
        return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      
      // แปลง Object เป็น JSON string
      if (typeof value === 'object') {
        return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      
      // ค่าปกติ
      return `${key}=${encodeURIComponent(value)}`;
    })
    .filter(Boolean) // กรองค่า null ออก
    .join('&');

  // 3. เพิ่ม API key และสร้างลายเซ็นด้วย SHA-256
  if (!API_KEY) {
    throw new Error('FLASH_EXPRESS_API_KEY ไม่ได้ถูกกำหนดไว้');
  }

  const dataToSign = queryString + API_KEY;
  const signature = crypto.createHash('sha256').update(dataToSign).digest('hex');
  
  console.log('Query string for signature:', queryString);
  console.log('Signature generated:', signature);
  
  return signature.toUpperCase();
}

// ทดสอบการสร้างออเดอร์แบบใหม่
router.post('/test-order-v2', auth, async (req: Request, res: Response) => {
  try {
    console.log('ทดสอบการสร้างออเดอร์ Flash Express รูปแบบใหม่');
    
    // 1. สร้างข้อมูลสำหรับส่งไปยัง Flash Express API ตามเอกสารอย่างเคร่งครัด
    const nonceStr = Date.now().toString();
    const outTradeNo = `SS${Date.now()}`;
    
    // สร้างข้อมูลสินค้า subItemTypes เป็น array และ stringify
    const subItemTypesArray = [
      {
        itemName: 'สินค้าทดสอบ',
        itemQuantity: 1
      }
    ];
    
    // แปลงเป็น JSON string เตรียมส่งเข้า Flash Express API
    const subItemTypesStr = JSON.stringify(subItemTypesArray);
    
    // 2. จัดโครงสร้างข้อมูลตามเอกสาร Flash Express API อย่างเคร่งครัด
    const params: Record<string, any> = {
      // ข้อมูลการยืนยัน
      mchId: MERCHANT_ID, // ใช้ mchId ตามเอกสาร Flash Express
      nonceStr: nonceStr,
      
      // ข้อมูลเลขออเดอร์
      outTradeNo: outTradeNo,
      
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
      expressCategory: 1, // 1 = ธรรมดา (ตามเอกสาร Flash Express)
      articleCategory: 99, // 99 = อื่นๆ (ตามเอกสาร Flash Express)
      
      // ข้อมูลขนาดและน้ำหนัก
      weight: 1000, // น้ำหนักในหน่วยกรัม (1 kg = 1000 g)
      width: 20,
      length: 30,
      height: 10,
      
      // ข้อมูลอื่นๆ ที่อาจจำเป็น
      settlementType: 1, // 1 = ผู้ส่งเป็นผู้ชำระ
      payType: 1, // เพิ่ม payType ด้วย
      insured: 0, // ไม่มีประกัน
      codEnabled: 0, // ไม่มี COD
      
      // ข้อมูลสินค้า (JSON string)
      subItemTypes: subItemTypesStr,
      
      // ข้อมูลเพิ่มเติม (ถ้ามี)
      itemCategory: 100 // 100 = อื่นๆ ตามที่ผู้ใช้ระบุ
    };
    
    // 3. สร้างลายเซ็นและเพิ่มเข้าไปในข้อมูล
    const signature = createSignature(params);
    params.sign = signature;
    
    console.log('ส่งข้อมูลไปยัง Flash Express API:', JSON.stringify(params, null, 2));
    
    // 4. แปลงข้อมูลเป็นรูปแบบ form-urlencoded ตามที่ Flash Express API ต้องการ
    const formData = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    console.log('URLSearchParams:', formData.toString());
    
    // 5. ส่งคำขอไปยัง Flash Express API ในรูปแบบที่ถูกต้อง
    const response = await axios.post(`${BASE_URL}/v3/orders`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    console.log('Flash Express API response:', response.data);
    
    // 6. ตรวจสอบผลลัพธ์และส่งกลับให้ผู้ใช้
    if (response.data.msg === 'success' && response.data.pno) {
      return res.json({
        success: true,
        message: 'สร้างเลขพัสดุสำเร็จ',
        trackingNumber: response.data.pno,
        sortCode: response.data.sortingCode || '00',
        data: response.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `มีข้อผิดพลาดจาก Flash Express: ${response.data.msg || 'ไม่ทราบสาเหตุ'}`,
        errorCode: response.data.code || 'UNKNOWN',
        response: response.data
      });
    }
    
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบสร้างออเดอร์ Flash Express:', error);
    
    let errorMessage = 'ไม่สามารถสร้างออเดอร์ได้';
    let errorDetails = '';
    
    if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.msg || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
      errorDetails = JSON.stringify(error.response.data, null, 2);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: errorDetails || error.toString(),
      response: error.response?.data || null
    });
  }
});

// สำหรับตรวจสอบ API key และลายเซ็น
router.get('/check-credentials', auth, async (req: Request, res: Response) => {
  try {
    // ตรวจสอบว่ามี API key หรือไม่
    if (!API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'ยังไม่ได้กำหนดค่า FLASH_EXPRESS_API_KEY'
      });
    }
    
    // ทดสอบสร้างลายเซ็นอย่างง่าย
    const testData = {
      mchId: MERCHANT_ID,
      nonceStr: Date.now().toString(),
      test: 'data'
    };
    
    const signature = createSignature(testData);
    
    return res.json({
      success: true,
      message: 'พบค่า API key และสามารถสร้างลายเซ็นได้',
      merchantId: MERCHANT_ID,
      apiKeyConfigured: !!API_KEY,
      testSignature: signature
    });
    
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบ credentials:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ credentials',
      error: error.message
    });
  }
});

export default router;