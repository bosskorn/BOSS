import { createFlashExpressShipping } from './services/flash-express';

async function testFlashExpressAPI() {
  try {
    console.log('เริ่มทดสอบการสร้างเลขพัสดุจาก Flash Express API...');
    
    // ข้อมูลการทดสอบ
    const testData = {
      outTradeNo: `PD${Date.now()}`,
      srcName: 'บริษัท เพอร์เพิลแดช จำกัด',
      srcPhone: '0812345678',
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: 'คลองเตย',
      srcDistrictName: 'คลองเตย',
      srcPostalCode: '10110',
      srcDetailAddress: '123 ถนนสุขุมวิท',
      dstName: 'คุณทดสอบ ระบบ',
      dstPhone: '0898765432',
      dstProvinceName: 'กรุงเทพมหานคร',
      dstCityName: 'จตุจักร',
      dstDistrictName: 'จตุจักร',
      dstPostalCode: '10900',
      dstDetailAddress: '456 ถนนพหลโยธิน',
      articleCategory: 1,  // 1: เสื้อผ้า
      expressCategory: 1,  // 1: ปกติ
      weight: 1500,  // 1.5 กิโลกรัม = 1500 กรัม
      width: 20,
      length: 30,
      height: 10,
      insured: 0,  // ไม่ซื้อประกัน
      codEnabled: 0,  // ไม่ใช้ Cash on Delivery
      // codAmount: 50000,  // ไม่ต้องระบุยอด COD เมื่อไม่ใช้ COD
      subItemTypes: [
        { 
          itemName: "สินค้าทดสอบ", 
          itemWeightSize: "กลาง",
          itemColor: "ขาว",  // เพิ่มสีของสินค้าตามที่ API ต้องการ
          itemQuantity: 1 
        }
      ]
    };
    
    console.log('ข้อมูลที่ส่งไป Flash Express API:', JSON.stringify(testData, null, 2));
    
    // เรียกใช้ API
    const response = await createFlashExpressShipping(testData);
    
    console.log('ผลลัพธ์จาก Flash Express API:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ Flash Express API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// รันฟังก์ชันทดสอบ
testFlashExpressAPI().then(result => {
  console.log('การทดสอบสิ้นสุดลงแล้ว');
  if (result.success) {
    console.log(`เลขพัสดุที่ได้รับ: ${result.trackingNumber}`);
    console.log(`รหัสจัดเรียง: ${result.sortCode}`);
  } else {
    console.log(`การทดสอบล้มเหลว: ${result.error}`);
  }
});