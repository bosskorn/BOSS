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
    // ตามเอกสาร Flash Express: ก่อนการสร้างลายเซ็น ต้องลบ sign ออกก่อน
    // และไม่รวม subItemTypes ในการคำนวณ
    const paramsCopy = { ...params };
    delete paramsCopy.sign;
    delete paramsCopy.subItemTypes;
    
    // 1. เรียงลำดับคีย์ของพารามิเตอร์ตามลำดับอักษร ASCII (dictionary order)
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    // 2. สร้างสตริง stringA ในรูปแบบ key1=value1&key2=value2&...
    // โดยกรองเฉพาะค่าที่ไม่เป็นค่าว่าง ตามที่ Flash Express กำหนด
    const stringA = sortedKeys
      .filter(key => {
        const value = paramsCopy[key];
        // กรองค่า null, undefined
        if (value === null || value === undefined) return false;
        
        // กรองสตริงที่เป็นช่องว่าง (ต้องเช็คแบบละเอียดตามที่ Flash Express กำหนด)
        if (typeof value === 'string') {
          // เช็คว่าเป็นค่าว่างหรือไม่ (ประกอบด้วยอักขระเว้นวรรคทั้งหมด)
          // \s คือ whitespace ทั้งหมด (รวม \t, \n, \r, space)
          if (/^\s*$/.test(value)) return false;
        }
        
        return true;
      })
      .map(key => {
        // แปลงค่า Array หรือ Object เป็น JSON string 
        let value = paramsCopy[key];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        // ไม่ต้อง URL encode ตอนสร้างลายเซ็น (ทำทีหลังตอนส่งข้อมูล)
        return `${key}=${value}`;
      })
      .join('&');
    
    // 3. นำ stringA มาต่อกับ key ตามรูปแบบ (stringSignTemp)
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น Flash Express:', stringSignTemp);
    
    // 4. คำนวณ SHA256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringSignTemp).digest('hex').toUpperCase();
    
    console.log('ลายเซ็น Flash Express ที่สร้าง:', signature);
    
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