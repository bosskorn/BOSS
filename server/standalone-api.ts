/**
 * Standalone API Route
 * สร้าง Express server แยกต่างหากเพื่อจัดการกับการเรียก API โดยไม่มีการแทรกแซงจาก Vite
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ตั้งค่า CORS ให้อนุญาตทุก origin และส่ง credentials
app.use(cors({
  origin: true, // อนุญาตทุก origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

// ทดสอบเส้นทาง API พื้นฐาน
app.get('/json-test', async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      message: 'ทดสอบส่ง JSON สำเร็จ',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด',
      error: error.message
    });
  }
});

// Flash Express API endpoints

/**
 * สร้าง signature สำหรับ Flash Express API
 */
function createSignature(params: Record<string, any>, apiKey: string): string {
  // เรียงลำดับ key ตามตัวอักษร
  const sortedKeys = Object.keys(params).sort();
  // สร้าง string เพื่อใช้ในการ hash
  const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  // สร้าง signature ด้วย MD5
  return crypto.createHash('md5').update(`${signStr}&key=${apiKey}`).digest('hex').toLowerCase();
}

/**
 * เรียกดูข้อมูลคลังสินค้า
 */
app.get('/warehouses', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    const mchId = process.env.FLASH_EXPRESS_MCH_ID;
    
    if (!apiKey || !mchId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบ API key หรือ Merchant ID สำหรับ Flash Express'
      });
    }
    
    // สร้างพารามิเตอร์สำหรับ API
    const params = {
      mchId: mchId,
      nonceStr: Math.random().toString(36).substring(2, 15),
      timestamp: Math.floor(Date.now() / 1000).toString()
    };
    
    // สร้าง signature
    const sign = createSignature(params, apiKey);
    
    // เพิ่ม signature เข้าไปในพารามิเตอร์
    const requestParams = {
      ...params,
      sign: sign
    };
    
    // ส่งคำขอไปยัง Flash Express API
    const response = await axios.get('https://cnapi-sl.flashexpress.com/open/v1/warehouses', {
      params: requestParams,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    return res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    
    const responseData = error.response?.data || {};
    const status = error.response?.status || 500;
    
    return res.status(status).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเรียกดูข้อมูลคลังสินค้า',
      error: error.message,
      data: responseData
    });
  }
});

/**
 * ร้องขอรถเข้ารับพัสดุ
 */
app.post('/request-pickup', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    const mchId = process.env.FLASH_EXPRESS_MCH_ID;
    
    if (!apiKey || !mchId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบ API key หรือ Merchant ID สำหรับ Flash Express'
      });
    }
    
    const {
      warehouseNo,
      pickupDate,
      quantity,
      remark
    } = req.body;
    
    if (!warehouseNo || !pickupDate || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุข้อมูลให้ครบถ้วน'
      });
    }
    
    // สร้างพารามิเตอร์สำหรับ API
    const params = {
      mchId,
      nonceStr: Math.random().toString(36).substring(2, 15),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      warehouseNo,
      pickupDate,
      quantity: quantity.toString(),
      remark: remark || ''
    };
    
    // สร้าง signature
    const sign = createSignature(params, apiKey);
    
    // ส่งคำขอไปยัง Flash Express API
    const response = await axios.post('https://cnapi-sl.flashexpress.com/open/v1/notify', 
      { ...params, sign },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    console.error('Error requesting pickup:', error);
    
    const responseData = error.response?.data || {};
    const status = error.response?.status || 500;
    
    return res.status(status).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการร้องขอรถเข้ารับพัสดุ',
      error: error.message,
      data: responseData
    });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone API server running on port ${PORT}`);
});