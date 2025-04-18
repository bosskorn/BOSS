import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Calendar, Package, Clock, DollarSign, TruckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const ReportsByCourier: React.FC = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCourier, setSelectedCourier] = useState<string>('all');
  
  const [reportData, setReportData] = useState({
    volumeData: [],
    deliveryTimeData: [],
    performanceData: [],
    dailyShipmentsData: [],
    courierDetails: []
  });

  useEffect(() => {
    fetchReportData();
  }, [period, selectedCourier]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/by-courier?period=${period}&courier=${selectedCourier}`, {
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
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลรายงานตามขนส่งได้');
      }
    } catch (error) {
      console.error('Error fetching courier report data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลรายงานตามขนส่งได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ข้อมูลตัวอย่างสำหรับกราฟ (ในกรณีที่ API ยังไม่พร้อม)
  const sampleVolumeData = [
    { name: 'Flash Express', value: 85, percent: 42.5 },
    { name: 'Kerry Express', value: 45, percent: 22.5 },
    { name: 'Thailand Post', value: 30, percent: 15 },
    { name: 'J&T Express', value: 25, percent: 12.5 },
    { name: 'DHL', value: 15, percent: 7.5 },
  ];

  const sampleDeliveryTimeData = [
    { name: 'Flash Express', value: 1.8 },
    { name: 'Kerry Express', value: 2.2 },
    { name: 'Thailand Post', value: 3.5 },
    { name: 'J&T Express', value: 2.0 },
    { name: 'DHL', value: 1.5 },
  ];

  const samplePerformanceData = [
    { name: 'Flash Express', onTime: 85, delayed: 15 },
    { name: 'Kerry Express', onTime: 80, delayed: 20 },
    { name: 'Thailand Post', onTime: 70, delayed: 30 },
    { name: 'J&T Express', onTime: 82, delayed: 18 },
    { name: 'DHL', onTime: 90, delayed: 10 },
  ];

  const sampleDailyShipmentsData = [
    { name: 'จันทร์', FlashExpress: 12, Kerry: 8, ThailandPost: 5, JT: 7, DHL: 3 },
    { name: 'อังคาร', FlashExpress: 15, Kerry: 10, ThailandPost: 7, JT: 8, DHL: 4 },
    { name: 'พุธ', FlashExpress: 18, Kerry: 12, ThailandPost: 8, JT: 6, DHL: 5 },
    { name: 'พฤหัสบดี', FlashExpress: 14, Kerry: 9, ThailandPost: 6, JT: 9, DHL: 3 },
    { name: 'ศุกร์', FlashExpress: 21, Kerry: 11, ThailandPost: 9, JT: 8, DHL: 4 },
    { name: 'เสาร์', FlashExpress: 16, Kerry: 7, ThailandPost: 5, JT: 6, DHL: 2 },
    { name: 'อาทิตย์', FlashExpress: 9, Kerry: 5, ThailandPost: 3, JT: 4, DHL: 1 },
  ];

  const sampleCourierDetails = [
    {
      courier: 'Flash Express',
      totalOrders: 85,
      avgDeliveryTime: '1.8 วัน',
      onTimeDelivery: '85%',
      avgCost: '฿40.50',
      returns: 3,
      cod: 35,
      mostCommonRegion: 'ภาคกลาง'
    },
    {
      courier: 'Kerry Express',
      totalOrders: 45,
      avgDeliveryTime: '2.2 วัน',
      onTimeDelivery: '80%',
      avgCost: '฿45.75',
      returns: 2,
      cod: 20,
      mostCommonRegion: 'กรุงเทพฯ'
    },
    {
      courier: 'Thailand Post',
      totalOrders: 30,
      avgDeliveryTime: '3.5 วัน',
      onTimeDelivery: '70%',
      avgCost: '฿38.00',
      returns: 4,
      cod: 12,
      mostCommonRegion: 'ภาคเหนือ'
    },
    {
      courier: 'J&T Express',
      totalOrders: 25,
      avgDeliveryTime: '2.0 วัน',
      onTimeDelivery: '82%',
      avgCost: '฿42.25',
      returns: 1,
      cod: 10,
      mostCommonRegion: 'ภาคตะวันออกเฉียงเหนือ'
    },
    {
      courier: 'DHL',
      totalOrders: 15,
      avgDeliveryTime: '1.5 วัน',
      onTimeDelivery: '90%',
      avgCost: '฿120.00',
      returns: 0,
      cod: 2,
      mostCommonRegion: 'กรุงเทพฯ'
    }
  ];

  const COLORS = ['#8A2BE2', '#6A5ACD', '#9370DB', '#BA55D3', '#9400D3', '#4B0082'];

  const getStatusColor = (percent: number) => {
    if (percent >= 85) return 'bg-green-100 text-green-600 border-green-200';
    if (percent >= 70) return 'bg-yellow-100 text-yellow-600 border-yellow-200';
    return 'bg-red-100 text-red-600 border-red-200';
  };

  return (
    <Layout>
      <Helmet>
        <title>รายงานตามขนส่ง - PURPLEDASH</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">รายงานตามขนส่ง</h1>
            <p className="text-gray-500 mt-1">วิเคราะห์ประสิทธิภาพการจัดส่งแยกตามผู้ให้บริการขนส่ง</p>
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

        {/* การ์ดสรุปปริมาณพัสดุแยกตามขนส่ง */}
        <Card>
          <CardHeader>
            <CardTitle>ปริมาณพัสดุแยกตามขนส่ง</CardTitle>
            <CardDescription>สัดส่วนการใช้บริการขนส่งต่างๆ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.volumeData?.length ? reportData.volumeData : sampleVolumeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {(reportData.volumeData?.length ? reportData.volumeData : sampleVolumeData).map((entry, index) => (
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
                      <TableHead>ขนส่ง</TableHead>
                      <TableHead className="text-right">จำนวนพัสดุ</TableHead>
                      <TableHead className="text-right">สัดส่วน (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.volumeData?.length ? reportData.volumeData : sampleVolumeData).map((item, index) => (
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

        {/* การ์ดเวลาจัดส่งเฉลี่ย */}
        <Card>
          <CardHeader>
            <CardTitle>เวลาจัดส่งเฉลี่ย (วัน)</CardTitle>
            <CardDescription>ระยะเวลาจัดส่งเฉลี่ยแยกตามบริษัทขนส่ง</CardDescription>
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

        {/* การ์ดประสิทธิภาพการจัดส่ง */}
        <Card>
          <CardHeader>
            <CardTitle>ประสิทธิภาพการจัดส่ง</CardTitle>
            <CardDescription>สัดส่วนการจัดส่งตรงเวลาและล่าช้า</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.performanceData?.length ? reportData.performanceData : samplePerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Bar dataKey="onTime" stackId="a" fill="#8A2BE2" name="ตรงเวลา (%)" />
                  <Bar dataKey="delayed" stackId="a" fill="#FF6B6B" name="ล่าช้า (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* การ์ดปริมาณพัสดุรายวัน */}
        <Card>
          <CardHeader>
            <CardTitle>ปริมาณพัสดุรายวัน</CardTitle>
            <CardDescription>จำนวนพัสดุที่จัดส่งในแต่ละวันของสัปดาห์</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.dailyShipmentsData?.length ? reportData.dailyShipmentsData : sampleDailyShipmentsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="FlashExpress" fill="#8A2BE2" name="Flash Express" />
                  <Bar dataKey="Kerry" fill="#6A5ACD" name="Kerry Express" />
                  <Bar dataKey="ThailandPost" fill="#9370DB" name="Thailand Post" />
                  <Bar dataKey="JT" fill="#BA55D3" name="J&T Express" />
                  <Bar dataKey="DHL" fill="#9400D3" name="DHL" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ตารางรายละเอียดขนส่ง */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดบริษัทขนส่ง</CardTitle>
            <CardDescription>ข้อมูลเชิงลึกเกี่ยวกับประสิทธิภาพของแต่ละบริษัทขนส่ง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>บริษัทขนส่ง</TableHead>
                    <TableHead>จำนวนพัสดุ</TableHead>
                    <TableHead>เวลาจัดส่งเฉลี่ย</TableHead>
                    <TableHead>การจัดส่งตรงเวลา</TableHead>
                    <TableHead>ราคาเฉลี่ย</TableHead>
                    <TableHead>พัสดุตีกลับ</TableHead>
                    <TableHead>COD</TableHead>
                    <TableHead>พื้นที่จัดส่งหลัก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reportData.courierDetails?.length ? reportData.courierDetails : sampleCourierDetails).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.courier}</TableCell>
                      <TableCell>{item.totalOrders}</TableCell>
                      <TableCell>{item.avgDeliveryTime}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(parseInt(item.onTimeDelivery))}>
                          {item.onTimeDelivery}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.avgCost}</TableCell>
                      <TableCell>{item.returns}</TableCell>
                      <TableCell>{item.cod}</TableCell>
                      <TableCell>{item.mostCommonRegion}</TableCell>
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

export default ReportsByCourier;