import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';
import { insertProductSchema } from '@shared/schema';

const router = Router();

// API สำหรับดึงข้อมูลสินค้าทั้งหมด
router.get('/products', auth, async (req, res) => {
  try {
    // ดึงข้อมูลสินค้าของผู้ใช้ที่ล็อกอินเท่านั้น
    const userId = req.user!.id;
    const products = await storage.getProductsByUserId(userId);
    
    // ดึงข้อมูลหมวดหมู่มาเพิ่มเติม
    const productsWithCategory = await Promise.all(
      products.map(async (product) => {
        if (product.categoryId) {
          const category = await storage.getCategory(product.categoryId);
          return {
            ...product,
            category
          };
        }
        return product;
      })
    );
    
    res.json({ success: true, data: productsWithCategory });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

// API สำหรับดึงข้อมูลสินค้าตามรหัส
router.get('/products/:id', auth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'รหัสสินค้าไม่ถูกต้อง' });
    }
    
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึงสินค้านี้หรือไม่
    if (product.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึงสินค้านี้' });
    }
    
    // ดึงข้อมูลหมวดหมู่
    let productWithCategory = { ...product };
    if (product.categoryId) {
      const category = await storage.getCategory(product.categoryId);
      productWithCategory = {
        ...product,
        categoryName
      };
    }
    
    res.json({ success: true, data: productWithCategory });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
  }
});

// API สำหรับสร้างสินค้าใหม่
router.post('/products', auth, async (req, res) => {
  try {
    // ตรวจสอบและแปลงข้อมูลตาม schema
    const productData = insertProductSchema.parse(req.body);
    
    // เพิ่ม userId ให้กับข้อมูลสินค้า
    const productWithUser = {
      ...productData,
      userId: req.user!.id
    };
    
    // บันทึกข้อมูลลงฐานข้อมูล
    const newProduct = await storage.createProduct(productWithUser);
    
    res.status(201).json({ success: true, message: 'สร้างสินค้าสำเร็จ', data: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างสินค้า', error: error });
  }
});

// API สำหรับอัปเดตข้อมูลสินค้า
router.put('/products/:id', auth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'รหัสสินค้าไม่ถูกต้อง' });
    }
    
    // ตรวจสอบว่าสินค้ามีอยู่หรือไม่
    const existingProduct = await storage.getProduct(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์แก้ไขสินค้านี้หรือไม่
    if (existingProduct.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขสินค้านี้' });
    }
    
    // อัปเดตข้อมูลสินค้า
    const updatedProduct = await storage.updateProduct(productId, req.body);
    
    res.json({ success: true, message: 'อัปเดตสินค้าสำเร็จ', data: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' });
  }
});

export default router;
