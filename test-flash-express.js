import axios from 'axios';
import crypto from 'crypto';

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// สร้างลายเซ็น Flash Express (ปรับปรุงตามวิธีการของ Flash Express)
function generateFlashSignature(params, apiKey) {
  // แปลงค่าให้เป็น string ทุกค่า
  const stringParams = {};
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      stringParams[key] = String(params[key]);
    }
  }
  
  // 1. เรียงลำดับพารามิเตอร์ตามตัวอักษร
  const sortedKeys = Object.keys(stringParams).sort();
  
  // 2. สร้างสตริงสำหรับเซ็น
  const pairs = [];
  for (const key of sortedKeys) {
    const value = stringParams[key];
    if (value !== '') {
      pairs.push(`${key}=${value}`);
    }
  }
  const stringToSign = pairs.join('&');
  
  // 3. เพิ่ม API key
  const finalString = `${stringToSign}&key=${apiKey}`;
  
  // 4. คำนวณ SHA-256
  const signature = crypto.createHash('sha256').update(finalString).digest('hex').toUpperCase();
  
  console.log('String to sign:', finalString);
  console.log('Generated signature:', signature);
  
  return signature;
}

// ทดสอบดึงข้อมูลค่าจัดส่ง
async function testShippingRate() {
  try {
    console.log('=== ทดสอบดึงข้อมูลค่าจัดส่ง ===');
    
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    const mchId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    
    if (!apiKey || !mchId) {
      console.error('Error: FLASH_EXPRESS_API_KEY or FLASH_EXPRESS_MERCHANT_ID not set');
      return;
    }
    
    // สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // สร้าง request data
    const requestParams = {
      fromPostalCode: '10230',
      toPostalCode: '10400',
      weight: '1.0',
      height: '10',
      length: '10',
      width: '10',
      mchId: mchId,
      nonceStr: nonceStr,
      timestamp: timestamp
    };
    
    // คำนวณลายเซ็น
    const signature = generateFlashSignature(requestParams, apiKey);
    
    // สร้าง headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    console.log('Request headers:', headers);
    console.log('Request params:', requestParams);
    
    // ส่ง request
    const response = await axios.post(
      'https://open-api-tra.flashexpress.com/open/v1/orders/estimate_rate',
      new URLSearchParams(requestParams),
      { headers }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// รันการทดสอบ
testShippingRate();