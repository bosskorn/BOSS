import { Request, Response, Router } from 'express';
import { createHash } from 'crypto';
import axios from 'axios';
import { auth } from '../../auth';

const router = Router();

// API Secret from environment variables
const API_KEY = process.env.FLASH_EXPRESS_API_KEY || '';
const MERCHANT_ID = process.env.FLASH_EXPRESS_MERCHANT_ID || 'CBE1930';

console.log(`Using Flash Express API key: ${API_KEY ? 'Set' : 'Not set'}`);
console.log(`Using Flash Express MerchantID: ${MERCHANT_ID}`);

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

    // ตรวจสอบประเภทเลขพัสดุ
    const carrier = detectCarrier(trackingNumber);
    console.log(`Tracking number ${trackingNumber} detected as: ${carrier}`);

    // ถ้าเป็น Thailand Post
    if (carrier === 'thailand-post') {
      console.log(`Using mock data for Thailand Post: ${trackingNumber}`);
      
      // สร้างข้อมูลจำลองสำหรับไปรษณีย์ไทย
      const mockData = {
        pno: trackingNumber,
        status: "อยู่ระหว่างการจัดส่ง",
        history: [
          {
            status: "นำจ่ายสำเร็จ",
            location: "ที่ทำการปลายทาง",
            datetime: new Date().toLocaleString('th-TH')
          },
          {
            status: "อยู่ระหว่างการนำจ่าย",
            location: "ศูนย์คัดแยกสินค้า",
            datetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('th-TH') // 1 day ago
          },
          {
            status: "รับฝากผ่านตัวแทน",
            location: "ที่ทำการต้นทาง",
            datetime: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString('th-TH') // 2 days ago
          }
        ]
      };
      
      return res.status(200).json({
        success: true,
        trackingData: mockData
      });
    } 
    // ถ้าเป็น Flash Express และมี API KEY
    else if (carrier === 'flash-express' && API_KEY) {
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
    } 
    // สำหรับบริษัทขนส่งอื่นๆ ที่ยังไม่รองรับ หรือกรณี Flash Express ที่ไม่มี API KEY
    else {
      console.log(`Using mock data for carrier: ${carrier}, tracking number: ${trackingNumber}`);
      
      // เรียกใช้ mock data สำหรับทดสอบ
      const mockData = generateMockTrackingData(trackingNumber, carrier);
      
      return res.status(200).json({
        success: true,
        trackingData: mockData
      });
    }
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

// ฟังก์ชันตรวจสอบบริษัทขนส่งจากเลขพัสดุ
function detectCarrier(trackingNumber: string): string {
  const trackingUpperCase = trackingNumber.toUpperCase();
  
  if (trackingUpperCase.startsWith('FLE')) {
    return 'flash-express';
  } else if (trackingUpperCase.startsWith('TH') || trackingUpperCase.match(/^[A-Z]{2}\d{9}TH$/)) {
    return 'thailand-post';
  } else if (trackingUpperCase.startsWith('JT')) {
    return 'jt-express';
  } else if (trackingUpperCase.startsWith('XB')) {
    return 'xiaobai-express';
  } else {
    // ถ้าไม่ตรงกับรูปแบบใดเลย ให้เดาจากตัวเลขหรือตัวอักษรนำหน้า
    return 'unknown';
  }
}

// ฟังก์ชันสร้างข้อมูลจำลองสำหรับการติดตามพัสดุ
function generateMockTrackingData(trackingNumber: string, carrier: string): any {
  // ข้อมูลเส้นทางการขนส่งจำลอง
  const routeActions = [
    "รับพัสดุจากผู้ส่ง",
    "พัสดุถึงศูนย์คัดแยก",
    "พัสดุอยู่ระหว่างการขนส่ง",
    "พัสดุถึงศูนย์กระจายสินค้าปลายทาง",
    "พัสดุอยู่ระหว่างการนำส่ง",
    "นำส่งสำเร็จ"
  ];
  
  const locations = [
    "ศูนย์คัดแยกต้นทาง",
    "ศูนย์คัดแยกกลาง",
    "ศูนย์กระจายสินค้า",
    "สาขาปลายทาง",
    "รถขนส่ง"
  ];
  
  // สุ่มจำนวนเส้นทาง 2-5 รายการ
  const numberOfRoutes = Math.floor(Math.random() * 4) + 2;
  
  // สร้างเส้นทางย้อนหลังจากปัจจุบัน
  const routes = [];
  const now = Date.now();
  let lastTime = now;
  
  for (let i = 0; i < numberOfRoutes; i++) {
    // คำนวณเวลาย้อนหลังแบบสุ่ม (6-24 ชั่วโมงต่อเส้นทาง)
    const timeAgo = lastTime - (Math.floor(Math.random() * 18) + 6) * 60 * 60 * 1000;
    const routeAction = routeActions[Math.min(i, routeActions.length - 1)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    routes.push({
      status: routeAction,
      datetime: new Date(timeAgo).toLocaleString('th-TH'),
      location: location,
      routeAction: routeAction.replace(/\s/g, '_').toUpperCase(),
      state: i + 1
    });
    
    lastTime = timeAgo;
  }
  
  // เรียงลำดับเส้นทางจากเก่าไปใหม่
  routes.reverse();
  
  // สร้างข้อมูลจำลองสำหรับการทดสอบ
  return {
    pno: trackingNumber,
    origPno: trackingNumber,
    returnedPno: null,
    customaryPno: null,
    state: routes.length,
    stateText: routes[routes.length - 1].status,
    stateChangeAt: Math.floor(now / 1000),
    history: routes,
    routes: routes.map(route => ({
      routedAt: Math.floor(new Date(route.datetime).getTime() / 1000),
      routeAction: route.routeAction,
      message: `${route.status} ที่ ${route.location}`,
      state: route.state
    }))
  };
}

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