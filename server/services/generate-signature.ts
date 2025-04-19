/**
 * Flash Express API Signature Generator
 * ใช้สำหรับการสร้าง signature สำหรับ Flash Express API
 * อ้างอิงตามเอกสาร: https://flash-express.readme.io/v3/reference/signing-process
 */
import crypto from 'crypto';

/**
 * สร้าง signature สำหรับ Flash Express API ตามเอกสารอ้างอิงของ Flash Express
 * @param apiKey คีย์ลับที่ได้รับจาก Flash Express (secret_key)
 * @param params พารามิเตอร์ทั้งหมดที่จะส่งไปยัง API
 * @param nonceStr ตัวอักษรสุ่ม ความยาวไม่เกิน 32 ตัวอักษร
 * @returns signature ที่สร้างขึ้น
 */
export function generateFlashExpressSignature(
  apiKey: string,
  params: Record<string, any>,
  nonceStr: string
): string {
  try {
    // ขั้นตอนที่ 1: ตั้งค่าและคัดกรองข้อมูล
    // สร้างชุดข้อมูลใหม่ ไม่รวม sign และ subItemTypes
    const paramsCopy: Record<string, any> = {};
    
    // วนลูปผ่านทุกคีย์ในออบเจกต์แบบเดิม
    for (const key in params) {
      // ข้ามฟิลด์ sign เสมอ
      if (key === 'sign') continue;
      
      // สำหรับ subItemTypes จะไม่รวมในการคำนวณลายเซ็น
      if (key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ตรวจสอบค่าว่างตามเอกสาร Flash Express
      if (value === null || value === undefined) continue;
      
      // ตรวจสอบสตริงว่างตามที่เอกสารระบุ
      // \u0009 (tab), \u000A (line feed), \u000B (vertical tab), 
      // \u000C (form feed), \u000D (carriage return),
      // \u001C (file separator), \u001D (group separator),
      // \u001E (record separator), \u001F (unit separator)
      if (typeof value === 'string' && /^[ \t\n\v\f\r\u001c\u001d\u001e\u001f]*$/.test(value)) continue;
      
      // เพิ่มคีย์-ค่าที่ผ่านเงื่อนไขเข้าไปในชุดข้อมูลใหม่
      paramsCopy[key] = value;
    }
    
    // ขั้นตอนที่ 2: จัดเรียงคีย์ตามลำดับ ASCII (dictionary order)
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    // ขั้นตอนที่ 3: สร้างสตริง stringA ตามรูปแบบ key1=value1&key2=value2
    const paramsArray: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsCopy[key];
      
      // แปลงค่า Array หรือ Object เป็น JSON string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // สร้างรูปแบบ key=value และเพิ่มเข้าอาร์เรย์
      paramsArray.push(`${key}=${value}`);
    }
    
    // รวมพารามิเตอร์เป็นสตริงเดียว คั่นด้วย &
    const stringA = paramsArray.join('&');
    
    // ขั้นตอนที่ 4: สร้าง stringSignTemp โดยเพิ่ม &key={apiKey} ต่อท้าย
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    // Log ค่าที่ใช้ในการสร้างลายเซ็นเพื่อการดีบัก
    console.log('===========================================================');
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น Flash Express:');
    console.log(stringSignTemp);
    
    // ขั้นตอนที่ 5: คำนวณด้วย SHA256 และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto
      .createHash('sha256')
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();
    
    console.log('ลายเซ็น Flash Express ที่สร้าง:', signature);
    console.log('===========================================================');
    
    return signature;
  } catch (error) {
    console.error('Error generating Flash Express signature:', error);
    throw new Error('Failed to generate signature: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * สร้าง nonce string สำหรับ Flash Express API
 * @returns nonce string ความยาวไม่เกิน 32 ตัวอักษร
 */
export function generateNonceStr(): string {
  // ใช้ timestamp ปัจจุบันร่วมกับตัวอักษรสุ่ม
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2, 10); // ตัวอักษรสุ่ม
  
  return `${timestamp}${randomPart}`.substring(0, 32); // จำกัดความยาวไม่เกิน 32 ตัวอักษร
}