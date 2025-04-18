import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../middleware/auth';
import { processFile } from '../services/file-processor';
import { storage } from '../storage';
import { insertProductSchema, insertCustomerSchema, insertOrderSchema } from '@shared/schema';

// Type declaration for multer
declare module 'express-serve-static-core' {
  interface Request {
    file?: Express.Multer.File;
  }
}

const router = express.Router();

// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const uploadDir = path.join(__dirname, '../../uploads');

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
      cb(null, uploadDir);
    },
    filename: function (req: any, file: any, cb: any) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req: any, file: any, cb: any) {
    const filetypes = /xlsx|xls|csv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ Excel (.xlsx, .xls) และ CSV (.csv) เท่านั้น'));
    }
  }
});

// API สำหรับอัปโหลดและประมวลผลข้อมูลตัวอย่าง
router.post('/preview', auth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบไฟล์ในคำขอ'
      });
    }

    const fileType = req.body.type || 'unknown';
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // ประมวลผลไฟล์และดึงข้อมูลตัวอย่าง
    const result = await processFile(filePath, fileExt);

    // ส่งข้อมูลตัวอย่างกลับไป
    res.json({
      success: true,
      message: `ดึงข้อมูลตัวอย่างสำเร็จ (${result.records} รายการ)`,
      data: result.data,
      type: fileType
    });
  } catch (error: any) {
    console.error('Error preview file:', error);
    res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการประมวลผลไฟล์: ${error.message}`
    });
  }
});

// API สำหรับนำเข้าข้อมูลจากไฟล์
router.post('/import', auth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบไฟล์ในคำขอ'
      });
    }

    const fileType = req.body.type || 'unknown';
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const userId = req.user!.id;

    // ประมวลผลไฟล์และดึงข้อมูลทั้งหมด
    const result = await processFile(filePath, fileExt);

    // จัดการข้อมูลตามประเภท
    let importedCount = 0;

    switch (fileType) {
      case 'products':
        for (const item of result.data) {
          try {
            // เพิ่ม userId เข้าไปในข้อมูล
            const productData = { ...item, userId };
            
            // ตรวจสอบความถูกต้องของข้อมูล
            const validatedData = insertProductSchema.parse(productData);
            
            // บันทึกข้อมูล
            await storage.createProduct(validatedData);
            importedCount++;
          } catch (error) {
            console.error('Error importing product:', error);
            // ทำต่อไปแม้จะมีข้อผิดพลาดในบางรายการ
          }
        }
        break;

      case 'customers':
        for (const item of result.data) {
          try {
            // เพิ่ม userId เข้าไปในข้อมูล
            const customerData = { ...item, userId };
            
            // ตรวจสอบความถูกต้องของข้อมูล
            const validatedData = insertCustomerSchema.parse(customerData);
            
            // บันทึกข้อมูล
            await storage.createCustomer(validatedData);
            importedCount++;
          } catch (error) {
            console.error('Error importing customer:', error);
          }
        }
        break;

      case 'orders':
        for (const item of result.data) {
          try {
            // เพิ่ม userId เข้าไปในข้อมูล
            const orderData = { ...item, userId };
            
            // ตรวจสอบความถูกต้องของข้อมูล
            const validatedData = insertOrderSchema.parse(orderData);
            
            // บันทึกข้อมูล
            await storage.createOrder(validatedData);
            importedCount++;
          } catch (error) {
            console.error('Error importing order:', error);
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'ประเภทข้อมูลไม่ถูกต้อง'
        });
    }

    // ลบไฟล์หลังจากประมวลผลเสร็จ
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `นำเข้าข้อมูลสำเร็จ ${importedCount} รายการ จาก ${result.records} รายการ`,
      records: importedCount,
      total: result.records
    });
  } catch (error: any) {
    console.error('Error importing file:', error);
    res.status(500).json({
      success: false,
      message: `เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${error.message}`
    });
  }
});

export default router;