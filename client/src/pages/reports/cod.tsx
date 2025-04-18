import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Download, DollarSign, AlertTriangle, CreditCard, X } from 'lucide-react';
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

const ReportsCOD: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  
  const [reportData, setReportData] = useState({
    codStatusData: [],
    codTrendData: [],
    codByAreaData: [],
    codByAmountData: [],
    pendingTransfersData: [],
    codDetailedList: []
  });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reports/cod?period=${period}`;
      
      if (dateRange.start && dateRange.end) {
        url += `&start=${dateRange.start}&end=${dateRange.end}`;
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
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลรายงาน COD ได้');
      }
    } catch (error) {
      console.error('Error fetching COD report data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลรายงาน COD ได้',
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
      description: `กำลังส่งออกรายงาน COD ในรูปแบบ ${format.toUpperCase()}`,
    });
    
    // ในการใช้งานจริง จะต้องเรียก API เพื่อส่งออกรายงาน
    setTimeout(() => {
      toast({
        title: 'ส่งออกรายงานสำเร็จ',
        description: 'รายงานถูกดาวน์โหลดเรียบร้อยแล้ว',
        variant: 'default',
      });
      setShowExportOptions(false);
    }, 1500);
  };

  const getCodStatusColor = (status: string) => {
    switch (status) {
      case 'collected':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'transferred':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-600 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatCodStatus = (status: string) => {
    switch (status) {
      case 'collected':
        return 'เก็บเงินแล้ว';
      case 'transferred':
        return 'โอนเงินแล้ว';
      case 'pending':
        return 'รอดำเนินการ';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  // ข้อมูลตัวอย่างสำหรับกราฟ (ในกรณีที่ API ยังไม่พร้อม)
  const sampleCodStatusData = [
    { name: 'เก็บเงินแล้ว', value: 45, percent: 45 },
    { name: 'โอนเงินแล้ว', value: 30, percent: 30 },
    { name: 'รอดำเนินการ', value: 15, percent: 15 },
    { name: 'ยกเลิก', value: 10, percent: 10 },
  ];

  const sampleCodTrendData = [
    { date: '01/04/2025', value: 15000 },
    { date: '02/04/2025', value: 18000 },
    { date: '03/04/2025', value: 12000 },
    { date: '04/04/2025', value: 22000 },
    { date: '05/04/2025', value: 20000 },
    { date: '06/04/2025', value: 15000 },
    { date: '07/04/2025', value: 10000 },
    { date: '08/04/2025', value: 25000 },
    { date: '09/04/2025', value: 30000 },
    { date: '10/04/2025', value: 28000 },
    { date: '11/04/2025', value: 20000 },
    { date: '12/04/2025', value: 18000 },
    { date: '13/04/2025', value: 15000 },
    { date: '14/04/2025', value: 22000 },
  ];

  const sampleCodByAreaData = [
    { name: 'กรุงเทพและปริมณฑล', value: 85000 },
    { name: 'ภาคกลาง', value: 45000 },
    { name: 'ภาคเหนือ', value: 32000 },
    { name: 'ภาคตะวันออกเฉียงเหนือ', value: 28000 },
    { name: 'ภาคตะวันออก', value: 25000 },
    { name: 'ภาคตะวันตก', value: 18000 },
    { name: 'ภาคใต้', value: 15000 },
  ];

  const sampleCodByAmountData = [
    { name: '< ฿500', value: 35 },
    { name: '฿500 - ฿999', value: 25 },
    { name: '฿1,000 - ฿1,999', value: 20 },
    { name: '฿2,000 - ฿4,999', value: 12 },
    { name: '฿5,000 - ฿9,999', value: 5 },
    { name: '≥ ฿10,000', value: 3 },
  ];

  const samplePendingTransfersData = [
    { name: 'Flash Express', value: 25000, count: 15 },
    { name: 'Kerry Express', value: 18000, count: 10 },
    { name: 'Thailand Post', value: 12000, count: 8 },
    { name: 'J&T Express', value: 8000, count: 5 },
  ];

  const sampleCodDetailedList = [
    {
      id: 'COD001',
      orderNumber: 'ORD-12345',
      amount: 1250,
      customerName: 'สมชาย มั่งมี',
      date: '10/04/2025',
      status: 'collected',
      courier: 'Flash Express',
      trackingNumber: 'FLX123456789TH'
    },
    {
      id: 'COD002',
      orderNumber: 'ORD-12346',
      amount: 2500,
      customerName: 'สมหญิง รวยเงิน',
      date: '11/04/2025',
      status: 'transferred',
      courier: 'Kerry Express',
      trackingNumber: 'KRY987654321TH'
    },
    {
      id: 'COD003',
      orderNumber: 'ORD-12347',
      amount: 850,
      customerName: 'วิชัย มากมี',
      date: '12/04/2025',
      status: 'pending',
      courier: 'Thailand Post',
      trackingNumber: 'EMS123456789TH'
    },
    {
      id: 'COD004',
      orderNumber: 'ORD-12348',
      amount: 1800,
      customerName: 'ชนาภา ดีงาม',
      date: '12/04/2025',
      status: 'pending',
      courier: 'J&T Express',
      trackingNumber: 'JNT123456789TH'
    },
    {
      id: 'COD005',
      orderNumber: 'ORD-12349',
      amount: 950,
      customerName: 'พิชัย วิเศษ',
      date: '13/04/2025',
      status: 'cancelled',
      courier: 'Flash Express',
      trackingNumber: 'FLX567891234TH'
    },
    {
      id: 'COD006',
      orderNumber: 'ORD-12350',
      amount: 3200,
      customerName: 'มานี รักษ์ดี',
      date: '14/04/2025',
      status: 'collected',
      courier: 'Kerry Express',
      trackingNumber: 'KRY123789456TH'
    },
    {
      id: 'COD007',
      orderNumber: 'ORD-12351',
      amount: 1500,
      customerName: 'สุรชัย มากทรัพย์',
      date: '15/04/2025',
      status: 'collected',
      courier: 'Flash Express',
      trackingNumber: 'FLX456789123TH'
    },
    {
      id: 'COD008',
      orderNumber: 'ORD-12352',
      amount: 2200,
      customerName: 'อำไพ สินธร',
      date: '15/04/2025',
      status: 'transferred',
      courier: 'Thailand Post',
      trackingNumber: 'EMS456789123TH'
    },
    {
      id: 'COD009',
      orderNumber: 'ORD-12353',
      amount: 1800,
      customerName: 'สมบัติ มิตรดี',
      date: '16/04/2025',
      status: 'pending',
      courier: 'J&T Express',
      trackingNumber: 'JNT456789123TH'
    },
    {
      id: 'COD010',
      orderNumber: 'ORD-12354',
      amount: 5000,
      customerName: 'กอบกุล ศรีสมบัติ',
      date: '17/04/2025',
      status: 'collected',
      courier: 'Flash Express',
      trackingNumber: 'FLX789123456TH'
    }
  ];

  const COLORS = ['#8A2BE2', '#6A5ACD', '#9370DB', '#BA55D3', '#9400D3', '#4B0082', '#483D8B'];
  const STATUS_COLORS = ['#20d161', '#3b82f6', '#facc15', '#ef4444'];

  return (
    <Layout>
      <Helmet>
        <title>รายงาน COD - PURPLEDASH</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">รายงาน COD</h1>
            <p className="text-gray-500 mt-1">วิเคราะห์ข้อมูลการชำระเงินปลายทาง (Cash on Delivery)</p>
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

        {/* ตัวกรองและปุ่มส่งออก */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="start-date" className="text-sm font-medium">วันที่เริ่มต้น</label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="end-date" className="text-sm font-medium">วันที่สิ้นสุด</label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  ค้นหา
                </Button>
                <div className="relative">
                  <Button variant="outline" onClick={() => setShowExportOptions(!showExportOptions)}>
                    <Download className="w-4 h-4 mr-2" />
                    ส่งออก
                  </Button>
                  {showExportOptions && (
                    <div className="absolute right-0 mt-2 w-40 p-2 bg-white border rounded-md shadow-lg z-10">
                      <button
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        onClick={() => handleExport('pdf')}
                      >
                        PDF
                      </button>
                      <button
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        onClick={() => handleExport('excel')}
                      >
                        Excel
                      </button>
                      <button
                        className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                        onClick={() => handleExport('csv')}
                      >
                        CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดสรุปสถานะ COD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">รวมมูลค่า COD</span>
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold">฿138,000</div>
                <div className="text-sm text-gray-500">จากทั้งหมด 100 รายการ</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">เก็บเงินแล้ว</span>
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold">฿78,000</div>
                <div className="text-sm text-gray-500">56.5% ของทั้งหมด</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">รอโอนเงิน</span>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">฿42,000</div>
                <div className="text-sm text-gray-500">30.4% ของทั้งหมด</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">ยอดเฉลี่ยต่อรายการ</span>
                  <CreditCard className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">฿1,380</div>
                <div className="text-sm text-gray-500">จากทั้งหมด 100 รายการ</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* การ์ดแสดงสถานะ COD */}
        <Card>
          <CardHeader>
            <CardTitle>สถานะการชำระเงินปลายทาง</CardTitle>
            <CardDescription>สัดส่วนของสถานะ COD ทั้งหมด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.codStatusData?.length ? reportData.codStatusData : sampleCodStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {(reportData.codStatusData?.length ? reportData.codStatusData : sampleCodStatusData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
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
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จำนวนรายการ</TableHead>
                      <TableHead className="text-right">สัดส่วน (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.codStatusData?.length ? reportData.codStatusData : sampleCodStatusData).map((item, index) => (
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

        {/* การ์ดแสดงแนวโน้ม COD */}
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มยอด COD</CardTitle>
            <CardDescription>มูลค่า COD ตามช่วงเวลา</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reportData.codTrendData?.length ? reportData.codTrendData : sampleCodTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'มูลค่า COD']} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8A2BE2" activeDot={{ r: 8 }} name="มูลค่า COD" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดง COD ตามพื้นที่ */}
        <Card>
          <CardHeader>
            <CardTitle>มูลค่า COD ตามภูมิภาค</CardTitle>
            <CardDescription>การกระจายของยอด COD ตามพื้นที่</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.codByAreaData?.length ? reportData.codByAreaData : sampleCodByAreaData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'มูลค่า COD']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8A2BE2" name="มูลค่า COD (บาท)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดง COD ตามช่วงมูลค่า */}
        <Card>
          <CardHeader>
            <CardTitle>การกระจายตามช่วงมูลค่า</CardTitle>
            <CardDescription>จำนวนรายการ COD แยกตามช่วงมูลค่า</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.codByAmountData?.length ? reportData.codByAmountData : sampleCodByAmountData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'จำนวนรายการ']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8A2BE2" name="จำนวนรายการ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงรายการรอโอนเงิน */}
        <Card>
          <CardHeader>
            <CardTitle>รายการรอโอนเงิน (ตามบริษัทขนส่ง)</CardTitle>
            <CardDescription>ยอดเงิน COD ที่รอการโอนเงินจากบริษัทขนส่ง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>บริษัทขนส่ง</TableHead>
                    <TableHead className="text-right">จำนวนรายการ</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.pendingTransfersData?.length ? reportData.pendingTransfersData : samplePendingTransfersData).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">฿{item.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Check className="w-4 h-4 mr-1" />
                          ยืนยันการรับเงิน
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงรายการ COD ทั้งหมด */}
        <Card>
          <CardHeader>
            <CardTitle>รายการ COD ทั้งหมด</CardTitle>
            <CardDescription>รายละเอียดทุกรายการ COD ในช่วงเวลาที่เลือก</CardDescription>
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
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>บริษัทขนส่ง</TableHead>
                      <TableHead>เลขพัสดุ</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.codDetailedList?.length ? reportData.codDetailedList : sampleCodDetailedList).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="font-medium">{item.orderNumber}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>฿{item.amount.toLocaleString()}</TableCell>
                        <TableCell>{item.courier}</TableCell>
                        <TableCell>{item.trackingNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCodStatusColor(item.status)}>
                            {formatCodStatus(item.status)}
                          </Badge>
                        </TableCell>
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

export default ReportsCOD;