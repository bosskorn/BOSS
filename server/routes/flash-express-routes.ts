// Flash Express API Routes
import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../storage'; 
import { getShippingOptions, createShipment, trackShipment, testApi } from '../services/flash-express';

const router = express.Router();

/**
 * ดึงตัวเลือกการจัดส่งและราคาจาก Flash Express API
 * รับพารามิเตอร์: 
 * - fromPostalCode: รหัสไปรษณีย์ต้นทาง
 * - toPostalCode: รหัสไปรษณีย์ปลายทาง
 * - weight: น้ำหนักพัสดุ (กรัม)
 * - width, height, length: ขนาดพัสดุ (ซม.)
 */
router.get('/shipping/options', auth, async (req: Request, res: Response) => {
  try {
    const { fromPostalCode, toPostalCode, weight, width, height, length } = req.query;
    
    if (!fromPostalCode || !toPostalCode || !weight) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุรหัสไปรษณีย์ต้นทาง ปลายทาง และน้ำหนัก' 
      });
    }
    
    const packageDetails = {
      weight: String(weight),
      width: String(width || 10),
      height: String(height || 10),
      length: String(length || 10)
    };
    
    const originAddress = {
      postalCode: String(fromPostalCode)
    };
    
    const destinationAddress = {
      postalCode: String(toPostalCode)
    };
    
    const result = await getShippingOptions(originAddress, destinationAddress, packageDetails);
    
    return res.json({
      success: true,
      options: result
    });
    
  } catch (error: any) {
    console.error('Error getting shipping options:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตัวเลือกการจัดส่ง',
      error: error.message
    });
  }
});

/**
 * สร้างเลขพัสดุใหม่กับ Flash Express
 */
router.post('/shipping/create', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    // ตรวจสอบยอดเงินคงเหลือ
    if (parseFloat(user.balance) < 25) {
      return res.status(400).json({ 
        success: false, 
        message: 'ยอดเงินคงเหลือไม่เพียงพอ กรุณาเติมเงิน' 
      });
    }
    
    // อ่านข้อมูลจาก req.body
    const {
      outTradeNo,
      // ข้อมูลผู้รับ
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientProvince,
      recipientDistrict,
      recipientSubdistrict,
      recipientPostalCode,
      // ข้อมูลพัสดุ
      weight,
      width,
      height,
      length,
      parcelValue,
      remark,
      // ประเภทการจัดส่ง
      expressType,
      articleType
    } = req.body;
    
    if (!recipientName || !recipientPhone || !recipientAddress || !recipientPostalCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุข้อมูลผู้รับให้ครบถ้วน' 
      });
    }
    
    if (!weight) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุน้ำหนักพัสดุ' 
      });
    }
    
    // สร้างข้อมูลสำหรับ API
    const shipmentData = {
      outTradeNo: outTradeNo || `ORDER${Date.now()}`,
      // ข้อมูลผู้ส่ง (ข้อมูลจากผู้ใช้ในระบบ)
      srcName: user.fullname,
      srcPhone: user.phone,
      srcProvinceName: user.province,
      srcCityName: user.district,
      srcDistrictName: user.subdistrict,
      srcPostalCode: user.zipcode,
      srcDetailAddress: user.address,
      
      // ข้อมูลผู้รับ
      dstName: recipientName,
      dstPhone: recipientPhone,
      dstProvinceName: recipientProvince,
      dstCityName: recipientDistrict,
      dstDistrictName: recipientSubdistrict,
      dstPostalCode: recipientPostalCode,
      dstDetailAddress: recipientAddress,
      
      // ข้อมูลพัสดุ
      weight: String(weight * 1000), // แปลงจาก kg เป็น g
      width: String(width || 10),
      height: String(height || 10),
      length: String(length || 10),
      remark: remark || '',
      
      // สินค้าในพัสดุ
      items: [{
        itemName: 'สินค้า',
        itemQuantity: '1'
      }],
      
      // ประเภทการจัดส่ง
      parcelKind: '1', // 1=ทั่วไป
      expressCategory: expressType || '1', // 1=ปกติ, 2=ด่วน
      articleCategory: articleType || '2', // 2=อื่นๆ
      insured: parcelValue ? '1' : '0', // 1=มีประกัน, 0=ไม่มีประกัน
      insuranceAmount: parcelValue ? String(parcelValue) : '0',
      codEnabled: '0' // 0=ไม่มี COD
    };
    
    // เรียก API สร้างเลขพัสดุ
    const result = await createShipment(shipmentData);
    
    if (result.code !== 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'ไม่สามารถสร้างเลขพัสดุได้',
        error: result.message,
        data: result
      });
    }
    
    // ตัดเงินจากยอดเงินคงเหลือ (25 บาทต่อพัสดุ)
    const newBalance = parseFloat(user.balance) - 25;
    await storage.updateUserBalance(userId, String(newBalance));
    
    // บันทึกประวัติการตัดเงิน
    await storage.createFeeHistory({
      userId: userId,
      amount: '25.00',
      type: 'deduction',
      description: 'ค่าสร้างเลขพัสดุ Flash Express',
      trackingNumber: result.data.pno,
      createdAt: new Date(),
    });
    
    // บันทึกข้อมูลออเดอร์
    const order = await storage.createOrder({
      userId: userId,
      orderNumber: shipmentData.outTradeNo,
      trackingNumber: result.data.pno,
      providerName: 'Flash Express',
      senderName: user.fullname,
      senderPhone: user.phone,
      senderAddress: user.address,
      senderProvince: user.province,
      senderDistrict: user.district,
      senderSubdistrict: user.subdistrict,
      senderPostalCode: user.zipcode,
      recipientName: recipientName,
      recipientPhone: recipientPhone,
      recipientAddress: recipientAddress,
      recipientProvince: recipientProvince,
      recipientDistrict: recipientDistrict,
      recipientSubdistrict: recipientSubdistrict,
      recipientPostalCode: recipientPostalCode,
      status: 'pending',
      weight: String(weight),
      dimensions: JSON.stringify({
        width: width || 10,
        height: height || 10,
        length: length || 10
      }),
      subtotal: '25.00',
      totalAmount: '25.00',
      createdAt: new Date(),
      sortCode: result.data.sortCode || '',
      sourceData: JSON.stringify(result)
    });
    
    return res.json({
      success: true,
      message: 'สร้างเลขพัสดุสำเร็จ',
      data: {
        trackingNumber: result.data.pno,
        sortCode: result.data.sortCode,
        orderId: order.id,
        orderNumber: shipmentData.outTradeNo,
        remainingBalance: String(newBalance)
      }
    });
    
  } catch (error: any) {
    console.error('Error creating shipping:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสร้างเลขพัสดุ',
      error: error.message
    });
  }
});

/**
 * ติดตามสถานะพัสดุตามเลขติดตาม
 */
router.get('/tracking/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุเลขพัสดุ' 
      });
    }
    
    const result = await trackShipment(trackingNumber);
    
    return res.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการติดตามสถานะพัสดุ',
      error: error.message
    });
  }
});

export default router;