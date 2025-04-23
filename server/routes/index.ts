import { Router } from 'express';
import authRoutes from './auth';
import ordersRoutes from './orders-new';
import usersRoutes from './users';
import uploadRoutes from './upload';
import productsRoutes from './products';
import categoriesRoutes from './categories';
import customersRoutes from './customers';
import locationsRoutes from './locations';
import adminAuthRoutes from './admin-auth';
import testRoutes from './test';
import dashboardRoutes from './dashboard';
import feeHistoryRoutes from './fee-history';
import testFlashExpressRoutes from './test-flash-express';
import flashExpressRoutes from './flash-express'; // เพิ่มเส้นทาง Flash Express
import flashExpressTestRoutes from './flash-express-test'; // เพิ่มเส้นทางทดสอบ Flash Express
import pickupTestRoutes from './pickup-test'; // เพิ่มเส้นทางทดสอบการเรียกรถ
import warehouseRoutes from './flash-express-warehouse'; // เพิ่มเส้นทางเรียกดูข้อมูลคลังสินค้า
import apiTestRoutes from './api-test'; // เพิ่มเส้นทางทดสอบ API

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin-auth', adminAuthRoutes);
router.use('/orders', ordersRoutes);
router.use('/users', usersRoutes);
router.use('/upload', uploadRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/customers', customersRoutes);
router.use('/locations', locationsRoutes);
router.use('/test', testRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/fee-history', feeHistoryRoutes);
router.use('/flash-express-test', flashExpressTestRoutes); // เส้นทางทดสอบ Flash Express API
router.use('/flash-express', flashExpressRoutes); // เส้นทาง Flash Express API
router.use('/test-flash-express', testFlashExpressRoutes); // เส้นทางทดสอบเก่าสำหรับความเข้ากันได้
router.use('/pickup-test', pickupTestRoutes); // เพิ่มเส้นทางทดสอบการเรียกรถเข้ารับพัสดุ
router.use('/warehouses', warehouseRoutes); // เพิ่มเส้นทางเรียกดูข้อมูลคลังสินค้า
router.use('/api-test', apiTestRoutes); // เพิ่มเส้นทางทดสอบ API

// Base API route
router.get('/', (req, res) => {
  res.json({
    message: 'ระบบจัดการข้อมูลขนส่ง API',
    version: '1.0.0'
  });
});

export default router;