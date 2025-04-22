/**
 * ไฟล์ทดสอบการเชื่อมต่อกับ Flash Express API โดยเฉพาะ
 * ใช้ข้อมูลตัวอย่างที่ผู้ใช้ให้มา
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;
const FLASH_EXPRESS_MCH_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;

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
        'remark',      // ไม่รวมในการคำนวณลายเซ็น
        'timestamp'    // ทดสอบไม่รวม timestamp เพื่อดูว่าตรงกับลายเซ็นตัวอย่างหรือไม่
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
    console.log('🔒 ลายเซ็นตัวอย่าง:', 'D4515A46B6094589F1F7615ADCC988FBB03A79010F2A206DC982F27D396F93A0');
    
    return signature;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างลายเซ็น Flash Express:', error);
    throw error;
  }
}

async function testWithUserInputData() {
  try {
    console.log('🧪 เริ่มการทดสอบ Flash Express API ด้วยข้อมูลจากผู้ใช้...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      console.error('ไม่พบ Flash Express API credentials');
      return { success: false, error: 'Flash Express API credentials not configured' };
    }
    
    console.log('🔍 ใช้ merchantId:', FLASH_EXPRESS_MCH_ID);

    // 1. ข้อมูลจากตัวอย่างของผู้ใช้
    const exampleData = {
      mchId: FLASH_EXPRESS_MCH_ID,
      nonceStr: '1536749552628',
      outTradeNo: `TEST${Date.now()}`,
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`,
      srcName: 'วาสนา วงศ์มาลา',  // ข้อมูลที่ผู้ใช้ให้มา
      srcPhone: '0922573604',     // ข้อมูลที่ผู้ใช้ให้มา
      srcProvinceName: 'น่าน',    // ข้อมูลที่ผู้ใช้ให้มา
      srcCityName: 'เวียงสา',     // ข้อมูลที่ผู้ใช้ให้มา
      srcDistrictName: 'กลางเวียง', // ข้อมูลที่ผู้ใช้ให้มา
      srcPostalCode: '55110',     // ข้อมูลที่ผู้ใช้ให้มา
      srcDetailAddress: '2หมู่12 บ.ร้องเย็น ต.กลางเวียง อ.เวียงสา จ.น่าน 55110', // ข้อมูลที่ผู้ใช้ให้มา
      dstName: 'ผู้รับตัวอย่าง',
      dstPhone: '0812345678',
      dstProvinceName: 'กรุงเทพมหานคร', // ข้อมูลที่ผู้ใช้ให้มา
      dstCityName: 'ลาดพร้าว',          // ข้อมูลที่ผู้ใช้ให้มา
      dstDistrictName: 'ลาดพร้าว',       // ข้อมูลที่ผู้ใช้ให้มา
      dstPostalCode: '10230',           // ข้อมูลที่ผู้ใช้ให้มา
      dstDetailAddress: 'ลาดพร้าว ลาดพร้าว กรุงเทพ 10230', // ข้อมูลที่ผู้ใช้ให้มา
      articleCategory: 1,
      expressCategory: 1,
      parcelKind: 1,
      weight: 1000,
      insured: 0,
      codEnabled: 0
    };

    // 2. ทดสอบสร้างลายเซ็นด้วยวิธีต่างๆ
    
    // วิธีที่ 1: ใช้ข้อมูลตามตัวอย่างของเรา ไม่รวม timestamp
    console.log('\n🧪 วิธีที่ 1: ทดสอบด้วยข้อมูลของเรา (ไม่รวม timestamp)');
    const signature1 = generateFlashSignature(exampleData, FLASH_EXPRESS_API_KEY as string);
    
    // วิธีที่ 2: ใช้ข้อมูลตามตัวอย่างของเรา รวม timestamp
    console.log('\n🧪 วิธีที่ 2: ทดสอบด้วยข้อมูลของเรา (รวม timestamp)');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const exampleDataWithTimestamp = { 
      ...exampleData,
      timestamp 
    };
    const signature2 = generateFlashSignature(exampleDataWithTimestamp, FLASH_EXPRESS_API_KEY as string);
    
    // 3. ส่งข้อมูลจริงไปยัง Flash Express API
    console.log('\n🚀 ส่งข้อมูลไปยัง Flash Express API...');
    
    // เลือกใช้ลายเซ็นจากวิธีที่ 2 (รวม timestamp)
    const requestData = { 
      ...exampleDataWithTimestamp,
      sign: signature2
    };
    
    // แปลงเป็น URL-encoded string
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestData)) {
      if (typeof value === 'string' || typeof value === 'number') {
        formData.append(key, String(value));
      }
    }
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature2,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': exampleData.nonceStr
    };
    
    console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Encoded payload ที่ส่งไป:', formData.toString());
    
    try {
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        formData.toString(),
        { headers, timeout: API_TIMEOUT }
      );
      
      console.log('✅ Flash Express API Response:', response.status);
      console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.code === 1) {
        console.log('🎉 สร้างเลขพัสดุสำเร็จ!');
        console.log('📦 เลขพัสดุ:', response.data.data.pno);
        console.log('🏷️ Sort Code:', response.data.data.sortCode);
        
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
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
testWithUserInputData().then(result => {
  console.log('\n🏁 ผลการทดสอบ:', result);
}).catch(error => {
  console.error('💥 การทดสอบล้มเหลว:', error);
});