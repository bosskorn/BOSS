import axios from 'axios';
import crypto from 'crypto';

// กำหนดค่า timeout สำหรับการเชื่อมต่อ API
const API_TIMEOUT = 15000; // 15 วินาที

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// สร้างข้อมูลพื้นฐานสำหรับทดสอบ (แบบเดียวกับ server/flash-express-fixed-final.ts)
function createBaseParams() {
  const mchId = process.env.FLASH_EXPRESS_MERCHANT_ID;
  const nonceStr = generateNonceStr();
  const timestamp = String(Math.floor(Date.now() / 1000));
  
  return {
    mchId,
    nonceStr,
    timestamp,
    warehouseNo: `${mchId}_001`,
  };
}

// สร้างลายเซ็น Flash Express (ทดลองวิธีใหม่ตามแบบ Server)
function generateFlashSignature(params, apiKey) {
  console.log('⚙️ เริ่มคำนวณลายเซ็น...');
  
  // 1. สร้างสำเนาข้อมูล - ใช้ JSON.parse/stringify เพื่อตัดขาดการอ้างอิง
  const paramsClone = JSON.parse(JSON.stringify(params));
  
  // 2. ลบฟิลด์ที่ไม่ควรใช้ในการคำนวณลายเซ็น
  const excludeFields = ['sign', 'subItemTypes', 'merchantId', 'subParcel', 'subParcelQuantity', 'remark'];
  for (const field of excludeFields) {
    delete paramsClone[field];
  }
  
  console.log('⚙️ ข้อมูลหลังจากลบฟิลด์ที่ไม่ใช้ในการคำนวณลายเซ็น:', JSON.stringify(paramsClone, null, 2));
  
  // 3. สร้าง string params และแปลงทุกค่าเป็น string
  const stringParams = {};
  for (const key of Object.keys(paramsClone)) {
    // ข้ามค่าที่เป็น null, undefined หรือช่องว่าง
    if (paramsClone[key] === null || paramsClone[key] === undefined || paramsClone[key] === '') {
      console.log(`⚠️ ข้ามพารามิเตอร์ "${key}" เนื่องจากค่าเป็น null, undefined หรือค่าว่าง`);
      continue;
    }
    
    stringParams[key] = String(paramsClone[key]);
  }
  
  // 4. จัดเรียงคีย์ตามลำดับตัวอักษร ASCII
  const sortedKeys = Object.keys(stringParams).sort();
  console.log('📝 คีย์ที่เรียงลำดับแล้ว:', sortedKeys);
  
  // 5. สร้างสตริงสำหรับลายเซ็น
  let stringToSign = '';
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    stringToSign += `${key}=${stringParams[key]}`;
    if (i < sortedKeys.length - 1) {
      stringToSign += '&';
    }
  }
  
  // 6. เพิ่ม API key ที่ท้ายสตริง
  const signString = `${stringToSign}&key=${apiKey}`;
  console.log('🔑 สตริงสำหรับลายเซ็น:', signString);
  
  // 7. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
  const signature = crypto.createHash('sha256')
    .update(signString)
    .digest('hex')
    .toUpperCase();
  
  console.log('✅ ลายเซ็นที่คำนวณได้:', signature);
  return signature;
}

// ทดสอบการสร้างเลขพัสดุใหม่
async function testCreateShipping() {
  try {
    console.log('=== ทดสอบการสร้างเลขพัสดุ Flash Express ===');
    
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    const mchId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    
    if (!apiKey || !mchId) {
      console.error('Error: FLASH_EXPRESS_API_KEY or FLASH_EXPRESS_MERCHANT_ID not set');
      return;
    }
    
    // 1. สร้างข้อมูลพื้นฐาน (แบบเดียวกับที่ทำงานได้ในระบบของเรา)
    const baseParams = createBaseParams();
    const outTradeNo = `TEST${Date.now()}`; // เลขที่คำสั่งซื้อที่ไม่ซ้ำกัน
    
    // 2. สร้างข้อมูลที่ไม่รวม remark
    const cleanParams = {
      ...baseParams,
      outTradeNo,
      
      // ข้อมูลผู้ส่ง
      srcName: "กรธนภัทร นาคคงคำ", 
      srcPhone: "0829327325",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "ลาดพร้าว",
      srcDistrictName: "จรเข้บัว",
      srcPostalCode: "10230",
      srcDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      
      // ข้อมูลผู้รับ
      dstName: "ธัญลักษณ์ ภาคภูมิ",
      dstPhone: "0869972410",
      dstProvinceName: "พระนครศรีอยุธยา",
      dstCityName: "บางปะอิน",
      dstDistrictName: "เชียงรากน้อย",
      dstPostalCode: "13160",
      dstDetailAddress: "138/348 ม.7 ซ.20 ต.เชียงรากน้อย อ.บางปะอิน",
      
      // ข้อมูลพัสดุ (ห้ามขาด)
      weight: "1000", // น้ำหนัก 1 กก. ในหน่วยกรัม
      width: "10",
      length: "10",
      height: "10",
      parcelKind: "1", // ประเภทพัสดุ (1=ทั่วไป)
      expressCategory: "1", // ประเภทการจัดส่ง (1=ปกติ)
      articleCategory: "2", // ประเภทสินค้า (2=อื่นๆ)
      insured: "0", // ประกันพัสดุ (0=ไม่มี)
      codEnabled: "0", // COD (0=ไม่มี)
      // เพิ่มพารามิเตอร์ที่ Flash Express ต้องการ
      productType: "1", // ประเภทสินค้า (1=ทั่วไป)
      transportType: "1", // ประเภทการขนส่ง (1=ปกติ)
      payType: "1", // วิธีการชำระเงิน (1=ผู้ส่งจ่าย)
      expressTypeId: "1" // ประเภทการจัดส่ง (1=ส่งด่วน)
    };
    
    // 3. สร้างลายเซ็นจากข้อมูลสะอาด (ไม่มี remark)
    const signature = generateFlashSignature(cleanParams, apiKey);
    
    // 4. สร้างข้อมูลที่ส่งจริง: เพิ่ม sign และ remark
    const requestData = { ...cleanParams };
    requestData.sign = signature;
    requestData.remark = "ทดสอบการส่งพัสดุ";  // เพิ่ม remark หลังจากคำนวณลายเซ็นแล้ว
    
    // 5. เพิ่ม subItemTypes หลังจากคำนวณลายเซ็นแล้ว (จำเป็นต้องมี)
    requestData.subItemTypes = JSON.stringify([
      {
        itemName: "สินค้าทดสอบ",
        itemQuantity: "1"
      }
    ]);
    
    // 6. สร้าง form data โดยแปลงทุกค่าเป็น string
    const formData = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    // 7. สร้าง headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': baseParams.timestamp,
      'X-Flash-Nonce': baseParams.nonceStr
    };
    
    console.log('Request URL:', 'https://open-api.flashexpress.com/open/v3/orders');
    console.log('Request headers:', headers);
    console.log('Request form data:', formData.toString());
    
    // 7. ส่ง request
    const response = await axios.post(
      'https://open-api.flashexpress.com/open/v3/orders',
      formData,
      { headers, timeout: 15000 } // เพิ่ม timeout เป็น 15 วินาที
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 1) {
      console.log('🎉 สร้างเลขพัสดุสำเร็จ!');
      console.log('📦 เลขพัสดุ:', response.data.data.pno);
      console.log('🏷️ Sort Code:', response.data.data.sortCode);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// รันการทดสอบการสร้างเลขพัสดุ
testCreateShipping();