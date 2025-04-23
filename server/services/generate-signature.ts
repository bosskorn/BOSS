/**
 * ฟังก์ชันสร้างลายเซ็นสำหรับการทดสอบ (ไม่มีการเชื่อมต่อกับ Flash Express API จริง)
 */

/**
 * สร้าง nonceStr สำหรับ API request
 */
export function generateNonceStr(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * สร้างลายเซ็นจำลอง (ไม่มีการเชื่อมต่อกับ Flash Express API จริง)
 */
export function generateFlashExpressSignature(apiKey: string, params: Record<string, any>, nonceStr?: string): string {
  // สร้างลายเซ็นจำลอง (ใช้แทนการเชื่อมต่อกับ Flash Express API จริง)
  const dummySignature = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789';

  console.log('สร้างลายเซ็นจำลองสำหรับการทดสอบ (ไม่ใช่ลายเซ็นจริง)');

  return dummySignature;
}