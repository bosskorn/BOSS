/**
 * บริการเชื่อมต่อกับ Flash Express API - ใช้ headers พิเศษ
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API (เพิ่มขึ้นเป็น 15 วินาที)
const API_TIMEOUT = 15000; // 15 วินาที

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16): string {
  const timestamp = Date.now().toString();
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = timestamp;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ฟังก์ชันสร้างลายเซ็น
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // คัดกรองพารามิเตอร์
    const filteredParams: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      if (value === null || value === undefined) continue;
      
      // ข้ามค่าว่าง
      if (typeof value === 'string' && value.trim() === '') continue;
      
      // แปลงค่าเป็นสตริงทั้งหมด
      filteredParams[key] = String(value);
    }
    
    // เรียงลำดับตาม ASCII
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // สร้างสตริงพารามิเตอร์
    const paramString = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&');
    
    // เพิ่ม API key
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    // บันทึกข้อมูลสำหรับตรวจสอบ
    console.log('===========================================================');
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น Flash Express (ใช้ Headers):');
    console.log('พารามิเตอร์ที่ใช้:', JSON.stringify(filteredParams, null, 2));
    console.log('สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณ SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
      
    console.log('ลายเซ็นที่สร้าง:', signature);
    console.log('===========================================================');
    
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น Flash Express:', error);
    throw error;
  }
}

/**
 * สร้างการจัดส่งใหม่กับ Flash Express API (ใช้ Headers พิเศษ)
 */
export const createFlashExpressShippingWithHeaders = async (
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
    
    console.log(`เริ่มสร้างการจัดส่งกับ Flash Express API สำหรับออเดอร์ ${orderData.outTradeNo} (ใช้ Headers พิเศษ)`);
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
      
      console.log('ได้รับการตอบกลับจาก Flash Express API:', JSON.stringify(response.data, null, 2));
  
      // 13. ตรวจสอบผลลัพธ์
      if (response.data && response.data.code === 1) {
        return {
          success: true,
          trackingNumber: response.data.data.pno,
          sortCode: response.data.data.sortCode
        };
      } else {
        console.log('การตอบกลับไม่สำเร็จจาก Flash Express API:', response.data);
        throw new Error(response.data?.message || 'ไม่มีข้อมูล');
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