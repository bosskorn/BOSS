/**
 * ไฟล์ทดสอบการเชื่อมต่อกับ Flash Express API ด้วยข้อมูลจริงของผู้ใช้
 * โดยไม่สนใจการเปรียบเทียบลายเซ็น
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
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('⚙️ เริ่มคำนวณลายเซ็น Flash Express API...');
    
    // 0. ตรวจสอบว่ามี API key หรือไม่
    if (!apiKey) {
      console.error('❌ ไม่พบ API Key สำหรับสร้างลายเซ็น');
      throw new Error('API Key is required for signature generation');
    }

    // 1. แปลงทุกค่าเป็น string และกรองพารามิเตอร์
    const stringParams: Record<string, string> = {};
    Object.keys(params).forEach(key => {
      // ข้ามฟิลด์ที่ไม่ต้องใช้ในการคำนวณลายเซ็น
      const skipParams = [
        'sign', 
        'subItemTypes', 
        'merchantId',
        'subParcel',
        'subParcelQuantity',
        'remark',
        'opdInsureEnabled' // ทดลองข้ามตัวนี้
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

async function testWithRealUserData() {
  try {
    console.log('🧪 เริ่มการทดสอบ Flash Express API ด้วยข้อมูลจริงของผู้ใช้...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      console.error('ไม่พบ Flash Express API credentials');
      return { success: false, error: 'Flash Express API credentials not configured' };
    }
    
    console.log('🔍 ใช้ merchantId:', FLASH_EXPRESS_MCH_ID);

    // 1. สร้างเลขออเดอร์สุ่ม
    const outTradeNo = `TEST${Date.now()}`;
    const nonceStr = generateNonceStr();
    const timestamp = String(Math.floor(Date.now() / 1000));
    
    // 2. ข้อมูลที่ผู้ใช้ให้มา
    const orderData = {
      // ข้อมูลพื้นฐาน
      mchId: FLASH_EXPRESS_MCH_ID,
      nonceStr,
      timestamp,
      outTradeNo,
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`,
      
      // ข้อมูลผู้ส่ง (จากข้อมูลผู้ใช้)
      srcName: 'วาสนา วงศ์มาลา',
      srcPhone: '0922573604',
      srcProvinceName: 'น่าน',
      srcCityName: 'เวียงสา',
      srcDistrictName: 'กลางเวียง',
      srcPostalCode: '55110',
      srcDetailAddress: '2หมู่12 บ.ร้องเย็น ต.กลางเวียง อ.เวียงสา จ.น่าน 55110',
      
      // ข้อมูลผู้รับ (จากข้อมูลผู้ใช้)
      dstName: 'ผู้รับทดสอบ',
      dstPhone: '0812345678',
      dstProvinceName: 'กรุงเทพมหานคร',
      dstCityName: 'ลาดพร้าว',
      dstDistrictName: 'ลาดพร้าว',
      dstPostalCode: '10230',
      dstDetailAddress: 'ลาดพร้าว ลาดพร้าว กรุงเทพ 10230',
      
      // ข้อมูลพัสดุ
      articleCategory: 1,     // ประเภทพัสดุ
      expressCategory: 1,     // ประเภทการขนส่ง
      parcelKind: 1,          // ประเภทกล่อง
      weight: 1000,           // น้ำหนักเป็นกรัม (1 kg)
      insured: 0,             // ไม่มีประกัน
      codEnabled: 0,          // ไม่มี COD
      remark: 'ทดสอบการส่งพัสดุด้วยข้อมูลจริง'
    };
    
    // 3. คำนวณลายเซ็น
    const signature = generateFlashSignature(orderData, FLASH_EXPRESS_API_KEY as string);
    
    // 4. เพิ่มลายเซ็นเข้าไปในข้อมูล
    const requestData = {
      ...orderData,
      sign: signature
    };
    
    // 5. แปลงเป็น URL-encoded string
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestData)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    
    // 6. ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    console.log('URL ที่เรียก:', `${FLASH_EXPRESS_API_URL}/open/v3/orders`);
    console.log('Headers ที่ใช้:', JSON.stringify(headers, null, 2));
    console.log('Encoded payload ที่ส่งไป:', formData.toString());
    
    // 7. ส่งคำขอไปยัง API
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
        
        return {
          success: false,
          status: apiError.response.status,
          error: apiError.response.data?.message || apiError.message,
          data: apiError.response.data
        };
      }
      
      return { success: false, error: apiError.message };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
testWithRealUserData().then(result => {
  console.log('\n🏁 ผลการทดสอบ:', result);
}).catch(error => {
  console.error('💥 การทดสอบล้มเหลว:', error);
});