/**
 * สคริปต์ทดสอบการเชื่อมต่อ Flash Express API ด้วยตัวอย่างข้อมูลจริง
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_MCH_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API (15 วินาที)
const API_TIMEOUT = 15000;

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express อย่างเคร่งครัด
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
      // ข้ามฟิลด์ sign และ subItemTypes (จะเพิ่มหลังจากสร้างลายเซ็น) และ merchantId (ใช้ mchId แทน)
      if (key === 'sign' || key === 'subItemTypes' || key === 'merchantId') return;
      
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

/**
 * สร้างการจัดส่งใหม่โดยใช้ข้อมูลตัวอย่าง
 */
async function testCreateShippingWithExampleData() {
  try {
    console.log('🧪 เริ่มการทดสอบ Flash Express API ด้วยข้อมูลตัวอย่าง...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // ข้อมูลตัวอย่างที่รับมา
    const exampleData = {
      mchId: FLASH_EXPRESS_MCH_ID, // ใช้ mchId จากระบบ
      nonceStr: '1536749552628',
      outTradeNo: '123456789XXXX',
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`,
      srcName: 'หอมรวม  create order test name',
      srcPhone: '0123456789',
      srcProvinceName: 'อุบลราชธานี',
      srcCityName: 'เมืองอุบลราชธานี',
      srcDistrictName: 'ในเมือง',
      srcPostalCode: '34000',
      srcDetailAddress: 'example detail address',
      dstName: 'น้ำพริกแม่อำพร',
      dstPhone: '0123456789',
      dstHomePhone: '0123456789',
      dstProvinceName: 'เชียงใหม่',
      dstCityName: 'สันทราย',
      dstDistrictName: 'สันพระเนตร',
      dstPostalCode: '50210',
      dstDetailAddress: 'example detail address',
      returnName: 'น้ำพริกแม่อำพร',
      returnPhone: '0123456789',
      returnProvinceName: 'อุบลราชธานี',
      returnCityName: 'เมืองอุบลราชธานี',
      returnPostalCode: '34000',
      returnDetailAddress: 'example detail address',
      articleCategory: 1,
      expressCategory: 1,
      weight: 1000,
      insured: 1,
      insureDeclareValue: 10000,
      opdInsureEnabled: 1,
      codEnabled: 1,
      codAmount: 10000,
      subParcelQuantity: 2,
      timestamp: String(Math.floor(Date.now() / 1000)) // เพิ่ม timestamp เพื่อใช้ในการคำนวณลายเซ็น
    };
    
    // กรองเอาเฉพาะข้อมูลที่จำเป็นสำหรับสร้างลายเซ็น
    const signingData = { ...exampleData };
    delete signingData.subParcelQuantity; // ไม่รวมใน signature

    // สร้างลายเซ็น
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น:', JSON.stringify(signingData, null, 2));
    const signature = generateFlashSignature(signingData, FLASH_EXPRESS_API_KEY as string);
    console.log('ลายเซ็นที่สร้าง:', signature);
    console.log('ลายเซ็นตัวอย่าง:', 'D4515A46B6094589F1F7615ADCC988FBB03A79010F2A206DC982F27D396F93A0');
    
    // เตรียมข้อมูลสำหรับส่งไปยัง API (รวม subParcel และ subItemTypes)
    const requestData = { 
      ...signingData,
      sign: signature
    };
    
    // เพิ่ม subParcel และ subItemTypes หลังจากสร้างลายเซ็นแล้ว
    requestData.subParcel = JSON.stringify([
      {
        "outTradeNo": "123456789XXXX1",
        "weight": 21,
        "width": 21,
        "length": 21,
        "height": 12,
        "remark": "remark1"
      },
      {
        "outTradeNo": "123456789XXXX2",
        "weight": 21,
        "width": 21,
        "length": 21,
        "height": 21,
        "remark": "remark2"
      }
    ]);
    
    requestData.subItemTypes = JSON.stringify([
      {
        "itemName": "item name description",
        "itemWeightSize": "1*1*1 1Kg",
        "itemColor": "red",
        "itemQuantity": "1"
      },
      {
        "itemName": "item name description",
        "itemWeightSize": "2*2*2 1Kg",
        "itemColor": "blue",
        "itemQuantity": "2"
      }
    ]);
    
    // เพิ่ม remark
    requestData.remark = 'ขึ้นบันได';
    
    console.log('ข้อมูลที่จะส่งไปยัง API:', JSON.stringify(requestData, null, 2));
    
    // แปลงเป็น URL-encoded string
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(requestData)) {
      formData.append(key, value as string);
    }
    
    // ตั้งค่า headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': String(Math.floor(Date.now() / 1000)),
      'X-Flash-Nonce': exampleData.nonceStr
    };
    
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('URL-encoded Form data:', formData.toString());
    
    try {
      // ส่งคำขอไปยัง API
      console.log('กำลังเรียก Flash Express API...');
      const response = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        formData.toString(),
        { headers, timeout: API_TIMEOUT }
      );
      
      console.log('Flash Express API Response:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (apiError: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก API:', apiError.message);
      
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
async function runTest() {
  console.log('========================= Flash Express API Test =========================');
  try {
    await testCreateShippingWithExampleData();
  } catch (error) {
    console.error('การทดสอบล้มเหลว:', error);
  }
  console.log('========================= Test Complete =========================');
}

// เริ่มการทดสอบ
runTest();