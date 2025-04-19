/**
 * ไฟล์ทดสอบเฉพาะเจาะจงสำหรับการสร้างลายเซ็น Flash Express
 * ใช้ตัวอย่างจากเอกสาร Flash Express
 */
import crypto from 'crypto';

function generateSignature(params: Record<string, any>, apiKey: string): string {
  try {
    // 1. ไม่รวม sign และ subItemTypes
    const paramsCopy: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ข้ามค่า null และ undefined
      if (value === null || value === undefined) continue;
      
      // ข้ามสตริงว่างตามที่เอกสารระบุ
      if (typeof value === 'string' && /^[ \t\n\r\f\u000b\u001c\u001d\u001e\u001f]*$/.test(value)) continue;
      
      // เพิ่มค่าที่ผ่านเข้าไป
      paramsCopy[key] = value;
    }
    
    // 2. เรียงตามรหัส ASCII จากน้อยไปมาก
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    // 3. สร้างสตริงในรูปแบบ key1=value1&key2=value2...
    const stringParts: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsCopy[key];
      
      // แปลงค่า Array หรือ Object เป็น JSON string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      stringParts.push(`${key}=${value}`);
    }
    
    // 4. รวมเป็นสตริงเดียว คั่นด้วย &
    const stringA = stringParts.join('&');
    
    // 5. นำ stringA มาต่อด้วย key=apiKey
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('String to be hashed:', stringSignTemp);
    
    // 6. คำนวณ SHA256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
    
    return signature;
  } catch (error) {
    console.error('Error generating signature:', error);
    throw error;
  }
}

// ตัวอย่างจากเอกสาร Flash Express
function testWithDocumentExample(): void {
  // ตัวอย่างพารามิเตอร์จากเอกสาร
  const params = {
    mchId: 'AAXXXX',
    nonceStr: 'yyv6YJP436wCkdpNdghC',
    body: 'test'
  };
  
  // คีย์ลับตามตัวอย่างในเอกสาร
  const apiKey = '96fe12c2e61a85d59de7cc8c279b00b9ce310e2bf55ffacd70665a17b10eb8f6';
  
  // สร้างลายเซ็น
  const signature = generateSignature(params, apiKey);
  
  // ลายเซ็นที่ถูกต้องตามตัวอย่างเอกสาร
  const expectedSignature = '7FE0E6EB255BE3277FC781E8E25F492549A1D4E65C2CE1C97B337E461A0830DE';
  
  console.log('Generated Signature:', signature);
  console.log('Expected Signature:', expectedSignature);
  console.log('Match with document example:', signature === expectedSignature);
}

function testWithEmptyValues(): void {
  // ทดสอบกับค่าว่าง
  const params = {
    mchId: 'AAXXXX',
    nonceStr: 'yyv6YJP436wCkdpNdghC',
    body: ' \t\n'
  };
  
  const apiKey = '96fe12c2e61a85d59de7cc8c279b00b9ce310e2bf55ffacd70665a17b10eb8f6';
  
  const signature = generateSignature(params, apiKey);
  
  // ลายเซ็นที่ถูกต้องเมื่อไม่มีพารามิเตอร์ body
  const expectedSignature = '7FE0E6EB255BE3277FC781E8E25F492549A1D4E65C2CE1C97B337E461A0830DE';
  
  console.log('Generated Signature (with empty body):', signature);
  console.log('Expected Signature:', expectedSignature);
  console.log('Match with document example:', signature === expectedSignature);
}

function testWithRealData(): void {
  // สร้างข้อมูลคล้ายกับที่ใช้ในแอป
  const params = {
    mchId: 'Cbe1930',
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
  
  // เปลี่ยนเป็น API key จริงตามที่ตั้งใน .env
  const apiKey = '7b0812f944c8d222fb5b5e08bc7e21983211e212d4153acbe2863b36523eafd2';
  
  const signature = generateSignature(params, apiKey);
  
  console.log('Generated Signature for real data:', signature);
}

// รันการทดสอบ
console.log('=== Flash Express Signature Test ===');
console.log('\n1. ทดสอบด้วยตัวอย่างจากเอกสาร');
testWithDocumentExample();

console.log('\n2. ทดสอบกับค่าว่าง');
testWithEmptyValues();

console.log('\n3. ทดสอบกับข้อมูลจริง');
testWithRealData();