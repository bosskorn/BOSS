/**
 * สคริปต์ทดสอบการเชื่อมต่อ Flash Express API ฉบับสมบูรณ์
 * ทดสอบการทำงานของ API ทั้งหมดในไฟล์ flash-express-improved.ts
 */
import { 
  getFlashExpressShippingOptions, 
  createFlashExpressShipping, 
  getFlashExpressTrackingStatus 
} from './services/flash-express-improved';

// ========== ทดสอบการดึงตัวเลือกการจัดส่ง ==========
async function testGetShippingOptions() {
  console.log('\n===== ทดสอบการดึงตัวเลือกการจัดส่ง =====');
  
  try {
    const options = await getFlashExpressShippingOptions(
      {
        province: 'กรุงเทพมหานคร',
        district: 'คลองเตย',
        subdistrict: 'คลองเตย',
        zipcode: '10110'
      },
      {
        province: 'กรุงเทพมหานคร',
        district: 'จตุจักร',
        subdistrict: 'จตุจักร',
        zipcode: '10900'
      },
      {
        weight: 1, // 1 กิโลกรัม
        width: 10,
        length: 10,
        height: 10
      }
    );
    
    console.log('ตัวเลือกการจัดส่ง:', JSON.stringify(options, null, 2));
    return options;
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการดึงตัวเลือกการจัดส่ง:', error.message);
    return null;
  }
}

// ========== ทดสอบการสร้างการจัดส่ง ==========
async function testCreateShipping() {
  console.log('\n===== ทดสอบการสร้างการจัดส่ง =====');
  
  // สร้างเลขออเดอร์ที่ไม่ซ้ำกันโดยใช้เวลาปัจจุบัน
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
    
    // ส่งค่าเลขพัสดุกลับถ้าสำเร็จ
    if (result.success && result.trackingNumber) {
      return result.trackingNumber;
    }
    
    return null;
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการสร้างการจัดส่ง:', error.message);
    return null;
  }
}

// ========== ทดสอบการตรวจสอบสถานะการจัดส่ง ==========
async function testTrackingStatus(trackingNumber: string) {
  console.log('\n===== ทดสอบการตรวจสอบสถานะการจัดส่ง =====');
  console.log('เลขพัสดุที่ใช้ทดสอบ:', trackingNumber);
  
  try {
    const result = await getFlashExpressTrackingStatus(trackingNumber);
    
    console.log('ผลลัพธ์การตรวจสอบสถานะ:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการจัดส่ง:', error.message);
    return null;
  }
}

// ========== ทดสอบ API ทั้งหมดตามลำดับ ==========
async function runAllTests() {
  console.log('====================================================');
  console.log('     การทดสอบ Flash Express API ฉบับสมบูรณ์');
  console.log('====================================================');
  
  try {
    // 1. ทดสอบการดึงตัวเลือกการจัดส่ง
    await testGetShippingOptions();
    
    // 2. ทดสอบการสร้างการจัดส่ง
    const trackingNumber = await testCreateShipping();
    
    // 3. ทดสอบการตรวจสอบสถานะการจัดส่ง (ถ้าสร้างการจัดส่งสำเร็จ)
    if (trackingNumber) {
      await testTrackingStatus(trackingNumber);
    } else {
      console.log('\nข้ามการทดสอบตรวจสอบสถานะการจัดส่งเนื่องจากไม่มีเลขพัสดุ');
    }
    
    console.log('\n====================================================');
    console.log('               การทดสอบเสร็จสิ้น');
    console.log('====================================================');
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error.message);
  }
}

// รันการทดสอบทั้งหมด
runAllTests();
