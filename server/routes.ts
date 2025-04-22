import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import categoriesRouter from "./routes/categories";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import orderItemsRouter from "./routes/order-items";
import customersRouter from "./routes/customers";
import shippingMethodsRouter from "./routes/shipping-methods";
import adminAuthRouter from "./routes/admin-auth";
import reportsRouter from "./routes/reports";
import shippingRouter from "./routes/shipping";
import uploadRouter from "./routes/upload";
import userProfileRouter from "./routes/user-profile";
import topupsRouter from "./routes/topups-fixed";
import locationsRouter from "./routes/locations";
import mockShippingRouter from "./routes/mock-shipping";
import dashboardRouter from "./routes/dashboard";
import stripeRouter from "./routes/stripe";
import feeHistoryRouter from "./routes/fee-history";

export async function registerRoutes(app: Express): Promise<Server> {
  // แสดงข้อมูลข้อมูลของทุกคำขอเพื่อแก้ไขปัญหา
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Session ID: ${req.sessionID || 'no session'}`);
    if (req.user) {
      console.log(`User authenticated: ${req.user.username} (${req.user.id})`);
    }
    next();
  });

  // กำหนดค่า CORS ได้ตั้งค่าไว้ใน index.ts แล้ว

  // ตั้งค่าระบบ Authentication
  setupAuth(app);

  // ลงทะเบียน routes
  app.use("/api", adminAuthRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/order-items", orderItemsRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/shipping-methods", shippingMethodsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/shipping", shippingRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/user", userProfileRouter);
  app.use("/api/topups", topupsRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/mock-shipping", mockShippingRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/stripe", stripeRouter);
  app.use("/api/fee-history", feeHistoryRouter);

  // ตรวจสอบสถานะ Flash Express API
  app.get("/api/flash-express/status", (req, res) => {
    const hasCredentials = process.env.FLASH_EXPRESS_MERCHANT_ID && process.env.FLASH_EXPRESS_API_KEY;
    res.json({
      enabled: !!hasCredentials,
      merchantId: hasCredentials ? "configured" : "missing",
      apiKey: hasCredentials ? "configured" : "missing",
    });
  });
  
  // เพิ่มเส้นทางสำหรับทดสอบ Flash Express API โดยเฉพาะ
  app.get("/flash-express-final", async (req, res) => {
    try {
      const { createFlashExpressShipping, getFlashExpressShippingOptions } = require('./services/flash-express-final');
      const crypto = require('crypto');
      
      // สร้างข้อมูลสำหรับทดสอบการเรียก API
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonceStr = Array(16).fill(0).map(() => Math.floor(Math.random() * 36).toString(36)).join('');
      const orderNumber = `SS${Date.now()}`;
      
      // เตรียมข้อมูลสำหรับทดสอบ
      const testData = {
        outTradeNo: orderNumber, 
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
        nonceStr: nonceStr,
        timestamp: timestamp
      };

      // ทดสอบคำนวณค่าส่ง
      const shippingRatesResult = await getFlashExpressShippingOptions(
        {
          province: "กรุงเทพมหานคร",
          district: "ลาดพร้าว",
          subdistrict: "จรเข้บัว",
          zipcode: "10230"
        },
        {
          province: "กรุงเทพมหานคร",
          district: "ลาดพร้าว",
          subdistrict: "ลาดพร้าว",
          zipcode: "10230"
        },
        { weight: 1.0 }
      );
      
      // แสดงการตั้งค่า API
      const apiConfig = {
        merchant_id: process.env.FLASH_EXPRESS_MERCHANT_ID,
        api_key_last_4_chars: process.env.FLASH_EXPRESS_API_KEY ? 
          "****" + process.env.FLASH_EXPRESS_API_KEY.slice(-4) : "not_configured",
        api_url: "https://open-api-tra.flashexpress.com"
      };
      
      // ส่งข้อมูลกลับ
      res.send(`
        <html>
        <head>
          <title>Flash Express API Test Page</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #2563eb; }
            h2 { color: #3b82f6; margin-top: 30px; }
            pre { background: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .success { color: #16a34a; }
            .error { color: #dc2626; }
            .api-info { background: #dbeafe; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            button { background: #2563eb; color: white; border: none; padding: 10px 15px; 
                    border-radius: 5px; cursor: pointer; margin-top: 10px; }
            button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <h1>Flash Express API Test Page</h1>
          
          <div class="api-info">
            <h2>API Configuration</h2>
            <pre>${JSON.stringify(apiConfig, null, 2)}</pre>
          </div>
          
          <h2>Test Data</h2>
          <pre>${JSON.stringify(testData, null, 2)}</pre>
          
          <h2>Shipping Rates Result</h2>
          <pre>${JSON.stringify(shippingRatesResult, null, 2)}</pre>
          
          <h2>Test Create Shipping</h2>
          <button onclick="testCreateShipping()">Create Test Shipping</button>
          <div id="result"></div>
          
          <script>
            async function testCreateShipping() {
              try {
                const response = await fetch('/api/shipping-methods/flash-express/shipping', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    orderData: ${JSON.stringify(testData)}
                  })
                });
                
                const result = await response.json();
                document.getElementById('result').innerHTML = 
                  '<h3>' + (result.success ? '<span class="success">สำเร็จ!</span>' : '<span class="error">ล้มเหลว!</span>') + '</h3>' +
                  '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
              } catch (error) {
                document.getElementById('result').innerHTML = 
                  '<h3><span class="error">เกิดข้อผิดพลาด!</span></h3>' +
                  '<pre>' + error.toString() + '</pre>';
              }
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Flash Express test page:', error);
      res.status(500).send(`Error: ${error.message}`);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
