/**
 * เส้นทาง API สำหรับการจัดส่ง - ฉบับแก้ไขเพื่อรองรับการปรับปรุง Flash Express API
 */
import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { 
  getFlashExpressShippingOptions,
  createFlashExpressShipping
} from '../services/flash-express-fixed';

const router = express.Router();

// ตัวเลือกการจัดส่งเริ่มต้น สำหรับกรณีที่ API ไม่ทำงาน
interface ShippingOption {
  id: number;
  name: string;
  price: number;
  deliveryTime: string;
  provider: string;
  serviceId: string;
  logo?: string;
}

function getDefaultShippingOptions(): ShippingOption[] {
  return [
    {
      id: 1,
      name: 'Flash Express - ส่งด่วน',
      price: 60,
      deliveryTime: '1-2 วัน',
      provider: 'Flash Express',
      serviceId: 'FLASH-FAST',
      logo: '/assets/flash-express.png'
    },
    {
      id: 2,
      name: 'Flash Express - ส่งธรรมดา',
      price: 40,
      deliveryTime: '2-3 วัน',
      provider: 'Flash Express',
      serviceId: 'FLASH-NORMAL',
      logo: '/assets/flash-express.png'
    }
  ];
}

// POST /api/shipping-fixed/options
router.post('/options', authMiddleware, async (req, res) => {
  try {
    const { address, weight } = req.body;
    
    console.log('Shipping API request received:', {
      address,
      weight,
    });
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!address?.zipcode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required zipcode in address'
      });
    }
    
    // ดึงข้อมูลตัวเลือกการจัดส่งจาก Flash Express
    let options: ShippingOption[] = [];
    
    try {
      options = await getFlashExpressShippingOptions(
        {
          province: 'กรุงเทพมหานคร', // ค่าเริ่มต้นสำหรับต้นทาง
          district: 'คลองเตย',
          subdistrict: 'คลองเตย',
          zipcode: '10110'
        },
        {
          province: address?.province || 'กรุงเทพมหานคร',
          district: address?.district || 'พระนคร',
          subdistrict: address?.subdistrict || '',
          zipcode: address?.zipcode
        },
        {
          weight: weight || 1, // กิโลกรัม
          width: 10, // ซม.
          length: 10, // ซม.
          height: 10 // ซม.
        }
      );
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API:', error.message);
      
      // ใช้ข้อมูลเริ่มต้นแทนในกรณีที่ API ล้มเหลว
      console.log('ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น');
      options = getDefaultShippingOptions();
    }
    
    return res.status(200).json({
      success: true,
      options: options
    });
  } catch (error: any) {
    console.error('Error getting shipping options:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get shipping options'
    });
  }
});

// POST /api/shipping-fixed/create
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { 
      orderNumber, 
      shippingOption, 
      sender,
      recipient,
      packageInfo,
      codAmount
    } = req.body;
    
    console.log('Create shipping request received:', {
      orderNumber,
      shippingOption,
      sender: { ...sender, phone: '******' }, // ปกปิดเบอร์โทรสำหรับ logging
      recipient: { ...recipient, phone: '******' }, // ปกปิดเบอร์โทรสำหรับ logging
      packageInfo,
      codAmount
    });
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orderNumber || !sender || !recipient || !packageInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for shipping creation'
      });
    }
    
    if (!sender.name || !sender.phone || !sender.province || !sender.district || !sender.zipcode || !sender.address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required sender information'
      });
    }
    
    if (!recipient.name || !recipient.phone || !recipient.province || !recipient.district || !recipient.zipcode || !recipient.address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required recipient information'
      });
    }
    
    // สร้างพัสดุใหม่กับ Flash Express
    try {
      // แปลงข้อมูลในรูปแบบที่ Flash Express API ต้องการ
      const flashExpressOrderData = {
        outTradeNo: orderNumber,
        srcName: sender.name,
        srcPhone: sender.phone,
        srcProvinceName: sender.province,
        srcCityName: sender.district,
        srcDistrictName: sender.subdistrict || '',
        srcPostalCode: sender.zipcode,
        srcDetailAddress: sender.address,
        dstName: recipient.name,
        dstPhone: recipient.phone,
        dstHomePhone: recipient.homePhone || '',
        dstProvinceName: recipient.province,
        dstCityName: recipient.district,
        dstDistrictName: recipient.subdistrict || '',
        dstPostalCode: recipient.zipcode,
        dstDetailAddress: recipient.address,
        articleCategory: 1, // 1: เสื้อผ้า (ค่าเริ่มต้น)
        expressCategory: shippingOption?.serviceId === 'FLASH-FAST' ? 1 : 2, // 1: ด่วน, 2: ปกติ
        weight: Math.round(packageInfo.weight * 1000), // แปลงจาก กก. เป็น กรัม
        width: Math.round(packageInfo.width || 10),
        length: Math.round(packageInfo.length || 10),
        height: Math.round(packageInfo.height || 10),
        insured: packageInfo.insured ? 1 : 0,
        insureDeclareValue: packageInfo.insuredValue ? Math.round(packageInfo.insuredValue * 100) : undefined, // แปลงเป็นสตางค์
        codEnabled: codAmount > 0 ? 1 : 0,
        codAmount: codAmount > 0 ? Math.round(codAmount * 100) : undefined, // แปลงเป็นสตางค์
        remark: packageInfo.remark || 'ส่งด่วนม่วงสะดุด!',
        subItemTypes: [
          {
            itemName: packageInfo.productName || 'สินค้า',
            itemWeightSize: `${packageInfo.weight || 1}kg`,
            itemColor: packageInfo.productColor || '-',
            itemQuantity: packageInfo.quantity || 1
          }
        ]
      };
      
      // เรียกใช้ Flash Express API
      const result = await createFlashExpressShipping(flashExpressOrderData);
      
      if (result.success) {
        return res.status(201).json({
          success: true,
          trackingNumber: result.trackingNumber,
          sortCode: result.sortCode,
          message: 'Shipping created successfully'
        });
      } else {
        // ส่งกลับข้อผิดพลาดที่ได้จาก Flash Express API
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to create shipping with Flash Express'
        });
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการสร้างการจัดส่งกับ Flash Express:', error);
      
      return res.status(500).json({
        success: false,
        message: `Error creating shipping: ${error.message}`
      });
    }
  } catch (error: any) {
    console.error('Error handling shipping creation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process shipping creation'
    });
  }
});

export default router;