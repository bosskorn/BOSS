/**
 * สคริปต์ทดสอบการเชื่อมต่อพื้นฐานกับ Flash Express API
 * ทดสอบว่าสามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้และรีเควสพื้นฐานทำงานได้หรือไม่
 */
import axios from 'axios';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MCH_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API
const API_TIMEOUT = 15000; // 15 วินาที

/**
 * ทดสอบเชื่อมต่อพื้นฐานกับเซิร์ฟเวอร์
 */
async function testServerConnection() {
  console.log('🧪 ทดสอบการเชื่อมต่อพื้นฐานกับเซิร์ฟเวอร์ Flash Express...');
  
  try {
    console.log('📡 ทดสอบการเชื่อมต่อกับ:', FLASH_EXPRESS_API_URL);
    
    // เช็คว่าเซิร์ฟเวอร์ตอบสนองหรือไม่ด้วยการส่ง POST request ไปยัง endpoint หลัก
    // ใช้ endpoint ที่ใช้จริงในแอปพลิเคชัน
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = Math.random().toString(36).substring(2, 15);
    
    // ทดสอบด้วยข้อมูลขั้นต่ำสำหรับการเรียก API
    const requestData = new URLSearchParams({
      mchId: FLASH_EXPRESS_MCH_ID || 'test',
      nonceStr: nonceStr,
      timestamp: timestamp
    });
    
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    // ทดสอบเรียก endpoint หลักสำหรับการสร้าง order
    const response = await axios.post(
      `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
      requestData.toString(),
      { headers, timeout: API_TIMEOUT }
    );
    
    console.log('✅ เชื่อมต่อกับเซิร์ฟเวอร์สำเร็จ! Status:', response.status);
    console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(response.data, null, 2));
    
    return { success: true, status: response.status, data: response.data };
  } catch (error: any) {
    console.error('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้:', error.message);
    
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      
      // ถ้าได้รับ error code 1002 (signature failed) แสดงว่าเชื่อมต่อได้แต่ลายเซ็นไม่ถูกต้อง
      if (error.response.data && error.response.data.code === 1002) {
        console.log('⚠️ พบข้อผิดพลาดในการเซ็นลายมือชื่อ - นี่เป็นเรื่องปกติเนื่องจากเราไม่ได้ส่งลายเซ็น');
        console.log('✅ สามารถเชื่อมต่อกับ API ได้! (แม้จะมี error ลายเซ็น)');
        return { success: true, note: 'API connection established but signature verification failed (expected)' };
      }
    }
    
    // ทดสอบเชื่อมต่อกับ URL อื่นเพื่อตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
    try {
      console.log('🔄 ทดสอบการเชื่อมต่ออินเทอร์เน็ตกับ Google...');
      const googleResponse = await axios.get('https://www.google.com', {
        timeout: API_TIMEOUT
      });
      console.log('✅ เชื่อมต่ออินเทอร์เน็ตได้ปกติ, status:', googleResponse.status);
    } catch (internetError: any) {
      console.error('❌ ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้:', internetError.message);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * ทดสอบดึงข้อมูลพื้นฐานจาก Flash Express API
 */
async function testBasicApiAccess() {
  console.log('\n🧪 ทดสอบการเข้าถึง API พื้นฐาน...');
  
  // ตรวจสอบว่ามี credentials ครบหรือไม่
  if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
    console.error('❌ ไม่พบข้อมูลในการเชื่อมต่อ Flash Express API (mchId และ/หรือ API key)');
    return { success: false, error: 'API credentials not configured' };
  }
  
  console.log('🔑 ข้อมูลที่ใช้ในการเชื่อมต่อ:');
  console.log('- mchId:', FLASH_EXPRESS_MCH_ID);
  console.log('- API key (masked):', FLASH_EXPRESS_API_KEY ? FLASH_EXPRESS_API_KEY.substring(0, 5) + '...' : 'Not found');
  
  try {
    // ทดสอบการเรียกใช้ API สำหรับดึงวิธีการชำระเงิน (เป็น API ที่ไม่ต้องการข้อมูลจำนวนมาก)
    console.log('📡 ทดสอบการเรียก API เพื่อตรวจสอบสถานะระบบ...');
    
    // สร้าง request สำหรับตรวจสอบพื้นที่ให้บริการ (พารามิเตอร์น้อย)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = Math.random().toString(36).substring(2, 15);
    
    // สร้าง request headers อย่างง่าย
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    // ลองเรียก URL ง่ายๆ ที่ใช้แค่ mchId และไม่จำเป็นต้องมีลายเซ็น
    const formData = new URLSearchParams({
      mchId: FLASH_EXPRESS_MCH_ID
    });
    
    try {
      // ลองเรียก API service area ซึ่งควรจะใช้พารามิเตอร์น้อย
      const serviceAreaUrl = `${FLASH_EXPRESS_API_URL}/open/v1/common/service_area`;
      console.log('📡 ทดสอบเรียก API ที่:', serviceAreaUrl);
      
      const response = await axios.post(
        serviceAreaUrl,
        formData.toString(),
        { headers, timeout: API_TIMEOUT }
      );
      
      console.log('✅ เรียก API สำเร็จ! Status:', response.status);
      console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(response.data, null, 2));
      
      return { success: true, data: response.data };
    } catch (apiError: any) {
      console.error('❌ ไม่สามารถเรียก API ได้:', apiError.message);
      
      if (apiError.response) {
        console.error('❌ Response status:', apiError.response.status);
        console.error('❌ Response data:', JSON.stringify(apiError.response.data, null, 2));
        
        if (apiError.response.data && apiError.response.data.code === 1002) {
          console.log('⚠️ พบข้อผิดพลาดในการเซ็นลายมือชื่อ - นี่เป็นเรื่องปกติเนื่องจากเราไม่ได้ส่งลายเซ็น');
          console.log('✅ แต่แสดงว่าเราสามารถเชื่อมต่อกับ API ได้!');
          return { success: true, note: 'API connection established but signature verification failed (expected)' };
        }
      }
      
      // ลองวิธีอื่น
      try {
        console.log('\n🔄 ลองทดสอบเรียก API อื่น - version info...');
        const versionUrl = `${FLASH_EXPRESS_API_URL}/open/v1/common/version`;
        
        const versionResponse = await axios.post(
          versionUrl,
          formData.toString(),
          { headers, timeout: API_TIMEOUT }
        );
        
        console.log('✅ เรียก API สำเร็จ! Status:', versionResponse.status);
        console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(versionResponse.data, null, 2));
        
        return { success: true, data: versionResponse.data };
      } catch (versionError: any) {
        console.error('❌ ไม่สามารถเรียก API version ได้เช่นกัน:', versionError.message);
        
        if (versionError.response) {
          console.error('❌ Response status:', versionError.response.status);
          console.error('❌ Response data:', JSON.stringify(versionError.response.data, null, 2));
          
          if (versionError.response.data && versionError.response.data.code === 1002) {
            console.log('⚠️ พบข้อผิดพลาดในการเซ็นลายมือชื่อ - นี่เป็นเรื่องปกติเนื่องจากเราไม่ได้ส่งลายเซ็น');
            console.log('✅ แต่แสดงว่าเราสามารถเชื่อมต่อกับ API ได้!');
            return { success: true, note: 'API connection established but signature verification failed (expected)' };
          }
        }
      }
      
      return { success: false, error: apiError.message };
    }
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ API:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบการเชื่อมต่อ
async function runAllTests() {
  console.log('============== Flash Express API Connection Tests ==============');
  
  // 1. ทดสอบการเชื่อมต่อกับเซิร์ฟเวอร์
  const connectionResult = await testServerConnection();
  
  // 2. ทดสอบการเข้าถึง API พื้นฐาน
  if (connectionResult.success) {
    await testBasicApiAccess();
  }
  
  console.log('================ Tests Complete ================');
}

// เริ่มการทดสอบ
runAllTests();