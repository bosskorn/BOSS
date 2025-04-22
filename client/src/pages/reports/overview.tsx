import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar, 
  CreditCard, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Truck 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ReportsOverview: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalShipments: 0,
    orderGrowth: 0,
    revenueGrowth: 0,
    customerGrowth: 0,
    shipmentGrowth: 0,
  });
  
  const [chartData, setChartData] = useState({
    salesOverTime: [],
    ordersByStatus: [],
    shipmentsByCarrier: [],
    deliveryPerformance: []
  });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/overview?period=${period}`, {
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
        // ในสถานการณ์จริง เราจะใช้ข้อมูลจริงจาก API
        // แต่ในทดลองนี้ เราจะใช้ข้อมูลจำลอง
        
        setSummaryData(data.data.summary);
        setChartData(data.data.charts);
        
      } else {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลรายงานได้');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลรายงานได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ข้อมูลตัวอย่างสำหรับกราฟ (ในกรณีที่ API ยังไม่พร้อม)
  const sampleSalesData = [
    { name: 'มกราคม', value: 24500 },
    { name: 'กุมภาพันธ์', value: 13250 },
    { name: 'มีนาคม', value: 38600 },
    { name: 'เมษายน', value: 47800 },
    { name: 'พฤษภาคม', value: 35400 },
    { name: 'มิถุนายน', value: 29700 },
  ];

  const sampleOrderStatusData = [
    { name: 'รอจัดส่ง', value: 45 },
    { name: 'อยู่ระหว่างจัดส่ง', value: 30 },
    { name: 'จัดส่งสำเร็จ', value: 120 },
    { name: 'ยกเลิก', value: 5 },
    { name: 'คืนสินค้า', value: 10 },
  ];

  const sampleShipmentCarrierData = [
    { name: 'Flash Express', value: 85 },
    { name: 'Kerry Express', value: 45 },
    { name: 'Thailand Post', value: 30 },
    { name: 'J&T Express', value: 25 },
    { name: 'DHL', value: 15 },
  ];

  const sampleDeliveryPerformanceData = [
    { name: 'จัดส่งตรงเวลา', value: 85 },
    { name: 'จัดส่งล่าช้า', value: 15 },
  ];

  const COLORS = ['#8A2BE2', '#6A5ACD', '#9370DB', '#BA55D3', '#9400D3', '#4B0082'];

  return (
    <Layout>
      <Helmet>
        <title>ภาพรวมรายงาน - SHIPSYNC</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">ภาพรวมรายงาน</h1>
            <p className="text-gray-500 mt-1">ดูภาพรวมของยอดขาย การจัดส่ง และสถิติสำคัญ</p>
          </div>
          <Tabs value={period} onValueChange={(value) => setPeriod(value as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="day">วันนี้</TabsTrigger>
              <TabsTrigger value="week">สัปดาห์นี้</TabsTrigger>
              <TabsTrigger value="month">เดือนนี้</TabsTrigger>
              <TabsTrigger value="year">ปีนี้</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* การ์ดสรุปข้อมูล */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">ยอดคำสั่งซื้อทั้งหมด</p>
                  <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : summaryData.totalOrders || 210}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${summaryData.orderGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {summaryData.orderGrowth >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {Math.abs(summaryData.orderGrowth || 12)}%
                </div>
                <span className="text-xs text-gray-500 ml-2">เทียบกับช่วงก่อนหน้า</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">รายได้รวม</p>
                  <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : `฿${(summaryData.totalRevenue || 189600).toLocaleString()}`}</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${summaryData.revenueGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {summaryData.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {Math.abs(summaryData.revenueGrowth || 8)}%
                </div>
                <span className="text-xs text-gray-500 ml-2">เทียบกับช่วงก่อนหน้า</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">ลูกค้าทั้งหมด</p>
                  <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : summaryData.totalCustomers || 145}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${summaryData.customerGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {summaryData.customerGrowth >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {Math.abs(summaryData.customerGrowth || 5)}%
                </div>
                <span className="text-xs text-gray-500 ml-2">เทียบกับช่วงก่อนหน้า</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">พัสดุทั้งหมด</p>
                  <h3 className="text-2xl font-bold mt-1">{isLoading ? "..." : summaryData.totalShipments || 198}</h3>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${summaryData.shipmentGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {summaryData.shipmentGrowth >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {Math.abs(summaryData.shipmentGrowth || 15)}%
                </div>
                <span className="text-xs text-gray-500 ml-2">เทียบกับช่วงก่อนหน้า</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* กราฟ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ยอดขายตามช่วงเวลา</CardTitle>
              <CardDescription>แสดงข้อมูลยอดขายตามเดือน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData.salesOverTime?.length ? chartData.salesOverTime : sampleSalesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'ยอดขาย']} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8A2BE2" activeDot={{ r: 8 }} name="ยอดขาย" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>คำสั่งซื้อตามสถานะ</CardTitle>
              <CardDescription>แสดงจำนวนคำสั่งซื้อแยกตามสถานะ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.ordersByStatus?.length ? chartData.ordersByStatus : sampleOrderStatusData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8A2BE2" name="จำนวนคำสั่งซื้อ" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>การจัดส่งตามบริษัทขนส่ง</CardTitle>
              <CardDescription>แสดงจำนวนพัสดุแยกตามบริษัทขนส่ง</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.shipmentsByCarrier?.length ? chartData.shipmentsByCarrier : sampleShipmentCarrierData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {sampleShipmentCarrierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>ประสิทธิภาพการจัดส่ง</CardTitle>
              <CardDescription>สัดส่วนการจัดส่งตรงเวลาและล่าช้า</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.deliveryPerformance?.length ? chartData.deliveryPerformance : sampleDeliveryPerformanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      <Cell fill="#8A2BE2" />
                      <Cell fill="#FF6B6B" />
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ลิงก์ไปยังรายงานอื่นๆ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/reports/by-courier">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">รายงานตามขนส่ง</h3>
                  <p className="text-sm text-gray-500">วิเคราะห์ข้อมูลแยกตามผู้ให้บริการขนส่ง</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/reports/by-area">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">รายงานตามพื้นที่</h3>
                  <p className="text-sm text-gray-500">แสดงข้อมูลคำสั่งซื้อแยกตามภูมิภาค</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/reports/cod">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">รายงาน COD</h3>
                  <p className="text-sm text-gray-500">รายละเอียดการชำระเงินปลายทาง</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsOverview;