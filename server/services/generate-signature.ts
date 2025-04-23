
/**
 * ฟังก์ชันสร้างลายเซ็นสำหรับการทดสอบ (แบบจำลอง)
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
 * สร้างลายเซ็นจำลอง (แบบจำลอง)
 */
export function generateSignature(apiKey: string, params: Record<string, any>, nonceStr?: string): string {
  // สร้างลายเซ็นจำลอง
  const dummySignature = 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789';
  
  console.log('สร้างลายเซ็นจำลองสำหรับการทดสอบ');
  
  return dummySignature;
}
