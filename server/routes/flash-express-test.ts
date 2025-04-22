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
          .tracking-info { background: #dcfce7; padding: 15px; border-radius: 5px; margin-top: 20px; display: none; }
          .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0, 0, 0, 0.1); 
                  border-radius: 50%; border-top-color: #2563eb; animation: spin 1s ease-in-out infinite; 
                  margin-left: 10px; vertical-align: middle; }
          @keyframes spin { to { transform: rotate(360deg); } }
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

        <div class="test-section">
          <h2>Test 3: Create Shipping and Get Tracking Number</h2>
          <p>ทดสอบสร้างการจัดส่งจริงและรับเลขพัสดุจาก Flash Express:</p>
          <button id="createShippingBtn" onclick="testCreateShipping()">สร้างการจัดส่ง</button>
          <span id="loadingSpinner" class="loading" style="display: none;"></span>
          
          <div id="trackingInfo" class="tracking-info">
            <h3>ผลลัพธ์:</h3>
            <div id="createShippingResult"></div>
            
            <h3 id="trackingNumberTitle" style="display: none;">เลขพัสดุที่ได้รับ:</h3>
            <div id="trackingNumberDisplay" style="font-size: 24px; font-weight: bold; margin: 15px 0;"></div>
          </div>
        </div>
        
        <script>
          async function testCreateShipping() {
            const button = document.getElementById('createShippingBtn');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const trackingInfo = document.getElementById('trackingInfo');
            const resultArea = document.getElementById('createShippingResult');
            const trackingNumberTitle = document.getElementById('trackingNumberTitle');
            const trackingNumberDisplay = document.getElementById('trackingNumberDisplay');
            
            // แสดงสถานะกำลังโหลด
            button.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            resultArea.innerHTML = 'กำลังดำเนินการ...';
            trackingInfo.style.display = 'block';
            
            try {
              const response = await fetch('/flash-express-test/create-shipping', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              const result = await response.json();
              
              // แสดงผลลัพธ์
              resultArea.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
              
              // แสดงเลขพัสดุถ้ามี
              if (result.success && result.data && result.data.trackingNo) {
                trackingNumberTitle.style.display = 'block';
                trackingNumberDisplay.innerHTML = '<span style="color: #16a34a;">✅ ' + result.data.trackingNo + '</span>';
              } else {
                trackingNumberTitle.style.display = 'block';
                trackingNumberDisplay.innerHTML = '<span style="color: #dc2626;">❌ ไม่สามารถดึงเลขพัสดุได้</span>';
              }
            } catch (error) {
              resultArea.innerHTML = '<pre class="error">เกิดข้อผิดพลาด: ' + error.message + '</pre>';
            } finally {
              // ปิดสถานะโหลด
              button.disabled = false;
              loadingSpinner.style.display = 'none';
            }
          }
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
    
    console.log("=== การสร้างการจัดส่ง Flash Express ===");
    console.log("URL:", "https://open-api-tra.flashexpress.com/open/v3/orders");
    console.log("ข้อมูลที่ใช้สร้างลายเซ็น:", orderDataWithoutSubItems);
    console.log("ลายเซ็นที่สร้าง:", signature);
    console.log("subItemTypes ที่แนบ (หลังสร้างลายเซ็น):", subItemTypes);
    console.log("ข้อมูลที่ส่งไปยัง API:", finalOrderData);
    console.log("Headers:", {
      "Content-Type": "application/json",
      "X-Flash-Signature": signature,
      "X-Flash-Timestamp": timestamp,
      "X-Flash-Nonce": nonceStr
    });
    
    console.log("กำลังส่งคำขอไปยัง Flash Express API...");
    // ส่งคำขอไปยัง Flash Express API - ตรวจสอบ URL อีกครั้ง
    const apiUrl = "https://open-api-tra.flashexpress.com/open/v3/orders";
    console.log("API URL:", apiUrl);
    
    // แปลง payload เป็น URL-encoded string ตามรูปแบบที่ต้องการของ Flash Express API
    const encodedPayload = new URLSearchParams(finalOrderData as Record<string, string>).toString();
    console.log("ข้อมูลที่ส่งหลังแปลงเป็น URL-encoded:", encodedPayload);
    
    const response = await axios.post(
      apiUrl,
      encodedPayload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // เปลี่ยนเป็น form-urlencoded
          "X-Flash-Signature": signature,
          "X-Flash-Timestamp": timestamp,
          "X-Flash-Nonce": nonceStr
        }
      }
    );
    
    console.log("การตอบกลับจาก API:", response.data);
    
    res.json({
      success: true,
      data: response.data,
      requestDetails: {
        url: "https://open-api-tra.flashexpress.com/open/v3/orders",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Flash-Signature": signature,
          "X-Flash-Timestamp": timestamp,
          "X-Flash-Nonce": nonceStr
        },
        data: finalOrderData,
        encodedData: encodedPayload
      }
    });
  } catch (error: any) {
    console.error("Error creating shipping:", error);
    
    // เพิ่มการตรวจสอบและบันทึกข้อมูลเพิ่มเติมเพื่อการวิเคราะห์
    if (error.response) {
      // การตอบกลับจากเซิร์ฟเวอร์ด้วยสถานะไม่ใช่ 2xx
      console.error("Response error data:", error.response.data);
      console.error("Response error status:", error.response.status);
      console.error("Response error headers:", error.response.headers);
      
      res.status(500).json({
        success: false,
        error: error.message,
        responseStatus: error.response.status,
        responseData: 
          typeof error.response.data === 'string' && error.response.data.includes('<html') 
            ? "ได้รับ HTML แทนที่จะเป็น JSON (อาจเป็น URL ไม่ถูกต้องหรือปัญหาการเข้าถึง API)"
            : error.response.data,
        htmlReceived: typeof error.response.data === 'string' && error.response.data.includes('<html')
      });
    } else if (error.request) {
      // การร้องขอถูกสร้างแต่ไม่ได้รับการตอบกลับ
      console.error("No response received:", error.request);
      res.status(500).json({
        success: false,
        error: "ไม่ได้รับการตอบกลับจาก Flash Express API",
        request: "Request was made but no response was received"
      });
    } else {
      // มีข้อผิดพลาดในการตั้งค่าคำขอ
      console.error("Error details:", error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }
});

export default router;