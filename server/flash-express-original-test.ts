/**
 * สคริปต์ทดสอบการเชื่อมต่อ Flash Express API โดยใช้โค้ดเดิมที่ทำงานได้
 */
import { createFlashExpressShipping } from './services/flash-express';

/**
 * ทดสอบสร้างการจัดส่ง
 */
async function testCreateShipping() {
  // สร้างเลขออเดอร์ด้วยเวลาปัจจุบัน (ไม่ซ้ำกัน)
  const orderNumber = `PD${Date.now()}`;
  console.log('เลขออเดอร์ที่ใช้ทดสอบ:', orderNumber);
  
  try {
    const result = await createFlashExpressShipping({
      outTradeNo: orderNumber,
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
      weight: 1000,  // 1 กิโลกรัม = 1000 กรัม
      width: 10,
      length: 10,
      height: 10,
      insured: 0,  // ไม่ซื้อประกัน
      codEnabled: 0,  // ไม่ใช้ Cash on Delivery
      subItemTypes: [
        { 
          itemName: "สินค้าทดสอบ", 
          itemQuantity: 1 
        }
      ]
    });
    
    console.log('ผลลัพธ์การสร้างการจัดส่ง:', JSON.stringify(result, null, 2));
    
    if (result.success && result.trackingNumber) {
      console.log('การสร้างการจัดส่งสำเร็จ! เลขติดตามพัสดุ:', result.trackingNumber);
    } else {
      console.log('การสร้างการจัดส่งล้มเหลว:', result.error);
    }
    
    return result;
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการสร้างการจัดส่ง:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// รันการทดสอบ
console.log('====================================================');
console.log('     การทดสอบการสร้างการจัดส่งด้วยโค้ดเดิมที่ทำงานได้');
console.log('====================================================');

testCreateShipping()
  .then(() => {
    console.log('\n====================================================');
    console.log('                  การทดสอบเสร็จสิ้น');
    console.log('====================================================');
  })
  .catch(error => {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error);
  });