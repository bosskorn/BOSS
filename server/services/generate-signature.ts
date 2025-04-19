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
    // ลบฟิลด์ sign และ subItemTypes ออกก่อน (ถ้ามี) เพราะไม่รวมในการคำนวณลายเซ็น
    const { sign, subItemTypes, ...dataForSignature } = params;
    
    // 1. เรียงลำดับคีย์ของพารามิเตอร์ตามลำดับอักษร ASCII
    const sortedKeys = Object.keys(dataForSignature).sort();
    
    // 2. สร้างสตริง stringA ในรูปแบบ key1=value1&key2=value2&...
    const stringA = sortedKeys
      .filter(key => {
        // กรองเฉพาะค่าที่ไม่เป็น undefined, null หรือ ค่าว่าง (whitespace)
        const value = dataForSignature[key];
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      })
      .map(key => {
        // แปลงค่า Array หรือ Object เป็น JSON string (ไม่ควรมี เพราะ subItemTypes ถูกลบออกไปแล้ว)
        let value = dataForSignature[key];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        return `${key}=${value}`;
      })
      .join('&');
    
    // 3. นำ stringA มาต่อกับ key ตามรูปแบบ (stringSignTemp)
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('String to sign (stringSignTemp):', stringSignTemp);
    
    // 4. คำนวณ SHA256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const signature = crypto.createHash('sha256').update(stringSignTemp).digest('hex').toUpperCase();
    
    console.log('ลายเซ็นที่สร้าง:', signature);
    
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
  const randomPart = Math.random().toString(36).substring(2, 15); // ตัวอักษรสุ่ม
  
  return `${timestamp}${randomPart}`.substring(0, 32); // จำกัดความยาวไม่เกิน 32 ตัวอักษร
}