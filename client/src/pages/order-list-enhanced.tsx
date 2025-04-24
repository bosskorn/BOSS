import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Search, Filter, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, FileText, Truck, Package, CheckCircle, XCircle, Printer, RefreshCw, X, Check, Square, Tag, Clock, AlertCircle, CornerUpLeft, CircleDollarSign, Slash, Folder, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import axios from 'axios';
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
  const [isPrintingMultiple, setIsPrintingMultiple] = useState(false);
  
  // การแบ่งหน้า
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20; // จำนวนรายการต่อหน้า

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
        console.log("ข้อมูลออเดอร์อยู่ใน orders field:", data.orders?.length || 0, "รายการ");
        
        // เพิ่มการตรวจสอบและตั้งค่าข้อมูลบริษัทขนส่งตามรหัสนำหน้าเลขพัสดุ
        const ordersWithCarrier = (data.orders || []).map((order: any) => {
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
        console.log("ดึงข้อมูลวิธีการจัดส่งสำเร็จ:", data.methods?.length || 0, "รายการ");
        setDbShippingMethods(data.methods || []);
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
  
  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // เลื่อนกลับขึ้นด้านบนของตาราง
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  // ฟังก์ชันพิมพ์ลาเบลแบบบัตเตอร์
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
    
    // บันทึกข้อมูลออเดอร์ที่จะพิมพ์และเปิดไดอะล็อกเลือกประเภทลาเบลโดยตรง
    setOrderToPrint(order);
    setSelectedLabelType('standard'); // ตั้งค่าเริ่มต้นเป็นลาเบลมาตรฐาน
    setLabelTypeDialogOpen(true);
  };

  // ฟังก์ชันเปิด Dialog สำหรับเลือกขนส่ง
  const openShippingDialog = (orderId: number) => {
    setOrderToCreateTracking(orderId);
    setShippingDialogOpen(true);
  };
  
  // ฟังก์ชันสำหรับสร้างเลขพัสดุหลายรายการพร้อมกัน
  const handleMultipleTracking = () => {
    console.log("กำลังเปิด Dialog สร้างเลขพัสดุหลายรายการ", selectedOrders.length, "รายการ");
    
    if (selectedOrders.length === 0) {
      toast({
        title: 'ไม่มีรายการที่เลือก',
        description: 'กรุณาเลือกรายการที่ต้องการสร้างเลขพัสดุ',
        variant: 'destructive',
      });
      return;
    }
    
    // เริ่มต้นค่าสำหรับวิธีการจัดส่งที่เลือก
    setSelectedShippingMethod('แบบมาตรฐาน');
    
    // เปิดไดอะล็อกเลือกวิธีการจัดส่ง
    setMultipleTrackingDialogOpen(true);
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
    
    // ตรวจสอบว่ามีออเดอร์ที่มีเลขพัสดุหรือไม่ (ตรวจสอบทั้ง camelCase และ snake_case)
    const ordersWithTracking = filteredOrders.filter(order => 
      selectedOrders.includes(order.id) && (order.trackingNumber || order.tracking_number)
    );
    
    // สำหรับ debug
    console.log("ข้อมูลออเดอร์ที่เลือก:", filteredOrders.filter(order => selectedOrders.includes(order.id)).map(o => ({
      id: o.id,
      trackingNumber: o.trackingNumber || 'null',
      tracking_number: o.tracking_number || 'null'
    })));
    
    if (ordersWithTracking.length === 0) {
      toast({
        title: 'ไม่สามารถพิมพ์ลาเบลได้',
        description: 'ออเดอร์ที่เลือกไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อนพิมพ์ลาเบล',
        variant: 'destructive',
      });
      return;
    }
    
    // ตั้งค่าเป็นการพิมพ์หลายรายการ
    setIsPrintingMultiple(true);
    
    // เปิดไดอะล็อกเลือกประเภทลาเบลโดยตรง (ข้ามการเลือกขนาด)
    setLabelTypeDialogOpen(true);
  };

  // ฟังก์ชันสำหรับพิมพ์ลาเบลตามประเภทที่เลือก
  const printLabelByType = () => {
    // ปิดไดอะล็อกเลือกประเภทลาเบล
    setLabelTypeDialogOpen(false);
    
    if (isPrintingMultiple) {
      // พิมพ์ลาเบลหลายรายการ
      const selectedOrdersData = filteredOrders.filter((order: Order) => selectedOrders.includes(order.id));
      
      // กรองเฉพาะออเดอร์ที่มีเลขพัสดุ (ตรวจสอบทั้ง camelCase และ snake_case)
      const ordersToPrint = selectedOrdersData.filter((order: Order) => order.trackingNumber || order.tracking_number);
      
      if (ordersToPrint.length === 0) {
        toast({
          title: 'ไม่มีรายการที่พิมพ์ได้',
          description: 'ไม่มีออเดอร์ที่มีเลขพัสดุในรายการที่เลือก',
          variant: 'destructive',
        });
        return;
      }
      
      // ดึง ID ของออเดอร์ที่จะพิมพ์
      const orderIds = ordersToPrint.map((order: Order) => order.id).join(',');
      
      // เปิดหน้าพิมพ์ลาเบลหลายรายการในแท็บใหม่
      window.open(`/print-multiple-labels?orders=${orderIds}&type=${selectedLabelType}`, '_blank');
      
      // อัพเดตออเดอร์ว่าได้พิมพ์แล้ว
      ordersToPrint.forEach(async (order: Order) => {
        fetch(`/api/orders/${order.id}/print-status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          credentials: 'include',
          body: JSON.stringify({ isPrinted: true })
        });
      });
    } else {
      // พิมพ์ลาเบลเดี่ยว
      if (!orderToPrint || !orderToPrint.id) return;
      
      // อัพเดตสถานะการพิมพ์ในฐานข้อมูล
      fetch(`/api/orders/${orderToPrint.id}/print-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({ isPrinted: true })
      });
      
      // เปิดหน้าพิมพ์ในแท็บใหม่ตามประเภทที่เลือก
      window.open(`/print-label-enhanced?order=${orderToPrint.id}&type=${selectedLabelType}`, '_blank');
    }
    
    // รีเซ็ตสถานะการพิมพ์หลายรายการ
    setIsPrintingMultiple(false);
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
        

        
        {/* ส่วนแถบแท็บและตัวกรอง */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
            <div className="px-4 pt-4 pb-2 border-b border-gray-200">
              
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
                      value="waiting" 
                      className="px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span>รอดำเนินการ</span>
                        <span className="ml-1 bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {orders.filter(o => !o.status || o.status === 'waiting').length}
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
                  เสี่ยวไป๋ เอ็กเพรส
                </div>
                <div 
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${shippingMethodFilter === 'jt-express' ? 'bg-red-100 text-red-800 border-2 border-red-300 font-semibold' : 'bg-red-50 text-red-700 text-xs font-medium border border-red-200 hover:bg-red-100'}`}
                  onClick={() => setShippingMethodFilter(shippingMethodFilter === 'jt-express' ? 'all' : 'jt-express')}
                >
                  <span className="w-2 h-2 inline-block bg-red-500 rounded-full"></span>
                  J&T Express
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
                      onClick={() => handlePrintMultiple()}
                    >
                      <Printer className="h-4 w-4 mr-1.5" />
                      พิมพ์ลาเบล
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`ต้องการลบรายการที่เลือกทั้งหมด ${selectedOrders.length} รายการใช่หรือไม่?`)) {
                          // สร้างอาร์เรย์ของคำขอลบ
                          // ยกเลิกการใช้ deletePromises เพราะเราจะใช้การลบทีละรายการอยู่แล้ว
                          // จึงไม่จำเป็นต้องสร้าง promise array อีก
                          
                          // จำนวนรายการที่จะลบ
                          const deleteCount = selectedOrders.length;
                          
                          // สำรองข้อมูลเดิมก่อนลบ
                          const ordersBackup = [...orders];
                          
                          // แสดงข้อความกำลังดำเนินการ
                          toast({
                            title: 'กำลังดำเนินการ',
                            description: `กำลังลบรายการที่เลือก ${deleteCount} รายการ`,
                          });
                          
                          // ดำเนินการลบทีละรายการแทนการใช้ Promise.all
                          // เพื่อให้สามารถดูว่ารายการใดลบได้หรือไม่ได้
                          let successCount = 0;
                          let failedCount = 0;
                          let failedMessages: string[] = [];
                          
                          const processDeleteOne = (index: number) => {
                            // ถ้าลบครบทุกรายการแล้ว แสดงสรุปผล
                            if (index >= selectedOrders.length) {
                              // สรุปผลการลบ
                              if (failedCount === 0) {
                                toast({
                                  title: 'ลบรายการสำเร็จ',
                                  description: `ลบรายการทั้งหมด ${successCount} รายการเรียบร้อยแล้ว`,
                                  variant: 'default',
                                });
                              } else if (successCount > 0) {
                                toast({
                                  title: 'ลบรายการบางส่วนสำเร็จ',
                                  description: `ลบได้ ${successCount} จาก ${deleteCount} รายการ มีบางรายการไม่สามารถลบได้`,
                                  variant: 'default',
                                });
                              } else {
                                toast({
                                  title: 'ไม่สามารถลบรายการได้',
                                  description: failedMessages[0] || 'ไม่สามารถลบรายการได้',
                                  variant: 'destructive',
                                });
                              }
                              
                              // รีเฟรชข้อมูลออเดอร์
                              fetchOrders();
                              return;
                            }
                            
                            // ดำเนินการลบรายการปัจจุบัน
                            const orderId = selectedOrders[index];
                            
                            fetch(`/api/orders/${orderId}`, {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include'
                            })
                              .then(response => response.json())
                              .then(data => {
                                if (data.success) {
                                  successCount++;
                                  console.log(`ลบรายการ ID: ${orderId} สำเร็จ`);
                                  toast({
                                    title: 'ลบรายการสำเร็จ',
                                    description: `รายการ ID: ${orderId} ถูกลบเรียบร้อยแล้ว`,
                                    variant: 'default'
                                  });
                                } else {
                                  failedCount++;
                                  const errorMsg = data.message || `ไม่สามารถลบรายการ ID: ${orderId}`;
                                  console.log(`ไม่สามารถลบรายการ ID: ${orderId} - ${errorMsg}`);
                                  failedMessages.push(errorMsg);
                                  
                                  // แสดงข้อความแจ้งเตือนสำหรับแต่ละรายการที่ลบไม่สำเร็จ
                                  // ตรวจสอบว่าเป็นข้อความเกี่ยวกับเครดิตหรือไม่
                                  const isCreditError = errorMsg.includes('เครดิต') || errorMsg.includes('credit');
                                  
                                  toast({
                                    title: 'ลบรายการไม่สำเร็จ',
                                    description: isCreditError 
                                      ? 'ระบบกำลังคืนเครดิตและลบรายการ กรุณาลองอีกครั้งในอีกสักครู่'
                                      : errorMsg,
                                    variant: 'destructive',
                                  });
                                }
                                // ดำเนินการกับรายการถัดไป
                                processDeleteOne(index + 1);
                              })
                              .catch(error => {
                                failedCount++;
                                const errorMessage = error instanceof Error ? error.message : `ไม่สามารถลบรายการ ID: ${orderId}`;
                                failedMessages.push(errorMessage);
                                console.error('Error deleting order:', error);
                                
                                // แสดงข้อความแจ้งเตือนสำหรับข้อผิดพลาดในการส่งคำขอ
                                toast({
                                  title: 'เกิดข้อผิดพลาดในการลบรายการ',
                                  description: errorMessage,
                                  variant: 'destructive',
                                });
                                
                                // ดำเนินการกับรายการถัดไปแม้จะมีข้อผิดพลาด
                                processDeleteOne(index + 1);
                              });
                          };
                          
                          // เริ่มต้นกระบวนการลบรายการแรก
                          processDeleteOne(0);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      ลบรายการที่เลือก
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
                        data-state={selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length ? "indeterminate" : undefined}
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
                    filteredOrders
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((order) => (
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
                        <TableCell>
                          {/* ทดสอบแสดงชื่อลูกค้า */}
                          {console.log(`Order #${order.id} customer:`, 
                            `customer_name=${order.customer_name || 'null'}`, 
                            `customerName=${order.customerName || 'null'}`
                          )}
                          {order.customer_name || order.customerName || (order.customer?.name) || 'ไม่ระบุ'}
                        </TableCell>
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
                          {/* สำหรับ debug console log */}
                          {console.log(`Order #${order.id}:`, 
                            `tracking_number=${order.tracking_number || 'null'}`, 
                            `trackingNumber=${order.trackingNumber || 'null'}`
                          )}
                          {/* ตรวจสอบว่ามีค่าเลขพัสดุหรือไม่ */}
                          {(
                            order.tracking_number || 
                            order.trackingNumber
                          ) ? (
                            // ถ้ามีเลขพัสดุให้แสดง แต่ถ้าขึ้นต้นด้วย "แบบ" ให้แปลงเป็นเลขพัสดุจำลอง
                            (
                              (order.tracking_number && order.tracking_number.startsWith('แบบ')) || 
                              (order.trackingNumber && order.trackingNumber.startsWith('แบบ'))
                            ) ? 
                              `FLE${Math.random().toString(36).substring(2, 10).toUpperCase()}` :
                              (order.tracking_number || order.trackingNumber)
                          ) : (
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
                                  // สำรองข้อมูลเดิมไว้ก่อน
                                  const orderBackup = {...order};
                                  
                                  // แสดงข้อความกำลังดำเนินการ
                                  toast({
                                    title: 'กำลังลบรายการ',
                                    description: `กำลังลบออเดอร์ ${order.orderNumber}`,
                                  });
                                  
                                  // ลบรายการจาก state ทันที (เพื่อ UI ตอบสนองเร็ว)
                                  const updatedOrders = orders.filter(o => o.id !== order.id);
                                  const updatedFilteredOrders = filteredOrders.filter(o => o.id !== order.id);
                                  
                                  setOrders(updatedOrders);
                                  setFilteredOrders(updatedFilteredOrders);
                                  
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
                                      // ให้แน่ใจว่าข้อมูลปัจจุบันในรายการตรงกับ backend
                                      fetchOrders();
                                    } else {
                                      throw new Error(data.message || 'ไม่สามารถลบออเดอร์ได้');
                                    }
                                  })
                                  .catch(error => {
                                    console.error('Error deleting order:', error);
                                    
                                    // ตรวจสอบว่าเป็น foreign key error หรือไม่
                                    const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถลบออเดอร์ได้';
                                    const isForeignKeyError = errorMessage.includes('foreign key constraint') || 
                                                            errorMessage.includes('fee_history') ||
                                                            errorMessage.includes('referenced');
                                    
                                    toast({
                                      title: 'ไม่สามารถลบรายการได้',
                                      description: isForeignKeyError 
                                        ? `ไม่สามารถลบออเดอร์ ${order.orderNumber} ได้เนื่องจากมีข้อมูลการใช้เครดิตผูกอยู่` 
                                        : errorMessage,
                                      variant: 'destructive',
                                    });
                                    
                                    // รีเฟรชข้อมูลเพื่อแสดงข้อมูลที่ถูกต้องตามฐานข้อมูล
                                    fetchOrders();
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
              
              {/* ส่วนควบคุมการแบ่งหน้า */}
              {filteredOrders.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 bg-white border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    แสดง {Math.min(1 + (currentPage - 1) * itemsPerPage, filteredOrders.length)} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} จากทั้งหมด {filteredOrders.length} รายการ
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">ก่อนหน้า</span>
                    </Button>
                    
                    <div className="hidden md:flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, Math.ceil(filteredOrders.length / itemsPerPage)) }, 
                        (_, i) => {
                          // ให้แสดงปุ่มไม่เกิน 5 ปุ่มในแบบสมาร์ท
                          const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
                          let pageNum;
                          
                          if (totalPages <= 5) {
                            // ถ้ามีน้อยกว่า 5 หน้า ให้แสดงทั้งหมด
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // ถ้าอยู่หน้าแรกๆ ให้แสดง 1-5
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // ถ้าอยู่หน้าท้ายๆ ให้แสดง totalPages-4 ถึง totalPages
                            pageNum = totalPages - 4 + i;
                          } else {
                            // ถ้าอยู่ตรงกลาง ให้แสดง currentPage-2 ถึง currentPage+2
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    
                    <div className="md:hidden flex items-center">
                      <span className="mx-2 text-sm font-medium">
                        หน้า {currentPage} จาก {Math.ceil(filteredOrders.length / itemsPerPage)}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                      className="h-8 px-3"
                    >
                      <span className="hidden sm:inline">ถัดไป</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>



      {/* Dialog เลือกประเภทลาเบล */}
      <Dialog open={labelTypeDialogOpen} onOpenChange={setLabelTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกประเภทใบลาเบล</DialogTitle>
            <DialogDescription>
              เลือกประเภทลาเบลตามบริษัทขนส่ง
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            {/* ลาเบลขนาดมาตรฐาน */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedLabelType === 'flash' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedLabelType('flash')}
            >
              <div>
                <h4 className="font-medium">ลาเบลขนาดมาตรฐานขนส่ง</h4>
                <p className="text-sm text-gray-500">ขนาด 100mm x 150mm สำหรับทุกการขนส่ง</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 p-0.5 ${selectedLabelType === 'flash' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedLabelType === 'flash' && (
                  <div className="w-full h-full rounded-full bg-blue-600"></div>
                )}
              </div>
            </div>
            
{/* TikTok Shop option hidden */}
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setLabelTypeDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={() => {
                setLabelTypeDialogOpen(false);
                
                if (isPrintingMultiple) {
                  // กรณีพิมพ์หลายรายการ
                  const selectedOrdersData = filteredOrders.filter((order: Order) => selectedOrders.includes(order.id));
                  // กรองเฉพาะออเดอร์ที่มีเลขพัสดุ
                  const ordersToPrint = selectedOrdersData.filter((order: Order) => order.tracking_number || order.trackingNumber);
                  
                  if (ordersToPrint.length === 0) {
                    toast({
                      title: 'ไม่สามารถพิมพ์ลาเบลได้',
                      description: 'ออเดอร์ที่เลือกไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อนพิมพ์ลาเบล',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  // สร้าง URL พร้อมพารามิเตอร์รายการออเดอร์
                  const orderIds = ordersToPrint.map((order: Order) => order.id).join(',');
                  
                  // ตรวจสอบให้แน่ใจว่ามี orderIds
                  if (!orderIds || orderIds.length === 0) {
                    toast({
                      title: 'ไม่สามารถพิมพ์ลาเบลได้',
                      description: 'ไม่พบรายการที่มีเลขพัสดุสำหรับพิมพ์',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  let labelUrl = '';
                  
                  switch(selectedLabelType) {
                    case 'flash':
                      labelUrl = `/flash-express-label-new?orders=${orderIds}`;
                      console.log("พิมพ์ลาเบลสำหรับ:", orderIds);
                      toast({
                        title: 'กำลังเปิดหน้าพิมพ์ลาเบล',
                        description: `กำลังเตรียมพิมพ์ลาเบลทั้งหมด ${ordersToPrint.length} รายการ (รูปแบบ Flash Express)`,
                      });
                      break;
                    case 'jt':
                      labelUrl = `/jt-express-label?order=${orderIds.split(',')[0]}`;
                      break;
                    case 'tiktok':
                      labelUrl = `/tiktok-shipping-label-fixed?order=${orderIds.split(',')[0]}`;
                      break;
                    default:
                      labelUrl = `/print-multiple-labels-fixed?orders=${orderIds}&type=standard`;
                  }
                  
                  // เปิดหน้าพิมพ์ในแท็บใหม่
                  window.open(labelUrl, '_blank');
                  
                  // อัพเดตสถานะการพิมพ์ในฐานข้อมูล
                  ordersToPrint.forEach(async (order: Order) => {
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
                  
                  // รีเซ็ตสถานะการพิมพ์หลายรายการ
                  setIsPrintingMultiple(false);
                  
                } else {
                  // กรณีพิมพ์รายการเดียว
                  // ตรวจสอบว่ามี order และ trackingNumber หรือไม่
                  if (!orderToPrint || (!orderToPrint.trackingNumber && !orderToPrint.tracking_number)) {
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
                    case 'flash':
                      labelUrl = `/flash-express-label-new?order=${orderToPrint.id}`;
                      break;
                    case 'jt':
                      labelUrl = `/jt-express-label?order=${orderToPrint.id}`;
                      break;
                    case 'tiktok':
                      labelUrl = `/tiktok-shipping-label-fixed?order=${orderToPrint.id}`;
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
                }
              }}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedLabelType}
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์ลาเบล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog สำหรับสร้างเลขพัสดุหลายรายการ */}
      <Dialog open={multipleTrackingDialogOpen} onOpenChange={setMultipleTrackingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างเลขพัสดุหลายรายการ</DialogTitle>
            <DialogDescription>
              เลือกบริษัทขนส่งเพื่อสร้างเลขพัสดุสำหรับ {selectedOrders.length} รายการที่เลือก
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            {/* ส่วนแสดงเมื่อกำลังโหลดข้อมูล */}
            {dbShippingMethods.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">กำลังโหลดข้อมูลวิธีการจัดส่ง...</p>
                <div className="flex justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
            

            
            {/* Xiaobai Express */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('เสี่ยวไป๋ เอ็กเพรส')}
            >
              <div>
                <h4 className="font-medium">เสี่ยวไป๋ เอ็กเพรส</h4>
                <p className="text-sm text-gray-500">บริการขนส่งจำลอง</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 p-0.5 ${selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส' && (
                  <div className="w-full h-full rounded-full bg-blue-600"></div>
                )}
              </div>
            </div>
            
            {/* Thailand Post */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedShippingMethod === 'ไปรษณีย์ไทย' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('ไปรษณีย์ไทย')}
            >
              <div>
                <h4 className="font-medium">ไปรษณีย์ไทย</h4>
                <p className="text-sm text-gray-500">บริการขนส่งไปรษณีย์ไทย</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 p-0.5 ${selectedShippingMethod === 'ไปรษณีย์ไทย' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedShippingMethod === 'ไปรษณีย์ไทย' && (
                  <div className="w-full h-full rounded-full bg-blue-600"></div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setMultipleTrackingDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={async () => {
                setMultipleTrackingDialogOpen(false);
                
                if (selectedOrders.length === 0) {
                  toast({
                    title: 'ไม่สามารถสร้างเลขพัสดุได้',
                    description: 'กรุณาเลือกรายการที่ต้องการสร้างเลขพัสดุ',
                    variant: 'destructive',
                  });
                  return;
                }
                
                // แสดงการโหลด
                toast({
                  title: 'กำลังสร้างเลขพัสดุ',
                  description: `กำลังดำเนินการสำหรับ ${selectedOrders.length} รายการ...`,
                });
                
                // สร้างเลขพัสดุสำหรับทุกออเดอร์ที่เลือก
                let successCount = 0;
                let failCount = 0;
                
                for (const orderId of selectedOrders) {
                  try {
                    const token = localStorage.getItem('auth_token');
                    
                    // เรียก API เพื่อสร้างเลขพัสดุ
                    const response = await fetch(`/api/orders/${orderId}/tracking`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        shippingMethod: selectedShippingMethod
                      })
                    });
                    
                    if (response.ok) {
                      successCount++;
                    } else {
                      failCount++;
                    }
                  } catch (error) {
                    failCount++;
                    console.error(`Error creating tracking for order ${orderId}:`, error);
                  }
                }
                
                // แสดงผลลัพธ์
                if (successCount > 0) {
                  toast({
                    title: 'สร้างเลขพัสดุสำเร็จ',
                    description: `สร้างเลขพัสดุสำเร็จ ${successCount} รายการ${failCount > 0 ? `, ล้มเหลว ${failCount} รายการ` : ''}`,
                    variant: successCount > 0 ? 'default' : 'destructive',
                  });
                  
                  // รีเฟรชข้อมูลเพื่อแสดงเลขพัสดุที่สร้างขึ้นใหม่
                  fetchOrders();
                } else {
                  toast({
                    title: 'ไม่สามารถสร้างเลขพัสดุได้',
                    description: 'เกิดข้อผิดพลาดในการสร้างเลขพัสดุ โปรดลองอีกครั้ง',
                    variant: 'destructive',
                  });
                }
              }}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedShippingMethod}
            >
              <Truck className="h-4 w-4 mr-2" />
              สร้างเลขพัสดุ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog เลือกขนส่ง (สำหรับสร้างเลขพัสดุรายการเดียว) */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกบริษัทขนส่ง</DialogTitle>
            <DialogDescription>
              เลือกบริษัทขนส่งเพื่อสร้างเลขพัสดุ
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            {/* ส่วนแสดงเมื่อกำลังโหลดข้อมูล */}
            {dbShippingMethods.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">กำลังโหลดข้อมูลวิธีการจัดส่ง...</p>
                <div className="flex justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
            
            {/* แบบมาตรฐาน */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedShippingMethod === 'แบบมาตรฐาน' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('แบบมาตรฐาน')}
            >
              <div>
                <h4 className="font-medium">แบบมาตรฐาน</h4>
                <p className="text-sm text-gray-500">รูปแบบทั่วไป ใช้ได้กับทุกบริษัทขนส่ง</p>
              </div>
              <div className="h-5 w-5 rounded-full p-0.5 border-2 border-gray-300">
                {selectedShippingMethod === 'แบบมาตรฐาน' && <div className="w-full h-full rounded-full bg-blue-600"></div>}
              </div>
            </div>
            
            {/* เสี่ยวไป๋ เอ็กเพรส */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('เสี่ยวไป๋ เอ็กเพรส')}
            >
              <div>
                <h4 className="font-medium">เสี่ยวไป๋ เอ็กเพรส</h4>
                <p className="text-sm text-gray-500">บริการขนส่งจำลอง</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 p-0.5 ${selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส' && <div className="w-full h-full rounded-full bg-blue-600"></div>}
              </div>
            </div>
            
            {/* J&T Express */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedShippingMethod === 'J&T Express' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('J&T Express')}
            >
              <div>
                <h4 className="font-medium">J&T Express</h4>
                <p className="text-sm text-gray-500">บริการขนส่ง J&T Express</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 p-0.5 ${selectedShippingMethod === 'J&T Express' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedShippingMethod === 'J&T Express' && <div className="w-full h-full rounded-full bg-blue-600"></div>}
              </div>
            </div>
            
            {/* TikTok Shop */}
            <div 
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${selectedShippingMethod === 'TikTok Shop' ? 'border-blue-600' : 'border-gray-200'}`}
              onClick={() => setSelectedShippingMethod('TikTok Shop')}
            >
              <div>
                <h4 className="font-medium">TikTok Shop</h4>
                <p className="text-sm text-gray-500">รูปแบบสำหรับผู้ขาย TikTok Shop</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 p-0.5 ${selectedShippingMethod === 'TikTok Shop' ? 'border-blue-600' : 'border-gray-300'}`}>
                {selectedShippingMethod === 'TikTok Shop' && <div className="w-full h-full rounded-full bg-blue-600"></div>}
              </div>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShippingDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={createTrackingNumber}
              disabled={!selectedShippingMethod}
            >
              <Tag className="h-4 w-4 mr-1.5" />
              สร้างเลขพัสดุ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrderList;