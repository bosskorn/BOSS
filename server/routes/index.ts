import { Router } from 'express';
import authRoutes from './auth';
import ordersRoutes from './orders';
import usersRoutes from './users';
import uploadRoutes from './upload';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/orders', ordersRoutes);
router.use('/users', usersRoutes);
router.use('/upload', uploadRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({
    message: 'ระบบจัดการข้อมูลขนส่ง API',
    version: '1.0.0'
  });
});

export default router;
