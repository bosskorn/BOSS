import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  FileDown,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const ReportsReturns: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: '',
    end: ''
  });
  const [reason, setReason] = useState<string>('all');
  const [courier, setCourier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [reportData, setReportData] = useState({
    returnTrendData: [],
    returnReasonData: [],
    returnCourierData: [],
    returnAreaData: [],
    returnAvgTimeData: [],
    returnsList: []
  });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reports/returns?period=${period}`;
      
      if (dateRange.start && dateRange.end) {
        url += `&start=${dateRange.start}&end=${dateRange.end}`;
      }
      
      if (reason !== 'all') {
        url += `&reason=${reason}`;
      }
      
      if (courier !== 'all') {
        url += `&courier=${courier}`;
      }
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลรายงานพัสดุตีกลับได้');
      }
    } catch (error) {
      console.error('Error fetching returns report data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลรายงานพัสดุตีกลับได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReportData();
  };

  const handleExport = (format: string) => {
    toast({
      title: 'กำลังส่งออกรายงาน',
      description: `กำลังส่งออกรายงานพัสดุตีกลับในรูปแบบ ${format.toUpperCase()}`,
    });
    
    // ในการใช้งานจริง จะต้องเรียก API เพื่อส่งออกรายงาน
    setTimeout(() => {
      toast({
        title: 'ส่งออกรายงานสำเร็จ',
        description: 'รายงานถูกดาวน์โหลดเรียบร้อยแล้ว',
        variant: 'default',
      });
    }, 1500);
  };

  // คำอธิบายสาเหตุการตีกลับ
  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'address_not_found':
        return 'ที่อยู่ไม่ถูกต้อง';
      case 'customer_refused':
        return 'ลูกค้าปฏิเสธรับพัสดุ';
      case 'customer_not_available':
        return 'ไม่พบผู้รับ';
      case 'wrong_item':
        return 'สินค้าไม่ตรงตามสั่ง';
      case 'damaged':
        return 'สินค้าเสียหาย';
      case 'payment_issue':
        return 'ปัญหาการชำระเงิน';
      case 'other':
        return 'อื่นๆ';
      default:
        return reason;
    }
  };

  // สีของแต่ละสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // สถานะการจัดการพัสดุตีกลับ
  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'จัดการแล้ว';
      case 'processing':
        return 'กำลังดำเนินการ';
      case 'pending':
        return 'รอดำเนินการ';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  // สาเหตุการตีกลับ
  const returnReasons = [
    { value: 'all', label: 'ทุกสาเหตุ' },
    { value: 'address_not_found', label: 'ที่อยู่ไม่ถูกต้อง' },
    { value: 'customer_refused', label: 'ลูกค้าปฏิเสธรับพัสดุ' },
    { value: 'customer_not_available', label: 'ไม่พบผู้รับ' },
    { value: 'wrong_item', label: 'สินค้าไม่ตรงตามสั่ง' },
    { value: 'damaged', label: 'สินค้าเสียหาย' },
    { value: 'payment_issue', label: 'ปัญหาการชำระเงิน' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  // บริษัทขนส่ง
  const courierOptions = [
    { value: 'all', label: 'ทุกบริษัทขนส่ง' },
    { value: 'flash', label: 'Flash Express' },
    { value: 'kerry', label: 'Kerry Express' },
    { value: 'thailand_post', label: 'Thailand Post' },
    { value: 'jt', label: 'J&T Express' },
    { value: 'dhl', label: 'DHL' }
  ];

  // ข้อมูลตัวอย่างสำหรับกราฟ (ในกรณีที่ API ยังไม่พร้อม)
  const sampleReturnTrendData = [
    { date: '01/04/2025', value: 5 },
    { date: '02/04/2025', value: 3 },
    { date: '03/04/2025', value: 7 },
    { date: '04/04/2025', value: 4 },
    { date: '05/04/2025', value: 8 },
    { date: '06/04/2025', value: 6 },
    { date: '07/04/2025', value: 5 },
    { date: '08/04/2025', value: 9 },
    { date: '09/04/2025', value: 8 },
    { date: '10/04/2025', value: 7 },
    { date: '11/04/2025', value: 5 },
    { date: '12/04/2025', value: 4 },
    { date: '13/04/2025', value: 3 },
    { date: '14/04/2025', value: 6 },
  ];

  const sampleReturnReasonData = [
    { name: 'ที่อยู่ไม่ถูกต้อง', value: 15, percent: 25 },
    { name: 'ลูกค้าปฏิเสธรับพัสดุ', value: 12, percent: 20 },
    { name: 'ไม่พบผู้รับ', value: 10, percent: 16.67 },
    { name: 'สินค้าไม่ตรงตามสั่ง', value: 8, percent: 13.33 },
    { name: 'สินค้าเสียหาย', value: 7, percent: 11.67 },
    { name: 'ปัญหาการชำระเงิน', value: 5, percent: 8.33 },
    { name: 'อื่นๆ', value: 3, percent: 5 }
  ];

  const sampleReturnCourierData = [
    { name: 'Flash Express', value: 18, percent: 30 },
    { name: 'Kerry Express', value: 15, percent: 25 },
    { name: 'Thailand Post', value: 12, percent: 20 },
    { name: 'J&T Express', value: 10, percent: 16.67 },
    { name: 'DHL', value: 5, percent: 8.33 }
  ];

  const sampleReturnAreaData = [
    { name: 'กรุงเทพและปริมณฑล', value: 20 },
    { name: 'ภาคกลาง', value: 10 },
    { name: 'ภาคเหนือ', value: 8 },
    { name: 'ภาคตะวันออกเฉียงเหนือ', value: 12 },
    { name: 'ภาคตะวันออก', value: 5 },
    { name: 'ภาคตะวันตก', value: 3 },
    { name: 'ภาคใต้', value: 2 }
  ];

  const sampleReturnAvgTimeData = [
    { name: 'Flash Express', value: 2.5 },
    { name: 'Kerry Express', value: 3.2 },
    { name: 'Thailand Post', value: 4.5 },
    { name: 'J&T Express', value: 3.8 },
    { name: 'DHL', value: 2.0 }
  ];

  const sampleReturnsList = [
    {
      id: 'RET001',
      orderNumber: 'ORD-12345',
      trackingNumber: 'FLX123456789TH',
      customerName: 'สมชาย มั่งมี',
      date: '10/04/2025',
      reason: 'address_not_found',
      courier: 'Flash Express',
      status: 'resolved',
      resolution: 'จัดส่งใหม่',
      costImpact: 120
    },
    {
      id: 'RET002',
      orderNumber: 'ORD-12346',
      trackingNumber: 'KRY987654321TH',
      customerName: 'สมหญิง รวยเงิน',
      date: '11/04/2025',
      reason: 'customer_refused',
      courier: 'Kerry Express',
      status: 'processing',
      resolution: 'รอลูกค้ายืนยัน',
      costImpact: 85
    },
    {
      id: 'RET003',
      orderNumber: 'ORD-12347',
      trackingNumber: 'EMS123456789TH',
      customerName: 'วิชัย มากมี',
      date: '12/04/2025',
      reason: 'wrong_item',
      courier: 'Thailand Post',
      status: 'pending',
      resolution: 'รอการจัดการ',
      costImpact: 150
    },
    {
      id: 'RET004',
      orderNumber: 'ORD-12348',
      trackingNumber: 'JNT123456789TH',
      customerName: 'ชนาภา ดีงาม',
      date: '12/04/2025',
      reason: 'damaged',
      courier: 'J&T Express',
      status: 'processing',
      resolution: 'ส่งสินค้าใหม่',
      costImpact: 200
    },
    {
      id: 'RET005',
      orderNumber: 'ORD-12349',
      trackingNumber: 'FLX567891234TH',
      customerName: 'พิชัย วิเศษ',
      date: '13/04/2025',
      reason: 'customer_not_available',
      courier: 'Flash Express',
      status: 'resolved',
      resolution: 'จัดส่งใหม่',
      costImpact: 95
    },
    {
      id: 'RET006',
      orderNumber: 'ORD-12350',
      trackingNumber: 'KRY123789456TH',
      customerName: 'มานี รักษ์ดี',
      date: '14/04/2025',
      reason: 'payment_issue',
      courier: 'Kerry Express',
      status: 'cancelled',
      resolution: 'ยกเลิกคำสั่งซื้อ',
      costImpact: 180
    },
    {
      id: 'RET007',
      orderNumber: 'ORD-12351',
      trackingNumber: 'FLX456789123TH',
      customerName: 'สุรชัย มากทรัพย์',
      date: '15/04/2025',
      reason: 'other',
      courier: 'Flash Express',
      status: 'pending',
      resolution: 'รอการตรวจสอบ',
      costImpact: 110
    },
    {
      id: 'RET008',
      orderNumber: 'ORD-12352',
      trackingNumber: 'EMS456789123TH',
      customerName: 'อำไพ สินธร',
      date: '15/04/2025',
      reason: 'address_not_found',
      courier: 'Thailand Post',
      status: 'processing',
      resolution: 'ตรวจสอบที่อยู่',
      costImpact: 75
    },
    {
      id: 'RET009',
      orderNumber: 'ORD-12353',
      trackingNumber: 'JNT456789123TH',
      customerName: 'สมบัติ มิตรดี',
      date: '16/04/2025',
      reason: 'customer_refused',
      courier: 'J&T Express',
      status: 'resolved',
      resolution: 'คืนเงิน',
      costImpact: 250
    },
    {
      id: 'RET010',
      orderNumber: 'ORD-12354',
      trackingNumber: 'FLX789123456TH',
      customerName: 'กอบกุล ศรีสมบัติ',
      date: '17/04/2025',
      reason: 'damaged',
      courier: 'Flash Express',
      status: 'pending',
      resolution: 'รอการจัดการ',
      costImpact: 320
    }
  ];

  const COLORS = ['#8A2BE2', '#6A5ACD', '#9370DB', '#BA55D3', '#9400D3', '#4B0082', '#483D8B'];
  const REASON_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', '#073B4C', '#8A2BE2'];

  return (
    <Layout>
      <Helmet>
        <title>รายงานพัสดุตีกลับ - SHIPSYNC</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">รายงานพัสดุตีกลับ</h1>
            <p className="text-gray-500 mt-1">วิเคราะห์สาเหตุและข้อมูลการตีกลับของพัสดุ</p>
          </div>
          <div className="flex space-x-4">
            <Tabs value={period} onValueChange={(value) => setPeriod(value as any)} className="w-auto">
              <TabsList>
                <TabsTrigger value="day">วันนี้</TabsTrigger>
                <TabsTrigger value="week">สัปดาห์นี้</TabsTrigger>
                <TabsTrigger value="month">เดือนนี้</TabsTrigger>
                <TabsTrigger value="year">ปีนี้</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* ตัวกรองพัสดุตีกลับ */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">วันที่เริ่มต้น</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">วันที่สิ้นสุด</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">สาเหตุการตีกลับ</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="เลือกสาเหตุ" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnReasons.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courier">บริษัทขนส่ง</Label>
                <Select value={courier} onValueChange={setCourier}>
                  <SelectTrigger id="courier">
                    <SelectValue placeholder="เลือกขนส่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    {courierOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  อัปเดตข้อมูล
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดสรุปข้อมูลพัสดุตีกลับ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">จำนวนพัสดุตีกลับทั้งหมด</span>
                  <Package className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold">60 รายการ</div>
                <div className="flex items-center text-sm text-red-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+12% จากช่วงก่อนหน้า</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">อัตราการตีกลับ</span>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">6.5%</div>
                <div className="flex items-center text-sm text-yellow-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+1.2% จากช่วงก่อนหน้า</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">ผลกระทบต่อต้นทุน</span>
                  <FileDown className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">฿7,600</div>
                <div className="flex items-center text-sm text-purple-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+8.5% จากช่วงก่อนหน้า</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">เวลาแก้ไขเฉลี่ย</span>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">2.8 วัน</div>
                <div className="flex items-center text-sm text-green-500">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  <span>-0.5 วัน จากช่วงก่อนหน้า</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* การ์ดแสดงแนวโน้มพัสดุตีกลับ */}
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มพัสดุตีกลับ</CardTitle>
            <CardDescription>จำนวนพัสดุตีกลับรายวัน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reportData.returnTrendData?.length ? reportData.returnTrendData : sampleReturnTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'จำนวนพัสดุตีกลับ']} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#FF6B6B" activeDot={{ r: 8 }} name="จำนวนพัสดุตีกลับ" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงสาเหตุการตีกลับ */}
        <Card>
          <CardHeader>
            <CardTitle>สาเหตุการตีกลับ</CardTitle>
            <CardDescription>การกระจายของสาเหตุการตีกลับ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.returnReasonData?.length ? reportData.returnReasonData : sampleReturnReasonData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {(reportData.returnReasonData?.length ? reportData.returnReasonData : sampleReturnReasonData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สาเหตุ</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-right">สัดส่วน (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.returnReasonData?.length ? reportData.returnReasonData : sampleReturnReasonData).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.value}</TableCell>
                        <TableCell className="text-right">{item.percent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงการตีกลับตามบริษัทขนส่ง */}
        <Card>
          <CardHeader>
            <CardTitle>การตีกลับตามบริษัทขนส่ง</CardTitle>
            <CardDescription>อัตราการตีกลับแยกตามผู้ให้บริการขนส่ง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.returnCourierData?.length ? reportData.returnCourierData : sampleReturnCourierData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'จำนวนพัสดุตีกลับ']} />
                    <Legend />
                    <Bar dataKey="value" fill="#FF6B6B" name="จำนวนพัสดุตีกลับ" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>บริษัทขนส่ง</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-right">สัดส่วน (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.returnCourierData?.length ? reportData.returnCourierData : sampleReturnCourierData).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.value}</TableCell>
                        <TableCell className="text-right">{item.percent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงการตีกลับตามพื้นที่ */}
        <Card>
          <CardHeader>
            <CardTitle>การตีกลับตามพื้นที่</CardTitle>
            <CardDescription>จำนวนพัสดุตีกลับแยกตามภูมิภาค</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.returnAreaData?.length ? reportData.returnAreaData : sampleReturnAreaData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'จำนวนพัสดุตีกลับ']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8A2BE2" name="จำนวนพัสดุตีกลับ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงเวลาเฉลี่ยในการตีกลับตามขนส่ง */}
        <Card>
          <CardHeader>
            <CardTitle>เวลาเฉลี่ยในการตีกลับ (วัน)</CardTitle>
            <CardDescription>ระยะเวลาเฉลี่ยในการจัดการพัสดุตีกลับตามบริษัทขนส่ง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.returnAvgTimeData?.length ? reportData.returnAvgTimeData : sampleReturnAvgTimeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} วัน`, 'เวลาเฉลี่ยในการตีกลับ']} />
                  <Legend />
                  <Bar dataKey="value" fill="#118AB2" name="เวลาเฉลี่ย (วัน)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงรายการพัสดุตีกลับทั้งหมด */}
        <Card>
          <CardHeader>
            <CardTitle>รายการพัสดุตีกลับทั้งหมด</CardTitle>
            <CardDescription>รายละเอียดพัสดุตีกลับทั้งหมดในช่วงเวลาที่เลือก</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                  placeholder="ค้นหาจากเลขคำสั่งซื้อ, ชื่อลูกค้า, เลขพัสดุ..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" onClick={handleSearch}>ค้นหา</Button>
              </div>
            
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>เลขคำสั่งซื้อ</TableHead>
                      <TableHead>ลูกค้า</TableHead>
                      <TableHead>เลขพัสดุ</TableHead>
                      <TableHead>สาเหตุ</TableHead>
                      <TableHead>ขนส่ง</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>การจัดการ</TableHead>
                      <TableHead className="text-right">ผลกระทบต้นทุน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.returnsList?.length ? reportData.returnsList : sampleReturnsList).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="font-medium">{item.orderNumber}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.trackingNumber}</TableCell>
                        <TableCell>{getReasonText(item.reason)}</TableCell>
                        <TableCell>{item.courier}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.resolution}</TableCell>
                        <TableCell className="text-right">฿{item.costImpact.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportsReturns;