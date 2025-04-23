/**
 * Flash Express Warehouse Service
 * บริการสำหรับเรียกดูข้อมูลคลังสินค้า Flash Express
 */

import axios from 'axios';
import querystring from 'querystring';
import crypto from 'crypto';

// URL ของ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com';

// ฟังก์ชันสำหรับสร้างลายเซ็นดิจิตอล (signature) สำหรับ Flash Express API
function createSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('Starting signature creation for warehouse API');
    
    // คัดลอกพารามิเตอร์ทั้งหมดเพื่อสร้าง signature
    const paramsForSign = { ...params };
    
    // ลบฟิลด์ที่ไม่ต้องใช้ในการสร้าง signature
    delete paramsForSign.sign;
    
    // เรียงฟิลด์ตามรหัส ASCII
    const sortedKeys = Object.keys(paramsForSign).sort();
    
    // สร้าง string จากชื่อและค่าของทุกฟิลด์ที่เรียงลำดับแล้ว
    const parts: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsForSign[key];
      
      // ข้ามฟิลด์ที่เป็น undefined หรือ null
      if (value === undefined || value === null) {
        continue;
      }
      
      // แปลงข้อมูลเป็น string ถ้าจำเป็น
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value !== 'string') {
        value = String(value);
      }
      
      // ข้ามค่าว่าง
      if (value.trim() === '') {
        continue;
      }
      
      // เพิ่มเข้าไปในรายการสำหรับการสร้าง stringA
      parts.push(`${key}=${value}`);
    }
    
    // รวม key=value คั่นด้วย & เพื่อสร้าง stringA
    const stringA = parts.join('&');
    
    // ต่อ stringA ด้วย &key=API_KEY เพื่อสร้าง stringSignTemp
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('Warehouse API signature stringSignTemp:', stringSignTemp);
    
    // สร้าง signature ด้วย SHA-256
    const signature = crypto.createHash('sha256').update(stringSignTemp).digest('hex').toUpperCase();
    console.log('Warehouse API signature result:', signature);
    
    return signature;
  } catch (error) {
    console.error('Error creating signature for warehouse API:', error);
    throw new Error('Failed to create signature for Flash Express warehouse API');
  }
}

// ฟังก์ชันสำหรับเรียกดูข้อมูลคลังสินค้า
export async function getWarehouses(): Promise<any[]> {
  try {
    if (!process.env.FLASH_EXPRESS_MERCHANT_ID || !process.env.FLASH_EXPRESS_API_KEY) {
      throw new Error('ไม่พบค่า Flash Express Merchant ID หรือ API Key ในไฟล์ .env');
    }
    
    // สร้าง Nonce และ Reference ID สำหรับการเรียกใช้ API
    const nonceStr = Date.now().toString();
    
    // สร้างข้อมูลสำหรับส่งไปยัง Flash Express API ตามเอกสาร
    const apiParams: Record<string, any> = {
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(apiParams, process.env.FLASH_EXPRESS_API_KEY);
    apiParams.sign = signature;
    
    // URL ของ API เรียกดูข้อมูลคลังสินค้า
    const apiUrl = `${FLASH_EXPRESS_API_URL}/open/v1/warehouses`;
    console.log('Flash Express Warehouse API URL:', apiUrl);
    
    // แสดงข้อมูลแบบละเอียดเพื่อการตรวจสอบ
    console.log('Flash Express Warehouse API request params:', JSON.stringify(apiParams, null, 2));
    console.log('Params as URL-encoded:', querystring.stringify(apiParams));
    
    try {
      // ส่งคำขอไปยัง Flash Express API
      console.log('Sending request to Flash Express Warehouse API...');
      const response = await axios.post(apiUrl, querystring.stringify(apiParams), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        responseType: 'text',
        validateStatus: (status) => status < 500,
        timeout: 15000
      });
      
      // ตรวจสอบการตอบกลับ
      let responseData;
      
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch (jsonError) {
          console.error('Failed to parse response as JSON:', jsonError);
          
          if (response.data.includes('<!DOCTYPE') || response.data.includes('<html')) {
            console.error('Response appears to be HTML, not JSON');
            throw new Error('Flash Express API ตอบกลับด้วยรูปแบบที่ไม่ถูกต้อง (HTML)');
          } else {
            console.error('Response is not valid JSON:', response.data);
            throw new Error('Flash Express API ตอบกลับด้วยรูปแบบที่ไม่ถูกต้อง');
          }
        }
      } else {
        responseData = response.data;
      }
      
      console.log('Flash Express Warehouse API response:', responseData);
      
      // ตรวจสอบข้อมูลคลังสินค้า
      if (responseData.code === 1 && responseData.data && Array.isArray(responseData.data)) {
        console.log(`Retrieved ${responseData.data.length} warehouses`);
        return responseData.data;
      } else {
        console.warn('No warehouses found or invalid response structure:', responseData);
        return [];
      }
    } catch (apiError: any) {
      if (apiError.response) {
        console.error('Error from Flash Express Warehouse API:', apiError.response.data);
      } else {
        console.error('Error requesting Flash Express Warehouse API:', apiError.message);
      }
      throw new Error(`ไม่สามารถเรียกดูข้อมูลคลังสินค้าได้: ${apiError.message}`);
    }
  } catch (error: any) {
    console.error('Error fetching warehouses from Flash Express:', error);
    throw error;
  }
}