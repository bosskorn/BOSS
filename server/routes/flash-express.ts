import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';
import { auth } from '../auth';
import { db } from '../db';
import { z } from 'zod';
import { orders, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// ตรวจสอบว่ามีการกำหนดค่าคงที่สำหรับ Flash Express API
if (!process.env.FLASH_EXPRESS_MERCHANT_ID || !process.env.FLASH_EXPRESS_API_KEY) {
  console.error('คำเตือน: ไม่พบค่าคงที่ FLASH_EXPRESS_MERCHANT_ID หรือ FLASH_EXPRESS_API_KEY ในไฟล์ .env');
}

// URL ของ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com/open';

// ฟังก์ชันสำหรับสร้างลายเซ็นดิจิตอล (signature) สำหรับ Flash Express API
// การสร้างลายเซ็นตามเอกสาร Flash Express API:
// 1. จัดเรียง key ตามลำดับ ASCII
// 2. แปลงข้อมูลเป็นรูปแบบ key=value คั่นด้วย & เพื่อสร้าง stringA
// 3. นำ stringA มาต่อกับ "&key=API_KEY" เพื่อสร้าง stringSignTemp
// 4. คำนวณ SHA-256 ของ stringSignTemp
// 5. แปลงผลลัพธ์เป็นตัวพิมพ์ใหญ่ทั้งหมด
function createSignature(params: Record<string, any>, apiKey: string): string {
  try {
    console.log('Starting signature creation for Flash Express API');
    
    // คัดลอกพารามิเตอร์ทั้งหมดเพื่อสร้าง signature
    const paramsForSign = { ...params };
    
    // ลบฟิลด์ที่ไม่ต้องใช้ในการสร้าง signature
    delete paramsForSign.sign;
    
    // เรียงฟิลด์ตามรหัส ASCII
    const sortedKeys = Object.keys(paramsForSign).sort();
    
    // สร้าง string จากชื่อและค่าของทุกฟิลด์ที่เรียงลำดับแล้ว
    const parts: string[] = [];
    
    for (const key of sortedKeys) {
      let value = paramsForSign[key];
      
      // ข้ามฟิลด์ที่เป็น undefined หรือ null
      if (value === undefined || value === null) {
        continue;
      }
      
      // แปลงข้อมูลเป็น string ถ้าจำเป็น
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value !== 'string') {
        value = String(value);
      }
      
      // ข้ามค่าว่าง
      if (value.trim() === '') {
        continue;
      }
      
      // เพิ่มเข้าไปในรายการสำหรับการสร้าง stringA
      parts.push(`${key}=${value}`);
    }
    
    // รวม key=value คั่นด้วย & เพื่อสร้าง stringA
    const stringA = parts.join('&');
    
    // ต่อ stringA ด้วย &key=API_KEY เพื่อสร้าง stringSignTemp
    const stringSignTemp = `${stringA}&key=${apiKey}`;
    
    console.log('Flash Express signature stringSignTemp:', stringSignTemp); // เพื่อดีบัก
    
    // สร้าง signature ด้วย SHA-256
    const signature = crypto.createHash('sha256').update(stringSignTemp).digest('hex').toUpperCase();
    console.log('Flash Express signature result:', signature);
    
    return signature;
  } catch (error) {
    console.error('Error creating Flash Express signature:', error);
    throw new Error('Failed to create signature for Flash Express API');
  }
}

// สร้างคำสั่งจัดส่งใหม่ผ่าน Flash Express API
router.post('/create-order', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้รับอนุญาต' });
    }

    // ข้อมูลจากคำขอ
    const {
      // ข้อมูลผู้ส่ง
      srcName,
      srcPhone,
      srcProvinceName,
      srcCityName,
      srcDistrictName,
      srcPostalCode,
      srcDetailAddress,
      
      // ข้อมูลผู้รับ
      dstName,
      dstPhone,
      dstProvinceName,
      dstCityName,
      dstDistrictName,
      dstPostalCode,
      dstDetailAddress,
      
      // ข้อมูลพัสดุ
      weight,
      width,
      length,
      height,
      
      // ข้อมูลการจัดส่ง
      expressCategory,
      articleCategory,
      itemCategory,
      
      // ข้อมูล COD
      codEnabled,
      codAmount,
      
      // ข้อมูลการชำระเงิน
      settlementType,
      payType,
      
      // ข้อมูลสินค้า
      subItemTypes,
      
      // เลขที่อ้างอิง
      orderNumber
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!dstName || !dstPhone || !dstProvinceName || !dstCityName || !dstPostalCode || !dstDetailAddress) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ครบถ้วน กรุณาตรวจสอบข้อมูลผู้รับ'
      });
    }

    // ตรวจสอบรูปแบบข้อมูลที่ได้รับจากคำขอ
    // รองรับทั้งรูปแบบมาตรฐานและรูปแบบที่ใช้ prefix เช่น snd_name, rcv_name
    const senderName = srcName || req.body.snd_name;
    const senderPhone = srcPhone || req.body.snd_phone;
    const senderProvince = srcProvinceName || req.body.snd_province;
    const senderCity = srcCityName || req.body.snd_district; // สลับชื่อตามที่ Flash Express ต้องการ
    const senderDistrict = srcDistrictName || req.body.snd_subdistrict;
    const senderPostcode = srcPostalCode || req.body.snd_zipcode;
    const senderAddress = srcDetailAddress || req.body.snd_address;
    
    const receiverName = dstName || req.body.rcv_name;
    const receiverPhone = dstPhone || req.body.rcv_phone;
    const receiverProvince = dstProvinceName || req.body.rcv_province;
    const receiverCity = dstCityName || req.body.rcv_district; // สลับชื่อตามที่ Flash Express ต้องการ
    const receiverDistrict = dstDistrictName || req.body.rcv_subdistrict;
    const receiverPostcode = dstPostalCode || req.body.rcv_zipcode;
    const receiverAddress = dstDetailAddress || req.body.rcv_address;

    // ปรับรูปแบบข้อมูลให้ตรงกับที่ Flash Express API ต้องการ
    // สร้าง object params สำหรับ Flash Express API

    // ใช้ชื่อฟิลด์ตามตัวอย่าง Flash Express API ที่ทำงานได้
    const nonceStr = Date.now().toString();
    const outTradeNo = orderNumber || `SS${Date.now()}`;

    const params: Record<string, any> = {
      // ข้อมูลพื้นฐานตามตัวอย่าง
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: nonceStr,
      outTradeNo: outTradeNo,
      warehouseNo: `${process.env.FLASH_EXPRESS_MERCHANT_ID}_001`,
      
      // ข้อมูลผู้ส่ง
      srcName: senderName,
      srcPhone: senderPhone,
      srcProvinceName: senderProvince, 
      srcCityName: senderCity,
      srcDistrictName: senderDistrict,
      srcPostalCode: senderPostcode,
      srcDetailAddress: senderAddress,
      
      // ข้อมูลผู้รับ
      dstName: receiverName,
      dstPhone: receiverPhone,
      dstHomePhone: receiverPhone, // เพิ่มเติมตามตัวอย่าง
      dstProvinceName: receiverProvince,
      dstCityName: receiverCity,
      dstDistrictName: receiverDistrict,
      dstPostalCode: receiverPostcode,
      dstDetailAddress: receiverAddress,
      
      // ข้อมูลการส่งคืน (ใช้ข้อมูลผู้ส่ง)
      returnName: senderName,
      returnPhone: senderPhone,
      returnProvinceName: senderProvince,
      returnCityName: senderCity,
      returnDistrictName: senderDistrict,
      returnPostalCode: senderPostcode,
      returnDetailAddress: senderAddress,
      
      // ข้อมูลพัสดุและประเภทการจัดส่ง
      articleCategory: articleCategory || 1, // ตามตัวอย่างใช้ 1
      expressCategory: expressCategory || 1, // 1 = ธรรมดา, 2 = ด่วน
      weight: Math.round(weight), // แปลงเป็นจำนวนเต็ม
      
      // ข้อมูลประกัน
      insured: req.body.insured || 0,
      insureDeclareValue: req.body.insureDeclareValue || 0,
      opdInsureEnabled: req.body.opdInsureEnabled || 0,
      
      // ข้อมูล COD
      codEnabled: req.body.codEnabled || 0,
      codAmount: req.body.codEnabled ? Math.round(req.body.codAmount || 0) : 0,
      
      // ข้อมูลพัสดุย่อย
      subParcelQuantity: 1,
      subParcel: JSON.stringify([{
        outTradeNo: outTradeNo + "1",
        weight: Math.round(weight),
        width: Math.round(width),
        length: Math.round(length),
        height: Math.round(height),
        remark: ""
      }]),
      
      // ข้อมูลสินค้า
      subItemTypes: JSON.stringify(subItemTypes || [{
        itemName: "สินค้า",
        itemWeightSize: `${Math.round(width)}*${Math.round(length)}*${Math.round(height)} ${Math.round(weight)/1000}Kg`,
        itemColor: "",
        itemQuantity: "1"
      }]),
      
      // หมายเหตุ
      remark: ""
    };

    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;

    // ส่งคำขอไปยัง Flash Express API
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v3/orders`;
    console.log('POST request to Flash Express API:', apiUrl);
    console.log('Request params:', JSON.stringify(params, null, 2));

    try {
      // ส่งคำขอไปยัง Flash Express API แบบ x-www-form-urlencoded
      const response = await axios.post(apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      console.log('Flash Express API response:', response.data);

      // ตรวจสอบว่าได้รับเลขพัสดุหรือไม่
      if (response.data.msg === 'success' && response.data.pno) {
        // บันทึกข้อมูลเลขพัสดุลงในฐานข้อมูล หากต้องการ
        
        // ส่งข้อมูลกลับไปยังไคลเอนต์
        return res.json({
          success: true,
          message: 'สร้างเลขพัสดุสำเร็จ',
          trackingNumber: response.data.pno,
          sortCode: response.data.sortingCode || '00',
          pdfUrl: response.data.pdfUrl || null,
          orderNumber: params.merchantNo,
          response: response.data
        });
      } else {
        // กรณีมีข้อผิดพลาดจาก Flash Express API
        return res.status(400).json({
          success: false,
          message: `มีข้อผิดพลาดจาก Flash Express: ${response.data.msg || 'ไม่ทราบสาเหตุ'}`,
          errorCode: response.data.code || 'UNKNOWN',
          response: response.data
        });
      }
    } catch (apiError: any) {
      console.error('Error from Flash Express API:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้';
      let errorData = null;
      
      if (apiError.response) {
        errorMessage = apiError.response.data.msg || apiError.response.data.message || 'มีข้อผิดพลาดจาก Flash Express API';
        errorData = apiError.response.data;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error creating Flash Express order:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งจัดส่ง',
      error: error.message
    });
  }
});

// ดึงข้อมูลติดตามพัสดุจาก Flash Express API
router.get('/track/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขพัสดุ'
      });
    }
    
    // สร้าง params สำหรับ API ติดตามพัสดุ
    const params: Record<string, any> = {
      merchantID: process.env.FLASH_EXPRESS_MERCHANT_ID,
      pno: trackingNumber
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;
    
    // ส่งคำขอไปยัง Flash Express API
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v1/orders/${trackingNumber}/routes`;
    console.log('POST request to Flash Express API for tracking:', apiUrl);
    
    try {
      const response = await axios.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express tracking API response:', response.data);
      
      // ตรวจสอบข้อมูลที่ได้รับ
      if (response.data.msg === 'success' && response.data.data) {
        // ส่งข้อมูลติดตามพัสดุกลับไปยังไคลเอนต์
        return res.json({
          success: true,
          trackingNumber,
          trackingData: response.data.data
        });
      } else if (response.data.code === 'RECORD_NOT_EXIST') {
        // กรณีไม่พบข้อมูลพัสดุ ส่งข้อมูลสถานะพิเศษกลับไป
        return res.json({
          success: true,
          trackingNumber,
          trackingData: [{
            scanTime: new Date().toISOString(),
            scanType: 'pending',
            scanDesc: 'พัสดุอยู่ระหว่างการรอเข้าระบบ Flash Express'
          }]
        });
      } else {
        // กรณีมีข้อผิดพลาดจาก Flash Express API
        return res.status(400).json({
          success: false,
          message: `มีข้อผิดพลาดจาก Flash Express: ${response.data.msg || 'ไม่ทราบสาเหตุ'}`,
          errorCode: response.data.code || 'UNKNOWN',
          response: response.data
        });
      }
    } catch (apiError: any) {
      console.error('Error from Flash Express tracking API:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้';
      let errorData = null;
      
      if (apiError.response) {
        // กรณีส่งเลขพัสดุที่ไม่มีในระบบ แสดงข้อความเฉพาะ
        if (apiError.response.status === 400 && apiError.response.data.code === 'RECORD_NOT_EXIST') {
          return res.json({
            success: true,
            trackingNumber,
            trackingData: [{
              scanTime: new Date().toISOString(),
              scanType: 'pending',
              scanDesc: 'พัสดุอยู่ระหว่างการรอเข้าระบบ Flash Express'
            }]
          });
        }
        
        errorMessage = apiError.response.data.msg || apiError.response.data.message || 'มีข้อผิดพลาดจาก Flash Express API';
        errorData = apiError.response.data;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error tracking Flash Express parcel:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการติดตามพัสดุ',
      error: error.message
    });
  }
});

// ดึงข้อมูลพัสดุจากเลขอ้างอิงร้านค้า (merchantNo)
router.get('/find-by-merchant-number/:merchantNumber', async (req: Request, res: Response) => {
  try {
    const { merchantNumber } = req.params;
    
    if (!merchantNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขอ้างอิงร้านค้า'
      });
    }
    
    // สร้าง params สำหรับ API ค้นหาพัสดุ
    const params: Record<string, any> = {
      merchantID: process.env.FLASH_EXPRESS_MERCHANT_ID,
      merchantNo: merchantNumber
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;
    
    // ส่งคำขอไปยัง Flash Express API
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v1/parcels`;
    console.log('POST request to Flash Express API for finding parcel:', apiUrl);
    
    try {
      const response = await axios.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express find parcel API response:', response.data);
      
      // ตรวจสอบข้อมูลที่ได้รับ
      if (response.data.msg === 'success' && response.data.data && response.data.data.length > 0) {
        // ส่งข้อมูลพัสดุกลับไปยังไคลเอนต์
        return res.json({
          success: true,
          merchantNumber,
          parcelData: response.data.data[0], // เลือกพัสดุแรกที่พบ
          pno: response.data.data[0].pno
        });
      } else if (response.data.msg === 'success' && (!response.data.data || response.data.data.length === 0)) {
        // กรณีไม่พบข้อมูลพัสดุ
        return res.json({
          success: true,
          merchantNumber,
          message: 'ยังไม่พบข้อมูลพัสดุในระบบ Flash Express',
          parcelData: null,
          pno: null
        });
      } else {
        // กรณีมีข้อผิดพลาดจาก Flash Express API
        return res.status(400).json({
          success: false,
          message: `มีข้อผิดพลาดจาก Flash Express: ${response.data.msg || 'ไม่ทราบสาเหตุ'}`,
          errorCode: response.data.code || 'UNKNOWN',
          response: response.data
        });
      }
    } catch (apiError: any) {
      console.error('Error from Flash Express find parcel API:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้';
      let errorData = null;
      
      if (apiError.response) {
        errorMessage = apiError.response.data.msg || apiError.response.data.message || 'มีข้อผิดพลาดจาก Flash Express API';
        errorData = apiError.response.data;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error finding Flash Express parcel by merchant number:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาพัสดุ',
      error: error.message
    });
  }
});

// พิมพ์ใบปะหน้าพัสดุ
router.get('/print-label/:trackingNumber', async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขพัสดุ'
      });
    }
    
    // สร้าง params สำหรับ API ดึงใบปะหน้าพัสดุ
    const params: Record<string, any> = {
      merchantID: process.env.FLASH_EXPRESS_MERCHANT_ID,
      pno: trackingNumber
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;
    
    // ส่งคำขอไปยัง Flash Express API
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v1/orders/${trackingNumber}/print-label`;
    console.log('POST request to Flash Express API for printing label:', apiUrl);
    
    try {
      const response = await axios.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express print label API response:', response.data);
      
      // ตรวจสอบข้อมูลที่ได้รับ
      if (response.data.msg === 'success' && response.data.pdfUrl) {
        // เปลี่ยนเส้นทางไปยัง URL ของไฟล์ PDF
        return res.redirect(response.data.pdfUrl);
      } else {
        // กรณีมีข้อผิดพลาดจาก Flash Express API
        return res.status(400).json({
          success: false,
          message: `มีข้อผิดพลาดจาก Flash Express: ${response.data.msg || 'ไม่ทราบสาเหตุ'}`,
          errorCode: response.data.code || 'UNKNOWN',
          response: response.data
        });
      }
    } catch (apiError: any) {
      console.error('Error from Flash Express print label API:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้';
      let errorData = null;
      
      if (apiError.response) {
        errorMessage = apiError.response.data.msg || apiError.response.data.message || 'มีข้อผิดพลาดจาก Flash Express API';
        errorData = apiError.response.data;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error printing Flash Express label:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการพิมพ์ใบปะหน้าพัสดุ',
      error: error.message
    });
  }
});

// ส่งคำขอ shipping-methods และ rates
router.get('/shipping-rates', async (req: Request, res: Response) => {
  try {
    const { weight, srcPostalCode, dstPostalCode } = req.query;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!weight || !dstPostalCode) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุน้ำหนักและรหัสไปรษณีย์ปลายทาง'
      });
    }
    
    // แปลงน้ำหนักเป็นกรัม (หากส่งมาเป็นกิโลกรัม)
    const weightInGrams = parseFloat(weight as string) < 10 ? 
      parseFloat(weight as string) * 1000 : 
      parseFloat(weight as string);
    
    // ตัวเลือกการจัดส่ง Flash Express
    const shippingOptions = [
      {
        id: "flash-standard",
        name: "Flash Express (ธรรมดา)",
        price: calculateShippingRate(weightInGrams, 1), // 1 = ธรรมดา
        expressCategory: 1,
        isCODAvailable: true,
        icon: "flash",
        description: "จัดส่งภายใน 2-3 วันทำการ"
      },
      {
        id: "flash-express", 
        name: "Flash Express (ด่วน)",
        price: calculateShippingRate(weightInGrams, 2), // 2 = ด่วน
        expressCategory: 2,
        isCODAvailable: true,
        icon: "flash",
        description: "จัดส่งภายใน 1-2 วันทำการ"
      }
    ];
    
    return res.json({
      success: true,
      shippingOptions
    });
  } catch (error: any) {
    console.error('Error getting shipping rates:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอัตราค่าจัดส่ง',
      error: error.message
    });
  }
});

// ฟังก์ชันคำนวณค่าจัดส่ง (อยู่ภายในไฟล์นี้)
function calculateShippingRate(weightInGrams: number, expressCategory: number): number {
  // ค่าจัดส่งเริ่มต้น
  let baseRate = expressCategory === 1 ? 35 : 59; // ธรรมดา = 35 บาท, ด่วน = 59 บาท
  
  // เพิ่มค่าจัดส่งตามน้ำหนัก
  if (weightInGrams <= 1000) {
    // น้ำหนักไม่เกิน 1 กก. ใช้ราคาเริ่มต้น
    return baseRate;
  } else if (weightInGrams <= 5000) {
    // น้ำหนัก 1-5 กก. เพิ่ม 5 บาทต่อ 1 กก.
    const additionalKg = Math.ceil((weightInGrams - 1000) / 1000);
    return baseRate + (additionalKg * 5);
  } else if (weightInGrams <= 10000) {
    // น้ำหนัก 5-10 กก. เพิ่ม 10 บาทต่อ 1 กก.
    const additionalKg = Math.ceil((weightInGrams - 5000) / 1000);
    return baseRate + 20 + (additionalKg * 10); // 20 บาทสำหรับ 4 กก. แรกที่เกิน 1 กก.
  } else if (weightInGrams <= 20000) {
    // น้ำหนัก 10-20 กก. เพิ่ม 15 บาทต่อ 1 กก.
    const additionalKg = Math.ceil((weightInGrams - 10000) / 1000);
    return baseRate + 70 + (additionalKg * 15); // 70 บาทสำหรับ 9 กก. แรกที่เกิน 1 กก.
  } else {
    // น้ำหนักมากกว่า 20 กก.
    const additionalKg = Math.ceil((weightInGrams - 20000) / 1000);
    return baseRate + 220 + (additionalKg * 20); // 220 บาทสำหรับ 19 กก. แรกที่เกิน 1 กก.
  }
}

export default router;