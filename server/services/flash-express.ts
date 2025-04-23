
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
/**
 * สร้างลายเซ็นสำหรับส่งข้อมูลให้ Flash Express API
 * @param data ข้อมูลที่จะใช้ในการสร้างลายเซ็น
 * @param timestamp เวลาที่ใช้ในการสร้างลายเซ็น (ไม่ได้ใช้ในกรณีของ Flash Express)
 * @returns ลายเซ็นที่สร้างขึ้น
 */
function createSignature(data: any, timestamp: number): string {
  try {
    // ลบฟิลด์ sign ออก (ถ้ามี) เพราะไม่ควรรวมในการคำนวณลายเซ็น
    const dataForSigning = { ...data };
    delete dataForSigning.sign;
    
    // จัดเรียง key ตามลำดับอักษร
    const keys = Object.keys(dataForSigning).sort();
    
    // สร้าง string สำหรับการคำนวณลายเซ็น
    let signStr = '';
    keys.forEach(key => {
      // ถ้าค่าไม่ใช่ undefined, null หรือว่างเปล่า ให้เพิ่มเข้าไปในสตริง
      if (dataForSigning[key] !== undefined && dataForSigning[key] !== null && dataForSigning[key] !== '') {
        // ถ้าเป็น array หรือ object ให้แปลงเป็น JSON string
        if (Array.isArray(dataForSigning[key]) || typeof dataForSigning[key] === 'object') {
          signStr += `${key}=${JSON.stringify(dataForSigning[key])}&`;
        } else {
          signStr += `${key}=${dataForSigning[key]}&`;
        }
      }
    });
    
    // ตัด & ตัวสุดท้ายออก
    if (signStr.endsWith('&')) {
      signStr = signStr.slice(0, -1);
    }
    
    // เพิ่ม API_KEY ต่อท้าย (ตามเอกสาร Flash Express)
    signStr += API_KEY;
    
    console.log('Raw signature string:', signStr);
    
    // ใช้ SHA-256 สร้างลายเซ็น
    const signature = createHmac('sha256', API_KEY || '')
      .update(signStr)
      .digest('hex')
      .toUpperCase(); // ตัวพิมพ์ใหญ่ทั้งหมดตามที่ Flash Express ต้องการ
    
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
    
    // สร้างข้อมูลตามรูปแบบที่ Flash Express API ต้องการ ตรงตามตัวอย่าง
    // ข้อมูลพื้นฐานที่จำเป็นต้องส่ง (Required fields) ตามเอกสาร API
    const formattedOrderData: Record<string, any> = {
      // ข้อมูลการยืนยันตัวตน (ต้องมี)
      mchId: MERCHANT_ID,
      nonceStr: Date.now().toString(),
      
      // รหัสเรเฟอเรนซ์จากร้านค้า (ต้องมี)
      outTradeNo: orderData.outTradeNo || `SS${Date.now()}`,
      
      // รหัสคลังสินค้า (ต้องมี)
      warehouseNo: orderData.warehouseNo || `${MERCHANT_ID}_001`,
      
      // ข้อมูลผู้ส่งพัสดุ (ต้องมีทั้งหมด)
      srcName: orderData.srcName,
      srcPhone: orderData.srcPhone,
      srcProvinceName: orderData.srcProvinceName,
      srcCityName: orderData.srcCityName,
      srcDistrictName: orderData.srcDistrictName || "", 
      srcPostalCode: orderData.srcPostalCode,
      srcDetailAddress: orderData.srcDetailAddress,
      
      // ข้อมูลผู้รับพัสดุ (ต้องมีทั้งหมด)
      dstName: orderData.dstName,
      dstPhone: orderData.dstPhone,
      dstHomePhone: orderData.dstHomePhone || orderData.dstPhone,
      dstProvinceName: orderData.dstProvinceName,
      dstCityName: orderData.dstCityName,
      dstDistrictName: orderData.dstDistrictName || "",
      dstPostalCode: orderData.dstPostalCode,
      dstDetailAddress: orderData.dstDetailAddress,
      
      // ข้อมูลการส่งคืนพัสดุ (ต้องมี)
      returnName: orderData.returnName || orderData.srcName,
      returnPhone: orderData.returnPhone || orderData.srcPhone,
      returnProvinceName: orderData.returnProvinceName || orderData.srcProvinceName,
      returnCityName: orderData.returnCityName || orderData.srcCityName, 
      returnDistrictName: orderData.returnDistrictName || orderData.srcDistrictName || "",
      returnPostalCode: orderData.returnPostalCode || orderData.srcPostalCode,
      returnDetailAddress: orderData.returnDetailAddress || orderData.srcDetailAddress,
      
      // ข้อมูลประเภทพัสดุ (ต้องมี)
      articleCategory: orderData.articleCategory,  // 1 = ทั่วไป, 2 = เอกสาร
      expressCategory: orderData.expressCategory,  // 1 = ปกติ, 2 = ด่วน
      
      // ข้อมูลน้ำหนักและขนาดพัสดุ (ต้องมี)
      weight: orderData.weight,  // น้ำหนักเป็นกรัม (g) เช่น 1000 = 1kg
      width: orderData.width || 20,  // ความกว้างเป็นเซนติเมตร (cm)
      length: orderData.length || 30,  // ความยาวเป็นเซนติเมตร (cm)
      height: orderData.height || 10,  // ความสูงเป็นเซนติเมตร (cm)
      
      // ข้อมูลการประกันพัสดุ
      insured: orderData.insured || 0,  // 0 = ไม่ประกัน, 1 = ประกัน
      insureDeclareValue: orderData.insured === 1 ? (orderData.insureDeclareValue || 0) : 0,  // มูลค่าที่ประกัน (สตางค์)
      opdInsureEnabled: orderData.opdInsureEnabled || 0,  // 0 = ไม่มีประกัน OPD, 1 = มีประกัน OPD
      
      // ข้อมูลการเก็บเงินปลายทาง
      codEnabled: orderData.codEnabled || 0,  // 0 = ไม่เก็บเงินปลายทาง, 1 = เก็บเงินปลายทาง
      codAmount: orderData.codEnabled === 1 ? (orderData.codAmount || 0) : 0,  // จำนวนเงินที่เก็บปลายทาง (สตางค์)
      
      // ข้อมูลรายการสินค้าย่อย (ต้องมี)
      subItemTypes: Array.isArray(orderData.subItemTypes) ? orderData.subItemTypes : [],
      
      // หมายเหตุ
      remark: orderData.remark || "",
      
      // ข้อมูลพัสดุย่อย (ถ้ามี)
      subParcelQuantity: orderData.subParcel ? orderData.subParcel.length : 0,
      subParcel: orderData.subParcel || [],
      
      // ข้อมูลการชำระเงิน (1 = ผู้ส่งเป็นผู้ชำระ, 2 = ผู้รับเป็นผู้ชำระ)
      payType: orderData.payType || 1,
      
      // ข้อมูลประเภทสินค้า (ใช้ค่าเดียวกับ articleCategory ถ้าไม่ได้ระบุ)
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
