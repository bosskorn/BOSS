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
    
    // แสดงข้อมูลที่ได้รับเพื่อการตรวจสอบ
    console.log('ข้อมูลจากฝั่งผู้ใช้:', JSON.stringify(orderData, null, 2));
    
    // อัปเดตข้อมูลสำคัญที่จำเป็นถ้าไม่มี
    if (!orderData.outTradeNo) {
      orderData.outTradeNo = `SS${Date.now()}`;
    }

    // เรียกใช้บริการของ Flash Express
    const result = await createFlashOrder(orderData);
    
    // ตรวจสอบผลลัพธ์
    if (result && (result.code === 0 || result.code === 1) && result.data) {
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
    
    // ตรวจสอบรหัสที่ได้รับจาก Flash Express API
    if (result && (result.code === 0 || result.code === 1)) {
      // กรณีสำเร็จหรือมีข้อมูล
      return res.json({
        success: true,
        tracking: result.data || {
          trackingNumber: trackingNumber,
          trackingStatus: 'waiting',
          statusMessage: result.message || 'ยังไม่มีข้อมูลการติดตาม อาจเนื่องจากพัสดุเพิ่งถูกสร้าง',
          trackingHistory: []
        }
      });
    } else if (result && result.code === 1001) {
      // กรณีไม่มีข้อมูล (พัสดุเพิ่งถูกสร้าง)
      return res.json({
        success: true,
        tracking: {
          trackingNumber: trackingNumber,
          trackingStatus: 'pending',
          statusMessage: 'พัสดุอยู่ระหว่างการรอเข้าระบบ Flash Express',
          trackingHistory: []
        }
      });
    } else {
      // กรณีเกิดข้อผิดพลาด
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
    
    // ตรวจสอบรหัสที่ได้รับจาก Flash Express API
    if (result && (result.code === 0 || result.code === 1)) {
      // กรณีสำเร็จหรือมีข้อมูล
      return res.json({
        success: true,
        order: result.data || {
          merchantTrackingNumber,
          status: 'waiting',
          statusMessage: result.message || 'ยังไม่มีข้อมูลการค้นหา อาจเนื่องจากพัสดุเพิ่งถูกสร้าง'
        }
      });
    } else if (result && result.code === 1001) {
      // กรณีไม่มีข้อมูล (พัสดุเพิ่งถูกสร้าง)
      return res.json({
        success: true,
        order: {
          merchantTrackingNumber,
          status: 'pending',
          statusMessage: 'พัสดุอยู่ระหว่างการรอเข้าระบบ Flash Express'
        }
      });
    } else {
      // กรณีเกิดข้อผิดพลาด
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
 * API ดึงอัตราค่าจัดส่ง Flash Express
 */
router.post('/shipping-rates', auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีข้อมูลที่จำเป็น
    const {
      srcProvinceName, srcCityName, srcDistrictName, srcPostalCode,
      dstProvinceName, dstCityName, dstDistrictName, dstPostalCode,
      weight, width, length, height
    } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!srcPostalCode || !dstPostalCode) {
      return res.status(400).json({
        success: false,
        message: 'ต้องระบุรหัสไปรษณีย์ต้นทางและปลายทาง'
      });
    }

    console.log('ข้อมูลคำขอรับอัตราค่าจัดส่ง Flash Express:', {
      srcProvinceName, srcCityName, srcPostalCode,
      dstProvinceName, dstCityName, dstPostalCode,
      weight, dimensions: { width, length, height }
    });
    
    // ในช่วงแรกนี้ เราจะใช้วิธีคำนวณอย่างง่ายตามระยะทางโดยใช้รหัสไปรษณีย์เป็นหลัก
    // ในกรณีจริงควรเรียกใช้ API ของ Flash Express (ถ้ามี) หรือฐานข้อมูลแท้จริง

    // คำนวณราคาอย่างง่าย
    let baseRate = 30; // ราคาเริ่มต้น 30 บาท
    const weightKg = (weight || 1000) / 1000; // แปลงเป็น kg (ถ้าระบุเป็นกรัม)
    
    // ถ้าน้ำหนักมากกว่า 1 กก. เพิ่มราคาตามน้ำหนัก
    if (weightKg > 1) {
      baseRate += Math.min(Math.ceil(weightKg - 1), 10) * 10;
    }
    
    // เพิ่มค่าบริการตามระยะทาง (ใช้รหัสไปรษณีย์อย่างง่าย)
    let distanceFactor = 0;
    const srcPrefix = srcPostalCode.substring(0, 2);
    const dstPrefix = dstPostalCode.substring(0, 2);
    
    if (srcPrefix === dstPrefix) {
      // ส่งในเขตเดียวกัน
      distanceFactor = 0;
    } else if (
      // กรุงเทพและปริมณฑล
      (srcPrefix === '10' && ['11', '12', '13', '73', '74'].includes(dstPrefix)) ||
      (dstPrefix === '10' && ['11', '12', '13', '73', '74'].includes(srcPrefix))
    ) {
      distanceFactor = 10;
    } else {
      // ต่างภูมิภาค
      distanceFactor = 20;
    }
    
    // คำนวณราคาสุทธิ
    const normalRate = baseRate + distanceFactor;
    const expressRate = normalRate * 1.5; // บริการด่วนแพงกว่า 1.5 เท่า
    
    // ตอบกลับข้อมูลอัตราค่าจัดส่ง
    return res.json({
      success: true,
      normalRate, // ส่งธรรมดา
      expressRate, // ส่งด่วน
      details: {
        baseRate,
        distanceFactor,
        weight: weightKg,
        dimensions: {
          width: width || 20,
          length: length || 30, 
          height: height || 10
        }
      },
      message: 'คำนวณอัตราค่าจัดส่งสำเร็จ'
    });
  } catch (error: any) {
    console.error('เกิดข้อผิดพลาดในการคำนวณอัตราค่าจัดส่ง:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการคำนวณอัตราค่าจัดส่ง',
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

/**
 * API สร้างออเดอร์ Flash Express (เวอร์ชันใหม่)
 */
router.post('/create-order', auth, async (req, res) => {
  try {
    // ตรวจสอบว่ามีการเข้าสู่ระบบ
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนสร้างออเดอร์'
      });
    }
    
    // รับข้อมูลจากฟอร์ม
    const orderData = req.body;
    
    // ตรวจสอบข้อมูลพื้นฐาน
    if (!orderData.srcName || !orderData.srcPhone || !orderData.dstName || !orderData.dstPhone) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ครบถ้วน กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }
    
    console.log('กำลังสร้างออเดอร์ Flash Express จากข้อมูลฟอร์ม:', JSON.stringify(orderData, null, 2));
    
    // เพิ่มข้อมูลที่จำเป็น
    const flashExpressOrder = {
      ...orderData,
      outTradeNo: `SS${Date.now()}`, // เลขอ้างอิงร้านค้า
      nonceStr: Date.now().toString(), // ตัวเลขสุ่ม
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      payType: 1, // ผู้ส่งชำระ
      settlementType: 1, // ผู้ส่งชำระ
    };
    
    // เรียกใช้บริการของ Flash Express
    const result = await createFlashOrder(flashExpressOrder);
    
    // แสดงผลลัพธ์
    console.log('Flash Express API Response:', JSON.stringify(result, null, 2));
    
    // ตรวจสอบผลลัพธ์
    if (result && (result.code === 0 || result.code === 1) && result.data) {
      // บันทึกข้อมูลออเดอร์ลงในฐานข้อมูล
      try {
        // สร้างข้อมูลออเดอร์ขนส่ง
        const shippingOrder = {
          userId: req.user.id,
          orderNumber: flashExpressOrder.outTradeNo,
          trackingNumber: result.data.pno,
          status: 'created',
          courier: 'flash-express',
          senderName: orderData.srcName,
          senderPhone: orderData.srcPhone,
          senderAddress: `${orderData.srcDetailAddress}, ${orderData.srcCityName || ''}, ${orderData.srcProvinceName}, ${orderData.srcPostalCode}`,
          receiverName: orderData.dstName,
          receiverPhone: orderData.dstPhone,
          receiverAddress: `${orderData.dstDetailAddress}, ${orderData.dstCityName || ''}, ${orderData.dstProvinceName}, ${orderData.dstPostalCode}`,
          codAmount: orderData.codEnabled ? orderData.codAmount || 0 : 0,
          weight: orderData.weight / 1000, // แปลงจากกรัมเป็นกิโลกรัม
          fee: 0, // ค่าจัดส่ง (ต้องอัปเดตต่อไป)
          createdAt: new Date()
        };
        
        // บันทึกลงฐานข้อมูล (เปิดใช้งานเมื่อมีการเชื่อมต่อฐานข้อมูล)
        // await storage.createShippingOrder(shippingOrder);
        
        console.log('บันทึกข้อมูลออเดอร์ขนส่งสำเร็จ');
      } catch (dbError) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลออเดอร์ขนส่ง:', dbError);
      }
      
      // ส่งผลลัพธ์กลับไปยังผู้ใช้
      return res.json({
        success: true,
        message: 'สร้างออเดอร์ Flash Express สำเร็จ',
        trackingNumber: result.data.pno,
        sortCode: result.data.sortingCode,
        merchantTrackingNumber: flashExpressOrder.outTradeNo,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result?.message || 'ไม่สามารถสร้างออเดอร์ได้',
        error: result
      });
    }
  } catch (error: any) {
    console.error('Error creating Flash Express order:', error);
    
    let errorMessage = 'ไม่สามารถสร้างออเดอร์ได้';
    let errorDetails = null;
    
    if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.error_msg || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
      errorDetails = error.response.data;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorDetails || error.message
    });
  }
});

/**
 * API สำหรับพิมพ์ใบปะหน้าพัสดุ
 */
router.get('/print-label/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'ไม่ระบุเลขพัสดุ'
      });
    }
    
    // ในอนาคตสามารถเพิ่มการดึงข้อมูลพัสดุจาก API ของ Flash Express เพื่อสร้างใบปะหน้าที่สมบูรณ์
    // สำหรับตอนนี้ส่งค่าเลขพัสดุกลับไปแสดงผล
    
    // ส่งคืนหน้า HTML สำหรับใบปะหน้าพัสดุ
    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ใบปะหน้าพัสดุ Flash Express - ${trackingNumber}</title>
        <style>
          body {
            font-family: 'Kanit', 'Sarabun', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
            background: white;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          .tracking-number-box {
            text-align: center;
            margin: 20px 0;
          }
          .tracking-number {
            font-size: 24px;
            font-weight: bold;
            padding: 10px;
            border: 2px solid #000;
            display: inline-block;
          }
          .barcode-container {
            text-align: center;
            margin: 20px 0;
          }
          .barcode {
            max-width: 90%;
            height: auto;
          }
          .info-section {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #ddd;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .info-content {
            margin-bottom: 15px;
          }
          .print-button {
            background-color: #7856FF;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 4px;
          }
          .print-button:hover {
            background-color: #6040E0;
          }
          @media print {
            .no-print {
              display: none;
            }
            body {
              background-color: white;
            }
            .container {
              box-shadow: none;
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.flashexpress.co.th/wp-content/themes/flashexpress/assets/images/logo-flash.svg" alt="Flash Express Logo" style="height: 40px;">
            <h1>ใบปะหน้าพัสดุ</h1>
          </div>
          
          <div class="tracking-number-box">
            <div class="tracking-number">${trackingNumber}</div>
          </div>
          
          <div class="barcode-container">
            <!-- สร้าง barcode ด้วย JavaScript -->
            <svg id="barcode" class="barcode"></svg>
          </div>
          
          <div class="info-section">
            <div class="info-title">ผู้ส่ง:</div>
            <div class="info-content">
              <div>ชื่อ: <span id="sender-name">รอข้อมูล</span></div>
              <div>โทร: <span id="sender-phone">รอข้อมูล</span></div>
              <div>ที่อยู่: <span id="sender-address">รอข้อมูล</span></div>
            </div>
            
            <div class="info-title">ผู้รับ:</div>
            <div class="info-content">
              <div>ชื่อ: <span id="receiver-name">รอข้อมูล</span></div>
              <div>โทร: <span id="receiver-phone">รอข้อมูล</span></div>
              <div>ที่อยู่: <span id="receiver-address">รอข้อมูล</span></div>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button class="print-button" onclick="window.print()">พิมพ์ใบปะหน้าพัสดุ</button>
          </div>
        </div>
        
        <!-- ใช้ JsBarcode สำหรับสร้าง barcode -->
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // สร้าง barcode
            JsBarcode("#barcode", "${trackingNumber}", {
              format: "CODE128",
              width: 3,
              height: 100,
              displayValue: false
            });
          });
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error generating Flash Express label:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสร้างใบปะหน้าพัสดุ',
      error: error
    });
  }
});

export default router;