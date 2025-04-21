import { Router } from 'express';
import { storage } from '../storage';
import { auth } from '../middleware/auth';
import { createFlashExpressShipping } from '../services/flash-express';
import { db } from '../db';
import { users, feeHistory } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
    // ดึงข้อมูลออเดอร์พื้นฐาน
    const basicOrders = await storage.getOrdersByUserId(userId);
    
    // เพิ่มข้อมูลที่จำเป็นสำหรับการแสดงผลในตาราง
    const ordersWithDetails = await Promise.all(basicOrders.map(async (order) => {
      // ดึงข้อมูลรายการสินค้าในออเดอร์
      const orderItems = await storage.getOrderItems(order.id);
      
      // ดึงข้อมูลลูกค้า (ถ้ามี)
      let customer = null;
      if (order.customerId) {
        customer = await storage.getCustomer(order.customerId);
      }
      
      return {
        ...order,
        items: orderItems.length, // จำนวนรายการสินค้า
        customerName: customer ? customer.name : 'ไม่ระบุ',
        // ข้อมูลเพิ่มเติมอื่นๆ ที่ต้องการ
      };
    }));
    
    res.json({
      success: true,
      data: ordersWithDetails // ส่งกลับในรูปแบบ data field ตามมาตรฐานของแอป
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
    
    // ดึงข้อมูลสินค้าในออเดอร์
    const orderItems = await storage.getOrderItems(orderId);
    
    // เพิ่มข้อมูลสินค้าให้กับรายการสินค้า
    const orderItemsWithProductDetails = await Promise.all(orderItems.map(async (item) => {
      // แปลงข้อมูลตัวเลขให้เป็นตัวเลขจริงๆ
      const quantity = parseInt(item.quantity as any, 10) || 1;
      const price = parseFloat(item.price as any) || 0;
      const discount = parseFloat(item.discount as any || '0') || 0;
      
      // คำนวณยอดรวมของสินค้าแต่ละรายการ
      const total = (quantity * price) - discount;
      
      // ถ้ามี productId ให้ดึงข้อมูลสินค้า
      if (item.productId) {
        try {
          const product = await storage.getProduct(item.productId);
          if (product) {
            return {
              ...item,
              productName: product.name,
              sku: product.sku,
              imageUrl: product.imageUrl,
              quantity: quantity,
              price: price,
              discount: discount,
              total: total
            };
          }
        } catch (err) {
          console.error(`ไม่สามารถดึงข้อมูลสินค้า ID: ${item.productId}`, err);
        }
      }
      
      // ถ้าไม่พบสินค้าหรือไม่มี productId ใช้ข้อมูลเดิม
      return {
        ...item,
        productName: item.productName || 'ไม่ระบุสินค้า',
        sku: item.sku || '',
        quantity: quantity,
        price: price,
        discount: discount,
        total: total
      };
    }));
    
    // ดึงข้อมูลลูกค้า
    let customer = null;
    if (order.customerId) {
      customer = await storage.getCustomer(order.customerId);
    }
    
    // สร้างข้อมูลสำหรับส่งกลับไปยัง client
    const orderWithDetails = {
      ...order,
      customerName: customer ? customer.name : 'ไม่ระบุ',
      customerPhone: customer ? customer.phone : '',
      customerEmail: customer ? customer.email : '',
      customerAddress: customer ? customer.address : '',
      customerProvince: customer ? customer.province : '',
      customerDistrict: customer ? customer.district : '',
      customerSubdistrict: customer ? customer.subdistrict : '',
      customerZipcode: customer ? customer.zipcode : '',
      customerAddressNumber: customer ? customer.addressNumber : '',
      customerRoad: customer ? customer.road : '',
      customerMoo: customer ? customer.moo : '',
      customerSoi: customer ? customer.soi : '',
      customerBuilding: customer ? customer.building : '',
      customerFloor: customer ? customer.floor : '',
      items: orderItemsWithProductDetails
    };
    
    res.json({
      success: true,
      order: orderWithDetails
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
    
    // ตรวจสอบเครดิตของผู้ใช้ - ต้องมีเครดิตอย่างน้อย 25 บาทต่อออเดอร์
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    // ดึงข้อมูลผู้ใช้เพื่อตรวจสอบเครดิต
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    // ค่าธรรมเนียมต่อออเดอร์
    const ORDER_FEE = 25; // 25 บาทต่อออเดอร์
    
    // แปลงเครดิตเป็นตัวเลข
    const userBalance = user.balance ? parseFloat(user.balance.toString()) : 0;
    
    // ตรวจสอบว่าเครดิตเพียงพอหรือไม่
    if (userBalance < ORDER_FEE) {
      return res.status(400).json({
        success: false,
        message: `เครดิตไม่เพียงพอสำหรับการสร้างออเดอร์ (ต้องการ ${ORDER_FEE} บาท, คงเหลือ ${userBalance.toFixed(2)} บาท)`
      });
    }
    
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
      // ถ้ามี shippingCost ให้ใช้ค่านั้น อย่างอื่นใช้ค่าเริ่มต้น 40
      orderData.shippingFee = orderData.shippingCost || 40;
      
      // แปลงค่าจาก snake_case เป็น camelCase ถ้ามี
      if (orderData.shipping_fee) {
        orderData.shippingFee = orderData.shipping_fee;
        delete orderData.shipping_fee;
      }
      
      console.log('ตั้งค่าขนส่งเป็น:', orderData.shippingFee);
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
    
    // สร้างข้อมูลลูกค้าก่อนถ้ามีการส่งชื่อและเบอร์โทรมา แต่ไม่มี customerId
    if (!orderData.customerId && orderData.customerName) {
      try {
        console.log('ไม่มี customerId แต่มีชื่อลูกค้า, กำลังสร้างข้อมูลลูกค้าใหม่');
        
        // สร้างข้อมูลลูกค้าใหม่จากข้อมูลในออเดอร์
        const customerData = {
          userId: orderData.userId,
          name: orderData.customerName || 'ไม่ระบุชื่อ',
          phone: orderData.customerPhone || '',
          address: orderData.fullAddress || '',
          subdistrict: orderData.subdistrict || '',
          district: orderData.district || '',
          province: orderData.province || '',
          zipcode: orderData.zipcode || '',
          addressNumber: orderData.addressNumber || '',  // ใช้ addressNumber เท่านั้น
          road: orderData.road || '',
          moo: orderData.village || orderData.moo || '',
          soi: orderData.soi || '',
          building: orderData.building || '',
          floor: orderData.floor || '',
          email: '',
          notes: `ลูกค้าจากออเดอร์ ${orderData.orderNumber}`
        };
        
        const newCustomer = await storage.createCustomer(customerData);
        console.log('สร้างข้อมูลลูกค้าใหม่สำเร็จ:', newCustomer);
        
        // เชื่อมโยงลูกค้ากับออเดอร์
        orderData.customerId = newCustomer.id;
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างข้อมูลลูกค้าใหม่:', error);
        // ไม่ต้อง throw error แค่ไม่เชื่อมโยงลูกค้า
      }
    }
    
    // Store order in database
    const order = await storage.createOrder(orderData);
    
    // หักค่าธรรมเนียมจากเครดิตของผู้ใช้ (25 บาทต่อออเดอร์)
    try {
      // ค่าธรรมเนียมต่อออเดอร์
      const ORDER_FEE = 25; // 25 บาทต่อออเดอร์
      
      // คำนวณยอดเงินคงเหลือใหม่
      const newBalance = userBalance - ORDER_FEE;
      
      // อัพเดตเครดิตในฐานข้อมูล
      await db.update(users)
        .set({ 
          balance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(users.id, req.user.id));
      
      // บันทึกประวัติการหักค่าธรรมเนียม
      await db.insert(feeHistory)
        .values({
          userId: req.user.id,
          orderId: order.id,
          amount: ORDER_FEE.toString(),
          balanceBefore: userBalance.toString(),
          balanceAfter: newBalance.toString(),
          description: `ค่าธรรมเนียมการสร้างออเดอร์ #${order.orderNumber}`,
          feeType: 'order',
          createdAt: new Date()
        });
      
      console.log(`หักค่าธรรมเนียมออเดอร์ ${ORDER_FEE} บาท จากเครดิตผู้ใช้ ${req.user.username} เครดิตคงเหลือ ${newBalance.toFixed(2)} บาท`);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการหักค่าธรรมเนียมออเดอร์:', error);
      // ไม่ต้อง throw error ให้ดำเนินการต่อไป แต่บันทึก log ไว้
    }
    
    // บันทึกข้อมูลรายการสินค้า (order items) ถ้ามี
    if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
      console.log(`เพิ่มรายการสินค้าจำนวน ${orderData.items.length} รายการ`);
      
      for (const item of orderData.items) {
        try {
          // ข้อมูลสำหรับบันทึกรายการสินค้า
          const orderItemData: any = {
            orderId: order.id,
            quantity: item.quantity || 1,
            price: item.price || 0,
          };
          
          // ตรวจสอบว่ามีการส่ง productId มาหรือไม่
          if (item.productId) {
            orderItemData.productId = item.productId;
          } 
          // กรณีที่มีการส่ง sku มาแทน (จากการนำเข้า Excel)
          else if (item.sku) {
            // ค้นหาสินค้าจาก sku
            try {
              const products = await storage.getProductsBySku(item.sku);
              if (products && products.length > 0) {
                orderItemData.productId = products[0].id;
                console.log(`พบสินค้าจาก SKU ${item.sku}: ID = ${orderItemData.productId}`);
              } else {
                // ถ้าไม่พบสินค้าจาก SKU แต่มีชื่อสินค้า
                if (item.name) {
                  const product = await storage.createProduct({
                    userId: orderData.userId,
                    name: item.name,
                    sku: item.sku,
                    price: item.price || 0,
                    cost: item.price ? (item.price * 0.7) : 0, // ประมาณต้นทุน 70% ของราคาขาย
                    stock: 0,
                    categoryId: null,
                    status: 'active',
                  });
                  
                  if (product) {
                    orderItemData.productId = product.id;
                    console.log(`สร้างสินค้าใหม่จาก SKU ${item.sku}: ID = ${orderItemData.productId}`);
                  }
                }
              }
            } catch (skuError) {
              console.error(`เกิดข้อผิดพลาดในการค้นหาสินค้าจาก SKU:`, skuError);
            }
          }
          
          // ถ้ามี productId แล้วจึงบันทึกข้อมูลรายการสินค้า
          if (orderItemData.productId) {
            await storage.createOrderItem(orderItemData);
            console.log(`บันทึกรายการสินค้า ${orderItemData.productId} สำเร็จ`);
          } else {
            console.warn(`ไม่สามารถบันทึกรายการสินค้า: ไม่มี productId และไม่สามารถค้นหาจาก SKU ${item.sku}`);
          }
        } catch (error) {
          console.error(`เกิดข้อผิดพลาดในการบันทึกรายการสินค้า:`, error);
        }
      }
    } else {
      console.log('ไม่มีรายการสินค้าที่จะบันทึก');
    }
    
    // ตรวจสอบการสร้างเลขพัสดุอัตโนมัติ
    const generateTrackingNumber = orderData.generateTrackingNumber === true && orderData.shippingMethod;
    
    // ถ้ามีการเลือกบริษัทขนส่งและต้องการสร้างเลขพัสดุอัตโนมัติ
    if (generateTrackingNumber && order.id) {
      try {
        console.log(`สร้างเลขพัสดุอัตโนมัติสำหรับออเดอร์ ${order.id} กับ ${orderData.shippingMethod}`);
        
        // สร้างเลขพัสดุโดยใช้รหัสบริษัทขนส่ง
        const shippingCompany = orderData.shippingMethod;
        let companyCode = '';
        
        // กำหนดรหัสตามบริษัทขนส่ง
        if (shippingCompany.includes('Xiaobai') || shippingCompany.includes('เสี่ยวไป๋')) {
          companyCode = 'XBE';
        } else if (shippingCompany.includes('SpeedLine') || shippingCompany.includes('สปีด')) {
          companyCode = 'SPE';
        } else if (shippingCompany.includes('ThaiStar') || shippingCompany.includes('ไทยสตาร์')) {
          companyCode = 'TST';
        } else if (shippingCompany.includes('J&T') || shippingCompany.includes('เจแอนด์ที')) {
          companyCode = 'JNT';
        } else if (shippingCompany.includes('Kerry') || shippingCompany.includes('เคอรี่')) {
          companyCode = 'KRY';
        } else if (shippingCompany.includes('Thailand Post') || shippingCompany.includes('ไปรษณีย์')) {
          companyCode = 'THP';
        } else if (shippingCompany.includes('DHL')) {
          companyCode = 'DHL';
        } else if (shippingCompany.includes('Ninja')) {
          companyCode = 'NJV';
        } else if (shippingCompany.includes('Flash')) {
          companyCode = 'FLE';
        } else {
          // ถ้าไม่รู้จักบริษัทขนส่งให้ใช้ตัวอักษร 3 ตัวแรก
          companyCode = shippingCompany.substring(0, 3).toUpperCase();
        }
        
        // สร้างเลขพัสดุในรูปแบบ รหัสบริษัท + เลข 7 หลัก + อักษรสุ่ม 2 ตัว
        const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
        const randomLetters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                              String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const trackingNumber = `${companyCode}${randomDigits}${randomLetters}`;
        
        // อัพเดทออเดอร์ด้วยเลขพัสดุ
        await storage.updateOrder(order.id, {
          trackingNumber,
          status: 'processing'
        });
        
        console.log(`สร้างเลขพัสดุสำเร็จ: ${trackingNumber}`);
        
        // อัพเดทข้อมูลออเดอร์ใน order object เพื่อส่งกลับ
        order.trackingNumber = trackingNumber;
        order.status = 'processing';
      } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการสร้างเลขพัสดุอัตโนมัติ:`, error);
      }
    }
    
    // If this is a COD order, create shipping label with Flash Express
    if (isCashOnDelivery && orderData.shipping_service_id && order.id) {
      try {
        // Get customer information - ใช้ customerId ที่ถูกต้อง
        const customer = await storage.getCustomer(orderData.customerId);
        
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
          // ข้อมูลสำหรับการสร้าง Flash Express shipping ตามรูปแบบ API
          const shippingData = {
            outTradeNo: order.orderNumber,
            // ข้อมูลผู้ส่ง (sender)
            srcName: senderInfo.name,
            srcPhone: senderInfo.phone,
            srcProvinceName: senderInfo.province,
            srcCityName: senderInfo.district,
            srcDistrictName: senderInfo.subdistrict,
            srcPostalCode: senderInfo.zipcode,
            srcDetailAddress: senderInfo.address,
            // ข้อมูลผู้รับ (recipient)
            dstName: recipientInfo.name,
            dstPhone: recipientInfo.phone,
            dstHomePhone: recipientInfo.phone, // ใช้เบอร์เดียวกัน
            dstProvinceName: recipientInfo.province,
            dstCityName: recipientInfo.district, 
            dstDistrictName: recipientInfo.subdistrict,
            dstPostalCode: recipientInfo.zipcode,
            dstDetailAddress: recipientInfo.address,
            // ข้อมูลพัสดุ
            articleCategory: 4, // Default - สินค้าทั่วไป
            expressCategory: 1, // Standard delivery
            weight: parcelInfo.weight * 1000, // แปลงเป็นกรัม
            width: 20, // ค่าเริ่มต้น
            length: 30, // ค่าเริ่มต้น
            height: 10, // ค่าเริ่มต้น
            insured: 0, // ไม่ได้ซื้อประกัน
            codEnabled: 1, // เปิดใช้งาน COD
            codAmount: Math.round(orderData.total * 100), // แปลงเป็นสตางค์
            remark: `Order #${order.orderNumber}`,
            // ข้อมูลสินค้าภายใน (สร้างข้อมูลจากตัวออเดอร์)
            subItemTypes: [
              {
                itemName: `สินค้าออเดอร์ #${order.orderNumber}`,
                itemQuantity: 1
              }
            ]
          };
          
          // เรียกใช้ API
          const flashExpressResponse = await createFlashExpressShipping(shippingData);
          
          // Store tracking information if available and successful
          if (flashExpressResponse && flashExpressResponse.success && flashExpressResponse.trackingNumber) {
            await storage.updateOrder(order.id, {
              trackingNumber: flashExpressResponse.trackingNumber,
              status: 'processing'
            });
            
            console.log(`การสร้างเลขพัสดุสำเร็จ: ${flashExpressResponse.trackingNumber}`);
          } else {
            // If Flash Express API failed, delete the order and return error
            await storage.deleteOrder(order.id);
            
            const errorMessage = flashExpressResponse.error || 'ไม่สามารถสร้างเลขพัสดุได้ กรุณาลองใหม่อีกครั้ง';
            console.error(`การสร้างเลขพัสดุล้มเหลว: ${errorMessage}`);
            
            return res.status(400).json({
              success: false,
              message: errorMessage,
              details: {
                apiResponse: flashExpressResponse,
                shippingData: shippingData
              }
            });
          }
        }
      } catch (error: any) {
        // Delete the order if shipping creation fails and return error
        await storage.deleteOrder(order.id);
        return res.status(400).json({
          success: false,
          message: error.message || 'เกิดข้อผิดพลาดในการสร้างการจัดส่ง กรุณาลองใหม่อีกครั้ง'
        });
      }
    }
    
    // ดึงข้อมูลผู้ใช้ล่าสุดหลังจากหักเครดิต
    const updatedUser = await storage.getUser(req.user.id);
    const currentBalance = updatedUser?.balance ? parseFloat(updatedUser.balance.toString()) : 0;
    
    res.status(201).json({
      success: true,
      order,
      creditInfo: {
        orderFee: 25, // ค่าธรรมเนียมต่อออเดอร์
        currentBalance: currentBalance.toFixed(2)
      },
      message: `สร้างออเดอร์สำเร็จ โดยหักค่าธรรมเนียม 25฿ จากเครดิตของคุณ ยอดคงเหลือ ${currentBalance.toFixed(2)} บาท`
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

// สร้างเลขพัสดุสำหรับออเดอร์
router.post('/:id/tracking', auth, async (req, res) => {
  try {
    // ตรวจสอบข้อมูลผู้ใช้
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบ ID ไม่ถูกต้อง'
      });
    }
    
    // ดึงข้อมูลออเดอร์
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อนี้'
      });
    }
    
    // ตรวจสอบว่ามีเลขพัสดุแล้วหรือไม่
    if (order.trackingNumber) {
      return res.json({
        success: true,
        message: 'ออเดอร์นี้มีเลขพัสดุแล้ว',
        trackingNumber: order.trackingNumber
      });
    }
    
    // ดึงข้อมูล shipping method จาก request
    const { shippingMethod } = req.body;
    if (!shippingMethod) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุวิธีการจัดส่ง'
      });
    }
    
    // สร้างเลขพัสดุจำลองตามวิธีการจัดส่ง
    let prefix = "";
    
    // จัดการกรณีพิเศษสำหรับ ThaiStar Delivery ใช้ TST แทน THA
    if (shippingMethod.toLowerCase().includes('thaistar')) {
      prefix = "TST";
    } else {
      prefix = shippingMethod.substring(0, 3).toUpperCase();
    }
    
    const randomPart = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const randomLetters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                         String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const trackingNumber = `${prefix}${randomPart}${randomLetters}`;
    
    // อัพเดตข้อมูลออเดอร์
    const updatedOrder = await storage.updateOrder(orderId, {
      trackingNumber,
      shippingMethod,
      status: 'processing'
    });
    
    if (!updatedOrder) {
      return res.status(500).json({
        success: false,
        message: 'ไม่สามารถอัพเดตข้อมูลออเดอร์ได้'
      });
    }
    
    res.json({
      success: true,
      message: 'สร้างเลขพัสดุสำเร็จ',
      trackingNumber,
      order: updatedOrder
    });
  } catch (error) {
    console.error(`Error creating tracking number for order ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างเลขพัสดุ'
    });
  }
});

// อัพเดตสถานะการพิมพ์ใบลาเบล
router.patch('/:id/print-status', auth, async (req, res) => {
  try {
    // ตรวจสอบข้อมูลผู้ใช้
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    const { isPrinted } = req.body;
    
    // ตรวจสอบว่าออเดอร์นี้เป็นของผู้ใช้นี้หรือไม่
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลออเดอร์'
      });
    }
    
    // อัพเดตสถานะการพิมพ์
    const updatedOrder = await storage.updateOrder(orderId, {
      isPrinted: isPrinted
    });
    
    return res.status(200).json({
      success: true,
      message: 'อัพเดตสถานะการพิมพ์ใบลาเบลเรียบร้อย',
      data: updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating print status:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะการพิมพ์ใบลาเบล'
    });
  }
});

export default router;
