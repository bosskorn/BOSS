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
    // ก. ใช้ข้อมูลที่ได้รับเป็นพารามิเตอร์จากฟังก์ชัน
    
    // ข. จัดรูปแบบและจัดเรียงพารามิเตอร์
    // 1. ตั้งค่าและคัดกรองข้อมูล (ไม่รวม sign และ subItemTypes)
    const paramsCopy: Record<string, any> = {};
    
    for (const key in params) {
      // ข้ามฟิลด์ sign ในการคำนวณลายเซ็น
      if (key === 'sign') continue;
      
      // ข้าม subItemTypes ในการคำนวณลายเซ็น
      if (key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ข้ามค่า null และ undefined
      if (value === null || value === undefined) continue;
      
      // ตรวจสอบและข้ามสตริงว่างตามที่เอกสารระบุ
      // ค่าว่างหมายถึงสตริงที่ประกอบด้วยอักขระเว้นวรรคทั้งหมด (แก้ไขรูปแบบ regex ให้ตรงกับเอกสาร)
      if (typeof value === 'string' && /^[ \t\n\r\f\u000b\u001c\u001d\u001e\u001f]*$/.test(value)) continue;
      
      // เพิ่มคีย์-ค่าทีผ่านเงื่อนไขเข้าไปในชุดข้อมูลใหม่
      paramsCopy[key] = value;
    }
    
    // 2. จัดเรียงคีย์ตามรหัส ASCII ของชื่อพารามิเตอร์ โดยเรียงจากค่าน้อยไปมาก
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    // 3. สร้างสตริง stringA ตามรูปแบบ "key=value&key=value"
    const paramsArray: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsCopy[key];
      
      // หากค่าเป็น Array หรือ Object ให้แปลงเป็น JSON string
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      paramsArray.push(`${key}=${value}`);
    }
    
    // รวมพารามิเตอร์เป็นสตริงเดียว เชื่อมด้วย &
    const stringA = paramsArray.join('&');
    
    // ค. นำ stringA มาต่อท้ายด้วย &key={apiKey}
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    // แสดงข้อมูลที่ใช้สร้างลายเซ็นเพื่อการดีบัก
    console.log('===========================================================');
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น Flash Express:');
    console.log(stringSignTemp);
    
    // คำนวณ SHA256 hash และแปลงเป็นตัวพิมพ์ใหญ่
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