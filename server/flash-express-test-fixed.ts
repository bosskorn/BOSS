/**
 * สคริปต์ทดสอบการเชื่อมต่อ Flash Express API ฉบับแก้ไขตามข้อแนะนำล่าสุด
 * ทดสอบการทำงานของ API ทั้งหมดในไฟล์ flash-express-final.ts
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MCH_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
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
 * ฉบับที่ปรับปรุงตามข้อแนะนำล่าสุด
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('⚙️ เริ่มคำนวณลายเซ็น Flash Express API...');
    console.log('⚙️ ข้อมูลเริ่มต้น:', JSON.stringify(params, null, 2));
    
    // 0. ตรวจสอบว่ามี API key หรือไม่
    if (!apiKey) {
      console.error('❌ ไม่พบ API Key สำหรับสร้างลายเซ็น');
      throw new Error('API Key is required for signature generation');
    }

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

    console.log('🔑 สตริงที่ใช้สร้างลายเซ็น:', stringToSign);

    // 4. สร้าง SHA-256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();

    console.log('🔒 ลายเซ็นที่สร้าง:', signature);
    
    return signature;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างลายเซ็น Flash Express:', error);
    throw error;
  }
}

// ทดสอบดึงตัวเลือกการจัดส่ง
async function testGetShippingOptions() {
  try {
    console.log('🧪 เริ่มทดสอบดึงตัวเลือกการจัดส่ง...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // ข้อมูลที่ใช้ในการทดสอบ - ที่อยู่ต้นทาง
    const fromAddress = {
      province: 'กรุงเทพมหานคร',
      district: 'ลาดพร้าว',
      subdistrict: 'จรเข้บัว',
      zipcode: '10230'
    };
    
    // ข้อมูลที่ใช้ในการทดสอบ - ที่อยู่ปลายทาง
    const toAddress = {
      province: 'เชียงใหม่',
      district: 'เมืองเชียงใหม่',
      subdistrict: 'ศรีภูมิ',
      zipcode: '50200'
    };
    
    // ข้อมูลพัสดุ
    const packageInfo = {
      weight: 1, // 1 กิโลกรัม
      width: 20, // 20 ซม.
      length: 30, // 30 ซม.
      height: 15  // 15 ซม.
    };
    
    // 1. สร้างข้อมูลพื้นฐาน
    const nonceStr = generateNonceStr();
    
    // 2. สร้างพารามิเตอร์ตามที่ Flash Express API ต้องการ
    const timestamp = String(Math.floor(Date.now() / 1000));
    const requestParams: Record<string, string> = {
      mchId: FLASH_EXPRESS_MCH_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`,
      
      // ข้อมูลจากเอกสาร API - ฟิลด์ที่จำเป็นสำหรับผู้ส่ง
      srcProvinceName: fromAddress.province,
      srcCityName: fromAddress.district,
      srcPostalCode: fromAddress.zipcode,
      
      // ข้อมูลของผู้รับ
      dstProvinceName: toAddress.province,
      dstCityName: toAddress.district,
      dstPostalCode: toAddress.zipcode,
      weight: String(Math.round(packageInfo.weight * 1000)), // แปลงจาก กก. เป็น กรัม
    };
    
    // ข้อมูลเพิ่มเติม (ไม่บังคับ)
    if (fromAddress.subdistrict) requestParams.srcDistrictName = fromAddress.subdistrict;
    if (toAddress.subdistrict) requestParams.dstDistrictName = toAddress.subdistrict;
    if (packageInfo.width) requestParams.width = String(Math.round(packageInfo.width));
    if (packageInfo.length) requestParams.length = String(Math.round(packageInfo.length));
    if (packageInfo.height) requestParams.height = String(Math.round(packageInfo.height));

    // 3. คำนวณลายเซ็นจากข้อมูลที่ยังไม่ได้ encode
    console.log('ข้อมูลคำขอก่อนสร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    console.log('ลายเซ็นที่สร้าง:', signature);

    // 4. เพิ่มลายเซ็นเข้าไปในพารามิเตอร์
    requestParams.sign = signature;

    // 5. แปลงเป็นรูปแบบ application/x-www-form-urlencoded
    const encodedPayload = new URLSearchParams(requestParams).toString();

    // 6. กำหนด Headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };

    console.log('🔍 รายละเอียดที่ส่งไป API:');
    console.log('URL:', `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload (encoded):', encodedPayload);

    // 7. เรียกใช้ API
    console.log('⏳ กำลังเรียก Flash Express API...');
    try {
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`,
        encodedPayload,
        { headers, timeout: API_TIMEOUT }
      );

      console.log('✅ เรียก API สำเร็จ! Status:', response.status);
      console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (apiError: any) {
      console.error('❌ เกิดข้อผิดพลาดในการเรียก API:', apiError.message);

      if (apiError.response) {
        console.error('❌ Response status:', apiError.response.status);
        console.error('❌ Response data:', JSON.stringify(apiError.response.data, null, 2));
      }

      throw apiError;
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบดึงตัวเลือกการจัดส่ง:', error.message);
    return { success: false, error: error.message };
  }
}

// ทดสอบสร้างการจัดส่ง
async function testCreateShipping() {
  try {
    console.log('🧪 เริ่มทดสอบสร้างการจัดส่ง...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // สร้างเลขออเดอร์สุ่ม
    const outTradeNo = `TEST${Date.now()}`;
    
    // ข้อมูลทดสอบ
    const orderData = {
      outTradeNo,
      srcName: 'ผู้ส่งทดสอบ',
      srcPhone: '0812345678',
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: 'ลาดพร้าว',
      srcDistrictName: 'จรเข้บัว',
      srcPostalCode: '10230',
      srcDetailAddress: '123 ถนนลาดพร้าว ซอย 10',
      dstName: 'ผู้รับทดสอบ',
      dstPhone: '0823456789',
      dstProvinceName: 'เชียงใหม่',
      dstCityName: 'เมืองเชียงใหม่',
      dstDistrictName: 'ศรีภูมิ',
      dstPostalCode: '50200',
      dstDetailAddress: '456 ถนนนิมมานเหมินทร์',
      articleCategory: 1, // ประเภทสินค้าทั่วไป
      expressCategory: 1, // บริการขนส่งปกติ
      parcelKind: 1, // พัสดุปกติ
      weight: 1000, // 1 กก. (หน่วยเป็นกรัม)
      width: 20,
      length: 30,
      height: 15,
      insured: 0, // ไม่ซื้อประกัน
      codEnabled: 0, // ไม่ใช้ COD
    };
    
    // แปลงเบอร์โทรให้เป็นรูปแบบที่ถูกต้อง (ลบช่องว่างและขีด)
    const senderPhone = orderData.srcPhone.replace(/[\s-]/g, '');
    const recipientPhone = orderData.dstPhone.replace(/[\s-]/g, '');
    
    // สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // เตรียมข้อมูลสำหรับใช้ในการสร้างลายเซ็น
    const requestParams: Record<string, any> = {
      mchId: FLASH_EXPRESS_MCH_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      outTradeNo: orderData.outTradeNo,
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`,
      srcName: orderData.srcName,
      srcPhone: senderPhone,
      srcProvinceName: orderData.srcProvinceName,
      srcCityName: orderData.srcCityName,
      srcDistrictName: orderData.srcDistrictName,
      srcPostalCode: orderData.srcPostalCode,
      srcDetailAddress: orderData.srcDetailAddress,
      dstName: orderData.dstName,
      dstPhone: recipientPhone,
      dstProvinceName: orderData.dstProvinceName,
      dstCityName: orderData.dstCityName,
      dstDistrictName: orderData.dstDistrictName,
      dstPostalCode: orderData.dstPostalCode,
      dstDetailAddress: orderData.dstDetailAddress,
      articleCategory: String(orderData.articleCategory),
      expressCategory: String(orderData.expressCategory),
      parcelKind: String(orderData.parcelKind),
      weight: String(orderData.weight),
      width: String(orderData.width),
      length: String(orderData.length),
      height: String(orderData.height),
      insured: String(orderData.insured),
      codEnabled: String(orderData.codEnabled),
      remark: 'ทดสอบการสร้างเลขพัสดุ', // จะไม่ถูกรวมในการคำนวณลายเซ็น
    };
    
    // สร้างลายเซ็น - ใช้ฟังก์ชันที่ปรับปรุงใหม่
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    // เพิ่มลายเซ็นเข้าไปในพารามิเตอร์
    requestParams.sign = signature;
    
    // แปลงเป็น URL-encoded string
    const encodedPayload = new URLSearchParams(requestParams as Record<string, string>).toString();
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload);
    
    // เรียกใช้ API
    try {
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        encodedPayload,
        { headers, timeout: API_TIMEOUT }
      );
      
      console.log('Flash Express API Response:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // ตรวจสอบผลลัพธ์
      if (response.data && response.data.code === 1) {
        console.log('✅ สร้างเลขพัสดุสำเร็จ!');
        console.log('📦 เลขพัสดุ:', response.data.data.pno);
        console.log('🏷️ Sort Code:', response.data.data.sortCode);
        
        // ทดสอบติดตามสถานะหลังจากสร้างเลขพัสดุสำเร็จ
        await testTrackingStatus(response.data.data.pno);
        
        return {
          success: true,
          trackingNumber: response.data.data.pno,
          sortCode: response.data.data.sortCode
        };
      } else {
        console.log('❌ การสร้างเลขพัสดุไม่สำเร็จ:', response.data);
        return { success: false, error: response.data?.message || 'Unknown error' };
      }
    } catch (apiError: any) {
      console.error('❌ เกิดข้อผิดพลาดในการเรียก API:', apiError.message);
      
      if (apiError.response) {
        console.error('❌ Response status:', apiError.response.status);
        console.error('❌ Response data:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      return { success: false, error: apiError.message };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบสร้างการจัดส่ง:', error.message);
    return { success: false, error: error.message };
  }
}

// ทดสอบติดตามสถานะ
async function testTrackingStatus(trackingNumber: string) {
  try {
    console.log(`🧪 เริ่มทดสอบติดตามสถานะพัสดุ ${trackingNumber}...`);
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // เตรียมข้อมูลสำหรับใช้ในการสร้างลายเซ็น
    const requestParams: Record<string, any> = {
      mchId: FLASH_EXPRESS_MCH_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      pno: trackingNumber
    };
    
    // สร้างลายเซ็น
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น:', JSON.stringify(requestParams, null, 2));
    const signature = generateFlashSignature(requestParams, FLASH_EXPRESS_API_KEY as string);
    console.log('ลายเซ็นที่สร้าง:', signature);
    
    // เพิ่มลายเซ็นเข้าไปในพารามิเตอร์
    requestParams.sign = signature;
    
    // แปลงเป็น URL-encoded string
    const encodedPayload = new URLSearchParams(requestParams as Record<string, string>).toString();
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders/query_detail`);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Encoded payload ที่ส่งไป:', encodedPayload);
    
    // เรียกใช้ API
    try {
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders/query_detail`,
        encodedPayload,
        { headers, timeout: API_TIMEOUT }
      );
      
      console.log('Flash Express API Response:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.code === 1) {
        console.log('✅ ดึงข้อมูลสถานะพัสดุสำเร็จ!');
        console.log('🚚 สถานะ:', response.data.data.statusDesc);
        
        return {
          success: true,
          status: response.data.data.statusDesc,
          detail: response.data.data
        };
      } else {
        console.log('❌ การดึงข้อมูลสถานะพัสดุไม่สำเร็จ:', response.data);
        return { success: false, error: response.data?.message || 'Unknown error' };
      }
    } catch (apiError: any) {
      console.error('❌ เกิดข้อผิดพลาดในการเรียก API:', apiError.message);
      
      if (apiError.response) {
        console.error('❌ Response status:', apiError.response.status);
        console.error('❌ Response data:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      return { success: false, error: apiError.message };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบติดตามสถานะพัสดุ:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบทั้งหมด
async function runAllTests() {
  console.log('========================= Flash Express API Tests (FIXED) =========================');
  
  // ทดสอบดึงตัวเลือกการจัดส่ง
  console.log('\n🧪 TEST 1: ดึงตัวเลือกการจัดส่ง 🧪');
  try {
    await testGetShippingOptions();
  } catch (error) {
    console.error('❌ การทดสอบดึงตัวเลือกการจัดส่งล้มเหลว:', error);
  }
  
  // ทดสอบสร้างการจัดส่ง
  console.log('\n🧪 TEST 2: สร้างการจัดส่ง 🧪');
  try {
    await testCreateShipping();
  } catch (error) {
    console.error('❌ การทดสอบสร้างการจัดส่งล้มเหลว:', error);
  }
  
  console.log('\n========================= Tests Complete =========================');
}

// เริ่มการทดสอบ
runAllTests();