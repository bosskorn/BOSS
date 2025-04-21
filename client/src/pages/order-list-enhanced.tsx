import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Search, Filter, ChevronDown, ChevronUp, FileText, Truck, Package, CheckCircle, XCircle, Printer, RefreshCw, X, Check, Square, Tag, Clock, AlertCircle, CornerUpLeft, CircleDollarSign, Slash, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// อินเทอร์เฟซสำหรับข้อมูลคำสั่งซื้อ
interface Order {
  id: number;
  orderNumber: string;
  customerName?: string;
  customerId?: number;
  total?: number;
  totalAmount?: string;
  shippingFee?: number;
  shippingMethod?: string;
  shippingMethodId?: number;
  status?: string;
  trackingNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  items?: any[];
  customer?: any;
  paymentMethod?: string;
  paymentStatus?: string;
  taxId?: string;
  notes?: string;
  isPrinted?: boolean;
  isDelivered?: boolean;
  deliveredDate?: string | Date;
  shippingDate?: string | Date;
  [key: string]: any;
}

const OrderList: React.FC = () => {
  // สถานะของคอมโพเนนต์
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [shippingMethodFilter, setShippingMethodFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sorting, setSorting] = useState({ column: 'id', direction: 'desc' });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [labelSize, setLabelSize] = useState('100x100mm');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('');
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [multipleTrackingDialogOpen, setMultipleTrackingDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [orderToCreateTracking, setOrderToCreateTracking] = useState<number | null>(null);
  const [dbShippingMethods, setDbShippingMethods] = useState<any[]>([]);
  const [statusSelected, setStatusSelected] = useState('all');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [labelTypeDialogOpen, setLabelTypeDialogOpen] = useState(false);
  const [selectedLabelType, setSelectedLabelType] = useState('standard');
  const [showFilters, setShowFilters] = useState(false);

  // ฟังก์ชันดึงข้อมูลคำสั่งซื้อจาก API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("ข้อมูลออเดอร์อยู่ใน data field:", data.data.length, "รายการ");
        
        // เพิ่มการตรวจสอบและตั้งค่าข้อมูลบริษัทขนส่งตามรหัสนำหน้าเลขพัสดุ
        const ordersWithCarrier = data.data.map(order => {
          let carrier = 'unknown';
          
          if (order.trackingNumber) {
            // ตรวจสอบรหัสนำหน้าของเลขพัสดุ
            if (order.trackingNumber.startsWith('FLE')) {
              console.log(`ตรวจสอบ order #${order.id} ${order.orderNumber}: ${order.trackingNumber}, shippingMethod: ${order.shippingMethod || 'ไม่ระบุ'}`);
              console.log(`✓ Matched Order #${order.id}: ${order.trackingNumber} by prefix FLE`);
              carrier = 'flash-express';
            } else if (order.trackingNumber.startsWith('JT')) {
              console.log(`✓ Matched Order #${order.id}: ${order.trackingNumber} by prefix JT`);
              carrier = 'jt-express';
            } else if (order.trackingNumber.startsWith('XB')) {
              console.log(`✓ Matched Order #${order.id}: ${order.trackingNumber} by prefix XB`);
              carrier = 'xiaobai-express';
            }
          }
          
          return {
            ...order,
            carrier
          };
        });
        
        setOrders(ordersWithCarrier);
        setFilteredOrders(ordersWithCarrier);
        
        // ดึงข้อมูลวิธีการจัดส่งเพื่อใช้ในตัวกรอง
        fetchShippingMethods();
      } else {
        throw new Error(data.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลวิธีการจัดส่งจากฐานข้อมูล
  const fetchShippingMethods = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shipping-methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("ดึงข้อมูลวิธีการจัดส่งสำเร็จ:", data.shippingMethods.length, "รายการ");
        setDbShippingMethods(data.shippingMethods);
      } else {
        throw new Error(data.message || 'ไม่สามารถดึงข้อมูลวิธีการจัดส่งได้');
      }
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
    }
  };

  // ตัวกรองข้อมูลสำหรับแสดงเฉพาะออเดอร์ของ Flash Express
  const filterFlashExpressOrders = () => {
    let flashExpressOrders = 0;
    
    // กรองออเดอร์ที่มีเลขพัสดุขึ้นต้นด้วย FLE (Flash Express)
    const filtered = orders.filter(order => {
      if (order.trackingNumber) {
        // ตรวจสอบว่าเลขพัสดุขึ้นต้นด้วย FLE หรือไม่
        const isFlashExpress = order.trackingNumber.startsWith('FLE');
        
        // ตรวจสอบและแสดงข้อมูลเพื่อการดีบัก
        console.log(`ตรวจสอบ order #${order.id} ${order.orderNumber}: ${order.trackingNumber}, shippingMethod: ${order.shippingMethod || 'ไม่ระบุ'}`);
        
        if (isFlashExpress) {
          flashExpressOrders++;
          console.log(`✓ Matched Order #${order.id}: ${order.trackingNumber} by prefix FLE`);
        }
        
        return isFlashExpress;
      }
      return false;
    });
    
    console.log(`จำนวนออเดอร์ของ Flash Express หลังกรอง: ${flashExpressOrders} รายการ`);
    return filtered;
  };

  // เรียกใช้งานฟังก์ชันดึงข้อมูลเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    fetchOrders();
    fetchShippingMethods();
  }, []);

  // ฟังก์ชันกรองข้อมูลคำสั่งซื้อตามเงื่อนไข
  const filterOrders = () => {
    let result = [...orders];
    
    // กรองตามแท็บที่เลือก
    if (activeTab === 'pending') {
      result = result.filter(order => order.status === 'pending');
    } else if (activeTab === 'processing') {
      result = result.filter(order => order.status === 'processing');
    } else if (activeTab === 'shipped') {
      result = result.filter(order => order.status === 'shipped');
    } else if (activeTab === 'completed') {
      result = result.filter(order => order.status === 'completed');
    } else if (activeTab === 'cancelled') {
      result = result.filter(order => order.status === 'cancelled');
    } else if (activeTab === 'flash-express') {
      result = result.filter(order => order.trackingNumber?.startsWith('FLE'));
    } else if (activeTab === 'jt-express') {
      result = result.filter(order => order.trackingNumber?.startsWith('JT'));
    } else if (activeTab === 'xiaobai-express') {
      result = result.filter(order => order.trackingNumber?.startsWith('XB'));
    }
    
    // กรองตามคำค้นหา
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.trackingNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    // กรองตามสถานะ
    if (orderStatusFilter !== 'all') {
      result = result.filter(order => order.status === orderStatusFilter);
    }
    
    // กรองตามบริษัทขนส่ง
    if (shippingMethodFilter !== 'all') {
      if (shippingMethodFilter === 'flash-express') {
        result = result.filter(order => order.trackingNumber?.startsWith('FLE'));
      } else if (shippingMethodFilter === 'xiaobai-express') {
        result = result.filter(order => 
          order.shippingMethod?.includes('เสี่ยวไป๋') || 
          order.trackingNumber?.startsWith('XB')
        );
      } else if (shippingMethodFilter === 'thailand-post') {
        result = result.filter(order => 
          order.shippingMethod?.includes('ไปรษณีย์ไทย') || 
          order.trackingNumber?.startsWith('TH')
        );
      } else if (shippingMethodFilter === 'jt-express') {
        result = result.filter(order => 
          order.shippingMethod?.includes('J&T') || 
          order.trackingNumber?.startsWith('JT')
        );
      } else if (shippingMethodFilter === 'none') {
        result = result.filter(order => !order.trackingNumber);
      }
    }
    
    // กรองตามวิธีการชำระเงิน
    if (paymentMethodFilter !== 'all') {
      if (paymentMethodFilter === 'cod') {
        result = result.filter(order => 
          order.paymentMethod === 'cod' || 
          order.paymentStatus === 'cod'
        );
      } else if (paymentMethodFilter === 'prepaid') {
        result = result.filter(order => 
          order.paymentMethod === 'prepaid' || 
          order.paymentStatus === 'prepaid'
        );
      } else if (paymentMethodFilter === 'paid') {
        result = result.filter(order => order.paymentStatus === 'paid');
      } else if (paymentMethodFilter === 'pending') {
        result = result.filter(order => order.paymentStatus === 'pending');
      }
    }
    
    // กรองตามช่วงวันที่
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateRangeFilter === 'today') {
        result = result.filter(order => {
          const orderDate = new Date(order.createdAt || '');
          return orderDate >= today;
        });
      } else if (dateRangeFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        result = result.filter(order => {
          const orderDate = new Date(order.createdAt || '');
          return orderDate >= yesterday && orderDate < today;
        });
      } else if (dateRangeFilter === 'this-week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        result = result.filter(order => {
          const orderDate = new Date(order.createdAt || '');
          return orderDate >= startOfWeek;
        });
      } else if (dateRangeFilter === 'this-month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        result = result.filter(order => {
          const orderDate = new Date(order.createdAt || '');
          return orderDate >= startOfMonth;
        });
      }
    }
    
    // จัดเรียงข้อมูล
    result.sort((a, b) => {
      const aValue = a[sorting.column] || '';
      const bValue = b[sorting.column] || '';
      
      // เปรียบเทียบค่า
      if (aValue < bValue) return sorting.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredOrders(result);
  };

  // เรียกใช้ฟังก์ชันกรองข้อมูลเมื่อตัวแปรที่เกี่ยวข้องมีการเปลี่ยนแปลง
  useEffect(() => {
    filterOrders();
  }, [orders, activeTab, searchTerm, orderStatusFilter, dateRangeFilter, shippingMethodFilter, paymentMethodFilter, sorting]);

  // ฟังก์ชันจัดการเมื่อมีการเลือกแท็บ
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // ฟังก์ชันจัดการเมื่อมีการคลิกที่หัวคอลัมน์เพื่อเรียงลำดับ
  const handleSort = (column: string) => {
    if (sorting.column === column) {
      // สลับทิศทาง
      setSorting({
        column,
        direction: sorting.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // กำหนดคอลัมน์ใหม่ ใช้ desc เป็นค่าเริ่มต้น
      setSorting({
        column,
        direction: 'desc'
      });
    }
  };

  // ฟังก์ชันเปิด/ปิดดรอปดาวน์
  const openDropdown = (id: string) => {
    setActiveDropdown(id);
  };

  const closeDropdown = (id: string) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    }
  };

  // ฟังก์ชันจัดการเมื่อมีการเลือกออเดอร์
  const toggleSelectOrder = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // ฟังก์ชันเลือก/ยกเลิกการเลือกทั้งหมด
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
    setSelectAll(!selectAll);
  };

  // ฟังก์ชันยกเลิกการเลือกทั้งหมด
  const clearAllSelections = () => {
    setSelectedOrders([]);
  };
  
  // ฟังก์ชันพิมพ์ใบลาเบลสำหรับรายการที่เลือก
  // สำหรับฟังก์ชันพิมพ์ใบลาเบลแบบปกติ (เพื่อความเข้ากันได้)
  const handlePrintLabel = (order: Order) => {
    console.log("พิมพ์ลาเบลสำหรับออเดอร์:", order);
    
    // ตรวจสอบว่าออเดอร์มีเลขพัสดุหรือไม่
    if (!order.trackingNumber) {
      toast({
        title: 'ไม่สามารถพิมพ์ลาเบลได้',
        description: 'ออเดอร์นี้ไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อนพิมพ์ลาเบล',
        variant: 'destructive',
      });
      return;
    }
    
    // บันทึกข้อมูลออเดอร์ที่จะพิมพ์และแสดงไดอะล็อก
    setOrderToPrint(order);
    setSelectedLabelType('standard'); // ตั้งค่าเริ่มต้นเป็นลาเบลมาตรฐาน
    setLabelTypeDialogOpen(true);
  };

  // ฟังก์ชันเปิด Dialog สำหรับเลือกขนส่ง
  const openShippingDialog = (orderId: number) => {
    setOrderToCreateTracking(orderId);
    setShippingDialogOpen(true);
  };
  
  // ฟังก์ชันสร้างเลขพัสดุและอัพเดทสถานะออเดอร์
  const createTrackingNumber = async () => {
    if (!orderToCreateTracking) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // ตรวจสอบและแปลงชื่อขนส่งภาษาอังกฤษให้ตรงกับที่ backend ใช้
      let shippingMethodForServer = selectedShippingMethod;
      
      // แปลงชื่อขนส่งภาษาอังกฤษเป็นภาษาไทยสำหรับการส่งไปยัง backend
      // เนื่องจาก backend ยังใช้ชื่อภาษาไทยอยู่ (เช่น "เสี่ยวไป๋ เอ็กเพรส")
      if (selectedShippingMethod === "Xiaobai Express") {
        shippingMethodForServer = "เสี่ยวไป๋ เอ็กเพรส";
      } else if (selectedShippingMethod === "Thailand Post") {
        shippingMethodForServer = "ไปรษณีย์ไทย";
      }
      
      // เรียก API เพื่อสร้างเลขพัสดุ
      const response = await fetch(`/api/orders/${orderToCreateTracking}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          shippingMethod: shippingMethodForServer
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'สร้างเลขพัสดุสำเร็จ',
          description: `เลขพัสดุ: ${data.trackingNumber}`,
        });
        
        // รีเฟรชข้อมูลเพื่อแสดงเลขพัสดุที่สร้างขึ้นใหม่
        fetchOrders();
        
        // ปิด Dialog
        setShippingDialogOpen(false);
      } else {
        throw new Error(data.message || 'ไม่สามารถสร้างเลขพัสดุได้');
      }
    } catch (error) {
      console.error('Error creating tracking number:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถสร้างเลขพัสดุได้',
        variant: 'destructive',
      });
    }
  };

  const handlePrintMultiple = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'ไม่มีรายการที่เลือก',
        description: 'กรุณาเลือกรายการที่ต้องการพิมพ์ลาเบล',
        variant: 'destructive',
      });
      return;
    }
    
    setPrintDialogOpen(true);
  };

  const printLabelWithSelectedSize = () => {
    if (!labelSize) {
      toast({
        title: 'กรุณาเลือกขนาดลาเบล',
        description: 'คุณต้องเลือกขนาดของลาเบลก่อนพิมพ์',
        variant: 'destructive',
      });
      return;
    }
    
    const selectedOrdersData = filteredOrders.filter(order => selectedOrders.includes(order.id));
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: 'ไม่สามารถเปิดหน้าต่างใหม่ได้',
        description: 'โปรดอนุญาตให้เว็บไซต์เปิดหน้าต่างป๊อปอัพได้ในการตั้งค่าเบราว์เซอร์ของคุณ',
        variant: 'destructive',
      });
      return;
    }
    
    // หาออเดอร์ที่ไม่มีเลขพัสดุ
    const ordersWithoutTracking = selectedOrdersData.filter(order => !order.trackingNumber);
    if (ordersWithoutTracking.length > 0) {
      const orderNumbers = ordersWithoutTracking.map(o => o.orderNumber).join(', ');
      toast({
        title: 'ไม่สามารถพิมพ์ลาเบลบางรายการได้',
        description: `ออเดอร์หมายเลข ${orderNumbers} ไม่มีเลขพัสดุ`,
        variant: 'destructive',
      });
    }
    
    // กรองเฉพาะออเดอร์ที่มีเลขพัสดุ
    const ordersToPrint = selectedOrdersData.filter(order => order.trackingNumber);
    
    if (ordersToPrint.length === 0) {
      toast({
        title: 'ไม่มีรายการที่สามารถพิมพ์ได้',
        description: 'ออเดอร์ที่เลือกทั้งหมดไม่มีเลขพัสดุ',
        variant: 'destructive',
      });
      printWindow.close();
      return;
    }
    
    // ตั้งค่า HTML และ CSS สำหรับการพิมพ์
    printWindow.document.write(`
      <html>
      <head>
        <title>พิมพ์ใบลาเบล - รายการที่เลือก</title>
        <style>
          @page {
            margin: 0;
          }
          body { 
            font-family: 'Kanit', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .page {
            background-color: white;
            margin: 20px auto;
            padding: 0;
            box-shadow: 0 1px 5px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
            page-break-after: always;
          }
          .label-container { 
            box-sizing: border-box;
            padding: 8mm;
          }
        </style>
      </head>
      <body>
    `);

    // แสดงผลลัพธ์และทำการปิด dialog
    setPrintDialogOpen(false);

    // อัพเดตสถานะการพิมพ์ในฐานข้อมูล
    ordersToPrint.forEach(async (order) => {
      try {
        await fetch(`/api/orders/${order.id}/print-status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          credentials: 'include',
          body: JSON.stringify({ isPrinted: true })
        });
      } catch (error) {
        console.error('Error updating print status:', error);
      }
    });

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // หากกำลังโหลดข้อมูล ให้แสดง loading spinner
  if (isLoading && orders.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh] px-6">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">กำลังโหลดข้อมูล</h3>
            <p className="text-sm text-gray-500 mt-1">กรุณารอสักครู่...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col space-y-6 p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายการคำสั่งซื้อทั้งหมด</h1>
            <p className="text-sm text-gray-500">จัดการคำสั่งซื้อและการจัดส่งพัสดุ ({orders.length} รายการ)</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => fetchOrders()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Link href="/bulk-order-import">
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <FileText className="h-4 w-4 mr-2" />
                นำเข้าจากไฟล์
              </Button>
            </Link>
            <Link href="/create-order">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                สร้างออเดอร์ใหม่
              </Button>
            </Link>
          </div>
        </div>
        
        {/* แสดงจำนวนรายการที่เลือก */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-800">
              เลือก {selectedOrders.length} รายการ
            </span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs py-1 h-8 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={handlePrintMultiple}
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                พิมพ์ลาเบล
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs py-1 h-8 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => setMultipleTrackingDialogOpen(true)}
              >
                <Truck className="h-3.5 w-3.5 mr-1" />
                สร้างเลขพัสดุ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs py-1 h-8 border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                ลบรายการ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs py-1 h-8"
                onClick={clearAllSelections}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
        
        {/* ส่วนแถบแท็บและตัวกรอง */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
            <div className="px-4 pt-4 pb-2 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">รายการคำสั่งซื้อทั้งหมด</h2>
                  <p className="text-sm text-gray-500 mt-1">จัดการคำสั่งซื้อและการจัดส่งพัสดุ ({filteredOrders.length} รายการ)</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 h-9"
                    onClick={() => fetchOrders()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    รีเฟรช
                  </Button>
                  <Link href="/create-order-tabs">
                    <Button className="bg-blue-600 hover:bg-blue-700 h-9">
                      <FileText className="h-4 w-4 mr-2" />
                      สร้างออเดอร์ใหม่
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="w-full overflow-x-auto hide-scrollbar pb-2">
                <div className="flex flex-nowrap border-b border-gray-200 py-1">
                  <TabsList className="bg-transparent h-auto flex-nowrap border-0 min-w-max">
                    <TabsTrigger 
                      value="all" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        <span>ทั้งหมด</span>
                        <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="pending" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>รอเข้ารับ</span>
                        <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => o.status === 'pending').length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="processing" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span>พัสดุเข้าระบบ</span>
                        <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => o.status === 'processing').length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="in-transit" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-orange-500" />
                        <span>ระหว่างขนส่ง</span>
                        <span className="ml-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => o.status === 'shipped').length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="delivered" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>จัดส่งสำเร็จ</span>
                        <span className="ml-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => o.status === 'delivered').length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="issues" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span>พัสดุมีปัญหา</span>
                        <span className="ml-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          0
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="returns" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <CornerUpLeft className="h-4 w-4 text-red-500" />
                        <span>พัสดุตีกลับ</span>
                        <span className="ml-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          0
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="payments" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <CircleDollarSign className="h-4 w-4 text-green-500" />
                        <span>ชำระเงินสำเร็จ</span>
                        <span className="ml-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => o.paymentStatus === 'paid').length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="cancelled" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Slash className="h-4 w-4 text-red-500" />
                        <span>ยกเลิก</span>
                        <span className="ml-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => o.status === 'cancelled').length}
                        </span>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="archived" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-gray-500 data-[state=active]:text-gray-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Folder className="h-4 w-4 text-gray-500" />
                        <span>รายการเก่า</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              {/* ส่วนป้ายกำกับบริษัทขนส่ง */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <div 
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${shippingMethodFilter === 'flash-express' ? 'bg-orange-100 text-orange-800 border-2 border-orange-300 font-semibold' : 'bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200 hover:bg-orange-100'}`}
                  onClick={() => setShippingMethodFilter(shippingMethodFilter === 'flash-express' ? 'all' : 'flash-express')}
                >
                  <span className="w-2 h-2 inline-block bg-orange-500 rounded-full"></span>
                  Flash Express
                </div>
                <div 
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${shippingMethodFilter === 'jt-express' ? 'bg-red-100 text-red-800 border-2 border-red-300 font-semibold' : 'bg-red-50 text-red-700 text-xs font-medium border border-red-200 hover:bg-red-100'}`}
                  onClick={() => setShippingMethodFilter(shippingMethodFilter === 'jt-express' ? 'all' : 'jt-express')}
                >
                  <span className="w-2 h-2 inline-block bg-red-500 rounded-full"></span>
                  J&T Express
                </div>
                <div 
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${shippingMethodFilter === 'xiaobai-express' ? 'bg-green-100 text-green-800 border-2 border-green-300 font-semibold' : 'bg-green-50 text-green-700 text-xs font-medium border border-green-200 hover:bg-green-100'}`}
                  onClick={() => setShippingMethodFilter(shippingMethodFilter === 'xiaobai-express' ? 'all' : 'xiaobai-express')}
                >
                  <span className="w-2 h-2 inline-block bg-green-500 rounded-full"></span>
                  เสี่ยวไป๋ เอ็กเพรส
                </div>
                <div 
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${shippingMethodFilter === 'thailand-post' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 font-semibold' : 'bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100'}`}
                  onClick={() => setShippingMethodFilter(shippingMethodFilter === 'thailand-post' ? 'all' : 'thailand-post')}
                >
                  <span className="w-2 h-2 inline-block bg-blue-500 rounded-full"></span>
                  ไปรษณีย์ไทย
                </div>
              </div>
              
              {/* ส่วนค้นหาและกรอง */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 w-full md:w-auto">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, เลขพัสดุ..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 text-sm h-10 bg-white border-gray-300 focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="default" 
                    className={`h-10 gap-1.5 ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">กรอง</span>
                  </Button>
                </div>
                
                {selectedOrders.length > 0 && (
                  <div className="hidden md:flex items-center gap-2 ml-2">
                    <span className="text-sm text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-md">
                      เลือก {selectedOrders.length} รายการ
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => setMultipleTrackingDialogOpen(true)}
                    >
                      <Tag className="h-4 w-4 mr-1.5" />
                      สร้างเลขพัสดุ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={handlePrintMultiple}
                    >
                      <Printer className="h-4 w-4 mr-1.5" />
                      พิมพ์ลาเบล
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* ตารางแสดงข้อมูล */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="py-2 font-medium text-gray-500 w-10">
                      <Checkbox 
                        checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length} 
                        indeterminate={selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length}
                        onCheckedChange={() => toggleSelectAll()}
                      />
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('id')}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {sorting.column === 'id' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('orderNumber')}>
                      <div className="flex items-center space-x-1">
                        <span>เลขออเดอร์</span>
                        {sorting.column === 'orderNumber' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer">
                      <span>ชื่อลูกค้า</span>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('total')}>
                      <div className="flex items-center space-x-1">
                        <span>ยอดรวม</span>
                        {sorting.column === 'total' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500">สถานะ</TableHead>
                    <TableHead className="py-3 font-medium text-gray-500">การชำระเงิน</TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center space-x-1">
                        <span>วันที่สร้าง</span>
                        {sorting.column === 'createdAt' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500">เลขพัสดุ</TableHead>
                    <TableHead className="py-3 font-medium text-gray-500">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-6 text-gray-500">
                        {isLoading ? (
                          <div className="flex flex-col items-center space-y-2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span>กำลังโหลดข้อมูล...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <Package className="h-6 w-6 text-gray-400" />
                            <span>ไม่พบข้อมูลคำสั่งซื้อที่ตรงกับเงื่อนไข</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="group hover:bg-blue-50">
                        <TableCell className="w-10">
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)} 
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell className="font-medium text-blue-700">
                          <Link href={`/order-detail/${order.id}`}>
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{order.customerName || (order.customer?.name) || 'ไม่ระบุ'}</TableCell>
                        <TableCell className="font-medium">
                          {typeof order.total === 'number' 
                            ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(order.total)
                            : typeof order.totalAmount === 'string'
                            ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(parseFloat(order.totalAmount))
                            : 'ไม่ระบุ'
                          }
                        </TableCell>
                        <TableCell>
                          {order.status === 'pending' && (
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">รอดำเนินการ</Badge>
                          )}
                          {order.status === 'processing' && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">กำลังดำเนินการ</Badge>
                          )}
                          {order.status === 'shipped' && (
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">จัดส่งแล้ว</Badge>
                          )}
                          {order.status === 'completed' && (
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">สำเร็จแล้ว</Badge>
                          )}
                          {order.status === 'cancelled' && (
                            <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">ยกเลิกแล้ว</Badge>
                          )}
                          {!order.status && (
                            <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">ไม่ระบุ</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.paymentStatus === 'paid' ? (
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">ชำระแล้ว</Badge>
                          ) : order.paymentStatus === 'pending' ? (
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">รอชำระ</Badge>
                          ) : order.paymentStatus === 'cod' || order.paymentMethod === 'cod' ? (
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">เก็บเงินปลายทาง</Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">ไม่ระบุ</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {order.trackingNumber || (
                            <Button variant="outline" size="sm" className="px-2 py-0 h-7 text-xs" onClick={() => openShippingDialog(order.id)}>
                              <Truck className="h-3 w-3 mr-1" />
                              สร้างเลขพัสดุ
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePrintLabel(order)}
                              disabled={!order.trackingNumber}
                              className="px-2 py-0 h-7 text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                              title="พิมพ์ลาเบล"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="px-2 py-0 h-7 text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                              title="แก้ไขออเดอร์"
                              onClick={() => window.location.href = `/order-detail/${order.id}`}
                            >
                              <ChevronUp className="h-3.5 w-3.5 rotate-90" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="px-2 py-0 h-7 text-gray-700 hover:text-red-700 hover:bg-red-50"
                              title="ลบออเดอร์"
                              onClick={() => {
                                if (confirm(`ต้องการลบออเดอร์ ${order.orderNumber} ใช่หรือไม่?`)) {
                                  // ส่งคำขอลบออเดอร์ไปยัง API
                                  const token = localStorage.getItem('auth_token');
                                  fetch(`/api/orders/${order.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': token ? `Bearer ${token}` : '',
                                    },
                                    credentials: 'include'
                                  })
                                  .then(response => {
                                    if (!response.ok) {
                                      throw new Error(`Error ${response.status}: ${response.statusText}`);
                                    }
                                    return response.json();
                                  })
                                  .then(data => {
                                    if (data.success) {
                                      toast({
                                        title: 'ลบออเดอร์สำเร็จ',
                                        description: `ลบออเดอร์ ${order.orderNumber} เรียบร้อยแล้ว`,
                                        variant: 'default',
                                      });
                                      // รีเฟรชข้อมูลเพื่อแสดงการเปลี่ยนแปลง
                                      fetchOrders();
                                    } else {
                                      throw new Error(data.message || 'ไม่สามารถลบออเดอร์ได้');
                                    }
                                  })
                                  .catch(error => {
                                    console.error('Error deleting order:', error);
                                    toast({
                                      title: 'เกิดข้อผิดพลาด',
                                      description: error instanceof Error ? error.message : 'ไม่สามารถลบออเดอร์ได้',
                                      variant: 'destructive',
                                    });
                                  });
                                }
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Dialog สำหรับเลือกขนาดลาเบล */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกขนาดใบลาเบล</DialogTitle>
            <DialogDescription>
              เลือกขนาดของใบลาเบลที่คุณต้องการพิมพ์
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer ${labelSize === '100x100mm' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setLabelSize('100x100mm')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">ใบลาเบลขนาด 100x100mm</h3>
                  <p className="text-sm text-gray-500">ขนาดมาตรฐาน เหมาะสำหรับพัสดุทั่วไป</p>
                </div>
                <div className="w-16 h-16 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <div className="w-10 h-10 bg-blue-100 rounded"></div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer ${labelSize === '100x75mm' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setLabelSize('100x75mm')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">ใบลาเบลขนาด 100x75mm</h3>
                  <p className="text-sm text-gray-500">ขนาดเล็กกว่า ประหยัดกระดาษ</p>
                </div>
                <div className="w-16 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <div className="w-10 h-7 bg-blue-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPrintDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={printLabelWithSelectedSize}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์ใบลาเบล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog เลือกประเภทลาเบล */}
      <Dialog open={labelTypeDialogOpen} onOpenChange={setLabelTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกประเภทใบลาเบล</DialogTitle>
            <DialogDescription>
              เลือกประเภทลาเบลตามบริษัทขนส่ง
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div 
              className={`p-3 rounded-lg border-2 cursor-pointer ${selectedLabelType === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedLabelType('standard')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">ลาเบลมาตรฐาน</h3>
                  <p className="text-sm text-gray-500">รูปแบบทั่วไป ใช้ได้กับทุกบริษัทขนส่ง</p>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <Tag className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
            
            {/* Flash Express Label */}
            <div 
              className={`p-3 rounded-lg border-2 cursor-pointer ${selectedLabelType === 'flash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedLabelType('flash')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Flash Express</h3>
                  <p className="text-sm text-gray-500">รูปแบบสำหรับ Flash Express</p>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <Tag className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </div>
            
            {/* J&T Express Label */}
            <div 
              className={`p-3 rounded-lg border-2 cursor-pointer ${selectedLabelType === 'jt' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedLabelType('jt')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">J&T Express</h3>
                  <p className="text-sm text-gray-500">รูปแบบสำหรับ J&T Express</p>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <Tag className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </div>
            
            {/* TikTok Label */}
            <div 
              className={`p-3 rounded-lg border-2 cursor-pointer ${selectedLabelType === 'tiktok' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedLabelType('tiktok')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">TikTok Shop</h3>
                  <p className="text-sm text-gray-500">รูปแบบสำหรับผู้ขาย TikTok Shop</p>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <Tag className="h-5 w-5 text-black" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setLabelTypeDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={() => {
                setLabelTypeDialogOpen(false);
                
                // ตรวจสอบว่ามี order และ trackingNumber หรือไม่
                if (!orderToPrint || !orderToPrint.trackingNumber) {
                  toast({
                    title: 'ไม่สามารถพิมพ์ลาเบลได้',
                    description: 'ออเดอร์นี้ไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อนพิมพ์ลาเบล',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // ทำการอัพเดตสถานะการพิมพ์ในฐานข้อมูล
                fetch(`/api/orders/${orderToPrint.id}/print-status`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
                  },
                  credentials: 'include',
                  body: JSON.stringify({ isPrinted: true })
                });
                
                // เปิดลาเบลตามประเภทที่เลือก
                console.log(`กำลังเปิดลาเบลประเภท ${selectedLabelType} สำหรับออเดอร์ ${orderToPrint.id}`);
                
                // สร้าง URL สำหรับหน้าลาเบล
                let labelUrl = '';
                switch(selectedLabelType) {
                  case 'standard':
                    labelUrl = `/print-label-enhanced?order=${orderToPrint.id}`;
                    break;
                  case 'flash':
                    labelUrl = `/flash-express-label-new?order=${orderToPrint.id}`;
                    break;
                  case 'jt':
                    labelUrl = `/jt-express-label?order=${orderToPrint.id}`;
                    break;
                  case 'tiktok':
                    labelUrl = `/tiktok-shipping-label?order=${orderToPrint.id}`;
                    break;
                  default:
                    labelUrl = `/print-label-enhanced?order=${orderToPrint.id}`;
                }
                
                console.log("Opening URL:", labelUrl);
                
                // วิธีการเปิดแบบใหม่ไม่ใช้ window.open โดยตรง
                // สร้าง link element แล้วจำลองการคลิก
                const link = document.createElement('a');
                link.href = labelUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                
                // ลบ link element หลังจากใช้งาน
                setTimeout(() => {
                  document.body.removeChild(link);
                }, 100);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedLabelType}
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์ลาเบล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog เลือกขนส่ง */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกบริษัทขนส่ง</DialogTitle>
            <DialogDescription>
              เลือกบริษัทขนส่งเพื่อสร้างเลขพัสดุสำหรับออเดอร์นี้
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-3 max-h-[60vh] overflow-y-auto">
            {/* ส่วนแสดงเมื่อกำลังโหลดข้อมูล */}
            {dbShippingMethods.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">กำลังโหลดข้อมูลวิธีการจัดส่ง...</p>
                <div className="flex justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
            
            {/* ตัวเลือกขนส่ง - ตัดคำให้กระชับขึ้น */}
            {/* Xiaobai Express */}
            <div 
              className={`p-3 rounded-lg border-2 cursor-pointer ${selectedShippingMethod === 'Xiaobai Express' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('Xiaobai Express')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Xiaobai Express</h3>
                  <p className="text-sm text-gray-500">จัดส่งภายใน 1-2 วัน • ฿45.00</p>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <Truck className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
            
            {/* Thailand Post */}
            <div 
              className={`p-3 rounded-lg border-2 cursor-pointer ${selectedShippingMethod === 'Thailand Post' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('Thailand Post')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Thailand Post</h3>
                  <p className="text-sm text-gray-500">จัดส่งภายใน 2-3 วัน • ฿35.00</p>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <Truck className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShippingDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={createTrackingNumber}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedShippingMethod}
            >
              <Check className="h-4 w-4 mr-2" />
              สร้างเลขพัสดุ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrderList;