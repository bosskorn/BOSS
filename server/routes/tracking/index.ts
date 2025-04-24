import { Request, Response, Router } from 'express';
import { createHash } from 'crypto';
import axios from 'axios';
import { auth } from '../../auth';

const router = Router();

// API Secret
const API_KEY = 'your-flash-express-api-key';
const MERCHANT_ID = 'CBE1930';

// สร้าง signature สำหรับ API Flash Express
function createSignature(params: Record<string, any>, apiKey: string): string {
  // เรียงลำดับ keys ตามตัวอักษร
  const keys = Object.keys(params).sort();
  
  // สร้าง query string
  let signStr = '';
  for (const key of keys) {
    signStr += `${key}=${params[key]}&`;
  }
  
  // ตัด & ตัวสุดท้ายออก
  signStr = signStr.substring(0, signStr.length - 1);
  
  // เพิ่ม apiKey
  signStr += apiKey;
  
  // สร้าง signature ด้วย SHA-256
  return createHash('sha256').update(signStr).digest('hex').toUpperCase();
}

/**
 * ตรวจสอบสถานะการจัดส่งพัสดุ
 */
router.get('/status/:trackingNumber', auth, async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขพัสดุ'
      });
    }
    
    // สร้าง parameters ตามที่ Flash Express ต้องการ
    const timestamp = Date.now().toString();
    const params = {
      mchId: MERCHANT_ID,
      nonceStr: timestamp
    };
    
    // สร้าง signature
    const sign = createSignature(params, API_KEY);
    
    // สร้าง url params สำหรับส่งไปที่ Flash Express API
    const queryString = `mchId=${params.mchId}&nonceStr=${params.nonceStr}&sign=${sign}`;
    
    // ทำการเรียก API
    const response = await axios.post(
      `https://open-api.flashexpress.com/open/v1/orders/${trackingNumber}/routes`,
      queryString,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );
    
    // ถ้าได้รับข้อมูลสำเร็จ
    if (response.data && response.data.code === 1) {
      return res.status(200).json({
        success: true,
        trackingData: response.data.data
      });
    }
    
    // กรณี API ส่งข้อมูลกลับมาแต่ไม่สำเร็จ
    return res.status(200).json({
      success: false,
      message: response.data.message || 'ไม่พบข้อมูลการจัดส่ง',
      code: response.data.code
    });
    
  } catch (error: any) {
    console.error('Error tracking package:', error);
    
    // ตรวจสอบ error response จาก Flash Express API
    if (error.response && error.response.data) {
      return res.status(500).json({
        success: false,
        message: `การตรวจสอบสถานะล้มเหลว: ${error.response.data.message || 'ไม่สามารถตรวจสอบสถานะได้'}`,
        code: error.response.data.code
      });
    }
    
    return res.status(500).json({
      success: false,
      message: `การตรวจสอบสถานะล้มเหลว: ${error.message || 'ไม่สามารถตรวจสอบสถานะได้'}`
    });
  }
});

// สร้างข้อมูลการติดตามแบบจำลอง (mock data) สำหรับการทดสอบ
router.get('/status-mock/:trackingNumber', auth, async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขพัสดุ'
      });
    }
    
    // สร้างข้อมูลจำลองสำหรับการทดสอบ
    const mockData = {
      pno: trackingNumber,
      origPno: trackingNumber,
      returnedPno: null,
      customaryPno: null,
      state: 3,
      stateText: "กำลังนำส่ง",
      stateChangeAt: Math.floor(Date.now() / 1000) - 3600,
      routes: [
        {
          routedAt: Math.floor(Date.now() / 1000) - 3600,
          routeAction: "DELIVERY_TICKET_CREATION_SCAN",
          message: "มีพัสดุรอการนำส่ง กรุณารอการติดต่อจากเจ้าหน้าที่ Flash Express",
          state: 3
        },
        {
          routedAt: Math.floor(Date.now() / 1000) - 7200,
          routeAction: "SHIPMENT_WAREHOUSE_SCAN",
          message: "พัสดุของคุณอยู่ที่ กทม. จะถูกส่งไปยัง จตุโชติ-DC",
          state: 2
        },
        {
          routedAt: Math.floor(Date.now() / 1000) - 10800,
          routeAction: "RECEIVED",
          message: "พนักงานเข้ารับพัสดุแล้ว",
          state: 1
        }
      ]
    };
    
    return res.status(200).json({
      success: true,
      trackingData: mockData
    });
    
  } catch (error: any) {
    console.error('Error generating mock data:', error);
    
    return res.status(500).json({
      success: false,
      message: `การตรวจสอบสถานะล้มเหลว: ${error.message || 'เกิดข้อผิดพลาด'}`
    });
  }
});

export default router;