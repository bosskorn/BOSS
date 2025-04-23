/**
 * บริการ Flash Express API
 * สำหรับดึงข้อมูลตัวเลือกการจัดส่ง, สร้างเลขพัสดุ, และติดตามสถานะพัสดุ
 */
import axios from 'axios';
import crypto from 'crypto';

// กำหนดค่าคงที่
const BASE_URL = 'https://open-api-tra.flashexpress.com';
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// ตรวจสอบว่ามีการตั้งค่า API key หรือไม่
if (!MERCHANT_ID || !API_KEY) {
  console.error('Flash Express API: MERCHANT_ID หรือ API_KEY ไม่ถูกตั้งค่า');
}

/**
 * สร้าง nonceStr สำหรับ API request
 */
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express
 * 1. จัดเรียงพารามิเตอร์ตามลำดับตัวอักษร (ASCII)
 * 2. เชื่อมต่อเป็นสตริงในรูปแบบ key1=value1&key2=value2
 * 3. เพิ่ม API key ที่ท้ายสตริง: stringToSign + '&key=' + apiKey
 * 4. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  // ตรวจสอบว่าคีย์มีอยู่จริง
  if (!apiKey) {
    throw new Error('API key ไม่ถูกระบุ');
  }
  
  // 1. คัดลอกข้อมูลแบบ deep copy เพื่อป้องกันการเปลี่ยนค่าในพารามิเตอร์ต้นฉบับ
  const paramsClone = JSON.parse(JSON.stringify(params));
  
  // 2. ลบฟิลด์ที่ไม่ควรรวมในการคำนวณลายเซ็น
  const excludeFields = ['sign', 'subItemTypes', 'merchantId', 'subParcel', 'subParcelQuantity', 'remark'];
  for (const field of excludeFields) {
    delete paramsClone[field];
  }
  
  // 3. แปลงทุกค่าเป็น string
  const stringParams: Record<string, string> = {};
  for (const key in paramsClone) {
    // ข้ามค่าที่เป็น null, undefined หรือช่องว่าง
    if (paramsClone[key] === null || paramsClone[key] === undefined || paramsClone[key] === '') {
      continue;
    }
    stringParams[key] = String(paramsClone[key]);
  }
  
  // 4. เรียงลำดับคีย์ตาม ASCII
  const sortedKeys = Object.keys(stringParams).sort();
  
  // 5. สร้างสตริงสำหรับการลงนาม
  let stringToSign = '';
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    stringToSign += `${key}=${stringParams[key]}`;
    
    // เพิ่ม '&' ระหว่างคีย์ (ยกเว้นคีย์สุดท้าย)
    if (i < sortedKeys.length - 1) {
      stringToSign += '&';
    }
  }
  
  // 6. เพิ่ม API key
  const signString = `${stringToSign}&key=${apiKey}`;
  
  // 7. คำนวณ SHA-256 hash
  const signature = crypto.createHash('sha256')
    .update(signString)
    .digest('hex')
    .toUpperCase();
  
  return signature;
}

/**
 * สร้างข้อมูลพื้นฐานสำหรับการส่งคำขอไปยัง Flash Express API
 */
function createBaseRequestParams() {
  const nonceStr = generateNonceStr();
  const timestamp = String(Math.floor(Date.now() / 1000));
  
  return {
    mchId: MERCHANT_ID,
    nonceStr,
    timestamp,
    warehouseNo: `${MERCHANT_ID}_001`,
  };
}

/**
 * ดึงตัวเลือกการจัดส่งและค่าบริการ
 */
export async function getShippingOptions(originAddress: any, destinationAddress: any, packageDetails: any) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();
    
    // 2. รวมข้อมูลทั้งหมด
    const requestParams = {
      ...baseParams,
      fromPostalCode: originAddress.postalCode,
      toPostalCode: destinationAddress.postalCode,
      weight: packageDetails.weight,
      height: packageDetails.height,
      length: packageDetails.length,
      width: packageDetails.width,
    };
    
    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, API_KEY!);
    requestParams.sign = signature;
    
    // 4. สร้าง form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    
    // 5. ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(
      `${BASE_URL}/open/v1/estimate_rate`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Flash-Signature': signature,
          'X-Flash-Timestamp': baseParams.timestamp,
          'X-Flash-Nonce': baseParams.nonceStr
        },
        timeout: 15000
      }
    );
    
    // 6. แปลงข้อมูลที่ได้รับและส่งกลับ
    if (response.data.code === 1 && response.data.data) {
      return response.data.data.map((option: any) => ({
        id: option.expressTypeId,
        name: option.expressTypeName,
        price: option.price,
        estimatedDeliveryDays: option.transportingTime,
        currency: 'THB',
        provider: 'Flash Express'
      }));
    } else {
      throw new Error(response.data.message || 'ไม่สามารถดึงตัวเลือกการจัดส่งได้');
    }
  } catch (error: any) {
    console.error('Flash Express API error (getShippingOptions):', error.message);
    throw new Error(`ไม่สามารถดึงตัวเลือกการจัดส่งได้: ${error.message}`);
  }
}

/**
 * สร้างเลขพัสดุใหม่กับ Flash Express
 */
export async function createShipment(shipmentData: any) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();
    
    // 2. แยกรายการสินค้าออกจากข้อมูลหลัก
    const items = shipmentData.items || [];
    delete shipmentData.items;
    
    // 3. รวมข้อมูลทั้งหมด
    const requestData = {
      ...baseParams,
      outTradeNo: shipmentData.outTradeNo,
      warehouseNo: baseParams.warehouseNo,
      
      // ข้อมูลผู้ส่ง
      srcName: shipmentData.srcName,
      srcPhone: shipmentData.srcPhone,
      srcProvinceName: shipmentData.srcProvinceName,
      srcCityName: shipmentData.srcCityName,
      srcDistrictName: shipmentData.srcDistrictName,
      srcPostalCode: shipmentData.srcPostalCode,
      srcDetailAddress: shipmentData.srcDetailAddress,
      
      // ข้อมูลผู้รับ
      dstName: shipmentData.dstName,
      dstPhone: shipmentData.dstPhone,
      dstProvinceName: shipmentData.dstProvinceName,
      dstCityName: shipmentData.dstCityName,
      dstDistrictName: shipmentData.dstDistrictName,
      dstPostalCode: shipmentData.dstPostalCode,
      dstDetailAddress: shipmentData.dstDetailAddress,
      
      // ข้อมูลพัสดุ
      weight: shipmentData.weight,
      width: shipmentData.width,
      length: shipmentData.length,
      height: shipmentData.height,
      parcelKind: shipmentData.parcelKind,
      expressCategory: shipmentData.expressCategory,
      articleCategory: shipmentData.articleCategory,
      insured: shipmentData.insured,
      codEnabled: shipmentData.codEnabled || '0',
    };
    
    // เพิ่มข้อมูล COD ถ้าเปิดใช้งาน
    if (shipmentData.codEnabled === '1') {
      requestData.codAmount = shipmentData.codAmount;
    }
    
    // เพิ่มข้อมูลประกันถ้าเปิดใช้งาน
    if (shipmentData.insured === '1') {
      requestData.insuredAmount = shipmentData.insuranceAmount;
    }
    
    // 4. สร้างลายเซ็น (ก่อนเพิ่ม remark และ subItemTypes)
    const signature = generateFlashSignature(requestData, API_KEY!);
    
    // 5. เพิ่มฟิลด์ที่ไม่นำมาคำนวณลายเซ็น
    requestData.sign = signature;
    requestData.remark = shipmentData.remark || '';
    
    // 6. แปลงข้อมูลรายการสินค้า
    const subItemTypes = items.map((item: any) => ({
      itemName: item.itemName,
      itemQuantity: String(item.itemQuantity)
    }));
    
    requestData.subItemTypes = JSON.stringify(subItemTypes);
    
    // 7. สร้าง form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestData)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    
    // 8. ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(
      `${BASE_URL}/open/v3/orders`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Flash-Signature': signature,
          'X-Flash-Timestamp': baseParams.timestamp,
          'X-Flash-Nonce': baseParams.nonceStr
        },
        timeout: 15000
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Flash Express API error (createShipment):', error.message);
    
    // ถ้ามีข้อมูลตอบกลับจาก API แสดงรายละเอียดเพิ่มเติม
    if (error.response && error.response.data) {
      return {
        code: error.response.status,
        message: `ไม่สามารถสร้างเลขพัสดุได้: ${error.message}`,
        data: error.response.data
      };
    }
    
    return {
      code: 500,
      message: `ไม่สามารถสร้างเลขพัสดุได้: ${error.message}`,
      data: null
    };
  }
}

/**
 * ติดตามสถานะพัสดุ
 */
export async function trackShipment(trackingNumber: string) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();
    
    // 2. เพิ่มเลขพัสดุ
    const requestParams = {
      ...baseParams,
      pno: trackingNumber
    };
    
    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, API_KEY!);
    requestParams.sign = signature;
    
    // 4. สร้าง form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    
    // 5. ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(
      `${BASE_URL}/open/v5/tracking`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Flash-Signature': signature,
          'X-Flash-Timestamp': baseParams.timestamp,
          'X-Flash-Nonce': baseParams.nonceStr
        },
        timeout: 15000
      }
    );
    
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      return {
        status: 'not_found',
        message: response.data.message || 'ไม่พบข้อมูลพัสดุ',
        trackingDetails: []
      };
    }
  } catch (error: any) {
    console.error('Flash Express API error (trackShipment):', error.message);
    throw new Error(`ไม่สามารถติดตามสถานะพัสดุได้: ${error.message}`);
  }
}

/**
 * สำหรับ API เดิม ให้ใช้เป็นชื่อที่ตรงกับ import ในไฟล์ shipping-methods.ts
 */
export const getFlashExpressShippingOptions = getShippingOptions;

/**
 * ทดสอบการเชื่อมต่อกับ API
 */
export async function testApi() {
  try {
    const originAddress = { postalCode: '10230' };
    const destinationAddress = { postalCode: '10110' };
    const packageDetails = {
      weight: '1000',
      width: '10',
      height: '10',
      length: '10'
    };
    
    const result = await getShippingOptions(originAddress, destinationAddress, packageDetails);
    console.log('API Test Result:', result);
    return result;
  } catch (error: any) {
    console.error('API Test Error:', error.message);
    throw error;
  }
}