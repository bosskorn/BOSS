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
    if (!orderData.orderNumber) {
      // สร้างเลขออเดอร์ในรูปแบบ PD + ปีเดือนวัน + เลข 4 หลักสุดท้ายของ timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      orderData.orderNumber = `PD${year}${month}${day}${random}`;
      
      console.log(`สร้างเลขออเดอร์อัตโนมัติ: ${orderData.orderNumber}`);
    }
    
    // มีการส่งชื่อฟิลด์แบบ order_number แต่ฐานข้อมูลใช้ชื่อแบบ camelCase
    if (orderData.order_number && !orderData.orderNumber) {
      orderData.orderNumber = orderData.order_number;
      delete orderData.order_number;
    }
    
    // ตรวจสอบและเพิ่มข้อมูลที่จำเป็น camelCase สำหรับ Drizzle ORM
    if (!orderData.hasOwnProperty('subtotal')) {
      orderData.subtotal = orderData.total || 0;
    }
    
    if (!orderData.hasOwnProperty('totalAmount')) {
      orderData.totalAmount = orderData.total || 0;
      
      // แปลงค่าจาก snake_case เป็น camelCase ถ้ามี
      if (orderData.total_amount) {
        orderData.totalAmount = orderData.total_amount;
        delete orderData.total_amount;
      }
    }
    
    if (!orderData.hasOwnProperty('shippingFee')) {
      orderData.shippingFee = 0;
      
      // แปลงค่าจาก snake_case เป็น camelCase ถ้ามี
      if (orderData.shipping_fee) {
        orderData.shippingFee = orderData.shipping_fee;
        delete orderData.shipping_fee;
      }
    }
    
    if (!orderData.hasOwnProperty('discount')) {
      orderData.discount = 0;
    }
    
    // Set user ID from the authenticated user
    if (req.user && !orderData.userId) {
      orderData.userId = (req.user as any).id;
      
      // แปลงค่าจาก snake_case เป็น camelCase ถ้ามี
      if (orderData.user_id) {
        orderData.userId = orderData.user_id;
        delete orderData.user_id;
      }
    }
    
    // Check for COD payment method to handle Flash Express integration
    const isCashOnDelivery = orderData.payment_method === 'cash_on_delivery';
    
    // แปลงชื่อฟิลด์อื่นๆ จาก snake_case เป็น camelCase
    if (orderData.payment_method && !orderData.paymentMethod) {
      orderData.paymentMethod = orderData.payment_method;
      delete orderData.payment_method;
    }
    
    if (orderData.customer_id && !orderData.customerId) {
      orderData.customerId = orderData.customer_id;
      delete orderData.customer_id;
    }
    
    if (orderData.shipping_method_id && !orderData.shippingMethodId) {
      orderData.shippingMethodId = orderData.shipping_method_id;
      delete orderData.shipping_method_id;
    }
    
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
          
          // Store tracking information if available and successful
          if (flashExpressResponse && flashExpressResponse.success && flashExpressResponse.trackingNumber) {
            await storage.updateOrder(order.id, {
              trackingNumber: flashExpressResponse.trackingNumber,
              status: 'processing'
            });
          } else {
            // If Flash Express API failed, delete the order and return error
            await storage.deleteOrder(order.id);
            return res.status(400).json({
              success: false,
              message: flashExpressResponse.error || 'ไม่สามารถสร้างเลขพัสดุได้ กรุณาลองใหม่อีกครั้ง'
            });
          }
        }
      } catch (shippingError) {
        // Delete the order if shipping creation fails and return error
        await storage.deleteOrder(order.id);
        return res.status(400).json({
          success: false,
          message: shippingError.message || 'เกิดข้อผิดพลาดในการสร้างการจัดส่ง กรุณาลองใหม่อีกครั้ง'
        });
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
