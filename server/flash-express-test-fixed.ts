/**
 * สคริปต์ทดสอบการเชื่อมต่อ Flash Express API ฉบับแก้ไขตามข้อแนะนำล่าสุด
 * ทดสอบการทำงานของ API ทั้งหมดในไฟล์ flash-express-final.ts
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API (เพิ่มขึ้นเป็น 15 วินาที)
const API_TIMEOUT = 15000; // 15 วินาที

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express อย่างเคร่งครัด 
 * ฉบับที่ปรับปรุงตามข้อแนะนำล่าสุด
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  const filteredParams: Record<string, string> = {};

  for (const key in params) {
    if (key === 'sign' || key === 'subItemTypes') continue;

    const value = params[key];
    if (value === null || value === undefined) continue;

    if (
      typeof value === 'string' &&
      value.replace(/[\u0009-\u000D\u001C-\u001F]/g, '').trim() === ''
    ) continue;

    filteredParams[key] = String(value);
  }

  const sortedKeys = Object.keys(filteredParams).sort();

  const paramPairs = sortedKeys.map(key => `${key}=${filteredParams[key]}`);
  const paramString = paramPairs.join('&');

  const stringToSign = `${paramString}&key=${apiKey}`;
  const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();

  return signature;
}

async function testGetShippingOptions() {
  console.log('========= ทดสอบดึงตัวเลือกการจัดส่ง =========');
  
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // 1. สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // 2. เตรียมข้อมูลคำขอ
    const requestParams: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      fromPostalCode: '10110',
      toPostalCode: '10900',
      weight: '1000' // 1 กิโลกรัม เป็นกรัม
    };
    
    // 3. สร้างลายเซ็นจากข้อมูลที่ยังไม่ได้ encode (สำคัญมาก)
    console.log('ข้อมูลคำขอก่อนสร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
    const stringToSign = Object.keys(requestParams)
      .sort()
      .map(key => `${key}=${requestParams[key]}`)
      .join('&') + `&key=${FLASH_EXPRESS_API_KEY}`;
    
    console.log('stringToSign:', stringToSign);
    
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    // 4. นำลายเซ็นมาเพิ่มเข้ากับข้อมูลคำขอ
    const payload = { ...requestParams, sign: signature };
    
    // 5. สร้าง URL-encoded payload สำหรับส่งไปยัง API
    const encodedPayload = new URLSearchParams(payload).toString();
    
    // 6. ตั้งค่า Headers ที่ถูกต้อง
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr,
      'Accept': 'application/json'
    };
    
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Payload ที่ส่งไป (ก่อน encode):', JSON.stringify(payload, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload);
    
    // 7. ทดลองใช้ URL หลายรูปแบบ
    const possibleEndpoints = [
      '/open/v3/pricing',
      '/open/v2/pricing/calculate',
      '/open/v3/orders/pricing', 
      '/open/v2/orders/price'
    ];
    
    let response = null;
    let successEndpoint = '';
    
    // ลองเรียกแต่ละ endpoint จนกว่าจะสำเร็จ
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`ทดลองเรียก endpoint: ${endpoint}`);
        response = await axios.post(
          `${FLASH_EXPRESS_API_URL}${endpoint}`,
          encodedPayload,
          {
            headers: headers,
            timeout: API_TIMEOUT
          }
        );
        
        // ถ้าไม่มี error แสดงว่าสำเร็จ
        successEndpoint = endpoint;
        console.log(`เรียก endpoint ${endpoint} สำเร็จ`);
        break;
      } catch (err: any) {
        console.log(`เรียก endpoint ${endpoint} ล้มเหลว: ${err.message}`);
        
        // แสดงข้อมูลเพิ่มเติมหากมี response
        if (err.response) {
          console.error(`Response (${endpoint}):`, err.response.status, err.response.statusText);
          console.error(`Data (${endpoint}):`, JSON.stringify(err.response.data, null, 2));
        }
        
        // ถ้าไม่ใช่ endpoint สุดท้าย ให้ลองต่อไป
        if (endpoint !== possibleEndpoints[possibleEndpoints.length - 1]) {
          continue;
        }
        // ถ้าเป็น endpoint สุดท้ายแล้ว ให้ throw error
        throw err;
      }
    }
    
    if (!response) {
      throw new Error('ไม่สามารถเรียก Flash Express API ได้ ทุก endpoint ล้มเหลว');
    }
    
    console.log(`Flash Express API Response (${successEndpoint}):`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ getShippingOptions:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function testCreateShipping() {
  console.log('\n========= ทดสอบสร้างการจัดส่ง =========');
  
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // 1. สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    const orderNumber = `TEST${Date.now()}`;
    
    // 2. เตรียมข้อมูลคำขอ
    const requestParams: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      outTradeNo: orderNumber,
      srcName: 'บริษัท เพอร์เพิลแดช จำกัด',
      srcPhone: '0812345678',
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: 'คลองเตย',
      srcPostalCode: '10110',
      srcDetailAddress: '123 ถนนสุขุมวิท',
      dstName: 'คุณทดสอบ ระบบ',
      dstPhone: '0898765432',
      dstProvinceName: 'กรุงเทพมหานคร',
      dstCityName: 'จตุจักร',
      dstPostalCode: '10900',
      dstDetailAddress: '456 ถนนพหลโยธิน',
      articleCategory: String(1),
      expressCategory: String(1),
      weight: String(1000),
      width: String(10),
      height: String(10),
      length: String(10),
      insured: String(0),
      codEnabled: String(0),
      srcDistrictName: 'คลองเตย',
      dstDistrictName: 'จตุจักร'
    };
    
    // 3. สร้างลายเซ็นจากข้อมูลที่ยังไม่ได้ encode
    console.log('ข้อมูลคำขอก่อนสร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    // 4. นำลายเซ็นมาเพิ่มเข้ากับข้อมูลคำขอ
    const payload = { ...requestParams, sign: signature };
    
    // 5. สร้าง subItemTypes แยกต่างหาก (ต้องทำหลังจากสร้างลายเซ็นแล้ว)
    const defaultItem = [{
      itemName: 'สินค้าทดสอบ',
      itemWeightSize: '1Kg',
      itemColor: '-',
      itemQuantity: 1
    }];
    const subItemTypesJSON = JSON.stringify(defaultItem);
    payload.subItemTypes = subItemTypesJSON;
    console.log('subItemTypes ที่ส่งไป:', subItemTypesJSON);
    
    // 6. สร้าง URL-encoded payload สำหรับส่งไปยัง API
    const encodedPayload = new URLSearchParams(payload).toString();
    
    // 7. ตั้งค่า Headers ที่ถูกต้อง
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr,
      'Accept': 'application/json'
    };
    
    console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Payload ที่ส่งไป (ก่อน encode):', JSON.stringify(payload, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload);
    
    // 8. เรียกใช้ API
    const response = await axios.post(
      `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
      encodedPayload,
      {
        headers: headers,
        timeout: API_TIMEOUT
      }
    );
    
    console.log("Flash Express API Response:", JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.code === 1) {
      console.log('สร้างการจัดส่งสำเร็จ! เลขพัสดุ:', response.data.data.pno);
      return response.data.data.pno; // ส่งคืนเลขติดตามพัสดุเพื่อใช้ในการทดสอบถัดไป
    } else {
      console.log('การตอบกลับไม่สำเร็จจาก Flash Express API:', response.data);
      return null;
    }
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ createShipping:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function testTrackingStatus(trackingNumber: string) {
  console.log('\n========= ทดสอบตรวจสอบสถานะพัสดุ =========');
  
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    if (!trackingNumber) {
      throw new Error('ไม่มีเลขพัสดุสำหรับทดสอบ');
    }
    
    // 1. สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // 2. เตรียมข้อมูลคำขอ
    const requestParams: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      pno: trackingNumber
    };
    
    // 3. สร้างลายเซ็น
    console.log('ข้อมูลคำขอก่อนสร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    // 4. นำลายเซ็นมาเพิ่มเข้ากับข้อมูลคำขอ
    const payload = { ...requestParams, sign: signature };
    
    // 5. สร้าง URL-encoded payload สำหรับส่งไปยัง API
    const encodedPayload = new URLSearchParams(payload).toString();
    
    // 6. ตั้งค่า Headers ที่ถูกต้อง
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr,
      'Accept': 'application/json'
    };
    
    console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/tracking/search`);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Payload ที่ส่งไป (ก่อน encode):', JSON.stringify(payload, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload);
    
    // 7. เรียกใช้ API
    const response = await axios.post(
      `${FLASH_EXPRESS_API_URL}/open/v3/tracking/search`,
      encodedPayload,
      {
        headers: headers,
        timeout: API_TIMEOUT
      }
    );
    
    console.log("Flash Express API Response:", JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.code === 1) {
      console.log('ดึงข้อมูลสถานะพัสดุสำเร็จ!');
      return response.data;
    } else {
      console.log('การตอบกลับไม่สำเร็จจาก Flash Express API:', response.data);
      return null;
    }
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ trackingStatus:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function runAllTests() {
  try {
    console.log('เริ่มทดสอบ Flash Express API แบบใหม่ล่าสุด...');
    console.log(`API URL: ${FLASH_EXPRESS_API_URL}`);
    console.log(`Merchant ID: ${FLASH_EXPRESS_MERCHANT_ID}`);
    console.log(`API Key: ${FLASH_EXPRESS_API_KEY?.substring(0, 5)}...${FLASH_EXPRESS_API_KEY?.substring(FLASH_EXPRESS_API_KEY.length - 5)}`);
    
    // ทดสอบดึงตัวเลือกการจัดส่ง
    await testGetShippingOptions();
    
    // ทดสอบสร้างการจัดส่ง
    const trackingNumber = await testCreateShipping();
    
    // ทดสอบตรวจสอบสถานะพัสดุ (ถ้ามีเลขติดตามพัสดุจากการทดสอบก่อนหน้า)
    if (trackingNumber) {
      await testTrackingStatus(trackingNumber);
    } else {
      console.log('\n⚠️ ไม่สามารถทดสอบตรวจสอบสถานะพัสดุได้เนื่องจากไม่มีเลขพัสดุ');
    }
    
    console.log('\n========= การทดสอบเสร็จสิ้น =========');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error);
  }
}

// เริ่มการทดสอบ
runAllTests();