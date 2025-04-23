/**
 * API Test Routes
 * เส้นทาง API สำหรับทดสอบการเข้าถึง API ภายนอกเบื้องต้น
 */

import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// ทดสอบการส่ง API แบบ JSON พื้นฐาน
router.get('/json-test', async (req: Request, res: Response) => {
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

// ทดสอบเรียกข้อมูลจาก API ภายนอก
router.get('/external-api-test', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1', {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    return res.json({
      success: true,
      message: 'ทดสอบเรียกข้อมูลจาก API ภายนอกสำเร็จ',
      timestamp: new Date().toISOString(),
      data: response.data
    });
  } catch (error: any) {
    console.error('Error calling external API:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเรียกข้อมูลจาก API ภายนอก',
      error: error.message
    });
  }
});

export default router;