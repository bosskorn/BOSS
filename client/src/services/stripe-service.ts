import axios from 'axios';

/**
 * บริการสำหรับเชื่อมต่อกับ Stripe API
 */
const stripeService = {
  /**
   * สร้าง Checkout Session สำหรับการชำระเงินด้วยบัตรเครดิต/เดบิต
   * @param amount จำนวนเงินที่ต้องการชำระ
   * @returns ข้อมูล session และ URL สำหรับการชำระเงิน
   */
  async createCheckoutSession(amount: number): Promise<{ 
    success: boolean; 
    sessionId?: string; 
    url?: string; 
    error?: string;
  }> {
    try {
      const response = await axios.post('/api/stripe/create-checkout-session', {
        amount,
        successUrl: `${window.location.origin}/topup/success`,
        cancelUrl: `${window.location.origin}/topup/cancel`,
      }, {
        withCredentials: true,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          sessionId: response.data.sessionId,
          url: response.data.url,
        };
      } else {
        throw new Error('ไม่สามารถสร้าง Checkout Session ได้');
      }
    } catch (error: any) {
      console.error('Error creating Stripe checkout session:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการสร้าง Checkout Session',
      };
    }
  },

  /**
   * ตรวจสอบสถานะของ Checkout Session
   * @param sessionId ID ของ session ที่ต้องการตรวจสอบ
   * @returns ข้อมูลสถานะของ session
   */
  async getCheckoutSession(sessionId: string): Promise<{
    success: boolean;
    session?: any;
    topup?: any;
    error?: string;
  }> {
    try {
      const response = await axios.get(`/api/stripe/checkout-session/${sessionId}`, {
        withCredentials: true,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          session: response.data.session,
          topup: response.data.topup,
        };
      } else {
        throw new Error('ไม่สามารถดึงข้อมูล Checkout Session ได้');
      }
    } catch (error: any) {
      console.error('Error getting Stripe checkout session:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Checkout Session',
      };
    }
  },
};

export default stripeService;