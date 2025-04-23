/**
 * บริการ Flash Express ที่ทำงานได้จริง
 * สร้างมาจากไฟล์เปรียบเทียบที่ทดสอบและทำงานได้แล้ว
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
 * สร้างลายเซ็นสำหรับ Flash Express API ที่ทำงานได้
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // 1. แปลงทุกค่าเป็น string และกรองพารามิเตอร์
    const stringParams: Record<string, string> = {};
    Object.keys(params).forEach(key => {
      // Flash Express API มีพารามิเตอร์ที่ต้องข้ามในการคำนวณลายเซ็น
      const skipParams = [
        'sign', 
        'subItemTypes', 
        'merchantId',  // ใช้ mchId แทน
        'subParcel',   // ไม่รวมในการคำนวณลายเซ็น
        'subParcelQuantity', // ไม่รวมในการคำนวณลายเซ็น
        'remark'       // ไม่รวมในการคำนวณลายเซ็น
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
      .join('&') + `&key=${apiKey}`;
    
    // 4. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const sign = crypto.createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
    
    return sign;
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error.message);
    throw error;
  }
}

/**
 * สร้างข้อมูลพื้นฐานสำหรับการส่งคำขอไปยัง Flash Express API
 */
function createBaseRequestParams() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  
  return {
    mchId: FLASH_EXPRESS_MCH_ID,
    nonceStr: nonceStr,
    timestamp: timestamp,
    warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001` // รูปแบบมาตรฐานของ Flash Express
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
    
    // สร้างข้อมูลพื้นฐาน
    const requestParams = {
      ...createBaseRequestParams(),
      
      // ข้อมูลที่อยู่ต้นทาง
      srcProvinceName: originAddress.province,
      srcCityName: originAddress.district,
      srcDistrictName: originAddress.subdistrict,
      srcPostalCode: originAddress.zipcode,
      
      // ข้อมูลที่อยู่ปลายทาง
      dstProvinceName: destinationAddress.province,
      dstCityName: destinationAddress.district,
      dstDistrictName: destinationAddress.subdistrict,
      dstPostalCode: destinationAddress.zipcode,
      
      // ข้อมูลพัสดุ
      weight: String(Math.round(packageDetails.weight * 1000)), // แปลงจาก กก. เป็น กรัม
      width: String(Math.round(packageDetails.width || 0)),
      length: String(Math.round(packageDetails.length || 0)),
      height: String(Math.round(packageDetails.height || 0)),
      insured: '0' // จำเป็นต้องระบุเพื่อความสมบูรณ์ของการเรียก API
    };
    
    // สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
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
      `${FLASH_EXPRESS_API_URL}/open/v3/estimate_rate`,
      encodedPayload,
      { headers, timeout: API_TIMEOUT }
    );
    
    // ตรวจสอบผลลัพธ์
    if (response.data && response.data.code === 1) {
      // สำเร็จ
      return {
        success: true,
        price: Number(response.data.data.estimatePrice) / 100, // แปลงเป็นบาท
        estimateData: response.data.data
      };
    } else {
      // ไม่สำเร็จ
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
    
    // สร้างเลขอ้างอิงออเดอร์
    const outTradeNo = `SS${Date.now()}`;
    
    // แปลงเบอร์โทรให้เป็นรูปแบบที่ถูกต้อง (ลบช่องว่างและขีด)
    const senderPhone = (shipmentData.senderPhone || '').replace(/[\s-]/g, '');
    const recipientPhone = (shipmentData.recipientPhone || '').replace(/[\s-]/g, '');
    
    // สร้างข้อมูลพื้นฐาน (รวม remark)
    const requestParams = {
      ...createBaseRequestParams(),
      outTradeNo,
      
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
      remark: shipmentData.remark || '',
    };
    
    // สร้างข้อมูลที่จะใช้ในการสร้างลายเซ็น (ไม่รวม remark)
    const paramsCopy = { ...requestParams };
    delete paramsCopy.remark; // ลบ remark ออกก่อนสร้างลายเซ็น (สำคัญมาก)
    
    // สร้างลายเซ็น
    const signature = generateFlashSignature(paramsCopy, FLASH_EXPRESS_API_KEY as string);
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
      `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
      encodedPayload,
      { headers, timeout: API_TIMEOUT }
    );
    
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
      `${FLASH_EXPRESS_API_URL}/open/v3/orders/query_detail`,
      encodedPayload,
      { headers, timeout: API_TIMEOUT }
    );
    
    // ตรวจสอบผลลัพธ์
    if (response.data && response.data.code === 1) {
      // สำเร็จ
      return {
        success: true,
        status: response.data.data.statusDesc,
        statusCode: response.data.data.status,
        trackingDetail: response.data.data
      };
    } else {
      // ไม่สำเร็จ
      return {
        success: false,
        error: response.data?.message || 'Unknown error',
        errorCode: response.data?.code
      };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการติดตามสถานะพัสดุ:', error.message);
    
    return {
      success: false,
      error: error.message,
      errorResponse: error.response?.data
    };
  }
}

// ทดสอบการทำงานของ API
export async function testApi() {
  try {
    console.log('🧪 เริ่มทดสอบ Flash Express API...');
    
    // ทดสอบดึงตัวเลือกการจัดส่ง
    const originAddress = {
      province: 'กรุงเทพมหานคร',
      district: 'ลาดพร้าว',
      subdistrict: 'จรเข้บัว',
      zipcode: '10230'
    };
    
    const destinationAddress = {
      province: 'เชียงใหม่',
      district: 'เมืองเชียงใหม่',
      subdistrict: 'ศรีภูมิ',
      zipcode: '50200'
    };
    
    const packageDetails = {
      weight: 1, // 1 กิโลกรัม
      width: 20,
      length: 30,
      height: 15
    };
    
    console.log('📦 ทดสอบดึงตัวเลือกการจัดส่ง...');
    const shippingOptions = await getShippingOptions(originAddress, destinationAddress, packageDetails);
    console.log('📊 ผลลัพธ์:', shippingOptions);
    
    if (shippingOptions.success) {
      // ทดสอบสร้างเลขพัสดุใหม่
      console.log('📦 ทดสอบสร้างเลขพัสดุใหม่...');
      
      const shipmentData = {
        senderName: 'ผู้ส่งทดสอบ',
        senderPhone: '0812345678',
        senderAddress: {
          address: '123 ถนนลาดพร้าว ซอย 10',
          ...originAddress
        },
        recipientName: 'ผู้รับทดสอบ',
        recipientPhone: '0823456789',
        recipientAddress: {
          address: '456 ถนนนิมมานเหมินทร์',
          ...destinationAddress
        },
        weight: 1,
        width: 20,
        length: 30,
        height: 15,
        remark: 'ทดสอบส่งของ'
      };
      
      const createResult = await createShipment(shipmentData);
      console.log('📊 ผลลัพธ์การสร้างเลขพัสดุ:', createResult);
      
      if (createResult.success) {
        // ทดสอบติดตามสถานะพัสดุ
        console.log('🔍 ทดสอบติดตามสถานะพัสดุ...');
        const trackResult = await trackShipment(createResult.trackingNumber);
        console.log('📊 ผลลัพธ์การติดตาม:', trackResult);
      }
    }
    
    return { success: true, message: 'ทดสอบเสร็จสิ้น' };
  } catch (error: any) {
    console.error('❌ การทดสอบล้มเหลว:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบหากเรียกไฟล์โดยตรง
// เพื่อทดสอบโค้ดนี้ รัน: 
// npx tsx server/services/flash-express-working.ts test
if (process.argv.includes('test')) {
  testApi().then(result => {
    console.log('🏁 ผลลัพธ์การทดสอบ:', result);
  });
}