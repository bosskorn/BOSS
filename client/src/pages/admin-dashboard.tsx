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
  AlertTriangle,
  Truck,
  Settings,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

// ประเภทข้อมูลสรุปสำหรับแดชบอร์ดผู้ดูแลระบบ
interface AdminSummaryData {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalParcels: number;
  systemHealth: {
    databaseUsage: number;
    serverUptime: string;
    apiRequests: number;
    apiErrors: number;
  };
  recentActivities: Activity[];
  userGrowth: DataPoint[];
  orderTrend: DataPoint[];
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
  totalUsers: 158,
  activeUsers: 92,
  totalOrders: 1243,
  pendingOrders: 37,
  totalRevenue: 2584350.75,
  totalParcels: 1892,
  systemHealth: {
    databaseUsage: 68,
    serverUptime: "15 วัน 7 ชม.",
    apiRequests: 12458,
    apiErrors: 24,
  },
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">ผู้ใช้ทั้งหมด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{summaryData.totalUsers}</span>
                      <span className="text-sm text-muted-foreground ml-2">คน</span>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>ผู้ใช้แอคทีฟ</span>
                      <span>{activeUserPercentage}%</span>
                    </div>
                    <Progress value={activeUserPercentage} className="h-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">คำสั่งซื้อทั้งหมด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{summaryData.totalOrders}</span>
                      <span className="text-sm text-muted-foreground ml-2">รายการ</span>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>รอดำเนินการ</span>
                      <span>{pendingOrderPercentage}%</span>
                    </div>
                    <Progress value={pendingOrderPercentage} className="h-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">รายได้รวม</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">฿{(summaryData.totalRevenue / 1000000).toFixed(2)}M</span>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center text-xs text-green-500">
                      <ChevronUp className="h-4 w-4" />
                      <span className="ml-1">เพิ่มขึ้น 12.5% จากเดือนที่แล้ว</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">พัสดุทั้งหมด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{summaryData.totalParcels}</span>
                      <span className="text-sm text-muted-foreground ml-2">ชิ้น</span>
                    </div>
                    <Package className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center text-xs text-purple-500">
                      <Truck className="h-4 w-4" />
                      <span className="ml-1">กำลังจัดส่ง {Math.round(summaryData.totalParcels * 0.15)} ชิ้น</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* แถวที่สอง: แท็บสุขภาพระบบและกิจกรรมล่าสุด */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>สุขภาพระบบ</CardTitle>
                    <CardDescription>สถานะและประสิทธิภาพของระบบ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span>การใช้งานฐานข้อมูล</span>
                          <span>{summaryData.systemHealth.databaseUsage}%</span>
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
                      
                      <div className="mt-4">
                        <Button variant="outline" className="w-full">
                          ตรวจสอบเพิ่มเติม
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

            {/* แถวที่สาม: กราฟและแผนภูมิ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>การเติบโตของผู้ใช้งาน</CardTitle>
                  <CardDescription>จำนวนผู้ใช้งานในช่วง 7 วันที่ผ่านมา</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end">
                    {summaryData.userGrowth.map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div 
                          className="w-full max-w-[40px] bg-purple-500 rounded-t-md mx-auto"
                          style={{ 
                            height: `${(point.value / Math.max(...summaryData.userGrowth.map(p => p.value))) * 75}%`,
                            opacity: 0.6 + (index / (summaryData.userGrowth.length * 2))
                          }}
                        ></div>
                        <div className="text-xs mt-2 text-gray-600">
                          {new Date(point.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }).split(' ')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>แนวโน้มคำสั่งซื้อ</CardTitle>
                  <CardDescription>จำนวนคำสั่งซื้อในช่วง 7 วันที่ผ่านมา</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end relative">
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
                            className="w-full max-w-[40px] bg-purple-500 rounded-t-md mx-auto"
                            style={{ 
                              height: `${normalized}%`,
                              opacity: 0.6 + (index / (array.length * 2))
                            }}
                          ></div>
                          <div className="text-xs mt-2 text-gray-600">
                            {new Date(point.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }).split(' ')[0]}
                          </div>
                        </div>
                      );
                    })}
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