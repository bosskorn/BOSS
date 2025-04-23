import axios from 'axios';
import crypto from 'crypto';

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// สร้างลายเซ็น Flash Express (ปรับปรุงตามวิธีการของไฟล์ final)
function generateFlashSignature(params, apiKey) {
  console.log('⚙️ เริ่มคำนวณลายเซ็น...');
  console.log('⚙️ ข้อมูลเริ่มต้น:', JSON.stringify(params, null, 2));
  
  // 1. แปลงทุกค่าเป็น string และกรองพารามิเตอร์
  const stringParams = {};
  for (const key in params) {
    // Flash Express API มีพารามิเตอร์ที่ต้องข้ามในการคำนวณลายเซ็น
    const skipParams = [
      'sign', 
      'subItemTypes', 
      'merchantId',  // ใช้ mchId แทน
      'subParcel',   // ไม่รวมในการคำนวณลายเซ็น
      'subParcelQuantity', // ไม่รวมในการคำนวณลายเซ็น
      'remark'       // ห้ามรวมในการคำนวณลายเซ็น (สำคัญมาก)
    ];
    
    if (skipParams.includes(key)) {
      console.log(`🚫 ข้ามพารามิเตอร์ "${key}" ในการคำนวณลายเซ็น`);
      continue;
    }
    
    // ข้ามค่าที่เป็น null, undefined หรือช่องว่าง
    if (params[key] === null || params[key] === undefined || params[key] === '') {
      console.log(`⚠️ ข้ามพารามิเตอร์ "${key}" เนื่องจากค่าเป็น null, undefined หรือค่าว่าง`);
      continue;
    }
    
    // แปลงทุกค่าเป็น string
    stringParams[key] = String(params[key]);
  }

  // 2. จัดเรียงคีย์ตามลำดับตัวอักษร ASCII
  const sortedKeys = Object.keys(stringParams).sort();
  console.log('📝 คีย์ที่เรียงลำดับแล้ว:', sortedKeys);

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
}

// ทดสอบดึงข้อมูลค่าจัดส่ง
async function testShippingRate() {
  try {
    console.log('=== ทดสอบดึงข้อมูลค่าจัดส่ง ===');
    
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    const mchId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    
    if (!apiKey || !mchId) {
      console.error('Error: FLASH_EXPRESS_API_KEY or FLASH_EXPRESS_MERCHANT_ID not set');
      return;
    }
    
    // สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    
    // สร้าง request data
    const requestParams = {
      // ข้อมูลพื้นฐาน
      mchId: mchId,
      nonceStr: nonceStr,
      timestamp: timestamp,
      warehouseNo: `${mchId}_001`, // รูปแบบมาตรฐานของ Flash Express
      
      // ข้อมูลต้นทาง
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: 'ลาดพร้าว',
      srcDistrictName: 'จรเข้บัว',
      srcPostalCode: '10230',
      
      // ข้อมูลปลายทาง
      dstProvinceName: 'กรุงเทพมหานคร',
      dstCityName: 'ปทุมวัน',
      dstDistrictName: 'ลุมพินี', 
      dstPostalCode: '10330',
      
      // ข้อมูลพัสดุ
      weight: '1000', // หน่วยกรัม
      height: '10',
      length: '10',
      width: '10',
      insured: '0' // จำเป็นต้องระบุเพื่อความสมบูรณ์ของการเรียก API
    };
    
    // คำนวณลายเซ็น
    const signature = generateFlashSignature(requestParams, apiKey);
    
    // เพิ่ม sign ในข้อมูลที่ส่ง (สำคัญ)
    const requestWithSign = { ...requestParams, sign: signature };
    
    // แปลงเป็น URL-encoded string
    const encodedPayload = new URLSearchParams(requestWithSign).toString();
    
    // สร้าง headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    console.log('Request headers:', headers);
    console.log('Request params:', requestWithSign);
    
    // ส่ง request
    const response = await axios.post(
      'https://open-api-tra.flashexpress.com/open/v1/orders/estimate_rate',
      encodedPayload,
      { headers }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// รันการทดสอบ
testShippingRate();