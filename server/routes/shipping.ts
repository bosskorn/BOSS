import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  getFlashExpressShippingOptions,
  createFlashExpressShipping,
  getFlashExpressTrackingStatus
} from '../services/flash-express';
import { analyzeLongdoAddress } from '../services/longdo-map';

const router = express.Router();

/**
 * API สำหรับดึงตัวเลือกการจัดส่ง
 */
router.post('/options', auth, async (req: Request, res: Response) => {
  try {
    const { fromAddress, toAddress, packageInfo } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!fromAddress || !toAddress || !packageInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required information'
      });
    }
    
    // ดึงตัวเลือกการจัดส่ง
    const options = await getFlashExpressShippingOptions(
      fromAddress,
      toAddress,
      packageInfo
    );
    
    res.json({
      success: true,
      options
    });
  } catch (error: any) {
    console.error('Error getting shipping options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shipping options'
    });
  }
});

/**
 * API สำหรับสร้างการจัดส่งใหม่
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      senderInfo,
      receiverInfo,
      packageInfo,
      serviceId,
      codAmount = 0
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orderId || !senderInfo || !receiverInfo || !packageInfo || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required information'
      });
    }
    
    // สร้างการจัดส่ง
    const result = await createFlashExpressShipping(
      orderId,
      senderInfo,
      receiverInfo,
      packageInfo,
      serviceId,
      codAmount
    );
    
    if (result.success) {
      res.json({
        success: true,
        trackingNumber: result.trackingNumber,
        labelUrl: result.labelUrl
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to create shipping'
      });
    }
  } catch (error: any) {
    console.error('Error creating shipping:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create shipping'
    });
  }
});

/**
 * API สำหรับตรวจสอบสถานะการจัดส่ง
 */
router.get('/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }
    
    const status = await getFlashExpressTrackingStatus(trackingNumber);
    
    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track shipment'
    });
  }
});

/**
 * API สำหรับวิเคราะห์ที่อยู่โดยใช้ Longdo Map API
 */

router.post('/analyze-address', auth, async (req: Request, res: Response) => {
  try {
    const { fullAddress } = req.body;
    
    if (!fullAddress) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    // วิเคราะห์ที่อยู่โดยใช้ Longdo Map API
    const addressComponents = await analyzeLongdoAddress(fullAddress);
    
    res.json({
      success: true,
      address: addressComponents
    });
  } catch (error: any) {
    console.error('Error analyzing address:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze address'
    });
  }
});

export default router;