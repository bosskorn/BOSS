/**
 * ไฟล์ทดสอบการเชื่อมต่อกับ Flash Express API โดยใช้ตัวอย่างจริงที่ผู้ใช้ให้มา
 */
import axios from 'axios';
import crypto from 'crypto';

// ข้อมูลการเชื่อมต่อกับ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api-tra.flashexpress.com';
const FLASH_EXPRESS_API_KEY = process.env.FLASH_EXPRESS_API_KEY;

function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('⚙️ เริ่มคำนวณลายเซ็น Flash Express API...');
    
    // 0. ตรวจสอบว่ามี API key หรือไม่
    if (!apiKey) {
      console.error('❌ ไม่พบ API Key สำหรับสร้างลายเซ็น');
      throw new Error('API Key is required for signature generation');
    }

    // 1. แปลงทุกค่าเป็น string และกรองพารามิเตอร์
    const stringParams: Record<string, string> = {};
    Object.keys(params).forEach(key => {
      // ข้ามฟิลด์ที่ไม่ต้องใช้ในการคำนวณลายเซ็น
      const skipParams = [
        'sign', 
        'subItemTypes', 
        'merchantId',
        'subParcel',
        'subParcelQuantity',
        'remark',
        'opdInsureEnabled', // ทดลองข้ามตัวนี้
        'timestamp' // ทดลองข้ามตัวนี้
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

    console.log('🔑 สตริงที่ใช้สร้างลายเซ็น:', stringToSign);

    // 4. สร้าง SHA-256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex').toUpperCase();

    console.log('🔒 ลายเซ็นที่สร้าง:', signature);
    
    return signature;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างลายเซ็น Flash Express:', error);
    throw error;
  }
}

async function testSampleDataExact() {
  try {
    console.log('🧪 เริ่มการทดสอบ Flash Express API ด้วยข้อมูลตัวอย่างจริง...');
    
    // ตรวจสอบการตั้งค่า API
    if (!FLASH_EXPRESS_API_KEY) {
      throw new Error('Flash Express API credentials not configured');
    }
    
    // ข้อมูลตัวอย่างที่ได้รับจากผู้ใช้โดยตรง
    const sampleData = {
      mchId: 'AAXXXX',
      nonceStr: '1536749552628',
      sign: 'D4515A46B6094589F1F7615ADCC988FBB03A79010F2A206DC982F27D396F93A0',
      outTradeNo: '123456789XXXX',
      warehouseNo: 'AAXXXX_001',
      srcName: 'หอมรวม  create order test name',
      srcPhone: '0123456789',
      srcProvinceName: 'อุบลราชธานี',
      srcCityName: 'เมืองอุบลราชธานี',
      srcDistrictName: 'ในเมือง',
      srcPostalCode: '34000',
      srcDetailAddress: 'example detail address',
      dstName: 'น้ำพริกแม่อำพร',
      dstPhone: '0123456789',
      dstHomePhone: '0123456789',
      dstProvinceName: 'เชียงใหม่',
      dstCityName: 'สันทราย',
      dstDistrictName: 'สันพระเนตร',
      dstPostalCode: '50210',
      dstDetailAddress: 'example detail address',
      returnName: 'น้ำพริกแม่อำพร',
      returnPhone: '0123456789',
      returnProvinceName: 'อุบลราชธานี',
      returnCityName: 'เมืองอุบลราชธานี',
      returnPostalCode: '34000',
      returnDetailAddress: 'example detail address',
      articleCategory: 1,
      expressCategory: 1,
      weight: 1000,
      insured: 1,
      insureDeclareValue: 10000,
      opdInsureEnabled: 1,
      codEnabled: 1,
      codAmount: 10000,
      subParcelQuantity: 2,
      subParcel: [
        {
          "outTradeNo": "123456789XXXX1",
          "weight": 21,
          "width": 21,
          "length": 21,
          "height": 12,
          "remark": "remark1"
        },
        {
          "outTradeNo": "123456789XXXX2",
          "weight": 21,
          "width": 21,
          "length": 21,
          "height": 21,
          "remark": "remark2"
        }
      ],
      subItemTypes: [
        {
          "itemName": "item name description",
          "itemWeightSize": "1*1*1 1Kg",
          "itemColor": "red",
          "itemQuantity": "1"
        },
        {
          "itemName": "item name description",
          "itemWeightSize": "2*2*2 1Kg",
          "itemColor": "blue",
          "itemQuantity": "2"
        }
      ],
      remark: 'ขึ้นบันได'
    };
    
    // สำเนาข้อมูลเพื่อใช้ในการคำนวณลายเซ็น (ไม่รวมฟิลด์ sign)
    const calculationData = { ...sampleData };
    delete calculationData.sign;
    
    // แปลง arrays เป็น JSON strings เพื่อให้ตรงกับการส่งข้อมูลจริง
    if (calculationData.subParcel) {
      calculationData.subParcel = JSON.stringify(calculationData.subParcel);
    }
    if (calculationData.subItemTypes) {
      calculationData.subItemTypes = JSON.stringify(calculationData.subItemTypes);
    }
    
    console.log('📝 ข้อมูลที่ใช้ในการทดสอบ (ตัวอย่างเดิมที่ผู้ใช้ให้):', JSON.stringify(sampleData, null, 2));
    console.log('\n🔒 ลายเซ็นตัวอย่าง:', sampleData.sign);
    
    // วิธีที่ 1: ทดสอบโดยใช้ข้อมูลทั้งหมด
    console.log('\n🧪 วิธีที่ 1: ใช้ข้อมูลทั้งหมดยกเว้น sign, subItemTypes, merchantId, subParcel, subParcelQuantity, remark');
    const signature1 = generateFlashSignature(calculationData, FLASH_EXPRESS_API_KEY as string);
    
    // วิธีที่ 2: ทดสอบโดยใช้ข้อมูลเท่าที่จำเป็น (ไม่รวม timestamp)
    console.log('\n🧪 วิธีที่ 2: ใช้เฉพาะฟิลด์ที่จำเป็น + ข้าม opdInsureEnabled');
    const minimalData = {
      mchId: sampleData.mchId,
      nonceStr: sampleData.nonceStr,
      outTradeNo: sampleData.outTradeNo,
      warehouseNo: sampleData.warehouseNo,
      srcName: sampleData.srcName,
      srcPhone: sampleData.srcPhone,
      srcProvinceName: sampleData.srcProvinceName,
      srcCityName: sampleData.srcCityName,
      srcDistrictName: sampleData.srcDistrictName,
      srcPostalCode: sampleData.srcPostalCode,
      srcDetailAddress: sampleData.srcDetailAddress,
      dstName: sampleData.dstName,
      dstPhone: sampleData.dstPhone,
      dstHomePhone: sampleData.dstHomePhone,
      dstProvinceName: sampleData.dstProvinceName,
      dstCityName: sampleData.dstCityName,
      dstDistrictName: sampleData.dstDistrictName,
      dstPostalCode: sampleData.dstPostalCode,
      dstDetailAddress: sampleData.dstDetailAddress,
      returnName: sampleData.returnName,
      returnPhone: sampleData.returnPhone,
      returnProvinceName: sampleData.returnProvinceName,
      returnCityName: sampleData.returnCityName,
      returnPostalCode: sampleData.returnPostalCode,
      returnDetailAddress: sampleData.returnDetailAddress,
      articleCategory: sampleData.articleCategory,
      expressCategory: sampleData.expressCategory,
      weight: sampleData.weight,
      insured: sampleData.insured,
      insureDeclareValue: sampleData.insureDeclareValue,
      codEnabled: sampleData.codEnabled,
      codAmount: sampleData.codAmount
      // ไม่รวม opdInsureEnabled
    };
    
    const signature2 = generateFlashSignature(minimalData, FLASH_EXPRESS_API_KEY as string);
    
    // วิธีที่ 3: ทดสอบโดยใช้พารามิเตอร์น้อยลงไปอีก
    console.log('\n🧪 วิธีที่ 3: ใช้พารามิเตอร์ในการลงทะเบียนลดลงอีก (ไม่รวม return และอื่นๆ)');
    const minimalData2 = {
      mchId: sampleData.mchId,
      nonceStr: sampleData.nonceStr,
      outTradeNo: sampleData.outTradeNo,
      warehouseNo: sampleData.warehouseNo,
      srcName: sampleData.srcName,
      srcPhone: sampleData.srcPhone,
      srcProvinceName: sampleData.srcProvinceName,
      srcCityName: sampleData.srcCityName,
      srcPostalCode: sampleData.srcPostalCode,
      dstName: sampleData.dstName,
      dstPhone: sampleData.dstPhone,
      dstProvinceName: sampleData.dstProvinceName,
      dstCityName: sampleData.dstCityName,
      dstPostalCode: sampleData.dstPostalCode,
      articleCategory: sampleData.articleCategory,
      expressCategory: sampleData.expressCategory,
      weight: sampleData.weight,
      insured: sampleData.insured,
      codEnabled: sampleData.codEnabled
    };
    
    const signature3 = generateFlashSignature(minimalData2, FLASH_EXPRESS_API_KEY as string);
    
    console.log('\n📊 เปรียบเทียบผลลัพธ์:');
    console.log('🔑 ลายเซ็นตัวอย่าง:', sampleData.sign);
    console.log('🔑 วิธีที่ 1:', signature1);
    console.log('🔑 วิธีที่ 2:', signature2);
    console.log('🔑 วิธีที่ 3:', signature3);
    
    // เปรียบเทียบและแสดงผล
    const results = [
      { method: 'ตัวอย่าง', signature: sampleData.sign },
      { method: 'วิธีที่ 1', signature: signature1, match: signature1 === sampleData.sign },
      { method: 'วิธีที่ 2', signature: signature2, match: signature2 === sampleData.sign },
      { method: 'วิธีที่ 3', signature: signature3, match: signature3 === sampleData.sign }
    ];
    
    console.table(results);
    
    // ตรวจสอบว่ามีวิธีไหนที่ลายเซ็นตรงกับตัวอย่างหรือไม่
    const matchMethod = results.find(r => r.match);
    if (matchMethod) {
      console.log(`\n✅ พบวิธีที่ให้ลายเซ็นตรงกับตัวอย่าง: ${matchMethod.method}`);
    } else {
      console.log('\n❌ ไม่พบวิธีใดที่ให้ลายเซ็นตรงกับตัวอย่าง');
    }
    
    return { success: true, results };
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
testSampleDataExact().then(result => {
  console.log('\n🏁 เสร็จสิ้นการทดสอบ');
}).catch(error => {
  console.error('💥 การทดสอบล้มเหลว:', error);
});