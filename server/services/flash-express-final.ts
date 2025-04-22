/**
 * บริการเชื่อมต่อกับ Flash Express API - แก้ไขขั้นสุดท้าย
 * ใช้ URL ใหม่: https://open-api-tra.flashexpress.com
 * วิธีคำนวณลายเซ็น: คำนวณจากข้อมูลที่ยังไม่ได้ encode ก่อน แล้วจึง encode ตอนส่ง
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
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express อย่างเคร่งครัด
 * 1. จัดเรียงพารามิเตอร์ตามตัวอักษร (ASCII)
 * 2. เชื่อมต่อเป็นสตริงในรูปแบบ key1=value1&key2=value2
 * 3. เพิ่ม API key ที่ท้ายสตริง: stringToSign + "&key=" + apiKey
 * 4. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
 * 
 * ตามเอกสาร Flash Express ลายเซ็นต้องถูกคำนวณจากข้อมูลที่ยังไม่ได้ encode
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
 * สร้างการจัดส่งใหม่กับ Flash Express API (ฉบับสุดท้าย)
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

    console.log(`เริ่มสร้างการจัดส่งกับ Flash Express API สำหรับออเดอร์ ${orderData.outTradeNo} (ฉบับสุดท้าย)`);
    console.log(`ผู้รับ: ${orderData.dstName}, ${orderData.dstPhone}, ${orderData.dstProvinceName}`);

    try {
      // 1. สร้างข้อมูลพื้นฐาน
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = generateNonceStr();

      // แปลงเบอร์โทรให้เป็นรูปแบบที่ถูกต้อง (ลบช่องว่างและขีด)
      const senderPhone = orderData.srcPhone.replace(/[\s-]/g, '');
      const recipientPhone = orderData.dstPhone.replace(/[\s-]/g, '');

      // 2. เตรียมข้อมูลคำขอตามเอกสาร Flash Express
      const requestParams: Record<string, any> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        outTradeNo: orderData.outTradeNo,
        expressCategory: orderData.expressCategory,
        srcName: orderData.srcName,
        srcPhone: senderPhone.replace(/[-\s]/g, ''),
        srcProvinceName: orderData.srcProvinceName,
        srcCityName: orderData.srcCityName,
        srcPostalCode: orderData.srcPostalCode,
        srcDetailAddress: orderData.srcDetailAddress,
        dstName: orderData.dstName,
        dstPhone: recipientPhone.replace(/[-\s]/g, ''),
        dstProvinceName: orderData.dstProvinceName,
        dstCityName: orderData.dstCityName,
        dstPostalCode: orderData.dstPostalCode,
        dstDetailAddress: orderData.dstDetailAddress,
        articleCategory: orderData.articleCategory,
        weight: orderData.weight,
        insured: orderData.insured || 0,
        codEnabled: orderData.codEnabled || 0
      };

      // เพิ่มข้อมูลเพิ่มเติมถ้ามี
      if (orderData.srcDistrictName) requestParams.srcDistrictName = orderData.srcDistrictName;
      if (orderData.dstDistrictName) requestParams.dstDistrictName = orderData.dstDistrictName;
      if (orderData.dstHomePhone) requestParams.dstHomePhone = orderData.dstHomePhone.replace(/[-\s]/g, '');
      if (orderData.width) requestParams.width = orderData.width;
      if (orderData.height) requestParams.height = orderData.height;
      if (orderData.length) requestParams.length = orderData.length;
      if (orderData.remark) requestParams.remark = orderData.remark;

      // เพิ่มข้อมูล COD ถ้ามี
      if (orderData.codEnabled === 1 && orderData.codAmount) {
        requestParams.codAmount = orderData.codAmount;
        // สร้าง subItemTypes อัตโนมัติถ้าไม่มี
        if (!orderData.subItemTypes || orderData.subItemTypes.length === 0) {
          orderData.subItemTypes = [{
            itemName: `สินค้าออเดอร์ #${orderData.outTradeNo}`,
            itemWeightSize: `${orderData.weight/1000}Kg`,
            itemColor: '-',
            itemQuantity: 1
          }];
        }
      }

      // เพิ่มข้อมูลประกันถ้ามี
      if (orderData.insured === 1 && orderData.insureDeclareValue) {
        requestParams.insureDeclareValue = orderData.insureDeclareValue;
      }

      // เพิ่มข้อมูลเพิ่มเติมเฉพาะที่มี
      if (orderData.srcDistrictName) requestParams.srcDistrictName = orderData.srcDistrictName;
      if (orderData.dstDistrictName) requestParams.dstDistrictName = orderData.dstDistrictName;
      if (orderData.dstHomePhone) requestParams.dstHomePhone = orderData.dstHomePhone.replace(/[\s-]/g, '');
      if (orderData.width) requestParams.width = String(orderData.width);
      if (orderData.height) requestParams.height = String(orderData.height);
      if (orderData.length) requestParams.length = String(orderData.length);
      if (orderData.remark) requestParams.remark = orderData.remark;

      // เพิ่มข้อมูล COD ถ้ามี
      if (orderData.codEnabled === 1 && orderData.codAmount) {
        requestParams.codAmount = String(orderData.codAmount);
      }

      // เพิ่มข้อมูลประกันถ้ามี
      if (orderData.insured === 1 && orderData.insureDeclareValue) {
        requestParams.insureDeclareValue = String(orderData.insureDeclareValue);
      }

      // 3. สร้างลายเซ็นจากข้อมูลที่ยังไม่ได้ encode (สำคัญมาก)
      console.log('ข้อมูลคำขอก่อนสร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
      const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);

      // 4. นำลายเซ็นมาเพิ่มเข้ากับข้อมูลคำขอ
      // กำหนด type ของ payload ให้รองรับ subItemTypes ที่เป็น string
      const payload: Record<string, any> = { ...requestParams, sign: signature };

      // 5. สร้าง subItemTypes แยกต่างหาก (ต้องทำหลังจากสร้างลายเซ็นแล้ว)
      let subItemTypesJSON: string | undefined = undefined;

      if (orderData.subItemTypes) {
        // ตรวจสอบว่า subItemTypes เป็น string อยู่แล้วหรือไม่
        if (typeof orderData.subItemTypes === 'string') {
          subItemTypesJSON = orderData.subItemTypes;
        } else if (Array.isArray(orderData.subItemTypes) && orderData.subItemTypes.length > 0) {
          subItemTypesJSON = JSON.stringify(orderData.subItemTypes);
        }
        
        if (subItemTypesJSON) {
          payload.subItemTypes = subItemTypesJSON;
          console.log('subItemTypes ที่ส่งไป:', subItemTypesJSON);
        }
      } else if (orderData.codEnabled === 1) {
        // จำเป็นต้องมี subItemTypes หากเป็น COD
        const defaultItem = [{
          itemName: 'สินค้า',
          itemWeightSize: '1Kg',
          itemColor: '-',
          itemQuantity: 1
        }];
        subItemTypesJSON = JSON.stringify(defaultItem);
        payload.subItemTypes = subItemTypesJSON;
        console.log('subItemTypes ค่าเริ่มต้นที่ส่งไป (สำหรับ COD):', subItemTypesJSON);
      }

      // 6. สร้าง URL-encoded payload สำหรับส่งไปยัง API
      const encodedPayload = new URLSearchParams(payload).toString();

      // 7. ตั้งค่า Headers ที่ถูกต้อง
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Flash-Signature': signature,
        'X-Flash-Timestamp': timestamp,
        'X-Flash-Nonce': nonceStr,
        'Accept': 'application/json'
      };

      console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
      console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
      console.log('Payload ที่ส่งไป (ก่อน encode):', JSON.stringify(payload, null, 2));
      console.log('Encoded payload ที่ส่งไป:', encodedPayload);

      // 8. เรียกใช้ API ด้วย axios.post
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        encodedPayload,
        {
          headers: headers,
          timeout: API_TIMEOUT
        }
      );

      console.log("Flash Express API Response:", JSON.stringify(response.data, null, 2));

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
 * ทำการเรียก API เพื่อคำนวณค่าจัดส่ง
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
      console.log('ไม่พบ Flash Express API credentials');
      throw new Error('Flash Express API credentials not configured');
    }

    console.log(`========= Flash Express API (เริ่ม) =========`);
    console.log(`ข้อมูลคำขอ:
      - จาก: ${fromAddress.zipcode} (${fromAddress.province})
      - ถึง: ${toAddress.zipcode} (${toAddress.province}, ${toAddress.district})
      - น้ำหนัก: ${packageInfo.weight} กก.`);

    try {
      // 1. สร้างข้อมูลพื้นฐาน
      const nonceStr = generateNonceStr();

      // 2. สร้างพารามิเตอร์ตามที่ API ต้องการ
      const requestParams: Record<string, string> = {
        mchId: FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        
        // ข้อมูลจากเอกสาร API - ฟิลด์ที่จำเป็น
        srcPostalCode: fromAddress.zipcode,
        dstProvinceName: toAddress.province || 'กรุงเทพมหานคร',
        dstCityName: toAddress.district || 'ลาดพร้าว',
        dstPostalCode: toAddress.zipcode,
        weight: String(Math.round(packageInfo.weight * 1000)), // แปลงจาก กก. เป็น กรัม
      };
      
      // ข้อมูลเพิ่มเติม (ไม่บังคับ)
      if (toAddress.subdistrict) requestParams.dstDistrictName = toAddress.subdistrict;
      if (packageInfo.width) requestParams.width = String(Math.round(packageInfo.width));
      if (packageInfo.length) requestParams.length = String(Math.round(packageInfo.length));
      if (packageInfo.height) requestParams.height = String(Math.round(packageInfo.height));

      // 3. คำนวณลายเซ็น
      const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY);

      // 4. เพิ่มลายเซ็นเข้าไปในพารามิเตอร์
      requestParams.sign = signature;

      // 5. แปลงเป็นรูปแบบ application/x-www-form-urlencoded
      const encodedPayload = new URLSearchParams(requestParams).toString();

      // 6. กำหนด Headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      console.log('🔍 รายละเอียดที่ส่งไป API:');
      console.log('URL:', `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`);
      console.log('Headers:', JSON.stringify(headers, null, 2));
      console.log('Payload (raw):', JSON.stringify(requestParams, null, 2));
      console.log('Payload (encoded):', encodedPayload);

      // 7. เรียกใช้ API
      console.log('⏳ กำลังเรียก Flash Express API...');
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`,
        encodedPayload,
        { headers, timeout: API_TIMEOUT }
      );

      console.log('✅ เรียก API สำเร็จ! Status:', response.status);
      console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(response.data, null, 2));

      // 8. ตรวจสอบผลลัพธ์
      if (response.data && response.data.code === 1 && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log('✅ พบข้อมูลตัวเลือกการจัดส่ง', response.data.data.length, 'รายการ');
        
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

        console.log('========= Flash Express API (เสร็จสิ้น) =========');
        return options;
      } else {
        console.log('⚠️ ไม่พบข้อมูลตัวเลือกการจัดส่งในการตอบกลับ API');
        console.log('⚠️ ใช้ข้อมูลตัวเลือกเริ่มต้นแทน');
        console.log('========= Flash Express API (เสร็จสิ้น - ใช้ข้อมูลเริ่มต้น) =========');

        return getDefaultFlashOptions();
      }
    } catch (apiError: any) {
      console.error('❌ เกิดข้อผิดพลาดในการเรียก Flash Express API:', apiError.message);

      if (apiError.response) {
        console.error('❌ Response status:', apiError.response.status);
        console.error('❌ Response data:', JSON.stringify(apiError.response.data, null, 2));
      }

      console.log('⚠️ ใช้ข้อมูลตัวเลือกเริ่มต้นแทน');
      console.log('========= Flash Express API (เสร็จสิ้น - มีข้อผิดพลาด) =========');
      
      return getDefaultFlashOptions();
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดทั่วไปในการเรียก Flash Express API:', error.message);
    console.log('========= Flash Express API (เสร็จสิ้น - มีข้อผิดพลาดทั่วไป) =========');
    
    return getDefaultFlashOptions();
  }
};

/**
 * ฟังก์ชันสร้างตัวเลือกการจัดส่งเริ่มต้นสำหรับ Flash Express
 */
function getDefaultFlashOptions() {
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