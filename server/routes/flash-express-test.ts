import { Router } from "express";
import axios from "axios";
import crypto from "crypto";

const router = Router();

// ฟังก์ชันสร้าง nonceStr
function generateNonceStr(length = 16): string {
  return Array(length)
    .fill(0)
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join("");
}

// ฟังก์ชันสร้างลายเซ็น Flash Express
function generateFlashSignature(params: Record<string, any>, apiKey: string): string {
  // 1. จัดเรียงพารามิเตอร์ตามตัวอักษร (ASCII)
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);

  // 2. เชื่อมต่อเป็นสตริงในรูปแบบ key1=value1&key2=value2
  const stringToSign = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // 3. เพิ่ม API key ที่ท้ายสตริง
  const signString = `${stringToSign}&key=${apiKey}`;
  
  console.log("String to sign:", signString);

  // 4. คำนวณค่า SHA-256 และแปลงเป็นตัวพิมพ์ใหญ่
  return crypto.createHash("sha256").update(signString).digest("hex").toUpperCase();
}

// หน้าทดสอบ Flash Express API
router.get("/", async (req, res) => {
  try {
    // ตรวจสอบการตั้งค่า API
    const hasCredentials = process.env.FLASH_EXPRESS_MERCHANT_ID && process.env.FLASH_EXPRESS_API_KEY;
    if (!hasCredentials) {
      return res.send(`
        <html>
        <head>
          <title>Flash Express API Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; }
            h1 { color: #2563eb; }
            .error { color: #dc2626; padding: 15px; background: #fee2e2; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Flash Express API Test</h1>
          <div class="error">
            <strong>ไม่พบการตั้งค่า API:</strong> กรุณาตั้งค่า FLASH_EXPRESS_MERCHANT_ID และ FLASH_EXPRESS_API_KEY
          </div>
        </body>
        </html>
      `);
    }

    // ข้อมูลสำหรับการทดสอบ
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    const merchantId = process.env.FLASH_EXPRESS_MERCHANT_ID!;
    const apiKey = process.env.FLASH_EXPRESS_API_KEY!;
    
    // 1. ทดสอบ API สำหรับตรวจสอบพื้นที่ให้บริการ
    const checkAreaParams = {
      provinceNameTh: "กรุงเทพมหานคร",
      districtNameTh: "ลาดพร้าว",
      subDistrictNameTh: "จรเข้บัว", 
      nonceStr,
      timestamp,
      merchantId
    };
    
    // สร้างลายเซ็นสำหรับการตรวจสอบพื้นที่
    const checkAreaSignature = generateFlashSignature(checkAreaParams, apiKey);
    
    // ทำการเรียก API
    let checkAreaResult;
    try {
      const checkAreaResponse = await axios.post(
        "https://open-api-tra.flashexpress.com/open/v3/serviceable-area/check-area",
        checkAreaParams,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Flash-Signature": checkAreaSignature,
            "X-Flash-Timestamp": timestamp,
            "X-Flash-Nonce": nonceStr
          }
        }
      );
      checkAreaResult = checkAreaResponse.data;
    } catch (error: any) {
      checkAreaResult = {
        error: error.message,
        response: error.response?.data || "No response data"
      };
    }
    
    // 2. ทดสอบ API สำหรับคำนวณค่าจัดส่ง
    const estimateRateParams = {
      srcProvinceNameTh: "กรุงเทพมหานคร",
      srcCityNameTh: "ลาดพร้าว",
      srcDistrictNameTh: "จรเข้บัว",
      srcPostalCode: "10230",
      dstProvinceNameTh: "กรุงเทพมหานคร",
      dstCityNameTh: "ลาดพร้าว",
      dstDistrictNameTh: "ลาดพร้าว",
      dstPostalCode: "10230",
      weight: "1000",
      merchantId,
      nonceStr,
      timestamp
    };
    
    // สร้างลายเซ็นสำหรับการคำนวณค่าจัดส่ง
    const estimateRateSignature = generateFlashSignature(estimateRateParams, apiKey);
    
    // ทำการเรียก API
    let estimateRateResult;
    try {
      const estimateRateResponse = await axios.post(
        "https://open-api-tra.flashexpress.com/open/v3/orders/estimate-rate",
        estimateRateParams,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Flash-Signature": estimateRateSignature,
            "X-Flash-Timestamp": timestamp,
            "X-Flash-Nonce": nonceStr
          }
        }
      );
      estimateRateResult = estimateRateResponse.data;
    } catch (error: any) {
      estimateRateResult = {
        error: error.message,
        response: error.response?.data || "No response data"
      };
    }
    
    // สร้างหน้าทดสอบ
    res.send(`
      <html>
      <head>
        <title>Flash Express API Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; }
          h1 { color: #2563eb; }
          h2 { color: #3b82f6; margin-top: 30px; }
          pre { background: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto; }
          .success { color: #16a34a; }
          .error { color: #dc2626; }
          .api-info { background: #dbeafe; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .test-section { margin-bottom: 40px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 5px; }
          button { background: #2563eb; color: white; border: none; padding: 10px 15px; 
                  border-radius: 5px; cursor: pointer; margin-top: 10px; }
          button:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <h1>Flash Express API Test</h1>
        
        <div class="api-info">
          <h2>API Configuration</h2>
          <pre>
  Merchant ID: ${merchantId}
  API Key: ****${apiKey.slice(-4)}
  API URL: https://open-api-tra.flashexpress.com
  Timestamp: ${timestamp}
  Nonce String: ${nonceStr}
          </pre>
        </div>
        
        <div class="test-section">
          <h2>Test 1: Check Serviceable Area</h2>
          <h3>Request Parameters:</h3>
          <pre>${JSON.stringify(checkAreaParams, null, 2)}</pre>
          <h3>Generated Signature:</h3>
          <pre>${checkAreaSignature}</pre>
          <h3>Response:</h3>
          <pre>${JSON.stringify(checkAreaResult, null, 2)}</pre>
        </div>
        
        <div class="test-section">
          <h2>Test 2: Estimate Shipping Rate</h2>
          <h3>Request Parameters:</h3>
          <pre>${JSON.stringify(estimateRateParams, null, 2)}</pre>
          <h3>Generated Signature:</h3>
          <pre>${estimateRateSignature}</pre>
          <h3>Response:</h3>
          <pre>${JSON.stringify(estimateRateResult, null, 2)}</pre>
        </div>
        
        <script>
          // เพิ่มสคริปต์ที่นี่ถ้าต้องการ
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Error in Flash Express test page:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// ส่งคำขอ API ที่เตรียมไว้แล้ว
router.post("/create-shipping", async (req, res) => {
  try {
    // ตรวจสอบการตั้งค่า API
    const merchantId = process.env.FLASH_EXPRESS_MERCHANT_ID;
    const apiKey = process.env.FLASH_EXPRESS_API_KEY;
    
    if (!merchantId || !apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing Flash Express credentials" 
      });
    }
    
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = generateNonceStr();
    const orderNumber = `SS${Date.now()}`;
    
    // ข้อมูลการสร้างการจัดส่ง
    const orderData = {
      outTradeNo: orderNumber,
      merchantId,
      srcName: "บริษัท ชิพซิงค์ จำกัด",
      srcPhone: "0829327325",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "ลาดพร้าว",
      srcDistrictName: "จรเข้บัว",
      srcPostalCode: "10230",
      srcDetailAddress: "26 ลาดปลาเค้า 24 แยก 8",
      dstName: "คุณทดสอบ ระบบ",
      dstPhone: "0812345678",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "ลาดพร้าว",
      dstDistrictName: "ลาดพร้าว",
      dstPostalCode: "10230",
      dstDetailAddress: "888 ถ.ลาดพร้าว แขวงลาดพร้าว",
      articleCategory: 1,
      expressCategory: 1,
      weight: 1000,
      insured: 0,
      codEnabled: 0,
      nonceStr,
      timestamp
    };
    
    // คัดลอกข้อมูลส่วน subItemTypes
    const subItemTypes = [
      {
        "item": "เสื้อผ้า",
        "number": 1
      }
    ];
    
    // แปลง subItemTypes เป็นสตริง JSON หลังจากสร้างลายเซ็น
    const orderDataWithoutSubItems = { ...orderData };
    const signature = generateFlashSignature(orderDataWithoutSubItems, apiKey);
    
    // เพิ่ม subItemTypes เข้าไปหลังจากสร้างลายเซ็นแล้ว
    const finalOrderData = {
      ...orderDataWithoutSubItems,
      subItemTypes: JSON.stringify(subItemTypes)
    };
    
    // ส่งคำขอไปยัง Flash Express API
    const response = await axios.post(
      "https://open-api-tra.flashexpress.com/open/v3/orders",
      finalOrderData,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Flash-Signature": signature,
          "X-Flash-Timestamp": timestamp,
          "X-Flash-Nonce": nonceStr
        }
      }
    );
    
    res.json({
      success: true,
      data: response.data,
      requestDetails: {
        url: "https://open-api-tra.flashexpress.com/open/v3/orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Flash-Signature": signature,
          "X-Flash-Timestamp": timestamp,
          "X-Flash-Nonce": nonceStr
        },
        data: finalOrderData
      }
    });
  } catch (error: any) {
    console.error("Error creating shipping:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response?.data || "No response data",
      stack: error.stack
    });
  }
});

export default router;