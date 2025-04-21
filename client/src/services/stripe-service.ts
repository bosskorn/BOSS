/**
 * บริการเชื่อมต่อกับ Stripe API สำหรับการชำระเงินด้วยบัตรเครดิต/เดบิต
 */
import axios from 'axios';

interface StripeSessionResponse {
  clientSecret: string;
  sessionId: string;
}

// สร้าง payment intent สำหรับการชำระเงินครั้งเดียว
export async function createPaymentIntent(amount: number): Promise<StripeSessionResponse> {
  try {
    const response = await axios.post('/api/stripe/create-payment-intent', {
      amount
    }, {
      withCredentials: true
    });
    
    if (response.data && response.data.success) {
      return {
        clientSecret: response.data.clientSecret,
        sessionId: response.data.sessionId
      };
    } else {
      throw new Error('ไม่สามารถสร้าง payment intent ได้');
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้าง payment intent:', error);
    throw error;
  }
}

// ตรวจสอบสถานะการชำระเงิน
export async function checkPaymentStatus(sessionId: string): Promise<boolean> {
  try {
    const response = await axios.get(`/api/stripe/check-payment/${sessionId}`, {
      withCredentials: true
    });
    
    if (response.data && response.data.success) {
      return response.data.paid;
    } else {
      return false;
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการชำระเงิน:', error);
    return false;
  }
}

// ยกเลิกการชำระเงิน
export async function cancelPayment(sessionId: string): Promise<boolean> {
  try {
    const response = await axios.post(`/api/stripe/cancel-payment/${sessionId}`, {}, {
      withCredentials: true
    });
    
    return response.data && response.data.success;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน:', error);
    return false;
  }
}