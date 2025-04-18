import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  code?: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  deliveryTime: string;
  price: number;
  provider: string;
  logo?: string;
}

interface ValidationErrors {
  customer_id?: string;
  items?: string;
  shipping_method?: string;
  payment_method?: string;
}

const CreateOrder: React.FC = () => {
  // สถานะสำหรับข้อมูลสินค้า
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductLoading, setIsProductLoading] = useState(false);
  
  // สถานะสำหรับข้อมูลลูกค้า
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  
  // สถานะสำหรับรายการสั่งซื้อ
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState<OrderItem>({
    product_id: 0,
    quantity: 1,
    price: 0
  });
  
  // สถานะสำหรับโปรโมชันและส่วนลด
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  
  // สถานะสำหรับการจัดส่ง
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [isLoadingShippingRates, setIsLoadingShippingRates] = useState(false);
  
  // สถานะอื่นๆ
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState<'items' | 'customer' | 'shipping' | 'payment'>('items');
  
  // รูปภาพโลโก้ผู้ให้บริการจัดส่ง
  const shippingLogos = {
    'flash-express': 'https://cdn.flashexpress.co.th/uploads/images/flash.png',
    'thailand-post': 'https://track.thailandpost.co.th/css/dist/img/logo.png',
    'kerry-express': 'https://1000logos.net/wp-content/uploads/2021/07/Kerry-Express-Logo.png',
    'jnt-express': 'https://1000logos.net/wp-content/uploads/2021/08/J-T-Express-Logo.png',
  };

  // โหลดข้อมูลเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  // ค้นหาสินค้า
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  // ฟังก์ชันเรียกข้อมูลสินค้าจาก API
  const fetchProducts = async () => {
    setIsProductLoading(true);
    try {
      // สำหรับการสาธิต ใช้ข้อมูลจำลอง
      const mockProducts: Product[] = [
        { id: 1, sku: 'ELEC-001', name: 'หูฟังไร้สาย Bluetooth 5.0', price: 1590, stock: 50, imageUrl: 'https://via.placeholder.com/150' },
        { id: 2, sku: 'CLOTH-001', name: 'เสื้อยืดคอกลม Cotton 100%', price: 290, stock: 100, imageUrl: 'https://via.placeholder.com/150' },
        { id: 3, sku: 'FOOD-001', name: 'ชาเขียวมัทฉะออร์แกนิค', price: 450, stock: 30, imageUrl: 'https://via.placeholder.com/150' },
        { id: 4, sku: 'ELEC-002', name: 'แบตเตอรี่สำรอง 10000mAh', price: 890, stock: 45, imageUrl: 'https://via.placeholder.com/150' },
        { id: 5, sku: 'HOME-001', name: 'หมอนเมมโมรี่โฟม', price: 750, stock: 25, imageUrl: 'https://via.placeholder.com/150' },
      ];
      
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลสินค้าได้',
        variant: 'destructive',
      });
    } finally {
      setIsProductLoading(false);
    }
  };

  // ฟังก์ชันเรียกข้อมูลลูกค้า
  const fetchCustomers = async () => {
    try {
      // สำหรับการสาธิต ใช้ข้อมูลจำลอง
      const mockCustomers: Customer[] = [
        { 
          id: 1, 
          name: 'สมชาย ใจดี', 
          email: 'somchai@example.com', 
          phone: '0812345678', 
          address: '123/456 หมู่บ้านเดอะซิตี้', 
          province: 'กรุงเทพมหานคร', 
          district: 'จตุจักร', 
          subdistrict: 'ลาดยาว', 
          zipcode: '10900'
        },
        { 
          id: 2, 
          name: 'สมหญิง รักสวย', 
          email: 'somying@example.com', 
          phone: '0698765432', 
          address: '789 อาคารเดอะไนน์', 
          province: 'กรุงเทพมหานคร', 
          district: 'พระโขนง', 
          subdistrict: 'คลองตัน', 
          zipcode: '10110'
        },
        { 
          id: 3, 
          name: 'วิชัย มากมี', 
          email: 'wichai@example.com', 
          phone: '0876543210', 
          address: '456 หมู่บ้านศุภาลัย', 
          province: 'เชียงใหม่', 
          district: 'เมือง', 
          subdistrict: 'ช้างเผือก', 
          zipcode: '50300'
        },
      ];
      
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลลูกค้าได้',
        variant: 'destructive',
      });
    }
  };

  // เลือกสินค้าสำหรับเพิ่มในรายการ
  const selectProduct = (product: Product) => {
    setCurrentItem({
      product_id: product.id,
      quantity: 1,
      price: product.price,
      product: product
    });
  };

  // เปลี่ยนจำนวนสินค้า
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      setCurrentItem({ ...currentItem, quantity: newQuantity });
    }
  };

  // เพิ่มสินค้าในรายการสั่งซื้อ
  const addItemToOrder = () => {
    if (!currentItem.product_id) {
      toast({
        title: 'กรุณาเลือกสินค้า',
        variant: 'destructive',
      });
      return;
    }
    
    // ตรวจสอบสินค้าซ้ำ
    const existingItem = orderItems.find(item => item.product_id === currentItem.product_id);
    
    if (existingItem) {
      // ถ้ามีสินค้านี้อยู่แล้ว ให้เพิ่มจำนวน
      const updatedItems = orderItems.map(item => {
        if (item.product_id === currentItem.product_id) {
          return { ...item, quantity: item.quantity + currentItem.quantity };
        }
        return item;
      });
      setOrderItems(updatedItems);
    } else {
      // ถ้ายังไม่มี ให้เพิ่มใหม่
      setOrderItems([...orderItems, currentItem]);
    }
    
    // รีเซ็ตค่า
    setCurrentItem({
      product_id: 0,
      quantity: 1,
      price: 0
    });
    
    toast({
      title: 'เพิ่มสินค้าเรียบร้อย',
      variant: 'default',
    });
  };

  // ลบสินค้าออกจากรายการสั่งซื้อ
  const removeItem = (productId: number) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  // เปลี่ยนจำนวนสินค้าในรายการ
  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // ถ้าจำนวนน้อยกว่าหรือเท่ากับ 0 ให้ลบสินค้า
      removeItem(productId);
      return;
    }
    
    setOrderItems(orderItems.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // เลือกลูกค้า
  const handleSelectCustomer = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      // ดึงข้อมูลวิธีการจัดส่งเมื่อเลือกลูกค้า
      fetchShippingMethods(customer);
    }
  };

  // ดึงข้อมูลวิธีการจัดส่ง
  const fetchShippingMethods = async (customer: Customer) => {
    setIsLoadingShippingRates(true);
    
    try {
      // สำหรับการสาธิต ใช้ข้อมูลจำลอง
      // จำลองการดึงข้อมูลจาก Flash Express API และผู้ให้บริการอื่นๆ
      setTimeout(() => {
        const mockShippingMethods: ShippingMethod[] = [
          { 
            id: 'flash-express-normal', 
            name: 'Flash Express - ปกติ', 
            deliveryTime: '2-3 วันทำการ', 
            price: 50, 
            provider: 'Flash Express',
            logo: shippingLogos['flash-express']
          },
          { 
            id: 'flash-express-express', 
            name: 'Flash Express - ด่วนพิเศษ', 
            deliveryTime: '1-2 วันทำการ', 
            price: 80, 
            provider: 'Flash Express',
            logo: shippingLogos['flash-express']
          },
          { 
            id: 'thailand-post-regular', 
            name: 'ไปรษณีย์ไทย - ธรรมดา', 
            deliveryTime: '3-5 วันทำการ', 
            price: 35, 
            provider: 'Thailand Post',
            logo: shippingLogos['thailand-post']
          },
          { 
            id: 'thailand-post-ems', 
            name: 'ไปรษณีย์ไทย - EMS', 
            deliveryTime: '1-2 วันทำการ', 
            price: 65, 
            provider: 'Thailand Post',
            logo: shippingLogos['thailand-post']
          },
          { 
            id: 'kerry-express-normal', 
            name: 'Kerry Express', 
            deliveryTime: '1-2 วันทำการ', 
            price: 70, 
            provider: 'Kerry Express',
            logo: shippingLogos['kerry-express']
          },
          { 
            id: 'jnt-express-normal', 
            name: 'J&T Express', 
            deliveryTime: '1-3 วันทำการ', 
            price: 60, 
            provider: 'J&T Express',
            logo: shippingLogos['jnt-express']
          },
        ];
        
        setShippingMethods(mockShippingMethods);
        setIsLoadingShippingRates(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลวิธีการจัดส่งได้',
        variant: 'destructive',
      });
      setIsLoadingShippingRates(false);
    }
  };

  // เลือกวิธีการจัดส่ง
  const handleSelectShippingMethod = (method: ShippingMethod) => {
    setSelectedShippingMethod(method);
  };

  // ตรวจสอบโค้ดส่วนลด
  const checkDiscountCode = () => {
    if (!discountCode.trim()) {
      toast({
        title: 'กรุณาระบุโค้ดส่วนลด',
        variant: 'destructive',
      });
      return;
    }
    
    // จำลองการตรวจสอบโค้ดส่วนลด
    if (discountCode.toUpperCase() === 'NEWUSER') {
      setDiscount({
        type: 'percentage',
        value: 10,
        code: discountCode.toUpperCase()
      });
      toast({
        title: 'ใช้โค้ดส่วนลดสำเร็จ',
        description: 'คุณได้รับส่วนลด 10%',
        variant: 'default',
      });
    } else if (discountCode.toUpperCase() === 'FLASH100') {
      setDiscount({
        type: 'fixed',
        value: 100,
        code: discountCode.toUpperCase()
      });
      toast({
        title: 'ใช้โค้ดส่วนลดสำเร็จ',
        description: 'คุณได้รับส่วนลด 100 บาท',
        variant: 'default',
      });
    } else {
      toast({
        title: 'โค้ดส่วนลดไม่ถูกต้อง',
        description: 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุแล้ว',
        variant: 'destructive',
      });
    }
  };

  // ยกเลิกโค้ดส่วนลด
  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode('');
    toast({
      title: 'ยกเลิกส่วนลดเรียบร้อย',
      variant: 'default',
    });
  };

  // คำนวณยอดรวมราคาสินค้า
  const calculateSubtotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // คำนวณส่วนลด
  const calculateDiscount = () => {
    if (!discount) return 0;
    
    const subtotal = calculateSubtotal();
    
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    } else {
      return Math.min(discount.value, subtotal); // ส่วนลดต้องไม่เกินยอดรวม
    }
  };

  // คำนวณค่าจัดส่ง
  const calculateShippingFee = () => {
    return selectedShippingMethod ? selectedShippingMethod.price : 0;
  };

  // คำนวณยอดรวมสุทธิ
  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateShippingFee();
  };

  // ตรวจสอบข้อมูลในแต่ละขั้นตอน
  const validateStep = () => {
    const errors: ValidationErrors = {};
    
    if (currentStep === 'items') {
      if (orderItems.length === 0) {
        errors.items = 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ';
      }
    } else if (currentStep === 'customer') {
      if (!selectedCustomer) {
        errors.customer_id = 'กรุณาเลือกลูกค้า';
      }
    } else if (currentStep === 'shipping') {
      if (!selectedShippingMethod) {
        errors.shipping_method = 'กรุณาเลือกวิธีการจัดส่ง';
      }
    } else if (currentStep === 'payment') {
      if (!paymentMethod) {
        errors.payment_method = 'กรุณาเลือกวิธีการชำระเงิน';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ไปยังขั้นตอนถัดไป
  const goToNextStep = () => {
    if (!validateStep()) return;
    
    if (currentStep === 'items') {
      setCurrentStep('customer');
    } else if (currentStep === 'customer') {
      setCurrentStep('shipping');
    } else if (currentStep === 'shipping') {
      setCurrentStep('payment');
    }
  };

  // ย้อนกลับไปขั้นตอนก่อนหน้า
  const goToPreviousStep = () => {
    if (currentStep === 'customer') {
      setCurrentStep('items');
    } else if (currentStep === 'shipping') {
      setCurrentStep('customer');
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping');
    }
  };

  // สร้างคำสั่งซื้อ
  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    
    try {
      // สร้างข้อมูลคำสั่งซื้อ
      const orderData = {
        customer_id: selectedCustomer?.id,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        discount_code: discount?.code || null,
        shipping_fee: calculateShippingFee(),
        shipping_method: selectedShippingMethod?.id,
        total: calculateTotal(),
        payment_method: paymentMethod,
        status: 'pending',
        note: note
      };
      
      console.log('Creating order:', orderData);
      
      // จำลองการสร้างคำสั่งซื้อ
      setTimeout(() => {
        toast({
          title: 'สร้างคำสั่งซื้อสำเร็จ',
          description: 'คำสั่งซื้อถูกสร้างเรียบร้อยแล้ว',
          variant: 'default',
        });
        
        // รีเซ็ตฟอร์ม
        setOrderItems([]);
        setSelectedCustomer(null);
        setSelectedShippingMethod(null);
        setDiscount(null);
        setDiscountCode('');
        setNote('');
        setPaymentMethod('bank-transfer');
        setCurrentStep('items');
        setIsSubmitting(false);
        
        // กลับไปยังหน้ารายการคำสั่งซื้อ (ถ้ามี)
        // navigate('/orders');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างคำสั่งซื้อได้',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  // แสดงปุ่มไปยังขั้นตอนถัดไปหรือปุ่มยืนยันการสั่งซื้อ
  const renderActionButtons = () => {
    return (
      <div className="flex justify-between mt-6">
        {currentStep !== 'items' && (
          <button
            type="button"
            onClick={goToPreviousStep}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            ย้อนกลับ
          </button>
        )}
        
        <div>
          <Link href="/">
            <button
              type="button"
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mr-2"
            >
              ยกเลิก
            </button>
          </Link>
          
          {currentStep !== 'payment' ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ถัดไป
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  กำลังสร้างคำสั่งซื้อ...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
                  ยืนยันการสั่งซื้อ
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <i className="fa-solid fa-cart-plus text-green-600 mr-2"></i>
          สร้างคำสั่งซื้อใหม่
        </h1>
        <p className="text-gray-600 mt-1">
          สร้างคำสั่งซื้อใหม่ เลือกสินค้า กำหนดจำนวน ระบุข้อมูลลูกค้า และเลือกวิธีการจัดส่ง
        </p>
      </div>

      {/* Stepper สำหรับแสดงขั้นตอน */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div 
            className={`flex-1 flex items-center ${currentStep === 'items' ? 'text-indigo-600' : 'text-gray-500'}`}
            onClick={() => currentStep !== 'items' && setCurrentStep('items')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'items' ? 'bg-indigo-600 text-white' : orderItems.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {orderItems.length > 0 && currentStep !== 'items' ? <i className="fa-solid fa-check"></i> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">เลือกสินค้า</span>
          </div>
          
          <div className="w-8 h-1 bg-gray-200"></div>
          
          <div 
            className={`flex-1 flex items-center ${currentStep === 'customer' ? 'text-indigo-600' : 'text-gray-500'}`}
            onClick={() => orderItems.length > 0 && currentStep !== 'customer' && setCurrentStep('customer')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'customer' ? 'bg-indigo-600 text-white' : selectedCustomer ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {selectedCustomer && currentStep !== 'customer' ? <i className="fa-solid fa-check"></i> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">ข้อมูลลูกค้า</span>
          </div>
          
          <div className="w-8 h-1 bg-gray-200"></div>
          
          <div 
            className={`flex-1 flex items-center ${currentStep === 'shipping' ? 'text-indigo-600' : 'text-gray-500'}`}
            onClick={() => selectedCustomer && currentStep !== 'shipping' && setCurrentStep('shipping')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'shipping' ? 'bg-indigo-600 text-white' : selectedShippingMethod ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {selectedShippingMethod && currentStep !== 'shipping' ? <i className="fa-solid fa-check"></i> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium">การจัดส่ง</span>
          </div>
          
          <div className="w-8 h-1 bg-gray-200"></div>
          
          <div 
            className={`flex-1 flex items-center ${currentStep === 'payment' ? 'text-indigo-600' : 'text-gray-500'}`}
            onClick={() => selectedShippingMethod && currentStep !== 'payment' && setCurrentStep('payment')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'payment' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              4
            </div>
            <span className="ml-2 text-sm font-medium">การชำระเงิน</span>
          </div>
        </div>
      </div>

      <form onSubmit={createOrder}>
        {/* ขั้นตอนที่ 1: เลือกสินค้า */}
        {currentStep === 'items' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fa-solid fa-box text-indigo-600 mr-2"></i>
              เลือกสินค้าที่ต้องการสั่งซื้อ
            </h2>
            
            {/* ค้นหาสินค้า */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาสินค้าตามชื่อหรือรหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <i className="fa-solid fa-search text-gray-400"></i>
                </div>
              </div>
            </div>
            
            {/* แสดงสินค้าที่ค้นหา */}
            <div className="mb-6 overflow-x-auto">
              {isProductLoading ? (
                <div className="flex justify-center py-4">
                  <i className="fa-solid fa-spinner fa-spin text-indigo-600 text-2xl"></i>
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center py-4 text-gray-500">ไม่พบสินค้าที่ค้นหา</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className={`p-3 border rounded-md flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${
                        currentItem.product_id === product.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}
                      onClick={() => selectProduct(product)}
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <i className="fa-solid fa-box text-gray-400"></i>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        <p className="text-sm text-green-600 font-medium">฿{product.price.toLocaleString()}</p>
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        สต็อก: {product.stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* สินค้าที่เลือกและจำนวน */}
            {currentItem.product_id > 0 && currentItem.product && (
              <div className="flex flex-col md:flex-row items-start md:items-center p-4 border border-indigo-100 rounded-md bg-indigo-50 mb-6">
                <div className="flex-1 flex items-center mb-3 md:mb-0">
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center mr-3">
                    {currentItem.product.imageUrl ? (
                      <img src={currentItem.product.imageUrl} alt={currentItem.product.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <i className="fa-solid fa-box text-gray-400"></i>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{currentItem.product.name}</p>
                    <p className="text-sm text-gray-500">ราคา: ฿{currentItem.price.toLocaleString()} / หน่วย</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-3">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวน
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => currentItem.quantity > 1 && setCurrentItem({ ...currentItem, quantity: currentItem.quantity - 1 })}
                        className="px-2 py-1 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        id="quantity"
                        min="1"
                        value={currentItem.quantity}
                        onChange={handleQuantityChange}
                        className="w-16 text-center border-y border-gray-300 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => setCurrentItem({ ...currentItem, quantity: currentItem.quantity + 1 })}
                        className="px-2 py-1 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <i className="fa-solid fa-plus mr-1"></i>
                    เพิ่มลงตะกร้า
                  </button>
                </div>
              </div>
            )}
            
            {/* รายการสินค้าที่เลือก */}
            <div className="border rounded-md overflow-hidden mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สินค้า
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคาต่อหน่วย
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จำนวน
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคารวม
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        <i className="fa-solid fa-cart-shopping text-gray-300 text-3xl mb-3 block"></i>
                        ยังไม่มีสินค้าในรายการ กรุณาเลือกสินค้าและกดเพิ่มลงตะกร้า
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item) => {
                      const product = products.find(p => p.id === item.product_id);
                      return (
                        <tr key={item.product_id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                                {product?.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="h-8 w-8 object-contain" />
                                ) : (
                                  <i className="fa-solid fa-box text-gray-400"></i>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {product?.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  SKU: {product?.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900">฿{item.price.toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                                className="p-1 text-gray-500 hover:text-indigo-600"
                              >
                                <i className="fa-solid fa-minus"></i>
                              </button>
                              <span className="mx-2 w-8 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                                className="p-1 text-gray-500 hover:text-indigo-600"
                              >
                                <i className="fa-solid fa-plus"></i>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            ฿{(item.price * item.quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeItem(item.product_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {orderItems.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ยอดรวมสินค้า:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        ฿{calculateSubtotal().toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            
            {validationErrors.items && (
              <p className="mt-2 text-sm text-red-600">
                <i className="fa-solid fa-circle-exclamation mr-1"></i>
                {validationErrors.items}
              </p>
            )}
          </div>
        )}
        
        {/* ขั้นตอนที่ 2: ข้อมูลลูกค้า */}
        {currentStep === 'customer' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fa-solid fa-user text-indigo-600 mr-2"></i>
              ข้อมูลลูกค้า
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* รายชื่อลูกค้า */}
              <div className="col-span-1 md:col-span-1 border-r border-gray-200 pr-4">
                <h3 className="text-sm font-medium mb-3">เลือกลูกค้า</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id 
                          ? 'bg-indigo-50 border border-indigo-200' 
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectCustomer(customer.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2">
                            <i className="fa-solid fa-user-circle"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                          </div>
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <div className="text-indigo-600">
                            <i className="fa-solid fa-check-circle"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* ข้อมูลลูกค้าที่เลือก */}
              <div className="col-span-1 md:col-span-2">
                {selectedCustomer ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">ข้อมูลลูกค้า</h3>
                      <button
                        type="button"
                        onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                        className="text-sm text-indigo-600 flex items-center"
                      >
                        {showCustomerDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียดเพิ่มเติม'}
                        <i className={`fa-solid ${showCustomerDetails ? 'fa-chevron-up' : 'fa-chevron-down'} ml-1`}></i>
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <div>
                          <h4 className="font-medium">{selectedCustomer.name}</h4>
                          <p className="text-sm text-gray-600">ลูกค้า ID: {selectedCustomer.id}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ข้อมูลติดต่อ</p>
                          <p className="text-sm mb-1">
                            <i className="fa-solid fa-phone text-gray-400 mr-2 w-4"></i>
                            {selectedCustomer.phone}
                          </p>
                          <p className="text-sm">
                            <i className="fa-solid fa-envelope text-gray-400 mr-2 w-4"></i>
                            {selectedCustomer.email}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ที่อยู่จัดส่ง</p>
                          <p className="text-sm">
                            <i className="fa-solid fa-location-dot text-gray-400 mr-2 w-4"></i>
                            {selectedCustomer.address}, {selectedCustomer.subdistrict}, {selectedCustomer.district}, {selectedCustomer.province}, {selectedCustomer.zipcode}
                          </p>
                        </div>
                      </div>
                      
                      {showCustomerDetails && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">ประวัติการสั่งซื้อ</p>
                          <p className="text-sm text-gray-700">ยังไม่มีประวัติการสั่งซื้อ</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                      <i className="fa-solid fa-user-plus text-xl"></i>
                    </div>
                    <p className="text-gray-500 mb-2">กรุณาเลือกลูกค้าจากรายการด้านซ้าย</p>
                    <p className="text-sm text-gray-400">หรือเพิ่มลูกค้าใหม่หากยังไม่มีข้อมูลในระบบ</p>
                    <button
                      type="button"
                      onClick={() => {}}  // ฟังก์ชันสำหรับเพิ่มลูกค้าใหม่ (ไม่ได้ใช้งานในตัวอย่างนี้)
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      <i className="fa-solid fa-plus mr-2"></i>
                      เพิ่มลูกค้าใหม่
                    </button>
                  </div>
                )}
                
                {validationErrors.customer_id && (
                  <p className="mt-2 text-sm text-red-600">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i>
                    {validationErrors.customer_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* ขั้นตอนที่ 3: การจัดส่ง */}
        {currentStep === 'shipping' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fa-solid fa-truck text-indigo-600 mr-2"></i>
              เลือกวิธีการจัดส่ง
            </h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">ที่อยู่จัดส่ง</h3>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="font-medium mb-1">{selectedCustomer?.name}</p>
                <p className="text-sm text-gray-700 mb-1">โทร: {selectedCustomer?.phone}</p>
                <p className="text-sm text-gray-700">
                  {selectedCustomer?.address}, {selectedCustomer?.subdistrict}, {selectedCustomer?.district}, {selectedCustomer?.province}, {selectedCustomer?.zipcode}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">วิธีการจัดส่ง</h3>
                <div className="flex items-center text-xs text-gray-500">
                  <i className="fa-solid fa-filter mr-1"></i>
                  <span>กรองตามผู้ให้บริการ:</span>
                  <select 
                    className="ml-2 p-1 text-xs border border-gray-300 rounded"
                    defaultValue="all"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="Flash Express">Flash Express</option>
                    <option value="Thailand Post">ไปรษณีย์ไทย</option>
                    <option value="Kerry Express">Kerry Express</option>
                    <option value="J&T Express">J&T Express</option>
                  </select>
                </div>
              </div>
              
              {isLoadingShippingRates ? (
                <div className="flex justify-center py-8">
                  <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-indigo-600 text-2xl mb-2"></i>
                    <p className="text-sm text-gray-500">กำลังโหลดข้อมูลวิธีการจัดส่ง...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedShippingMethod?.id === method.id 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectShippingMethod(method)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center mr-3 p-1 border border-gray-200">
                          {method.logo ? (
                            <img src={method.logo} alt={method.provider} className="w-full h-full object-contain" />
                          ) : (
                            <i className="fa-solid fa-truck text-gray-400"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.deliveryTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <p className="font-medium text-green-600 mr-4">฿{method.price.toLocaleString()}</p>
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                          {selectedShippingMethod?.id === method.id && (
                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {validationErrors.shipping_method && (
                <p className="mt-2 text-sm text-red-600">
                  <i className="fa-solid fa-circle-exclamation mr-1"></i>
                  {validationErrors.shipping_method}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">โค้ดส่วนลด</h3>
              {discount ? (
                <div className="bg-green-50 p-3 rounded-md border border-green-200 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-700 flex items-center">
                      <i className="fa-solid fa-tag mr-2"></i>
                      {discount.code}
                    </p>
                    <p className="text-sm text-green-600">
                      ส่วนลด: {discount.type === 'percentage' ? `${discount.value}%` : `฿${discount.value.toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-red-600 hover:text-red-700"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="flex">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="ระบุโค้ดส่วนลด"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={checkDiscountCode}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                  >
                    ใช้โค้ด
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">ลองใช้โค้ด "NEWUSER" เพื่อรับส่วนลด 10% หรือ "FLASH100" เพื่อรับส่วนลด 100 บาท</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">หมายเหตุเพิ่มเติม (ถ้ามี)</h3>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติมสำหรับคำสั่งซื้อนี้..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>
          </div>
        )}
        
        {/* ขั้นตอนที่ 4: การชำระเงิน */}
        {currentStep === 'payment' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fa-solid fa-credit-card text-indigo-600 mr-2"></i>
              ยืนยันคำสั่งซื้อและชำระเงิน
            </h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">วิธีการชำระเงิน</h3>
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                  paymentMethod === 'bank-transfer' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                      <i className="fa-solid fa-university text-blue-600"></i>
                    </div>
                    <div>
                      <p className="font-medium">โอนเงินผ่านธนาคาร</p>
                      <p className="text-xs text-gray-500">โอนเงินเข้าบัญชีธนาคารของบริษัท</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank-transfer"
                    checked={paymentMethod === 'bank-transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-indigo-600"
                  />
                </label>
                
                <label className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                  paymentMethod === 'credit-card' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center mr-3">
                      <i className="fa-solid fa-credit-card text-purple-600"></i>
                    </div>
                    <div>
                      <p className="font-medium">บัตรเครดิต/เดบิต</p>
                      <p className="text-xs text-gray-500">ชำระเงินด้วยบัตรเครดิตหรือเดบิต</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit-card"
                    checked={paymentMethod === 'credit-card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-indigo-600"
                  />
                </label>
                
                <label className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                  paymentMethod === 'cod' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center mr-3">
                      <i className="fa-solid fa-money-bill text-green-600"></i>
                    </div>
                    <div>
                      <p className="font-medium">เก็บเงินปลายทาง (COD)</p>
                      <p className="text-xs text-gray-500">ชำระเงินเมื่อได้รับสินค้า</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-indigo-600"
                  />
                </label>
              </div>
              
              {validationErrors.payment_method && (
                <p className="mt-2 text-sm text-red-600">
                  <i className="fa-solid fa-circle-exclamation mr-1"></i>
                  {validationErrors.payment_method}
                </p>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">สรุปรายการสั่งซื้อ</h3>
              
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  รายการสินค้า
                </div>
                <div className="divide-y divide-gray-200">
                  {orderItems.map((item) => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <div key={item.product_id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                            {product?.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-8 w-8 object-contain" />
                            ) : (
                              <i className="fa-solid fa-box text-gray-400"></i>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{product?.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} × ฿{item.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">ยอดรวมสินค้า:</p>
                  <p className="text-sm font-medium">฿{calculateSubtotal().toLocaleString()}</p>
                </div>
                
                {discount && (
                  <div className="flex justify-between text-green-600">
                    <p className="text-sm">ส่วนลด ({discount.type === 'percentage' ? `${discount.value}%` : `฿${discount.value}`}):</p>
                    <p className="text-sm font-medium">-฿{calculateDiscount().toLocaleString()}</p>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">ค่าจัดส่ง ({selectedShippingMethod?.name}):</p>
                  <p className="text-sm font-medium">฿{calculateShippingFee().toLocaleString()}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <p className="text-base font-medium">ยอดรวมทั้งสิ้น:</p>
                    <p className="text-lg font-bold text-green-600">฿{calculateTotal().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ปุ่มดำเนินการ */}
        {renderActionButtons()}
      </form>
    </Layout>
  );
};

export default CreateOrder;