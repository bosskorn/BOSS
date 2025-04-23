/**
 * CORS Proxy Route
 * เส้นทาง API สำหรับ proxy การเรียก Flash Express API เพื่อแก้ปัญหา CORS
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ตรวจสอบว่ามีการตั้งค่า API key และ MerchantID หรือไม่
router.get('/check-credentials', (req: Request, res: Response) => {
  try {
    const mchId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    
    if (!mchId || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Flash Express credentials not found'
      });
    }
    
    return res.json({
      success: true,
      mchId,
      hasApiKey: !!apiKey
    });
  } catch (error: any) {
    console.error('Error checking credentials:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด',
      error: error.message
    });
  }
});

// เรียกข้อมูลคลังสินค้า
router.get('/warehouses', async (req: Request, res: Response) => {
  try {
    const { params } = req.query;
    if (!params) {
      return res.status(400).json({
        success: false,
        message: 'Missing params'
      });
    }
    
    // แปลง params จาก string เป็น object
    const requestParams = JSON.parse(params as string);
    
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
    console.error('Error calling Flash Express API:', error);
    
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

// ร้องขอรถเข้ารับพัสดุ
router.post('/request-pickup', async (req: Request, res: Response) => {
  try {
    const { params } = req.body;
    if (!params) {
      return res.status(400).json({
        success: false,
        message: 'Missing params'
      });
    }
    
    // ส่งคำขอไปยัง Flash Express API
    const response = await axios.post('https://cnapi-sl.flashexpress.com/open/v1/notify', 
      params,
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

export default router;