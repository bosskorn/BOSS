/**
 * Flash Express API Test Routes
 * เส้นทาง API สำหรับทดสอบการเชื่อมต่อกับ Flash Express API
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import querystring from 'querystring';
import crypto from 'crypto';

const router = express.Router();

// URL ของ Flash Express API
const FLASH_EXPRESS_API_URL = 'https://open-api.flashexpress.com/open';

// ฟังก์ชันสำหรับสร้างลายเซ็นดิจิตอล (signature) สำหรับ Flash Express API
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

// ทดสอบการเชื่อมต่อกับ Flash Express API
router.get('/connection-test', async (req: Request, res: Response) => {
  try {
    // สร้าง params สำหรับทดสอบการเชื่อมต่อ
    const timestamp = Date.now().toString();
    const params: Record<string, any> = {
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: timestamp,
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;
    
    // ส่งคำขอไปยัง Flash Express API สำหรับทดสอบการเชื่อมต่อ
    // ใช้ endpoint ที่ง่ายที่สุด - ในที่นี้ใช้ api/fee เพื่อดึงค่าบริการ
    const apiUrl = `${FLASH_EXPRESS_API_URL}/api/fee`;
    console.log('POST request to Flash Express API for connection test:', apiUrl);
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    try {
      const response = await axios.post(apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express API connection test response:', response.data);
      
      return res.json({
        success: true,
        message: 'การเชื่อมต่อกับ Flash Express API สำเร็จ',
        api_key_status: 'Active',
        merchant_id: process.env.FLASH_EXPRESS_MERCHANT_ID,
        timestamp: new Date().toISOString(),
        response: response.data
      });
    } catch (apiError: any) {
      console.error('Error from Flash Express API connection test:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้';
      let errorData = null;
      
      if (apiError.response) {
        if (apiError.response.data && (apiError.response.data.msg || apiError.response.data.message)) {
          errorMessage = apiError.response.data.msg || apiError.response.data.message;
        } else {
          errorMessage = 'มีข้อผิดพลาดจาก Flash Express API';
        }
        errorData = apiError.response.data;
        console.log('Error data from Flash Express API connection test:', JSON.stringify(errorData));
      }
      
      return res.status(400).json({
        success: false,
        message: `การทดสอบเชื่อมต่อกับ Flash Express API ล้มเหลว: ${errorMessage}`,
        api_key_status: 'Error',
        merchant_id: process.env.FLASH_EXPRESS_MERCHANT_ID,
        timestamp: new Date().toISOString(),
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error testing Flash Express API connection:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ',
      error: error.message
    });
  }
});

// ทดสอบการคำนวณค่าจัดส่ง
router.get('/shipping-rate-test', async (req: Request, res: Response) => {
  try {
    // พารามิเตอร์สำหรับทดสอบการคำนวณค่าจัดส่ง
    const weight = req.query.weight ? parseInt(req.query.weight as string) : 1000; // น้ำหนักเริ่มต้น 1 kg (1000 g)
    const expressType = req.query.express_type ? parseInt(req.query.express_type as string) : 1; // ประเภทการจัดส่ง (1 = ธรรมดา, 2 = ด่วน)
    
    // สร้าง params สำหรับคำนวณค่าจัดส่ง
    const timestamp = Date.now().toString();
    const params: Record<string, any> = {
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: timestamp,
      weight: weight,
      expressCategory: expressType
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;
    
    // ส่งคำขอไปยัง Flash Express API สำหรับคำนวณค่าจัดส่ง
    const apiUrl = `${FLASH_EXPRESS_API_URL}/api/fee`;
    console.log('POST request to Flash Express API for shipping rate test:', apiUrl);
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    try {
      const response = await axios.post(apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express API shipping rate test response:', response.data);
      
      // แปลงค่าจัดส่งเป็นเงินบาท (หน่วยเป็นเซนต์)
      let shippingRate = 0;
      if (response.data && response.data.data && response.data.data.fee) {
        shippingRate = response.data.data.fee / 100; // แปลงเป็นบาท
      }
      
      return res.json({
        success: true,
        message: 'การคำนวณค่าจัดส่งสำเร็จ',
        weight_grams: weight,
        express_type: expressType === 1 ? 'ธรรมดา' : 'ด่วน',
        shipping_rate_baht: shippingRate,
        timestamp: new Date().toISOString(),
        response: response.data
      });
    } catch (apiError: any) {
      console.error('Error from Flash Express API shipping rate test:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถคำนวณค่าจัดส่งได้';
      let errorData = null;
      
      if (apiError.response) {
        if (apiError.response.data && (apiError.response.data.msg || apiError.response.data.message)) {
          errorMessage = apiError.response.data.msg || apiError.response.data.message;
        } else {
          errorMessage = 'มีข้อผิดพลาดจาก Flash Express API';
        }
        errorData = apiError.response.data;
        console.log('Error data from Flash Express API shipping rate test:', JSON.stringify(errorData));
      }
      
      return res.status(400).json({
        success: false,
        message: `การคำนวณค่าจัดส่งล้มเหลว: ${errorMessage}`,
        weight_grams: weight,
        express_type: expressType === 1 ? 'ธรรมดา' : 'ด่วน',
        timestamp: new Date().toISOString(),
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error calculating shipping rate:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการคำนวณค่าจัดส่ง',
      error: error.message
    });
  }
});

// ทดสอบการสร้างคำสั่งจัดส่ง Flash Express แบบง่าย (ไม่ใช้ subParcel)
router.post('/create-simple-order', async (req: Request, res: Response) => {
  try {
    // ข้อมูลจากคำขอ หรือใช้ข้อมูลทดสอบถ้าไม่ได้ระบุ
    const {
      senderName = "ทดสอบส่ง",
      senderPhone = "0899999999",
      senderProvince = "กรุงเทพมหานคร",
      senderCity = "ลาดพร้าว",
      senderDistrict = "จรเข้บัว",
      senderPostcode = "10230",
      senderAddress = "ที่อยู่ทดสอบ",
      
      receiverName = "ทดสอบรับ",
      receiverPhone = "0888888888",
      receiverProvince = "กรุงเทพมหานคร",
      receiverCity = "ห้วยขวาง",
      receiverDistrict = "สามเสนนอก",
      receiverPostcode = "10310",
      receiverAddress = "ที่อยู่ทดสอบ",
      
      weight = 1000, // น้ำหนักในกรัม (1 kg)
      width = 20,    // ความกว้างในเซนติเมตร
      length = 30,   // ความยาวในเซนติเมตร
      height = 10,   // ความสูงในเซนติเมตร
      
      expressCategory = 1, // 1 = ธรรมดา, 2 = ด่วน
      articleCategory = 1, // 1 = เอกสาร, 2 = พัสดุ
      itemCategory = 100,  // 100 = อื่นๆ
      
      codEnabled = 0,      // 0 = ไม่มีเก็บเงินปลายทาง, 1 = มีเก็บเงินปลายทาง
      codAmount = 0,       // จำนวนเงินที่เก็บปลายทาง
    } = req.body;
    
    // สร้างเลขออเดอร์
    const timestamp = Date.now().toString();
    const outTradeNo = `TEST${timestamp}`;
    
    // สร้าง params สำหรับสร้างคำสั่งจัดส่ง
    const params: Record<string, any> = {
      mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
      nonceStr: timestamp,
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
      dstHomePhone: receiverPhone, // ใช้เบอร์เดียวกับเบอร์หลัก
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
      articleCategory: articleCategory,
      expressCategory: expressCategory,
      weight: weight,
      length: length,
      width: width,
      height: height,
      
      // ข้อมูลการชำระเงิน
      settlementType: 1, // 1 = ชำระเงินโดยผู้ส่ง
      payType: 1,        // 1 = ชำระเงินปกติ
      itemCategory: itemCategory,
      
      // ข้อมูลประกัน
      insured: 0,
      insureDeclareValue: 0,
      opdInsureEnabled: 0,
      
      // ข้อมูล COD
      codEnabled: codEnabled,
      codAmount: codAmount,
      
      // ข้อมูลสินค้า
      subItemTypes: JSON.stringify([{
        itemName: "สินค้าทดสอบ",
        itemWeightSize: `${width}*${length}*${height} ${weight/1000}Kg`,
        itemColor: "",
        itemQuantity: "1"
      }]),
      
      // หมายเหตุ
      remark: "ทดสอบ API"
    };
    
    // สร้างลายเซ็น
    const signature = createSignature(params, process.env.FLASH_EXPRESS_API_KEY || '');
    params.sign = signature;
    
    // ส่งคำขอไปยัง Flash Express API เพื่อสร้างคำสั่งจัดส่ง
    const apiUrl = `${FLASH_EXPRESS_API_URL}/v3/orders`;
    console.log('POST request to Flash Express API for creating simple order:', apiUrl);
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    try {
      const response = await axios.post(apiUrl, querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      console.log('Flash Express API create simple order response:', response.data);
      
      // ตรวจสอบการตอบกลับจาก API
      if (response.data.code === 1 && response.data.msg === 'success' && response.data.pno) {
        return res.json({
          success: true,
          message: 'สร้างเลขพัสดุสำเร็จ',
          tracking_number: response.data.pno,
          sort_code: response.data.sortingCode || '00',
          pdf_url: response.data.pdfUrl || null,
          order_number: outTradeNo,
          response: response.data
        });
      } else {
        // ข้อความแจ้งเตือนจาก API
        let errorMessage = '';
        
        if (response.data.message) {
          errorMessage = response.data.message;
        } else if (response.data.msg) {
          errorMessage = response.data.msg;
        } else {
          errorMessage = 'ไม่ทราบสาเหตุ';
        }
        
        return res.status(400).json({
          success: false,
          message: `มีข้อผิดพลาดจาก Flash Express: ${errorMessage}`,
          error_code: response.data.code || 'UNKNOWN',
          response: response.data
        });
      }
    } catch (apiError: any) {
      console.error('Error from Flash Express API create simple order:', apiError);
      
      // ข้อความข้อผิดพลาดจาก Flash Express API
      let errorMessage = 'ไม่สามารถสร้างเลขพัสดุได้';
      let errorData = null;
      
      if (apiError.response) {
        if (apiError.response.data && (apiError.response.data.msg || apiError.response.data.message)) {
          errorMessage = apiError.response.data.msg || apiError.response.data.message;
        } else {
          errorMessage = 'มีข้อผิดพลาดจาก Flash Express API';
        }
        errorData = apiError.response.data;
        console.log('Error data from Flash Express API create simple order:', JSON.stringify(errorData));
      }
      
      return res.status(400).json({
        success: false,
        message: `การสร้างเลขพัสดุล้มเหลว: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        error: errorData
      });
    }
  } catch (error: any) {
    console.error('Error creating simple Flash Express order:', error);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างเลขพัสดุ',
      error: error.message
    });
  }
});

export default router;