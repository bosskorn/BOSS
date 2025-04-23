import { Router, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';

const router = Router();
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com/open';

// ฟังก์ชันสร้างลายเซ็น
function createSignature(params: Record<string, any>, apiKey: string): string {
  // คัดลอกพารามิเตอร์ทั้งหมดเพื่อสร้าง signature
  const paramsForSign = { ...params };
  
  // ลบฟิลด์ที่ไม่ต้องใช้ในการสร้าง signature
  delete paramsForSign.sign;
  
  // เรียงฟิลด์ตามรหัส ASCII
  const sortedKeys = Object.keys(paramsForSign).sort();
  
  // สร้าง string จากชื่อและค่าของทุกฟิลด์ที่เรียงลำดับแล้ว
  let signString = '';
  
  for (const key of sortedKeys) {
    const value = paramsForSign[key];
    
    // ข้ามฟิลด์ที่เป็น undefined หรือ null
    if (value === undefined || value === null) {
      continue;
    }
    
    // ข้ามฟิลด์ที่เป็นชื่อที่ขึ้นต้นด้วยเครื่องหมาย @ (ตามข้อกำหนดของ API)
    if (key.startsWith('@')) {
      continue;
    }
    
    // เพิ่มชื่อฟิลด์และค่าลงใน string
    signString += key + value;
  }
  
  // เพิ่ม API Key ต่อท้าย
  signString += apiKey;
  
  // สร้าง signature ด้วย SHA-256
  return crypto.createHash('sha256').update(signString).digest('hex').toUpperCase();
}

// เส้นทางสำหรับทดสอบการสร้างออเดอร์ใหม่
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    // ตัวอย่างข้อมูลจาก user ที่สมบูรณ์
    const testData = {
      // ข้อมูลพื้นฐานตามตัวอย่าง API
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: Date.now().toString(),
      outTradeNo: `TEST${Date.now()}`,
      warehouseNo: `${process.env.FLASH_EXPRESS_MERCHANT_ID}_001`,
      
      // ข้อมูลผู้ส่ง
      srcName: 'หอมรวม create order test name',
      srcPhone: '0899999999',
      srcProvinceName: 'อุบลราชธานี',
      srcCityName: 'เมืองอุบลราชธานี',
      srcDistrictName: 'ในเมือง',
      srcPostalCode: '34000',
      srcDetailAddress: 'ที่อยู่ทดสอบต้นทาง',
      
      // ข้อมูลผู้รับ
      dstName: 'น้ำพริกแม่อำพร',
      dstPhone: '0888888888',
      dstHomePhone: '0888888888',
      dstProvinceName: 'เชียงใหม่',
      dstCityName: 'สันทราย',
      dstDistrictName: 'สันพระเนตร',
      dstPostalCode: '50210',
      dstDetailAddress: 'ที่อยู่ทดสอบปลายทาง',
      
      // ข้อมูลการคืนพัสดุ
      returnName: 'น้ำพริกแม่อำพร',
      returnPhone: '0899999999',
      returnProvinceName: 'อุบลราชธานี',
      returnCityName: 'เมืองอุบลราชธานี',
      returnPostalCode: '34000',
      returnDetailAddress: 'ที่อยู่ทดสอบการคืน',
      
      // ข้อมูลพัสดุและประเภทการจัดส่ง
      articleCategory: 1,
      expressCategory: 1,
      weight: 1000,
      
      // ข้อมูลประกัน
      insured: 1,
      insureDeclareValue: 10000,
      opdInsureEnabled: 1,
      
      // ข้อมูล COD
      codEnabled: 1,
      codAmount: 10000,
      
      // ข้อมูลพัสดุย่อย
      subParcelQuantity: 2,
      subParcel: [
        {
          outTradeNo: `TEST${Date.now()}1`,
          weight: 500,
          width: 20,
          length: 30,
          height: 10,
          remark: "กล่องที่ 1"
        },
        {
          outTradeNo: `TEST${Date.now()}2`,
          weight: 500,
          width: 15,
          length: 25,
          height: 10,
          remark: "กล่องที่ 2"
        }
      ],
      
      // ข้อมูลสินค้า
      subItemTypes: [
        {
          itemName: "น้ำพริกเผา",
          itemWeightSize: "15*25*10 0.5Kg",
          itemColor: "แดง",
          itemQuantity: "5"
        },
        {
          itemName: "น้ำพริกตาแดง",
          itemWeightSize: "20*30*10 0.5Kg",
          itemColor: "เหลือง",
          itemQuantity: "3"
        }
      ],
      
      // หมายเหตุ
      remark: "ขึ้นบันได"
    };

    // แปลง subParcel และ subItemTypes เป็น JSON string
    const params = {
      ...testData,
      subParcel: JSON.stringify(testData.subParcel),
      subItemTypes: JSON.stringify(testData.subItemTypes)
    };

    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;

    console.log('Test params to Flash Express API:', JSON.stringify(params, null, 2));

    // ส่งคำขอไปยัง Flash Express API
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v3/orders`;
    console.log('POST request to Flash Express API (test):', apiUrl);

    try {
      // ส่งคำขอไปยัง Flash Express API แบบ x-www-form-urlencoded
      const response = await axios.post(apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      console.log('Flash Express API test response:', response.data);

      return res.json({
        success: true,
        message: 'ส่งข้อมูลทดสอบสำเร็จ',
        request: params,
        response: response.data
      });
    } catch (apiError: any) {
      console.error('Error from Flash Express API test:', apiError.response?.data || apiError.message);

      return res.status(400).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการทดสอบ API',
        request: params,
        error: apiError.response?.data || apiError.message
      });
    }
  } catch (error: any) {
    console.error('Error testing Flash Express API:', error);

    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการทดสอบ',
      error: error.message
    });
  }
});

export default router;