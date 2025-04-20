/**
 * สคริปต์ทดสอบหา URL ที่ถูกต้องสำหรับ Flash Express API
 * ทดสอบ URL ต่างๆ ที่มีโอกาสถูกต้อง
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID || '';
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY || '';

// รายการ base URL ที่จะทดสอบ
const BASE_URLS = [
  'https://open-api.flashexpress.com',
  'https://open-api.flashexpress.co.th',
  'https://api.flashexpress.com',
  'https://api.flashexpress.co.th',
  'https://openapi.flashexpress.com',
  'https://openapi.flashexpress.co.th'
];

// รายการ endpoint ที่จะทดสอบสำหรับ pricing
const PRICING_ENDPOINTS = [
  '/open/v3/pricing',
  '/open/v2/pricing/calculate',
  '/open/v2/orders/price',
  '/open/v3/orders/price',
  '/open/v1/pricing',
  '/v3/pricing',
  '/v2/pricing/calculate'
];

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ฟังก์ชันสร้างลายเซ็น
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // คัดกรองพารามิเตอร์
    const filteredParams: Record<string, any> = {};
    
    for (const key in params) {
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      if (value === null || value === undefined) continue;
      
      // แปลงค่าเป็นสตริงทั้งหมด
      filteredParams[key] = String(value);
    }
    
    // เรียงลำดับ keys ตาม ASCII
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // สร้างสตริงพารามิเตอร์
    const paramString = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&');
    
    // เพิ่ม API key
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    // คำนวณ SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
      
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ฟังก์ชันทดสอบเรียก API
async function testEndpoint(baseUrl: string, endpoint: string) {
  try {
    // สร้างข้อมูลคำขอ
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    const requestData: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      fromPostalCode: '10110',
      toPostalCode: '10900',
      weight: '1000',
    };
    
    // สร้างลายเซ็น
    const sign = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY);
    
    // เพิ่มลายเซ็นในข้อมูล
    requestData.sign = sign;
    
    // แปลงข้อมูลเป็น form-urlencoded
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestData)) {
      formData.append(key, String(value));
    }
    
    // ตั้งค่า Headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': sign,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr,
      'Accept': 'application/json'
    };
    
    // ทดลองเรียก API
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`\nทดสอบ URL: ${fullUrl}`);
    
    try {
      const response = await axios({
        method: 'post',
        url: fullUrl,
        headers: headers,
        data: formData,
        timeout: 5000 // 5 วินาที
      });
      
      console.log(`✓ การเรียก API สำเร็จ (Status: ${response.status})`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      
      return true;
    } catch (error: any) {
      // แสดงผลข้อผิดพลาด
      if (error.response) {
        console.log(`✗ การเรียก API ล้มเหลว (Status: ${error.response.status})`);
        console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`✗ การเรียก API ล้มเหลว: ${error.message}`);
      }
      
      return false;
    }
  } catch (error: any) {
    console.error(`เกิดข้อผิดพลาดในการทดสอบ: ${error.message}`);
    return false;
  }
}

// ฟังก์ชันทดสอบทั้งหมด
async function testAllEndpoints() {
  console.log('====================================================');
  console.log('     การทดสอบหา URL ที่ถูกต้องสำหรับ Flash Express API');
  console.log('====================================================');
  console.log('FLASH_EXPRESS_MERCHANT_ID:', FLASH_EXPRESS_MERCHANT_ID);
  console.log('FLASH_EXPRESS_API_KEY:', FLASH_EXPRESS_API_KEY ? '(มีค่า)' : '(ไม่มีค่า)');
  
  let successfulEndpoints = [];
  
  // ทดสอบทุก URL
  for (const baseUrl of BASE_URLS) {
    console.log(`\n>> ทดสอบ Base URL: ${baseUrl}`);
    
    for (const endpoint of PRICING_ENDPOINTS) {
      const success = await testEndpoint(baseUrl, endpoint);
      
      if (success) {
        successfulEndpoints.push(`${baseUrl}${endpoint}`);
      }
    }
  }
  
  // สรุปผลการทดสอบ
  console.log('\n====================================================');
  console.log('                  ผลการทดสอบ');
  console.log('====================================================');
  
  if (successfulEndpoints.length > 0) {
    console.log('URL ที่สามารถเรียกได้:');
    successfulEndpoints.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  } else {
    console.log('ไม่พบ URL ที่สามารถเรียกได้');
  }
  
  console.log('\nการทดสอบเสร็จสิ้น');
}

// ตรวจสอบค่า API key ก่อนทดสอบ
if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
  console.error('กรุณาตั้งค่า FLASH_EXPRESS_MERCHANT_ID และ FLASH_EXPRESS_API_KEY ในตัวแปรสภาพแวดล้อม');
  process.exit(1);
}

// รันการทดสอบ
testAllEndpoints();