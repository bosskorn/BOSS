import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Loader2, Search, Filter, ChevronDown, ChevronUp, Truck, Package, ExternalLink, MoreHorizontal, Copy, Copy as CopyIcon, CheckCircle, AlertCircle, CreditCard, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

// อินเทอร์เฟซสำหรับข้อมูลพัสดุ
interface Shipment {
  id: number;
  orderNumber: string;
  trackingNumber: string;
  customerName: string;
  customerPhone?: string;
  shippingMethod: string;
  carrier: string;
  status: 'pending' | 'processing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
  createdAt: string;
  deliveredAt?: string;
  origin: {
    province: string;
    district: string;
  };
  destination: {
    province: string;
    district: string;
  };
  weight: number;
  cod?: {
    amount: number;
    status: 'pending' | 'collected' | 'transferred' | 'cancelled';
  };
  estimatedDelivery?: string;
  trackingUrl?: string;
  orderItems: number;
}

const ShipmentList: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{key: keyof Shipment, direction: 'asc' | 'desc'}>({
    key: 'createdAt',
    direction: 'desc'
  });
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ฟังก์ชันเรียกข้อมูลพัสดุจาก API
  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shipments', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setShipments(data.data);
        setFilteredShipments(data.data);
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลพัสดุได้');
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลพัสดุได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสร้างพัสดุใหม่ (Flash Express API)
  const createShipment = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/ship`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'ดำเนินการสำเร็จ',
          description: data.message || 'สร้างพัสดุสำเร็จ',
          variant: 'default',
        });
        
        // โหลดข้อมูลใหม่
        fetchShipments();
      } else {
        throw new Error(data.message || 'ไม่สามารถสร้างพัสดุได้');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถสร้างพัสดุได้',
        variant: 'destructive',
      });
    }
  };

  // ฟังก์ชันเรียกข้อมูลสถานะล่าสุดจาก Flash Express API
  const updateTrackingStatus = async (trackingNumber: string) => {
    try {
      const response = await fetch(`/api/shipments/${trackingNumber}/update-status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'อัปเดตสถานะสำเร็จ',
          description: data.message || 'อัปเดตสถานะพัสดุสำเร็จ',
          variant: 'default',
        });
        
        // โหลดข้อมูลใหม่
        fetchShipments();
      } else {
        throw new Error(data.message || 'ไม่สามารถอัปเดตสถานะพัสดุได้');
      }
    } catch (error) {
      console.error('Error updating tracking status:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะพัสดุได้',
        variant: 'destructive',
      });
    }
  };

  // ฟังก์ชันคัดลอกเลข Tracking Number ไปยัง Clipboard
  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber)
      .then(() => {
        toast({
          title: 'คัดลอกสำเร็จ',
          description: 'คัดลอกเลขพัสดุไปยังคลิปบอร์ดเรียบร้อยแล้ว',
          variant: 'default',
        });
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'คัดลอกไม่สำเร็จ',
          description: 'ไม่สามารถคัดลอกเลขพัสดุได้',
          variant: 'destructive',
        });
      });
  };

  // เรียกข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    fetchShipments();
  }, []);

  // กรองข้อมูลเมื่อค่าตัวกรองเปลี่ยน
  useEffect(() => {
    let result = [...shipments];
    
    // กรองตามสถานะ
    if (statusFilter !== 'all') {
      result = result.filter(shipment => shipment.status === statusFilter);
    }
    
    // กรองตามผู้ให้บริการขนส่ง
    if (selectedCarrier !== 'all') {
      result = result.filter(shipment => shipment.carrier === selectedCarrier);
    }
    
    // กรองตามข้อความค้นหา
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(shipment => 
        shipment.orderNumber.toLowerCase().includes(searchTermLower) ||
        shipment.trackingNumber.toLowerCase().includes(searchTermLower) ||
        shipment.customerName.toLowerCase().includes(searchTermLower) ||
        (shipment.customerPhone && shipment.customerPhone.includes(searchTerm))
      );
    }
    
    // กรองตามช่วงวันที่
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // ตั้งค่าให้เป็นสิ้นสุดของวัน
      
      result = result.filter(shipment => {
        const shipmentDate = new Date(shipment.createdAt);
        return shipmentDate >= startDate && shipmentDate <= endDate;
      });
    }
    
    // จัดเรียงข้อมูล
    result.sort((a, b) => {
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'deliveredAt') {
        const dateA = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
        const dateB = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
        
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === 'weight' || (sortConfig.key === 'cod' && a.cod && b.cod)) {
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
    
    setFilteredShipments(result);
  }, [shipments, searchTerm, dateRange, selectedCarrier, statusFilter, sortConfig]);

  // ฟังก์ชันจัดการการคลิกหัวตาราง เพื่อเรียงลำดับ
  const handleSort = (key: keyof Shipment) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // แปลงสถานะเป็นข้อความภาษาไทย
  const getStatusText = (status: Shipment['status']) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'processing': return 'กำลังจัดการ';
      case 'picked_up': return 'รับพัสดุแล้ว';
      case 'in_transit': return 'อยู่ระหว่างขนส่ง';
      case 'out_for_delivery': return 'กำลังนำส่ง';
      case 'delivered': return 'จัดส่งสำเร็จ';
      case 'cancelled': return 'ยกเลิก';
      case 'failed': return 'ส่งไม่สำเร็จ';
      default: return 'ไม่ระบุ';
    }
  };

  // สร้าง Badge สำหรับสถานะ
  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">รอดำเนินการ</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">กำลังจัดการ</Badge>;
      case 'picked_up':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">รับพัสดุแล้ว</Badge>;
      case 'in_transit':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">อยู่ระหว่างขนส่ง</Badge>;
      case 'out_for_delivery':
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-200">กำลังนำส่ง</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">จัดส่งสำเร็จ</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">ยกเลิก</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">ส่งไม่สำเร็จ</Badge>;
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
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
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
            <h1 className="text-2xl font-bold text-gray-900">รายการพัสดุทั้งหมด</h1>
            <p className="text-gray-500">จัดการและติดตามพัสดุทั้งหมดของคุณได้ที่นี่</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/create-shipment">
                <Truck className="mr-2 h-4 w-4" />
                สร้างพัสดุใหม่
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* ตัวกรองและค้นหา */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="ค้นหาตามเลขคำสั่งซื้อ, เลขพัสดุ, ชื่อลูกค้า"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="กรองตามสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="processing">กำลังจัดการ</SelectItem>
                  <SelectItem value="picked_up">รับพัสดุแล้ว</SelectItem>
                  <SelectItem value="in_transit">อยู่ระหว่างขนส่ง</SelectItem>
                  <SelectItem value="out_for_delivery">กำลังนำส่ง</SelectItem>
                  <SelectItem value="delivered">จัดส่งสำเร็จ</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  <SelectItem value="failed">ส่งไม่สำเร็จ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ผู้ให้บริการขนส่ง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกผู้ให้บริการ</SelectItem>
                  <SelectItem value="flash_express">Flash Express</SelectItem>
                  <SelectItem value="thailand_post">ไปรษณีย์ไทย</SelectItem>
                  <SelectItem value="kerry_express">Kerry Express</SelectItem>
                  <SelectItem value="j&t_express">J&T Express</SelectItem>
                </SelectContent>
              </Select>
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
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setDateRange({start: '', end: ''});
                  setSelectedCarrier('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                รีเซ็ตตัวกรอง
              </Button>
            </div>
          </div>

          {/* ตารางพัสดุ */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-700">ไม่พบพัสดุ</h3>
              <p className="text-gray-500 mt-1">ยังไม่มีพัสดุตามเงื่อนไขที่คุณค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort('trackingNumber')}>
                      <div className="flex items-center">
                        เลขพัสดุ
                        {sortConfig.key === 'trackingNumber' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('orderNumber')}>
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
                    <TableHead className="cursor-pointer" onClick={() => handleSort('carrier')}>
                      <div className="flex items-center">
                        ผู้ให้บริการ
                        {sortConfig.key === 'carrier' && (
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
                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center">
                        วันที่สร้าง
                        {sortConfig.key === 'createdAt' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span className="mr-2">{shipment.trackingNumber}</span>
                          <button 
                            onClick={() => copyTrackingNumber(shipment.trackingNumber)}
                            className="text-gray-400 hover:text-gray-600"
                            title="คัดลอกเลขพัสดุ"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/order-detail/${shipment.id}`} className="text-purple-600 hover:underline">
                          {shipment.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{shipment.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {shipment.carrier === 'flash_express' ? (
                            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-600">
                              Flash Express
                            </Badge>
                          ) : shipment.carrier === 'thailand_post' ? (
                            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-600">
                              ไปรษณีย์ไทย
                            </Badge>
                          ) : shipment.carrier === 'kerry_express' ? (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-600">
                              Kerry Express
                            </Badge>
                          ) : shipment.carrier === 'j&t_express' ? (
                            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-600">
                              J&T Express
                            </Badge>
                          ) : (
                            <Badge variant="outline">{shipment.carrier}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">เปิดเมนู</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <Link href={`/shipment-detail/${shipment.id}`} className="cursor-pointer">
                                  <Package className="mr-2 h-4 w-4" />
                                  <span>ดูรายละเอียด</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              {shipment.trackingUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    <span>ติดตามพัสดุ</span>
                                  </a>
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem onClick={() => updateTrackingStatus(shipment.trackingNumber)}>
                                <Truck className="mr-2 h-4 w-4" />
                                <span>อัปเดตสถานะ</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => copyTrackingNumber(shipment.trackingNumber)}>
                                <Copy className="mr-2 h-4 w-4" />
                                <span>คัดลอกเลขพัสดุ</span>
                              </DropdownMenuItem>
                              
                              {shipment.cod && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/cod-detail/${shipment.id}`} className="cursor-pointer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>ดูรายละเอียด COD</span>
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem asChild>
                                <Link href={`/print-label/${shipment.id}`} className="cursor-pointer">
                                  <Printer className="mr-2 h-4 w-4" />
                                  <span>พิมพ์ใบปะหน้าพัสดุ</span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* สรุปพัสดุแยกตามสถานะ */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">ทั้งหมด</p>
                  <p className="text-2xl font-bold">{shipments.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">อยู่ระหว่างขนส่ง</p>
                  <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'in_transit' || s.status === 'picked_up').length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">จัดส่งสำเร็จ</p>
                  <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'delivered').length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">มีปัญหา</p>
                  <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'failed' || s.status === 'cancelled').length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ShipmentList;