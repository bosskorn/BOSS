import { Router } from "express";
import { storage } from "../storage";
import { insertProductSchema } from "@shared/schema";
import { auth, checkOwnership } from "../middleware/auth";

const router = Router();

// ดึงรายการสินค้าทั้งหมดของผู้ใช้
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    
    let products;
    if (categoryId) {
      // ถ้ามีการระบุ category ID ให้ดึงสินค้าเฉพาะหมวดหมู่นั้น
      const category = await storage.getCategory(categoryId);
      
      // ตรวจสอบว่าหมวดหมู่นี้เป็นของผู้ใช้หรือไม่
      if (category && category.userId === userId) {
        products = await storage.getProductsByCategory(categoryId);
      } else {
        return res.status(403).json({
          success: false,
          message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
        });
      }
    } else {
      // ถ้าไม่ได้ระบุ category ID ให้ดึงสินค้าทั้งหมดของผู้ใช้
      products = await storage.getProductsByUserId(userId);
    }
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า"
    });
  }
});

// ดึงข้อมูลสินค้าตาม ID
router.get("/:id", auth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลสินค้า"
      });
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของข้อมูลหรือไม่
    if (product.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า"
    });
  }
});

// สร้างสินค้าใหม่
router.post("/", auth, async (req, res) => {
  try {
    // หากมีการระบุ category ID ให้ตรวจสอบว่าหมวดหมู่นี้เป็นของผู้ใช้หรือไม่
    if (req.body.categoryId) {
      const category = await storage.getCategory(parseInt(req.body.categoryId));
      if (!category || (category.userId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: "หมวดหมู่ที่ระบุไม่ถูกต้องหรือคุณไม่มีสิทธิ์ใช้หมวดหมู่นี้"
        });
      }
    }
    
    // ตรวจสอบข้อมูลที่ส่งมา
    const productData = insertProductSchema.parse({
      ...req.body,
      userId: req.user!.id,
      // แปลง tags จาก string เป็น array ถ้าส่งมาเป็น string
      tags: req.body.tags && typeof req.body.tags === 'string' 
        ? req.body.tags.split(',').map((tag: string) => tag.trim()) 
        : req.body.tags || [],
      // แปลง dimensions จาก string เป็น object ถ้าส่งมาเป็น string
      dimensions: req.body.dimensions && typeof req.body.dimensions === 'string'
        ? JSON.parse(req.body.dimensions)
        : req.body.dimensions || null
    });
    
    // บันทึกข้อมูลสินค้า
    const newProduct = await storage.createProduct(productData);
    
    res.status(201).json({
      success: true,
      message: "สร้างสินค้าสำเร็จ",
      data: newProduct
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างสินค้า",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// อัปเดตข้อมูลสินค้า
router.put("/:id", auth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลสินค้า"
      });
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของข้อมูลหรือไม่
    if (product.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้"
      });
    }
    
    // หากมีการเปลี่ยนแปลง category ID ให้ตรวจสอบว่าหมวดหมู่ใหม่เป็นของผู้ใช้หรือไม่
    if (req.body.categoryId && req.body.categoryId !== product.categoryId) {
      const category = await storage.getCategory(parseInt(req.body.categoryId));
      if (!category || (category.userId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: "หมวดหมู่ที่ระบุไม่ถูกต้องหรือคุณไม่มีสิทธิ์ใช้หมวดหมู่นี้"
        });
      }
    }
    
    // เตรียมข้อมูลสำหรับการอัปเดต
    const updateData = {
      ...req.body,
      // แปลง tags จาก string เป็น array ถ้าส่งมาเป็น string
      tags: req.body.tags && typeof req.body.tags === 'string' 
        ? req.body.tags.split(',').map((tag: string) => tag.trim()) 
        : req.body.tags,
      // แปลง dimensions จาก string เป็น object ถ้าส่งมาเป็น string
      dimensions: req.body.dimensions && typeof req.body.dimensions === 'string'
        ? JSON.parse(req.body.dimensions)
        : req.body.dimensions,
      updatedAt: new Date()
    };
    
    // อัปเดตข้อมูลสินค้า
    const updatedProduct = await storage.updateProduct(productId, updateData);
    
    res.json({
      success: true,
      message: "อัปเดตข้อมูลสินค้าสำเร็จ",
      data: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสินค้า",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;