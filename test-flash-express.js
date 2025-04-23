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
    
    // สร้างข้อมูลพื้นฐาน
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    const outTradeNo = `TEST${Date.now()}`; // เลขที่คำสั่งซื้อที่ไม่ซ้ำกัน
    
    // 1. สร้างข้อมูลเริ่มต้นสำหรับคำนวณลายเซ็น
    const requestData = {
      // ข้อมูลพื้นฐาน
      mchId: mchId,
      nonceStr: nonceStr,
      timestamp: timestamp,
      warehouseNo: `${mchId}_001`, // รูปแบบมาตรฐานของ Flash Express
      outTradeNo: outTradeNo,
      
      // ข้อมูลผู้ส่ง (ค่าตั้งต้นจากคนสร้างระบบ)
      srcName: "กรธนภัทร นาคคงคำ", 
      srcPhone: "0829327325",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "ลาดพร้าว",
      srcDistrictName: "จรเข้บัว",
      srcPostalCode: "10230",
      srcDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      
      // ข้อมูลผู้รับ (ข้อมูลที่ได้รับจากคุณ)
      dstName: "ธัญลักษณ์ ภาคภูมิ",
      dstPhone: "0869972410",
      dstProvinceName: "พระนครศรีอยุธยา",
      dstCityName: "บางปะอิน",
      dstDistrictName: "เชียงรากน้อย",
      dstPostalCode: "13160",
      dstDetailAddress: "138/348 ม.7 ซ.20 ต.เชียงรากน้อย อ.บางปะอิน",
      
      // ข้อมูลพัสดุ
      weight: "1000", // น้ำหนัก 1 กก. ในหน่วยกรัม
      width: "10",
      length: "10",
      height: "10",
      parcelKind: "1", // ประเภทพัสดุ (1=ทั่วไป)
      expressCategory: "1", // ประเภทการจัดส่ง (1=ปกติ)
      articleCategory: "2", // ประเภทสินค้า (2=อื่นๆ)
      insured: "0", // ประกันพัสดุ (0=ไม่มี)
      codEnabled: "0", // COD (0=ไม่มี)
      
      // ข้อมูลเพิ่มเติมที่ต้องการไว้แต่ไม่รวมในการคำนวณลายเซ็น
      remark: "ทดสอบการส่งพัสดุ"
    };
    
    // 2. สร้างลายเซ็น (ต้องกรองฟิลด์ที่ไม่ใช้ในการคำนวณลายเซ็นออกก่อน)
    const signature = generateFlashSignature(requestData, apiKey);
    
    // 3. เพิ่มลายเซ็นเข้าไปในข้อมูล
    requestData.sign = signature;
    
    // 4. เพิ่ม subItemTypes หลังจากคำนวณลายเซ็นแล้ว (จำเป็นต้องมี)
    requestData.subItemTypes = JSON.stringify([
      {
        itemName: "สินค้าทดสอบ",
        itemQuantity: "1"
      }
    ]);
    
    // 5. สร้าง form data โดยแปลงทุกค่าเป็น string
    const formData = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    // 6. สร้าง headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': timestamp,
      'X-Flash-Nonce': nonceStr
    };
    
    console.log('Request URL:', 'https://open-api-tra.flashexpress.com/open/v3/orders');
    console.log('Request headers:', headers);
    console.log('Request form data:', formData.toString());
    
    // 7. ส่ง request
    const response = await axios.post(
      'https://open-api-tra.flashexpress.com/open/v3/orders',
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