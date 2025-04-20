/**
 * สคริปต์ทดสอบการสร้างลายเซ็นสำหรับ Flash Express API
 * ทดสอบรูปแบบต่างๆ ของการสร้างลายเซ็น
 */
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID || '';
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY || '';

// ข้อมูลตัวอย่างจากเอกสารของ Flash Express
const EXAMPLE_DATA = {
  mchId: 'Cbe1930',
  nonceStr: '1702538287523',
  timestamp: '1702538287',
  articleCategory: '1',
  codEnabled: '0',
  dstCityName: 'บางกะปิ',
  dstDetailAddress: '46/3',
  dstName: 'คุณทดสอบ',
  dstPhone: '0804194304',
  dstPostalCode: '10240',
  dstProvinceName: 'กรุงเทพมหานคร',
  expressCategory: '1',
  insured: '0',
  outTradeNo: 'FLE123456789',
  srcCityName: 'มีนบุรี',
  srcDetailAddress: '943/16',
  srcName: 'คุณเทส',
  srcPhone: '0804194304',
  srcPostalCode: '10510',
  srcProvinceName: 'กรุงเทพมหานคร',
  weight: '500'
};

// ลายเซ็นที่ถูกต้องจากเอกสาร Flash Express
const EXAMPLE_EXPECTED_SIGNATURE = 'A01CFE5C3D7C6DE1CFB30BEC55A77A96F2A792D5CFB1558BE89CC320D6C7D3F5';

// ฟังก์ชันสร้างลายเซ็นแบบ 1 - แปลงค่าทั้งหมดเป็นสตริง
function generateSignatureV1(params: Record<string, any>, apiKey: string): string {
  try {
    // คัดกรองพารามิเตอร์
    const filteredParams: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ข้ามค่า null และ undefined
      if (value === null || value === undefined) continue;
      
      // แปลงค่าเป็นสตริงทั้งหมด
      filteredParams[key] = String(value);
    }
    
    // เรียงลำดับตาม ASCII
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // สร้างสตริงพารามิเตอร์
    const paramString = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&');
    
    // เพิ่ม API key
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    console.log('แบบที่ 1 - สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณ SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
      
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ฟังก์ชันสร้างลายเซ็นแบบ 2 - คงค่าตัวเลขไว้เป็นตัวเลข
function generateSignatureV2(params: Record<string, any>, apiKey: string): string {
  try {
    // คัดกรองพารามิเตอร์
    const filteredParams: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ข้ามค่า null และ undefined
      if (value === null || value === undefined) continue;
      
      // คงค่าไว้ตามต้นฉบับ
      filteredParams[key] = value;
    }
    
    // เรียงลำดับตาม ASCII
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // สร้างสตริงพารามิเตอร์
    const paramString = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&');
    
    // เพิ่ม API key
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    console.log('แบบที่ 2 - สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณ SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
      
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ฟังก์ชันสร้างลายเซ็นแบบ 3 - ใช้ URLSearchParams
function generateSignatureV3(params: Record<string, any>, apiKey: string): string {
  try {
    // คัดกรองพารามิเตอร์
    const filteredParams: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ข้ามค่า null และ undefined
      if (value === null || value === undefined) continue;
      
      // แปลงค่าเป็นสตริงทั้งหมด
      filteredParams[key] = String(value);
    }
    
    // เรียงลำดับตาม ASCII และใช้ URLSearchParams
    const sortedKeys = Object.keys(filteredParams).sort();
    const searchParams = new URLSearchParams();
    
    sortedKeys.forEach(key => {
      searchParams.append(key, filteredParams[key]);
    });
    
    // แปลงเป็นสตริงและเพิ่ม API key
    const paramString = searchParams.toString();
    const stringToSign = `${paramString}&key=${apiKey}`;
    
    console.log('แบบที่ 3 - สตริงที่ใช้สร้างลายเซ็น:', stringToSign);
    
    // คำนวณ SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
      
    return signature;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

// ทดสอบกับข้อมูลตัวอย่างจากเอกสาร
function testWithExampleData() {
  console.log('\n=== ทดสอบกับข้อมูลตัวอย่างจากเอกสาร ===');
  
  console.log('ข้อมูลตัวอย่าง:', JSON.stringify(EXAMPLE_DATA, null, 2));
  console.log('ลายเซ็นที่คาดหวัง:', EXAMPLE_EXPECTED_SIGNATURE);
  
  // ทดสอบรูปแบบต่างๆ ของการสร้างลายเซ็น
  const sig1 = generateSignatureV1(EXAMPLE_DATA, FLASH_EXPRESS_API_KEY);
  console.log('ลายเซ็นแบบที่ 1:', sig1);
  console.log('ตรงกับที่คาดหวัง:', sig1 === EXAMPLE_EXPECTED_SIGNATURE);
  
  const sig2 = generateSignatureV2(EXAMPLE_DATA, FLASH_EXPRESS_API_KEY);
  console.log('ลายเซ็นแบบที่ 2:', sig2);
  console.log('ตรงกับที่คาดหวัง:', sig2 === EXAMPLE_EXPECTED_SIGNATURE);
  
  const sig3 = generateSignatureV3(EXAMPLE_DATA, FLASH_EXPRESS_API_KEY);
  console.log('ลายเซ็นแบบที่ 3:', sig3);
  console.log('ตรงกับที่คาดหวัง:', sig3 === EXAMPLE_EXPECTED_SIGNATURE);
}

// ทดสอบกับข้อมูลจริง
function testWithRealData() {
  console.log('\n=== ทดสอบกับข้อมูลจริง ===');
  
  // สร้างข้อมูลทดสอบ
  const realData = {
    mchId: FLASH_EXPRESS_MERCHANT_ID,
    nonceStr: '1745133100123',
    timestamp: '1745133100',
    fromPostalCode: '10110',
    toPostalCode: '10900',
    weight: 1000
  };
  
  console.log('ข้อมูลทดสอบ:', JSON.stringify(realData, null, 2));
  
  // ทดสอบรูปแบบต่างๆ ของการสร้างลายเซ็น
  const sig1 = generateSignatureV1(realData, FLASH_EXPRESS_API_KEY);
  console.log('ลายเซ็นแบบที่ 1:', sig1);
  
  const sig2 = generateSignatureV2(realData, FLASH_EXPRESS_API_KEY);
  console.log('ลายเซ็นแบบที่ 2:', sig2);
  
  const sig3 = generateSignatureV3(realData, FLASH_EXPRESS_API_KEY);
  console.log('ลายเซ็นแบบที่ 3:', sig3);
}

// ตรวจสอบค่า API key ก่อนทดสอบ
if (!FLASH_EXPRESS_MERCHANT_ID || !FLASH_EXPRESS_API_KEY) {
  console.error('กรุณาตั้งค่า FLASH_EXPRESS_MERCHANT_ID และ FLASH_EXPRESS_API_KEY ในตัวแปรสภาพแวดล้อม');
  process.exit(1);
}

// รันการทดสอบ
console.log('====================================================');
console.log('     การทดสอบการสร้างลายเซ็นสำหรับ Flash Express API');
console.log('====================================================');
console.log('FLASH_EXPRESS_MERCHANT_ID:', FLASH_EXPRESS_MERCHANT_ID);
console.log('FLASH_EXPRESS_API_KEY:', FLASH_EXPRESS_API_KEY ? '(มีค่า)' : '(ไม่มีค่า)');

testWithExampleData();
testWithRealData();

console.log('\n====================================================');
console.log('                  การทดสอบเสร็จสิ้น');
console.log('====================================================');