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

  const httpServer = createServer(app);

  return httpServer;
}
