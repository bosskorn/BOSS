/**
 * API routes สำหรับบริการ Flash Express
 */
import { Router } from 'express';
import { auth } from '../auth';
import { 
  createFlashOrder, 
  trackFlashOrder, 
  findByMerchantTracking,
  testSignatureWithExampleData
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
          
          // แทนที่จะบันทึกลงในฐานข้อมูลโดยตรง เราจะบันทึกประวัติการทำรายการสำเร็จ
          console.log('Order created successfully with Flash Express:', {
            orderNumber: orderData.outTradeNo,
            trackingNumber: result.data.trackingNumber || '',
            userId: req.user.id
          });
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

/**
 * API ทดสอบการเชื่อมต่อกับ Flash Express API
 */
router.get('/test', async (req, res) => {
  try {
    const testResult = testSignatureWithExampleData();
    res.json({
      success: true,
      test: testResult,
      env: {
        merchantId: process.env.FLASH_EXPRESS_MERCHANT_ID ? 'configured' : 'missing',
        apiKeyStatus: process.env.FLASH_EXPRESS_API_KEY ? 'configured' : 'missing',
        apiKeyLength: process.env.FLASH_EXPRESS_API_KEY ? process.env.FLASH_EXPRESS_API_KEY.length : 0
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ',
      error: error.message
    });
  }
});

/**
 * API ทดสอบพื้นที่ให้บริการของ Flash Express
 */
router.post('/validate-area', async (req, res) => {
  try {
    const { postalCode, provinceName, cityName } = req.body;
    
    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!postalCode && !provinceName && !cityName) {
      return res.status(400).json({ 
        success: false, 
        message: 'ต้องระบุรหัสไปรษณีย์ จังหวัด หรืออำเภอ อย่างน้อยหนึ่งอย่าง' 
      });
    }
    
    // ทดลองตรวจสอบกับข้อมูลที่ทราบว่าถูกต้องแน่นอน
    const knownValidAreas = [
      { postalCode: '10230', provinceName: 'กรุงเทพมหานคร', cityName: 'ลาดพร้าว', isValid: true },
      { postalCode: '10400', provinceName: 'กรุงเทพมหานคร', cityName: 'พญาไท', isValid: true },
      { postalCode: '10310', provinceName: 'กรุงเทพมหานคร', cityName: 'ห้วยขวาง', isValid: true },
      { postalCode: '50000', provinceName: 'เชียงใหม่', cityName: 'เมืองเชียงใหม่', isValid: true }
    ];
    
    // ตรวจสอบว่าข้อมูลที่ส่งมาตรงกับข้อมูลที่ทราบว่าถูกต้องหรือไม่
    const matchingArea = knownValidAreas.find(area => {
      if (postalCode && area.postalCode === postalCode) return true;
      if (provinceName && cityName && 
          area.provinceName === provinceName && 
          area.cityName === cityName) return true;
      return false;
    });
    
    // ตอบกลับผลการตรวจสอบ
    if (matchingArea) {
      return res.json({ 
        success: true, 
        isValid: true,
        message: 'พื้นที่ให้บริการถูกต้อง สามารถจัดส่งได้',
        area: {
          postalCode: matchingArea.postalCode,
          provinceName: matchingArea.provinceName,
          cityName: matchingArea.cityName
        }
      });
    } else {
      return res.json({ 
        success: true, 
        isValid: false,
        message: 'พื้นที่นี้อาจไม่อยู่ในเขตให้บริการของ Flash Express หรือข้อมูลไม่ถูกต้อง',
        suggestion: 'กรุณาตรวจสอบข้อมูลให้ถูกต้อง หรือติดต่อ Flash Express โดยตรง'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;