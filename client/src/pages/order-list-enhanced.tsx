import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import JsBarcode from 'jsbarcode';
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
  Square,
  Trash
} from 'lucide-react';

// ฟังก์ชันสร้างบาร์โค้ด Code128 สำหรับเลขพัสดุ
function generateJSBarcode(trackingNumber: string): void {
  if (!trackingNumber) return;
  
  setTimeout(() => {
    try {
      // หลังจากหน้าพิมพ์โหลดเสร็จ ค้นหา element ที่มี class barcode-element
      const barcodeElements = document.querySelectorAll('.barcode-element');
      
      if (barcodeElements.length > 0) {
        barcodeElements.forEach((element) => {
          if (element.getAttribute('data-tracking') === trackingNumber) {
            JsBarcode(element, trackingNumber, {
              format: "CODE128",
              lineColor: "#000",
              width: 1.5,
              height: 30,
              displayValue: false,
              margin: 0
            });
          }
        });
        console.log(`Generated ${barcodeElements.length} barcodes for tracking ${trackingNumber}`);
      } else {
        console.warn('No barcode elements found');
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  }, 100);
}

// ฟังก์ชันสร้างบาร์โค้ด HTML
function generateBarcode(trackingNumber: string): string {
  if (!trackingNumber) return '';
  
  return `
    <div style="text-align: center; padding:1px;">
      <svg class="barcode-element" data-tracking="${trackingNumber}" style="width:100%; max-width:180px; height:30px;"></svg>
      <div style="font-family: monospace; letter-spacing: 1px; font-size: 9px; margin-top:2px;">${trackingNumber}</div>
    </div>
  `;
}
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
  const [shippingDialogOpen, setShippingDialogOpen] = useState<boolean>(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [orderToCreateTracking, setOrderToCreateTracking] = useState<number | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('เสี่ยวไป๋ เอ็กเพรส - ส่งด่วน');
  

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
    
    // เพิ่มขนส่งจำลองเป็นตัวเลือกเริ่มต้นเสมอ (แทน Flash Express)
    // เพื่อให้สามารถกรองได้ทันที แม้ไม่มีข้อมูลขนส่งในออร์เดอร์
    setAvailableShippingMethods(prev => {
      // เพิ่มรายชื่อขนส่งที่จำลองทั้งหมด
      const mockCouriers = [
        'เสี่ยวไป๋ เอ็กเพรส',
        'SpeedLine',
        'ThaiStar Delivery',
        'J&T Express', 
        'Kerry Express',
        'ไปรษณีย์ไทย',
        'DHL Express',
        'Ninja Van'
      ];
      
      // สร้างรายการใหม่ที่รวมขนส่งทั้งหมด
      let newCouriers = [...prev];
      mockCouriers.forEach(courier => {
        if (!newCouriers.includes(courier)) {
          newCouriers.push(courier);
        }
      });
      
      return newCouriers;
    });
    
    // ไม่มีการ cleanup ที่จำเป็น จึงไม่ต้องคืนค่าอะไร
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
      // แสดงผลเฉพาะออเดอร์ที่มี shippingMethod ตรงกับตัวกรอง
      // ถ้าไม่มีข้อมูลใน database ให้แสดงผลสาธิตเมื่อเลือกบริษัทขนส่งในกลุ่มที่เพิ่มเข้ามาใหม่
      const mockCouriers = [
        'เสี่ยวไป๋ เอ็กเพรส', 
        'SpeedLine', 
        'ThaiStar Delivery', 
        'J&T Express', 
        'Kerry Express', 
        'ไปรษณีย์ไทย', 
        'DHL Express', 
        'Ninja Van'
      ];
      
      if (mockCouriers.includes(shippingFilter) && !result.some(order => order.shippingMethod === shippingFilter)) {
        // สร้างข้อมูลตัวอย่างสำหรับการแสดงผล (ไม่ได้บันทึกลงฐานข้อมูล)
        const demoOrder = orders[0] ? {...orders[0]} : null;
        
        if (demoOrder) {
          // สร้างข้อมูลสาธิตจากข้อมูลจริงที่มีอยู่แล้ว
          demoOrder.id = -1; // ID ที่ไม่มีในฐานข้อมูลจริง
          demoOrder.orderNumber = `DEMO-${shippingFilter.substring(0, 3).toUpperCase()}`;
          demoOrder.shippingMethod = shippingFilter;
          demoOrder.trackingNumber = `DEMO${Math.floor(Math.random() * 10000000)}TH`;
          demoOrder.status = 'processing';
          demoOrder.date = new Date().toISOString(); // ใส่วันที่ปัจจุบัน
          
          // แสดงผลแบบสาธิต
          result = [demoOrder];
        }
      }
      
      // กรณีปกติ กรองตามค่า shippingMethod
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
        return <Truck className="h-4 w-4 text-blue-500" />;
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
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">จัดส่งแล้ว</Badge>;
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
            .print-button button { padding: 10px 20px; background: #0078D7; color: white; border: none; border-radius: 5px; cursor: pointer; }
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
            <div class="logo">BLUEDASH</div>
            
            <div class="tracking box">
              <div>เลขพัสดุ</div>
              <div style="font-size: 20px; font-weight: bold;">${order.trackingNumber}</div>
            </div>
            
            <div class="section">
              <div class="title">ผู้ส่ง:</div>
              <div class="box address">
                BLUEDASH<br />
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
      
      // เรียก API เพื่อสร้างเลขพัสดุ
      const response = await fetch(`/api/orders/${orderToCreateTracking}/tracking`, {
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

  // ฟังก์ชันสำหรับลบออเดอร์
  const handleDeleteOrder = async (orderId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'ลบออเดอร์สำเร็จ',
          description: `ออเดอร์หมายเลข ${orderId} ถูกลบออกจากระบบแล้ว`,
          variant: 'default',
        });
        
        // อัปเดตรายการออเดอร์หลังจากลบสำเร็จ
        setOrders(orders.filter(order => order.id !== orderId));
        setFilteredOrders(filteredOrders.filter(order => order.id !== orderId));
      } else {
        throw new Error(data.message || 'ไม่สามารถลบออเดอร์ได้');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลบออเดอร์ได้',
        variant: 'destructive',
      });
    }
  };
  
  // ฟังก์ชันสำหรับลบออเดอร์หลายรายการที่เลือก
  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'ไม่มีรายการที่เลือก',
        description: 'กรุณาเลือกรายการที่ต้องการลบ',
        variant: 'destructive',
      });
      return;
    }
    
    // ขอการยืนยันจากผู้ใช้ก่อนลบ
    const confirmed = window.confirm(`คุณต้องการลบออเดอร์ที่เลือกจำนวน ${selectedOrders.length} รายการใช่หรือไม่?`);
    
    if (!confirmed) return;
    
    // สร้างตัวแปรเพื่อติดตามความสำเร็จและความล้มเหลว
    let successCount = 0;
    let failCount = 0;
    
    // แสดง toast แจ้งเตือนว่ากำลังลบ
    toast({
      title: 'กำลังลบรายการที่เลือก',
      description: `กำลังลบออเดอร์ ${selectedOrders.length} รายการ`,
      variant: 'default',
    });
    
    // ทำ Promise.all เพื่อส่งคำขอหลายรายการพร้อมกัน
    await Promise.all(selectedOrders.map(async (orderId) => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to delete order ${orderId}:`, data.message || 'Unknown error');
        }
      } catch (error) {
        failCount++;
        console.error(`Error deleting order ${orderId}:`, error);
      }
    }));
    
    // อัปเดตรายการออเดอร์เมื่อลบเสร็จสิ้น
    if (successCount > 0) {
      // อัปเดตรายการออเดอร์ โดยกรองออเดอร์ที่เลือกออก
      setOrders(orders.filter(order => !selectedOrders.includes(order.id)));
      setFilteredOrders(filteredOrders.filter(order => !selectedOrders.includes(order.id)));
      
      // ล้างรายการที่เลือก
      setSelectedOrders([]);
      
      // แสดงผลสรุปการลบ
      toast({
        title: 'ลบออเดอร์เสร็จสิ้น',
        description: failCount > 0 
          ? `ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ` 
          : `ลบสำเร็จทั้งหมด ${successCount} รายการ`,
        variant: 'default',
      });
    } else if (failCount > 0) {
      toast({
        title: 'ลบออเดอร์ล้มเหลว',
        description: 'ไม่สามารถลบออเดอร์ที่เลือกได้ โปรดลองอีกครั้ง',
        variant: 'destructive',
      });
    }
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
              color: #0078D7; 
            }
            .tracking { 
              font-size: ${labelSize === '100x100mm' ? '14px' : '12px'}; 
              text-align: center; 
              margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '2mm'}; 
              padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'}; 
              border: 1px solid #0078D7; 
              border-radius: 3px; 
              background-color: #f0f9ff;
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
            }
            .barcode-small {
              margin-top: 1mm;
              text-align: center;
              background-color: #f9f9f9;
              padding: 2mm 0;
              border-radius: 2px;
              border: 1px solid #ddd;
            }
            .barcode-line {
              display: inline-block;
              width: 1px;
              height: 15px;
              background-color: #000;
              margin: 0 0.5px;
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
              <div class="logo">BLUEDASH</div>
              
              <div class="tracking box">
                <div style="font-size: ${labelSize === '100x100mm' ? '12px' : '10px'}; color: #666;">เลขพัสดุ</div>
                <div class="tracking-num">${order.trackingNumber}</div>
              </div>
              
              <div class="section">
                <div class="title">ผู้ส่ง:</div>
                <div class="box address">
                  BLUEDASH<br />
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
            .barcode-line {
              display: inline-block;
              width: 1px;
              height: 15px;
              background-color: #000;
              margin: 0 0.5px;
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
              color: #0078D7; 
            }
            .tracking { 
              font-size: ${labelSize === '100x100mm' ? '14px' : '12px'}; 
              text-align: center; 
              margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '2mm'}; 
              padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'}; 
              border: 1px solid #0078D7; 
              border-radius: 3px; 
              background-color: #f0f9ff;
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
            .barcode-small {
              text-align: center;
              margin: 2mm 0;
              background-color: #f9f9f9;
              padding: 2mm 0;
              border-radius: 3px;
              border: 1px solid #ddd;
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
              <div class="logo">BLUEDASH</div>
              
              ${labelSize === '100x100mm' ? `
              <!-- สำหรับขนาด 100x100mm -->
              <div class="tracking box">
                <div style="font-size: 12px; color: #666;">เลขพัสดุ</div>
                <div class="tracking-num">${order.trackingNumber}</div>
              </div>
              
              <div class="section">
                <div class="title">ผู้ส่ง:</div>
                <div class="box address">
                  BLUEDASH<br />
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
              ` : `
              <!-- สำหรับขนาด 100x75mm - แบบใหม่แบ่งเป็น 2 คอลัมน์ -->
              <div class="tracking box" style="margin-bottom: 2mm;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 9px; color: #666;">เลขพัสดุ</div>
                    <div class="tracking-num" style="font-size: 13px; letter-spacing: 0.5px;">${order.trackingNumber}</div>
                  </div>
                  <div class="cod-badge" style="${order.paymentMethod === 'cash_on_delivery' ? '' : 'display: none;'}">
                    COD
                  </div>
                </div>
              </div>
              
              <div style="display: flex; margin-top: 2mm;">
                <div style="flex: 1; padding-right: 2mm;">
                  <div class="title" style="font-size: 9px; background-color: #f7f7f7; padding: 1px 3px; border-radius: 2px;">ผู้ส่ง</div>
                  <div class="box address" style="font-size: 8px; height: 23mm;">
                    <strong>BLUEDASH</strong><br />
                    เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
                    ถนนพระราม 4 แขวงลุมพินี<br />
                    เขตปทุมวัน กรุงเทพฯ 10330<br />
                    โทร: 02-123-4567
                  </div>
                </div>
                
                <div style="flex: 1; border-left: 1px solid #ddd; padding-left: 2mm;">
                  <div class="title" style="font-size: 9px; background-color: #f7f7f7; padding: 1px 3px; border-radius: 2px;">ผู้รับ</div>
                  <div class="box address" style="font-size: 8px; height: 23mm;">
                    <strong>${order.recipientName || 'ไม่ระบุ'}</strong><br />
                    ${order.recipientAddress || ''} ${order.recipientSubdistrict || ''}<br />
                    ${order.recipientDistrict || ''} ${order.recipientProvince || ''}<br /> 
                    ${order.recipientZipCode || ''}<br />
                    โทร: ${order.recipientPhone || 'ไม่ระบุ'}
                  </div>
                </div>
              </div>
              
              <div class="barcode-small">
                <div style="font-size: 9px; color: #666; margin-bottom: 3px;">บาร์โค้ด</div>
                <div style="text-align: center;">
                  ${generateBarcode(order.trackingNumber || '')}
                </div>
                <div style="text-align: center; font-size: 9px; margin-top: 3px;">
                  ${order.trackingNumber}
                </div>
              </div>
              `}
              
              <div class="footer" style="${labelSize === '100x75mm' ? 'background-color: #fff6f6; padding: 1mm; border-radius: 2px;' : ''}">
                ${order.paymentMethod === 'cash_on_delivery' 
                  ? `<span>เก็บเงินปลายทาง: ${formatCurrency(order.total || parseFloat(order.totalAmount || '0'))}</span>${labelSize === '100x100mm' ? '<span class="cod-badge">COD</span>' : ''}` 
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
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteSelectedOrders}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={selectedOrders.length === 0}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  ลบรายการที่เลือก
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
                <Truck className="h-4 w-4 mr-2 text-blue-600" />
                กรองตามบริษัทขนส่ง:
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={shippingFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setShippingFilter('all')}
                  className={shippingFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  ทั้งหมด
                </Button>
                {availableShippingMethods.map(method => (
                  <Button 
                    key={method}
                    variant={shippingFilter === method ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setShippingFilter(method)}
                    className={shippingFilter === method ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {[
                      'เสี่ยวไป๋ เอ็กเพรส', 
                      'SpeedLine', 
                      'ThaiStar Delivery', 
                      'J&T Express', 
                      'Kerry Express', 
                      'ไปรษณีย์ไทย', 
                      'DHL Express', 
                      'Ninja Van',
                      'Flash Express'
                    ].includes(method) ? (
                      <span className="flex items-center">
                        <Truck className="h-4 w-4 mr-1 text-blue-500" />
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
                          <Package className="h-4 w-4 text-blue-500 mr-1" />
                          <div className="font-medium">
                            <span className="text-blue-700">{order.items || 0}</span>
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
                            <Truck className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="font-medium text-blue-700">{order.trackingNumber}</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">ไม่มีเลขพัสดุ</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 text-xs h-6 px-2"
                              onClick={() => openShippingDialog(order.id)}
                            >
                              เลือกขนส่ง
                            </Button>
                          </div>
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
                            <>
                              <Button variant="outline" size="sm" className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100" asChild>
                                <Link href={`/update-order/${order.id}`}>
                                  แก้ไข
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                onClick={() => {
                                  if (window.confirm(`คุณต้องการลบออเดอร์ ${order.orderNumber} ใช่หรือไม่?`)) {
                                    handleDeleteOrder(order.id);
                                  }
                                }}
                              >
                                <Trash className="h-3 w-3 mr-1" />
                                ลบ
                              </Button>
                            </>
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
      
      {/* Dialog เลือกขนส่ง */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกบริษัทขนส่ง</DialogTitle>
            <DialogDescription>
              เลือกบริษัทขนส่งเพื่อสร้างเลขพัสดุสำหรับออเดอร์นี้
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {/* ส่วนเลือกขนส่ง */}
            <div className="space-y-4">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส - ส่งด่วน' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedShippingMethod('เสี่ยวไป๋ เอ็กเพรส - ส่งด่วน')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">เสี่ยวไป๋ เอ็กเพรส - ส่งด่วน</h3>
                    <p className="text-sm text-gray-500">จัดส่งภายใน 1-2 วัน</p>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                    <Truck className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${selectedShippingMethod === 'เสี่ยวไป๋ เอ็กเพรส - ประหยัด' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedShippingMethod('เสี่ยวไป๋ เอ็กเพรส - ประหยัด')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">เสี่ยวไป๋ เอ็กเพรส - ประหยัด</h3>
                    <p className="text-sm text-gray-500">จัดส่งภายใน 3-5 วัน ราคาประหยัด</p>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                    <Truck className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${selectedShippingMethod === 'ไปรษณีย์ไทย - EMS' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedShippingMethod('ไปรษณีย์ไทย - EMS')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">ไปรษณีย์ไทย - EMS</h3>
                    <p className="text-sm text-gray-500">จัดส่งภายใน 1-2 วัน ทั่วประเทศ</p>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                    <Truck className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer ${selectedShippingMethod === 'Kerry Express' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedShippingMethod('Kerry Express')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Kerry Express</h3>
                    <p className="text-sm text-gray-500">จัดส่งรวดเร็ว พื้นที่ในเมืองเป็นหลัก</p>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-300 flex items-center justify-center rounded-md">
                    <Truck className="h-6 w-6 text-purple-500" />
                  </div>
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
            >
              <Check className="h-4 w-4 mr-2" />
              ยืนยันการเลือก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrderList;