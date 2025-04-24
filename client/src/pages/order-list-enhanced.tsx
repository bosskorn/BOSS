// Find and replace Dialog component that uses trackingDialogOpen as state (at around line 2177)
// Replace with a comment to avoid duplicate tracking dialog
import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Search, Filter, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, FileText, Truck, Package, CheckCircle, XCircle, Printer, RefreshCw, X, Check, Square, Tag, Clock, AlertCircle, CornerUpLeft, CircleDollarSign, Slash, Folder, Trash2, AlertTriangle, Calendar as CalendarIcon, PackageX, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({ from: undefined });
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
  
  // Dialog แสดงข้อมูลการติดตามพัสดุ
  const [orderToCreateTracking, setOrderToCreateTracking] = useState<number | null>(null);
  const [dbShippingMethods, setDbShippingMethods] = useState<any[]>([]);
  const [statusSelected, setStatusSelected] = useState('all');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [labelTypeDialogOpen, setLabelTypeDialogOpen] = useState(false);
  const [selectedLabelType, setSelectedLabelType] = useState('flash');
  const [showFilters, setShowFilters] = useState(false);
  const [isPrintingMultiple, setIsPrintingMultiple] = useState(false);
  
  // Dialog สำหรับแสดงข้อมูลการติดตามพัสดุ
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [currentTrackingNumber, setCurrentTrackingNumber] = useState<string>('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  
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

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">รายการคำสั่งซื้อ</h1>
            <p className="text-gray-500">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => window.location.href = '/create-order'}
            >
              <FileText className="mr-1 h-4 w-4" />
              <span>สร้างออเดอร์ใหม่</span>
            </Button>
            <Button 
              variant="default" 
              className="flex items-center" 
              onClick={() => window.location.href = '/create-order-tabs'}
            >
              <Truck className="mr-1 h-4 w-4" />
              <span>สร้างใบสั่งซื้อ</span>
            </Button>
          </div>
        </div>
        
        {/* การกระทำแบบกลุ่ม */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex flex-wrap justify-between items-center">
            <div className="flex items-center">
              <CheckCircle className="text-blue-500 h-5 w-5 mr-2" />
              <span className="text-sm font-medium text-blue-700">
                เลือกแล้ว {selectedOrders.length} รายการ
              </span>
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={clearAllSelections}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                ยกเลิกการเลือก
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (selectedOrders.length > 0) {
                    setIsPrintingMultiple(true);
                    setLabelTypeDialogOpen(true);
                  } else {
                    toast({
                      title: 'กรุณาเลือกรายการก่อน',
                      description: 'คุณยังไม่ได้เลือกรายการใดๆ',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                พิมพ์ลาเบลที่เลือก
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (selectedOrders.length > 0) {
                    const orderIds = selectedOrders.join(',');
                    window.open(`/print-multiple-labels-fixed?orders=${orderIds}`, '_blank');
                  } else {
                    toast({
                      title: 'กรุณาเลือกรายการก่อน',
                      description: 'คุณยังไม่ได้เลือกรายการใดๆ',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                พิมพ์ใบปะหน้าแพ็คเกจ
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                ลบที่เลือก
              </Button>
            </div>
          </div>
        )}
        
        {/* การค้นหาและกรอง - ตามรูปแบบ Lazada */}
        <div className="bg-white rounded-t-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-4">
              <p className="text-filter mt-0 mb-2 text-sm font-medium text-gray-700">ค้นหาออเดอร์</p>
              <div className="relative w-full">
                <Input
                  placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, เลขพัสดุ..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="col-span-8 md:flex md:flex-wrap md:items-end gap-4">
              <div className="mb-4 md:mb-0 md:mr-4">
                <p className="text-filter mt-0 mb-2 text-sm font-medium text-gray-700">สถานะออเดอร์</p>
                <Select 
                  value={orderStatusFilter}
                  onValueChange={setOrderStatusFilter}
                >
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="สถานะออเดอร์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="processing">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="shipped">จัดส่งแล้ว</SelectItem>
                    <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              

              
              <div className="mb-4 md:mb-0 md:mr-4">
                <p className="text-filter mt-0 mb-2 text-sm font-medium text-gray-700">วิธีการชำระเงิน</p>
                <Select 
                  value={paymentMethodFilter}
                  onValueChange={setPaymentMethodFilter}
                >
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="วิธีการชำระเงิน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="cod">เก็บเงินปลายทาง (COD)</SelectItem>
                    <SelectItem value="prepaid">จ่ายล่วงหน้า</SelectItem>
                    <SelectItem value="paid">ชำระเงินแล้ว</SelectItem>
                    <SelectItem value="pending">รอชำระเงิน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:flex items-end space-x-2">
                <Button
                  variant="default"
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    fetchOrders(); // ค้นหาตามเงื่อนไข
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full md:w-auto mt-2 md:mt-0"
                  onClick={() => {
                    setSearchTerm('');
                    setOrderStatusFilter('all');
                    setShippingMethodFilter('all');
                    setPaymentMethodFilter('all');
                    setDateRangeFilter('all');
                    setDateRange({ from: undefined });
                    fetchOrders(); // รีเฟรชข้อมูล
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเซ็ต
                </Button>
              </div>
            </div>
          </div>
          
          {/* ตัวกรองเพิ่มเติม */}
          {showFilters && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ช่วงเวลา
                </label>
                <Select 
                  value={dateRangeFilter}
                  onValueChange={setDateRangeFilter}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="today">วันนี้</SelectItem>
                    <SelectItem value="yesterday">เมื่อวาน</SelectItem>
                    <SelectItem value="this-week">สัปดาห์นี้</SelectItem>
                    <SelectItem value="this-month">เดือนนี้</SelectItem>
                    <SelectItem value="custom">กำหนดเอง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateRangeFilter === 'custom' && (
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลือกวันที่
                  </label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="pl-3 pr-2 flex justify-between items-center h-9 w-full md:w-auto"
                        >
                          <span className="text-sm">
                            {dateRange?.from ? dateRange.from.toLocaleDateString() : "วันเริ่มต้น"}
                          </span>
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange?.from}
                          onSelect={(day) => setDateRange({ ...dateRange, from: day })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <span className="flex items-center">ถึง</span>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="pl-3 pr-2 flex justify-between items-center h-9 w-full md:w-auto"
                        >
                          <span className="text-sm">
                            {dateRange?.to ? dateRange.to.toLocaleDateString() : "วันสิ้นสุด"}
                          </span>
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange?.to}
                          onSelect={(day) => setDateRange({ ...dateRange, to: day })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="border-x border-gray-200">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="overflow-x-auto border-b border-gray-200 bg-white relative">
              <div className="flex px-4 pt-2 rounded-none w-auto min-w-full">
                <TabsList className="flex bg-transparent p-0 h-10 relative">
                  <TabsTrigger
                    value="all"
                    className="h-10 px-5 rounded-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-all relative"
                  >
                    <span>ทั้งหมด ({filteredOrders.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="h-10 px-5 rounded-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-all relative"
                  >
                    <span>รอดำเนินการ ({filteredOrders.filter(o => o.status === 'pending').length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="processing"
                    className="h-10 px-5 rounded-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-all relative"
                  >
                    <span>กำลังดำเนินการ ({filteredOrders.filter(o => o.status === 'processing').length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shipped"
                    className="h-10 px-5 rounded-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-all relative"
                  >
                    <span>อยู่ระหว่างจัดส่ง ({filteredOrders.filter(o => o.status === 'shipped').length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="h-10 px-5 rounded-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-all relative"
                  >
                    <span>จัดส่งสำเร็จ ({filteredOrders.filter(o => o.status === 'completed').length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="h-10 px-5 rounded-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-all relative"
                  >
                    <span>ยกเลิก ({filteredOrders.filter(o => o.status === 'cancelled').length})</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* แถบแสดงสถานะใต้แท็บที่เลือก */}
              <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all" style={{
                width: '95px',
                transform: `translateX(${activeTab === 'all' ? 16 : 
                             activeTab === 'pending' ? 111 : 
                             activeTab === 'processing' ? 247 : 
                             activeTab === 'shipped' ? 403 : 
                             activeTab === 'completed' ? 546 : 
                             activeTab === 'cancelled' ? 669 : 0}px)`
              }}></div>
            </div>
            
            <TabsContent value={activeTab} className="p-0 m-0">
              <Table>
                <TableHeader className="bg-white sticky top-0">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
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
                        {sorting.column === 'orderNumber' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('customerName')}>
                      <div className="flex items-center space-x-1">
                        {sorting.column === 'customerName' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
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
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center space-x-1">
                        <span>สถานะ</span>
                        {sorting.column === 'status' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="py-3 font-medium text-gray-500 cursor-pointer" onClick={() => handleSort('paymentStatus')}>
                      <div className="flex items-center space-x-1">
                        <span>การชำระเงิน</span>
                        {sorting.column === 'paymentStatus' && (
                          sorting.direction === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
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
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell className="font-medium text-blue-700">
                          <Link href={`/order-detail/${order.id}`}>
                            {order.order_number || order.orderNumber}
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
                          {order.status === 'pending' && !(order.tracking_number || order.trackingNumber) && (
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">รอดำเนินการ</Badge>
                          )}
                          {order.status === 'pending' && (order.tracking_number || order.trackingNumber) && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">รอเข้ารับ</Badge>
                          )}
                          {order.status === 'processing' && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">กำลังดำเนินการ</Badge>
                          )}
                          {order.status === 'shipped' && (
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">จัดส่งแล้ว</Badge>
                          )}
                          {order.status === 'completed' && (
                            <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50">เสร็จสมบูรณ์</Badge>
                          )}
                          {order.status === 'cancelled' && (
                            <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">ยกเลิก</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.paymentStatus === 'cod' && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">เก็บเงินปลายทาง</Badge>
                          )}
                          {order.paymentStatus === 'prepaid' && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">จ่ายล่วงหน้า</Badge>
                          )}
                          {order.paymentStatus === 'paid' && (
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">ชำระแล้ว</Badge>
                          )}
                          {order.paymentStatus === 'pending' && (
                            <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">รอชำระ</Badge>
                          )}
                          {!order.paymentStatus && order.paymentMethod === 'cod' && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">เก็บเงินปลายทาง</Badge>
                          )}
                          {!order.paymentStatus && order.paymentMethod === 'prepaid' && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">จ่ายล่วงหน้า</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {order.createdAt && new Date(order.createdAt).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          {console.log(`Order #${order.id}:`, 
                            `tracking_number=${order.tracking_number || 'null'}`, 
                            `trackingNumber=${order.trackingNumber || 'null'}`
                          )}
                          {/* ตรวจสอบว่ามีค่าเลขพัสดุหรือไม่ */}
                          {!order.tracking_number && !order.trackingNumber ? (
                            // กรณีไม่มีเลขพัสดุ แสดงปุ่มสร้างเลขพัสดุ
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="px-2 py-0 h-7 text-xs" 
                              onClick={() => {
                                setOrderToCreateTracking(order.id);
                                setShippingDialogOpen(true);
                              }}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              สร้างเลขพัสดุ
                            </Button>
                          ) : (
                            // กรณีมีเลขพัสดุ ตรวจสอบว่ามีคำว่า "แบบ" หรือไม่
                            (order.tracking_number && order.tracking_number.startsWith('แบบ')) || 
                            (order.trackingNumber && order.trackingNumber.startsWith('แบบ')) ? (
                              // กรณีเป็นเลขพัสดุที่ขึ้นต้นด้วย "แบบ" ให้แปลงเป็นเลขพัสดุจำลอง
                              <span className="text-xs text-gray-600">
                                {`FLE${Math.random().toString(36).substring(2, 10).toUpperCase()}`}
                              </span>
                            ) : (
                              // กรณีเป็นเลขพัสดุปกติให้แสดงเป็นลิงก์
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 h-5 text-blue-600 hover:text-blue-700 underline font-medium"
                                onClick={() => {
                                  const trackingNo = order.tracking_number || order.trackingNumber || '';
                                  setCurrentTrackingNumber(trackingNo);
                                  // ปิด dialog ที่อาจจะเปิดอยู่ก่อนหน้า
                                  setTrackingDialogOpen(false);
                                  
                                  // รอให้ dialog เดิมปิดก่อนแล้วค่อยเปิดใหม่
                                  setTimeout(() => {
                                    setTrackingDialogOpen(true);
                                    setIsLoadingTracking(true);
                                  
                                    // ดึงสถานะการติดตามพัสดุ
                                    fetch(`/api/tracking/status/${trackingNo}`)
                                      .then(response => response.json())
                                      .then(data => {
                                        console.log("ข้อมูลติดตามพัสดุ:", data);
                                        // ตรวจสอบรูปแบบข้อมูลที่ได้รับกลับมา
                                        if (data.success && data.trackingData) {
                                          setTrackingData(data.trackingData);
                                        } else {
                                          setTrackingData(null);
                                          toast({
                                            title: "ไม่พบข้อมูล",
                                            description: data.message || "ไม่พบข้อมูลการติดตามพัสดุ",
                                            variant: "destructive"
                                          });
                                        }
                                      })
                                      .catch(error => {
                                        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลติดตามพัสดุ:", error);
                                        toast({
                                          title: "เกิดข้อผิดพลาด",
                                          description: "ไม่สามารถดึงข้อมูลติดตามพัสดุได้",
                                          variant: "destructive"
                                        });
                                      })
                                      .finally(() => {
                                        setIsLoadingTracking(false);
                                      });
                                  }, 100);
                                }}
                              >
                                {order.tracking_number || order.trackingNumber}
                              </Button>
                            )
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
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage * itemsPerPage >= filteredOrders.length}
                      className="h-8 px-3"
                    >
                      <span className="hidden sm:inline">ถัดไป</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>



      {/* Dialog แสดงข้อมูลการติดตามพัสดุ */}
      <Dialog open={trackingDialogOpen} onOpenChange={(open) => {
        // ปิด Dialog เมื่อกดปิด และล้างข้อมูลเพื่อป้องกัน dialog ซ้อนกัน
        if (!open) {
          setTrackingDialogOpen(false);
          // รอสักครู่แล้วล้างข้อมูล
          setTimeout(() => {
            setTrackingData(null);
            setCurrentTrackingNumber('');
          }, 300);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ข้อมูลการติดตามพัสดุ</DialogTitle>
            <DialogDescription>
              เลขพัสดุ: {currentTrackingNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingTracking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-lg">กำลังโหลดข้อมูล...</span>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="font-medium text-gray-900">สถานะล่าสุด</h3>
                  <div className="mt-2 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>
                        {trackingData.stateText || trackingData.status || 'รอดำเนินการ'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* ตรวจสอบทั้ง history (รูปแบบเก่า) และ routes (Flash Express API) */}
                {(trackingData.history && trackingData.history.length > 0) || (trackingData.routes && trackingData.routes.length > 0) ? (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">ประวัติการเดินทาง</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {/* กรณีมีข้อมูลในรูปแบบ routes (จาก Flash Express API) */}
                      {trackingData.routes && trackingData.routes.map((item: any, index: number) => (
                        <li key={`route-${index}`} className="px-4 py-3">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {item.message || item.routeAction || 'อัปเดตสถานะ'}
                              </p>
                              <div className="mt-1 text-sm text-gray-500 space-y-1">
                                <p>{item.operationAddress || 'ไม่ระบุสถานที่'}</p>
                                <p className="text-xs text-gray-400">
                                  {item.routedAt 
                                    ? new Date(item.routedAt * 1000).toLocaleString('th-TH', {
                                        year: 'numeric', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                      })
                                    : 'ไม่ระบุเวลา'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                      
                      {/* กรณีมีข้อมูลในรูปแบบ history (รูปแบบเก่า) */}
                      {trackingData.history && trackingData.history.map((item: any, index: number) => (
                        <li key={`history-${index}`} className="px-4 py-3">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{item.status || 'อัปเดตสถานะ'}</p>
                              <div className="mt-1 text-sm text-gray-500 space-y-1">
                                <p>{item.location || 'ไม่ระบุสถานที่'}</p>
                                <p className="text-xs text-gray-400">{item.datetime || 'ไม่ระบุเวลา'}</p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-2">ยังไม่มีข้อมูลการเดินทางของพัสดุ</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2">ไม่พบข้อมูลการติดตามพัสดุ</p>
                <p className="text-sm text-gray-400 mt-1">โปรดตรวจสอบเลขพัสดุอีกครั้ง</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setTrackingDialogOpen(false)}>
              ปิด
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
                      labelUrl = `/tiktok-style-label?orders=${orderIds}`;
                      console.log("พิมพ์ลาเบลสำหรับ:", orderIds);
                      toast({
                        title: 'กำลังเปิดหน้าพิมพ์ลาเบล',
                        description: `กำลังเตรียมพิมพ์ลาเบลทั้งหมด ${ordersToPrint.length} รายการ (รูปแบบ BLUEDASH)`,
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
                      console.error('การอัพเดตสถานะการพิมพ์ล้มเหลว:', error);
                    }
                  });
                } else if (orderToPrint) {
                  // กรณีพิมพ์รายการเดียว
                  let labelUrl = '';
                  
                  switch(selectedLabelType) {
                    case 'flash':
                      labelUrl = `/tiktok-style-label?order=${orderToPrint.id}`;
                      break;
                    case 'jt':
                      labelUrl = `/jt-express-label?order=${orderToPrint.id}`;
                      break;
                    case 'tiktok':
                      labelUrl = `/tiktok-shipping-label-fixed?order=${orderToPrint.id}`;
                      break;
                    default:
                      labelUrl = `/print-label-enhanced?order=${orderToPrint.id}&type=standard`;
                  }
                  
                  // เปิดหน้าพิมพ์ในแท็บใหม่
                  window.open(labelUrl, '_blank');
                  
                  // อัพเดตสถานะการพิมพ์ในฐานข้อมูล
                  fetch(`/api/orders/${orderToPrint.id}/print-status`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify({ isPrinted: true })
                  })
                  .catch(error => {
                    console.error('การอัพเดตสถานะการพิมพ์ล้มเหลว:', error);
                  });
                }
                
                // รีเซ็ตสถานะ
                setIsPrintingMultiple(false);
                setOrderToPrint(null);
              }}
              disabled={!selectedLabelType}
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์ลาเบล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog สำหรับ Multiple Tracking */}
      <Dialog open={multipleTrackingDialogOpen} onOpenChange={setMultipleTrackingDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              ข้อมูลการติดตามพัสดุหลายรายการ
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              แสดงข้อมูลการติดตามพัสดุของรายการที่เลือก
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* ส่วนแสดงผลการติดตามพัสดุหลายรายการ */}
            <div className="overflow-auto max-h-[500px]">
              {/* ตัวอย่างเนื้อหา */}
              <div className="space-y-4">
                {selectedOrders.length > 0 ? (
                  filteredOrders
                    .filter((order) => selectedOrders.includes(order.id))
                    .map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-900">ออเดอร์ #{order.id} - {order.order_number || order.orderNumber}</h3>
                            <p className="text-sm text-gray-500">เลขพัสดุ: {order.tracking_number || order.trackingNumber || 'ไม่มีเลขพัสดุ'}</p>
                          </div>
                          {(order.tracking_number || order.trackingNumber) && (
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                setCurrentTrackingNumber(order.tracking_number || order.trackingNumber || '');
                                setIsLoadingTracking(true);
                                setTrackingData(null);
                                setMultipleTrackingDialogOpen(false);
                                
                                // รอสักครู่ก่อนเปิด dialog ใหม่
                                setTimeout(() => {
                                  setTrackingDialogOpen(true);
                                  
                                  // ดึงข้อมูลการติดตามพัสดุ
                                  fetch(`/api/tracking/status/${order.tracking_number || order.trackingNumber}`)
                                    .then(response => response.json())
                                    .then(data => {
                                      setTrackingData(data);
                                    })
                                    .catch(error => {
                                      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลติดตามพัสดุ:", error);
                                    })
                                    .finally(() => {
                                      setIsLoadingTracking(false);
                                    });
                                }, 100);
                              }}
                            >
                              ดูรายละเอียด
                            </Button>
                          )}
                        </div>
                        {/* เพิ่มเนื้อหาการติดตามต่อไป */}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-2">ไม่มีรายการที่เลือก</p>
                    <p className="text-sm text-gray-400 mt-1">กรุณาเลือกรายการที่ต้องการดูข้อมูลการติดตาม</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="default" 
              onClick={() => setMultipleTrackingDialogOpen(false)}
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog สร้างเลขพัสดุ */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างเลขพัสดุ</DialogTitle>
            <DialogDescription>
              เลือกบริษัทขนส่งและสร้างเลขพัสดุสำหรับการจัดส่ง
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">เลือกบริษัทขนส่ง</label>
              <Select
                value={selectedShippingMethod}
                onValueChange={setSelectedShippingMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบริษัทขนส่ง" />
                </SelectTrigger>
                <SelectContent>
                  {dbShippingMethods.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name} ({method.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-4 text-sm">
              <p className="font-medium text-gray-700 mb-2">ข้อมูลการสร้างเลขพัสดุ</p>
              <p className="text-gray-600 mb-1">- คุณกำลังสร้างเลขพัสดุสำหรับออเดอร์ #{orderToCreateTracking}</p>
              <p className="text-gray-600 mb-1">- เลขพัสดุที่สร้างจะถูกบันทึกและไม่สามารถเปลี่ยนแปลงได้</p>
              <p className="text-gray-600">- คุณสามารถพิมพ์ลาเบลได้หลังจากสร้างเลขพัสดุเรียบร้อยแล้ว</p>
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
              onClick={async () => {
                if (!selectedShippingMethod) {
                  toast({
                    title: 'ข้อผิดพลาด',
                    description: 'กรุณาเลือกบริษัทขนส่ง',
                    variant: 'destructive'
                  });
                  return;
                }
                
                setShippingDialogOpen(false);
                toast({
                  title: 'กำลังสร้างเลขพัสดุ',
                  description: 'กรุณารอสักครู่...'
                });
                
                try {
                  // ส่งคำขอสร้างเลขพัสดุไปยัง API
                  const token = localStorage.getItem('auth_token');
                  const response = await fetch(`/api/shipping-methods/${selectedShippingMethod}/create-tracking`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token ? `Bearer ${token}` : '',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      orderId: orderToCreateTracking
                    })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    toast({
                      title: 'สำเร็จ',
                      description: `สร้างเลขพัสดุเรียบร้อยแล้ว: ${data.trackingNumber}`,
                      variant: 'default'
                    });
                    
                    // รีเฟรชข้อมูลออเดอร์
                    fetchOrders();
                    
                    // แสดงข้อความถามว่าต้องการพิมพ์ลาเบลหรือไม่
                    if (confirm('ต้องการพิมพ์ลาเบลหรือไม่?')) {
                      // ค้นหาออเดอร์ที่เพิ่งสร้างเลขพัสดุ
                      const order = await fetch(`/api/orders/${orderToCreateTracking}`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': token ? `Bearer ${token}` : '',
                        },
                        credentials: 'include'
                      }).then(res => res.json());
                      
                      if (order.success) {
                        setOrderToPrint(order.order);
                        setLabelTypeDialogOpen(true);
                      }
                    }
                  } else {
                    toast({
                      title: 'เกิดข้อผิดพลาด',
                      description: data.message || 'ไม่สามารถสร้างเลขพัสดุได้',
                      variant: 'destructive'
                    });
                  }
                } catch (error) {
                  console.error('Error creating tracking number:', error);
                  toast({
                    title: 'เกิดข้อผิดพลาด',
                    description: error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์',
                    variant: 'destructive'
                  });
                }
                
                // รีเซ็ตค่า
                setOrderToCreateTracking(null);
                setSelectedShippingMethod('');
              }}
              disabled={!selectedShippingMethod}
            >
              <Tag className="h-4 w-4 mr-1.5" />
              สร้างเลขพัสดุ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* แก้ไขโดยลบ Dialog ที่ซ้ำซ้อนออก */}

      {/* Dialog ยืนยันการลบหลายรายการ */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">ยืนยันการลบรายการ</DialogTitle>
            <DialogDescription>
              คุณกำลังจะลบรายการที่เลือกทั้งหมด {selectedOrders.length} รายการ การกระทำนี้ไม่สามารถเรียกคืนได้
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">คำเตือน:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ข้อมูลที่ถูกลบไม่สามารถเรียกคืนได้</li>
                    <li>หากรายการมีการเชื่อมโยงกับข้อมูลอื่น อาจไม่สามารถลบได้</li>
                    <li>รายการที่มีการสร้างเลขพัสดุแล้วอาจไม่สามารถลบได้</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (selectedOrders.length === 0) {
                  toast({
                    title: 'ไม่มีรายการที่เลือก',
                    description: 'กรุณาเลือกรายการที่ต้องการลบ',
                    variant: 'destructive',
                  });
                  setBulkDeleteDialogOpen(false);
                  return;
                }
                
                setBulkDeleteDialogOpen(false);
                
                // สำรองข้อมูลเดิมไว้
                const ordersBackup = [...orders];
                const filteredOrdersBackup = [...filteredOrders];
                
                // ลบรายการออกจาก state ทันที (ทำให้ UI ตอบสนองเร็ว)
                const updatedOrders = orders.filter(order => !selectedOrders.includes(order.id));
                const updatedFilteredOrders = filteredOrders.filter(order => !selectedOrders.includes(order.id));
                
                setOrders(updatedOrders);
                setFilteredOrders(updatedFilteredOrders);
                
                // แสดงการแจ้งเตือนว่ากำลังลบ
                toast({
                  title: 'กำลังลบรายการ',
                  description: `กำลังลบรายการที่เลือก ${selectedOrders.length} รายการ`,
                });
                
                // ลบรายการทีละรายการ
                let successCount = 0;
                let errorCount = 0;
                
                for (const orderId of selectedOrders) {
                  try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`/api/orders/${orderId}`, {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                      },
                      credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      successCount++;
                    } else {
                      errorCount++;
                      console.error(`ไม่สามารถลบออเดอร์ #${orderId}: ${data.message}`);
                    }
                  } catch (error) {
                    errorCount++;
                    console.error(`ข้อผิดพลาดในการลบออเดอร์ #${orderId}:`, error);
                  }
                }
                
                // แสดงผลลัพธ์
                if (errorCount === 0) {
                  toast({
                    title: 'ลบรายการสำเร็จ',
                    description: `ลบรายการทั้งหมด ${successCount} รายการเรียบร้อยแล้ว`,
                    variant: 'default',
                  });
                } else if (successCount === 0) {
                  toast({
                    title: 'ลบรายการไม่สำเร็จ',
                    description: `ไม่สามารถลบรายการทั้งหมด ${errorCount} รายการ`,
                    variant: 'destructive',
                  });
                  
                  // คืนค่าข้อมูลเดิม
                  setOrders(ordersBackup);
                  setFilteredOrders(filteredOrdersBackup);
                } else {
                  toast({
                    title: 'ลบรายการบางส่วนสำเร็จ',
                    description: `ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${errorCount} รายการ`,
                    variant: 'default',
                  });
                }
                
                // ล้างการเลือก
                setSelectedOrders([]);
                setSelectAll(false);
                
                // รีเฟรชข้อมูล
                fetchOrders();
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrderList;
