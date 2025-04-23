import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  getFlashExpressShippingOptions,
  createFlashShipment as createFlashExpressShipping,
  trackFlashShipment as getFlashExpressTrackingStatus,
  testFlashApi,
  findOrderByMerchantTrackingNumber
} from '../services/flash-express';
import axios from 'axios';
import crypto from 'crypto';
import { generateFlashExpressSignature, generateNonceStr } from '../services/generate-signature';

const router = express.Router();

/**
 * API สำหรับดึงตัวเลือกการจัดส่ง
 */
router.post('/options', auth, async (req: Request, res: Response) => {
  try {
    const { address, weight } = req.body;

    // ส่งข้อความรายละเอียดเพื่อให้เข้าใจขั้นตอนการทำงาน
    console.log('Shipping API request received:', req.body);

    // สำหรับการทดสอบ: แม้ข้อมูลจะไม่ครบ ให้ตอบกลับด้วยข้อมูลจำลองเสมอ
    // ในสภาพแวดล้อมจริงควรเปิดการตรวจสอบนี้
    /*
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required information'
      });
    }
    */

    // ประกาศข้อมูลตัวเลือกการจัดส่งเริ่มต้น - เฉพาะบริการของ Flash Express
    const defaultOptions = [
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

    try {
      // พยายามดึงข้อมูลจาก API จริง (ถ้ามี)
      if (address && address.province) {
        // ดึงตัวเลือกการจัดส่งจาก Flash Express API
        const fromAddress = {
          province: 'กรุงเทพมหานคร',
          district: 'พระนคร',
          subdistrict: 'พระบรมมหาราชวัง',
          zipcode: '10200'
        };

        const toAddress = {
          province: address.province || 'กรุงเทพมหานคร',
          district: address.district || 'พระนคร',
          subdistrict: address.subdistrict || 'พระบรมมหาราชวัง',
          zipcode: address.zipcode || '10200'
        };

        const packageInfo = {
          weight: weight || 1,
          width: 20,
          length: 30,
          height: 10
        };

        // เรียกใช้บริการ Flash Express API
        const apiOptions = await getFlashExpressShippingOptions(
          fromAddress,
          toAddress,
          packageInfo
        );

        if (apiOptions && apiOptions.length > 0) {
          console.log('ได้รับข้อมูลตัวเลือกการจัดส่งจาก API:', apiOptions);
          return res.json({
            success: true,
            options: apiOptions
          });
        }
      }
    } catch (apiError) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API:', apiError);
      // ไม่ต้อง return ที่นี่ ให้ใช้ข้อมูลเริ่มต้นแทน
    }

    // หากไม่สามารถใช้ API ได้ ใช้ข้อมูลตั้งต้น
    console.log('ใช้ข้อมูลตัวเลือกการจัดส่งเริ่มต้น');
    res.json({
      success: true,
      options: defaultOptions
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
 * API สำหรับทดสอบการสร้างเลขพัสดุกับ Flash Express API
 * 
 * สำหรับหน้าทดสอบ Flash Express API
 */
router.post('/test-create-order', auth, async (req: Request, res: Response) => {
  try {
    console.log('ได้รับคำขอทดสอบสร้างเลขพัสดุ:', req.body);

    // เพิ่มการตรวจสอบข้อมูลที่ส่งมา
    if (!req.body.outTradeNo) {
      req.body.outTradeNo = `PD${Date.now()}`;
    }

    // เพิ่มการแสดงค่า API key ที่ใช้ (เฉพาะบางส่วน เพื่อความปลอดภัย)
    const flashExpressMerchantId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    const flashExpressApiKey = process.env.FLASH_EXPRESS_API_KEY;

    console.log('Flash Express API credentials:');
    console.log(`- Merchant ID: ${flashExpressMerchantId}`);
    console.log(`- API Key: ${flashExpressApiKey ? `${flashExpressApiKey.substring(0, 5)}...${flashExpressApiKey.substring(flashExpressApiKey.length - 5)}` : 'ไม่พบ'}`);

    // กำหนดข้อมูลที่จำเป็นเพิ่มเติมถ้าไม่มี
    const orderData = {
      ...req.body,
      srcPhone: req.body.srcPhone?.replace(/[-\s]/g, ''),
      dstPhone: req.body.dstPhone?.replace(/[-\s]/g, ''),
      weight: Number(req.body.weight) || 1000,
      width: Number(req.body.width) || 20,
      length: Number(req.body.length) || 30,
      height: Number(req.body.height) || 10,
      // เพิ่มฟิลด์ที่อาจจำเป็นสำหรับ Flash Express V3
      dstHomePhone: req.body.dstPhone?.replace(/[-\s]/g, ''),
      srcDistrictName: req.body.srcDistrictName || "",
      dstDistrictName: req.body.dstDistrictName || "",
      insured: 0,
      remark: req.body.remark || "",
    };

    // เพิ่ม subItemTypes ที่จำเป็น
    if (!orderData.subItemTypes) {
      orderData.subItemTypes = [{
        itemName: 'สินค้า',
        itemWeightSize: '1Kg',
        itemColor: '-',
        itemQuantity: 1
      }];
    }

    // ทดสอบวิธีอื่นในการเรียก API โดยตรง
    try {
      // สร้าง nonce string
      const nonceStr = generateNonceStr();
      const timestamp = String(Math.floor(Date.now() / 1000));

      // ข้อมูลสำหรับส่ง API (ตามเอกสาร API รุ่น V3 ล่าสุด)
      const apiData: Record<string, any> = {
        mchId: flashExpressMerchantId,
        nonceStr: nonceStr,
        timestamp: timestamp,
        warehouseNo: `${flashExpressMerchantId}_001`,
        outTradeNo: orderData.outTradeNo,

        // ข้อมูลผู้ส่ง
        srcName: orderData.srcName,
        srcPhone: orderData.srcPhone.replace(/[-\s]/g, ''),
        srcProvinceName: orderData.srcProvinceName,
        srcCityName: orderData.srcCityName, 
        srcDistrictName: orderData.srcDistrictName || '',
        srcPostalCode: orderData.srcPostalCode,
        srcDetailAddress: orderData.srcDetailAddress,

        // ข้อมูลผู้รับ
        dstName: orderData.dstName,
        dstPhone: orderData.dstPhone.replace(/[-\s]/g, ''),
        dstHomePhone: orderData.dstPhone.replace(/[-\s]/g, ''), // จำเป็นสำหรับ API V3
        dstProvinceName: orderData.dstProvinceName,
        dstCityName: orderData.dstCityName,
        dstDistrictName: orderData.dstDistrictName || '',
        dstPostalCode: orderData.dstPostalCode,
        dstDetailAddress: orderData.dstDetailAddress,
      };

      console.log('Flash Express API request data:', apiData);

      // เพิ่ม codAmount เฉพาะถ้า codEnabled เป็น 1
      if (orderData.codEnabled == 1 && orderData.codAmount) {
        apiData.codAmount = orderData.codAmount;
      }

      // ข้อมูลพัสดุ
      apiData.articleCategory = orderData.articleCategory || "2";
      apiData.expressCategory = orderData.expressCategory || "1";
      apiData.weight = orderData.weight || "1000";
      apiData.width = orderData.width || "20";
      apiData.length = orderData.length || "30"; 
      apiData.height = orderData.height || "10";

      // ข้อมูลเพิ่มเติมที่จำเป็นสำหรับ API V3
      apiData.pricingType = "1";
      apiData.pricingTable = "1";
      apiData.payType = "1";
      apiData.transportType = "1";
      apiData.expressTypeId = "1";
      apiData.productType = "1";
      apiData.parcelKind = "1";

      // ข้อมูล COD และประกัน
      apiData.insured = "0";
      apiData.opdInsureEnabled = "0";
      apiData.codEnabled = orderData.codEnabled || "0";


      // ใช้ฟังก์ชัน generateFlashExpressSignature จาก generate-signature.ts
      const sign = generateFlashExpressSignature(
        flashExpressApiKey as string,
        apiData,
        nonceStr
      );

      console.log('Flash Express calculated signature:', sign);

      // เพิ่มลายเซ็นเข้าไปในข้อมูล
      apiData.sign = sign;

      // เข้ารหัสข้อมูลเป็น form-urlencoded
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(apiData)) {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      }

      // เพิ่ม subItemTypes หลังจากลงลายเซ็นแล้ว
      if (orderData.subItemTypes) {
        formData.append('subItemTypes', JSON.stringify(orderData.subItemTypes));
      }

      console.log('Flash Express API request form data:', formData.toString());

      const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com';
      const response = await axios({
        method: 'post',
        url: `${FLASH_EXPRESS_API_URL}/open/v3/orders`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        data: formData,
        timeout: 15000
      });

      console.log('Flash Express direct API response:', response.data);

      if (response.data.code === 1) {
        res.json({
          success: true,
          trackingNumber: response.data.data.pno,
          sortCode: response.data.data.sortCode,
          message: 'สร้างเลขพัสดุสำเร็จ'
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          message: `Flash Express API error: ${response.data.message || 'Unknown error'}`,
          errorDetails: JSON.stringify(response.data)
        });
        return;
      }
    } catch (directError: any) {
      console.error('Error in direct Flash Express API call:', directError);

      // ถ้าเกิดข้อผิดพลาดในการเรียก API โดยตรง ให้ลองใช้ฟังก์ชัน helper อีกครั้ง
      console.log('Falling back to helper function...');
    }

    // ใช้ฟังก์ชัน helper (วิธีเดิม)
    console.log('ข้อมูลที่ส่งไปยัง Flash Express API (หลังปรับปรุง):', orderData);
    const result = await createFlashExpressShipping(orderData);

    if (result.success) {
      res.json({
        success: true,
        trackingNumber: result.trackingNumber,
        sortCode: result.sortCode,
        message: 'สร้างเลขพัสดุสำเร็จ'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'ไม่สามารถสร้างเลขพัสดุจาก Flash Express ได้ กรุณาลองใหม่อีกครั้ง',
        errorDetails: 'Flash Express API ไม่สามารถสร้างเลขพัสดุได้ กรุณาตรวจสอบข้อมูลให้ถูกต้องและลองใหม่อีกครั้ง',
        technicalDetails: JSON.stringify(result)
      });
    }
  } catch (error: any) {
    console.error('Error testing create order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test create order',
      stack: error.stack,
      detailedError: JSON.stringify(error)
    });
  }
});

/**
 * API สำหรับสร้างการจัดส่งใหม่ตามมาตรฐาน Flash Express V3
 */
router.post('/create', auth, async (req: Request, res: Response) => {
  try {
    const {
      outTradeNo,
      senderInfo,
      receiverInfo,
      packageInfo,
      codEnabled = 0,
      codAmount = 0,
      expressCategory = 1,
      articleCategory = 1,
      items = []
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็นอย่างละเอียด
    console.log('ข้อมูลที่ได้รับ:', req.body);

    // ตรวจสอบข้อมูลที่จำเป็น
    const missingFields = [];

    // ตรวจสอบข้อมูลพื้นฐาน
    if (!req.body.outTradeNo) missingFields.push('เลขออเดอร์');
    if (!req.body.srcName) missingFields.push('ชื่อผู้ส่ง');
    if (!req.body.srcPhone) missingFields.push('เบอร์โทรผู้ส่ง');
    if (!req.body.srcProvinceName) missingFields.push('จังหวัดผู้ส่ง');
    if (!req.body.srcCityName) missingFields.push('อำเภอ/เขตผู้ส่ง');
    if (!req.body.srcPostalCode) missingFields.push('รหัสไปรษณีย์ผู้ส่ง');
    if (!req.body.srcDetailAddress) missingFields.push('ที่อยู่ผู้ส่ง');

    // ตรวจสอบข้อมูลผู้รับ
    if (!req.body.dstName) missingFields.push('ชื่อผู้รับ');
    if (!req.body.dstPhone) missingFields.push('เบอร์โทรผู้รับ');
    if (!req.body.dstProvinceName) missingFields.push('จังหวัดผู้รับ');
    if (!req.body.dstCityName) missingFields.push('อำเภอ/เขตผู้รับ');
    if (!req.body.dstPostalCode) missingFields.push('รหัสไปรษณีย์ผู้รับ');
    if (!req.body.dstDetailAddress) missingFields.push('ที่อยู่ผู้รับ');

    if (!packageInfo) {
      missingFields.push('ข้อมูลพัสดุ');
    } else {
      if (!packageInfo.weight) missingFields.push('น้ำหนักพัสดุ');
    }

    if (codEnabled === 1 && !codAmount) {
      missingFields.push('จำนวนเงินเก็บปลายทาง (COD)');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        missingFields: missingFields
      });
    }

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ Flash Express ต้องการ
    const orderData = {
      outTradeNo,
      srcName: senderInfo.name,
      srcPhone: senderInfo.phone.replace(/[-\s]/g, ''), // ลบช่องว่างและขีด
      srcProvinceName: senderInfo.province,
      srcCityName: senderInfo.district,
      srcDistrictName: senderInfo.subdistrict || '',
      srcPostalCode: senderInfo.zipcode,
      srcDetailAddress: senderInfo.address,
      dstName: receiverInfo.name,
      dstPhone: receiverInfo.phone.replace(/[-\s]/g, ''), // ลบช่องว่างและขีด
      dstHomePhone: receiverInfo.homePhone ? receiverInfo.homePhone.replace(/[-\s]/g, '') : receiverInfo.phone.replace(/[-\s]/g, ''),
      dstProvinceName: receiverInfo.province,
      dstCityName: receiverInfo.district,
      dstDistrictName: receiverInfo.subdistrict || '',
      dstPostalCode: receiverInfo.zipcode,
      dstDetailAddress: receiverInfo.address,
      articleCategory: Number(articleCategory),
      expressCategory: Number(expressCategory),
      weight: Math.round(packageInfo.weight * 1000), // แปลงจาก กก. เป็น กรัม และปัดเป็นจำนวนเต็ม
      width: packageInfo.width ? Math.round(packageInfo.width) : 20,
      length: packageInfo.length ? Math.round(packageInfo.length) : 30,
      height: packageInfo.height ? Math.round(packageInfo.height) : 10,
      insured: packageInfo.insured ? 1 : 0,
      insureDeclareValue: packageInfo.insureDeclareValue ? Math.round(packageInfo.insureDeclareValue * 100) : undefined, // แปลงจากบาทเป็นสตางค์
      codEnabled: Number(codEnabled),
      codAmount: codAmount ? Math.round(codAmount * 100) : undefined, // แปลงจากบาทเป็นสตางค์และปัดเป็นจำนวนเต็ม
      remark: packageInfo.remark || '',
      subItemTypes: items.length > 0 ? items.map((item: any) => ({
        itemName: item.name || 'สินค้าไม่ระบุชื่อ',
        itemWeightSize: item.weightSize || `${item.weight || 1}Kg`,
        itemColor: item.color || '-',
        itemQuantity: Number(item.quantity) || 1
      })) : [{
        itemName: 'สินค้า',
        itemWeightSize: '1Kg',
        itemColor: '-',
        itemQuantity: 1
      }]
    };

    console.log('ข้อมูลสำหรับสร้างการจัดส่ง Flash Express:', orderData);

    // สร้างการจัดส่ง
    const result = await createFlashExpressShipping(orderData);

    if (result.success) {
      res.json({
        success: true,
        trackingNumber: result.trackingNumber,
        sortCode: result.sortCode
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Missing required information',
        errorDetails: 'Flash Express API ไม่สามารถสร้างเลขพัสดุได้ กรุณาตรวจสอบข้อมูลให้ถูกต้องและลองใหม่อีกครั้ง'
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
 * API สำหรับทดสอบการเชื่อมต่อกับ Flash Express API
 */
router.get('/test-connection', auth, async (req: Request, res: Response) => {
  try {
    console.log('เริ่มทดสอบการเชื่อมต่อกับ Flash Express API (URL: https://open-api.flashexpress.com)');

    // เก็บข้อมูล API key และ merchant ID สำหรับการวิเคราะห์ปัญหา (เซ็นเซอร์บางส่วนเพื่อความปลอดภัย)
    const flashApiKey = process.env.FLASH_EXPRESS_API_KEY;
    const merchantId = process.env.FLASH_EXPRESS_MERCHANT_ID;

    // แสดงข้อมูลเพื่อการวิเคราะห์ปัญหา
    console.log(`ใช้ Merchant ID: ${merchantId}`);
    console.log(`ใช้ API Key: ${flashApiKey?.substring(0, 3)}...${flashApiKey?.substring(flashApiKey.length - 3) || ''}`);

    // ตรวจสอบความถูกต้องของ API key และ merchant ID
    if (!flashApiKey || flashApiKey.length < 10) {
      return res.json({
        success: false,
        error: 'API key ไม่ถูกต้องหรือมีความยาวไม่เพียงพอ',
        apiKeyLength: flashApiKey ? flashApiKey.length : 0
      });
    }

    if (!merchantId || merchantId.length < 5) {
      return res.json({
        success: false,
        error: 'Merchant ID ไม่ถูกต้องหรือมีความยาวไม่เพียงพอ',
        merchantIdLength: merchantId ? merchantId.length : 0
      });
    }

    // ทดสอบการเชื่อมต่อ
    const testResult = await testFlashApi();

    // ตรวจสอบข้อมูลการตอบกลับละเอียด
    console.log('ผลการทดสอบการเชื่อมต่อกับ Flash Express API:', testResult);

    // ตรวจสอบหากตอบกลับเป็น HTML แทนที่จะเป็น JSON
    if (testResult.error?.response?.data && 
        typeof testResult.error.response.data === 'string' && 
        testResult.error.response.data.includes('<!DOCTYPE html>')) {
      console.log('ได้รับ HTML response แทน JSON - อาจมีการ redirect');

      // วิเคราะห์สาเหตุ
      const htmlAnalysis = {
        snippet: testResult.error.response.data.substring(0, 200) + '...',
        analysis: 'ได้รับการตอบกลับเป็น HTML แทนที่จะเป็น JSON ซึ่งอาจเกิดจากการ redirect ไปยังหน้าเว็บหรือ endpoint ที่ไม่ถูกต้อง'
      };

      // เพิ่มข้อมูลลงใน response แบบปลอดภัย (ไม่มีการเปลี่ยนแปลงโครงสร้างข้อมูลเดิม)
      return res.json({
        ...testResult,
        htmlAnalysis
      });
    }

    res.json(testResult);
  } catch (error: any) {
    console.error('Error testing Flash Express API connection:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test API connection',
      errorDetails: {
        name: error.name,
        stack: error.stack
      }
    });
  }
});

/**
 * API สำหรับวิเคราะห์ที่อยู่ (ใช้การวิเคราะห์แบบ local)
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

    // วิเคราะห์ที่อยู่ด้วยวิธี local แทนการใช้ Longdo Map API
    const addressComponents = parseAddress(fullAddress);

    // ตรวจสอบว่ามีข้อมูลที่วิเคราะห์ได้บ้างหรือไม่
    if (Object.keys(addressComponents).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถวิเคราะห์ที่อยู่ได้'
      });
    }

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

// ฟังก์ชันสำหรับแยกประเภทข้อมูลที่อยู่จากข้อความ
function parseAddress(text: string): any {
  const components: any = {};

  // แยกตามบรรทัด
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const addressText = lines.join(' ');

  // ดึงรหัสไปรษณีย์ (เป็นตัวเลข 5 หลักที่มักจะอยู่ท้ายที่อยู่)
  const zipRegex = /\b(\d{5})\b/;
  const zipMatch = addressText.match(zipRegex);
  if (zipMatch) {
    components.zipcode = zipMatch[1];
  }

  // ดึงเลขที่บ้าน/อาคาร (ตัวเลข/ตัวเลข หรือตัวเลขอย่างเดียว ที่อยู่ต้นประโยค)
  const houseNumberRegex = /(?:^|\s)([0-9\/\-]+)(?:\s|$)/;
  const houseNumberMatch = addressText.match(houseNumberRegex);
  if (houseNumberMatch) {
    components.houseNumber = houseNumberMatch[1];
  }

  // ดึงชื่อหมู่บ้าน/อาคาร หรือ หมู่ที่
  const villageRegex = /(?:หมู่บ้าน|หมู่|ม\.|อาคาร|คอนโด)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const villageMatch = addressText.match(villageRegex);
  if (villageMatch) {
    components.village = villageMatch[0].trim();
  }

  // ดึงข้อมูลซอย
  const soiRegex = /(?:ซอย|ซ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const soiMatch = addressText.match(soiRegex);
  if (soiMatch) {
    components.soi = soiMatch[0].trim();
  }

  // ดึงข้อมูลถนน
  const roadRegex = /(?:ถนน|ถ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const roadMatch = addressText.match(roadRegex);
  if (roadMatch) {
    components.road = roadMatch[0].trim();
  }

  // รายชื่อจังหวัดและคำนำหน้าแขวง/ตำบล/อำเภอ/เขต
  const provinceNames = [
    "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", 
    "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", 
    "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", 
    "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", 
    "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พะเยา", "พระนครศรีอยุธยา", 
    "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
    "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", 
    "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", 
    "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", 
    "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", 
    "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี", "อำนาจเจริญ"
  ];

  // ค้นหาจังหวัด
  for (const province of provinceNames) {
    if (addressText.includes(province)) {
      components.province = province;
      break;
    }
  }

  // ค้นหาแขวง/ตำบล และเขต/อำเภอ
  const subdistrictRegex = /(?:แขวง|ตำบล|ต\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const subdistrictMatch = addressText.match(subdistrictRegex);
  if (subdistrictMatch) {
    components.subdistrict = subdistrictMatch[0].trim();
  }

  const districtRegex = /(?:เขต|อำเภอ|อ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const districtMatch = addressText.match(districtRegex);
  if (districtMatch) {
    components.district = districtMatch[0].trim();
  }

  // หากไม่พบแขวง/ตำบล และเขต/อำเภอด้วยการค้นหาแบบมีคำนำหน้า 
  // ให้ลองค้นหาจากคำที่มักมาก่อนจังหวัด
  if (components.province && !components.district && !components.subdistrict) {
    // ตัดตั้งแต่จังหวัดออกไป
    const beforeProvince = addressText.split(components.province)[0];
    const words = beforeProvince.split(/\s+/);

    // มักเรียงเป็น ตำบล -> อำเภอ -> จังหวัด หรือใช้ชื่อเลย
    if (words.length >= 2) {
      // อาจเป็นชื่ออำเภอโดยตรง
      components.district = words[words.length - 1];

      // และอาจเป็นชื่อตำบลก่อนหน้านั้น
      if (words.length >= 3) {
        components.subdistrict = words[words.length - 2];
      }
    }
  }

  return components;
}

/**
 * API สำหรับทดสอบการสร้างเลขพัสดุแบบละเอียด
 */
router.post('/flash-express/debug-create', auth, async (req: Request, res: Response) => {
  try {
    console.log('ได้รับคำขอทดสอบละเอียด:', req.body);

    if (!req.body.outTradeNo) {
      req.body.outTradeNo = `DEBUG${Date.now()}`;
    }

    // ทดสอบการสร้างพัสดุโดยตรงโดยใช้ createFlashExpressShipping
    const result = await createFlashExpressShipping(req.body);
    
    // บันทึกข้อมูลละเอียดลงในคอนโซล
    console.log('Debug createFlashExpressShipping result:', JSON.stringify(result, null, 2));

    res.json({
      success: true,
      message: 'ทดสอบการสร้างเลขพัสดุแบบละเอียดเสร็จสิ้น กรุณาตรวจสอบ log ในคอนโซล',
      debugInfo: result
    });
  } catch (error: any) {
    console.error('Error in debug create:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการทดสอบ',
      stack: error.stack
    });
  }
});

export default router;
/**
 * API สำหรับค้นหาพัสดุโดย Merchant Tracking Number
 */
router.get('/flash-express/find-by-merchant-tracking/:trackingNumber', auth, async (req: Request, res: Response) => {
  try {
    const merchantTrackingNumber = req.params.trackingNumber;

    if (!merchantTrackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลข Merchant Tracking Number'
      });
    }

    // เรียกใช้ฟังก์ชันค้นหาออเดอร์
    const result = await findOrderByMerchantTrackingNumber(merchantTrackingNumber);

    if (result.success) {
      return res.json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    console.error('Error finding order by merchant tracking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'ไม่สามารถค้นหาข้อมูลพัสดุได้'
    });
  }
});