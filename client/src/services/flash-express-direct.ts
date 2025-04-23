/**
 * Flash Express Direct API Service
 * บริการเรียก Flash Express API โดยตรงจาก client-side เพื่อหลีกเลี่ยงปัญหา Vite middleware
 */

import axios from 'axios';
import MD5 from 'crypto-js/md5';

// ใช้สำหรับการดึงข้อมูล credentials จาก server
let credentials: {
  mchId: string;
  apiKey: string;
} | null = null;

/**
 * ดึงข้อมูล credentials จาก environment variables
 */
export async function loadCredentials(): Promise<boolean> {
  try {
    // ใช้ environment variables โดยตรง
    const mchId = import.meta.env.VITE_FLASH_EXPRESS_MERCHANT_ID;
    const apiKey = import.meta.env.VITE_FLASH_EXPRESS_API_KEY;
    
    console.log('Loading credentials from environment variables');
    
    if (mchId && apiKey) {
      credentials = {
        mchId: mchId as string,
        apiKey: apiKey as string
      };
      
      // แสดงข้อมูลที่ได้รับเพื่อการตรวจสอบ (ปกปิด apiKey บางส่วน)
      console.log('Loaded credentials mchId:', credentials.mchId);
      if (credentials.apiKey) {
        const maskedKey = credentials.apiKey.substring(0, 4) + '...' + 
                         credentials.apiKey.substring(credentials.apiKey.length - 4);
        console.log('Loaded credentials apiKey:', maskedKey);
      } else {
        console.log('API key is missing or empty');
      }
      
      return true;
    }
    
    console.error('Credentials not found in environment variables');
    return false;
  } catch (error) {
    console.error('Error loading Flash Express credentials:', error);
    return false;
  }
}

/**
 * สร้าง signature สำหรับ Flash Express API
 */
function createSignature(params: Record<string, any>, apiKey: string): string {
  // เรียงลำดับ key ตามตัวอักษร
  const sortedKeys = Object.keys(params).sort();
  // สร้าง string เพื่อใช้ในการ hash
  const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  // สร้าง signature ด้วย MD5
  return MD5(`${signStr}&key=${apiKey}`).toString().toLowerCase();
}

/**
 * เรียกดูข้อมูลคลังสินค้า
 */
export async function getWarehouses(): Promise<any> {
  if (!credentials) {
    const success = await loadCredentials();
    if (!success) {
      throw new Error('ไม่สามารถโหลดข้อมูล credentials ได้');
    }
  }

  // สร้างพารามิเตอร์สำหรับ API
  const params = {
    mchId: credentials!.mchId,
    nonceStr: Math.random().toString(36).substring(2, 15),
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
  
  // สร้าง signature
  const sign = createSignature(params, credentials!.apiKey);
  
  // เพิ่ม signature เข้าไปในพารามิเตอร์
  const requestParams = {
    ...params,
    sign: sign
  };
  
  // ส่งคำขอไปยัง Flash Express API
  try {
    const response = await axios.get('https://cnapi-sl.flashexpress.com/open/v1/warehouses', {
      params: requestParams,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error calling Flash Express API:', error);
    
    const responseData = error.response?.data || {};
    
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการเรียกดูข้อมูลคลังสินค้า',
      error: error.message,
      data: responseData
    };
  }
}

/**
 * ร้องขอรถเข้ารับพัสดุ
 */
export async function requestPickup(
  warehouseNo: string,
  pickupDate: string,
  quantity: number,
  remark?: string
): Promise<any> {
  if (!credentials) {
    const success = await loadCredentials();
    if (!success) {
      throw new Error('ไม่สามารถโหลดข้อมูล credentials ได้');
    }
  }
  
  // สร้างพารามิเตอร์สำหรับ API
  const params = {
    mchId: credentials!.mchId,
    nonceStr: Math.random().toString(36).substring(2, 15),
    timestamp: Math.floor(Date.now() / 1000).toString(),
    warehouseNo,
    pickupDate,
    quantity: quantity.toString(),
    remark: remark || ''
  };
  
  // สร้าง signature
  const sign = createSignature(params, credentials!.apiKey);
  
  // ส่งคำขอไปยัง Flash Express API
  try {
    const response = await axios.post('https://cnapi-sl.flashexpress.com/open/v1/notify', 
      { ...params, sign },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error requesting pickup:', error);
    
    const responseData = error.response?.data || {};
    
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการร้องขอรถเข้ารับพัสดุ',
      error: error.message,
      data: responseData
    };
  }
}