/**
 * ไฟล์ทดสอบการเชื่อมต่อกับ Flash Express API โดยเฉพาะ
 * ใช้ข้อมูลตัวอย่างที่ผู้ใช้ให้มา
 */

import { createFlashExpressShipping } from './services/flash-express-final';

// ข้อมูลตัวอย่างจากผู้ใช้:
// "คุณ เกศมณี และ คุณ นิพนธ์(0909805835) 443 ถ.สุคนธสวัสดิ์ ซ.สุคนธสวัสดิ์ 27 แขวง ลาดพร้าว ลาดพร้าว ลาดพร้าว กรุงเทพ 10230"

async function testWithUserInputData() {
  console.log('=== ทดสอบการเชื่อมต่อกับ Flash Express API ด้วยข้อมูลที่ผู้ใช้ให้มา ===');
  
  // สร้างเลขคำสั่งซื้อแบบสุ่ม
  const randomOrderNumber = `SS${Date.now()}`;
  
  // ข้อมูลผู้ส่ง (ใช้ข้อมูลจากโปรไฟล์ผู้ใช้)
  const senderDetails = {
    name: 'กรธนภัทร นาคคงคำ',
    phone: '0829327325',
    province: 'กรุงเทพมหานคร', 
    district: 'ลาดพร้าว',
    subdistrict: 'จรเข้บัว',
    zipcode: '10230',
    address: '26 ลาดปลาเค้า 24 แยก 8'
  };
  
  // ข้อมูลผู้รับ (จากข้อมูลที่ผู้ใช้ให้มา)
  const recipientDetails = {
    name: 'คุณ เกศมณี',
    phone: '0909805835',
    province: 'กรุงเทพมหานคร', 
    district: 'ลาดพร้าว',
    subdistrict: 'ลาดพร้าว',
    zipcode: '10230',
    address: '443 ถ.สุคนธสวัสดิ์ ซ.สุคนธสวัสดิ์ 27'
  };
  
  // ข้อมูลพัสดุ
  const packageDetails = {
    weight: 1000, // 1 กิโลกรัม (หน่วย: กรัม)
    width: 20,    // หน่วย: เซนติเมตร
    height: 15,   // หน่วย: เซนติเมตร 
    length: 25,   // หน่วย: เซนติเมตร
    cod: false,   // ไม่มีเก็บเงินปลายทาง
    description: 'สินค้าทดสอบ'
  };
  
  try {
    // เตรียมข้อมูลสำหรับส่งไปยัง Flash Express API
    const orderData = {
      outTradeNo: randomOrderNumber,
      
      // ข้อมูลผู้ส่ง
      srcName: senderDetails.name,
      srcPhone: senderDetails.phone,
      srcProvinceName: senderDetails.province,
      srcCityName: senderDetails.district,
      srcDistrictName: senderDetails.subdistrict,
      srcPostalCode: senderDetails.zipcode,
      srcDetailAddress: senderDetails.address,
      
      // ข้อมูลผู้รับ
      dstName: recipientDetails.name,
      dstPhone: recipientDetails.phone,
      dstProvinceName: recipientDetails.province,
      dstCityName: recipientDetails.district,
      dstDistrictName: recipientDetails.subdistrict,
      dstPostalCode: recipientDetails.zipcode,
      dstDetailAddress: recipientDetails.address,
      
      // ข้อมูลพัสดุ
      articleCategory: 1,
      expressCategory: 1,
      parcelKind: 1, // เพิ่ม parcelKind ตามเอกสาร Flash Express
      weight: packageDetails.weight,
      width: packageDetails.width,
      height: packageDetails.height,
      length: packageDetails.length,
      insured: 0,
      codEnabled: packageDetails.cod ? 1 : 0,
      
      // ข้อมูลอ้างอิงสินค้า
      subItemTypes: [
        {
          itemName: packageDetails.description || 'สินค้าทดสอบ',
          itemWeightSize: `${packageDetails.weight/1000}Kg`,
          itemColor: '-',
          itemQuantity: 1
        }
      ]
    };
    
    console.log('ข้อมูลที่จะส่งไปยัง Flash Express API:', JSON.stringify(orderData, null, 2));
    
    // เรียกใช้บริการสร้างการจัดส่ง
    const result = await createFlashExpressShipping(orderData);
    
    // แสดงผลการเรียกใช้บริการ
    if (result.success) {
      console.log('✅ สร้างการจัดส่งสำเร็จ!');
      console.log('🔢 เลขพัสดุ:', result.trackingNumber);
      console.log('🏷️ รหัส Sort Code:', result.sortCode);
    } else {
      console.error('❌ เกิดข้อผิดพลาดในการสร้างการจัดส่ง:', result.error);
    }
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error);
  }
}

// เรียกฟังก์ชันทดสอบ
testWithUserInputData()
  .then(() => console.log('=== การทดสอบเสร็จสิ้น ==='))
  .catch(err => console.error('=== เกิดข้อผิดพลาดในการทดสอบ ===', err));