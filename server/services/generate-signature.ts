/**
 * Flash Express API Signature Generator
 * ใช้สำหรับการสร้าง signature สำหรับ Flash Express API
 * อ้างอิงตามเอกสาร: https://flash-express.readme.io/v3/reference/signing-process
 */
import crypto from 'crypto';

/**
 * สร้าง signature สำหรับ Flash Express API
 * @param apiKey คีย์ลับที่ได้รับจาก Flash Express
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
    // 1. เรียงลำดับคีย์ของพารามิเตอร์ตามลำดับอักษร
    const sortedKeys = Object.keys(params).sort();
    
    // 2. สร้างสตริงในรูปแบบ key1=value1&key2=value2&...
    const stringToSign = sortedKeys
      .filter(key => params[key] !== undefined && params[key] !== null) // กรองเฉพาะค่าที่ไม่เป็น undefined หรือ null
      .map(key => {
        // แปลงค่า Array หรือ Object เป็น JSON string
        let value = params[key];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        return `${key}=${value}`;
      })
      .join('&');
    
    // 3. เพิ่ม nonceStr และ API key เข้าไป
    const finalString = `${stringToSign}&nonceStr=${nonceStr}&key=${apiKey}`;
    
    console.log('String to sign:', finalString);
    
    // 4. คำนวณ MD5 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('md5').update(finalString).digest('hex').toUpperCase();
    
    return signature;
  } catch (error) {
    console.error('Error generating Flash Express signature:', error);
    throw new Error('Failed to generate signature');
  }
}

/**
 * สร้าง nonce string สำหรับ Flash Express API
 * @returns nonce string ความยาวไม่เกิน 32 ตัวอักษร
 */
export function generateNonceStr(): string {
  // ใช้ timestamp ปัจจุบันร่วมกับตัวอักษรสุ่ม
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2, 10); // ตัวอักษรสุ่ม 8 ตัว
  
  return `${timestamp}${randomPart}`.substring(0, 32); // จำกัดความยาวไม่เกิน 32 ตัวอักษร
}