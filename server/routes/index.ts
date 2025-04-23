import { Router } from 'express';
import authRoutes from './auth';
import ordersRoutes from './orders';
import usersRoutes from './users';
import uploadRoutes from './upload';
import productsRoutes from './products';
import categoriesRoutes from './categories';
import customersRoutes from './customers';
import locationsRoutes from './locations';
// import shippingRoutes from './shipping'; // Removed Flash Express routes
import adminAuthRoutes from './admin-auth';
import testRoutes from './test';
import dashboardRoutes from './dashboard';
import feeHistoryRoutes from './fee-history';

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
// router.use('/shipping', shippingRoutes); // Removed Flash Express routes
router.use('/test', testRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/fee-history', feeHistoryRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({
    message: 'ระบบจัดการข้อมูลขนส่ง API',
    version: '1.0.0'
  });
});

export default router;