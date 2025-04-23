
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
 * 
 * การสร้างลายเซ็นตามเอกสาร Flash Express:
 * 1. เรียงลำดับข้อมูลตาม key ตามลำดับอักษร a-z
 * 2. แปลงข้อมูลเป็นรูปแบบ key=value คั่นด้วย &
 * 3. นำ API Key ต่อท้าย (ไม่มี &)
 * 4. นำไปเข้ารหัสด้วย SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
 */
function createSignature(data: any, timestamp: number): string {
  try {
    // 1. ลบฟิลด์ sign ออก (ถ้ามี) เพราะไม่ควรรวมในการคำนวณลายเซ็น
    const dataForSigning = { ...data };
    delete dataForSigning.sign;
    
    // 2. จัดเรียง key ตามลำดับอักษร
    const keys = Object.keys(dataForSigning).sort();
    
    // 3. สร้าง string สำหรับการคำนวณลายเซ็น
    const parts: string[] = [];
    
    for (const key of keys) {
      // ถ้าค่าไม่ใช่ undefined, null หรือว่างเปล่า ให้เพิ่มเข้าไปในสตริง
      if (dataForSigning[key] !== undefined && dataForSigning[key] !== null && dataForSigning[key] !== '') {
        let value = dataForSigning[key];
        
        // ถ้าเป็น array หรือ object ให้แปลงเป็น JSON string
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        parts.push(`${key}=${value}`);
      }
    }
    
    // 4. รวม key=value คั่นด้วย &
    const queryString = parts.join('&');
    
    // 5. เพิ่ม API_KEY ต่อท้าย (ตามเอกสาร Flash Express)
    const signStr = queryString + API_KEY;
    
    console.log('Raw signature string:', signStr);
    
    // 6. ใช้ SHA-256 สร้างลายเซ็น
    const hash = createHmac('sha256', API_KEY || '')
      .update(signStr)
      .digest('hex')
      .toUpperCase(); // ตัวพิมพ์ใหญ่ทั้งหมดตามที่ Flash Express ต้องการ
    
    console.log('Generated signature:', hash);
    return hash;
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
  // ตัวอย่างข้อมูลออเดอร์ที่ใช้ในการทดสอบเพื่อให้เห็นรูปแบบชัดเจน
  const testOrder = {
    mchId: MERCHANT_ID || 'CA5609',
    nonceStr: '1745395359993',
    outTradeNo: 'SS1745395342808',
    expressCategory: 1,
    articleCategory: 1,
    weight: 1000,
    width: 20,
    length: 30,
    height: 10,
    insured: 0,
    opdInsureEnabled: 0,
    codEnabled: 0,
    srcName: 'ทดสอบส่ง',
    srcPhone: '0899999999',
    srcProvinceName: 'กรุงเทพมหานคร',
    srcCityName: 'ลาดพร้าว',
    srcDistrictName: 'จรเข้บัว',
    srcPostalCode: '10230',
    srcDetailAddress: 'ที่อยู่ทดสอบ',
    dstName: 'ทดสอบรับ',
    dstPhone: '0888888888',
    dstProvinceName: 'กรุงเทพมหานคร',
    dstCityName: 'ห้วยขวาง',
    dstPostalCode: '10310',
    dstDetailAddress: 'ที่อยู่ทดสอบ',
    subItemTypes: [
      {
        itemName: 'สินค้าทดสอบ',
        itemQuantity: 1
      }
    ]
  };

  const timestamp = Date.now();
  const signature = createSignature(testOrder, timestamp);
  
  return {
    exampleData: testOrder,
    signature,
    merchantId: MERCHANT_ID ? MERCHANT_ID : 'missing (using default: CA5609)',
    apiKeyAvailable: API_KEY ? 'configured' : 'missing (using default test key)'
  };
}

// ฟังก์ชันสร้างออเดอร์ Flash Express
export async function createFlashOrder(orderData: any): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }
    
    // ตรวจสอบข้อมูลพื้นฐานที่ Flash Express API ต้องการ
    const requiredFields = [
      'srcName', 'srcPhone', 'srcProvinceName', 'srcCityName', 'srcPostalCode', 'srcDetailAddress',
      'dstName', 'dstPhone', 'dstProvinceName', 'dstCityName', 'dstPostalCode', 'dstDetailAddress',
      'expressCategory', 'articleCategory', 'weight'
    ];
    
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for Flash Express API: ${missingFields.join(', ')}`);
    }
    
    // แปลงข้อมูลให้ตรงตามที่ Flash Express API ต้องการ
    // - ทำให้แน่ใจว่าข้อมูลตัวเลขส่งเป็น integer จริงๆ (ไม่ใช่ string)
    // - ทำให้แน่ใจว่า subItemTypes อยู่ในรูปแบบที่ถูกต้อง
    const subItemTypes = Array.isArray(orderData.subItemTypes) ? orderData.subItemTypes.map(item => {
      return {
        ...item,
        itemQuantity: item.itemQuantity ? parseInt(item.itemQuantity) : 1  // แปลงเป็นตัวเลข
      };
    }) : [];

    // สร้างข้อมูลตามรูปแบบที่ Flash Express API ต้องการ ตรงตามเอกสาร
    const formattedOrderData: Record<string, any> = {
      // ข้อมูลการยืนยัน
      mchId: MERCHANT_ID,
      nonceStr: Date.now().toString(),
      
      // ข้อมูลออเดอร์
      outTradeNo: orderData.outTradeNo || `SS${Date.now()}`,
      warehouseNo: orderData.warehouseNo || `${MERCHANT_ID}_001`,
      
      // ข้อมูลผู้ส่ง
      srcName: orderData.srcName,
      srcPhone: orderData.srcPhone,
      srcProvinceName: orderData.srcProvinceName,
      srcCityName: orderData.srcCityName,
      srcDistrictName: orderData.srcDistrictName || "",
      srcPostalCode: orderData.srcPostalCode,
      srcDetailAddress: orderData.srcDetailAddress,
      
      // ข้อมูลผู้รับ
      dstName: orderData.dstName,
      dstPhone: orderData.dstPhone,
      dstHomePhone: orderData.dstHomePhone || orderData.dstPhone,
      dstProvinceName: orderData.dstProvinceName,
      dstCityName: orderData.dstCityName,
      dstDistrictName: orderData.dstDistrictName || "",
      dstPostalCode: orderData.dstPostalCode,
      dstDetailAddress: orderData.dstDetailAddress,
      
      // ข้อมูลที่อยู่ส่งคืน
      returnName: orderData.returnName || orderData.srcName,
      returnPhone: orderData.returnPhone || orderData.srcPhone,
      returnProvinceName: orderData.returnProvinceName || orderData.srcProvinceName,
      returnCityName: orderData.returnCityName || orderData.srcCityName,
      returnDistrictName: orderData.returnDistrictName || orderData.srcDistrictName || "",
      returnPostalCode: orderData.returnPostalCode || orderData.srcPostalCode,
      returnDetailAddress: orderData.returnDetailAddress || orderData.srcDetailAddress,
      
      // ข้อมูลพัสดุ
      articleCategory: parseInt(orderData.articleCategory),
      expressCategory: parseInt(orderData.expressCategory),
      weight: parseInt(orderData.weight),
      width: parseInt(orderData.width || 20),
      length: parseInt(orderData.length || 30),
      height: parseInt(orderData.height || 10),
      
      // ข้อมูลการประกัน
      insured: parseInt(orderData.insured || 0),
      insureDeclareValue: orderData.insured === 1 ? parseInt(orderData.insureDeclareValue || 0) : 0,
      opdInsureEnabled: parseInt(orderData.opdInsureEnabled || 0),
      
      // ข้อมูล COD
      codEnabled: parseInt(orderData.codEnabled || 0),
      codAmount: orderData.codEnabled === 1 ? parseInt(orderData.codAmount || 0) : 0,
      
      // ข้อมูลอื่นๆ
      payType: parseInt(orderData.payType || 1),
      itemCategory: parseInt(orderData.itemCategory || orderData.articleCategory || 1),
      
      // รายการสินค้า
      subItemTypes: subItemTypes
    };
    
    // ข้อมูลพัสดุย่อย (ถ้ามี)
    if (Array.isArray(orderData.subParcel) && orderData.subParcel.length > 0) {
      formattedOrderData.subParcelQuantity = orderData.subParcel.length;
      formattedOrderData.subParcel = orderData.subParcel;
    }
    
    // หมายเหตุ (ถ้ามี)
    if (orderData.remark) {
      formattedOrderData.remark = orderData.remark;
    }
    
    // สร้างลายเซ็น
    const signature = createSignature(formattedOrderData, Date.now());
    
    // เพิ่มลายเซ็นเข้าไปในข้อมูล
    formattedOrderData.sign = signature;

    console.log('Sending order data to Flash Express API:', JSON.stringify(formattedOrderData, null, 2));

    // ลอง 3 วิธีในการส่งข้อมูล - เพื่อทดสอบว่าวิธีไหนใช้ได้
    try {
      // วิธีที่ 1: ส่งเป็น JSON
      const response1 = await axios.post(`${BASE_URL}/v3/orders`, formattedOrderData, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Method 1 success:', JSON.stringify(response1.data, null, 2));
      return response1.data;
    } catch (error1) {
      console.log('Method 1 failed. Trying method 2...');
      
      try {
        // วิธีที่ 2: ส่งเป็น form data
        const formData = new URLSearchParams();
        Object.entries(formattedOrderData).forEach(([key, value]) => {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });
        
        const response2 = await axios.post(`${BASE_URL}/v3/orders`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log('Method 2 success:', JSON.stringify(response2.data, null, 2));
        return response2.data;
      } catch (error2) {
        console.log('Method 2 failed. Trying method 3...');
        
        try {
          // วิธีที่ 3: ส่งเป็น query string
          const queryParams = new URLSearchParams();
          Object.entries(formattedOrderData).forEach(([key, value]) => {
            if (typeof value === 'object') {
              queryParams.append(key, JSON.stringify(value));
            } else {
              queryParams.append(key, String(value));
            }
          });
          
          const response3 = await axios.post(`${BASE_URL}/v3/orders?${queryParams.toString()}`, null, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Method 3 success:', JSON.stringify(response3.data, null, 2));
          return response3.data;
        } catch (error3: any) {
          console.error('All methods failed');
          
          // แสดงข้อมูลข้อผิดพลาดที่ละเอียดขึ้น
          let errorDetail = 'Unknown error';
          
          if (error3.response) {
            console.error('Response status:', error3.response.status);
            console.error('Response data:', JSON.stringify(error3.response.data, null, 2));
            console.error('Response headers:', JSON.stringify(error3.response.headers, null, 2));
            errorDetail = `Status ${error3.response.status}: ${error3.response.data?.message || 'No error message'}`;
          } else if (error3.request) {
            console.error('No response received. Request details:', error3.request);
            errorDetail = 'No response received from server';
          } else {
            console.error('Error message:', error3.message);
            errorDetail = error3.message;
          }
          
          throw new Error(`Flash Express API error: ${errorDetail}`);
        }
      }
    }
  } catch (error: any) {
    console.error('Unexpected error in createFlashOrder function:', error.message);
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
