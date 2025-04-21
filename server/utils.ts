/**
 * ฟังก์ชันยูทิลิตี้ต่างๆ
 */

import crypto from 'crypto';

/**
 * สร้าง ID ที่ไม่ซ้ำกัน
 * @param length ความยาวของ ID (ค่าเริ่มต้น: 10)
 * @returns ID ที่สร้างขึ้น
 */
export function generateUniqueId(length: number = 10): string {
  // สร้าง ID แบบสุ่มด้วย crypto
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
}

/**
 * สร้างเลขอ้างอิงสำหรับการเติมเงิน
 * @returns เลขอ้างอิงในรูปแบบ TOP-YYYYMMDD-XXXXX
 */
export function generateTopUpReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  return `TOP-${year}${month}${day}-${random}`;
}

/**
 * แปลงข้อความให้อยู่ในรูปแบบ Title Case
 * @param str ข้อความที่ต้องการแปลง
 * @returns ข้อความในรูปแบบ Title Case
 */
export function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * ตัดคำให้สั้นลงด้วยการเพิ่ม ellipsis
 * @param str ข้อความที่ต้องการตัด
 * @param maxLength ความยาวสูงสุดที่ต้องการ
 * @returns ข้อความที่ถูกตัดและเพิ่ม ellipsis
 */
export function truncateWithEllipsis(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}