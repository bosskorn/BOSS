import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronUp,
  ChevronDown,
  BarChart4,
  Users,
  Package,
  TrendingUp,
  ShoppingCart,
  MapPin,
  AlertTriangle,
  Truck,
  Settings,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

// ประเภทข้อมูลสรุปสำหรับแดชบอร์ดผู้ดูแลระบบ
interface AdminSummaryData {
  // สถิติผู้ใช้และร้านค้า
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  userGrowthRate: number;
  
  // สถิติการขนส่ง
  totalParcels: number;
  pendingParcels: number;
  inTransitParcels: number;
  deliveredParcels: number;
  returnedParcels: number;
  parcelSuccessRate: number;
  
  // สถิติธุรกรรม
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  codRevenue: number;
  avgDeliveryTime: string;
  
  // ข้อมูลทางภูมิศาสตร์
  topDestinations: {
    name: string;
    count: number;
    percentage: number;
  }[];
  
  // ข้อมูลสถานะระบบ
  systemHealth: {
    databaseUsage: number;
    serverUptime: string;
    apiRequests: number;
    apiErrors: number;
    serviceStatus: {
      flashExpress: 'operational' | 'degraded' | 'down';
      payment: 'operational' | 'degraded' | 'down';
      tracking: 'operational' | 'degraded' | 'down';
      notification: 'operational' | 'degraded' | 'down';
    };
  };
  
  recentActivities: Activity[];
  userGrowth: DataPoint[];
  orderTrend: DataPoint[];
  deliveryPerformance: {
    date: string;
    onTime: number;
    delayed: number;
  }[];
}

interface Activity {
  id: number;
  type: 'user' | 'order' | 'system' | 'payment';
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

interface DataPoint {
  date: string;
  value: number;
}

// ตัวอย่างข้อมูลเพื่อแสดงในหน้าแดชบอร์ด (ในการใช้งานจริงควรดึงจาก API)
const initialData: AdminSummaryData = {
  // สถิติผู้ใช้และร้านค้า
  totalUsers: 158,
  activeUsers: 92,
  newUsersToday: 6,
  userGrowthRate: 3.5,
  
  // สถิติการขนส่ง
  totalParcels: 1892,
  pendingParcels: 68,
  inTransitParcels: 225,
  deliveredParcels: 1542,
  returnedParcels: 57,
  parcelSuccessRate: 94.2,
  
  // สถิติธุรกรรม
  totalOrders: 1243,
  pendingOrders: 37,
  totalRevenue: 2584350.75,
  averageOrderValue: 2078.32,
  codRevenue: 856450.25,
  avgDeliveryTime: "1 วัน 14 ชม.",
  
  // ข้อมูลทางภูมิศาสตร์
  topDestinations: [
    { name: "กรุงเทพฯ", count: 582, percentage: 30.8 },
    { name: "เชียงใหม่", count: 238, percentage: 12.6 },
    { name: "ชลบุรี", count: 193, percentage: 10.2 },
    { name: "ภูเก็ต", count: 157, percentage: 8.3 },
    { name: "ขอนแก่น", count: 112, percentage: 5.9 }
  ],
  
  // ข้อมูลสถานะระบบ
  systemHealth: {
    databaseUsage: 68,
    serverUptime: "15 วัน 7 ชม.",
    apiRequests: 12458,
    apiErrors: 24,
    serviceStatus: {
      flashExpress: 'operational',
      payment: 'operational',
      tracking: 'operational',
      notification: 'degraded'
    }
  },
  
  // ข้อมูลประสิทธิภาพการจัดส่ง
  deliveryPerformance: [
    { date: '2025-04-12', onTime: 185, delayed: 15 },
    { date: '2025-04-13', onTime: 193, delayed: 12 },
    { date: '2025-04-14', onTime: 202, delayed: 18 },
    { date: '2025-04-15', onTime: 214, delayed: 16 },
    { date: '2025-04-16', onTime: 225, delayed: 10 },
    { date: '2025-04-17', onTime: 231, delayed: 13 },
    { date: '2025-04-18', onTime: 242, delayed: 14 }
  ],
  recentActivities: [
    { 
      id: 1, 
      type: 'user', 
      action: 'ลงทะเบียนผู้ใช้ใหม่', 
      user: 'นายสมชาย ใจดี', 
      timestamp: '10 นาทีที่แล้ว' 
    },
    { 
      id: 2, 
      type: 'order', 
      action: 'สร้างคำสั่งซื้อใหม่', 
      user: 'บริษัท ABC จำกัด', 
      timestamp: '25 นาทีที่แล้ว', 
      details: 'คำสั่งซื้อ #ORD-2025041801'
    },
    { 
      id: 3, 
      type: 'payment', 
      action: 'การชำระเงินสำเร็จ', 
      user: 'ร้าน XYZ', 
      timestamp: '45 นาทีที่แล้ว', 
      details: '฿5,840.00'
    },
    { 
      id: 4, 
      type: 'system', 
      action: 'อัปเดตระบบ', 
      user: 'ระบบ', 
      timestamp: '2 ชั่วโมงที่แล้ว', 
      details: 'v1.5.0 -> v1.5.1'
    },
    { 
      id: 5, 
      type: 'user', 
      action: 'แก้ไขข้อมูลผู้ใช้', 
      user: 'นางสาวสมหญิง รักดี', 
      timestamp: '3 ชั่วโมงที่แล้ว'
    },
  ],
  userGrowth: [
    { date: '2025-04-12', value: 128 },
    { date: '2025-04-13', value: 132 },
    { date: '2025-04-14', value: 137 },
    { date: '2025-04-15', value: 142 },
    { date: '2025-04-16', value: 147 },
    { date: '2025-04-17', value: 152 },
    { date: '2025-04-18', value: 158 }
  ],
  orderTrend: [
    { date: '2025-04-12', value: 1170 },
    { date: '2025-04-13', value: 1184 },
    { date: '2025-04-14', value: 1192 },
    { date: '2025-04-15', value: 1204 },
    { date: '2025-04-16', value: 1217 },
    { date: '2025-04-17', value: 1230 },
    { date: '2025-04-18', value: 1243 }
  ]
};

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<AdminSummaryData>(initialData);

  // ตรวจสอบสิทธิ์ผู้ดูแลระบบ
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "ไม่มีสิทธิ์เข้าถึง",
        description: "คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้",
        variant: "destructive",
      });
      setLocation('/dashboard');
    }
  }, [user, setLocation, toast]);

  // โหลดข้อมูลสรุปสำหรับผู้ดูแลระบบ
  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        // ในการใช้งานจริง ควรเรียกข้อมูลจาก API
        // const response = await axios.get('/api/admin/dashboard');
        // setSummaryData(response.data);
        
        // ใช้ข้อมูลตัวอย่างสำหรับการสาธิต
        setTimeout(() => {
          setSummaryData(initialData);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [toast]);

  // ไอคอนสำหรับประเภทกิจกรรม
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // สีของ Badge ตามประเภทกิจกรรม
  const getActivityBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'user':
        return "default";
      case 'order':
        return "secondary";
      case 'system':
        return "outline";
      case 'payment':
        return "default";
      default:
        return "destructive";
    }
  };

  // คำนวณเปอร์เซ็นต์ผู้ใช้ที่แอคทีฟ
  const activeUserPercentage = summaryData 
    ? Math.round((summaryData.activeUsers / summaryData.totalUsers) * 100) 
    : 0;

  // คำนวณเปอร์เซ็นต์ออเดอร์ที่รอดำเนินการ
  const pendingOrderPercentage = summaryData 
    ? Math.round((summaryData.pendingOrders / summaryData.totalOrders) * 100) 
    : 0;

  // คำนวณอัตราข้อผิดพลาด API
  const apiErrorRate = summaryData
    ? ((summaryData.systemHealth.apiErrors / summaryData.systemHealth.apiRequests) * 100).toFixed(2)
    : '0';

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* แถวแรก: การ์ดสรุปภาพรวม */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Package className="h-4 w-4 mr-2 text-purple-600" />
                    สถานะพัสดุทั้งหมด
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{summaryData.totalParcels.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground ml-2">ชิ้น</span>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {summaryData.parcelSuccessRate}% สำเร็จ
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 mt-3 text-center text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-yellow-600">{summaryData.pendingParcels}</span>
                      <span className="text-gray-500">รอส่ง</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600">{summaryData.inTransitParcels}</span>
                      <span className="text-gray-500">กำลังส่ง</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-green-600">{summaryData.deliveredParcels}</span>
                      <span className="text-gray-500">ส่งแล้ว</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-red-600">{summaryData.returnedParcels}</span>
                      <span className="text-gray-500">ตีกลับ</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                    คำสั่งซื้อและการจัดส่ง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{summaryData.totalOrders.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground ml-2">รายการ</span>
                    </div>
                    <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      {summaryData.avgDeliveryTime} เฉลี่ย
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>รอดำเนินการ ({summaryData.pendingOrders} รายการ)</span>
                      <span>{pendingOrderPercentage}%</span>
                    </div>
                    <Progress value={pendingOrderPercentage} className="h-1.5 bg-blue-100" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    รายได้และธุรกรรม
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">฿{(summaryData.totalRevenue / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-xs text-green-600 mb-1">
                        <ChevronUp className="h-3 w-3 mr-1" />
                        <span>12.5% จากเดือนก่อน</span>
                      </div>
                      <div className="text-xs text-gray-500">฿{summaryData.averageOrderValue.toLocaleString()} เฉลี่ย/ออเดอร์</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between bg-green-50 rounded-md p-2">
                    <div className="text-xs text-gray-700">รายได้ COD</div>
                    <div className="font-medium text-sm">฿{(summaryData.codRevenue / 1000).toFixed(0)}K</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Users className="h-4 w-4 mr-2 text-orange-600" />
                    ผู้ใช้งานและร้านค้า
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-3xl font-bold">{summaryData.totalUsers}</div>
                      <div className="text-xs text-gray-500 mt-1">ผู้ใช้ทั้งหมด</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-orange-600">+{summaryData.newUsersToday}</div>
                      <div className="text-xs text-gray-500">วันนี้</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>ผู้ใช้แอคทีฟ</span>
                      <span>{activeUserPercentage}% ({summaryData.activeUsers} คน)</span>
                    </div>
                    <Progress value={activeUserPercentage} className="h-1.5 bg-orange-100" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* แถวที่สอง: แท็บสุขภาพระบบและกิจกรรมล่าสุด */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-purple-600" />
                      สุขภาพระบบ
                    </CardTitle>
                    <CardDescription>สถานะและประสิทธิภาพของระบบ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span>การใช้งานฐานข้อมูล</span>
                          <span className={`font-medium ${
                            summaryData.systemHealth.databaseUsage > 80 
                              ? 'text-red-500' 
                              : summaryData.systemHealth.databaseUsage > 60 
                              ? 'text-yellow-500' 
                              : 'text-green-500'
                          }`}>{summaryData.systemHealth.databaseUsage}%</span>
                        </div>
                        <Progress 
                          value={summaryData.systemHealth.databaseUsage} 
                          className={`h-2 ${
                            summaryData.systemHealth.databaseUsage > 80 
                              ? 'bg-red-100' 
                              : summaryData.systemHealth.databaseUsage > 60 
                              ? 'bg-yellow-100' 
                              : 'bg-green-100'
                          }`}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">เวลาทำงานของเซิร์ฟเวอร์</span>
                        <span className="font-medium">{summaryData.systemHealth.serverUptime}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">API Requests (24h)</span>
                        <span className="font-medium">{summaryData.systemHealth.apiRequests.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">อัตราข้อผิดพลาด API</span>
                        <span className={`font-medium ${
                          parseFloat(apiErrorRate) > 1 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {apiErrorRate}%
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">สถานะบริการ</h4>
                        <div className="space-y-2">
                          {summaryData.systemHealth.serviceStatus && (
                            <>
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center">
                                  <Truck className="h-4 w-4 mr-2 text-gray-600" />
                                  <span className="text-sm">Flash Express API</span>
                                </div>
                                <Badge variant={summaryData.systemHealth.serviceStatus.flashExpress === 'operational' ? 'outline' : 
                                              summaryData.systemHealth.serviceStatus.flashExpress === 'degraded' ? 'secondary' : 'destructive'}>
                                  {summaryData.systemHealth.serviceStatus.flashExpress === 'operational' ? 'พร้อมใช้งาน' : 
                                   summaryData.systemHealth.serviceStatus.flashExpress === 'degraded' ? 'ประสิทธิภาพลดลง' : 'ไม่สามารถใช้งานได้'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
                                  <span className="text-sm">ระบบชำระเงิน</span>
                                </div>
                                <Badge variant={summaryData.systemHealth.serviceStatus.payment === 'operational' ? 'outline' : 
                                              summaryData.systemHealth.serviceStatus.payment === 'degraded' ? 'secondary' : 'destructive'}>
                                  {summaryData.systemHealth.serviceStatus.payment === 'operational' ? 'พร้อมใช้งาน' : 
                                   summaryData.systemHealth.serviceStatus.payment === 'degraded' ? 'ประสิทธิภาพลดลง' : 'ไม่สามารถใช้งานได้'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center">
                                  <Package className="h-4 w-4 mr-2 text-gray-600" />
                                  <span className="text-sm">ระบบติดตามพัสดุ</span>
                                </div>
                                <Badge variant={summaryData.systemHealth.serviceStatus.tracking === 'operational' ? 'outline' : 
                                              summaryData.systemHealth.serviceStatus.tracking === 'degraded' ? 'secondary' : 'destructive'}>
                                  {summaryData.systemHealth.serviceStatus.tracking === 'operational' ? 'พร้อมใช้งาน' : 
                                   summaryData.systemHealth.serviceStatus.tracking === 'degraded' ? 'ประสิทธิภาพลดลง' : 'ไม่สามารถใช้งานได้'}
                                </Badge>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-2 flex gap-2">
                        <Button variant="outline" size="sm" className="w-full flex items-center">
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          รีเฟรช
                        </Button>
                        <Button variant="secondary" size="sm" className="w-full">
                          รายละเอียด
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>กิจกรรมล่าสุด</CardTitle>
                    <CardDescription>การทำงานล่าสุดในระบบ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {summaryData.recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0">
                            <Badge variant={getActivityBadgeVariant(activity.type)} className="h-8 w-8 rounded-full flex items-center justify-center p-2">
                              {getActivityIcon(activity.type)}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.action}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.user} • {activity.details && <span>{activity.details} • </span>}{activity.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-2 text-center">
                        <Button variant="ghost" size="sm">
                          ดูกิจกรรมทั้งหมด
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* แถวที่สาม: แผนภูมิการจัดส่งและพื้นที่จัดส่ง */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-purple-600" />
                    ประสิทธิภาพการจัดส่ง
                  </CardTitle>
                  <CardDescription>อัตราการจัดส่งตรงเวลาเทียบกับการจัดส่งล่าช้า</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end relative pt-6">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pt-6">
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                    </div>
                    
                    {summaryData.deliveryPerformance.map((point, index, array) => {
                      const total = point.onTime + point.delayed;
                      const onTimeHeight = (point.onTime / total) * 90;
                      const delayedHeight = (point.delayed / total) * 90;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center h-full">
                          <div className="flex flex-col w-full max-w-[50px] items-center">
                            <div 
                              className="w-full bg-red-400 rounded-t-sm mx-auto"
                              style={{ height: `${delayedHeight}%` }}
                            ></div>
                            <div 
                              className="w-full bg-green-500 mx-auto"
                              style={{ height: `${onTimeHeight}%` }}
                            ></div>
                          </div>
                          <div className="text-xs mt-2 text-gray-600">
                            {new Date(point.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }).split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {Math.round((point.onTime / (point.onTime + point.delayed)) * 100)}%
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* คำอธิบายกราฟ */}
                    <div className="absolute top-0 right-0 flex items-center space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 mr-1"></div>
                        <span>ตรงเวลา</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-400 mr-1"></div>
                        <span>ล่าช้า</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                    พื้นที่การจัดส่งยอดนิยม
                  </CardTitle>
                  <CardDescription>จังหวัดที่มีการจัดส่งสินค้ามากที่สุด</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summaryData.topDestinations.map((destination, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-10 text-sm font-medium">{index + 1}.</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium">{destination.name}</div>
                            <div className="text-sm text-muted-foreground">{destination.count} พัสดุ</div>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full" 
                              style={{ width: `${destination.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-right mt-0.5 text-muted-foreground">
                            {destination.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-2 border-t mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        ดูรายงานพื้นที่เพิ่มเติม
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* แถวที่สี่: แนวโน้มผู้ใช้และคำสั่งซื้อ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-orange-600" />
                    การเติบโตของผู้ใช้งาน
                  </CardTitle>
                  <CardDescription>จำนวนผู้ใช้งานในช่วง 7 วันที่ผ่านมา</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] flex items-end">
                    {summaryData.userGrowth.map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div 
                          className="w-full max-w-[40px] bg-orange-500 rounded-t-md mx-auto"
                          style={{ 
                            height: `${(point.value / Math.max(...summaryData.userGrowth.map(p => p.value))) * 75}%`,
                            opacity: 0.6 + (index / (summaryData.userGrowth.length * 2))
                          }}
                        ></div>
                        <div className="text-xs mt-2 text-gray-600">
                          {new Date(point.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }).split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-gray-500">{point.value}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center items-center mt-2 text-xs text-gray-500">
                    <div className="bg-orange-50 text-orange-800 px-2 py-1 rounded-full">
                      อัตราการเติบโต: +{summaryData.userGrowthRate}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                    แนวโน้มคำสั่งซื้อ
                  </CardTitle>
                  <CardDescription>จำนวนคำสั่งซื้อในช่วง 7 วันที่ผ่านมา</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] flex items-end relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                      <div className="border-b border-dashed border-gray-200 h-0"></div>
                    </div>
                    
                    {summaryData.orderTrend.map((point, index, array) => {
                      const min = Math.min(...array.map(p => p.value));
                      const max = Math.max(...array.map(p => p.value));
                      const normalized = ((point.value - min) / (max - min)) * 80 + 10;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div 
                            className="w-full max-w-[40px] bg-blue-500 rounded-t-md mx-auto"
                            style={{ 
                              height: `${normalized}%`,
                              opacity: 0.6 + (index / (array.length * 2))
                            }}
                          ></div>
                          <div className="text-xs mt-2 text-gray-600">
                            {new Date(point.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }).split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-gray-500">{point.value}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-center items-center mt-2 text-xs text-gray-500">
                    <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded-full">
                      เพิ่มขึ้น {summaryData.orderTrend[summaryData.orderTrend.length - 1].value - summaryData.orderTrend[0].value} รายการในสัปดาห์นี้
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;