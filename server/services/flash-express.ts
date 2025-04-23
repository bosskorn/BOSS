
/**
 * บริการเชื่อมต่อกับ Flash Express API
 */
import axios from 'axios';
import { createHmac } from 'crypto';

// ตรวจสอบว่ามีการกำหนดค่าสำหรับ API หรือไม่
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const API_KEY = process.env.FLASH_EXPRESS_API_KEY;
const BASE_URL = 'https://open-api.flashexpress.com/open'; // URL สำหรับ Production

if (!MERCHANT_ID || !API_KEY) {
  console.warn('Missing Flash Express API credentials!');
}

// ฟังก์ชันสร้างลายเซ็นสำหรับส่งข้อมูลให้ Flash Express API
function createSignature(data: any, timestamp: number): string {
  try {
    // แปลงข้อมูลเป็น JSON string และจัดเรียงคีย์ตามลำดับอักษร
    const sortedData = JSON.stringify(data, Object.keys(data).sort());
    const message = `${sortedData}${timestamp}`;
    
    console.log('Creating signature with data:', sortedData);
    console.log('Timestamp:', timestamp);
    console.log('Message for signature:', message);
    
    const signature = createHmac('sha256', API_KEY || '')
      .update(message)
      .digest('hex');
    
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    // ในกรณีที่เกิดข้อผิดพลาด ส่งค่าลายเซ็นที่สร้างจากข้อมูลว่างเปล่า
    return createHmac('sha256', API_KEY || '')
      .update(`{}${timestamp}`)
      .digest('hex');
  }
}

// คำสั่งตรวจสอบลายเซ็นตัวอย่าง
export function testSignatureWithExampleData() {
  const sampleData = { test: 'data' };
  const timestamp = Date.now();
  const signature = createSignature(sampleData, timestamp);
  
  return {
    data: sampleData,
    timestamp,
    signature,
    merchantId: MERCHANT_ID ? 'configured' : 'missing',
    apiKey: API_KEY ? 'configured (first 4 chars): ' + API_KEY.substring(0, 4) + '***' : 'missing'
  };
}

// ฟังก์ชันสร้างออเดอร์ Flash Express
export async function createFlashOrder(orderData: any): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }

    // ตรวจสอบและเพิ่มฟิลด์ที่จำเป็น
    const requiredFields = ['srcName', 'srcPhone', 'srcProvinceName', 'srcCityName', 'srcPostalCode', 'srcDetailAddress',
      'dstName', 'dstPhone', 'dstProvinceName', 'dstCityName', 'dstPostalCode', 'dstDetailAddress',
      'outTradeNo', 'expressCategory', 'articleCategory', 'weight', 'subItemTypes'];
    
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      console.warn(`Missing required fields for Flash Express API: ${missingFields.join(', ')}`);
    }
    
    // ตรวจสอบและเพิ่มฟิลด์ payType หากไม่มี
    if (!orderData.payType) {
      console.log('Adding default payType: 1 (ชำระโดยผู้ส่ง)');
      orderData.payType = 1;
    }
    
    // ตรวจสอบและเพิ่มฟิลด์ itemCategory หากไม่มี
    if (!orderData.itemCategory) {
      console.log('Adding default itemCategory based on articleCategory');
      orderData.itemCategory = orderData.articleCategory || 1;
    }

    console.log('Sending order data to Flash Express API:', JSON.stringify(orderData, null, 2));

    // กำหนดค่า timestamp เพื่อสร้างลายเซ็น
    const timestamp = Date.now();
    const signature = createSignature(orderData, timestamp);

    // สร้าง config สำหรับ axios
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': MERCHANT_ID,
        'X-Flash-Timestamp': timestamp.toString(),
        'X-Flash-Signature': signature,
        'Accept': 'application/json'
      },
      // เพิ่ม timeout และ maxContentLength
      timeout: 30000,
      maxContentLength: Infinity
    };

    console.log(`Sending request to Flash Express API: ${BASE_URL}/v3/orders`);
    console.log('Request headers:', JSON.stringify(axiosConfig.headers, null, 2));
    
    // ส่งข้อมูลไปยัง Flash Express API
    const response = await axios.post(`${BASE_URL}/v3/orders`, orderData, axiosConfig);
    
    console.log('Flash Express API response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Error creating Flash Express order:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error config:', JSON.stringify(error.config, null, 2));
    throw error;
  }
}

// ฟังก์ชันติดตามสถานะพัสดุ Flash Express
export async function trackFlashOrder(trackingNumber: string): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }

    const data = { trackingNumber };
    const timestamp = Date.now();
    const signature = createSignature(data, timestamp);

    const response = await axios.get(`${BASE_URL}/v3/tracking`, {
      params: data,
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': MERCHANT_ID,
        'X-Flash-Timestamp': timestamp.toString(),
        'X-Flash-Signature': signature
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error tracking Flash Express order:', error?.response?.data || error.message);
    throw error;
  }
}

// ฟังก์ชันค้นหาพัสดุด้วยหมายเลขอ้างอิงของร้านค้า
export async function findByMerchantTracking(merchantTrackingNumber: string): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }

    const data = { merchantTrackingNumber };
    const timestamp = Date.now();
    const signature = createSignature(data, timestamp);

    const response = await axios.get(`${BASE_URL}/v3/orders/find-by-merchant-tracking/${merchantTrackingNumber}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': MERCHANT_ID,
        'X-Flash-Timestamp': timestamp.toString(),
        'X-Flash-Signature': signature
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error finding Flash Express order by merchant tracking:', error?.response?.data || error.message);
    throw error;
  }
}
