import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';
import { createFlashExpressShipping } from '../services/flash-express';

const router = Router();

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await storage.getAllOrders();
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ'
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await storage.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(`Error fetching order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ'
    });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const orderData = req.body;
    
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Generate order number if not provided
    if (!orderData.order_number) {
      // สร้างเลขออเดอร์ในรูปแบบ PD + ปีเดือนวัน + เลข 4 หลักสุดท้ายของ timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      orderData.order_number = `PD${year}${month}${day}${random}`;
      
      console.log(`สร้างเลขออเดอร์อัตโนมัติ: ${orderData.order_number}`);
    }
    
    // ตรวจสอบและเพิ่มข้อมูลที่จำเป็น
    if (!orderData.hasOwnProperty('subtotal')) {
      orderData.subtotal = orderData.total || 0;
    }
    
    if (!orderData.hasOwnProperty('total_amount')) {
      orderData.total_amount = orderData.total || 0;
    }
    
    if (!orderData.hasOwnProperty('shipping_fee')) {
      orderData.shipping_fee = 0;
    }
    
    if (!orderData.hasOwnProperty('discount')) {
      orderData.discount = 0;
    }
    
    // Set user ID from the authenticated user
    if (req.user && !orderData.user_id) {
      orderData.userId = (req.user as any).id;
    }
    
    // Check for COD payment method to handle Flash Express integration
    const isCashOnDelivery = orderData.payment_method === 'cash_on_delivery';
    
    console.log('Processed order data ready for storage:', JSON.stringify(orderData, null, 2));
    
    // Store order in database
    const order = await storage.createOrder(orderData);
    
    // If this is a COD order, create shipping label with Flash Express
    if (isCashOnDelivery && orderData.shipping_service_id && order.id) {
      try {
        // Get customer information
        const customer = await storage.getCustomer(orderData.customer_id);
        
        if (customer) {
          // Get user information (merchant/sender) from session
          const user = req.user as any;
          
          // Prepare sender information (merchant)
          const senderInfo = {
            name: user.fullname || user.username,
            phone: user.phone || '0800000000', // Fallback
            address: user.address || 'PURPLEDASH Office',
            province: 'กรุงเทพมหานคร', // Default or from user profile
            district: 'บางรัก',
            subdistrict: 'สีลม',
            zipcode: '10500'
          };
          
          // Prepare recipient information (customer)
          const recipientInfo = {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            province: customer.province,
            district: customer.district,
            subdistrict: customer.subdistrict,
            zipcode: customer.zipcode
          };
          
          // Prepare parcel information
          const parcelInfo = {
            serviceId: orderData.shipping_service_id,
            weight: 1.0, // Default weight or calculate based on items
          };
          
          // Call Flash Express API to create shipping label with COD
          const flashExpressResponse = await createFlashExpressShipping(
            order.orderNumber,
            senderInfo,
            recipientInfo,
            parcelInfo,
            true, // isCOD
            orderData.total // COD amount
          );
          
          // Store tracking information if available
          if (flashExpressResponse && flashExpressResponse.tracking_number) {
            await storage.updateOrder(order.id, {
              trackingNumber: flashExpressResponse.tracking_number,
              shippingLabel: flashExpressResponse.label_url
            });
          }
        }
      } catch (shippingError) {
        // Log shipping error but don't fail order creation
        console.error('Error creating Flash Express shipping for COD order:', shippingError);
      }
    }
    
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อใหม่'
    });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    const orderData = req.body;
    const order = await storage.updateOrder(req.params.id, orderData);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(`Error updating order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดตคำสั่งซื้อ'
    });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await storage.deleteOrder(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    res.json({
      success: true,
      message: 'ลบคำสั่งซื้อสำเร็จ'
    });
  } catch (error) {
    console.error(`Error deleting order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ'
    });
  }
});

// Get summary data for dashboard
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await storage.getOrdersSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching orders summary:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปยอดขาย'
    });
  }
});

export default router;
