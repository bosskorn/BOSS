/**
 * Flash Express Warehouse Routes
 * เส้นทาง API สำหรับจัดการข้อมูลคลังสินค้า Flash Express
 */

import express, { Request, Response } from 'express';
import { auth } from '../auth';
import { getWarehouses } from '../services/flash-express-warehouse';

const router = express.Router();

// เรียกดูข้อมูลคลังสินค้าทั้งหมด
router.get('/list', auth, async (req: Request, res: Response) => {
  try {
    console.log('Fetching warehouse list...');
    
    const warehouses = await getWarehouses();
    
    return res.json({
      success: true,
      warehouses
    });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคลังสินค้า',
      error: error.message
    });
  }
});

export default router;