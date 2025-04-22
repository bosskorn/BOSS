import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveContainer, 
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
import { MapPin, Calendar, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const ReportsByArea: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [showDistrictBreakdown, setShowDistrictBreakdown] = useState<boolean>(false);
  
  const [reportData, setReportData] = useState({
    regionData: [],
    provinceData: [],
    deliveryTimeData: [],
    revenueData: [],
    topDistrictsData: [],
    detailedAreaData: []
  });

  // รายชื่อภูมิภาค
  const regions = [
    { value: 'all', label: 'ทุกภูมิภาค' },
    { value: 'central', label: 'ภาคกลาง' },
    { value: 'northern', label: 'ภาคเหนือ' },
    { value: 'northeastern', label: 'ภาคตะวันออกเฉียงเหนือ' },
    { value: 'eastern', label: 'ภาคตะวันออก' },
    { value: 'western', label: 'ภาคตะวันตก' },
    { value: 'southern', label: 'ภาคใต้' },
    { value: 'bangkok', label: 'กรุงเทพและปริมณฑล' }
  ];

  // รายชื่อจังหวัด (จะเปลี่ยนตามภูมิภาคที่เลือก - ตัวอย่างเท่านั้น)
  const provinces = {
    all: [{ value: 'all', label: 'ทุกจังหวัด' }],
    central: [
      { value: 'all', label: 'ทุกจังหวัด' },
      { value: 'ayutthaya', label: 'พระนครศรีอยุธยา' },
      { value: 'lopburi', label: 'ลพบุรี' },
      { value: 'singburi', label: 'สิงห์บุรี' },
      { value: 'chainat', label: 'ชัยนาท' },
      { value: 'saraburi', label: 'สระบุรี' },
      { value: 'angthong', label: 'อ่างทอง' }
    ],
    northern: [
      { value: 'all', label: 'ทุกจังหวัด' },
      { value: 'chiangmai', label: 'เชียงใหม่' },
      { value: 'chiangrai', label: 'เชียงราย' },
      { value: 'lampang', label: 'ลำปาง' },
      { value: 'lamphun', label: 'ลำพูน' },
      { value: 'phrae', label: 'แพร่' },
      { value: 'nan', label: 'น่าน' }
    ],
    bangkok: [
      { value: 'all', label: 'ทุกจังหวัด' },
      { value: 'bangkok', label: 'กรุงเทพมหานคร' },
      { value: 'nonthaburi', label: 'นนทบุรี' },
      { value: 'pathumthani', label: 'ปทุมธานี' },
      { value: 'samutprakan', label: 'สมุทรปราการ' },
      { value: 'nakhonpathom', label: 'นครปฐม' },
      { value: 'samutsakhon', label: 'สมุทรสาคร' }
    ]
  };

  useEffect(() => {
    fetchReportData();
  }, [period, selectedRegion, selectedProvince]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/by-area?period=${period}&region=${selectedRegion}&province=${selectedProvince}`, {
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
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลรายงานตามพื้นที่ได้');
      }
    } catch (error) {
      console.error('Error fetching area report data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลรายงานตามพื้นที่ได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // อัปเดตตัวเลือกจังหวัดเมื่อมีการเปลี่ยนภูมิภาค
  useEffect(() => {
    setSelectedProvince('all');
  }, [selectedRegion]);

  // ข้อมูลตัวอย่างสำหรับกราฟ (ในกรณีที่ API ยังไม่พร้อม)
  const sampleRegionData = [
    { name: 'กรุงเทพและปริมณฑล', value: 95, percent: 47.5 },
    { name: 'ภาคกลาง', value: 35, percent: 17.5 },
    { name: 'ภาคเหนือ', value: 22, percent: 11.0 },
    { name: 'ภาคตะวันออกเฉียงเหนือ', value: 18, percent: 9.0 },
    { name: 'ภาคตะวันออก', value: 15, percent: 7.5 },
    { name: 'ภาคตะวันตก', value: 8, percent: 4.0 },
    { name: 'ภาคใต้', value: 7, percent: 3.5 },
  ];

  const sampleProvinceData = [
    { name: 'กรุงเทพมหานคร', value: 65, percent: 32.5 },
    { name: 'นนทบุรี', value: 12, percent: 6.0 },
    { name: 'ปทุมธานี', value: 8, percent: 4.0 },
    { name: 'สมุทรปราการ', value: 6, percent: 3.0 },
    { name: 'เชียงใหม่', value: 10, percent: 5.0 },
    { name: 'ชลบุรี', value: 9, percent: 4.5 },
    { name: 'อื่นๆ', value: 90, percent: 45.0 },
  ];

  const sampleDeliveryTimeData = [
    { name: 'กรุงเทพและปริมณฑล', value: 1.2 },
    { name: 'ภาคกลาง', value: 1.8 },
    { name: 'ภาคเหนือ', value: 2.5 },
    { name: 'ภาคตะวันออกเฉียงเหนือ', value: 3.0 },
    { name: 'ภาคตะวันออก', value: 2.0 },
    { name: 'ภาคตะวันตก', value: 2.2 },
    { name: 'ภาคใต้', value: 3.5 },
  ];

  const sampleRevenueData = [
    { name: 'กรุงเทพและปริมณฑล', value: 85000 },
    { name: 'ภาคกลาง', value: 42000 },
    { name: 'ภาคเหนือ', value: 28000 },
    { name: 'ภาคตะวันออกเฉียงเหนือ', value: 25000 },
    { name: 'ภาคตะวันออก', value: 20000 },
    { name: 'ภาคตะวันตก', value: 15000 },
    { name: 'ภาคใต้', value: 18000 },
  ];

  const sampleTopDistrictsData = [
    { name: 'จตุจักร', region: 'กรุงเทพฯ', value: 25, growth: 15 },
    { name: 'บางนา', region: 'กรุงเทพฯ', value: 20, growth: 8 },
    { name: 'ห้วยขวาง', region: 'กรุงเทพฯ', value: 18, growth: 5 },
    { name: 'ปากเกร็ด', region: 'นนทบุรี', value: 15, growth: 12 },
    { name: 'เมือง', region: 'เชียงใหม่', value: 10, growth: -3 },
    { name: 'ศรีราชา', region: 'ชลบุรี', value: 8, growth: 10 },
    { name: 'หาดใหญ่', region: 'สงขลา', value: 7, growth: 4 },
    { name: 'คลองหลวง', region: 'ปทุมธานี', value: 6, growth: 7 },
    { name: 'บางพลี', region: 'สมุทรปราการ', value: 5, growth: -2 },
    { name: 'เมือง', region: 'อุดรธานี', value: 5, growth: 6 },
  ];

  const sampleDetailedAreaData = [
    {
      region: 'กรุงเทพและปริมณฑล',
      orders: 95,
      revenue: '฿85,000',
      avgOrderValue: '฿895',
      deliveryTime: '1.2 วัน',
      onTimeRate: '92%',
      returnRate: '2.5%',
      topCourier: 'Flash Express'
    },
    {
      region: 'ภาคกลาง',
      orders: 35,
      revenue: '฿42,000',
      avgOrderValue: '฿1,200',
      deliveryTime: '1.8 วัน',
      onTimeRate: '88%',
      returnRate: '3.2%',
      topCourier: 'Kerry Express'
    },
    {
      region: 'ภาคเหนือ',
      orders: 22,
      revenue: '฿28,000',
      avgOrderValue: '฿1,270',
      deliveryTime: '2.5 วัน',
      onTimeRate: '75%',
      returnRate: '4.5%',
      topCourier: 'Thailand Post'
    },
    {
      region: 'ภาคตะวันออกเฉียงเหนือ',
      orders: 18,
      revenue: '฿25,000',
      avgOrderValue: '฿1,390',
      deliveryTime: '3.0 วัน',
      onTimeRate: '70%',
      returnRate: '5.0%',
      topCourier: 'Thailand Post'
    },
    {
      region: 'ภาคตะวันออก',
      orders: 15,
      revenue: '฿20,000',
      avgOrderValue: '฿1,330',
      deliveryTime: '2.0 วัน',
      onTimeRate: '85%',
      returnRate: '3.0%',
      topCourier: 'J&T Express'
    },
    {
      region: 'ภาคตะวันตก',
      orders: 8,
      revenue: '฿15,000',
      avgOrderValue: '฿1,875',
      deliveryTime: '2.2 วัน',
      onTimeRate: '82%',
      returnRate: '3.8%',
      topCourier: 'Kerry Express'
    },
    {
      region: 'ภาคใต้',
      orders: 7,
      revenue: '฿18,000',
      avgOrderValue: '฿2,570',
      deliveryTime: '3.5 วัน',
      onTimeRate: '65%',
      returnRate: '6.2%',
      topCourier: 'Thailand Post'
    }
  ];

  const COLORS = ['#8A2BE2', '#6A5ACD', '#9370DB', '#BA55D3', '#9400D3', '#4B0082', '#483D8B'];

  return (
    <Layout>
      <Helmet>
        <title>รายงานตามพื้นที่ - SHIPSYNC</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">รายงานตามพื้นที่</h1>
            <p className="text-gray-500 mt-1">วิเคราะห์ข้อมูลคำสั่งซื้อตามพื้นที่ทางภูมิศาสตร์</p>
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

        {/* ตัวกรองพื้นที่ */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">ภูมิภาค</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="เลือกภูมิภาค" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">จังหวัด</Label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger id="province">
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent>
                    {(provinces[selectedRegion as keyof typeof provinces] || provinces.all).map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchReportData} className="w-full">
                  แสดงรายงาน
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงข้อมูลตามภูมิภาค */}
        <Card>
          <CardHeader>
            <CardTitle>ปริมาณคำสั่งซื้อตามภูมิภาค</CardTitle>
            <CardDescription>สัดส่วนการสั่งซื้อแยกตามภูมิภาค</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.regionData?.length ? reportData.regionData : sampleRegionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {(reportData.regionData?.length ? reportData.regionData : sampleRegionData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                      <TableHead>ภูมิภาค</TableHead>
                      <TableHead className="text-right">จำนวนคำสั่งซื้อ</TableHead>
                      <TableHead className="text-right">สัดส่วน (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.regionData?.length ? reportData.regionData : sampleRegionData).map((item, index) => (
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

        {/* การ์ดแสดงข้อมูลตามจังหวัด */}
        <Card>
          <CardHeader>
            <CardTitle>ปริมาณคำสั่งซื้อตามจังหวัด (Top 7)</CardTitle>
            <CardDescription>จังหวัดที่มีการสั่งซื้อสูงสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.provinceData?.length ? reportData.provinceData : sampleProvinceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'จำนวนคำสั่งซื้อ']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8A2BE2" name="จำนวนคำสั่งซื้อ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดเวลาจัดส่งเฉลี่ยตามภูมิภาค */}
        <Card>
          <CardHeader>
            <CardTitle>เวลาจัดส่งเฉลี่ยตามภูมิภาค (วัน)</CardTitle>
            <CardDescription>ระยะเวลาจัดส่งเฉลี่ยแยกตามภูมิภาค</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.deliveryTimeData?.length ? reportData.deliveryTimeData : sampleDeliveryTimeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} วัน`, 'เวลาจัดส่งเฉลี่ย']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8A2BE2" name="เวลาจัดส่งเฉลี่ย (วัน)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงรายได้ตามภูมิภาค */}
        <Card>
          <CardHeader>
            <CardTitle>รายได้ตามภูมิภาค</CardTitle>
            <CardDescription>รายได้รวมแยกตามภูมิภาค</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.revenueData?.length ? reportData.revenueData : sampleRevenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8A2BE2" name="รายได้ (บาท)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดแสดงอำเภอ/เขตที่มีการสั่งซื้อสูงสุด */}
        <Card>
          <CardHeader>
            <CardTitle>อำเภอ/เขตที่มีการสั่งซื้อสูงสุด (Top 10)</CardTitle>
            <CardDescription>พื้นที่ย่อยที่มีปริมาณการสั่งซื้อสูงที่สุด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>อำเภอ/เขต</TableHead>
                    <TableHead>จังหวัด</TableHead>
                    <TableHead className="text-right">จำนวนคำสั่งซื้อ</TableHead>
                    <TableHead className="text-right">การเติบโต (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.topDistrictsData?.length ? reportData.topDistrictsData : sampleTopDistrictsData).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.region}</TableCell>
                      <TableCell className="text-right">{item.value}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.growth >= 0 ? '+' : ''}{item.growth}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ตารางรายละเอียดพื้นที่ */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดตามภูมิภาค</CardTitle>
            <CardDescription>ข้อมูลเชิงลึกเกี่ยวกับแต่ละภูมิภาค</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ภูมิภาค</TableHead>
                    <TableHead className="text-right">จำนวนคำสั่งซื้อ</TableHead>
                    <TableHead className="text-right">รายได้รวม</TableHead>
                    <TableHead className="text-right">มูลค่าเฉลี่ยต่อออเดอร์</TableHead>
                    <TableHead className="text-right">เวลาจัดส่งเฉลี่ย</TableHead>
                    <TableHead className="text-right">อัตราส่งตรงเวลา</TableHead>
                    <TableHead className="text-right">อัตราการตีกลับ</TableHead>
                    <TableHead>ขนส่งที่ใช้มากที่สุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.detailedAreaData?.length ? reportData.detailedAreaData : sampleDetailedAreaData).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.region}</TableCell>
                      <TableCell className="text-right">{item.orders}</TableCell>
                      <TableCell className="text-right">{item.revenue}</TableCell>
                      <TableCell className="text-right">{item.avgOrderValue}</TableCell>
                      <TableCell className="text-right">{item.deliveryTime}</TableCell>
                      <TableCell className="text-right">{item.onTimeRate}</TableCell>
                      <TableCell className="text-right">{item.returnRate}</TableCell>
                      <TableCell>{item.topCourier}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportsByArea;