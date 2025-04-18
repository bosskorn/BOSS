import { Router } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { processFile } from '../services/file-processor';
import path from 'path';
import fs from 'fs';

const router = Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// File filter to only accept CSV, XLS, and XLSX files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('ไม่อนุญาตประเภทไฟล์นี้ รองรับเฉพาะไฟล์ CSV, XLS และ XLSX เท่านั้น'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload and process file
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบไฟล์ที่อัพโหลด'
      });
    }
    
    const { filename, path: filePath, originalname, mimetype } = req.file;
    
    // Process file based on type
    const result = await processFile(filePath, path.extname(originalname).toLowerCase());
    
    res.json({
      success: true,
      message: 'อัพโหลดและประมวลผลไฟล์สำเร็จ',
      filename,
      originalname,
      mimetype,
      records: result.records,
      data: result.data
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์'
    });
  }
});

export default router;
