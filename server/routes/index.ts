import { Router } from 'express';
import authRoutes from './auth';
import ordersRoutes from './orders';
import usersRoutes from './users';
import uploadRoutes from './upload';
import productsRoutes from './products';
import categoriesRoutes from './categories';
import customersRoutes from './customers';
import locationsRoutes from './locations';
import shippingRoutes from './shipping';
import adminAuthRoutes from './admin-auth';
import testRoutes from './test';

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
router.use('/shipping', shippingRoutes);
router.use('/test', testRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({
    message: 'ระบบจัดการข้อมูลขนส่ง API',
    version: '1.0.0'
  });
});

export default router;
