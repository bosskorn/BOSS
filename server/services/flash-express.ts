/**
 * บริการ Flash Express API
 * สำหรับดึงข้อมูลตัวเลือกการจัดส่ง, สร้างเลขพัสดุ, และติดตามสถานะพัสดุ
 */
import axios from 'axios';
import crypto from 'crypto';

// กำหนดค่าคงที่
// ใช้ URL จริงเท่านั้น ตามที่ผู้ใช้ระบุ
const BASE_URL = 'https://open-api.flashexpress.com';
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID;
const API_KEY = process.env.FLASH_EXPRESS_API_KEY;

/**
 * ตัวอย่างข้อมูลสำเร็จรูปจากเอกสาร Flash Express
 * ใช้สำหรับอ้างอิงในการทดสอบการสร้างลายเซ็น
 */
const EXAMPLE_DATA = {
  mchId: 'AAXXXX',
  nonceStr: '1526461166805',
  srcProvinceName: 'อุบลราชธานี',
  srcCityName: 'เมืองอุบลราชธานี',
  srcDistrictName: 'ในเมือง',
  srcPostalCode: '34000',
  dstProvinceName: 'เชียงใหม่',
  dstCityName: 'สันทราย',
  dstDistrictName: 'สันพระเนตร',
  dstPostalCode: '50210',
  weight: '1000', // ต้องเป็น string
  width: '40',
  length: '40',
  height: '40',
  expressCategory: '2',
  insureDeclareValue: '100',
  insured: '1',
  opdInsureEnabled: '1',
  pricingTable: '1'
};
// ลายเซ็นที่ถูกต้องของข้อมูลตัวอย่าง: 'CD03E4D230D0824E804D2AB013879E39A75238C1230214840C6A31C9DF169BF5'

// ตรวจสอบว่ามีการตั้งค่า API key หรือไม่
if (!MERCHANT_ID || !API_KEY) {
  console.error('Flash Express API: MERCHANT_ID หรือ API_KEY ไม่ถูกตั้งค่า');
}

/**
 * สร้าง nonceStr สำหรับ API request
 */
function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * สร้างลายเซ็นตามมาตรฐานของ Flash Express
 * 1. จัดเรียงพารามิเตอร์ตามลำดับตัวอักษร (ASCII)
 * 2. เชื่อมต่อเป็นสตริงในรูปแบบ key1=value1&key2=value2
 * 3. เพิ่ม API key ที่ท้ายสตริง: stringToSign + '&key=' + apiKey
 * 4. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
 */
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  // ตรวจสอบว่าคีย์มีอยู่จริง
  if (!apiKey) {
    throw new Error('API key ไม่ถูกระบุ');
  }

  // 1. คัดลอกข้อมูลแบบ deep copy เพื่อป้องกันการเปลี่ยนค่าในพารามิเตอร์ต้นฉบับ
  const paramsClone = JSON.parse(JSON.stringify(params));

  // 2. ลบฟิลด์ที่ไม่ควรรวมในการคำนวณลายเซ็น
  const excludeFields = ['sign', 'subItemTypes', 'merchantId', 'subParcel', 'subParcelQuantity', 'remark'];
  for (const field of excludeFields) {
    delete paramsClone[field];
  }

  // 3. แปลงทุกค่าเป็น string
  const stringParams: Record<string, string> = {};
  for (const key in paramsClone) {
    // ข้ามค่าที่เป็น null, undefined หรือช่องว่าง
    if (paramsClone[key] === null || paramsClone[key] === undefined || paramsClone[key] === '') {
      continue;
    }
    stringParams[key] = String(paramsClone[key]);
  }

  // 4. เรียงลำดับคีย์ตาม ASCII
  const sortedKeys = Object.keys(stringParams).sort();

  // 5. สร้างสตริงสำหรับการลงนาม
  let stringToSign = '';
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    stringToSign += `${key}=${stringParams[key]}`;

    // เพิ่ม '&' ระหว่างคีย์ (ยกเว้นคีย์สุดท้าย)
    if (i < sortedKeys.length - 1) {
      stringToSign += '&';
    }
  }

  // 6. เพิ่ม API key
  const signString = `${stringToSign}&key=${apiKey}`;

  // 7. คำนวณ SHA-256 hash
  const signature = crypto.createHash('sha256')
    .update(signString)
    .digest('hex')
    .toUpperCase();

  return signature;
}

/**
 * สร้างข้อมูลพื้นฐานสำหรับการส่งคำขอไปยัง Flash Express API
 */
function createBaseRequestParams() {
  const nonceStr = generateNonceStr();
  const timestamp = String(Math.floor(Date.now() / 1000));

  // ตรวจสอบว่ามี MERCHANT_ID หรือไม่
  if (!MERCHANT_ID) {
    console.error('FLASH_EXPRESS_MERCHANT_ID is not set in environment variables');
    throw new Error('FLASH_EXPRESS_MERCHANT_ID is required');
  }

  return {
    mchId: MERCHANT_ID,
    nonceStr,
    timestamp,
    warehouseNo: `${MERCHANT_ID}_001`,
  };
}

/**
 * ดึงตัวเลือกการจัดส่งและค่าบริการ
 */
export async function getShippingOptions(originAddress: any, destinationAddress: any, packageDetails: any) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();

    // 2. รวมข้อมูลทั้งหมด
    const requestParams = {
      ...baseParams,
      fromPostalCode: originAddress.postalCode || originAddress.zipcode,
      toPostalCode: destinationAddress.postalCode || destinationAddress.zipcode,
      // แปลงน้ำหนักเป็นกรัม (gram) หากมีหน่วยเป็น kg
      weight: packageDetails.weight < 100 ? packageDetails.weight * 1000 : packageDetails.weight,
    };

    // เพิ่มขนาดหากมี - แก้ไข TypeScript error ด้วยการกำหนดประเภทก่อน
    const paramsWithDimensions = requestParams as any;
    if (packageDetails.height) paramsWithDimensions.height = packageDetails.height;
    if (packageDetails.length) paramsWithDimensions.length = packageDetails.length;
    if (packageDetails.width) paramsWithDimensions.width = packageDetails.width;

    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, API_KEY!);

    // 4. สร้าง form data
    const formData = new URLSearchParams();

    // เพิ่มข้อมูลทั้งหมดลงใน form data
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }

    // เพิ่มลายเซ็นหลังจากได้คำนวณแล้ว
    formData.append('sign', signature);

    // 5. ส่งคำขอไปยัง Flash Express API
    console.log('Flash Express API Request:', {
      url: `${BASE_URL}/open/v1/orders/estimate_rate`, // แก้ไข endpoint ตามที่ถูกต้อง
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Flash-Signature': signature,
        'X-Flash-Timestamp': baseParams.timestamp,
        'X-Flash-Nonce': baseParams.nonceStr
      },
      data: formData.toString()
    });

    // ตั้งค่า config สำหรับ axios
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Flash-Signature': signature,
        'X-Flash-Timestamp': baseParams.timestamp,
        'X-Flash-Nonce': baseParams.nonceStr
      },
      timeout: 15000,
      maxRedirects: 0, // ป้องกันการ redirect
      validateStatus: (status) => status < 500 // ยอมรับสถานะ 400-499 เพื่อดูข้อความผิดพลาด
    };

    // ส่งคำขอไปยัง Flash Express API
    // เพิ่มการบันทึกข้อมูลทั้งหมดที่ส่งไปยัง API
    console.log('Flash Express API complete request data:', formData.toString());

    const response = await axios.post(
      `${BASE_URL}/open/v1/orders/estimate_rate`, // แก้ไข endpoint ตามที่ถูกต้อง
      formData.toString(),
      axiosConfig
    );

    // เพิ่มการแสดงผลการตอบกลับแบบละเอียดเพื่อการแก้ไขปัญหา
    console.log('Flash Express API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    // 6. แปลงข้อมูลที่ได้รับและส่งกลับ
    if (response.data.code === 1 && response.data.data) {
      return response.data.data.map((option: any) => ({
        id: option.expressTypeId,
        name: option.expressTypeName,
        price: option.price,
        estimatedDeliveryDays: option.transportingTime,
        currency: 'THB',
        provider: 'Flash Express'
      }));
    } else {
      throw new Error(response.data.message || 'ไม่สามารถดึงตัวเลือกการจัดส่งได้');
    }
  } catch (error: any) {
    console.error('Flash Express API error (getShippingOptions):', error.message);
    throw new Error(`ไม่สามารถดึงตัวเลือกการจัดส่งได้: ${error.message}`);
  }
}

/**
 * สร้างเลขพัสดุใหม่กับ Flash Express
 */
// ป้องกันการประกาศซ้ำ
export async function createFlashShipment(shipmentData: any) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();

    // 2. แยกรายการสินค้าออกจากข้อมูลหลัก
    const items = shipmentData.items || [];
    delete shipmentData.items;

    // 3. รวมข้อมูลทั้งหมดและกำหนดค่าเริ่มต้นสำหรับฟิลด์ที่จำเป็น
    // แปลงข้อมูลเป็น string ตามมาตรฐานของ Flash Express
    const requestData = {
      ...baseParams,
      outTradeNo: String(shipmentData.outTradeNo),
      warehouseNo: String(baseParams.warehouseNo),

      // ข้อมูลผู้ส่ง (required)
      srcName: String(shipmentData.srcName),
      srcPhone: String(shipmentData.srcPhone),
      srcProvinceName: String(shipmentData.srcProvinceName),
      srcCityName: String(shipmentData.srcCityName),
      srcDistrictName: shipmentData.srcDistrictName ? String(shipmentData.srcDistrictName) : '', // optional แต่ให้ใส่ไว้เป็นค่าว่าง
      srcPostalCode: String(shipmentData.srcPostalCode),
      srcDetailAddress: String(shipmentData.srcDetailAddress),

      // ข้อมูลผู้รับ (required)
      dstName: String(shipmentData.dstName),
      dstPhone: String(shipmentData.dstPhone),
      dstProvinceName: String(shipmentData.dstProvinceName),
      dstCityName: String(shipmentData.dstCityName),
      dstDistrictName: shipmentData.dstDistrictName ? String(shipmentData.dstDistrictName) : '', // optional แต่ให้ใส่ไว้เป็นค่าว่าง
      dstPostalCode: String(shipmentData.dstPostalCode),
      dstDetailAddress: String(shipmentData.dstDetailAddress),

      // ข้อมูลจำเป็นสำหรับการแจ้งเตือน
      dstEmail: shipmentData.dstEmail ? String(shipmentData.dstEmail) : '', // จำเป็นในบางกรณี
      srcEmail: shipmentData.srcEmail ? String(shipmentData.srcEmail) : '', // จำเป็นในบางกรณี

      // ข้อมูลพัสดุ - ต้องเป็น string (required)
      weight: String(parseInt(String(shipmentData.weight)) || 1000), // น้ำหนักเป็น string (กรัม)
      width: String(parseInt(String(shipmentData.width)) || 20), // ความกว้างเป็น string (ซม.) optional
      length: String(parseInt(String(shipmentData.length)) || 30), // ความยาวเป็น string (ซม.) optional
      height: String(parseInt(String(shipmentData.height)) || 10), // ความสูงเป็น string (ซม.) optional

      // ประเภทพัสดุและการจัดส่ง (required) - ตามฟอร์แมตที่ต้องเป็น string และมีค่าตามที่ Flash Express กำหนด
      // ใช้ค่าที่ส่งมาจาก client หรือค่า default ถ้าไม่มี
      parcelKind: shipmentData.parcelKind || "1", // ประเภทพัสดุ (1=ทั่วไป) - ต้องเป็น string ไม่ใช่ integer
      expressCategory: shipmentData.expressCategory || "1", // 1=ส่งด่วน, 2=ส่งธรรมดา - ต้องเป็น string
      articleCategory: shipmentData.articleCategory || "2", // ประเภทสินค้า (1=ทั่วไป, 2=อื่นๆ) - ต้องเป็น string
      expressTypeId: shipmentData.expressTypeId || "1", // ประเภทการส่ง (1=ส่งด่วน) - ต้องเป็น string
      productType: shipmentData.productType || "1", // ประเภทสินค้า (1=ทั่วไป) - ต้องเป็น string

      // พารามิเตอร์ที่จำเป็นสำหรับ Flash Express API
      payType: shipmentData.payType || "1", // วิธีการชำระเงิน (1=ผู้ส่งจ่าย) ต้องเป็น string
      transportType: shipmentData.transportType || "1", // ประเภทการขนส่ง (1=ปกติ) ต้องเป็น string

      // บริการเสริม (required) - ต้องเป็น string ทั้งหมด
      insured: shipmentData.insured || "0", // 0=ไม่ซื้อ Flash care (ต้องเป็น string)
      codEnabled: shipmentData.codEnabled || "0", // 0=ไม่ใช่ COD (ต้องเป็น string)
      codAmount: shipmentData.codAmount || "0", // จำนวนเงิน COD (ต้องเป็น string)
      insuredAmount: shipmentData.insuredAmount || "0" // จำนวนเงินประกัน (ต้องเป็น string)
    };

    // เพิ่มข้อมูล COD ถ้าเปิดใช้งาน
    if (shipmentData.codEnabled === '1' || shipmentData.codEnabled === 1) {
      requestData.codAmount = shipmentData.codAmount;
    }

    // เพิ่มข้อมูลประกันถ้าเปิดใช้งาน
    if (shipmentData.insured === '1' || shipmentData.insured === 1) {
      requestData.insuredAmount = shipmentData.insuranceAmount || shipmentData.insuredAmount;
    }

    // 4. สร้างลายเซ็น (ก่อนเพิ่ม remark และ subItemTypes)
    const signature = generateFlashSignature(requestData, API_KEY!);

    // 5. เพิ่มฟิลด์ที่ไม่นำมาคำนวณลายเซ็น
    // ไม่เพิ่ม sign ลงใน requestData แต่จะเพิ่มในขั้นตอนการสร้าง form data
    const remark = shipmentData.remark || '';

    // 6. แปลงข้อมูลรายการสินค้า
    // ถ้าไม่มีข้อมูลสินค้า ให้ใส่ข้อมูลตัวอย่าง (จำเป็นต้องมี)
    const subItemTypes = items.length > 0
      ? items.map((item: any) => ({
          itemName: item.itemName,
          itemQuantity: String(item.itemQuantity)
        }))
      : [{ itemName: "สินค้าทดสอบ", itemQuantity: "1" }];

    // 7. สร้าง form data (ไม่รวม subItemTypes และ remark ในการคำนวณลายเซ็น)
    const formData = new URLSearchParams();

    // เพิ่มข้อมูลทั้งหมดลงใน form data
    for (const [key, value] of Object.entries(requestData)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }

    // เพิ่มลายเซ็นหลังจากได้คำนวณแล้ว
    formData.append('sign', signature);

    // เพิ่มข้อมูลที่ไม่เกี่ยวข้องกับการคำนวณลายเซ็น
    formData.append('remark', remark);
    formData.append('subItemTypes', JSON.stringify(subItemTypes));

    // 8. ส่งคำขอไปยัง Flash Express API
    // แสดงข้อมูลที่ส่งให้กับ API อย่างละเอียดเพื่อช่วยในการดีบัก
    console.log('Flash Express URL:', `${BASE_URL}/open/v3/orders`); // แก้ไข endpoint ตามที่ถูกต้อง
    console.log('Flash Express request headers:', {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Flash-Signature': signature,
      'X-Flash-Timestamp': baseParams.timestamp,
      'X-Flash-Nonce': baseParams.nonceStr
    });
    console.log('Flash Express request data (formData):', formData.toString());

    const response = await axios.post(
      `${BASE_URL}/open/v3/orders`, // ใช้ v3 เนื่องจากข้อมูลที่ส่งอยู่ในรูปแบบ v3
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Flash-Signature': signature,
          'X-Flash-Timestamp': baseParams.timestamp,
          'X-Flash-Nonce': baseParams.nonceStr
        },
        timeout: 15000,
        validateStatus: function (status) {
          // ยอมรับทุกสถานะโค้ดเพื่อให้อ่านข้อความผิดพลาดได้
          return true;
        }
      }
    );

    // แสดงข้อมูลการตอบกลับจาก API เพื่อช่วยในการดีบัก
    console.log('Flash Express response status:', response.status);
    console.log('Flash Express response headers:', response.headers);
    console.log('Flash Express response data:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('Flash Express API error (createShipment):', error.message);

    // ถ้ามีข้อมูลตอบกลับจาก API แสดงรายละเอียดเพิ่มเติม
    if (error.response && error.response.data) {
      return {
        code: error.response.status,
        message: `ไม่สามารถสร้างเลขพัสดุได้: ${error.message}`,
        data: error.response.data
      };
    }

    return {
      code: 500,
      message: `ไม่สามารถสร้างเลขพัสดุได้: ${error.message}`,
      data: null
    };
  }
}

/**
 * ติดตามสถานะพัสดุ
 */
// เปลี่ยนชื่อฟังก์ชันเพื่อป้องกันการขัดแย้ง
export async function trackFlashShipment(trackingNumber: string) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();

    // 2. เพิ่มเลขพัสดุ
    const requestParams = {
      ...baseParams,
      pno: trackingNumber
    };

    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, API_KEY!);

    // 4. สร้าง form data
    const formData = new URLSearchParams();

    // เพิ่มข้อมูลทั้งหมดลงใน form data
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }

    // เพิ่มลายเซ็นหลังจากได้คำนวณแล้ว
    formData.append('sign', signature);

    // 5. ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(
      `${BASE_URL}/open/v5/tracking`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Flash-Signature': signature,
          'X-Flash-Timestamp': baseParams.timestamp,
          'X-Flash-Nonce': baseParams.nonceStr
        },
        timeout: 15000
      }
    );

    console.log('Flash Express track response data:', response.data);

    if (response.data.code === 1) {
      return {
        success: true,
        data: response.data.data
      };
    } else if (response.data.code === 1001) {
      // แก้ไขเพื่อรองรับกรณี code 1001 (ไม่มีข้อมูล)
      console.log('Flash Express API: ไม่พบข้อมูลพัสดุ (code 1001)');
      return {
        success: false,
        message: 'ไม่พบข้อมูลพัสดุในระบบ Flash Express',
        code: 1001,
        data: null
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'ไม่พบข้อมูลพัสดุ',
        code: response.data.code,
        data: null
      };
    }
  } catch (error: any) {
    console.error('Flash Express API error (trackShipment):', error.message);
    throw new Error(`ไม่สามารถติดตามสถานะพัสดุได้: ${error.message}`);
  }
}

/**
 * สำหรับ API เดิม ให้ใช้เป็นชื่อที่ตรงกับ import ในไฟล์ shipping-methods.ts
 */
export const getFlashExpressShippingOptions = getShippingOptions;
// รีเอ็กซ์พอร์ตฟังก์ชันอื่นๆ ที่ใช้ในไฟล์อื่น
// ไม่ต้องส่งออกซ้ำซ้อน

/**
 * ทดสอบการสร้างลายเซ็นกับข้อมูลตัวอย่างจากเอกสาร
 * ใช้สำหรับตรวจสอบว่าการสร้างลายเซ็นของเราทำงานถูกต้องหรือไม่
 */
export function testSignatureWithExampleData() {
  try {
    // 1. ใช้ข้อมูลตัวอย่างจากเอกสาร
    const testParams = { ...EXAMPLE_DATA };

    // 2. ใช้ apiKey ตัวอย่างสำหรับการทดสอบ (เนื่องจากไม่มีในตัวอย่าง ให้ใช้ค่าสมมติ)
    const testApiKey = 'test_api_key_for_signature_verification';

    // 3. สร้างลายเซ็นจากโค้ดของเรา
    const ourSignature = generateFlashSignature(testParams, testApiKey);

    // 4. ลายเซ็นที่ถูกต้องจากเอกสาร
    const expectedSignature = 'CD03E4D230D0824E804D2AB013879E39A75238C1230214840C6A31C9DF169BF5';

    // 5. เปรียบเทียบผลลัพธ์
    const signatureMatches = (ourSignature === expectedSignature);

    return {
      success: signatureMatches,
      testData: {
        params: testParams,
        apiKey: testApiKey.substring(0, 3) + '...'
      },
      signatures: {
        ours: ourSignature,
        expected: expectedSignature,
        match: signatureMatches,
        length: ourSignature.length
      },
      message: signatureMatches
        ? 'การสร้างลายเซ็นตรงกับตัวอย่างในเอกสาร! ✓'
        : 'ลายเซ็นที่สร้างไม่ตรงกับตัวอย่างในเอกสาร ✗'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `เกิดข้อผิดพลาดในการทดสอบลายเซ็น: ${error.message}`
    };
  }
}

/**
 * ทดสอบการเชื่อมต่อกับ API แบบละเอียด
 * ตรวจสอบการตั้งค่า API Key, ทดสอบการสร้างลายเซ็น, และทดสอบการเชื่อมต่อกับ API
 */
// ทดสอบการเชื่อมต่อกับ Flash Express API
export
async function testFlashApi() {
  try {
    console.log('======= เริ่มทดสอบการเชื่อมต่อกับ Flash Express API =======');
    console.log(`Base URL: ${BASE_URL}`);

    // 1. ตรวจสอบการตั้งค่า API Key และ Merchant ID
    const credentialCheck = {
      merchantId: MERCHANT_ID || 'missing',
      apiKey: API_KEY ? `${API_KEY.substring(0, 3)}...${API_KEY.substring(API_KEY.length - 3)}` : 'missing',
      hasCredentials: !!MERCHANT_ID && !!API_KEY
    };

    console.log('API Credentials:', {
      merchantId: MERCHANT_ID ? 'configured' : 'missing',
      apiKey: API_KEY ? 'configured' : 'missing',
      hasCredentials: !!MERCHANT_ID && !!API_KEY
    });

    if (!credentialCheck.hasCredentials) {
      return {
        success: false,
        statusText: 'API Credentials Missing',
        credentials: {
          merchantId: MERCHANT_ID ? 'configured' : 'missing',
          apiKey: API_KEY ? 'configured' : 'missing',
          hasCredentials: !!MERCHANT_ID && !!API_KEY
        },
        message: 'ไม่พบข้อมูล API Key หรือ Merchant ID กรุณาตั้งค่า API Key และ Merchant ID ก่อนใช้งาน'
      };
    }

    // 2. ทดสอบการสร้างลายเซ็น
    console.log('ขั้นตอนที่ 2: ทดสอบการสร้างลายเซ็น');
    const nonceStr = generateNonceStr();
    const timestamp = String(Math.floor(Date.now() / 1000));

    const testParams: Record<string, string> = {
      mchId: MERCHANT_ID as string,
      nonceStr: nonceStr,
      timestamp: timestamp,
      warehouseNo: `${MERCHANT_ID}_001`
    };

    console.log('Test Parameters:', testParams);

    const signature = generateFlashSignature(testParams, API_KEY as string);
    console.log('Generated Signature:', signature.substring(0, 10) + '...' + signature.substring(signature.length - 10));
    console.log('Signature Length:', signature.length, '(ควรเป็น 64 ตัวอักษร)');

    // 3. ทดสอบเรียก API
    console.log('ขั้นตอนที่ 3: ทดสอบการเชื่อมต่อกับ Flash Express API');

    try {
      // สร้าง URLSearchParams แทนการใช้ object
      const formData = new URLSearchParams();

      // เรียงลำดับพารามิเตอร์ตามตัวอักษรก่อนใส่ใน formData
      const sortedParams = Object.keys(testParams).sort().reduce(
        (obj: Record<string, string>, key) => {
          if (testParams[key] !== null && testParams[key] !== undefined && testParams[key] !== '') {
            obj[key] = testParams[key];
          }
          return obj;
        },
        {}
      );

      // เพิ่มข้อมูลทั้งหมดลงใน form data
      for (const [key, value] of Object.entries(sortedParams)) {
        formData.append(key, String(value));
      }

      // เพิ่มลายเซ็นหลังจากได้คำนวณแล้ว
      formData.append('sign', signature);

      const formDataString = formData.toString();
      console.log('Form Data String:', formDataString);

      // ขั้นตอนที่ 3.1: ทดสอบด้วย endpoint เฉพาะ
      // กลับมาใช้ endpoint เดิมเนื่องจากในประวัติการใช้งานเคยสำเร็จกับ endpoint นี้
      console.log('ทดสอบเชื่อมต่อกับ endpoint: /open/v3/orders');

      // ตั้งค่าตัวเลือกการส่งคำขอ
      const requestOptions = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 15000, // timeout 15 วินาทีสำหรับการทดสอบ
        maxRedirects: 0, // ป้องกันการ redirect
        validateStatus: (status: number) => status < 500 // ยอมรับสถานะ 400-499 เพื่อดูข้อความผิดพลาด
      };

      const response = await axios.post(
        `${BASE_URL}/open/v3/orders`,
        formDataString,
        requestOptions
      );

      console.log('API Response Status:', response.status, response.statusText);
      console.log('API Response Data:', JSON.stringify(response.data).substring(0, 200) + '...');

      return {
        success: true,
        statusText: 'API Connection Successful',
        credentials: {
          merchantId: MERCHANT_ID ? 'configured' : 'missing',
          apiKey: API_KEY ? 'configured' : 'missing',
          hasCredentials: !!MERCHANT_ID && !!API_KEY
        },
        signature: {
          test: true,
          signatureGenerated: signature.substring(0, 10) + '...' + signature.substring(signature.length - 10),
          signatureLength: signature.length,
          expectedLength: 64 // SHA-256 มีความยาว 64 ตัวอักษร
        },
        apiResponse: {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        },
        message: 'การเชื่อมต่อกับ Flash Express API สำเร็จ'
      };

    } catch (apiError: any) {
      console.error('Flash Express API Error:', apiError.message);
      console.error('API Response Data:', apiError.response?.data);

      // ตรวจสอบว่าเป็น HTML response หรือไม่
      const isHtmlResponse =
        apiError.response?.data &&
        typeof apiError.response.data === 'string' &&
        apiError.response.data.includes('<!DOCTYPE html>');

      if (isHtmlResponse) {
        console.error('ได้รับการตอบกลับเป็น HTML แทน JSON');
        console.error('HTML snippet:', apiError.response.data.substring(0, 200) + '...');
      }

      // กรณีเชื่อมต่อ API ไม่สำเร็จ แต่การตั้งค่าและการสร้างลายเซ็นถูกต้อง
      return {
        success: false,
        statusText: 'API Connection Failed',
        credentials: {
          merchantId: MERCHANT_ID ? 'configured' : 'missing',
          apiKey: API_KEY ? 'configured' : 'missing',
          hasCredentials: !!MERCHANT_ID && !!API_KEY
        },
        signature: {
          test: true,
          signatureGenerated: signature.substring(0, 10) + '...' + signature.substring(signature.length - 10),
          signatureLength: signature.length,
          expectedLength: 64
        },
        error: {
          message: apiError.message,
          code: apiError.code || 'UNKNOWN',
          response: apiError.response ? {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            data: apiError.response.data,
            isHtml: isHtmlResponse
          } : null
        },
        message: `การเชื่อมต่อกับ Flash Express API ไม่สำเร็จ: ${apiError.message}`
      };
    }
  } catch (error: any) {
    console.error('API Test Error:', error.message);
    return {
      success: false,
      statusText: 'Test Function Error',
      error: {
        message: error.message,
        stack: error.stack
      },
      message: `เกิดข้อผิดพลาดในการทดสอบ: ${error.message}`
    };
  }
}

/**
 * ค้นหาออเดอร์โดยใช้ Merchant Tracking Number (outTradeNo)
 * ใช้สำหรับค้นหาพัสดุที่สร้างไปแล้วโดยใช้รหัสอ้างอิงของร้านค้า
 */
export async function findOrderByMerchantTrackingNumber(merchantTrackingNumber: string) {
  try {
    // 1. สร้างข้อมูลพื้นฐาน
    const baseParams = createBaseRequestParams();

    // 2. เพิ่มเลขติดตามของร้านค้า
    const requestParams = {
      ...baseParams,
      outTradeNo: merchantTrackingNumber
    };

    // 3. สร้างลายเซ็น
    const signature = generateFlashSignature(requestParams, API_KEY!);

    // 4. สร้าง form data
    const formData = new URLSearchParams();

    // เพิ่มข้อมูลทั้งหมดลงใน form data
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }

    // เพิ่มลายเซ็นหลังจากได้คำนวณแล้ว
    formData.append('sign', signature);

    // 5. ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(
      `${BASE_URL}/open/v1/ordersByMchPno`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Flash-Signature': signature,
          'X-Flash-Timestamp': baseParams.timestamp,
          'X-Flash-Nonce': baseParams.nonceStr
        },
        timeout: 15000
      }
    );

    if (response.data.code === 1) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'ไม่พบข้อมูลพัสดุ',
        data: null
      };
    }
  } catch (error: any) {
    console.error('Flash Express API error (findOrderByMerchantTrackingNumber):', error.message);
    return {
      success: false,
      message: `ไม่สามารถค้นหาข้อมูลพัสดุได้: ${error.message}`,
      data: null
    };
  }
}