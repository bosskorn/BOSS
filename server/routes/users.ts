import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname } = req.body;
    
    // Only allow updating certain fields
    const updatedUser = await storage.updateUser(userId, { fullname });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        role: updatedUser.role,
        balance: updatedUser.balance
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลผู้ใช้'
    });
  }
});

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
      });
    }
    
    const users = await storage.getAllUsers();
    
    // Don't return password
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      balance: user.balance
    }));
    
    res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ทั้งหมด'
    });
  }
});

export default router;
