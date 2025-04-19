import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';
import { createFlashExpressShipping } from '../services/flash-express';

const router = Router();

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    // ดึงข้อมูลออเดอร์ตาม user ID จากผู้ใช้ที่ล็อกอิน
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    const userId = req.user.id;
    const orders = await storage.getOrdersByUserId(userId);
    
    res.json({
      success: true,
      data: orders // ส่งกลับในรูปแบบ data field ตามมาตรฐานของแอป
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
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบ ID ไม่ถูกต้อง'
      });
    }
    
    const order = await storage.getOrder(orderId);
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
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบ ID ไม่ถูกต้อง'
      });
    }
    
    const orderData = req.body;
    const order = await storage.updateOrder(orderId, orderData);
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
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบ ID ไม่ถูกต้อง'
      });
    }
    
    const result = await storage.deleteOrder(orderId);
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
    // ดึงข้อมูลออเดอร์ของผู้ใช้ปัจจุบัน
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    const userId = req.user.id;
    const orders = await storage.getOrdersByUserId(userId);
    
    // คำนวณข้อมูลสรุปต่างๆ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= thisMonth;
    });
    
    // คำนวณยอดขาย 7 วันล่าสุด
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      const total = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        total
      });
    }
    
    // รายการออเดอร์ล่าสุด 5 รายการ
    const latestOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customerName,
        total: order.totalAmount || 0
      }));
    
    const summary = {
      todayTotal: todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      monthTotal: monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      last7Days,
      latestOrders
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching orders summary:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปยอดขาย'
    });
  }
});

export default router;
