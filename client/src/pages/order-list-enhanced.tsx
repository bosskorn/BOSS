import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import {
  Loader2,
  Search,
  Filter,
  FilterX,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Printer,
  RefreshCw,
  X,
  Check,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
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
  discount?: number;
  subtotal?: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingMethod: string;
  shippingMethodId?: number;
  shippingServiceId?: number;
  items: number;
  trackingNumber?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientProvince?: string;
  recipientDistrict?: string;
  recipientSubdistrict?: string;
  recipientZipCode?: string;
  notes?: string;
  isPrinted?: boolean;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shippingFilter, setShippingFilter] = useState<string>('all');
  const [isPrintingLabel, setIsPrintingLabel] = useState<boolean>(false);
  const [currentPrintingOrder, setCurrentPrintingOrder] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: keyof Order, direction: 'asc' | 'desc'}>({
    key: 'date',
    direction: 'desc'
  });
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [availableShippingMethods, setAvailableShippingMethods] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState<'100x100mm' | '100x75mm'>('100x100mm');
  const [printDialogOpen, setPrintDialogOpen] = useState<boolean>(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  

  // ฟังก์ชันเรียกข้อมูลคำสั่งซื้อจาก API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // ดึง token จาก localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/orders', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': token ? `Bearer ${token}` : '', // เพิ่ม Authorization header ถ้ามี token
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // ตรวจสอบรูปแบบข้อมูลว่ามาในรูปแบบไหน
        if (Array.isArray(data.data)) {
          console.log('ข้อมูลออเดอร์อยู่ใน data field:', data.data.length, 'รายการ');
          setOrders(data.data);
          setFilteredOrders(data.data);
        } else if (Array.isArray(data.orders)) {
          console.log('ข้อมูลออเดอร์อยู่ใน orders field:', data.orders.length, 'รายการ');
          setOrders(data.orders);
          setFilteredOrders(data.orders);
        } else {
          console.warn('ไม่พบข้อมูลออเดอร์ในรูปแบบที่คาดหวัง:', data);
          setOrders([]);
          setFilteredOrders([]);
        }
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลผู้ให้บริการขนส่งที่มี
  const extractShippingMethods = (orders: Order[]) => {
    // รวบรวมวิธีการขนส่งทั้งหมดที่มีในออร์เดอร์ และกำจัดค่าซ้ำ
    const methods = orders
      .map(order => order.shippingMethod)
      .filter((method): method is string => !!method);
      
    const uniqueMethods = Array.from(new Set(methods));
    setAvailableShippingMethods(uniqueMethods);
  };

  // เรียกข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // สกัดข้อมูลวิธีการขนส่งเมื่อข้อมูลออร์เดอร์มีการเปลี่ยนแปลง
  useEffect(() => {
    if (orders.length > 0) {
      extractShippingMethods(orders);
    }
    
    // เพิ่ม Flash Express เป็นตัวเลือกเริ่มต้นเสมอ
    // เพื่อให้สามารถกรองได้ทันที แม้ไม่มีข้อมูลขนส่งในออร์เดอร์
    setAvailableShippingMethods(prev => {
      if (prev.includes('Flash Express')) {
        return prev;
      }
      return [...prev, 'Flash Express'];
    });
  }, [orders]);

  // กรองข้อมูลเมื่อแท็บเปลี่ยน หรือค้นหา หรือช่วงวันที่เปลี่ยน หรือกรองขนส่ง
  useEffect(() => {
    let result = [...orders];
    
    // กรองตามแท็บ
    if (activeTab !== 'all') {
      result = result.filter(order => order.status === activeTab);
    }
    
    // กรองตามข้อความค้นหา
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTermLower) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTermLower))
      );
    }
    
    // กรองตามช่วงวันที่
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // ตั้งค่าให้เป็นสิ้นสุดของวัน
      
      result = result.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    // กรองตามวิธีการขนส่ง
    if (shippingFilter !== 'all') {
      result = result.filter(order => order.shippingMethod === shippingFilter);
    }
    
    // จัดเรียงข้อมูล
    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a[sortConfig.key]).getTime();
        const dateB = new Date(b[sortConfig.key]).getTime();
        
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === 'total') {
        const aTotal = a.total !== undefined ? a.total : parseFloat(a.totalAmount || "0");
        const bTotal = b.total !== undefined ? b.total : parseFloat(b.totalAmount || "0");
        return sortConfig.direction === 'asc' 
          ? aTotal - bTotal
          : bTotal - aTotal;
      } else {
        const valueA = String(a[sortConfig.key]).toLowerCase();
        const valueB = String(b[sortConfig.key]).toLowerCase();
        
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
    
    setFilteredOrders(result);
  }, [orders, activeTab, searchTerm, dateRange, sortConfig, shippingFilter]);

  // ฟังก์ชันจัดการการคลิกหัวตาราง เพื่อเรียงลำดับ
  const handleSort = (key: keyof Order) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // สร้าง Icon สำหรับสถานะ
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // สร้าง Badge สำหรับสถานะ
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">รอดำเนินการ</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">กำลังจัดการ</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">จัดส่งแล้ว</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">จัดส่งสำเร็จ</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">ไม่ระบุ</Badge>;
    }
  };
  
  // ฟังก์ชันแสดงสถานะการพิมพ์ใบลาเบล
  const getPrintStatus = (isPrinted?: boolean) => {
    if (isPrinted) {
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">พิมพ์แล้ว</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">รอพิมพ์</Badge>;
    }
  };

  // ฟังก์ชันฟอร์แมตเลขเป็นรูปแบบเงินบาท
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "฿0.00";
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ฟังก์ชันฟอร์แมตวันที่เป็นรูปแบบวันที่ไทยที่อ่านง่าย
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    
    const date = new Date(dateString);
    
    // เช็คว่าเป็นวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) return "-";
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    // แปลงเป็นรูปแบบไทย
    const thaiDate = date.toLocaleDateString('th-TH', options);
    
    // แยกวันที่และเวลา
    const [datePart, timePart] = thaiDate.split(' ');
    
    // สร้างรูปแบบที่อ่านง่ายขึ้น
    return (
      <div className="text-sm">
        <div className="font-medium">{datePart}</div>
        <div className="text-gray-500 text-xs">{timePart} น.</div>
      </div>
    );
  };
  
  // ฟังก์ชันฟอร์แมตวิธีการชำระเงิน
  const formatPaymentMethod = (method: string | null | undefined) => {
    if (!method) return <span className="text-gray-400">ไม่ระบุ</span>;
    
    switch (method) {
      case 'bank_transfer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">โอนเงิน</Badge>;
      case 'credit_card':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">บัตรเครดิต</Badge>;
      case 'cash_on_delivery':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">เก็บเงินปลายทาง</Badge>;
      case 'prompt_pay':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">พร้อมเพย์</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  // ฟังก์ชันพิมพ์ใบลาเบล (เวอร์ชั่นเก่า - ไม่ใช้แล้ว)
  const handlePrintLabelOld = async (order: Order) => {
    if (!order.trackingNumber) {
      toast({
        title: 'ไม่สามารถพิมพ์ใบลาเบล',
        description: 'ออเดอร์นี้ยังไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อน',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentPrintingOrder(order.id);
    
    try {
      // สร้างหน้าต่างใหม่สำหรับพิมพ์
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบการตั้งค่าป้องกันป๊อปอัพ');
      }
      
      // สร้าง HTML สำหรับใบลาเบล
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบลาเบลพัสดุ - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Kanit', sans-serif; margin: 0; padding: 0; }
            .label-container { width: 100mm; height: 150mm; border: 1px solid #ccc; padding: 5mm; margin: 10px auto; }
            .logo { text-align: center; margin-bottom: 5mm; font-size: 24px; font-weight: bold; color: #8A2BE2; }
            .tracking { font-size: 16px; text-align: center; margin-bottom: 5mm; padding: 2mm; border: 1px solid #8A2BE2; }
            .section { margin-bottom: 5mm; }
            .title { font-weight: bold; margin-bottom: 2mm; font-size: 14px; }
            .address { font-size: 14px; line-height: 1.5; }
            .barcode { text-align: center; margin: 5mm 0; font-size: 16px; }
            .footer { text-align: center; font-size: 12px; margin-top: 5mm; color: #666; }
            .box { border: 1px solid #ccc; padding: 3mm; }
            .print-button { text-align: center; margin: 20px; }
            .print-button button { padding: 10px 20px; background: #8A2BE2; color: white; border: none; border-radius: 5px; cursor: pointer; }
            @media print {
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-button">
            <button onclick="window.print();">พิมพ์ใบลาเบล</button>
          </div>
          
          <div class="label-container">
            <div class="logo">PURPLEDASH</div>
            
            <div class="tracking box">
              <div>เลขพัสดุ</div>
              <div style="font-size: 20px; font-weight: bold;">${order.trackingNumber}</div>
            </div>
            
            <div class="section">
              <div class="title">ผู้ส่ง:</div>
              <div class="box address">
                PURPLEDASH<br />
                เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
                ถนนพระราม 4 แขวงลุมพินี<br />
                เขตปทุมวัน กรุงเทพฯ 10330<br />
                โทร: 02-123-4567
              </div>
            </div>
            
            <div class="section">
              <div class="title">ผู้รับ:</div>
              <div class="box address">
                ${order.recipientName || 'ไม่ระบุ'}<br />
                ${order.recipientAddress || ''} ${order.recipientSubdistrict || ''}<br />
                ${order.recipientDistrict || ''} ${order.recipientProvince || ''} ${order.recipientZipCode || ''}<br />
                โทร: ${order.recipientPhone || 'ไม่ระบุ'}
              </div>
            </div>
            
            <div class="barcode box">
              ${order.trackingNumber}
            </div>
            
            <div class="footer">
              ${order.paymentMethod === 'cash_on_delivery' ? 'เก็บเงินปลายทาง: ' + formatCurrency(order.total || parseFloat(order.totalAmount || '0')) : 'จ่ายเงินแล้ว'}
            </div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // รอให้หน้าต่างพิมพ์โหลดเสร็จ
      printWindow.addEventListener('load', () => {
        // อัพเดตสถานะการพิมพ์
        updatePrintStatus(order.id);
      });
      
    } catch (error) {
      console.error('Error printing label:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ใบลาเบลได้',
        variant: 'destructive',
      });
    } finally {
      setCurrentPrintingOrder(null);
    }
  };
  
  // ฟังก์ชันอัพเดตสถานะการพิมพ์ที่ฐานข้อมูล
  const updatePrintStatus = async (orderId: number) => {
    try {
      // ดึง token จาก localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/orders/${orderId}/print-status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ isPrinted: true }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // อัพเดตสถานะในข้อมูลที่แสดง
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, isPrinted: true } 
              : order
          )
        );
        
        toast({
          title: 'สำเร็จ',
          description: 'อัพเดตสถานะการพิมพ์ใบลาเบลเรียบร้อย',
        });
      } else {
        throw new Error(data.message || 'ไม่สามารถอัพเดตสถานะการพิมพ์ได้');
      }
    } catch (error) {
      console.error('Error updating print status:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถอัพเดตสถานะการพิมพ์ได้',
        variant: 'destructive',
      });
    }
  };
  
  // ฟังก์ชันจัดการเลือกและยกเลิกการเลือกออเดอร์
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };
  
  // ฟังก์ชันเลือกทั้งหมดที่แสดงในหน้า
  const selectAllOrders = () => {
    const orderIds = filteredOrders
      .filter(order => order.trackingNumber) // เลือกเฉพาะรายการที่มีเลขพัสดุ
      .map(order => order.id);
    
    setSelectedOrders(orderIds);
  };
  
  // ฟังก์ชันยกเลิกการเลือกทั้งหมด
  const clearAllSelections = () => {
    setSelectedOrders([]);
  };
  
  // ฟังก์ชันพิมพ์ใบลาเบลสำหรับรายการที่เลือก
  // สำหรับฟังก์ชันพิมพ์ใบลาเบลแบบปกติ (เพื่อความเข้ากันได้)
  const handlePrintLabel = (order: Order) => {
    handlePrintLabelWithSizeDialog(order);
  };

  // ฟังก์ชันพิมพ์แบบเลือกหลายรายการตามขนาดที่เลือก
  const printSelectedLabelsWithSize = async () => {
    // ใช้ขนาดที่เลือกจาก dialog แล้ว
    setIsPrintingLabel(true);
    
    if (selectedOrders.length === 0) {
      toast({
        title: 'ไม่มีรายการที่เลือก',
        description: 'กรุณาเลือกรายการที่ต้องการพิมพ์ใบลาเบล',
        variant: 'destructive',
      });
      setIsPrintingLabel(false);
      return;
    }
    
    try {
      // สร้างหน้าต่างใหม่สำหรับพิมพ์
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบการตั้งค่าป้องกันป๊อปอัพ');
      }
      
      // หาออเดอร์ที่ต้องการพิมพ์
      const ordersToPrint = orders.filter(order => 
        selectedOrders.includes(order.id) && order.trackingNumber
      );
      
      if (ordersToPrint.length === 0) {
        throw new Error('ไม่มีรายการที่เลือกที่มีเลขพัสดุสำหรับพิมพ์');
      }
      
      // กำหนดขนาดใบลาเบลตามที่เลือก
      const labelWidthPx = labelSize === '100x100mm' ? '378px' : '378px';
      const labelHeightPx = labelSize === '100x100mm' ? '378px' : '284px';
      
      // สร้าง HTML เริ่มต้น
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>พิมพ์ใบลาเบล - รายการที่เลือก</title>
          <style>
            @page {
              size: ${labelSize};
              margin: 0;
            }
            body { 
              font-family: 'Kanit', sans-serif; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .page {
              width: ${labelWidthPx};
              height: ${labelHeightPx};
              background-color: white;
              margin: 20px auto;
              padding: 0;
              box-shadow: 0 1px 5px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
              page-break-after: always;
            }
            .label-container { 
              width: 100%; 
              height: 100%; 
              box-sizing: border-box;
              padding: ${labelSize === '100x100mm' ? '8mm' : '5mm'};
              position: relative;
            }
            .logo { 
              text-align: center; 
              margin-bottom: ${labelSize === '100x100mm' ? '5mm' : '2mm'}; 
              font-size: ${labelSize === '100x100mm' ? '22px' : '16px'}; 
              font-weight: bold; 
              color: #8A2BE2; 
            }
            .tracking { 
              font-size: ${labelSize === '100x100mm' ? '14px' : '12px'}; 
              text-align: center; 
              margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '2mm'}; 
              padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'}; 
              border: 1px solid #8A2BE2; 
              border-radius: 3px; 
              background-color: #faf6ff;
            }
            .flex-container {
              display: flex;
              ${labelSize === '100x75mm' ? 'margin-top: 2mm;' : ''}
            }
            .flex-column {
              flex: 1;
              ${labelSize === '100x75mm' ? 'padding-right: 2mm;' : ''}
            }
            .section { 
              margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '1.5mm'}; 
            }
            .title { 
              font-weight: bold; 
              margin-bottom: ${labelSize === '100x100mm' ? '1mm' : '0.5mm'}; 
              font-size: ${labelSize === '100x100mm' ? '13px' : '9px'}; 
              color: #555; 
              ${labelSize === '100x75mm' ? 'background-color: #f7f7f7; padding: 1px 3px; border-radius: 2px;' : ''}
            }
            .address { 
              font-size: ${labelSize === '100x100mm' ? '12px' : '9px'}; 
              line-height: ${labelSize === '100x100mm' ? '1.3' : '1.2'}; 
            }
            .compact-address {
              /* สำหรับการแสดงแบบย่อในกรณีลาเบลขนาดเล็ก */
              display: ${labelSize === '100x75mm' ? 'block' : 'none'};
            }
            .normal-address {
              /* สำหรับการแสดงแบบปกติในกรณีลาเบลขนาดใหญ่ */
              display: ${labelSize === '100x100mm' ? 'block' : 'none'};
            }
            .recipient-box {
              ${labelSize === '100x75mm' ? 'border-left: 1px solid #ddd; padding-left: 2mm;' : ''}
            }
            .tracking-number {
              ${labelSize === '100x75mm' ? 'font-size: 14px !important; font-weight: bold; letter-spacing: 1px;' : ''}
              display: ${labelSize === '100x75mm' ? 'inline-block' : 'block'};
              text-align: ${labelSize === '100x75mm' ? 'left' : 'center'};
            }
            .barcode { 
              text-align: center; 
              margin: ${labelSize === '100x100mm' ? '3mm 0' : '1.5mm 0'}; 
              font-size: ${labelSize === '100x100mm' ? '14px' : '12px'}; 
              letter-spacing: 2px;
              background-color: #f9f9f9;
              padding: ${labelSize === '100x100mm' ? '1mm' : '0.5mm'};
              font-family: monospace;
              ${labelSize === '100x75mm' ? 'display: none;' : ''}
            }
            .footer { 
              text-align: center; 
              font-size: ${labelSize === '100x100mm' ? '12px' : '9px'}; 
              margin-top: ${labelSize === '100x100mm' ? '2mm' : '0'};
              color: #666;
              position: ${labelSize === '100x100mm' ? 'relative' : 'absolute'};
              bottom: ${labelSize === '100x100mm' ? 'auto' : '2mm'};
              left: 0;
              right: 0;
              ${labelSize === '100x75mm' ? 'background-color: #fff6f6; padding: 1mm; border-radius: 2px;' : ''}
            }
            .box { 
              border: 1px solid #ddd; 
              padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'};
              border-radius: 2px;
              background-color: #fff;
            }
            .print-button { 
              text-align: center; 
              margin: 20px; 
            }
            .print-button button { 
              padding: 10px 20px; 
              background: #8A2BE2; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
              font-family: 'Kanit', sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .print-button button:hover {
              background: #7B1FA2;
            }
            .label-size-info { 
              text-align: center; 
              margin-bottom: 10px; 
              font-size: 14px; 
              color: #666; 
            }
            .tracking-num {
              font-size: ${labelSize === '100x100mm' ? '18px' : '14px'}; 
              font-weight: bold;
              margin-top: 1mm;
            }
            .cod-badge {
              background-color: #ffe8e8;
              border: 1px solid #ffcccc;
              color: #d32f2f;
              font-weight: bold;
              padding: 1mm 2mm;
              border-radius: 3px;
              display: inline-block;
              margin-left: 2mm;
              font-size: ${labelSize === '100x100mm' ? '11px' : '9px'};
            }
            @media print {
              body { background-color: white; }
              .page { box-shadow: none; margin: 0; }
              .print-button, .label-size-info { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-button">
            <button onclick="window.print();">พิมพ์ใบลาเบล (${ordersToPrint.length} รายการ)</button>
          </div>
          
          <div class="label-size-info">
            ขนาดใบลาเบล: ${labelSize} (${ordersToPrint.length} รายการ)
          </div>
      `);
      
      // เพิ่มใบลาเบลแต่ละรายการ
      ordersToPrint.forEach((order, index) => {
        printWindow.document.write(`
          <div class="page">
            <div class="label-container">
              <div class="logo">PURPLEDASH</div>
              
              <div class="tracking box">
                <div style="font-size: ${labelSize === '100x100mm' ? '12px' : '10px'}; color: #666;">เลขพัสดุ</div>
                <div class="tracking-num">${order.trackingNumber}</div>
              </div>
              
              <div class="section">
                <div class="title">ผู้ส่ง:</div>
                <div class="box address">
                  PURPLEDASH<br />
                  เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
                  ถนนพระราม 4 แขวงลุมพินี<br />
                  เขตปทุมวัน กรุงเทพฯ 10330<br />
                  โทร: 02-123-4567
                </div>
              </div>
              
              <div class="section">
                <div class="title">ผู้รับ:</div>
                <div class="box address">
                  <strong>${order.recipientName || 'ไม่ระบุ'}</strong><br />
                  ${order.recipientAddress || ''} ${order.recipientSubdistrict || ''}<br />
                  ${order.recipientDistrict || ''} ${order.recipientProvince || ''} ${order.recipientZipCode || ''}<br />
                  โทร: ${order.recipientPhone || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div class="barcode box">
                ${order.trackingNumber}
              </div>
              
              <div class="footer">
                ${order.paymentMethod === 'cash_on_delivery' 
                  ? `<span>เก็บเงินปลายทาง: ${formatCurrency(order.total || parseFloat(order.totalAmount || '0'))}</span><span class="cod-badge">COD</span>` 
                  : 'จ่ายเงินแล้ว'}
              </div>
            </div>
          </div>
        `);
      });
      
      // ปิด HTML
      printWindow.document.write(`
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // รอให้หน้าต่างพิมพ์โหลดเสร็จ
      printWindow.addEventListener('load', () => {
        // อัพเดตสถานะการพิมพ์ของแต่ละรายการ
        ordersToPrint.forEach(order => {
          updatePrintStatus(order.id);
        });
      });
      
    } catch (error) {
      console.error('Error printing selected labels:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ใบลาเบลได้',
        variant: 'destructive',
      });
    } finally {
      setIsPrintingLabel(false);
    }
  };
  // ฟังก์ชันเตรียมพิมพ์ใบลาเบล - เปิด Dialog เพื่อเลือกขนาด
  const handlePrintLabelWithSizeDialog = (order: Order) => {
    if (!order.trackingNumber) {
      toast({
        title: 'ไม่สามารถพิมพ์ใบลาเบล',
        description: 'ออเดอร์นี้ยังไม่มีเลขพัสดุ กรุณาสร้างเลขพัสดุก่อน',
        variant: 'destructive',
      });
      return;
    }
    
    // เก็บค่าออเดอร์ที่จะพิมพ์และเปิด Dialog เลือกขนาด
    setOrderToPrint(order);
    setPrintDialogOpen(true);
  };
  
  // ฟังก์ชันสำหรับพิมพ์ใบลาเบลตามขนาดที่เลือก
  // ฟังก์ชันพิมพ์ใบลาเบลตามขนาดที่เลือก (อาจจะเป็นกรณีเลือกรายการเดียว หรือหลายรายการ)
  const printLabelWithSelectedSize = async () => {
    setPrintDialogOpen(false);
    
    // กรณีพิมพ์หลายรายการ
    if (selectedOrders.length > 0) {
      printSelectedLabelsWithSize();
      return;
    }
    
    // กรณีพิมพ์รายการเดียว
    if (!orderToPrint) return;
    
    const order = orderToPrint;
    setCurrentPrintingOrder(order.id);
    setPrintDialogOpen(false);
    
    try {
      // สร้างหน้าต่างใหม่สำหรับพิมพ์
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบการตั้งค่าป้องกันป๊อปอัพ');
      }
      
      // กำหนดขนาดใบลาเบลตามที่เลือกอย่างแม่นยำ
      let labelWidth = '100mm';
      let labelHeight = labelSize === '100x100mm' ? '100mm' : '75mm';
      // กำหนดขนาดสำหรับ CSS ในหน้าพิมพ์
      const labelWidthPx = labelSize === '100x100mm' ? '378px' : '378px';
      const labelHeightPx = labelSize === '100x100mm' ? '378px' : '284px';
      
      // สร้าง HTML สำหรับใบลาเบล
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ใบลาเบลพัสดุ - ${order.orderNumber}</title>
          <style>
            @page {
              size: ${labelSize};
              margin: 0;
            }
            body { 
              font-family: 'Kanit', sans-serif; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .page {
              width: ${labelWidthPx};
              height: ${labelHeightPx};
              background-color: white;
              margin: 10px auto;
              padding: 0;
              box-shadow: 0 1px 5px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
            }
            .label-container { 
              width: 100%; 
              height: 100%; 
              box-sizing: border-box;
              padding: ${labelSize === '100x100mm' ? '8mm' : '6mm'};
              position: relative;
            }
            .logo { 
              text-align: center; 
              margin-bottom: ${labelSize === '100x100mm' ? '5mm' : '3mm'}; 
              font-size: ${labelSize === '100x100mm' ? '22px' : '18px'}; 
              font-weight: bold; 
              color: #8A2BE2; 
            }
            .tracking { 
              font-size: ${labelSize === '100x100mm' ? '14px' : '12px'}; 
              text-align: center; 
              margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '2mm'}; 
              padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'}; 
              border: 1px solid #8A2BE2; 
              border-radius: 3px; 
              background-color: #faf6ff;
            }
            .section { 
              margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '2mm'}; 
            }
            .title { 
              font-weight: bold; 
              margin-bottom: 1mm; 
              font-size: ${labelSize === '100x100mm' ? '13px' : '11px'}; 
              color: #555; 
            }
            .address { 
              font-size: ${labelSize === '100x100mm' ? '12px' : '10px'}; 
              line-height: 1.3; 
            }
            .barcode { 
              text-align: center; 
              margin: ${labelSize === '100x100mm' ? '3mm 0' : '2mm 0'}; 
              font-size: ${labelSize === '100x100mm' ? '14px' : '12px'}; 
              letter-spacing: 2px;
              background-color: #f9f9f9;
              padding: 1mm;
              font-family: monospace;
            }
            .footer { 
              text-align: center; 
              font-size: ${labelSize === '100x100mm' ? '12px' : '10px'}; 
              margin-top: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'};
              color: #666;
              position: ${labelSize === '100x100mm' ? 'relative' : 'absolute'};
              bottom: ${labelSize === '100x100mm' ? 'auto' : '5mm'};
              left: 0;
              right: 0;
            }
            .box { 
              border: 1px solid #ddd; 
              padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'};
              border-radius: 2px;
              background-color: #fff;
            }
            .print-button { 
              text-align: center; 
              margin: 20px; 
            }
            .print-button button { 
              padding: 10px 20px; 
              background: #8A2BE2; 
              color: white; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
              font-family: 'Kanit', sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .print-button button:hover {
              background: #7B1FA2;
            }
            .label-size-info { 
              text-align: center; 
              margin-bottom: 10px; 
              font-size: 14px; 
              color: #666; 
            }
            .tracking-num {
              font-size: ${labelSize === '100x100mm' ? '18px' : '14px'}; 
              font-weight: bold;
              margin-top: 1mm;
            }
            .cod-badge {
              background-color: #ffe8e8;
              border: 1px solid #ffcccc;
              color: #d32f2f;
              font-weight: bold;
              padding: 1mm 2mm;
              border-radius: 3px;
              display: inline-block;
              margin-left: 2mm;
              font-size: ${labelSize === '100x100mm' ? '11px' : '9px'};
            }
            @media print {
              body { background-color: white; }
              .page { box-shadow: none; margin: 0; }
              .print-button, .label-size-info { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-button">
            <button onclick="window.print();">พิมพ์ใบลาเบล</button>
          </div>
          
          <div class="label-size-info">
            ขนาดใบลาเบล: ${labelSize}
          </div>
          
          <div class="page">
            <div class="label-container">
              <div class="logo">PURPLEDASH</div>
              
              <div class="tracking box">
                <div style="font-size: ${labelSize === '100x100mm' ? '12px' : '10px'}; color: #666;">เลขพัสดุ</div>
                <div class="tracking-num">${order.trackingNumber}</div>
              </div>
              
              <div class="section">
                <div class="title">ผู้ส่ง:</div>
                <div class="box address">
                  PURPLEDASH<br />
                  เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
                  ถนนพระราม 4 แขวงลุมพินี<br />
                  เขตปทุมวัน กรุงเทพฯ 10330<br />
                  โทร: 02-123-4567
                </div>
              </div>
              
              <div class="section">
                <div class="title">ผู้รับ:</div>
                <div class="box address">
                  <strong>${order.recipientName || 'ไม่ระบุ'}</strong><br />
                  ${order.recipientAddress || ''} ${order.recipientSubdistrict || ''}<br />
                  ${order.recipientDistrict || ''} ${order.recipientProvince || ''} ${order.recipientZipCode || ''}<br />
                  โทร: ${order.recipientPhone || 'ไม่ระบุ'}
                </div>
              </div>
              
              <div class="barcode box">
                ${order.trackingNumber}
              </div>
              
              <div class="footer">
                ${order.paymentMethod === 'cash_on_delivery' 
                  ? `<span>เก็บเงินปลายทาง: ${formatCurrency(order.total || parseFloat(order.totalAmount || '0'))}</span><span class="cod-badge">COD</span>` 
                  : 'จ่ายเงินแล้ว'}
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // รอให้หน้าต่างพิมพ์โหลดเสร็จ
      printWindow.addEventListener('load', () => {
        // อัพเดตสถานะการพิมพ์
        updatePrintStatus(order.id);
      });
      
    } catch (error) {
      console.error('Error printing label:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถพิมพ์ใบลาเบลได้',
        variant: 'destructive',
      });
      setCurrentPrintingOrder(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายการคำสั่งซื้อทั้งหมด</h1>
            <p className="text-gray-500">จัดการและติดตามคำสั่งซื้อทั้งหมดของคุณได้ที่นี่</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/create-order">
                <Package className="mr-2 h-4 w-4" />
                สร้างคำสั่งซื้อใหม่
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* แท็บสำหรับกรองตามสถานะ */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full md:w-auto grid grid-cols-3 md:grid-cols-6 gap-2">
              <TabsTrigger value="all" className="text-xs md:text-sm">ทั้งหมด</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs md:text-sm">รอดำเนินการ</TabsTrigger>
              <TabsTrigger value="processing" className="text-xs md:text-sm">กำลังจัดการ</TabsTrigger>
              <TabsTrigger value="shipped" className="text-xs md:text-sm">จัดส่งแล้ว</TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs md:text-sm">จัดส่งสำเร็จ</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs md:text-sm">ยกเลิก</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ตัวกรองและค้นหา */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="ค้นหาตามเลขคำสั่งซื้อหรือเลขพัสดุ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full"
                placeholder="วันที่เริ่มต้น"
              />
            </div>
            <div>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full"
                placeholder="วันที่สิ้นสุด"
              />
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setDateRange({start: '', end: ''});
                  setActiveTab('all');
                  setShippingFilter('all');
                }}
                className="w-full"
              >
                รีเซ็ตตัวกรอง
              </Button>
            </div>
          </div>
          
          {/* ปุ่มพิมพ์ใบลาเบลด้านบน */}
          <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <Printer className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium">พิมพ์ใบลาเบลหลายรายการ</span>
                {selectedOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-800">
                    เลือก {selectedOrders.length} รายการ
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAllOrders}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <Check className="h-4 w-4 mr-1" />
                  เลือกทั้งหมดที่มีเลขพัสดุ
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllSelections}
                  className="border-gray-300"
                  disabled={selectedOrders.length === 0}
                >
                  <X className="h-4 w-4 mr-1" />
                  ยกเลิกการเลือก
                </Button>
                
                <Button 
                  onClick={() => {
                    // ถ้ามีออเดอร์ที่ถูกเลือก ให้เปิด Dialog เลือกขนาด
                    if (selectedOrders.length > 0) {
                      // เลือกออเดอร์แรกเพื่อบันทึกเป็นค่าอ้างอิง (ใช้สำหรับตั้งค่าการพิมพ์เท่านั้น)
                      const firstSelectedOrder = orders.find(order => selectedOrders.includes(order.id));
                      if (firstSelectedOrder) {
                        // บันทึกออเดอร์และเปิด Dialog
                        setOrderToPrint(firstSelectedOrder);
                        setPrintDialogOpen(true);
                      }
                    }
                  }}
                  disabled={selectedOrders.length === 0 || isPrintingLabel}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isPrintingLabel ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      กำลังพิมพ์...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-1" />
                      พิมพ์ใบลาเบล ({selectedOrders.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* กรองตามบริษัทขนส่ง */}
          {availableShippingMethods.length > 0 && (
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="font-medium text-gray-700 flex items-center">
                <Truck className="h-4 w-4 mr-2 text-purple-600" />
                กรองตามบริษัทขนส่ง:
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={shippingFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setShippingFilter('all')}
                  className={shippingFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  ทั้งหมด
                </Button>
                {availableShippingMethods.map(method => (
                  <Button 
                    key={method}
                    variant={shippingFilter === method ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setShippingFilter(method)}
                    className={shippingFilter === method ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {method === 'Flash Express' ? (
                      <span className="flex items-center">
                        <Truck className="h-4 w-4 mr-1 text-purple-500" />
                        {method}
                      </span>
                    ) : method}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* ตารางคำสั่งซื้อ */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">ไม่พบคำสั่งซื้อ</h3>
              <p className="text-gray-500 mt-1">ยังไม่มีคำสั่งซื้อตามเงื่อนไขที่คุณค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.filter(o => o.trackingNumber).length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllOrders();
                          } else {
                            clearAllSelections();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort('orderNumber')}>
                      <div className="flex items-center">
                        เลขคำสั่งซื้อ
                        {sortConfig.key === 'orderNumber' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('total')}>
                      <div className="flex items-center justify-end">
                        ยอดรวม
                        {sortConfig.key === 'total' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        จำนวนรายการ
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center">
                        วันที่
                        {sortConfig.key === 'date' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('paymentMethod')}>
                      <div className="flex items-center">
                        วิธีชำระเงิน
                        {sortConfig.key === 'paymentMethod' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('trackingNumber')}>
                      <div className="flex items-center">
                        เลขพัสดุ
                        {sortConfig.key === 'trackingNumber' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center">
                        สถานะ
                        {sortConfig.key === 'status' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        สถานะการพิมพ์
                      </div>
                    </TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="w-[50px]">
                        {order.trackingNumber && (
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2">{order.orderNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{order.total !== undefined ? formatCurrency(order.total) : formatCurrency(parseFloat(order.totalAmount || "0"))}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Package className="h-4 w-4 text-purple-500 mr-1" />
                          <div className="font-medium">
                            <span className="text-purple-700">{order.items || 0}</span>
                            <span className="text-gray-600"> รายการ</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.date)}</TableCell>
                      <TableCell>
                        {formatPaymentMethod(order.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 text-purple-500 mr-1" />
                            <span className="font-medium text-purple-700">{order.trackingNumber}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">ไม่มีเลขพัสดุ</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {getPrintStatus(order.isPrinted)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/order-detail/${order.id}`}>
                              รายละเอียด
                            </Link>
                          </Button>
                          {order.trackingNumber && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                              disabled={currentPrintingOrder === order.id || isPrintingLabel}
                              onClick={() => handlePrintLabelWithSizeDialog(order)}
                            >
                              {currentPrintingOrder === order.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Printer className="h-3 w-3 mr-1" />
                              )}
                              พิมพ์ใบลาเบล
                            </Button>
                          )}
                          {order.status === 'pending' && (
                            <Button variant="outline" size="sm" className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100" asChild>
                              <Link href={`/update-order/${order.id}`}>
                                แก้ไข
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {/* Dialog เลือกขนาดใบลาเบล */}
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
              className={`p-4 rounded-lg border-2 cursor-pointer ${labelSize === '100x100mm' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
              onClick={() => setLabelSize('100x100mm')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">ใบลาเบลขนาด 100x100mm</h3>
                  <p className="text-sm text-gray-500">ขนาดมาตรฐาน เหมาะสำหรับพัสดุทั่วไป</p>
                </div>
                <div className="w-16 h-16 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <div className="w-10 h-10 bg-purple-100 rounded"></div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer ${labelSize === '100x75mm' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
              onClick={() => setLabelSize('100x75mm')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">ใบลาเบลขนาด 100x75mm</h3>
                  <p className="text-sm text-gray-500">ขนาดเล็กกว่า ประหยัดกระดาษ</p>
                </div>
                <div className="w-16 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                  <div className="w-10 h-7 bg-purple-100 rounded"></div>
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
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์ใบลาเบล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrderList;