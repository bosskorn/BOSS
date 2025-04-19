import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Search, Filter, ChevronDown, ChevronUp, FileText, Truck, Package, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

// อินเทอร์เฟซสำหรับข้อมูลคำสั่งซื้อ
interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingMethod: string;
  items: number;
  trackingNumber?: string;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{key: keyof Order, direction: 'asc' | 'desc'}>({
    key: 'date',
    direction: 'desc'
  });
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });

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

  // เรียกข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchOrders();
  }, []);

  // กรองข้อมูลเมื่อแท็บเปลี่ยน หรือค้นหา หรือช่วงวันที่เปลี่ยน
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
        order.customerName.toLowerCase().includes(searchTermLower) ||
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
    
    // จัดเรียงข้อมูล
    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a[sortConfig.key]).getTime();
        const dateB = new Date(b[sortConfig.key]).getTime();
        
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === 'total') {
        return sortConfig.direction === 'asc' 
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
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
  }, [orders, activeTab, searchTerm, dateRange, sortConfig]);

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

  // ฟังก์ชันฟอร์แมตเลขเป็นรูปแบบเงินบาท
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ฟังก์ชันฟอร์แมตวันที่เป็นรูปแบบวันที่ไทย
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('th-TH', options);
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
                placeholder="ค้นหาตามเลขคำสั่งซื้อ, ชื่อลูกค้า, เลขพัสดุ"
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
                }}
                className="w-full"
              >
                รีเซ็ตตัวกรอง
              </Button>
            </div>
          </div>

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
                    <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort('orderNumber')}>
                      <div className="flex items-center">
                        เลขคำสั่งซื้อ
                        {sortConfig.key === 'orderNumber' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('customerName')}>
                      <div className="flex items-center">
                        ชื่อลูกค้า
                        {sortConfig.key === 'customerName' && (
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
                        รายการ
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
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className="ml-2">{order.orderNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-center">{order.items}</TableCell>
                      <TableCell>{formatDate(order.date)}</TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/order-detail/${order.id}`}>
                              รายละเอียด
                            </Link>
                          </Button>
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
    </Layout>
  );
};

export default OrderList;