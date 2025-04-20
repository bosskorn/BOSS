/**
 * ไฟล์ทดสอบการสร้างลายเซ็นสำหรับ Flash Express API ตามรูปแบบที่ถูกต้อง
 * แสดงค่าที่ส่งจริง, ค่า stringSignTemp, และค่า sign ที่ได้อย่างละเอียด
 */
import crypto from 'crypto';

// API credentials (ไม่ต้องใช้ .env เพื่อความชัดเจนในการทดสอบ)
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID as string;
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY as string;

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express ตามที่คุณแนะนำ
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  const filteredParams: Record<string, string> = {};

  for (const key in params) {
    if (key === 'sign' || key === 'subItemTypes') continue;

    const value = params[key];
    if (value === null || value === undefined) continue;

    if (
      typeof value === 'string' &&
      value.replace(/[\u0009-\u000D\u001C-\u001F]/g, '').trim() === ''
    ) continue;

    filteredParams[key] = String(value);
  }

  const sortedKeys = Object.keys(filteredParams).sort();

  const paramPairs = sortedKeys.map(key => `${key}=${filteredParams[key]}`);
  const paramString = paramPairs.join('&');

  const stringToSign = `${paramString}&key=${apiKey}`;
  const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();

  return signature;
}

/**
 * ทดสอบการสร้างลายเซ็นด้วยตัวอย่างจริง
 */
function testRealSignature() {
  console.log('========= ทดสอบการสร้างลายเซ็น Flash Express =========');
  
  // สร้างข้อมูลพื้นฐาน
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = 'testNonceStr12345';
  const orderNumber = `PD${Date.now()}`;
  
  // สร้างข้อมูลทดสอบ (ค่าที่ส่งจริง/payload ก่อนส่ง)
  const params = {
    mchId: FLASH_EXPRESS_MERCHANT_ID,
    nonceStr: nonceStr,
    timestamp: timestamp,
    outTradeNo: orderNumber,
    srcName: 'บริษัท เพอร์เพิลแดช จำกัด',
    srcPhone: '0812345678',
    srcProvinceName: 'กรุงเทพมหานคร',
    srcCityName: 'คลองเตย',
    srcPostalCode: '10110',
    srcDetailAddress: '123 ถนนสุขุมวิท',
    dstName: 'คุณทดสอบ ระบบ',
    dstPhone: '0898765432',
    dstProvinceName: 'กรุงเทพมหานคร',
    dstCityName: 'จตุจักร',
    dstPostalCode: '10900',
    dstDetailAddress: '456 ถนนพหลโยธิน',
    articleCategory: '1',
    expressCategory: '1',
    weight: '1000',
    width: '10',
    height: '10',
    length: '10',
    insured: '0',
    codEnabled: '0',
    srcDistrictName: 'คลองเตย',
    dstDistrictName: 'จตุจักร'
  };
  
  console.log('\n1. ค่าที่ส่งจริง (payload ก่อนส่ง):');
  console.log(JSON.stringify(params, null, 2));
  
  // ทำการคัดกรองและเรียงลำดับพารามิเตอร์
  const filteredParams: Record<string, string> = {};
  
  for (const key in params) {
    if (key === 'sign' || key === 'subItemTypes') continue;
    
    const value = params[key];
    if (value === null || value === undefined) continue;
    
    if (
      typeof value === 'string' &&
      value.replace(/[\u0009-\u000D\u001C-\u001F]/g, '').trim() === ''
    ) continue;
    
    filteredParams[key] = String(value);
  }
  
  const sortedKeys = Object.keys(filteredParams).sort();
  const paramPairs = sortedKeys.map(key => `${key}=${filteredParams[key]}`);
  const paramString = paramPairs.join('&');
  
  // สร้าง stringA / stringSignTemp
  const stringToSign = `${paramString}&key=${FLASH_EXPRESS_API_KEY}`;
  
  console.log('\n2. stringA / stringSignTemp ที่ใช้สร้าง sign:');
  console.log(stringToSign);
  
  // คำนวณลายเซ็น
  const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();
  
  console.log('\n3. ค่า sign ที่ได้:');
  console.log(signature);
  
  // สร้าง payload พร้อมลายเซ็น (ต้องเพิ่ม sign หลังจากคำนวณเสร็จแล้ว)
  const fullPayload = { ...params, sign: signature };
  
  // หากต้องการส่ง subItemTypes (เพิ่มหลังจากคำนวณ sign แล้ว)
  const subItemTypesJSON = JSON.stringify([{ itemName: "สินค้าทดสอบ", itemQuantity: 1 }]);
  fullPayload.subItemTypes = subItemTypesJSON;
  
  console.log('\n4. Payload สมบูรณ์ (รวม sign และ subItemTypes):');
  console.log(JSON.stringify(fullPayload, null, 2));
  
  console.log('\n5. ค่าที่จะถูก URL-encode ก่อนส่งจริง:');
  const encodedPayload = new URLSearchParams(fullPayload).toString();
  console.log(encodedPayload);
  
  console.log('\n========= จบการทดสอบ =========');
  
  return {
    originalParams: params,
    stringToSign: stringToSign,
    signature: signature,
    fullPayload: fullPayload,
    encodedPayload: encodedPayload
  };
}

/**
 * ทดสอบเปรียบเทียบการสร้างลายเซ็นระหว่างฟังก์ชัน
 */
function compareSignatureFunctions() {
  console.log('\n========= เปรียบเทียบฟังก์ชันสร้างลายเซ็น =========');
  
  // สร้างข้อมูลพื้นฐาน
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = 'compareTest' + Date.now().toString().substring(8);
  const orderNumber = `PD${Date.now()}`;
  
  // สร้างข้อมูลทดสอบ
  const params = {
    mchId: FLASH_EXPRESS_MERCHANT_ID,
    nonceStr: nonceStr,
    timestamp: timestamp,
    outTradeNo: orderNumber,
    srcName: 'บริษัท เพอร์เพิลแดช จำกัด',
    srcPhone: '0812345678',
    srcProvinceName: 'กรุงเทพมหานคร',
    srcCityName: 'คลองเตย',
    srcPostalCode: '10110',
    srcDetailAddress: '123 ถนนสุขุมวิท',
    dstName: 'คุณทดสอบ ระบบ',
    dstPhone: '0898765432',
    dstProvinceName: 'กรุงเทพมหานคร',
    dstCityName: 'จตุจักร',
    dstPostalCode: '10900',
    dstDetailAddress: '456 ถนนพหลโยธิน',
    articleCategory: '1',
    expressCategory: '1',
    weight: '1000',
    width: '10',
    height: '10',
    length: '10',
    insured: '0',
    codEnabled: '0',
    srcDistrictName: 'คลองเตย',
    dstDistrictName: 'จตุจักร'
  };
  
  // ใช้ฟังก์ชันที่คุณให้มา
  const signatureFromFunction = generateFlashSignature(params, FLASH_EXPRESS_API_KEY);
  
  console.log('ลายเซ็นจากฟังก์ชัน generateFlashSignature:');
  console.log(signatureFromFunction);
}

/**
 * รันการทดสอบทั้งหมด
 */
async function runAllTests() {
  try {
    // ตรวจสอบว่ามี API key หรือไม่
    if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
      console.error('กรุณากำหนดค่า FLASH_EXPRESS_MERCHANT_ID และ FLASH_EXPRESS_API_KEY ก่อนทดสอบ');
      return;
    }
    
    console.log(`Flash Express Merchant ID: ${FLASH_EXPRESS_MERCHANT_ID}`);
    console.log(`Flash Express API Key: ${FLASH_EXPRESS_API_KEY.substring(0, 5)}...${FLASH_EXPRESS_API_KEY.substring(FLASH_EXPRESS_API_KEY.length - 5)}`);
    
    testRealSignature();
    compareSignatureFunctions();
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error);
  }
}

// เริ่มการทดสอบ
runAllTests();