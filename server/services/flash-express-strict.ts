/**
 * บริการเชื่อมต่อกับ Flash Express API - ฉบับที่เข้มงวดที่สุด
 * ใช้ URL ใหม่: https://open-api-tra.flashexpress.com
 * ปรับปรุงการสร้างลายเซ็นตามเอกสารอย่างเคร่งครัดที่สุด
 * กรอง whitespace พิเศษตามที่ Flash Express ระบุในเอกสาร
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API (เพิ่มขึ้นเป็น 15 วินาที)
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
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express อย่างเคร่งครัดที่สุด
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
      
      // ข้ามค่าว่างและ whitespace พิเศษตามที่ Flash Express ระบุในเอกสาร
      if (
        typeof value === 'string' &&
        value.replace(/[\u0009-\u000D\u001C-\u001F]/g, '').trim() === ''
      ) continue;
      
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
 * สร้างการจัดส่งใหม่กับ Flash Express API (ฉบับเข้มงวดที่สุด)
 */
export const createFlashExpressShipping = async (
  orderData: {
    outTradeNo: string;                 // เลขออเดอร์
    srcName: string;                    // ชื่อผู้ส่ง
    srcPhone: string;                   // เบอร์โทรผู้ส่ง
    srcProvinceName: string;            // จังหวัดของผู้ส่ง
    srcCityName: string;                // อำเภอของผู้ส่ง
    srcDistrictName?: string;           // ตำบลของผู้ส่ง
    srcPostalCode: string;              // รหัสไปรษณีย์ของผู้ส่ง
    srcDetailAddress: string;           // ที่อยู่โดยละเอียดของผู้ส่ง
    dstName: string;                    // ชื่อผู้รับ
    dstPhone: string;                   // เบอร์โทรผู้รับ
    dstHomePhone?: string;              // เบอร์โทรศัพท์บ้านผู้รับ
    dstProvinceName: string;            // จังหวัดของผู้รับ
    dstCityName: string;                // อำเภอของผู้รับ
    dstDistrictName?: string;           // ตำบลของผู้รับ
    dstPostalCode: string;              // รหัสไปรษณีย์ของผู้รับ
    dstDetailAddress: string;           // ที่อยู่โดยละเอียดของผู้รับ
    articleCategory: number;            // ประเภทสินค้า
    expressCategory: number;            // ประเภทการจัดส่ง
    weight: number;                     // น้ำหนัก (กรัม)
    width?: number;                     // ความกว้าง (เซนติเมตร)
    length?: number;                    // ความยาว (เซนติเมตร)
    height?: number;                    // ความสูง (เซนติเมตร)
    insured: number;                    // ซื้อ Flash care หรือไม่ (1: ซื้อ 0: ไม่ซื้อ)
    insureDeclareValue?: number;        // มูลค่าสินค้า (หน่วย:สตางค์)
    codEnabled: number;                 // เป็นพัสดุ COD หรือไม่ (1: ใช่ 0: ไม่ใช่)
    codAmount?: number;                 // ยอด COD (หน่วย:สตางค์)
    remark?: string;                    // หมายเหตุ
    subItemTypes?: Array<{              // รายละเอียดสินค้า (จำเป็นสำหรับ COD)
      itemName: string;                 // ชื่อสินค้า
      itemWeightSize?: string;          // ข้อมูลขนาด/ไซส์ของสินค้า
      itemColor?: string;               // สีของสินค้า
      itemQuantity: number;             // จำนวนสินค้า
    }>;
  }
): Promise<{ 
  success: boolean; 
  trackingNumber?: string; 
  sortCode?: string;
  error?: string;
}> => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    console.log(`เริ่มสร้างการจัดส่งกับ Flash Express API สำหรับออเดอร์ ${orderData.outTradeNo} (ฉบับเข้มงวดที่สุด)`);
    console.log(`ผู้รับ: ${orderData.dstName}, ${orderData.dstPhone}, ${orderData.dstProvinceName}`);
    
    try {
      // 1. สร้างข้อมูลพื้นฐาน
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = generateNonceStr();
      
      // แปลงเบอร์โทรให้เป็นรูปแบบที่ถูกต้อง (ลบช่องว่างและขีด)
      const senderPhone = orderData.srcPhone.replace(/[\s-]/g, '');
      const recipientPhone = orderData.dstPhone.replace(/[\s-]/g, '');
      
      // 2. ข้อมูลคำขอพื้นฐาน (แปลงเป็น string ทั้งหมด)
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        timestamp: timestamp,
        outTradeNo: orderData.outTradeNo,
        srcName: orderData.srcName,
        srcPhone: senderPhone,
        srcProvinceName: orderData.srcProvinceName,
        srcCityName: orderData.srcCityName,
        srcPostalCode: orderData.srcPostalCode,
        srcDetailAddress: orderData.srcDetailAddress,
        dstName: orderData.dstName,
        dstPhone: recipientPhone,
        dstProvinceName: orderData.dstProvinceName,
        dstCityName: orderData.dstCityName,
        dstPostalCode: orderData.dstPostalCode,
        dstDetailAddress: orderData.dstDetailAddress,
        articleCategory: String(orderData.articleCategory), // แปลงเป็น string
        expressCategory: String(orderData.expressCategory), // แปลงเป็น string
        weight: String(orderData.weight), // แปลงเป็น string
        insured: String(orderData.insured), // แปลงเป็น string
        codEnabled: String(orderData.codEnabled) // แปลงเป็น string
      };
      
      // 3. เพิ่มข้อมูลเพิ่มเติมเฉพาะที่มี
      if (orderData.srcDistrictName) requestData.srcDistrictName = orderData.srcDistrictName;
      if (orderData.dstDistrictName) requestData.dstDistrictName = orderData.dstDistrictName;
      if (orderData.dstHomePhone) requestData.dstHomePhone = orderData.dstHomePhone.replace(/[\s-]/g, '');
      if (orderData.width) requestData.width = String(orderData.width);
      if (orderData.height) requestData.height = String(orderData.height);
      if (orderData.length) requestData.length = String(orderData.length);
      if (orderData.remark) requestData.remark = orderData.remark;
      
      // 4. เพิ่มข้อมูล COD ถ้ามี
      if (orderData.codEnabled === 1 && orderData.codAmount) {
        requestData.codAmount = String(orderData.codAmount);
      }
      
      // 5. เพิ่มข้อมูลประกันถ้ามี
      if (orderData.insured === 1 && orderData.insureDeclareValue) {
        requestData.insureDeclareValue = String(orderData.insureDeclareValue);
      }
      
      // 6. สร้างคัดลอกข้อมูลสำหรับสร้างลายเซ็น
      console.log('ข้อมูลคำขอก่อนสร้างลายเซ็น:', JSON.stringify(requestData, null, 2));
      
      // 7. สร้างลายเซ็น
      const signature = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY as string);
      
      // 8. แปลงข้อมูลเป็น form-urlencoded
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      }
      
      // 9. เพิ่มลายเซ็นในข้อมูล
      formData.append('sign', signature);
      
      // 10. จัดการกับ subItemTypes แยกต่างหาก (สำคัญ!)
      if (orderData.subItemTypes && orderData.subItemTypes.length > 0) {
        const subItemTypesJSON = JSON.stringify(orderData.subItemTypes);
        formData.append('subItemTypes', subItemTypesJSON);
        console.log('subItemTypes ที่ส่งไป:', subItemTypesJSON);
      } else if (orderData.codEnabled === 1) {
        // จำเป็นต้องมี subItemTypes หากเป็น COD
        const defaultItem = [{
          itemName: 'สินค้า',
          itemWeightSize: '1Kg',
          itemColor: '-',
          itemQuantity: 1
        }];
        formData.append('subItemTypes', JSON.stringify(defaultItem));
        console.log('subItemTypes ค่าเริ่มต้นที่ส่งไป (สำหรับ COD):', JSON.stringify(defaultItem));
      }
      
      // 11. ตั้งค่า Headers ที่ถูกต้อง (สำคัญ!)
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Flash-Signature': signature,
        'X-Flash-Timestamp': timestamp,
        'X-Flash-Nonce': nonceStr,
        'Accept': 'application/json'
      };
      
      console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
      console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
      console.log('FormData ที่ส่งไป:', formData.toString());
      
      // 12. เรียกใช้ API
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        headers: headers,
        timeout: API_TIMEOUT,
        data: formData
      });
      
      console.log("Flash Express API Response:", JSON.stringify(response.data, null, 2));
  
      // 13. ตรวจสอบผลลัพธ์
      if (response.data && response.data.code === 1) {
        return {
          success: true,
          trackingNumber: response.data.data.pno,
          sortCode: response.data.data.sortCode
        };
      } else {
        console.log('การตอบกลับไม่สำเร็จจาก Flash Express API:', response.data);
        throw new Error(response.data?.message || 'API ไม่ตอบสนองตามที่คาดหวัง');
      }
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API:', apiError);
      
      // แสดงข้อมูลเพิ่มเติมหากมี response
      if (apiError.response) {
        console.error('Flash Express API Response:', apiError.response.status, apiError.response.statusText);
        console.error('Flash Express API Data:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      // สร้างข้อความผิดพลาดที่ชัดเจน
      let errorMessage = 'ไม่สามารถสร้างเลขพัสดุจาก Flash Express ได้';
      if (apiError.response && apiError.response.data) {
        errorMessage = `Flash Express API error: ${apiError.response.data.message || apiError.response.statusText || apiError.message}`;
      } else if (apiError.message) {
        errorMessage = `Flash Express API error: ${apiError.message}`;
      }
  
      // ส่งกลับข้อผิดพลาดที่ชัดเจน
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error: any) {
    console.error('Error creating Flash Express shipping:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shipping'
    };
  }
};

/**
 * ดึงตัวเลือกการจัดส่งจาก Flash Express API
 */
export const getFlashExpressShippingOptions = async (
  fromAddress: {
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  },
  toAddress: {
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  },
  packageInfo: {
    weight: number; // น้ำหนักเป็นกิโลกรัม
    width?: number;  // ความกว้างเป็นเซนติเมตร
    length?: number; // ความยาวเป็นเซนติเมตร
    height?: number; // ความสูงเป็นเซนติเมตร
  }
) => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    console.log(`เริ่มดึงข้อมูลตัวเลือกการจัดส่งจาก Flash Express API: ${FLASH_EXPRESS_API_URL}`);
    console.log(`ข้อมูลที่ส่ง: จาก ${fromAddress.province} ถึง ${toAddress.province}, น้ำหนัก ${packageInfo.weight} กก.`);
    
    try {
      // สร้างข้อมูลพื้นฐาน
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = generateNonceStr();
      
      // ข้อมูลคำขอพื้นฐาน (แปลงเป็น string ทั้งหมด)
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        timestamp: timestamp,
        fromPostalCode: fromAddress.zipcode,
        toPostalCode: toAddress.zipcode, 
        weight: String(Math.round(packageInfo.weight * 1000)), // แปลงจาก กก. เป็น กรัม
      };
      
      // สร้างลายเซ็น
      const signature = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY as string);
      
      // แปลงข้อมูลเป็น form-urlencoded
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      }
      
      // เพิ่มลายเซ็นในข้อมูล
      formData.append('sign', signature);
      
      // ตั้งค่า Headers
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Flash-Signature': signature,
        'X-Flash-Timestamp': timestamp,
        'X-Flash-Nonce': nonceStr,
        'Accept': 'application/json'
      };
      
      console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
      console.log('FormData ที่ส่งไป:', formData.toString());
      
      // ทดลองใช้ URL หลายรูปแบบ
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
          response = await axios({
            method: 'post',
            url: `${FLASH_EXPRESS_API_URL}${endpoint}`,
            headers: headers,
            timeout: API_TIMEOUT,
            data: formData
          });
          
          // ถ้าไม่มี error แสดงว่าสำเร็จ
          successEndpoint = endpoint;
          console.log(`เรียก endpoint ${endpoint} สำเร็จ`);
          break;
        } catch (err: any) {
          console.log(`เรียก endpoint ${endpoint} ล้มเหลว: ${err.message}`);
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
      
      // ตรวจสอบผลลัพธ์
      if (response.data && response.data.code === 1) {
        // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
        const options = response.data.data.map((item: any, index: number) => ({
          id: index + 1,
          name: `Flash Express - ${item.serviceName || 'บริการขนส่ง'}`,
          price: parseFloat(item.fee) / 100 || 0, // แปลงจากสตางค์เป็นบาท
          deliveryTime: item.estimatedDeliveryTime || '1-3 วัน',
          provider: 'Flash Express',
          serviceId: item.serviceId || `FLASH-${index}`,
          logo: '/assets/flash-express.png'
        }));
        
        return options;
      } else {
        // ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น
        console.log('ไม่พบข้อมูลจาก API ใช้ข้อมูลเริ่มต้นแทน');
        return [
          {
            id: 1,
            name: 'Flash Express - ส่งด่วน',
            price: 60,
            deliveryTime: '1-2 วัน',
            provider: 'Flash Express',
            serviceId: 'FLASH-FAST',
            logo: '/assets/flash-express.png'
          },
          {
            id: 2,
            name: 'Flash Express - ส่งธรรมดา',
            price: 40,
            deliveryTime: '2-3 วัน',
            provider: 'Flash Express',
            serviceId: 'FLASH-NORMAL',
            logo: '/assets/flash-express.png'
          }
        ];
      }
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API สำหรับการดึงตัวเลือกการจัดส่ง:', apiError);
      
      // ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น
      console.log('ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น');
      return [
        {
          id: 1,
          name: 'Flash Express - ส่งด่วน',
          price: 60,
          deliveryTime: '1-2 วัน',
          provider: 'Flash Express',
          serviceId: 'FLASH-FAST',
          logo: '/assets/flash-express.png'
        },
        {
          id: 2,
          name: 'Flash Express - ส่งธรรมดา',
          price: 40,
          deliveryTime: '2-3 วัน',
          provider: 'Flash Express',
          serviceId: 'FLASH-NORMAL',
          logo: '/assets/flash-express.png'
        }
      ];
    }
  } catch (error: any) {
    console.error('Error getting Flash Express shipping options:', error);
    throw new Error(`ไม่สามารถเรียกข้อมูลจาก Flash Express API ได้: ${error.message}`);
  }
};