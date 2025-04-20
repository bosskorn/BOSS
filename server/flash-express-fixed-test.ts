/**
 * สคริปต์ทดสอบการเชื่อมต่อ Flash Express API ปรับปรุงเพิ่มเติม
 * ใช้ URL ใหม่: https://open-api-tra.flashexpress.com
 * 
 * โฟกัสที่การสร้างลายเซ็นตามเอกสารของ Flash Express อย่างเคร่งครัด
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลสำหรับการทดสอบ
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID as string;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY as string;
const API_TIMEOUT = 15000; // 15 วินาที

// ฟังก์ชันสร้าง nonceStr แบบเรียบง่ายที่สุด
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express แบบสมบูรณ์
 * 1. จัดเรียงพารามิเตอร์ตามตัวอักษร (ASCII)
 * 2. เชื่อมต่อเป็นสตริงในรูปแบบ key1=value1&key2=value2
 * 3. เพิ่ม API key ที่ท้ายสตริง: stringToSign + "&key=" + apiKey
 * 4. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('พารามิเตอร์ที่ได้รับเพื่อสร้างลายเซ็น:', JSON.stringify(params, null, 2));
    
    // คัดกรองพารามิเตอร์เฉพาะที่จะใช้ในการสร้างลายเซ็น
    const filteredParams: Record<string, string> = {};
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes ตามเอกสาร Flash Express
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      if (value === null || value === undefined) continue;
      
      // ข้ามค่าว่าง
      if (typeof value === 'string' && value.trim() === '') continue;
      
      // แปลงค่าเป็นสตริงทั้งหมด (สำคัญมาก)
      filteredParams[key] = String(value);
    }
    
    // จัดเรียงพารามิเตอร์ตามตัวอักษร (ASCII)
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // สร้างสตริงพารามิเตอร์แบบไม่มีการเข้ารหัส URL
    const paramPairs = sortedKeys.map(key => `${key}=${filteredParams[key]}`);
    const paramString = paramPairs.join('&');
    
    // เพิ่ม API key ที่ท้ายสตริง
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    console.log('สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
    
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

/**
 * ทดสอบสร้างการจัดส่งกับ Flash Express API โดยใช้วิธีการที่ปรับปรุงแล้ว
 */
async function testCreateShipping() {
  try {
    console.log('========== เริ่มการทดสอบ Flash Express API ==========');
    
    // ข้อมูลการจัดส่งสำหรับทดสอบ
    const orderNumber = `PD${Date.now()}`;
    console.log('เลขออเดอร์ที่ใช้ทดสอบ:', orderNumber);
    
    // 1. สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // 2. สร้างข้อมูลคำขอ
    const requestData: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      outTradeNo: orderNumber,
      srcName: 'บริษัท เพอร์เพิลแดช จำกัด',
      srcPhone: '0812345678',
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: 'คลองเตย',
      srcDistrictName: 'คลองเตย',
      srcPostalCode: '10110',
      srcDetailAddress: '123 ถนนสุขุมวิท',
      dstName: 'คุณทดสอบ ระบบ',
      dstPhone: '0898765432',
      dstProvinceName: 'กรุงเทพมหานคร',
      dstCityName: 'จตุจักร',
      dstDistrictName: 'จตุจักร',
      dstPostalCode: '10900',
      dstDetailAddress: '456 ถนนพหลโยธิน',
      articleCategory: '1',  // แปลงเป็นสตริงทั้งหมด
      expressCategory: '1',
      weight: '1000',
      width: '10',
      length: '10',
      height: '10',
      insured: '0',
      codEnabled: '0'
    };
    
    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY);
    
    // 4. สร้าง HTTP Headers พิเศษ
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr,
      'Accept': 'application/json'
    };
    
    console.log('Headers ที่ส่งไป:', JSON.stringify(headers, null, 2));
    
    // 5. เตรียมข้อมูลที่จะส่ง
    const formData = new URLSearchParams();
    
    // เพิ่มข้อมูลทั้งหมด
    for (const [key, value] of Object.entries(requestData)) {
      formData.append(key, String(value));
    }
    
    // เพิ่มลายเซ็น
    formData.append('sign', signature);
    
    // เพิ่มข้อมูลสินค้า
    const subItemTypesJSON = JSON.stringify([{ 
      itemName: "สินค้าทดสอบ", 
      itemQuantity: 1 
    }]);
    
    formData.append('subItemTypes', subItemTypesJSON);
    console.log('subItemTypes ที่ส่งไป:', subItemTypesJSON);
    
    console.log('URL ที่ส่งไป:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
    console.log('ข้อมูลที่ส่งไป:', formData.toString());
    
    // 6. ส่งคำขอไปยัง API
    try {
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        headers: headers,
        timeout: API_TIMEOUT,
        data: formData
      });
      
      console.log('การตอบกลับจาก Flash Express API:', JSON.stringify(response.data, null, 2));
      
      if (response.data.code === 1) {
        console.log('การสร้างการจัดส่งสำเร็จ!');
        console.log('เลขติดตามพัสดุ:', response.data.data.pno);
        return {
          success: true,
          trackingNumber: response.data.data.pno
        };
      } else {
        console.log('การสร้างการจัดส่งล้มเหลว:', response.data.message);
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก API:', error.message);
      
      // แสดงข้อมูลเพิ่มเติมหากมี response
      if (error.response) {
        console.error('รหัสสถานะ:', error.response.status);
        console.error('ข้อความ:', error.response.statusText);
        console.error('ข้อมูล:', JSON.stringify(error.response.data, null, 2));
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ทดสอบเรียกข้อมูลตัวเลือกการจัดส่ง
 */
async function testGetShippingOptions() {
  try {
    console.log('\n========== เริ่มการทดสอบดึงข้อมูลตัวเลือกการจัดส่ง ==========');
    
    // 1. สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // 2. สร้างข้อมูลคำขอ
    const requestData: Record<string, any> = {
      mchId: FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      fromPostalCode: '10110',
      toPostalCode: '10900',
      weight: '1000' // 1 กิโลกรัม = 1000 กรัม
    };
    
    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY);
    
    // 4. สร้าง HTTP Headers พิเศษ
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr,
      'Accept': 'application/json'
    };
    
    // 5. เตรียมข้อมูลที่จะส่ง
    const formData = new URLSearchParams();
    
    // เพิ่มข้อมูลทั้งหมด
    for (const [key, value] of Object.entries(requestData)) {
      formData.append(key, String(value));
    }
    
    // เพิ่มลายเซ็น
    formData.append('sign', signature);
    
    console.log('URL ที่ส่งไป:', `${FLASH_EXPRESS_API_URL}/open/v3/pricing`);
    
    // 6. ส่งคำขอไปยัง API
    try {
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/pricing`,
        headers: headers,
        timeout: API_TIMEOUT,
        data: formData
      });
      
      console.log('การตอบกลับจาก Flash Express API (ข้อมูลตัวเลือกการจัดส่ง):', JSON.stringify(response.data, null, 2));
      
      if (response.data.code === 1) {
        console.log('การดึงข้อมูลตัวเลือกการจัดส่งสำเร็จ!');
        return {
          success: true,
          options: response.data.data
        };
      } else {
        console.log('การดึงข้อมูลตัวเลือกการจัดส่งล้มเหลว:', response.data.message);
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก API:', error.message);
      
      // ทดลองเรียก endpoints อื่น
      console.log('\nทดลองเรียก endpoint อื่น: /open/v2/pricing/calculate');
      
      try {
        const response2 = await axios({
          method: 'post',
          url: `${FLASH_EXPRESS_API_URL}/open/v2/pricing/calculate`,
          headers: headers,
          timeout: API_TIMEOUT,
          data: formData
        });
        
        console.log('การตอบกลับจาก endpoint ทางเลือก:', JSON.stringify(response2.data, null, 2));
        
        return {
          success: true,
          options: response2.data.data || [],
          note: 'ใช้ endpoint ทางเลือก'
        };
      } catch (error2: any) {
        console.error('เกิดข้อผิดพลาดในการเรียก endpoint ทางเลือก:', error2.message);
        
        return {
          success: false,
          error: `ไม่สามารถดึงข้อมูลตัวเลือกการจัดส่งได้: ${error.message}`
        };
      }
    }
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบตัวเลือกการจัดส่ง:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * รันการทดสอบทั้งหมด
 */
async function runTests() {
  console.log('====================================================');
  console.log('      การทดสอบ Flash Express API ปรับปรุงใหม่');
  console.log('====================================================');
  
  await testGetShippingOptions();
  await testCreateShipping();
  
  console.log('\n====================================================');
  console.log('                  การทดสอบเสร็จสิ้น');
  console.log('====================================================');
}

// เริ่มการทดสอบ
runTests().catch(error => {
  console.error('เกิดข้อผิดพลาดในการทดสอบ:', error);
});