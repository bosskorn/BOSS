/**
 * บริการ Flash Express ฉบับปรับปรุงสุดท้ายและทำงานได้จริง
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MCH_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API
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
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('⚙️ เริ่มคำนวณลายเซ็น...');
    
    // 1. แปลงทุกค่าเป็น string และกรองพารามิเตอร์
    const stringParams: Record<string, string> = {};
    Object.keys(params).forEach(key => {
      // Flash Express API มีพารามิเตอร์ที่ต้องข้ามในการคำนวณลายเซ็น
      const skipParams = [
        'sign', 
        'subItemTypes', 
        'merchantId',    // ใช้ mchId แทน
        'subParcel',     // ไม่รวมในการคำนวณลายเซ็น
        'subParcelQuantity', // ไม่รวมในการคำนวณลายเซ็น
        'remark'         // ไม่รวมในการคำนวณลายเซ็นสำหรับ orders API
      ];
      
      if (skipParams.includes(key)) return;
      
      // ข้ามค่าที่เป็น null, undefined หรือช่องว่าง
      if (params[key] === null || params[key] === undefined || params[key] === '') return;
      
      // แปลงทุกค่าเป็น string
      stringParams[key] = String(params[key]);
    });

    // 2. จัดเรียงคีย์ตามลำดับตัวอักษร ASCII
    const sortedKeys = Object.keys(stringParams).sort();

    // 3. สร้างสตริงสำหรับลายเซ็น
    const stringToSign = sortedKeys
      .map(key => `${key}=${stringParams[key]}`)
      .join('&');
    
    // 4. เพิ่ม API key ที่ท้ายสตริง
    const signString = `${stringToSign}&key=${apiKey}`;
    
    console.log('🔑 สตริงสำหรับลายเซ็น:', signString);
    
    // 5. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256')
      .update(signString)
      .digest('hex')
      .toUpperCase();
    
    console.log('✅ ลายเซ็นที่คำนวณได้:', signature);
    
    return signature;
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error.message);
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

/**
 * สร้างข้อมูลพื้นฐานสำหรับการส่งคำขอไปยัง Flash Express API
 */
function createBaseRequestParams() {
  const nonceStr = generateNonceStr();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  return {
    mchId: FLASH_EXPRESS_MCH_ID as string,
    nonceStr: nonceStr,
    timestamp: timestamp
  };
}

/**
 * ดึงตัวเลือกการจัดส่งและค่าบริการ
 */
export async function getShippingOptions(originAddress: any, destinationAddress: any, packageDetails: any) {
  try {
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    console.log(`🚚 เริ่มดึงตัวเลือกการจัดส่งจาก Flash Express...`);
    console.log(`📦 ข้อมูลพัสดุ: ${packageDetails.weight} กก.`);
    
    // สร้างพารามิเตอร์พื้นฐาน
    const requestParams = {
      ...createBaseRequestParams(),
      fromPostalCode: originAddress.zipcode,
      toPostalCode: destinationAddress.zipcode,
      weight: String(Math.round(packageDetails.weight * 1000)), // แปลงจาก กก. เป็น กรัม
      height: String(Math.round(packageDetails.height || 0)), 
      length: String(Math.round(packageDetails.length || 0)),
      width: String(Math.round(packageDetails.width || 0))
    };
    
    // สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    
    // เพิ่มลายเซ็นเข้าไปในข้อมูล
    requestParams.sign = signature;
    
    // แปลงเป็น URL-encoded string
    const encodedPayload = new URLSearchParams(requestParams as Record<string, string>).toString();
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': requestParams.timestamp,
      'X-Flash-Nonce': requestParams.nonceStr
    };
    
    // เรียกใช้ API
    const response = await axios.post(
      `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`,
      encodedPayload,
      { headers, timeout: API_TIMEOUT }
    );
    
    console.log('✅ ได้รับข้อมูลค่าส่งเรียบร้อย:', response.data);
    
    // ตรวจสอบผลลัพธ์
    if (response.data && response.data.code === 1) {
      return {
        success: true,
        estimatePrice: response.data.data.estimatePrice,
        currency: 'THB',
        serviceInfo: response.data.data
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Unknown error',
        errorCode: response.data?.code
      };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงตัวเลือกการจัดส่ง:', error.message);
    
    return {
      success: false,
      error: error.message,
      errorResponse: error.response?.data
    };
  }
}

/**
 * สร้างเลขพัสดุใหม่กับ Flash Express
 */
export async function createShipment(shipmentData: any) {
  try {
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    console.log(`🚚 เริ่มสร้างเลขพัสดุกับ Flash Express...`);
    console.log(`📦 ข้อมูลพัสดุ: ${shipmentData.weight} กก., จาก ${shipmentData.senderAddress.province} ถึง ${shipmentData.recipientAddress.province}`);
    
    // ต้องเพิ่มคำนำหน้า "0" สำหรับเบอร์โทรศัพท์ที่ไม่มี
    const senderPhone = shipmentData.senderPhone.startsWith('0') 
      ? shipmentData.senderPhone 
      : `0${shipmentData.senderPhone}`;
      
    const recipientPhone = shipmentData.recipientPhone.startsWith('0') 
      ? shipmentData.recipientPhone 
      : `0${shipmentData.recipientPhone}`;
    
    // 1. สร้างข้อมูลสำหรับส่งไปยัง API (ไม่รวม remark)
    const requestParams = {
      ...createBaseRequestParams(),
      outTradeNo: shipmentData.orderNumber,
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`, // ระบุคลังสินค้าตามรูปแบบที่ Flash Express กำหนด
      
      // ข้อมูลผู้ส่ง
      srcName: shipmentData.senderName,
      srcPhone: senderPhone,
      srcProvinceName: shipmentData.senderAddress.province,
      srcCityName: shipmentData.senderAddress.district,
      srcDistrictName: shipmentData.senderAddress.subdistrict,
      srcPostalCode: shipmentData.senderAddress.zipcode,
      srcDetailAddress: shipmentData.senderAddress.address,
      
      // ข้อมูลผู้รับ
      dstName: shipmentData.recipientName,
      dstPhone: recipientPhone,
      dstProvinceName: shipmentData.recipientAddress.province, 
      dstCityName: shipmentData.recipientAddress.district,
      dstDistrictName: shipmentData.recipientAddress.subdistrict,
      dstPostalCode: shipmentData.recipientAddress.zipcode,
      dstDetailAddress: shipmentData.recipientAddress.address,
      
      // ข้อมูลพัสดุ
      articleCategory: String(shipmentData.articleCategory || 1), // ประเภทสินค้าทั่วไป
      expressCategory: String(shipmentData.expressCategory || 1), // บริการขนส่งปกติ
      parcelKind: String(shipmentData.parcelKind || 1), // พัสดุปกติ
      weight: String(Math.round(shipmentData.weight * 1000)), // แปลงจาก กก. เป็น กรัม
      width: String(Math.round(shipmentData.width || 0)),
      length: String(Math.round(shipmentData.length || 0)),
      height: String(Math.round(shipmentData.height || 0)),
      insured: String(shipmentData.insured || 0), // ไม่ซื้อประกัน
      codEnabled: String(shipmentData.codEnabled || 0), // ไม่ใช้ COD
      // ไม่ใส่ remark ในขั้นตอนนี้
    };
    
    // 2. สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    
    // 3. เพิ่มลายเซ็นเข้าไปในข้อมูล
    requestParams.sign = signature;
    
    // 4. เพิ่ม remark หลังจากคำนวณลายเซ็นเสร็จเรียบร้อยแล้ว
    requestParams.remark = shipmentData.remark || '';
    
    // 5. จัดการกับ subItemTypes หลังจากสร้าง sign
    if (shipmentData.items && shipmentData.items.length > 0) {
      const subItemTypes = shipmentData.items.map((item: any) => ({
        itemName: item.name,
        itemQuantity: item.quantity
      }));
      requestParams.subItemTypes = JSON.stringify(subItemTypes);
    } else {
      // ใช้ค่าเริ่มต้นหากไม่ได้ระบุรายการสินค้า
      const defaultItem = [{
        itemName: 'สินค้า',
        itemQuantity: 1
      }];
      requestParams.subItemTypes = JSON.stringify(defaultItem);
    }
    
    // แปลงเป็น URL-encoded string
    const encodedPayload = new URLSearchParams();
    
    // เพิ่มพารามิเตอร์ทั้งหมดเข้าไปใน URL-encoded string
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== undefined && value !== null) {
        encodedPayload.append(key, String(value));
      }
    }
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': requestParams.timestamp,
      'X-Flash-Nonce': requestParams.nonceStr
    };
    
    console.log('📤 ส่งข้อมูลไปยัง Flash Express API...');
    console.log('🔗 URL:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    console.log('📝 Payload:', encodedPayload.toString());
    
    // เรียกใช้ API
    const response = await axios.post(
      `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
      encodedPayload.toString(),
      { headers, timeout: API_TIMEOUT }
    );
    
    console.log('✅ ได้รับการตอบกลับจาก API:', response.data);
    
    // ตรวจสอบผลลัพธ์
    if (response.data && response.data.code === 1) {
      // สำเร็จ
      return {
        success: true,
        trackingNumber: response.data.data.pno,
        sortCode: response.data.data.sortCode,
        shipmentData: response.data.data
      };
    } else {
      // ไม่สำเร็จ
      return {
        success: false,
        error: response.data?.message || 'Unknown error',
        errorCode: response.data?.code,
        responseData: response.data
      };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างเลขพัสดุ:', error.message);
    
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
      errorResponse: error.response?.data
    };
  }
}

/**
 * ติดตามสถานะพัสดุ
 */
export async function trackShipment(trackingNumber: string) {
  try {
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // สร้างพารามิเตอร์พื้นฐาน
    const requestParams = {
      ...createBaseRequestParams(),
      pno: trackingNumber
    };
    
    // สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    
    // เพิ่มลายเซ็นเข้าไปในข้อมูล
    requestParams.sign = signature;
    
    // แปลงเป็น URL-encoded string
    const encodedPayload = new URLSearchParams(requestParams as Record<string, string>).toString();
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': requestParams.timestamp,
      'X-Flash-Nonce': requestParams.nonceStr
    };
    
    // เรียกใช้ API
    const response = await axios.post(
      `${FLASH_EXPRESS_API_URL}/open/v1/tracking/query`,
      encodedPayload,
      { headers, timeout: API_TIMEOUT }
    );
    
    // ตรวจสอบผลลัพธ์
    if (response.data && response.data.code === 1) {
      return {
        success: true,
        trackingData: response.data.data
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Unknown error',
        errorCode: response.data?.code
      };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการติดตามพัสดุ:', error.message);
    
    return {
      success: false,
      error: error.message,
      errorResponse: error.response?.data
    };
  }
}

// สำหรับการทดสอบ API
export async function testApi() {
  try {
    // ทดสอบดึงราคาค่าส่ง
    const estimateResult = await getShippingOptions(
      { zipcode: '10110' }, // ต้นทาง
      { zipcode: '50000' },  // ปลายทาง
      { weight: 1, width: 10, length: 10, height: 10 } // ข้อมูลพัสดุ
    );
    
    console.log('📊 ผลการทดสอบดึงราคาค่าส่ง:', estimateResult);
    
    return estimateResult;
  } catch (error: any) {
    console.error('❌ การทดสอบล้มเหลว:', error.message);
    return { success: false, error: error.message };
  }
}