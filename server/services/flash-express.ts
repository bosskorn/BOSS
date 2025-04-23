
/**
 * บริการเชื่อมต่อกับ Flash Express API
 */
import axios from 'axios';
import { createHmac } from 'crypto';

// ตรวจสอบว่ามีการกำหนดค่าสำหรับ API หรือไม่
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const API_KEY = process.env.FLASH_EXPRESS_API_KEY;
const BASE_URL = 'https://open-api.flashexpress.com/open'; // URL สำหรับ Production

if (!MERCHANT_ID || !API_KEY) {
  console.warn('Missing Flash Express API credentials!');
}

// ฟังก์ชันสร้างลายเซ็นสำหรับส่งข้อมูลให้ Flash Express API
/**
 * สร้างลายเซ็นสำหรับส่งข้อมูลให้ Flash Express API
 * @param data ข้อมูลที่จะใช้ในการสร้างลายเซ็น
 * @param timestamp เวลาที่ใช้ในการสร้างลายเซ็น (ไม่ได้ใช้ในกรณีของ Flash Express)
 * @returns ลายเซ็นที่สร้างขึ้น
 */
function createSignature(data: any, timestamp: number): string {
  try {
    // ลบฟิลด์ sign ออก (ถ้ามี) เพราะไม่ควรรวมในการคำนวณลายเซ็น
    const dataForSigning = { ...data };
    delete dataForSigning.sign;
    
    // จัดเรียง key ตามลำดับอักษร
    const keys = Object.keys(dataForSigning).sort();
    
    // สร้าง string สำหรับการคำนวณลายเซ็น
    let signStr = '';
    keys.forEach(key => {
      // ถ้าค่าไม่ใช่ undefined, null หรือว่างเปล่า ให้เพิ่มเข้าไปในสตริง
      if (dataForSigning[key] !== undefined && dataForSigning[key] !== null && dataForSigning[key] !== '') {
        // ถ้าเป็น array หรือ object ให้แปลงเป็น JSON string
        if (Array.isArray(dataForSigning[key]) || typeof dataForSigning[key] === 'object') {
          signStr += `${key}=${JSON.stringify(dataForSigning[key])}&`;
        } else {
          signStr += `${key}=${dataForSigning[key]}&`;
        }
      }
    });
    
    // ตัด & ตัวสุดท้ายออก
    if (signStr.endsWith('&')) {
      signStr = signStr.slice(0, -1);
    }
    
    // เพิ่ม API_KEY ต่อท้าย (ตามเอกสาร Flash Express)
    signStr += API_KEY;
    
    console.log('Raw signature string:', signStr);
    
    // ใช้ SHA-256 สร้างลายเซ็น
    const signature = createHmac('sha256', API_KEY || '')
      .update(signStr)
      .digest('hex')
      .toUpperCase(); // ตัวพิมพ์ใหญ่ทั้งหมดตามที่ Flash Express ต้องการ
    
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    // ในกรณีที่เกิดข้อผิดพลาด ส่งค่าลายเซ็นที่สร้างจากข้อมูลว่างเปล่า
    return createHmac('sha256', API_KEY || '')
      .update(`${API_KEY}`)
      .digest('hex')
      .toUpperCase();
  }
}

// คำสั่งตรวจสอบลายเซ็นตัวอย่าง
export function testSignatureWithExampleData() {
  const sampleData = { test: 'data' };
  const timestamp = Date.now();
  const signature = createSignature(sampleData, timestamp);
  
  return {
    data: sampleData,
    timestamp,
    signature,
    merchantId: MERCHANT_ID ? 'configured' : 'missing',
    apiKey: API_KEY ? 'configured (first 4 chars): ' + API_KEY.substring(0, 4) + '***' : 'missing'
  };
}

// ฟังก์ชันสร้างออเดอร์ Flash Express
export async function createFlashOrder(orderData: any): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }
    
    // สร้างข้อมูลตามรูปแบบที่ Flash Express API ต้องการ ตรงตามเอกสาร
    const formattedOrderData: Record<string, any> = {
      // ข้อมูลการยืนยันตัวตน (ต้องมี)
      mchId: MERCHANT_ID,                                             // รหัสลูกค้า Flash Express - string(32) - Required
      nonceStr: Date.now().toString(),                                // random nonce string - string(32) - Required
      
      // รหัสเรเฟอเรนซ์จากร้านค้า (ต้องมี)
      outTradeNo: orderData.outTradeNo || `SS${Date.now()}`,         // เลขออเดอร์ - string(64) - Required
      
      // ประเภทการจัดส่ง (ต้องมี)
      expressCategory: orderData.expressCategory,                     // ประเภทการจัดส่ง - integer - Required
      
      // ข้อมูลประเภทพัสดุ (ต้องมี)
      articleCategory: orderData.articleCategory,                     // ประเภทพัสดุ - integer - Required
      
      // ข้อมูลน้ำหนักและขนาดพัสดุ
      weight: orderData.weight,                                       // น้ำหนักเป็นกรัม (g) - integer - Required
      
      // ข้อมูลคลังสินค้า
      warehouseNo: orderData.warehouseNo || `${MERCHANT_ID}_001`,     // รหัสคลัง - string(32) - Optional
      
      // ข้อมูลผู้ส่งพัสดุ (ต้องมีทั้งหมด)
      srcName: orderData.srcName,                                     // ชื่อผู้ส่ง - string(50) - Required
      srcPhone: orderData.srcPhone,                                   // เบอร์โทรผู้ส่ง - string(20) - Required
      srcProvinceName: orderData.srcProvinceName,                     // จังหวัดของผู้ส่ง - string(150) - Required
      srcCityName: orderData.srcCityName,                             // อำเภอของผู้ส่ง - string(150) - Required
      srcDistrictName: orderData.srcDistrictName || "",               // ตำบลของผู้ส่ง - string(150) - Optional
      srcPostalCode: orderData.srcPostalCode,                         // รหัสไปรษณีย์ของผู้ส่ง - string(20) - Required
      srcDetailAddress: orderData.srcDetailAddress,                   // ที่อยู่โดยละเอียดของผู้ส่ง - string(300) - Required
      
      // ข้อมูลผู้รับพัสดุ (ต้องมีทั้งหมด)
      dstName: orderData.dstName,                                     // ชื่อผู้รับ - string(50) - Required
      dstPhone: orderData.dstPhone,                                   // เบอร์โทรผู้รับ - string(20) - Required
      dstHomePhone: orderData.dstHomePhone || orderData.dstPhone,     // เบอร์โทรศัพท์บ้านผู้รับ - string(20) - Optional
      dstProvinceName: orderData.dstProvinceName,                     // จังหวัดของผู้รับ - string(150) - Required
      dstCityName: orderData.dstCityName,                             // อำเภอของผู้รับ - string(150) - Required
      dstDistrictName: orderData.dstDistrictName || "",               // ตำบลของผู้รับ - string(150) - Optional
      dstPostalCode: orderData.dstPostalCode,                         // รหัสไปรษณีย์ของผู้รับ - string(20) - Required
      dstDetailAddress: orderData.dstDetailAddress,                   // ที่อยู่โดยละเอียดของผู้รับ - string(300) - Required
      
      // ข้อมูลการส่งคืนพัสดุ (ไม่จำเป็นตามเอกสาร แต่เราใส่ค่าเริ่มต้นไว้)
      returnName: orderData.returnName || orderData.srcName,                          // ชื่อผู้รับคืน - string(50) - Optional
      returnPhone: orderData.returnPhone || orderData.srcPhone,                       // เบอร์โทรผู้รับคืน - string(20) - Optional
      returnProvinceName: orderData.returnProvinceName || orderData.srcProvinceName,  // จังหวัดของผู้รับคืน - string(150) - Optional
      returnCityName: orderData.returnCityName || orderData.srcCityName,              // อำเภอของผู้รับคืน - string(150) - Optional
      returnDistrictName: orderData.returnDistrictName || orderData.srcDistrictName || "", // ตำบลของผู้รับคืน - string(150) - Optional
      returnPostalCode: orderData.returnPostalCode || orderData.srcPostalCode,        // รหัสไปรษณีย์ของผู้รับคืน - string(20) - Optional
      returnDetailAddress: orderData.returnDetailAddress || orderData.srcDetailAddress, // ที่อยู่โดยละเอียดของผู้รับคืน - string(300) - Optional
    };
    
    // เพิ่มฟิลด์เพิ่มเติมถ้ามี
    if (orderData.width) formattedOrderData.width = orderData.width;         // ความกว้าง - integer - Optional
    if (orderData.length) formattedOrderData.length = orderData.length;      // ความยาว - integer - Optional
    if (orderData.height) formattedOrderData.height = orderData.height;      // ความสูง - integer - Optional
    
    // ข้อมูลการประกันพัสดุ
    if (orderData.insured !== undefined) formattedOrderData.insured = orderData.insured; // การประกัน - integer - Optional
    if (orderData.insureDeclareValue !== undefined) formattedOrderData.insureDeclareValue = orderData.insureDeclareValue; // มูลค่าประกัน - integer - Optional
    if (orderData.opdInsureEnabled !== undefined) formattedOrderData.opdInsureEnabled = orderData.opdInsureEnabled; // การประกัน OPD - integer - Optional
    
    // ข้อมูลการเก็บเงินปลายทาง
    if (orderData.codEnabled !== undefined) formattedOrderData.codEnabled = orderData.codEnabled; // เก็บเงินปลายทาง - integer - Optional
    if (orderData.codAmount !== undefined) formattedOrderData.codAmount = orderData.codAmount; // จำนวนเงินเก็บปลายทาง - integer - Optional
    
    // ข้อมูลรายการสินค้าย่อย
    if (Array.isArray(orderData.subItemTypes) && orderData.subItemTypes.length > 0) {
      formattedOrderData.subItemTypes = orderData.subItemTypes; // รายการสินค้า - JSON string - Optional
    }
    
    // ข้อมูลพัสดุย่อย (ถ้ามี)
    if (Array.isArray(orderData.subParcel) && orderData.subParcel.length > 0) {
      formattedOrderData.subParcelQuantity = orderData.subParcel.length; // จำนวนพัสดุย่อย - integer - Optional
      formattedOrderData.subParcel = orderData.subParcel; // ข้อมูลพัสดุย่อย - JSON string - Optional
    }
    
    // ข้อมูลเพิ่มเติม
    if (orderData.remark) formattedOrderData.remark = orderData.remark; // หมายเหตุ - string - Optional
    if (orderData.payType !== undefined) formattedOrderData.payType = orderData.payType; // ประเภทการชำระ - integer - Optional
    if (orderData.itemCategory !== undefined) formattedOrderData.itemCategory = orderData.itemCategory; // ประเภทสินค้า - integer - Optional
    if (orderData.settlementType !== undefined) formattedOrderData.settlementType = orderData.settlementType; // วิธีชำระค่าขนส่ง - integer - Optional
    
    // สร้างลายเซ็นดิจิทัลสำหรับตรวจสอบความถูกต้อง
    const requestTimestamp = Date.now();
    const signature = createSignature(formattedOrderData, requestTimestamp);
    
    // เพิ่มลายเซ็นเข้าไปในข้อมูลที่จะส่ง (Required)
    const dataWithSign = {
      ...formattedOrderData,
      sign: signature
    };

    console.log('Sending order data to Flash Express API:', JSON.stringify(dataWithSign, null, 2));

    // สร้าง config สำหรับ axios
    const basicConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000,
      maxContentLength: Infinity
    };

    console.log(`Sending request to Flash Express API: ${BASE_URL}/v3/orders`);
    
    // ส่งข้อมูลไปยัง Flash Express API
    try {
      const response = await axios.post(`${BASE_URL}/v3/orders`, dataWithSign, basicConfig);
      console.log('Flash Express API response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('Error creating Flash Express order:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      console.error('Error config:', JSON.stringify(error.config, null, 2));
      throw error;
    }
  } catch (error: any) {
    console.error('Unexpected error in createFlashOrder function:', error.message);
    throw error;
  }
}

// ฟังก์ชันติดตามสถานะพัสดุ Flash Express
export async function trackFlashOrder(trackingNumber: string): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }

    const data = { trackingNumber };
    const timestamp = Date.now();
    const signature = createSignature(data, timestamp);

    const response = await axios.get(`${BASE_URL}/v3/tracking`, {
      params: data,
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': MERCHANT_ID,
        'X-Flash-Timestamp': timestamp.toString(),
        'X-Flash-Signature': signature
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error tracking Flash Express order:', error?.response?.data || error.message);
    throw error;
  }
}

// ฟังก์ชันค้นหาพัสดุด้วยหมายเลขอ้างอิงของร้านค้า
export async function findByMerchantTracking(merchantTrackingNumber: string): Promise<any> {
  try {
    if (!MERCHANT_ID || !API_KEY) {
      throw new Error('Flash Express API credentials are missing');
    }

    const data = { merchantTrackingNumber };
    const timestamp = Date.now();
    const signature = createSignature(data, timestamp);

    const response = await axios.get(`${BASE_URL}/v3/orders/find-by-merchant-tracking/${merchantTrackingNumber}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Flash-Merchant-Id': MERCHANT_ID,
        'X-Flash-Timestamp': timestamp.toString(),
        'X-Flash-Signature': signature
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Error finding Flash Express order by merchant tracking:', error?.response?.data || error.message);
    throw error;
  }
}
