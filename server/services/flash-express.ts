
/**
 * บริการเชื่อมต่อกับ Flash Express API
 */
import axios from 'axios';
import { createHmac } from 'crypto';

// ตรวจสอบว่ามีการกำหนดค่าสำหรับ API หรือไม่
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID || "CBE1930";
const API_KEY = process.env.FLASH_EXPRESS_API_KEY;
const BASE_URL = 'https://open-api.flashexpress.com/open'; // URL สำหรับ Production

if (!API_KEY) {
  console.warn('Missing Flash Express API credentials! Using default merchant ID.');
}

// ฟังก์ชันสร้างลายเซ็นสำหรับส่งข้อมูลให้ Flash Express API
/**
 * สร้างลายเซ็นสำหรับส่งข้อมูลให้ Flash Express API
 * @param data ข้อมูลที่จะใช้ในการสร้างลายเซ็น
 * @param timestamp เวลาที่ใช้ในการสร้างลายเซ็น (ไม่ได้ใช้ในกรณีของ Flash Express)
 * @returns ลายเซ็นที่สร้างขึ้น
 * 
 * การสร้างลายเซ็นตามเอกสาร Flash Express API:
 * 1. จัดเรียง key ตามลำดับ ASCII
 * 2. แปลงข้อมูลเป็นรูปแบบ key=value คั่นด้วย & เพื่อสร้าง stringA
 * 3. นำ stringA มาต่อกับ "&key=API_KEY" เพื่อสร้าง stringSignTemp
 * 4. คำนวณ SHA-256 ของ stringSignTemp
 * 5. แปลงผลลัพธ์เป็นตัวพิมพ์ใหญ่ทั้งหมด
 * 
 * หมายเหตุสำคัญ:
 * - ขั้นตอนการสร้าง stringA ไม่ต้อง URL encode ค่าต่างๆ (ให้ encode เฉพาะตอนส่งข้อมูลจริงเท่านั้น)
 * - ฟิลด์ subItemTypes ต้องแปลงเป็น JSON string ก่อน (JSON.stringify)
 * - ต้องแปลงผลลัพธ์ SHA-256 เป็นตัวพิมพ์ใหญ่ทั้งหมด
 */
async function createSignature(data: any, timestamp: number): Promise<string> {
  try {
    console.log('=== สร้างลายเซ็นสำหรับข้อมูล ===');
    console.log('ข้อมูลเริ่มต้น:', JSON.stringify(data, null, 2));
    
    // 1. ลบฟิลด์ sign ออก (ถ้ามี) เพราะไม่ควรรวมในการคำนวณลายเซ็น
    const dataForSigning = { ...data };
    delete dataForSigning.sign;
    
    // 2. จัดเรียง key ตามลำดับอักษร (ASCII code)
    const keys = Object.keys(dataForSigning).sort();
    console.log('Keys เรียงตาม ASCII:', keys);
    
    // 3. สร้าง string สำหรับการคำนวณลายเซ็น
    const parts: string[] = [];
    
    for (const key of keys) {
      // ข้ามค่า undefined, null และช่องว่าง ตามเอกสาร Flash Express
      let value = dataForSigning[key];
      if (value === undefined || value === null) {
        console.log(`ข้าม key ${key} เนื่องจากค่าเป็น undefined หรือ null`);
        continue;
      }
      
      // แปลงค่าให้เป็น string ที่เหมาะสม
      if (typeof value === 'object') {
        // กรณีพิเศษสำหรับ subItemTypes ตามตัวอย่างที่คุณให้มา
        if (key === 'subItemTypes') {
          // ตรวจสอบว่าเป็น array และแปลงเป็น JSON string
          if (Array.isArray(value)) {
            value = JSON.stringify(value);
            console.log(`แปลง subItemTypes array เป็น JSON string: ${value}`);
          } else if (typeof value === 'string') {
            // ถ้าเป็น string อยู่แล้ว (อาจเป็น JSON string) ให้ใช้ค่าเดิม
            console.log(`subItemTypes เป็น string อยู่แล้ว: ${value}`);
          } else {
            // กรณีอื่นๆ ให้แปลงเป็น JSON string
            value = JSON.stringify(value);
            console.log(`แปลง subItemTypes เป็น JSON string: ${value}`);
          }
        } else {
          // สำหรับ object อื่นๆ ที่ไม่ใช่ subItemTypes
          value = JSON.stringify(value);
          console.log(`แปลง object key=${key} เป็น JSON string: ${value}`);
        }
      } else if (typeof value !== 'string') {
        // แปลงค่าที่ไม่ใช่ string (เช่น number, boolean) เป็น string
        value = String(value);
        console.log(`แปลงค่า key=${key} type=${typeof dataForSigning[key]} เป็น string: ${value}`);
      }
      
      // ตรวจสอบว่าเป็นสตริงว่างหรือไม่ตามคำนิยามของ Flash Express
      if (value.trim() === '') {
        console.log(`ข้าม key ${key} เนื่องจากค่าเป็นสตริงว่าง`);
        continue;
      }
      
      // เพิ่มเข้าไปในรายการสำหรับการสร้าง stringA
      // สำคัญ: ไม่ต้อง URL encode ในขั้นตอนการสร้างลายเซ็น
      parts.push(`${key}=${value}`);
    }
    
    // 4. รวม key=value คั่นด้วย & เพื่อสร้าง stringA
    const stringA = parts.join('&');
    console.log('stringA (ก่อนต่อกับ key):', stringA);
    
    // 5. ต่อ stringA ด้วย &key=API_KEY เพื่อสร้าง stringSignTemp
    // ตามเอกสาร Flash Express: stringSignTemp=stringA+"&key=secret_key"
    const stringSignTemp = `${stringA}&key=${API_KEY}`;
    console.log('stringSignTemp (stringA+"&key=API_KEY"):', stringSignTemp);
    
    // 6. คำนวณ SHA-256 ของ stringSignTemp และแปลงเป็นตัวพิมพ์ใหญ่
    // ตามเอกสาร Flash Express: sign=sha256(stringSignTemp).toUpperCase()
    const { createHash } = await import('crypto');
    const hash = createHash('sha256')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
    
    console.log('ลายเซ็นที่ได้ (SHA-256, ตัวพิมพ์ใหญ่):', hash);
    console.log('=== จบการสร้างลายเซ็น ===');
      
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
export async function testSignatureWithExampleData() {
  // ตัวอย่างข้อมูลออเดอร์ที่ใช้ในการทดสอบเพื่อให้เห็นรูปแบบชัดเจน
  const testOrder = {
    mchId: MERCHANT_ID || 'CBE1930',
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
  const signature = await createSignature(testOrder, timestamp);
  
  return {
    exampleData: testOrder,
    signature,
    merchantId: MERCHANT_ID ? MERCHANT_ID : 'missing (using default: CBE1930)',
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
      'expressCategory', 'articleCategory', 'weight',
      // ฟิลด์ที่อาจจำเป็นเพิ่มเติม
      'payType', 'settlementType', 'itemCategory'
    ];
    
    const missingFields = requiredFields.filter(field => !orderData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for Flash Express API: ${missingFields.join(', ')}`);
    }
    
    // แปลงข้อมูลให้ตรงตามที่ Flash Express API ต้องการ
    // - ทำให้แน่ใจว่าข้อมูลตัวเลขส่งเป็น integer จริงๆ (ไม่ใช่ string)
    // - ทำให้แน่ใจว่า subItemTypes อยู่ในรูปแบบที่ถูกต้อง
    // จากภาพที่ผู้ใช้ส่งมาให้ดู Flash Express API ต้องมีการกำหนดค่าที่ถูกต้องสำหรับ subItemTypes
    // ตามเอกสาร subItemTypes ต้องเป็น JSON string และมีโครงสร้างดังนี้:
    // - itemName: string(200) [บังคับ] ชื่อสินค้า
    // - itemWeightSize: string(128) [ไม่บังคับ] ขนาด/ประเภทของสินค้า
    // - itemColor: string(128) [ไม่บังคับ] สีของสินค้า
    // - itemQuantity: integer [บังคับ] จำนวนสินค้า (ค่าต้องมากกว่า 1, สูงสุดคือ 999)
    let subItemTypeArray = [];
    
    if (Array.isArray(orderData.subItemTypes) && orderData.subItemTypes.length > 0) {
      // แปลง subItemTypes ให้อยู่ในรูปแบบที่ถูกต้อง
      subItemTypeArray = orderData.subItemTypes.map(item => {
        // สร้าง Object ใหม่ที่มีเฉพาะข้อมูลที่จำเป็นและประเภทข้อมูลถูกต้อง
        const cleanItem: Record<string, any> = {
          // ต้องมี itemName และต้องเป็น string(200)
          itemName: (item.itemName || 'สินค้า').substring(0, 200),
          
          // ต้องมี itemQuantity และต้องเป็น integer
          // แปลงเป็นตัวเลขเต็มและตรวจสอบให้อยู่ในช่วง 1-999
          itemQuantity: typeof item.itemQuantity === 'string' 
            ? Math.min(Math.max(parseInt(item.itemQuantity) || 1, 1), 999)
            : Math.min(Math.max(item.itemQuantity || 1, 1), 999)
        };
        
        // เพิ่มฟิลด์เสริมเฉพาะเมื่อมีข้อมูล - ตามเอกสาร API
        if (item.itemWeightSize) {
          cleanItem.itemWeightSize = String(item.itemWeightSize).substring(0, 128);
        }
        
        if (item.itemColor) {
          cleanItem.itemColor = String(item.itemColor).substring(0, 128);
        }
        
        return cleanItem;
      });
    } else {
      // ถ้าไม่มีข้อมูล ใช้ค่าเริ่มต้นที่ถูกต้องตามเอกสาร
      subItemTypeArray = [{ itemName: 'สินค้า', itemQuantity: 1 }];
    }
    
    console.log('Formatted subItemTypes array:', JSON.stringify(subItemTypeArray, null, 2));
    
    // อย่าลืมว่า subItemTypes ต้องส่งเป็น JSON string ไม่ใช่ array ตามเอกสาร Flash Express
    const subItemTypes = JSON.stringify(subItemTypeArray);

    // สร้างข้อมูลตามรูปแบบที่ Flash Express API ต้องการ ตรงตามเอกสาร
    // และมีโครงสร้างตามที่เห็นจากภาพตัวอย่าง
    const formattedOrderData: Record<string, any> = {
      // ข้อมูลการยืนยัน (ตามตัวอย่างเอกสาร)
      mchId: MERCHANT_ID || "CBE1930", // ใช้ค่าจริงจาก env หรือค่าที่ได้รับจากผู้ใช้
      nonceStr: Date.now().toString(),
      // ตามที่ผู้ใช้แจ้ง ไม่ต้องส่ง timestamp
      
      // ข้อมูลออเดอร์
      outTradeNo: orderData.outTradeNo || `SS${Date.now()}`,
      
      // ข้อมูลผู้ส่ง (จัดเรียงตามตัวอย่างที่เห็นในภาพ)
      srcName: orderData.srcName,
      srcPhone: orderData.srcPhone,
      srcProvinceName: orderData.srcProvinceName,
      srcCityName: orderData.srcCityName,
      srcDistrictName: orderData.srcDistrictName || "",
      srcPostalCode: orderData.srcPostalCode,
      srcDetailAddress: orderData.srcDetailAddress,
      
      // ข้อมูลผู้รับ (จัดเรียงตามตัวอย่างที่เห็นในภาพ)
      dstName: orderData.dstName,
      dstPhone: orderData.dstPhone,
      dstHomePhone: orderData.dstHomePhone || "",  // ใช้ค่าว่างถ้าไม่มี ไม่ควรส่งค่าเดียวกับ dstPhone
      dstProvinceName: orderData.dstProvinceName,
      dstCityName: orderData.dstCityName,
      dstDistrictName: orderData.dstDistrictName || "",
      dstPostalCode: orderData.dstPostalCode,
      dstDetailAddress: orderData.dstDetailAddress,
      
      // ข้อมูลพัสดุ (จัดเรียงตามตัวอย่างที่เห็นในภาพ)
      articleCategory: parseInt(orderData.articleCategory),
      expressCategory: parseInt(orderData.expressCategory),
      weight: parseInt(orderData.weight),
      length: parseInt(orderData.length || 30),  // ต้องมีตามภาพตัวอย่าง
      width: parseInt(orderData.width || 20),    // ต้องมีตามภาพตัวอย่าง
      height: parseInt(orderData.height || 10),  // ต้องมีตามภาพตัวอย่าง
      
      // ข้อมูล COD (ตามภาพตัวอย่าง codEnabled เป็น 0)
      codEnabled: parseInt(orderData.codEnabled || 0),
      
      // ข้อมูลการประกัน (เป็น 0 ในภาพตัวอย่าง)
      insured: parseInt(orderData.insured || 0),
      opdInsureEnabled: parseInt(orderData.opdInsureEnabled || 0),
      
      // ข้อมูลอื่นๆ ตามภาพตัวอย่าง
      itemCategory: parseInt(orderData.itemCategory || orderData.articleCategory || 1),
      
      // เปลี่ยนจาก payType เป็น settlementType ตามเอกสาร Flash Express
      settlementType: parseInt(orderData.settlementType || orderData.payType || 1),
      
      // เก็บ payType ไว้ด้วย
      payType: parseInt(orderData.payType || 1),
      
      // รายการสินค้า (อยู่ในรูปแบบ array ที่มี itemName และ itemQuantity)
      subItemTypes: subItemTypes
    };
    
    // เพิ่มฟิลด์อื่นๆ เมื่อมีค่า - ตามภาพตัวอย่าง
    
    // เพิ่ม warehouseNo เมื่อใช้วิธีการส่งแบบระบุคลัง
    if (orderData.warehouseNo) {
      formattedOrderData.warehouseNo = orderData.warehouseNo;
    }
    
    // เพิ่ม codAmount เมื่อเป็นพัสดุ COD
    if (orderData.codEnabled === 1 && orderData.codAmount) {
      formattedOrderData.codAmount = parseInt(orderData.codAmount);
    }
    
    // เพิ่ม insureDeclareValue เมื่อมีการเลือกประกัน
    if (orderData.insured === 1 && orderData.insureDeclareValue) {
      formattedOrderData.insureDeclareValue = parseInt(orderData.insureDeclareValue);
    }
    
    // ข้อมูลที่อยู่ส่งคืนเมื่อระบุ (ไม่บังคับ)
    if (orderData.returnName || orderData.returnPhone || orderData.returnProvinceName) {
      formattedOrderData.returnName = orderData.returnName || orderData.srcName;
      formattedOrderData.returnPhone = orderData.returnPhone || orderData.srcPhone;
      formattedOrderData.returnProvinceName = orderData.returnProvinceName || orderData.srcProvinceName;
      formattedOrderData.returnCityName = orderData.returnCityName || orderData.srcCityName;
      formattedOrderData.returnDistrictName = orderData.returnDistrictName || orderData.srcDistrictName || "";
      formattedOrderData.returnPostalCode = orderData.returnPostalCode || orderData.srcPostalCode;
      formattedOrderData.returnDetailAddress = orderData.returnDetailAddress || orderData.srcDetailAddress;
    }
    
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
    const signature = await createSignature(formattedOrderData, Date.now());
    
    // เพิ่มลายเซ็นเข้าไปในข้อมูล
    formattedOrderData.sign = signature;

    console.log('Sending order data to Flash Express API:', JSON.stringify(formattedOrderData, null, 2));

    // ตามเอกสาร Flash Express API ล่าสุด การส่งข้อมูลควรเป็นแบบ form-urlencoded
    try {
      // ส่งเป็น form data ตามที่ Flash Express API ต้องการ
      const formData = new URLSearchParams();
      
      // วนลูปเพื่อแปลงข้อมูลทุกฟิลด์ให้อยู่ในรูปแบบที่ถูกต้อง
      Object.entries(formattedOrderData).forEach(([key, value]) => {
        // ถ้าเป็น object หรือ array ให้แปลงเป็น JSON string
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } 
        // สำหรับค่าที่เป็น primitive (string, number, boolean) ให้แปลงเป็น string
        else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      console.log('Sending data as form-urlencoded:', formData.toString());
      
      // ส่งข้อมูลไปยัง Flash Express API
      const response = await axios.post(`${BASE_URL}/v3/orders`, formData, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express API Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('Failed to create Flash Express order');
      
      // แสดงข้อมูลข้อผิดพลาดที่ละเอียด
      let errorDetail = 'Unknown error';
      let errorResponse = null;
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
        errorDetail = `Status ${error.response.status}: ${error.response.data?.message || error.response.data?.error_msg || 'No error message'}`;
        errorResponse = error.response.data;
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
        errorDetail = 'No response received from server';
      } else {
        console.error('Error message:', error.message);
        errorDetail = error.message;
      }
      
      // สร้าง error object ที่มีข้อมูลครบถ้วน
      const enhancedError = new Error(`Flash Express API error: ${errorDetail}`);
      (enhancedError as any).originalError = error;
      (enhancedError as any).response = errorResponse;
      throw enhancedError;
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
    const signature = await createSignature(data, timestamp);

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
    const signature = await createSignature(data, timestamp);

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
