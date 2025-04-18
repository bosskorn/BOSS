import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import categoriesRouter from "./routes/categories";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import orderItemsRouter from "./routes/order-items";
import customersRouter from "./routes/customers";

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

  // ลงทะเบียน routes
  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/order-items", orderItemsRouter);
  app.use("/api/customers", customersRouter);

  const httpServer = createServer(app);

  return httpServer;
}
