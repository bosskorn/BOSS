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
      
      // สร้างข้อมูลที่จะส่งไปยัง API
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
        dstHomePhone: orderData.dstHomePhone,
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
        insureDeclareValue: orderData.insureDeclareValue,
        codEnabled: orderData.codEnabled,
        codAmount: orderData.codAmount,
        remark: orderData.remark,
        // สำหรับ subItemTypes เราจะจัดการในการแปลงเป็น form-urlencoded
        // และไม่ใส่ใน requestData เดี๋ยวจะเพิ่มเองใน form data
        subItemTypes: undefined
      };
      
      console.log('ข้อมูลก่อนสร้างลายเซ็น:', JSON.stringify(requestData, null, 2));
      
      // สร้าง sign data แยกต่างหาก ไม่รวม subItemTypes
      const signData = { ...requestData };
      delete signData.subItemTypes;
      
      // ใช้ฟังก์ชันที่ปรับปรุงแล้วตามเอกสาร Flash Express
      const sign = generateFlashExpressSignature(
        FLASH_EXPRESS_API_KEY as string,
        signData,
        nonceStr
      );
      
      // เพิ่ม signature ที่คำนวณแล้วเข้าไปใน signData
      signData.sign = sign;
      
      console.log('ส่งข้อมูลไปยัง Flash Express API:', JSON.stringify(signData, null, 2));
      
      // เรียกใช้ API จริงของ Flash Express พร้อมกำหนดค่า timeout
      // ตาม API specification ต้องแปลงรูปแบบข้อมูลให้เป็น form-urlencoded format
      const formData = new URLSearchParams();
      
      // เพิ่มข้อมูลทั่วไปจาก signData (รวม sign แล้ว)
      for (const [key, value] of Object.entries(signData)) {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      }
      
      // จัดการกับ subItemTypes แยกต่างหากหลังจากสร้าง sign
      if (orderData.subItemTypes && orderData.subItemTypes.length > 0) {
        // เพิ่ม subItemTypes หลังจากคำนวณ sign แล้ว
        formData.append('subItemTypes', JSON.stringify(orderData.subItemTypes));
      } else {
        // เพิ่มค่าเริ่มต้นถ้าไม่มีข้อมูล
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