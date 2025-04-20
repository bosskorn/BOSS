/**
 * ไฟล์สำหรับ debug การสร้างลายเซ็น Flash Express API อย่างละเอียด
 * ทดสอบกับตัวอย่างจากเอกสารทางการและข้อมูลจริง
 */
import crypto from 'crypto';
import { generateFlashExpressSignature } from './services/generate-signature';

// ฟังก์ชันเปรียบเทียบลายเซ็นที่สร้างกับลายเซ็นในเอกสาร
function compareSignatures(generated: string, expected: string): void {
  console.log('ลายเซ็นที่สร้าง:   ', generated);
  console.log('ลายเซ็นที่คาดหวัง: ', expected);
  console.log('ตรงกับเอกสาร:     ', generated === expected);
  
  if (generated !== expected) {
    console.log('วิเคราะห์ความแตกต่าง:');
    let diffCount = 0;
    for (let i = 0; i < Math.max(generated.length, expected.length); i++) {
      if (generated[i] !== expected[i]) {
        console.log(`  ตำแหน่ง ${i+1}: '${generated[i] || ' '}' vs '${expected[i] || ' '}'`);
        diffCount++;
        if (diffCount > 10) {
          console.log('  (แสดงเพียง 10 ตำแหน่งแรกที่แตกต่างกัน)');
          break;
        }
      }
    }
  }
}

// ฟังก์ชันสร้างลายเซ็นแบบตรง (ไม่ผ่านฟังก์ชันอื่น)
function generateDirectSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // ขั้นตอนที่ 1: ไม่รวม sign และ subItemTypes
    const paramsCopy: Record<string, any> = {};
    
    // เอาเฉพาะค่าที่ไม่ใช่ sign และ subItemTypes และไม่ใช่ค่าว่าง
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ข้ามค่า null และ undefined
      if (value === null || value === undefined) continue;
      
      // ข้ามสตริงว่างตามที่เอกสารระบุ
      if (typeof value === 'string' && /^[ \t\n\r\f\u000b\u001c\u001d\u001e\u001f]*$/.test(value)) continue;
      
      // เพิ่มค่าที่ผ่านลงในออบเจ็กต์ใหม่
      paramsCopy[key] = value;
    }
    
    // ขั้นตอนที่ 2: เรียงลำดับตาม ASCII ของคีย์
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    // ขั้นตอนที่ 3: สร้าง stringA
    const stringParts: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsCopy[key];
      
      // แปลงค่า Array หรือ Object เป็น JSON string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      stringParts.push(`${key}=${value}`);
    }
    
    // รวมพารามิเตอร์เป็นสตริงเดียว
    const stringA = stringParts.join('&');
    
    // ขั้นตอนที่ 4: ต่อท้ายด้วย &key={apiKey}
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น:', stringSignTemp);
    
    // ขั้นตอนที่ 5: คำนวณ SHA256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
    
    return signature;
  } catch (error) {
    console.error('Error generating direct signature:', error);
    throw error;
  }
}

// ทดสอบกับตัวอย่างจากเอกสารทางการ
function testWithDocumentExample(): void {
  console.log('\n==== ทดสอบกับตัวอย่างจากเอกสารทางการ ====');
  
  // ข้อมูลตัวอย่างตามเอกสาร
  const params = {
    mchId: 'AAXXXX',
    nonceStr: 'yyv6YJP436wCkdpNdghC',
    body: 'test'
  };
  
  // API key ตัวอย่างจากเอกสาร
  const apiKey = '96fe12c2e61a85d59de7cc8c279b00b9ce310e2bf55ffacd70665a17b10eb8f6';
  
  // ลายเซ็นที่คาดหวังจากเอกสาร
  const expectedSignature = '7FE0E6EB255BE3277FC781E8E25F492549A1D4E65C2CE1C97B337E461A0830DE';
  
  // ทดสอบด้วยฟังก์ชัน generateFlashExpressSignature
  console.log('\nทดสอบด้วยฟังก์ชัน generateFlashExpressSignature:');
  const generatedSignature1 = generateFlashExpressSignature(apiKey, params, params.nonceStr);
  compareSignatures(generatedSignature1, expectedSignature);
  
  // ทดสอบด้วยฟังก์ชัน generateDirectSignature
  console.log('\nทดสอบด้วยฟังก์ชัน generateDirectSignature:');
  const generatedSignature2 = generateDirectSignature(params, apiKey);
  compareSignatures(generatedSignature2, expectedSignature);
}

// ทดสอบกับข้อมูลจริง
function testWithRealData(): void {
  console.log('\n==== ทดสอบกับข้อมูลจริง ====');
  
  // ข้อมูลตัวอย่างแบบจริง
  const params = {
    mchId: process.env.FLASH_EXPRESS_MERCHANT_ID || 'Cbe1930',
    nonceStr: '1745085836343aiakfhgi',
    outTradeNo: 'PD1745085836343',
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
    articleCategory: 1,
    expressCategory: 1,
    weight: 1000,
    width: 10,
    length: 10,
    height: 10,
    insured: 0,
    codEnabled: 0
  };
  
  // นำ API key จาก environment variable หรือใช้ค่าตัวอย่าง
  const apiKey = process.env.FLASH_EXPRESS_API_KEY || '7b0812f944c8d222fb5b5e08bc7e21983211e212d4153acbe2863b36523eafd2';
  
  // ทดสอบด้วยฟังก์ชัน generateFlashExpressSignature
  console.log('\nทดสอบด้วยฟังก์ชัน generateFlashExpressSignature:');
  const generatedSignature1 = generateFlashExpressSignature(apiKey, params, params.nonceStr);
  console.log('ลายเซ็นที่สร้าง:', generatedSignature1);
  
  // ทดสอบด้วยฟังก์ชัน generateDirectSignature
  console.log('\nทดสอบด้วยฟังก์ชัน generateDirectSignature:');
  const generatedSignature2 = generateDirectSignature(params, apiKey);
  console.log('ลายเซ็นที่สร้าง:', generatedSignature2);
  
  // เปรียบเทียบผลลัพธ์จากทั้งสองฟังก์ชัน
  console.log('\nเปรียบเทียบผลลัพธ์จากทั้งสองฟังก์ชัน:');
  compareSignatures(generatedSignature1, generatedSignature2);
}

// ทดสอบกับข้อมูลที่มีค่าว่าง
function testWithEmptyValues(): void {
  console.log('\n==== ทดสอบกับข้อมูลที่มีค่าว่าง ====');
  
  // ข้อมูลตัวอย่างที่มีค่าว่าง
  const params = {
    mchId: 'AAXXXX',
    nonceStr: 'yyv6YJP436wCkdpNdghC',
    body: '',
    emptySpace: ' \t\n\r',
    nullValue: null,
    undefinedValue: undefined
  };
  
  // API key ตัวอย่างจากเอกสาร
  const apiKey = '96fe12c2e61a85d59de7cc8c279b00b9ce310e2bf55ffacd70665a17b10eb8f6';
  
  // ลายเซ็นที่คาดหวังจากเอกสารเมื่อไม่มี body
  const expectedSignature = '7FE0E6EB255BE3277FC781E8E25F492549A1D4E65C2CE1C97B337E461A0830DE';
  
  // ทดสอบด้วยฟังก์ชัน generateFlashExpressSignature
  console.log('\nทดสอบด้วยฟังก์ชัน generateFlashExpressSignature:');
  const generatedSignature1 = generateFlashExpressSignature(apiKey, params, params.nonceStr);
  compareSignatures(generatedSignature1, expectedSignature);
  
  // ทดสอบด้วยฟังก์ชัน generateDirectSignature
  console.log('\nทดสอบด้วยฟังก์ชัน generateDirectSignature:');
  const generatedSignature2 = generateDirectSignature(params, apiKey);
  compareSignatures(generatedSignature2, expectedSignature);
}

// รันการทดสอบทั้งหมด
console.log('=======================================');
console.log('การทดสอบการสร้างลายเซ็น Flash Express API');
console.log('=======================================');

testWithDocumentExample();
testWithEmptyValues();
testWithRealData();

console.log('\n=======================================');
console.log('การทดสอบเสร็จสิ้น');
console.log('=======================================');
