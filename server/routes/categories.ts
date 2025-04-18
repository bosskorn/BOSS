import { Router } from "express";
import { storage } from "../storage";
import { insertCategorySchema } from "@shared/schema";
import { auth, checkOwnership } from "../middleware/auth";

const router = Router();

// ดึงรายการหมวดหมู่สินค้าทั้งหมดของผู้ใช้
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const parentId = req.query.parentId;
    
    let categories;
    if (parentId === 'null') {
      // ดึงเฉพาะหมวดหมู่หลัก (parentId เป็น null)
      const allCategories = await storage.getCategoriesByUserId(userId);
      categories = allCategories.filter(cat => cat.parentId === null);
    } else if (parentId) {
      // ดึงเฉพาะหมวดหมู่ย่อยของ parentId ที่ระบุ
      const allCategories = await storage.getCategoriesByUserId(userId);
      categories = allCategories.filter(cat => cat.parentId === parseInt(parentId as string));
    } else {
      // ดึงทุกหมวดหมู่
      categories = await storage.getCategoriesByUserId(userId);
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่สินค้า"
    });
  }
});

// ดึงข้อมูลหมวดหมู่สินค้าตาม ID
router.get("/:id", auth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "รหัสหมวดหมู่ไม่ถูกต้อง"
      });
    }
    
    const category = await storage.getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลหมวดหมู่สินค้า"
      });
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของข้อมูลหรือไม่
    if (category.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่สินค้า"
    });
  }
});

// สร้างหมวดหมู่สินค้าใหม่
router.post("/", auth, async (req, res) => {
  try {
    // ตรวจสอบข้อมูลที่ส่งมา
    const categoryData = insertCategorySchema.parse({
      ...req.body,
      userId: req.user!.id
    });
    
    // บันทึกข้อมูลหมวดหมู่สินค้า
    const newCategory = await storage.createCategory(categoryData);
    
    res.status(201).json({
      success: true,
      message: "สร้างหมวดหมู่สินค้าสำเร็จ",
      data: newCategory
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่สินค้า",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// อัปเดตข้อมูลหมวดหมู่สินค้า
router.put("/:id", auth, checkOwnership('id'), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await storage.getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลหมวดหมู่สินค้า"
      });
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของข้อมูลหรือไม่
    if (category.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้"
      });
    }
    
    // อัปเดตข้อมูลหมวดหมู่สินค้า
    const updatedCategory = await storage.updateCategory(categoryId, {
      ...req.body,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: "อัปเดตข้อมูลหมวดหมู่สินค้าสำเร็จ",
      data: updatedCategory
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(400).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลหมวดหมู่สินค้า",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;