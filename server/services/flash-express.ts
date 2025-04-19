import axios from 'axios';
import { Request, Response } from 'express';
import { generateFlashExpressSignature, generateNonceStr } from './generate-signature';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API (เพิ่มขึ้นเป็น 15 วินาที)
const API_TIMEOUT = 15000; // 15 วินาที

// ฟังก์ชันสร้างลายเซ็นตามเอกสาร Flash Express
function createDirectSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // ขั้นตอนแรก: ตั้งค่าข้อมูลทั้งหมดที่ส่งหรือรับเป็นชุด M
    // สร้างชุดข้อมูลใหม่ (ไม่รวม sign และ subItemTypes)
    const paramsCopy: Record<string, any> = {};
    
    // จัดเรียงพารามิเตอร์โดยนำค่าพารามิเตอร์ที่ไม่เป็นค่าว่างไว้ในชุด M
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ตรวจสอบค่าว่าง
      if (value === null || value === undefined) continue;
      
      // ตรวจสอบสตริงว่างตามที่เอกสารระบุ (A-Z ≠ a-z - case sensitive)
      if (typeof value === 'string' && /^[ \t\n\f\r\u001c\u001d\u001e\u001f]*$/.test(value)) continue;
      
      // เพิ่มค่าที่ผ่านเข้าไปในชุดข้อมูลใหม่
      paramsCopy[key] = value;
    }
    
    // เรียงชื่อพารามิเตอร์ตาม ASCII code โดยเรียงจากเล็กไปใหญ่ (dictionary order)
    const sortedKeys = Object.keys(paramsCopy).sort();
    const stringParts: string[] = [];
    
    // สร้างสตริงตามรูปแบบ key1=value1&key2=value2...
    for (const key of sortedKeys) {
      let value = paramsCopy[key];
      
      // แปลงค่า Array หรือ Object เป็น JSON string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      stringParts.push(`${key}=${value}`);
    }
    
    // สร้าง stringA ด้วยการรวมพารามิเตอร์เป็นสตริงเดียว คั่นด้วย &
    const stringA = stringParts.join('&');
    
    // นำ stringA มาต่อด้วย secret_key และเก็บไว้ที่ stringSignTemp
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('===========================================================');
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น Flash Express:');
    console.log(stringSignTemp);
    
    // เข้ารหัสด้วย SHA256 และทำเป็นตัวพิมพ์ใหญ่ทั้งหมด
    const signature = crypto
      .createHash('sha256')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
      
    console.log('ลายเซ็น Flash Express ที่สร้าง:', signature);
    console.log('===========================================================');
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ตรวจสอบว่ามี API key หรือไม่
if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
  console.warn('FLASH_EXPRESS_MERCHANT_ID or FLASH_EXPRESS_API_KEY not set');
  console.warn('กรุณาตั้งค่า FLASH_EXPRESS_MERCHANT_ID และ FLASH_EXPRESS_API_KEY ในไฟล์ .env');
}

// ประเภทข้อมูลสำหรับตัวเลือกการจัดส่ง
interface FlashExpressShippingOption {
  id: number;
  name: string;
  price: number;
  deliveryTime: string;
  provider: string;
  serviceId: string;
  logo?: string;
}

// ประเภทข้อมูลสำหรับที่อยู่
interface AddressInfo {
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
}

/**
 * ดึงตัวเลือกการจัดส่งจาก Flash Express
 */
export const getFlashExpressShippingOptions = async (
  fromAddress: AddressInfo,
  toAddress: AddressInfo,
  packageInfo: {
    weight: number; // น้ำหนักเป็นกิโลกรัม
    width: number;  // ความกว้างเป็นเซนติเมตร
    length: number; // ความยาวเป็นเซนติเมตร
    height: number; // ความสูงเป็นเซนติเมตร
  }
): Promise<FlashExpressShippingOption[]> => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    console.log(`เริ่มการเชื่อมต่อกับ Flash Express API: ${FLASH_EXPRESS_API_URL}`);
    console.log(`ข้อมูลที่ส่ง: จาก ${fromAddress.province} ถึง ${toAddress.province}, น้ำหนัก ${packageInfo.weight} กก.`);
    
    try {
      // สร้าง nonce string
      const nonceStr = generateNonceStr();
      
      // สร้างข้อมูลที่จะส่งไปยัง API
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        fromPostalCode: fromAddress.zipcode,
        toPostalCode: toAddress.zipcode, 
        weight: packageInfo.weight * 1000, // แปลงจาก กก. เป็น กรัม
      };
      
      // สร้าง signature
      const sign = generateFlashExpressSignature(
        FLASH_EXPRESS_API_KEY as string,
        requestData,
        nonceStr
      );
      
      // เพิ่ม signature เข้าไปในข้อมูล
      requestData.sign = sign;
      
      // แปลงข้อมูลเป็น form-urlencoded
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      }
      
      // เรียกใช้ API จริงของ Flash Express พร้อมกำหนดค่า timeout
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/pricing`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: API_TIMEOUT, // กำหนด timeout เพื่อไม่ให้รอนานเกินไป
        data: formData
      });

      console.log("ได้รับการตอบกลับจาก Flash Express API:", response.data);

      // แปลงข้อมูลจาก API เป็นรูปแบบที่ต้องการ
      if (response.data && response.data.code === 1 && response.data.data && Array.isArray(response.data.data)) {
        const options: FlashExpressShippingOption[] = response.data.data.map((item: any, index: number) => ({
          id: index + 1,
          name: `Flash Express - ${item.serviceName || 'บริการขนส่ง'}`,
          price: parseFloat(item.fee) / 100 || 0, // แปลงจากสตางค์เป็นบาท
          deliveryTime: item.estimatedDeliveryTime || '1-3 วัน',
          provider: 'Flash Express',
          serviceId: item.serviceId || `FLASH-${index}`,
          logo: '/assets/flash-express.png'
        }));

        console.log(`พบบริการขนส่ง ${options.length} รายการจาก Flash Express API`);
        return options;
      } else {
        throw new Error('ไม่พบข้อมูลบริการขนส่งจาก API');
      }
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API:', apiError.message);
      // ไม่ใช้ข้อมูลสำรองอีกต่อไป ให้แสดงข้อผิดพลาดเพื่อให้ผู้ใช้แก้ไข
      throw new Error(`ไม่สามารถเรียกข้อมูลจาก Flash Express API ได้: ${apiError.message}`);
    }
  } catch (error: any) {
    console.error('Error getting Flash Express shipping options:', error);
    throw new Error(`Failed to get shipping options: ${error.message}`);
  }
};

/**
 * สร้างการจัดส่งใหม่กับ Flash Express V3 (ตามเอกสาร)
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
    subItemTypes?: Array<{             // รายละเอียดสินค้า (จำเป็นสำหรับ COD)
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
    
    console.log(`เริ่มสร้างการจัดส่งกับ Flash Express API สำหรับออเดอร์ ${orderData.outTradeNo}`);
    console.log(`ผู้รับ: ${orderData.dstName}, ${orderData.dstPhone}, ${orderData.dstProvinceName}`);
    
    // สร้างข้อมูลสำหรับส่งไปยัง Flash Express API ในรูปแบบที่ API ต้องการ
    // ตามเอกสารของ Flash Express
    try {
      // สร้าง random nonce string
      const nonceStr = generateNonceStr();
      
      // สร้างข้อมูลที่จะส่งไปยัง API (ลดความซับซ้อนลงเพื่อให้ API ทำงานได้ก่อน)
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        outTradeNo: orderData.outTradeNo,
        srcName: orderData.srcName,
        srcPhone: orderData.srcPhone,
        srcProvinceName: orderData.srcProvinceName,
        srcCityName: orderData.srcCityName,
        srcDistrictName: orderData.srcDistrictName,
        srcPostalCode: orderData.srcPostalCode,
        srcDetailAddress: orderData.srcDetailAddress,
        dstName: orderData.dstName,
        dstPhone: orderData.dstPhone,
        dstProvinceName: orderData.dstProvinceName,
        dstCityName: orderData.dstCityName,
        dstDistrictName: orderData.dstDistrictName,
        dstPostalCode: orderData.dstPostalCode,
        dstDetailAddress: orderData.dstDetailAddress,
        articleCategory: orderData.articleCategory,
        expressCategory: orderData.expressCategory,
        weight: orderData.weight,
        width: orderData.width,
        length: orderData.length,
        height: orderData.height,
        insured: orderData.insured,
        codEnabled: orderData.codEnabled
      };
      
      console.log('ข้อมูลก่อนสร้างลายเซ็น:', JSON.stringify(requestData, null, 2));
      
      // ใช้ฟังก์ชันทางเลือกในการสร้างลายเซ็นแบบตรงๆ
      const sign = createDirectSignature(requestData, FLASH_EXPRESS_API_KEY as string);
      
      // เก็บ requestData ไว้ใช้ต่อ
      const signData = { ...requestData };
      
      // เพิ่ม signature ที่คำนวณแล้วเข้าไปใน signData
      signData.sign = sign;
      
      console.log('ส่งข้อมูลไปยัง Flash Express API:', JSON.stringify(signData, null, 2));
      
      // เรียกใช้ API จริงของ Flash Express พร้อมกำหนดค่า timeout
      // ตาม API specification ต้องแปลงรูปแบบข้อมูลให้เป็น form-urlencoded format
      const formData = new URLSearchParams();
      
      // สำคัญ: คำนวณลายเซ็นก่อนเรียกใช้ urlencode ตามเอกสาร Flash Express
      // การแปลงข้อมูลให้เป็น form-urlencoded จะทำโดย URLSearchParams
      // ต้องเตรียมข้อมูลให้ถูกต้องก่อนทำ URL encoding
      
      for (const [key, value] of Object.entries(signData)) {
        if (value !== undefined) {
          // URLSearchParams จะทำการ encode ให้อัตโนมัติ
          formData.append(key, value.toString());
        }
      }
      
      // จัดการกับ subItemTypes แยกต่างหากหลังจากสร้าง sign ตามเอกสาร
      if (orderData.subItemTypes && orderData.subItemTypes.length > 0) {
        // เพิ่ม subItemTypes หลังจากคำนวณ sign แล้ว
        // แปลงเป็น JSON string ก่อนแล้วให้ URLSearchParams ทำการ encode
        formData.append('subItemTypes', JSON.stringify(orderData.subItemTypes));
      } else if (orderData.codEnabled === 1) {
        // จำเป็นต้องมี subItemTypes หากเป็น COD ตามเอกสาร
        const defaultItem = [{
          itemName: 'สินค้า',
          itemWeightSize: '1Kg',
          itemColor: '-',
          itemQuantity: 1
        }];
        formData.append('subItemTypes', JSON.stringify(defaultItem));
      }
      
      // ลอง logging ค่า formData ที่จะส่งไปยัง API
      console.log('Form data ที่ส่งไปยัง API:');
      console.log(formData.toString());
      
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: API_TIMEOUT, // กำหนด timeout เพื่อไม่ให้รอนานเกินไป
        data: formData
      });

      console.log("ได้รับการตอบกลับจาก Flash Express API สำหรับการสร้างการจัดส่ง:", response.data);
  
      // ตรวจสอบผลลัพธ์
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
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API สำหรับการสร้างการจัดส่ง:', apiError.message);
      
      // กรณีที่ API ไม่ตอบสนองหรือมีปัญหา ให้ส่งข้อผิดพลาดกลับไปยังผู้ใช้
      console.log('ไม่สามารถสร้างเลขพัสดุได้ กรุณาลองใหม่อีกครั้ง');
      
      // อ่านข้อผิดพลาดจาก API response ถ้ามี
      let errorMessage = 'ไม่สามารถสร้างเลขพัสดุจาก Flash Express ได้ กรุณาลองใหม่อีกครั้ง';
      if (apiError.response && apiError.response.data) {
        errorMessage = `Flash Express API error: ${apiError.response.data.message || apiError.response.statusText}`;
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
 * ตรวจสอบสถานะการจัดส่งจาก Flash Express
 */
export const getFlashExpressTrackingStatus = async (trackingNumber: string): Promise<any> => {
  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }

    console.log(`ตรวจสอบสถานะการจัดส่งจาก Flash Express สำหรับหมายเลขพัสดุ: ${trackingNumber}`);
    
    try {
      // สร้าง nonce string
      const nonceStr = generateNonceStr();
      
      // สร้างข้อมูลที่จะส่งไปยัง API
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        pno: trackingNumber
      };
      
      // สร้าง signature
      const sign = generateFlashExpressSignature(
        FLASH_EXPRESS_API_KEY as string,
        requestData,
        nonceStr
      );
      
      // เพิ่ม signature เข้าไปในข้อมูล
      requestData.sign = sign;
      
      // แปลงข้อมูลเป็น form-urlencoded
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      }
      
      // เรียกใช้ API จริงของ Flash Express พร้อมกำหนดค่า timeout
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/tracking`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: API_TIMEOUT, // กำหนด timeout เพื่อไม่ให้รอนานเกินไป
        data: formData
      });

      console.log("ได้รับข้อมูลสถานะการจัดส่งจาก Flash Express API:", response.data);
      
      // รูปแบบการตอบกลับของ V3 API แตกต่างจากเดิม
      if (response.data && response.data.code === 1 && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'ไม่พบข้อมูลสถานะการจัดส่ง');
      }
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API สำหรับตรวจสอบสถานะ:', apiError.message);
      
      // กรณีที่ API ไม่ตอบสนองหรือมีปัญหา แจ้งข้อผิดพลาด
      console.log('ไม่สามารถตรวจสอบสถานะพัสดุได้ กรุณาลองใหม่อีกครั้ง');
      
      throw new Error('ไม่สามารถตรวจสอบสถานะพัสดุจาก Flash Express ได้ กรุณาลองใหม่อีกครั้ง');
    }
  } catch (error: any) {
    console.error('Error getting Flash Express tracking status:', error);
    throw new Error(`Failed to get tracking status: ${error.message}`);
  }
};