/**
 * สคริปต์เปรียบเทียบระหว่าง API ที่ทำงานได้ และ API ที่ยังไม่ทำงาน
 * เปรียบเทียบความแตกต่างระหว่าง estimate_rate และ orders API
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
 * สร้างลายเซ็นสำหรับ estimate_rate API (ทำงานได้)
 */
function generateWorkingSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('⚙️ เริ่มคำนวณลายเซ็นสำหรับ API ที่ทำงานได้...');
    console.log('⚙️ ข้อมูลเริ่มต้น:', JSON.stringify(params, null, 2));
    
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

    console.log('🔑 สตริงที่ใช้สร้างลายเซ็น (estimate_rate):', stringToSign);

    // 4. สร้าง SHA-256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();

    console.log('🔒 ลายเซ็นที่สร้าง (estimate_rate):', signature);
    
    return signature;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างลายเซ็น:', error);
    throw error;
  }
}

/**
 * ทดสอบเปรียบเทียบระหว่าง estimate_rate และ orders API
 * เพื่อหาความแตกต่างในการสร้างลายเซ็น
 */
async function compareApis() {
  try {
    console.log('🧪 เริ่มเปรียบเทียบระหว่าง API ที่ทำงานได้ และ API ที่ยังไม่ทำงาน...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_MCH_ID || !FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // 1. เตรียมข้อมูลทดสอบที่ใช้ทั้งสองคำขอ
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    const outTradeNo = `TEST${Date.now()}`;
    
    // 2. ข้อมูลสำหรับทดสอบทั้งสอง API
    const senderInfo = {
      srcName: 'ผู้ส่งทดสอบ',
      srcPhone: '0812345678',
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: 'ลาดพร้าว',
      srcDistrictName: 'จรเข้บัว',
      srcPostalCode: '10230',
      srcDetailAddress: '123 ถนนลาดพร้าว ซอย 10',
    };
    
    const receiverInfo = {
      dstName: 'ผู้รับทดสอบ',
      dstPhone: '0823456789',
      dstProvinceName: 'เชียงใหม่',
      dstCityName: 'เมืองเชียงใหม่',
      dstDistrictName: 'ศรีภูมิ',
      dstPostalCode: '50200',
      dstDetailAddress: '456 ถนนนิมมานเหมินทร์',
    };
    
    const packageInfo = {
      weight: '1000', // 1 กก. (หน่วยเป็นกรัม)
      width: '20',
      length: '30',
      height: '15',
      articleCategory: '1', // ประเภทสินค้าทั่วไป
      expressCategory: '1', // บริการขนส่งปกติ
      parcelKind: '1', // พัสดุปกติ
      insured: '0', // ไม่ซื้อประกัน
      codEnabled: '0', // ไม่ใช้ COD
    };
    
    // ข้อมูลพื้นฐานสำหรับทั้งสอง API
    const baseParams = {
      mchId: FLASH_EXPRESS_MCH_ID,
      nonceStr: nonceStr,
      timestamp: timestamp,
      warehouseNo: `${FLASH_EXPRESS_MCH_ID}_001`,
    };
    
    // 3. เตรียมข้อมูลสำหรับ estimate_rate API (ทำงานได้)
    const estimateRateParams = {
      ...baseParams,
      srcProvinceName: senderInfo.srcProvinceName,
      srcCityName: senderInfo.srcCityName,
      srcDistrictName: senderInfo.srcDistrictName,
      srcPostalCode: senderInfo.srcPostalCode,
      dstProvinceName: receiverInfo.dstProvinceName,
      dstCityName: receiverInfo.dstCityName,
      dstDistrictName: receiverInfo.dstDistrictName,
      dstPostalCode: receiverInfo.dstPostalCode,
      weight: packageInfo.weight,
      width: packageInfo.width,
      length: packageInfo.length,
      height: packageInfo.height,
    };
    
    // 4. เตรียมข้อมูลสำหรับ orders API (ยังไม่ทำงาน)
    const createOrderParams = {
      ...baseParams,
      outTradeNo: outTradeNo,
      ...senderInfo,
      ...receiverInfo,
      ...packageInfo,
      remark: 'ทดสอบการสร้างเลขพัสดุ',
    };
    
    // 5. สร้างลายเซ็นสำหรับทั้งสอง API
    console.log('\n🧪 เปรียบเทียบการสร้างลายเซ็น:');
    console.log('⭐ 1. estimate_rate API (ทำงานได้)');
    const estimateRateSignature = generateWorkingSignature(estimateRateParams, FLASH_EXPRESS_API_KEY as string);
    
    console.log('\n⭐ 2. orders API (ยังไม่ทำงาน)');
    const createOrderSignature = generateWorkingSignature(createOrderParams, FLASH_EXPRESS_API_KEY as string);
    
    // 6. เพิ่มลายเซ็นเข้าไปในพารามิเตอร์
    estimateRateParams.sign = estimateRateSignature;
    createOrderParams.sign = createOrderSignature;
    
    // 7. แปลงเป็น URL-encoded string
    const estimateRatePayload = new URLSearchParams(estimateRateParams as Record<string, string>).toString();
    const createOrderPayload = new URLSearchParams(createOrderParams as Record<string, string>).toString();
    
    // 8. ตั้งค่า headers สำหรับทั้งสอง API
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': '', // จะเติมต่างกันตาม API
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    // 9. ทดสอบ estimate_rate API (ทำงานได้)
    console.log('\n🧪 ทดสอบ estimate_rate API (ทำงานได้):');
    const estimateRateHeaders = {
      ...headers,
      'X-Flash-Signature': estimateRateSignature
    };
    
    try {
      const estimateRateResponse = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v1/orders/estimate_rate`,
        estimateRatePayload,
        { headers: estimateRateHeaders, timeout: API_TIMEOUT }
      );
      
      console.log('✅ estimate_rate API สำเร็จ! Status:', estimateRateResponse.status);
      console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(estimateRateResponse.data, null, 2));
      
      if (estimateRateResponse.data.code === 1) {
        console.log('✅ สามารถดึงราคาค่าส่งได้: ' + estimateRateResponse.data.data.estimatePrice + ' บาท');
      }
    } catch (error: any) {
      console.error('❌ estimate_rate API ล้มเหลว:', error.message);
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 10. ทดสอบ orders API (ยังไม่ทำงาน) เพื่อเปรียบเทียบ
    console.log('\n🧪 ทดสอบ orders API (ยังไม่ทำงาน):');
    const createOrderHeaders = {
      ...headers,
      'X-Flash-Signature': createOrderSignature
    };
    
    try {
      const createOrderResponse = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        createOrderPayload,
        { headers: createOrderHeaders, timeout: API_TIMEOUT }
      );
      
      console.log('✅ orders API สำเร็จ! Status:', createOrderResponse.status);
      console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(createOrderResponse.data, null, 2));
      
      if (createOrderResponse.data.code === 1) {
        console.log('✅ สามารถสร้างพัสดุได้: ' + createOrderResponse.data.data.pno);
      } else {
        console.log('❌ ไม่สามารถสร้างพัสดุได้:', createOrderResponse.data.message);
      }
    } catch (error: any) {
      console.error('❌ orders API ล้มเหลว:', error.message);
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 11. ทดสอบอีกเวอร์ชันของ orders API โดยไม่ใส่ข้อมูลไม่จำเป็น
    console.log('\n🧪 ทดสอบ orders API เวอร์ชันที่ 2 (ข้อมูลลดลง):');
    
    // ลองลบข้อมูลที่อาจไม่จำเป็นออก
    const minimalOrderParams = { ...createOrderParams };
    delete minimalOrderParams.remark; // ลบข้อมูลที่อาจเป็นสาเหตุ
    
    // สร้างลายเซ็นใหม่
    const minimalOrderSignature = generateWorkingSignature(minimalOrderParams, FLASH_EXPRESS_API_KEY as string);
    minimalOrderParams.sign = minimalOrderSignature;
    
    const minimalOrderPayload = new URLSearchParams(minimalOrderParams as Record<string, string>).toString();
    const minimalOrderHeaders = {
      ...headers,
      'X-Flash-Signature': minimalOrderSignature
    };
    
    try {
      const minimalOrderResponse = await axios.post(
        `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        minimalOrderPayload,
        { headers: minimalOrderHeaders, timeout: API_TIMEOUT }
      );
      
      console.log('✅ orders API (minimal) สำเร็จ! Status:', minimalOrderResponse.status);
      console.log('📦 ข้อมูลที่ได้รับ:', JSON.stringify(minimalOrderResponse.data, null, 2));
    } catch (error: any) {
      console.error('❌ orders API (minimal) ล้มเหลว:', error.message);
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 12. สรุปความแตกต่าง
    console.log('\n📊 สรุปความแตกต่างระหว่าง API:');
    
    console.log('👉 estimate_rate - จำนวนพารามิเตอร์:', Object.keys(estimateRateParams).length);
    console.log('👉 orders - จำนวนพารามิเตอร์:', Object.keys(createOrderParams).length);
    
    // เตรียมรายการฟิลด์ที่ต่างกัน
    const estimateRateFields = new Set(Object.keys(estimateRateParams));
    const createOrderFields = new Set(Object.keys(createOrderParams));
    
    // ฟิลด์ที่มีใน estimate_rate แต่ไม่มีใน orders
    const uniqueToEstimateRate = [...estimateRateFields].filter(field => !createOrderFields.has(field));
    console.log('👉 ฟิลด์ที่มีใน estimate_rate เท่านั้น:', uniqueToEstimateRate);
    
    // ฟิลด์ที่มีใน orders แต่ไม่มีใน estimate_rate
    const uniqueToCreateOrder = [...createOrderFields].filter(field => !estimateRateFields.has(field));
    console.log('👉 ฟิลด์ที่มีใน orders เท่านั้น:', uniqueToCreateOrder);
    
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการเปรียบเทียบ API:', error.message);
  }
}

// รันการเปรียบเทียบ
compareApis();