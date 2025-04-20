/**
 * บริการเชื่อมต่อกับ Flash Express API - แก้ไขตามข้อแนะนำล่าสุด
 * ตามเอกสารอ้างอิง: https://flash-express.readme.io/v3/reference/
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API (เพิ่มขึ้นเป็น 15 วินาที)
const API_TIMEOUT = 15000; // 15 วินาที

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16): string {
  const timestamp = Date.now();
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = timestamp.toString();
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ฟังก์ชันสร้างลายเซ็นตามเอกสาร Flash Express - ฉบับแก้ไขตามข้อแนะนำล่าสุด
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // คัดกรองพารามิเตอร์
    const filteredParams: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      if (value === null || value === undefined) continue;
      
      // แปลงค่าเป็นสตริงทั้งหมด
      filteredParams[key] = String(value);
    }
    
    // เพิ่ม timestamp ถ้าไม่มี
    if (!filteredParams.timestamp) {
      filteredParams.timestamp = String(Math.floor(Date.now() / 1000));
    }
    
    // เรียงลำดับ keys ตาม ASCII
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // สร้างสตริงพารามิเตอร์
    const paramString = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&');
    
    // เพิ่ม API key
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    console.log('========== DEBUG FLASH EXPRESS SIGNATURE ==========');
    console.log('พารามิเตอร์ที่ใช้สร้างลายเซ็น:', JSON.stringify(filteredParams, null, 2));
    console.log('สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณ SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
      
    console.log('ลายเซ็นที่สร้าง:', signature);
    console.log('==================================================');
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น Flash Express:', error);
    throw error;
  }
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
 * ดึงตัวเลือกการจัดส่งจาก Flash Express API (ปรับปรุงด้วย Headers ที่ถูกต้อง)
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

    console.log(`เริ่มดึงข้อมูลตัวเลือกการจัดส่งจาก Flash Express API: ${FLASH_EXPRESS_API_URL}`);
    console.log(`ข้อมูลที่ส่ง: จาก ${fromAddress.province} ถึง ${toAddress.province}, น้ำหนัก ${packageInfo.weight} กก.`);
    
    try {
      // 1. สร้างข้อมูลคำขอ
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = generateNonceStr();
      
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        timestamp: timestamp,
        fromPostalCode: fromAddress.zipcode,
        toPostalCode: toAddress.zipcode, 
        weight: String(Math.round(packageInfo.weight * 1000)), // แปลงจาก กก. เป็น กรัม และทำให้เป็นสตริง
      };
      
      // 2. สร้าง signature
      const sign = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY as string);
      
      // 3. เพิ่ม signature เข้าไปในข้อมูล
      requestData.sign = sign;
      
      // 4. แปลงข้อมูลเป็น form-urlencoded format
      const formData = new URLSearchParams();
      
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      }
      
      // 5. เตรียม Headers ที่ถูกต้อง
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Flash-Signature': sign,
        'X-Flash-Timestamp': timestamp,
        'X-Flash-Nonce': nonceStr,
        'Accept': 'application/json'
      };
      
      console.log('Headers ที่ส่ง:', JSON.stringify(headers, null, 2));
      console.log('FormData ที่ส่งไปที่ Flash Express API:', formData.toString());
      
      // 6. เรียกใช้ API
      // ทดลองเรียก API ด้วย URL หลัก
      let response;
      try {
        response = await axios({
          method: 'post',
          url: `${FLASH_EXPRESS_API_URL}/open/v3/pricing`,
          headers: headers,
          timeout: API_TIMEOUT,
          data: formData
        });
      } catch (error) {
        console.log('URL แรกไม่สำเร็จ ลองใช้ URL ทางเลือก');
        
        // ถ้า URL แรกไม่สำเร็จ ลองใช้ URL ทางเลือก
        response = await axios({
          method: 'post',
          url: `${FLASH_EXPRESS_API_URL}/open/v2/pricing/calculate`,
          headers: headers,
          timeout: API_TIMEOUT,
          data: formData
        });
      }

      console.log("Flash Express Pricing API Response:", JSON.stringify(response.data, null, 2));

      // 7. แปลงข้อมูลจาก API เป็นรูปแบบที่ต้องการ
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
        console.log('ข้อมูลจาก Flash Express API ไม่ถูกต้อง:', response.data);
        throw new Error('ไม่พบข้อมูลบริการขนส่งจาก API: ' + (response.data?.message || 'ไม่มีข้อมูลเพิ่มเติม'));
      }
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API:', apiError);
      
      // แสดงข้อมูลเพิ่มเติมหากมี response
      if (apiError.response) {
        console.error('Flash Express API Response:', apiError.response.status, apiError.response.statusText);
        console.error('Flash Express API Data:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      throw new Error(`ไม่สามารถเรียกข้อมูลจาก Flash Express API ได้: ${apiError.message}`);
    }
  } catch (error: any) {
    console.error('Error getting Flash Express shipping options:', error);
    throw new Error(`Failed to get shipping options: ${error.message}`);
  }
};

/**
 * สร้างการจัดส่งใหม่กับ Flash Express V3 API (ปรับปรุงตามข้อแนะนำล่าสุด)
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
    
    console.log(`เริ่มสร้างการจัดส่งกับ Flash Express API สำหรับออเดอร์ ${orderData.outTradeNo}`);
    console.log(`ผู้รับ: ${orderData.dstName}, ${orderData.dstPhone}, ${orderData.dstProvinceName}`);
    
    try {
      // 1. สร้างข้อมูลคำขอ
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = generateNonceStr();
      
      // 2. เตรียมข้อมูลคำขอ (แปลงค่าทั้งหมดเป็นสตริง)
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        timestamp: timestamp,
        outTradeNo: String(orderData.outTradeNo),
        srcName: String(orderData.srcName),
        srcPhone: String(orderData.srcPhone.replace(/[\s-]/g, '')), // ลบช่องว่างและขีด
        srcProvinceName: String(orderData.srcProvinceName),
        srcCityName: String(orderData.srcCityName),
        srcPostalCode: String(orderData.srcPostalCode),
        srcDetailAddress: String(orderData.srcDetailAddress),
        dstName: String(orderData.dstName),
        dstPhone: String(orderData.dstPhone.replace(/[\s-]/g, '')), // ลบช่องว่างและขีด
        dstProvinceName: String(orderData.dstProvinceName),
        dstCityName: String(orderData.dstCityName),
        dstPostalCode: String(orderData.dstPostalCode),
        dstDetailAddress: String(orderData.dstDetailAddress),
        articleCategory: String(orderData.articleCategory),
        expressCategory: String(orderData.expressCategory),
        weight: String(Math.round(orderData.weight)), // แปลงเป็นสตริง
        insured: String(orderData.insured),
        codEnabled: String(orderData.codEnabled)
      };
      
      // 2.1 เพิ่มข้อมูลเพิ่มเติมเฉพาะที่มี
      if (orderData.srcDistrictName) requestData.srcDistrictName = String(orderData.srcDistrictName);
      if (orderData.dstDistrictName) requestData.dstDistrictName = String(orderData.dstDistrictName);
      if (orderData.dstHomePhone) requestData.dstHomePhone = String(orderData.dstHomePhone.replace(/[\s-]/g, ''));
      if (orderData.width) requestData.width = String(Math.round(orderData.width));
      if (orderData.height) requestData.height = String(Math.round(orderData.height));
      if (orderData.length) requestData.length = String(Math.round(orderData.length));
      if (orderData.remark) requestData.remark = String(orderData.remark);
      
      // 2.2 เพิ่มข้อมูล COD ถ้ามี (แปลงเป็นสตริง)
      if (orderData.codEnabled === 1 && orderData.codAmount) {
        requestData.codAmount = String(Math.round(orderData.codAmount));
      }
      
      // 2.3 เพิ่มข้อมูลประกันถ้ามี (แปลงเป็นสตริง)
      if (orderData.insured === 1 && orderData.insureDeclareValue) {
        requestData.insureDeclareValue = String(Math.round(orderData.insureDeclareValue));
      }
      
      // 3. แยก subItemTypes ออกมาก่อนสร้างลายเซ็น
      const subItemTypes = orderData.subItemTypes;
      
      // 4. สร้าง signature (ไม่รวม subItemTypes)
      const sign = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY as string);
      
      // 5. เพิ่ม signature เข้าไปในข้อมูล
      requestData.sign = sign;
      
      // 6. แปลงข้อมูลเป็น form-urlencoded format
      const formData = new URLSearchParams();
      
      // 6.1 เพิ่มข้อมูลหลักทั้งหมดรวมถึง signature
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      }
      
      // 6.2 จัดการกับ subItemTypes แยกต่างหาก
      if (subItemTypes && subItemTypes.length > 0) {
        const subItemTypesJSON = JSON.stringify(subItemTypes);
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
        console.log('subItemTypes ค่าเริ่มต้นที่ส่งไป:', JSON.stringify(defaultItem));
      }
      
      // 7. เตรียม Headers ที่ถูกต้อง
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Flash-Signature': sign,
        'X-Flash-Timestamp': timestamp,
        'X-Flash-Nonce': nonceStr,
        'Accept': 'application/json'
      };
      
      console.log('Headers ที่ส่ง:', JSON.stringify(headers, null, 2));
      console.log('FormData ที่ส่งไป Flash Express Orders API:', formData.toString());
      
      // 8. เรียกใช้ API สร้างการจัดส่ง
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        headers: headers,
        timeout: API_TIMEOUT,
        data: formData
      });

      console.log("Flash Express Orders API Response:", JSON.stringify(response.data, null, 2));
  
      // 9. ตรวจสอบผลลัพธ์
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
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API สำหรับการสร้างการจัดส่ง:', apiError);
      
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
      // 1. สร้างข้อมูลคำขอ
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = generateNonceStr();
      
      const requestData: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        timestamp: timestamp,
        pno: String(trackingNumber)
      };
      
      // 2. สร้าง signature
      const sign = generateFlashSignature(requestData, FLASH_EXPRESS_API_KEY as string);
      
      // 3. เพิ่ม signature เข้าไปในข้อมูล
      requestData.sign = sign;
      
      // 4. แปลงข้อมูลเป็น form-urlencoded format
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(requestData)) {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      }
      
      // 5. เตรียม Headers ที่ถูกต้อง
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Flash-Signature': sign,
        'X-Flash-Timestamp': timestamp,
        'X-Flash-Nonce': nonceStr,
        'Accept': 'application/json'
      };
      
      console.log('Headers ที่ส่ง:', JSON.stringify(headers, null, 2));
      console.log('FormData ที่ส่งไป Flash Express Tracking API:', formData.toString());
      
      // 6. เรียกใช้ API ตรวจสอบสถานะ
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/tracking`,
        headers: headers,
        timeout: API_TIMEOUT,
        data: formData
      });
      
      console.log("Flash Express Tracking API Response:", JSON.stringify(response.data, null, 2));
      
      // 7. ตรวจสอบผลลัพธ์
      if (response.data && response.data.code === 1) {
        return {
          success: true,
          tracking: response.data.data
        };
      } else {
        console.log('การตอบกลับไม่สำเร็จจาก Flash Express Tracking API:', response.data);
        throw new Error(response.data?.message || 'API ไม่ตอบสนองตามที่คาดหวัง');
      }
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express Tracking API:', apiError);
      
      // แสดงข้อมูลเพิ่มเติมหากมี response
      if (apiError.response) {
        console.error('Flash Express API Response:', apiError.response.status, apiError.response.statusText);
        console.error('Flash Express API Data:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      throw new Error(`ไม่สามารถตรวจสอบสถานะพัสดุจาก Flash Express ได้: ${apiError.message}`);
    }
  } catch (error: any) {
    console.error('Error getting Flash Express tracking status:', error);
    throw new Error(`Failed to get tracking status: ${error.message}`);
  }
};