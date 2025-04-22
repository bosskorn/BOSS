/**
 * ไฟล์ทดสอบการเชื่อมต่อกับ Flash Express API
 * ทดสอบพารามิเตอร์และข้อมูลต่างๆ เพื่อหาจุดที่ทำให้การคำนวณ signature ล้มเหลว
 */

import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// ตรวจสอบค่า API KEY ที่ใช้
console.log('Flash Express Merchant ID:', FLASH_EXPRESS_MERCHANT_ID);
console.log('Flash Express API Key (บางส่วน):', FLASH_EXPRESS_API_KEY ? `${FLASH_EXPRESS_API_KEY.substring(0, 5)}...${FLASH_EXPRESS_API_KEY.substring(FLASH_EXPRESS_API_KEY.length - 5)}` : 'ไม่พบ API Key');

// ฟังก์ชั่นสร้าง nonceStr
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// สร้างลายเซ็นตามแบบมาตรฐาน
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // เรียงลำดับคีย์ตามตัวอักษร (ASCII)
    const sortedKeys = Object.keys(params).sort();
    
    // สร้างสตริงสำหรับลายเซ็น
    const paramPairs: string[] = [];
    for (const key of sortedKeys) {
      // ข้ามค่า null, undefined
      if (params[key] === null || params[key] === undefined) continue;
      
      // แปลงทุกค่าเป็น string
      paramPairs.push(`${key}=${String(params[key])}`);
    }
    
    // รวมเป็นสตริงเดียว แล้วเพิ่ม API key ที่ท้าย
    const stringToSign = `${paramPairs.join('&')}&key=${apiKey}`;
    
    console.log('สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณลายเซ็น SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ทดสอบเรียก API estimate_rate (API ที่ทำงานได้) เพื่อดูรูปแบบการเรียกที่ถูกต้อง
async function testEstimateRateAPI() {
  console.log('\n=== ทดสอบการเรียก API estimate_rate (ที่ทำงานได้) ===');

  try {
    // ตรวจสอบ API credentials
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    // API Endpoint
    const apiUrl = `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`;
    
    // ข้อมูลพื้นฐาน
    const nonceStr = generateNonceStr();
    
    // ข้อมูลตัวอย่าง
    const requestData: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      warehouseNo: `${FLASH_EXPRESS_MERCHANT_ID}_001`,
      
      // ข้อมูลจาก -> ถึง
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "คลองเตย",
      srcPostalCode: "10110",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "พระนคร",
      dstPostalCode: "10200",
      weight: "1000",
    };

    console.log('ข้อมูลที่จะส่งไปยัง API estimate_rate:', JSON.stringify(requestData, null, 2));
    
    // ทำสำเนาข้อมูลสำหรับคำนวณลายเซ็น
    const signParams = { ...requestData };
    
    // สร้างลายเซ็น
    const signature = generateFlashSignature(signParams, FLASH_EXPRESS_API_KEY);

    // เพิ่มลายเซ็น
    const finalPayload = {
      ...requestData,
      sign: signature
    };

    // แปลงเป็น URL-encoded form
    const encodedPayload = new URLSearchParams();
    for (const [key, value] of Object.entries(finalPayload)) {
      encodedPayload.append(key, String(value));
    }

    // กำหนด headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };

    console.log('URL ที่เรียก:', apiUrl);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload.toString());
    
    // เรียก API
    const response = await axios.post(apiUrl, encodedPayload.toString(), { headers });
    console.log('API Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.code === 1) {
      console.log(`✅ API estimate_rate เรียกสำเร็จ!`);
      return true;
    } else {
      console.log(`❌ เรียก API estimate_rate ไม่สำเร็จ: ${response.data ? response.data.message : 'ไม่มีข้อมูลตอบกลับ'}`);
      return false;
    }

  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ API estimate_rate:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// ทดสอบเรียก API orders แบบข้อมูลน้อยที่สุด (Minimal data)
async function testOrdersAPIMinimal() {
  console.log('\n=== ทดสอบการเรียก API orders ด้วยข้อมูลน้อยที่สุด ===');

  try {
    // ตรวจสอบ API credentials
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    // API Endpoint
    const apiUrl = `${FLASH_EXPRESS_API_URL}/open/v3/orders`;
    
    // ข้อมูลพื้นฐาน
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();
    const orderId = `SS${Date.now()}`;
    
    // ข้อมูลแบบน้อยที่สุด (เฉพาะที่จำเป็น)
    const requestData: Record<string, any> = {
      outTradeNo: orderId,
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      warehouseNo: `${FLASH_EXPRESS_MERCHANT_ID}_001`,
      
      // ข้อมูลผู้ส่ง
      srcName: "กรธนภัทร นาคคงคำ",
      srcPhone: "0829327325",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "ลาดพร้าว",
      srcPostalCode: "10230",
      srcDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      
      // ข้อมูลผู้รับ
      dstName: "คุณ เกศมณี",
      dstPhone: "0909805835",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "ลาดพร้าว",
      dstPostalCode: "10230",
      dstDetailAddress: "443 ถ.สุคนธสวัสดิ์ ซ.สุคนธสวัสดิ์ 27",
      
      // ข้อมูลพัสดุขั้นต่ำ
      articleCategory: 1,
      weight: 1000,
      parcelKind: 1,
      expressCategory: 1,
      codEnabled: 0,
      insured: 0, // ระบุชัดเจนว่าไม่มีประกัน
    };

    console.log('ข้อมูลที่จะส่งไปยัง API orders (แบบน้อยที่สุด):', JSON.stringify(requestData, null, 2));
    
    // ทำสำเนาข้อมูลสำหรับคำนวณลายเซ็น
    const signParams = { ...requestData };
    
    // สร้างลายเซ็น
    const signature = generateFlashSignature(signParams, FLASH_EXPRESS_API_KEY);

    // เพิ่มลายเซ็น (ไม่เพิ่ม subItemTypes)
    const finalPayload = {
      ...requestData,
      sign: signature
    };

    // แปลงเป็น URL-encoded form
    const encodedPayload = new URLSearchParams();
    for (const [key, value] of Object.entries(finalPayload)) {
      encodedPayload.append(key, String(value));
    }

    // กำหนด headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };

    console.log('URL ที่เรียก:', apiUrl);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload.toString());
    
    // เรียก API
    const response = await axios.post(apiUrl, encodedPayload.toString(), { headers });
    console.log('API Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.code === 1) {
      console.log(`✅ สร้างการจัดส่งสำเร็จ: trackingNumber = ${response.data.data.pno}, sortCode = ${response.data.data.sortCode}`);
      return true;
    } else {
      console.log(`❌ การเรียก API ไม่สำเร็จ: ${response.data ? response.data.message : 'ไม่มีข้อมูลตอบกลับ'}`);
      return false;
    }

  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// รันการทดสอบทั้งหมด
async function runAllTests() {
  // ทดสอบ API estimate_rate ก่อน เพื่อดูว่าการเรียก API แบบที่ทำงานได้เป็นอย่างไร
  const estimateRateSuccess = await testEstimateRateAPI();
  
  // ทดสอบ API orders แบบข้อมูลน้อยที่สุด
  if (estimateRateSuccess) {
    console.log('\nทดสอบ API estimate_rate สำเร็จ ต่อไปจะทดสอบ API orders แบบข้อมูลน้อยที่สุด...');
    await testOrdersAPIMinimal();
  }
}

// เริ่มการทดสอบ
runAllTests()
  .then(() => console.log('=== เสร็จสิ้นการทดสอบทั้งหมด ==='))
  .catch(err => console.error('=== เกิดข้อผิดพลาดในการทดสอบ ===', err));