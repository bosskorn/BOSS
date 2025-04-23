/**
 * API routes สำหรับบริการ Flash Express
 */
import { Router } from 'express';
import { auth } from '../auth';
import { 
  createFlashOrder, 
  trackFlashOrder, 
  findByMerchantTracking 
} from '../services/flash-express';
import { storage } from '../storage';

const router = Router();

/**
 * API สร้างออเดอร์ Flash Express
 */
router.post('/shipping', auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีข้อมูล
    if (!req.body.orderData) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลคำสั่งซื้อ'
      });
    }

    const { orderData } = req.body;
    
    // อัปเดตข้อมูลสำคัญที่จำเป็นถ้าไม่มี
    if (!orderData.outTradeNo) {
      orderData.outTradeNo = `SS${Date.now()}`;
    }

    // เรียกใช้บริการของ Flash Express
    const result = await createFlashOrder(orderData);
    
    // ตรวจสอบผลลัพธ์
    if (result && result.code === 0 && result.data) {
      // บันทึกข้อมูลออเดอร์ลงในฐานข้อมูล
      if (req.user && req.user.id) {
        try {
          // สร้างข้อมูลออเดอร์ขนส่ง
          const shippingOrder = {
            userId: req.user.id,
            orderNumber: orderData.outTradeNo,
            trackingNumber: result.data.trackingNumber || '',
            sortCode: result.data.sortCode || '',
            customerName: orderData.dstName,
            customerPhone: orderData.dstPhone,
            shippingAddress: orderData.dstDetailAddress,
            shippingProvince: orderData.dstProvinceName,
            shippingDistrict: orderData.dstCityName,
            shippingSubdistrict: orderData.dstDistrictName || '',
            shippingZipcode: orderData.dstPostalCode,
            status: 'pending',
            provider: 'flash-express',
            rawResponse: JSON.stringify(result)
          };
          
          // บันทึกลงในฐานข้อมูล
          // ต้องเพิ่มข้อมูลที่จำเป็นตามโครงสร้างของตาราง
          const orderWithRequiredFields = {
            ...shippingOrder,
            subtotal: '0',
            totalAmount: '0',
            // เพิ่มข้อมูลอื่นๆ ที่จำเป็นตามความเหมาะสม
          };
          
          await storage.createOrder(orderWithRequiredFields);
        } catch (dbError) {
          console.error('Error saving Flash Express order to database:', dbError);
          // ไม่ return error เนื่องจากออเดอร์ถูกสร้างสำเร็จแล้วที่ Flash Express
        }
      }
      
      // ส่งผลลัพธ์กลับไปยังผู้ใช้
      return res.json({
        success: true,
        message: 'สร้างออเดอร์สำเร็จ',
        trackingNumber: result.data.trackingNumber,
        sortCode: result.data.sortCode,
        data: result.data
      });
    } else {
      // กรณีมีข้อผิดพลาดจาก Flash Express API
      return res.status(400).json({
        success: false,
        message: result.message || 'ไม่สามารถสร้างออเดอร์ได้',
        error: result
      });
    }
  } catch (error: any) {
    console.error('Error creating Flash Express order:', error);
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการสร้างออเดอร์',
      error: error.response?.data || error.message
    });
  }
});

/**
 * API ติดตามสถานะพัสดุ Flash Express
 */
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'ไม่ระบุเลขพัสดุ'
      });
    }
    
    const result = await trackFlashOrder(trackingNumber);
    
    if (result && result.code === 0) {
      return res.json({
        success: true,
        tracking: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'ไม่สามารถติดตามพัสดุได้',
        error: result
      });
    }
  } catch (error: any) {
    console.error('Error tracking Flash Express parcel:', error);
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการติดตามพัสดุ',
      error: error.response?.data || error.message
    });
  }
});

/**
 * API ค้นหาพัสดุด้วย Merchant Tracking (เลขอ้างอิงร้านค้า)
 */
router.get('/find-by-merchant-tracking/:merchantTrackingNumber', async (req, res) => {
  try {
    const { merchantTrackingNumber } = req.params;
    
    if (!merchantTrackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'ไม่ระบุเลขอ้างอิงร้านค้า'
      });
    }
    
    const result = await findByMerchantTracking(merchantTrackingNumber);
    
    if (result && result.code === 0) {
      return res.json({
        success: true,
        order: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'ไม่พบข้อมูลพัสดุจากเลขอ้างอิงร้านค้า',
        error: result
      });
    }
  } catch (error: any) {
    console.error('Error finding Flash Express order by merchant tracking:', error);
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการค้นหาพัสดุ',
      error: error.response?.data || error.message
    });
  }
});

export default router;