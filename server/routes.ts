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

export async function registerRoutes(app: Express): Promise<Server> {
  // กำหนดค่า CORS สำหรับ API
  app.use((req, res, next) => {
    // อนุญาต origin ตามเครื่องมือทดสอบ
    const allowedOrigins = ['http://localhost:5000', 'http://localhost:3000', 'https://purpledash.replit.app'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    // อนุญาตให้ส่ง credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(200).json({});
    }
    next();
  });

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

  const httpServer = createServer(app);

  return httpServer;
}
