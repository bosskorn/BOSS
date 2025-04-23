
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
    // ตาม Flash Express API ค่า sign คือลายเซ็นที่สร้างจากข้อมูลทั้งหมดจัดเรียงตาม key
    const keys = Object.keys(data).sort();
    
    // กรองเอาเฉพาะข้อมูลที่ไม่ใช่ว่าง
    let signStr = '';
    keys.forEach(key => {
      // ข้ามช่อง sign ไม่ต้องเอามารวมในการสร้างลายเซ็น
      if (key !== 'sign' && data[key] !== undefined && data[key] !== null && data[key] !== '') {
        if (Array.isArray(data[key]) || typeof data[key] === 'object') {
          signStr += `${key}=${JSON.stringify(data[key])}&`;
        } else {
          signStr += `${key}=${data[key]}&`;
        }
      }
    });
    
    // ตัด & ตัวสุดท้ายออก
    if (signStr.endsWith('&')) {
      signStr = signStr.slice(0, -1);
    }
    
    // เพิ่ม API_KEY เข้าไปเพื่อใช้ในการยืนยันตัวตน
    signStr += API_KEY;
    
    console.log('Raw signature string:', signStr);
    
    // สร้างลายเซ็นด้วย SHA-256
    const signature = createHmac('sha256', API_KEY || '')
      .update(signStr)
      .digest('hex')
      .toUpperCase(); // ตัวพิมพ์ใหญ่ทั้งหมด
    
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    // ในกรณีที่เกิดข้อผิดพลาด ส่งค่าลายเซ็นที่สร้างจากข้อมูลว่างเปล่า
    return createHmac('sha256', API_KEY || '')
      .update(`${API_KEY}`)
      .digest('hex')
      .toUpperCase();
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
    
    // ปรับปรุงข้อมูลให้ตรงตามรูปแบบที่ Flash Express API ต้องการ
    const formattedOrderData = {
      // ข้อมูลการยืนยันตัวตน
      mchId: MERCHANT_ID,
      nonceStr: Date.now().toString(),
      
      // ข้อมูลที่มีอยู่แล้ว
      outTradeNo: orderData.outTradeNo || `SS${Date.now()}`,
      
      // ข้อมูลคลังสินค้า (ถ้าไม่มีใช้ค่าตั้งต้น)
      warehouseNo: `${MERCHANT_ID}_001`,
      
      // ข้อมูลผู้ส่งพัสดุ
      srcName: orderData.srcName,
      srcPhone: orderData.srcPhone,
      srcProvinceName: orderData.srcProvinceName,
      srcCityName: orderData.srcCityName,
      srcDistrictName: orderData.srcDistrictName || "", 
      srcPostalCode: orderData.srcPostalCode,
      srcDetailAddress: orderData.srcDetailAddress,
      
      // ข้อมูลผู้รับพัสดุ
      dstName: orderData.dstName,
      dstPhone: orderData.dstPhone,
      dstHomePhone: orderData.dstHomePhone || orderData.dstPhone,
      dstProvinceName: orderData.dstProvinceName,
      dstCityName: orderData.dstCityName,
      dstDistrictName: orderData.dstDistrictName || "",
      dstPostalCode: orderData.dstPostalCode,
      dstDetailAddress: orderData.dstDetailAddress,
      
      // ข้อมูลการส่งคืนพัสดุ (ถ้าไม่มีใช้ข้อมูลผู้ส่ง)
      returnName: orderData.returnName || orderData.srcName,
      returnPhone: orderData.returnPhone || orderData.srcPhone,
      returnProvinceName: orderData.returnProvinceName || orderData.srcProvinceName,
      returnCityName: orderData.returnCityName || orderData.srcCityName,
      returnPostalCode: orderData.returnPostalCode || orderData.srcPostalCode,
      returnDetailAddress: orderData.returnDetailAddress || orderData.srcDetailAddress,
      
      // ข้อมูลประเภทและน้ำหนักพัสดุ
      articleCategory: orderData.articleCategory,
      expressCategory: orderData.expressCategory,
      weight: orderData.weight,
      
      // ข้อมูลขนาดพัสดุ
      width: orderData.width || 20,
      length: orderData.length || 30,
      height: orderData.height || 10,
      
      // ข้อมูลการประกันพัสดุ
      insured: orderData.insured || 0,
      insureDeclareValue: orderData.insured === 1 ? (orderData.insureDeclareValue || 0) : 0,
      opdInsureEnabled: orderData.opdInsureEnabled || 0,
      
      // ข้อมูลการเก็บเงินปลายทาง
      codEnabled: orderData.codEnabled || 0,
      codAmount: orderData.codEnabled === 1 ? (orderData.codAmount || 0) : 0,
      
      // ข้อมูลเพิ่มเติม
      remark: orderData.remark || "",
      
      // ข้อมูลรายการสินค้าย่อย
      subItemTypes: Array.isArray(orderData.subItemTypes) ? orderData.subItemTypes : [],
      
      // ข้อมูลอื่นๆ ที่อาจจำเป็น
      payType: orderData.payType || 1,
      itemCategory: orderData.itemCategory || orderData.articleCategory || 1
    };
    
    // สร้างลายเซ็นสำหรับตรวจสอบความถูกต้อง
    const timestamp = Date.now();
    const signature = createSignature(formattedOrderData, timestamp);
    
    // เพิ่มลายเซ็นเข้าไปในข้อมูลที่จะส่ง
    const dataWithSign = {
      ...formattedOrderData,
      sign: signature
    };

    console.log('Sending order data to Flash Express API:', JSON.stringify(dataWithSign, null, 2));

    // สร้าง config สำหรับ axios
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // เพิ่ม timeout และ maxContentLength
      timeout: 30000,
      maxContentLength: Infinity
    };

    console.log(`Sending request to Flash Express API: ${BASE_URL}/v3/orders`);
    
    // ส่งข้อมูลไปยัง Flash Express API
    const response = await axios.post(`${BASE_URL}/v3/orders`, dataWithSign, axiosConfig);
    
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
