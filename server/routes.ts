import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // กำหนดค่า CORS สำหรับ API
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
      return res.status(200).json({});
    }
    next();
  });

  // ตั้งค่าระบบ Authentication
  setupAuth(app);

  // สร้าง API endpoint สำหรับดึงข้อมูล category
  app.get("/api/categories", async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      const categories = await storage.getCategoriesByUserId(userId);
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // สร้าง API endpoint สำหรับดึงข้อมูล product
  app.get("/api/products", async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      const products = await storage.getProductsByUserId(userId);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // สร้าง API endpoint สำหรับดึงข้อมูล orders
  app.get("/api/orders", async (req, res) => {
    try {
      const userId = req.user?.id || 0;
      const orders = await storage.getOrdersByUserId(userId);
      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
