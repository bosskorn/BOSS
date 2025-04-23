import { Router, Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import querystring from "querystring";
import { auth } from "../auth";

const router = Router();
const BASE_URL = "https://open-api.flashexpress.com/open";

/**
 * สร้างลายเซ็นสำหรับ Flash Express API
 * @param params พารามิเตอร์ที่ใช้ในการคำนวณลายเซ็น
 * @returns ลายเซ็นที่สร้างขึ้น
 */
function createSignature(params: Record<string, any>): string {
  // ตรวจสอบว่ามี API Key หรือไม่
  if (!process.env.FLASH_EXPRESS_API_KEY) {
    throw new Error("Flash Express API key is not configured");
  }

  // คัดลอกพารามิเตอร์และกรองค่า null, undefined, และ empty strings ออก
  const filteredParams: Record<string, any> = {};
  for (const key in params) {
    if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
      filteredParams[key] = params[key];
    }
  }

  // เรียงลำดับคีย์ตามรหัส ASCII
  const sortedKeys = Object.keys(filteredParams).sort();
  
  // สร้าง string ที่จะใช้ในการคำนวณลายเซ็น
  let signatureStr = "";
  sortedKeys.forEach((key) => {
    // หลีกเลี่ยงการใช้ key 'sign' ในการคำนวณลายเซ็น
    if (key !== "sign") {
      let value = filteredParams[key];
      // แปลงค่า object หรือ array เป็น JSON string
      if (typeof value === "object") {
        value = JSON.stringify(value);
      }
      signatureStr += `${key}=${value}&`;
    }
  });

  // เพิ่ม API key ต่อท้าย
  signatureStr += `key=${process.env.FLASH_EXPRESS_API_KEY}`;

  console.log("[Flash Express] String for signature calculation:", signatureStr);

  // คำนวณ SHA-256 hash และแปลงเป็นตัวพิมพ์ใหญ่
  return crypto.createHash("sha256").update(signatureStr).digest("hex").toUpperCase();
}

/**
 * ตรวจสอบข้อมูลเชื่อมต่อกับ Flash Express API
 */
router.get("/check-credentials", auth, async (req: Request, res: Response) => {
  try {
    const merchantId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;

    if (!merchantId || !apiKey) {
      return res.json({
        success: false,
        merchantId: merchantId || "missing",
        apiKeyConfigured: !!apiKey,
        message: "Flash Express API credentials are not fully configured"
      });
    }

    res.json({
      success: true,
      merchantId,
      apiKeyConfigured: true,
      message: "Flash Express API credentials are configured"
    });
  } catch (error: any) {
    console.error("[Flash Express] Error checking credentials:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error checking Flash Express API credentials"
    });
  }
});

/**
 * ทดสอบสร้างออเดอร์กับ Flash Express API ในรูปแบบใหม่
 */
router.post("/test-order-v2", auth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    // ตรวจสอบค่า environment variables
    const mchId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;

    if (!mchId || !apiKey) {
      return res.status(400).json({
        success: false,
        message: "Flash Express API credentials are not configured"
      });
    }

    // สร้าง timestamp และ nonce string
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = crypto.randomUUID().replace(/-/g, "");

    // ข้อมูลผู้ส่ง (จากข้อมูลผู้ใช้)
    const sender = {
      name: user.fullname || "ทดสอบ ผู้ส่ง",
      phone: user.phone || "0812345678",
      address: user.address || "123 ทดสอบ",
      province: user.province || "กรุงเทพมหานคร",
      district: user.district || "บางรัก",
      subdistrict: user.subdistrict || "สีลม",
      postcode: user.zipcode || "10500"
    };

    // ข้อมูลผู้รับ (ข้อมูลทดสอบ)
    const receiver = {
      name: "ทดสอบ ผู้รับ",
      phone: "0987654321",
      address: "456 ถนนฉลองกรุง แขวงลาดกระบัง", // เพิ่มรายละเอียดที่อยู่ให้ชัดเจนขึ้น
      province: "กรุงเทพมหานคร",
      district: "ลาดกระบัง",
      subdistrict: "ลาดกระบัง",
      postcode: "10520"
    };

    // รายการสินค้า
    const items = [
      {
        itemName: "สินค้าทดสอบ",
        itemValue: "1000.00",
        itemQuantity: "1"
      }
    ];

    // กำหนดค่าของพารามิเตอร์สำหรับการส่งคำขอไปยัง Flash Express API
    // ทดลองใช้ชื่อฟิลด์ที่ตรงกับ API v1 ของ Flash Express
    const params: Record<string, any> = {
      mchId,
      nonceStr,
      timestamp,
      orderno: `TEST${Date.now()}`, // เลขที่ออเดอร์ต้องไม่ซ้ำ
      expressCategory: "1", // 1 = ธรรมดา, 2 = ด่วนพิเศษ
      weight: "1", // น้ำหนักในหน่วยกิโลกรัม
      itemCategory: "1", // 1 = ไม่ใช่สินค้าอันตราย, 99 = อื่นๆ
      settlementType: "1", // 1 = ผู้ส่งจ่ายค่าส่ง, 2 = ผู้รับจ่ายค่าส่ง
      insured: "0", // 0 = ไม่ประกัน, 1 = ประกัน
      codEnabled: "0", // 0 = ไม่เก็บเงินปลายทาง, 1 = เก็บเงินปลายทาง
      codAmount: "0", // ยอดเงินที่ต้องเก็บ กรณีเก็บเงินปลายทาง
      remark: "ทดสอบสร้างออเดอร์ Flash Express API รูปแบบใหม่",
      
      // ทดลองใช้ชุดข้อมูลผู้ส่งและผู้รับในรูปแบบของ Flash Express แบบดั้งเดิม
      // ข้อมูลผู้ส่ง
      snd_name: sender.name,
      snd_phone: sender.phone,
      snd_province: sender.province,
      snd_district: sender.district,
      snd_subdistrict: sender.subdistrict,
      snd_zipcode: sender.postcode,
      snd_address: sender.address,
      
      // ข้อมูลผู้รับ
      rcv_name: receiver.name,
      rcv_phone: receiver.phone,
      rcv_province: receiver.province,
      rcv_district: receiver.district,
      rcv_subdistrict: receiver.subdistrict,
      rcv_zipcode: receiver.postcode,
      rcv_address: receiver.address,
      
      // ยังคงเก็บฟิลด์แบบเดิมไว้เผื่อ API ต้องการ
      senderName: sender.name,
      senderPhone: sender.phone,
      senderProvinceName: sender.province,
      senderDistrictName: sender.district,
      senderSubdistrictName: sender.subdistrict,
      senderZipcode: sender.postcode,
      senderAddress: sender.address,
      
      receiverName: receiver.name,
      receiverPhone: receiver.phone,
      receiverProvinceName: receiver.province,
      receiverDistrictName: receiver.district,
      receiverSubdistrictName: receiver.subdistrict,
      receiverZipcode: receiver.postcode,
      receiverAddress: receiver.address,
      
      // ข้อมูลสินค้า
      parcelItems: JSON.stringify(items)
    };

    // คำนวณลายเซ็น
    const sign = createSignature(params);
    params.sign = sign;

    console.log("[Flash Express] Request parameters:", JSON.stringify(params, null, 2));

    // ส่งคำขอไปยัง Flash Express API
    const endpoint = `${BASE_URL}/v3/orders`;
    
    // ใช้ Content-Type เป็น application/x-www-form-urlencoded เท่านั้น
    const response = await axios.post(endpoint, querystring.stringify(params), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    console.log("[Flash Express] API response:", JSON.stringify(response.data, null, 2));

    // ตรวจสอบผลลัพธ์
    if (response.data.code === "0000") {
      return res.json({
        success: true,
        trackingNumber: response.data.data.pno,
        sortCode: response.data.data.sortCode,
        originalResponse: response.data
      });
    } else {
      return res.json({
        success: false,
        message: `Error from Flash Express API: ${response.data.code} - ${response.data.message}`,
        originalResponse: response.data
      });
    }
  } catch (error: any) {
    console.error("[Flash Express] Error creating test order:", error);
    
    // ตรวจสอบว่าเป็น error ที่มีการตอบกลับจาก API หรือไม่
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: `API Error: ${error.response.status} - ${error.message}`,
        data: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Unknown error occurred"
    });
  }
});

export default router;