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
    // สร้างชุดข้อมูลใหม่ ไม่รวม sign และ subItemTypes
    const paramsCopy: Record<string, any> = {};
    
    // วนลูปผ่านทุกคีย์ในออบเจกต์แบบเดิม
    for (const key in params) {
      // ข้ามฟิลด์ sign และ subItemTypes
      if (key === 'sign' || key === 'subItemTypes') continue;
      
      const value = params[key];
      
      // ตรวจสอบค่าว่างตามเอกสาร Flash Express
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && /^\s*$/.test(value)) continue;
      
      // เพิ่มคีย์-ค่าทีผ่านเงื่อนไขเข้าไปในชุดข้อมูลใหม่
      paramsCopy[key] = value;
    }
    
    // 1. จัดเรียงคีย์ตามลำดับ ASCII
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    // 2. สร้างสตริง stringA
    const paramsArray: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsCopy[key];
      
      // แปลงค่า Array หรือ Object เป็น JSON string หากจำเป็น
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      paramsArray.push(`${key}=${value}`);
    }
    
    const stringA = paramsArray.join('&');
    
    // 3. สร้าง stringSignTemp ตามเอกสาร
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    // Debug
    console.log('ข้อมูลที่ใช้สร้างลายเซ็น Flash Express:', stringSignTemp);
    
    // 4. คำนวณ SHA256 hash และแปลงเป็นตัวพิมพ์ใหญ่
    const hash = crypto.createHash('sha256');
    hash.update(stringSignTemp);
    const signature = hash.digest('hex').toUpperCase();
    
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