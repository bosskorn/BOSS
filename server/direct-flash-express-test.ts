/**
 * ไฟล์ทดสอบการเชื่อมต่อกับ Flash Express API โดยตรง
 * โดยไม่ผ่านเลเยอร์ของเรา เพื่อระบุจุดที่เกิดปัญหา
 */

import axios from 'axios';
import crypto from 'crypto';

const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// ตรวจสอบค่า API KEY ที่ใช้
console.log('Flash Express Merchant ID:', FLASH_EXPRESS_MERCHANT_ID);
console.log('Flash Express API Key (บางส่วน):', FLASH_EXPRESS_API_KEY ? `${FLASH_EXPRESS_API_KEY.substring(0, 5)}...${FLASH_EXPRESS_API_KEY.substring(FLASH_EXPRESS_API_KEY.length - 5)}` : 'ไม่พบ API Key');

// ฟังก์ชั่นสร้าง nonceStr สำหรับใช้ในการส่งคำขอไปยัง Flash Express API
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// สร้างลายเซ็นแบบที่ 1 - รูปแบบมาตรฐาน ค่าที่ไม่ใช่สตริงแปลงเป็นสตริง
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
    
    console.log('สตริงที่ใช้สร้างลายเซ็นแบบที่ 1:', stringToSign);
    
    // คำนวณลายเซ็น SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
    console.log('ลายเซ็นแบบที่ 1:', signature);
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// สร้างลายเซ็นแบบที่ 2 - ค่าตัวเลขคงเป็นตัวเลข ไม่แปลงเป็นสตริง
function generateFlashSignatureV2(params: Record<string, any>, apiKey: string): string {
  try {
    // เรียงลำดับคีย์ตามตัวอักษร (ASCII)
    const sortedKeys = Object.keys(params).sort();
    
    // สร้างสตริงสำหรับลายเซ็น
    const paramPairs: string[] = [];
    for (const key of sortedKeys) {
      // ข้ามค่า null, undefined
      if (params[key] === null || params[key] === undefined) continue;
      
      // เก็บค่าตัวเลขไว้เป็นตัวเลข ไม่แปลงเป็นสตริง
      paramPairs.push(`${key}=${params[key]}`);
    }
    
    // รวมเป็นสตริงเดียว แล้วเพิ่ม API key ที่ท้าย
    const stringToSign = `${paramPairs.join('&')}&key=${apiKey}`;
    
    console.log('สตริงที่ใช้สร้างลายเซ็นแบบที่ 2:', stringToSign);
    
    // คำนวณลายเซ็น SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
    console.log('ลายเซ็นแบบที่ 2:', signature);
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// สร้างลายเซ็นแบบที่ 3 - ใช้ URL encoding กับค่าก่อนสร้างลายเซ็น
function generateFlashSignatureV3(params: Record<string, any>, apiKey: string): string {
  try {
    // เรียงลำดับคีย์ตามตัวอักษร (ASCII)
    const sortedKeys = Object.keys(params).sort();
    
    // สร้างสตริงสำหรับลายเซ็น
    const paramPairs: string[] = [];
    for (const key of sortedKeys) {
      // ข้ามค่า null, undefined
      if (params[key] === null || params[key] === undefined) continue;
      
      // ใช้ URL encoding
      paramPairs.push(`${key}=${encodeURIComponent(String(params[key]))}`);
    }
    
    // รวมเป็นสตริงเดียว แล้วเพิ่ม API key ที่ท้าย
    const stringToSign = `${paramPairs.join('&')}&key=${apiKey}`;
    
    console.log('สตริงที่ใช้สร้างลายเซ็นแบบที่ 3:', stringToSign);
    
    // คำนวณลายเซ็น SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
    console.log('ลายเซ็นแบบที่ 3:', signature);
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ทดสอบโดยตรงกับ API ของ Flash Express
async function testDirectAPICall() {
  console.log('=== ทดสอบการเรียก Flash Express API โดยตรง ===');

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
    
    // ข้อมูลตัวอย่าง
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
      srcDistrictName: "จรเข้บัว",
      srcPostalCode: "10230",
      srcDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      
      // ข้อมูลผู้รับ
      dstName: "คุณ เกศมณี",
      dstPhone: "0909805835",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "ลาดพร้าว",
      dstDistrictName: "ลาดพร้าว",
      dstPostalCode: "10230",
      dstDetailAddress: "443 ถ.สุคนธสวัสดิ์ ซ.สุคนธสวัสดิ์ 27",
      
      // ข้อมูลพัสดุ
      articleCategory: 1,
      expressCategory: 1,
      parcelKind: 1,
      weight: 1000,
      width: "20",
      height: "15",
      length: "25",
      insured: 0,
      codEnabled: 0
    };

    console.log('ข้อมูลที่จะส่งไปยัง Flash Express API (ก่อนสร้างลายเซ็น):', JSON.stringify(requestData, null, 2));
    
    // ทำสำเนาข้อมูลสำหรับคำนวณลายเซ็น
    const signParams = { ...requestData };
    
    // สร้างลายเซ็นทั้ง 3 แบบ
    console.log('\n=== เปรียบเทียบ 3 รูปแบบการสร้างลายเซ็น ===');
    const signature1 = generateFlashSignature(signParams, FLASH_EXPRESS_API_KEY);
    const signature2 = generateFlashSignatureV2(signParams, FLASH_EXPRESS_API_KEY);
    const signature3 = generateFlashSignatureV3(signParams, FLASH_EXPRESS_API_KEY);
    
    // เลือกใช้ลายเซ็นแบบที่ 1 (แบบดั้งเดิม)
    console.log('\n=== ใช้ลายเซ็นแบบที่ 1 สำหรับการทดสอบ ===');
    
    // เพิ่มลายเซ็นและ subItemTypes
    const finalPayload = {
      ...requestData,
      sign: signature1,
      subItemTypes: JSON.stringify([{
        itemName: "สินค้าทดสอบ", 
        itemWeightSize: "1Kg",
        itemColor: "-",
        itemQuantity: 1
      }])
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
    console.log('Flash Express API Response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.code === 1) {
      console.log(`✅ สร้างการจัดส่งสำเร็จ: trackingNumber = ${response.data.data.pno}, sortCode = ${response.data.data.sortCode}`);
    } else {
      console.log(`❌ การเรียก API ไม่สำเร็จ: ${response.data ? response.data.message : 'ไม่มีข้อมูลตอบกลับ'}`);
    }

  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบโดยตรง:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// รันการทดสอบโดยตรง
testDirectAPICall()
  .then(() => console.log('=== เสร็จสิ้นการทดสอบ Flash Express API โดยตรง ==='))
  .catch(err => console.error('=== เกิดข้อผิดพลาดในการทดสอบ ===', err));