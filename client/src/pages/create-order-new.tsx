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
  addressNumber?: string;
  moo?: string;
  soi?: string;
  road?: string;
  building?: string;
  floor?: string;
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
          zipcode: '10900',
          addressNumber: '123/456',
          moo: '9',
          soi: 'รัชดา 42',
          road: 'รัชดาภิเษก',
          building: 'หมู่บ้านเดอะซิตี้',
          floor: '-'
        },
        { 
          id: 2, 
          name: 'สมหญิง รักสวย', 
          email: 'somying@example.com', 
          phone: '0698765432', 
          address: '789 อาคารเดอะไนน์ ชั้น 15', 
          province: 'กรุงเทพมหานคร', 
          district: 'พระโขนง', 
          subdistrict: 'คลองตัน', 
          zipcode: '10110',
          addressNumber: '789',
          moo: '-',
          soi: 'สุขุมวิท 31',
          road: 'สุขุมวิท',
          building: 'อาคารเดอะไนน์',
          floor: '15'
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
          zipcode: '50300',
          addressNumber: '456',
          moo: '3',
          soi: 'ศรีวิชัย 5',
          road: 'ศรีวิชัย',
          building: 'หมู่บ้านศุภาลัย',
          floor: '-'
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

  // จำแนกที่อยู่อัตโนมัติ
  const autoClassifyAddress = (address: string) => {
    // ทำให้เป็นเหมือนการวิเคราะห์ที่อยู่จากข้อความ
    // ในสถานการณ์จริง นี่จะเป็นการเรียก API หรือใช้อัลกอริทึมในการแยกที่อยู่
    
    if (!selectedCustomer) return;
    
    // แสดงฟอร์มและกรอกข้อมูลให้อัตโนมัติ
    const addressForm = document.getElementById('customer-address-form');
    if (addressForm) {
      addressForm.classList.remove('hidden');
    }
    
    toast({
      title: 'วิเคราะห์ที่อยู่สำเร็จ',
      description: 'ระบบได้จำแนกที่อยู่ให้อัตโนมัติแล้ว',
      variant: 'default',
    });
  };
  
  // ล้างข้อมูลที่อยู่
  const clearAddress = () => {
    const addressTextarea = document.getElementById('shipping-address') as HTMLTextAreaElement;
    if (addressTextarea) {
      addressTextarea.value = '';
    }
    toast({
      title: 'ล้างข้อมูลเรียบร้อย',
      variant: 'default',
    });
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
        shipping_method: selectedShippingMethod?.id,
        shipping_fee: calculateShippingFee(),
        discount_code: discount?.code,
        discount_amount: calculateDiscount(),
        total: calculateTotal(),
        payment_method: paymentMethod,
        note: note,
      };
      
      // จำลองการส่งข้อมูลไป API
      console.log('Order data:', orderData);
      
      // สำหรับการสาธิต เราจะใช้ setTimeout เพื่อจำลองการประมวลผล
      setTimeout(() => {
        toast({
          title: 'สร้างคำสั่งซื้อสำเร็จ',
          description: `หมายเลขคำสั่งซื้อ: #${Math.floor(100000 + Math.random() * 900000)}`,
          variant: 'default',
        });
        
        // รีเซ็ตฟอร์ม
        setOrderItems([]);
        setSelectedCustomer(null);
        setSelectedShippingMethod(null);
        setDiscount(null);
        setDiscountCode('');
        setNote('');
        setCurrentStep('items');
        setIsSubmitting(false);
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
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">สร้างคำสั่งซื้อใหม่</h1>
            <p className="text-gray-600">กรอกข้อมูลเพื่อสร้างออเดอร์สำหรับลูกค้า</p>
          </div>
          <div>
            <Link href="/orders">
              <a className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 mr-2">
                <i className="fa-solid fa-arrow-left mr-2"></i>
                กลับไปรายการออเดอร์
              </a>
            </Link>
          </div>
        </div>
        
        {/* ขั้นตอนการสั่งซื้อ */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep === 'items' ? 'text-indigo-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === 'items' ? 'bg-indigo-600 text-white' : 
                currentStep === 'customer' || currentStep === 'shipping' || currentStep === 'payment' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep === 'customer' || currentStep === 'shipping' || currentStep === 'payment' ? 
                  <i className="fa-solid fa-check"></i> : 
                  <span>1</span>}
              </div>
              <span className="font-medium">เลือกสินค้า</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-300"></div>
            
            <div className={`flex items-center ${currentStep === 'customer' ? 'text-indigo-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === 'customer' ? 'bg-indigo-600 text-white' : 
                currentStep === 'shipping' || currentStep === 'payment' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep === 'shipping' || currentStep === 'payment' ? 
                  <i className="fa-solid fa-check"></i> : 
                  <span>2</span>}
              </div>
              <span className="font-medium">ข้อมูลลูกค้า</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-300"></div>
            
            <div className={`flex items-center ${currentStep === 'shipping' ? 'text-indigo-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === 'shipping' ? 'bg-indigo-600 text-white' : 
                currentStep === 'payment' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep === 'payment' ? 
                  <i className="fa-solid fa-check"></i> : 
                  <span>3</span>}
              </div>
              <span className="font-medium">การจัดส่ง</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-300"></div>
            
            <div className={`flex items-center ${currentStep === 'payment' ? 'text-indigo-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep === 'payment' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span>4</span>
              </div>
              <span className="font-medium">การชำระเงิน</span>
            </div>
          </div>
        </div>

        <form onSubmit={createOrder}>
          {/* ขั้นตอนที่ 1: เลือกสินค้า */}
          {currentStep === 'items' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <i className="fa-solid fa-cart-shopping text-indigo-600 mr-2"></i>
                เลือกสินค้า
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ค้นหาสินค้า */}
                <div className="lg:col-span-1 border-r border-gray-200 pr-4">
                  <div className="mb-4">
                    <label htmlFor="search" className="block text-sm font-medium mb-1">ค้นหาสินค้า</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="search"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                        placeholder="ชื่อสินค้า หรือ รหัสสินค้า"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <i className="fa-solid fa-search text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                  
                  {isProductLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto pr-1">
                      {filteredProducts.length > 0 ? (
                        <div className="space-y-2">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className={`p-3 rounded-md cursor-pointer transition-colors ${
                                currentItem.product_id === product.id 
                                  ? 'bg-indigo-50 border border-indigo-200' 
                                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => selectProduct(product)}
                            >
                              <div className="flex items-start">
                                {product.imageUrl && (
                                  <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded mr-3" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                                    <span className="text-sm font-medium text-indigo-600">{product.price.toLocaleString()} บาท</span>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    สต็อค: {product.stock} ชิ้น
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-md text-center">
                          <p className="text-gray-500">ไม่พบสินค้าที่ค้นหา</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* เพิ่มสินค้าในรายการ */}
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-3">เพิ่มสินค้าในรายการ</h3>
                    <div className={`p-4 rounded-md ${currentItem.product_id ? 'bg-gray-50 border border-gray-200' : 'bg-gray-100 border border-dashed border-gray-300'}`}>
                      {currentItem.product_id ? (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              {currentItem.product?.imageUrl && (
                                <img src={currentItem.product.imageUrl} alt={currentItem.product.name} className="w-12 h-12 object-cover rounded mr-3" />
                              )}
                              <div>
                                <h4 className="font-medium">{currentItem.product?.name}</h4>
                                <p className="text-sm text-gray-500">SKU: {currentItem.product?.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-indigo-600">{currentItem.price.toLocaleString()} บาท / ชิ้น</p>
                              <p className="text-sm text-gray-500">คงเหลือ: {currentItem.product?.stock} ชิ้น</p>
                            </div>
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div>
                              <label htmlFor="quantity" className="block text-sm mb-1">จำนวน:</label>
                              <input
                                type="number"
                                id="quantity"
                                className="px-3 py-1 border border-gray-300 rounded-md w-20"
                                value={currentItem.quantity}
                                onChange={handleQuantityChange}
                                min="1"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentItem({
                                    product_id: 0,
                                    quantity: 1,
                                    price: 0
                                  });
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={addItemToOrder}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                              >
                                <i className="fa-solid fa-plus mr-1"></i>
                                เพิ่มสินค้า
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mb-2">
                            <i className="fa-solid fa-cart-plus"></i>
                          </div>
                          <p className="text-gray-500 mb-1">เลือกสินค้าจากรายการด้านซ้าย</p>
                          <p className="text-sm text-gray-400">เพื่อเพิ่มสินค้าในรายการสั่งซื้อ</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium mb-3">รายการสินค้าที่เลือก</h3>
                  
                  {orderItems.length > 0 ? (
                    <div className="border rounded-md overflow-hidden mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">ราคา</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">จำนวน</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">รวม</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orderItems.map((item) => (
                            <tr key={item.product_id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  {item.product?.imageUrl && (
                                    <img src={item.product.imageUrl} alt={item.product.name} className="w-8 h-8 object-cover rounded mr-2" />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.product?.name}</p>
                                    <p className="text-xs text-gray-500">SKU: {item.product?.sku}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                {item.price.toLocaleString()} บาท
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                    onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                                  >
                                    <i className="fa-solid fa-minus text-xs"></i>
                                  </button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                    onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                                  >
                                    <i className="fa-solid fa-plus text-xs"></i>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                                {(item.price * item.quantity).toLocaleString()} บาท
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.product_id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <i className="fa-solid fa-cart-shopping text-xl"></i>
                      </div>
                      <h3 className="text-gray-500 mb-1">ยังไม่มีสินค้าในรายการ</h3>
                      <p className="text-sm text-gray-400 mb-4">กรุณาเลือกสินค้าเพื่อเพิ่มในรายการสั่งซื้อ</p>
                    </div>
                  )}
                  
                  {validationErrors.items && (
                    <p className="mt-2 text-sm text-red-600">
                      <i className="fa-solid fa-circle-exclamation mr-1"></i>
                      {validationErrors.items}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* ขั้นตอนที่ 2: ข้อมูลลูกค้า */}
          {currentStep === 'customer' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col space-y-4">
                {/* Stepper */}
                <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium">✓</div>
                      <span className="ml-2 text-sm font-medium">เลือกสินค้า</span>
                      <div className="w-12 h-1 bg-gray-200 mx-2"></div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">2</div>
                      <span className="ml-2 text-sm font-medium text-indigo-600">ข้อมูลลูกค้า</span>
                      <div className="w-12 h-1 bg-gray-200 mx-2"></div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">3</div>
                      <span className="ml-2 text-sm font-medium text-gray-500">การจัดส่ง</span>
                      <div className="w-12 h-1 bg-gray-200 mx-2"></div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">4</div>
                      <span className="ml-2 text-sm font-medium text-gray-500">การชำระเงิน</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-indigo-800 mb-2">
                  <i className="fa-solid fa-user mr-2"></i>
                  <h2 className="text-lg font-medium">ข้อมูลลูกค้า</h2>
                </div>
                
                <div className="w-full">
                  <h3 className="text-sm font-medium mb-3">เลือกลูกค้า</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id 
                            ? 'border-indigo-400 bg-indigo-50 shadow-sm' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectCustomer(customer.id)}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <div className="ml-auto text-green-600">
                              <i className="fa-solid fa-check-circle"></i>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-5 border border-dashed border-indigo-300 rounded-md flex flex-col items-center justify-center text-center hover:bg-indigo-50 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                        <i className="fa-solid fa-plus"></i>
                      </div>
                      <p className="font-medium text-indigo-600">เพิ่มลูกค้าใหม่</p>
                    </div>
                  </div>
                </div>
                
                {selectedCustomer && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">ข้อมูลผู้รับ</h3>
                      <button
                        type="button"
                        onClick={() => autoClassifyAddress(selectedCustomer.address)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        <i className="fa-solid fa-pen-to-square mr-1"></i>
                        จำแนกที่อยู่
                      </button>
                    </div>
                    
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      rows={2}
                      defaultValue={`${selectedCustomer?.address}, ${selectedCustomer?.subdistrict}, ${selectedCustomer?.district}, ${selectedCustomer?.province}, ${selectedCustomer?.zipcode}`}
                      placeholder="ที่อยู่ (บ้านเลขที่ เขต แขวง รหัสไปรษณีย์)"
                    ></textarea>
                    
                    {/* ฟอร์มกรอกที่อยู่แบบละเอียด */}
                    <div id="customer-address-form" className="hidden mt-3">
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">บ้านเลขที่</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.addressNumber || ''}
                              placeholder="บ้านเลขที่"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">หมู่</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.moo || ''}
                              placeholder="หมู่"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">ซอย</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.soi || ''}
                              placeholder="ซอย"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">ถนน</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.road || ''}
                              placeholder="ถนน"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">แขวง/ตำบล</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.subdistrict || ''}
                              placeholder="แขวง/ตำบล"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">เขต/อำเภอ</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.district || ''}
                              placeholder="เขต/อำเภอ"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">จังหวัด</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.province || ''}
                              placeholder="จังหวัด"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">รหัสไปรษณีย์</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              defaultValue={selectedCustomer?.zipcode || ''}
                              placeholder="รหัสไปรษณีย์"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            type="button"
                            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                            onClick={() => {
                              // ซ่อนฟอร์ม
                              const customerAddressForm = document.getElementById('customer-address-form');
                              if (customerAddressForm) {
                                customerAddressForm.classList.add('hidden');
                              }
                            }}
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded"
                            onClick={() => {
                              toast({
                                title: 'บันทึกที่อยู่เรียบร้อย',
                                variant: 'default',
                              });
                              
                              // ซ่อนฟอร์ม
                              const customerAddressForm = document.getElementById('customer-address-form');
                              if (customerAddressForm) {
                                customerAddressForm.classList.add('hidden');
                              }
                            }}
                          >
                            ยืนยัน
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded mr-2"
                      >
                        ล้างข้อมูล
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                      >
                        บันทึก
                      </button>
                    </div>
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
          )}
          
          {/* ขั้นตอนที่ 3: การจัดส่ง */}
          {currentStep === 'shipping' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <i className="fa-solid fa-truck text-indigo-600 mr-2"></i>
                เลือกวิธีการจัดส่ง
              </h2>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">ข้อมูลผู้รับ</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        // แสดงฟอร์มกรอกที่อยู่แบบละเอียด
                        const detailAddressForm = document.getElementById('detail-address-form');
                        if (detailAddressForm) {
                          detailAddressForm.classList.toggle('hidden');
                        }
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <i className="fa-solid fa-list mr-1"></i>
                      จำแนกที่อยู่
                    </button>
                    <button
                      type="button"
                      onClick={clearAddress}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>
                      ล้างข้อมูล
                    </button>
                  </div>
                </div>
                
                <textarea
                  id="shipping-address"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                  rows={2}
                  placeholder="ที่อยู่จัดส่ง"
                  defaultValue={selectedCustomer ? `${selectedCustomer?.address}, ${selectedCustomer?.subdistrict}, ${selectedCustomer?.district}, ${selectedCustomer?.province}, ${selectedCustomer?.zipcode}` : ''}
                ></textarea>
                
                {/* ฟอร์มกรอกที่อยู่แบบละเอียด */}
                <div id="detail-address-form" className="hidden">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mb-3">
                    <h4 className="text-sm font-medium mb-3">รายละเอียดที่อยู่</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">บ้านเลขที่</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.addressNumber || ''}
                          placeholder="บ้านเลขที่"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">หมู่</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.moo || ''}
                          placeholder="หมู่"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ซอย</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.soi || ''}
                          placeholder="ซอย"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ถนน</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.road || ''}
                          placeholder="ถนน"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">อาคาร/หมู่บ้าน</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.building || ''}
                          placeholder="อาคาร/หมู่บ้าน"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ชั้น</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.floor || ''}
                          placeholder="ชั้น"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ตำบล/แขวง</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.subdistrict || ''}
                          placeholder="ตำบล/แขวง"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">อำเภอ/เขต</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.district || ''}
                          placeholder="อำเภอ/เขต"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">จังหวัด</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.province || ''}
                          placeholder="จังหวัด"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">รหัสไปรษณีย์</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue={selectedCustomer?.zipcode || ''}
                          placeholder="รหัสไปรษณีย์"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={() => {
                          const form = document.getElementById('detail-address-form');
                          if (form) form.classList.add('hidden');
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button" 
                        className="px-3 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded"
                        onClick={() => {
                          toast({
                            title: 'บันทึกที่อยู่เรียบร้อย',
                            variant: 'default',
                          });
                          
                          const form = document.getElementById('detail-address-form');
                          if (form) form.classList.add('hidden');
                        }}
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">วิธีการจัดส่ง</h3>
                
                {isLoadingShippingRates ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">กำลังโหลดข้อมูลวิธีการจัดส่ง...</p>
                  </div>
                ) : (
                  shippingMethods.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {shippingMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedShippingMethod?.id === method.id 
                              ? 'border-indigo-400 bg-indigo-50 shadow-sm' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectShippingMethod(method)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                {method.logo ? (
                                  <img src={method.logo} alt={method.name} className="h-10 w-auto object-contain" />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                    <i className="fa-solid fa-truck text-gray-500"></i>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{method.name}</h4>
                                <p className="text-xs text-gray-500">{method.deliveryTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-indigo-600 mr-2">{method.price} บาท</span>
                              {selectedShippingMethod?.id === method.id && (
                                <div className="text-green-600">
                                  <i className="fa-solid fa-circle-check"></i>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <i className="fa-solid fa-truck-ramp-box text-xl"></i>
                      </div>
                      <h3 className="text-gray-500 mb-1">ไม่พบข้อมูลวิธีการจัดส่ง</h3>
                      <p className="text-sm text-gray-400 mb-4">กรุณาเลือกลูกค้าและระบุที่อยู่จัดส่ง</p>
                    </div>
                  )
                )}
                
                {validationErrors.shipping_method && (
                  <p className="mt-2 text-sm text-red-600">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i>
                    {validationErrors.shipping_method}
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">หมายเหตุการจัดส่ง (ไม่บังคับ)</h3>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="ระบุหมายเหตุการจัดส่ง เช่น ให้โทรก่อนจัดส่ง, ถ้าไม่อยู่ให้วางไว้ที่ป้อมยาม เป็นต้น"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>
            </div>
          )}
          
          {/* ขั้นตอนที่ 4: การชำระเงิน */}
          {currentStep === 'payment' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <i className="fa-solid fa-credit-card text-indigo-600 mr-2"></i>
                ชำระเงิน
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">วิธีการชำระเงิน</h3>
                  
                  <div className="space-y-2">
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        paymentMethod === 'bank-transfer' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('bank-transfer')}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center mr-3">
                          {paymentMethod === 'bank-transfer' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded flex items-center justify-center mr-2">
                            <i className="fa-solid fa-building-columns text-indigo-600"></i>
                          </div>
                          <div>
                            <p className="font-medium">โอนผ่านธนาคาร</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        paymentMethod === 'cod' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center mr-3">
                          {paymentMethod === 'cod' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded flex items-center justify-center mr-2">
                            <i className="fa-solid fa-money-bill-wave text-green-600"></i>
                          </div>
                          <div>
                            <p className="font-medium">เก็บเงินปลายทาง</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        paymentMethod === 'credit-card' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('credit-card')}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center mr-3">
                          {paymentMethod === 'credit-card' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded flex items-center justify-center mr-2">
                            <i className="fa-solid fa-credit-card text-blue-600"></i>
                          </div>
                          <div>
                            <p className="font-medium">บัตรเครดิต / เดบิต</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {validationErrors.payment_method && (
                    <p className="mt-2 text-sm text-red-600">
                      <i className="fa-solid fa-circle-exclamation mr-1"></i>
                      {validationErrors.payment_method}
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">ส่วนลด</h3>
                  
                  {discount ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                            <i className="fa-solid fa-ticket"></i>
                          </div>
                          <div>
                            <p className="font-medium">โค้ดส่วนลด: {discount.code}</p>
                            <p className="text-sm text-gray-600">
                              {discount.type === 'percentage' ? `ส่วนลด ${discount.value}%` : `ส่วนลด ${discount.value} บาท`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeDiscount}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex mb-4">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="รหัสส่วนลด"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
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
                  
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-medium mb-3">สรุปคำสั่งซื้อ</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ยอดรวมสินค้า:</span>
                        <span className="font-medium">{calculateSubtotal().toLocaleString()} บาท</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ส่วนลด:</span>
                        <span className="font-medium text-red-600">-{calculateDiscount().toLocaleString()} บาท</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ค่าจัดส่ง:</span>
                        <span className="font-medium">{calculateShippingFee().toLocaleString()} บาท</span>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">ยอดรวมทั้งสิ้น:</span>
                          <span className="text-lg font-bold text-indigo-600">{calculateTotal().toLocaleString()} บาท</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ปุ่มดำเนินการ */}
          <div className="flex justify-between">
            {currentStep !== 'items' && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                ย้อนกลับ
              </button>
            )}
            
            <div className="ml-auto">
              {currentStep === 'payment' ? (
                <button
                  type="submit"
                  className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block animate-spin h-4 w-4 border-t-2 border-white rounded-full mr-2"></div>
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check mr-2"></i>
                      ยืนยันคำสั่งซื้อ
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  ถัดไป
                  <i className="fa-solid fa-arrow-right ml-2"></i>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateOrder;