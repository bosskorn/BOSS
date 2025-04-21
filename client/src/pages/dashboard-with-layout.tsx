import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/use-auth';

interface Order {
  id: string;
  customer: string;
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

interface DailySale {
  date: string;
  total: number;
}

interface SummaryData {
  todayTotal: number;
  monthTotal: number;
  totalOrdersCount: number;
  orderStatusCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  monthShippingTotal: number;
  last7Days: DailySale[];
  latestOrders: Order[];
}

const Dashboard: React.FC = () => {
  // สถานะสำหรับข้อมูลแดชบอร์ด
  const [summaryData, setSummaryData] = useState<SummaryData>({
    todayTotal: 0,
    monthTotal: 0,
    last7Days: [],
    latestOrders: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // โหลดข้อมูลแดชบอร์ดเมื่อคอมโพเนนต์โหลดและมีการล็อกอิน
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  // โหลดข้อมูลแดชบอร์ดใหม่ทุก 30 วินาที (ตรวจสอบข้อมูลล่าสุด)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 วินาที
    
    return () => clearInterval(interval);
  }, [user]);
  
  // ฟังก์ชันเรียกข้อมูลแดชบอร์ดจาก API
  const fetchDashboardData = async () => {
    if (!user) return; // ไม่ดึงข้อมูลถ้าไม่มีการล็อกอิน
    
    setIsLoading(true);
    try {
      // เรียกข้อมูลจริงจาก API
      const response = await api.get('/api/dashboard/summary');
      
      if (response.data.success) {
        const dashboardData = response.data.data;
        console.log('ได้รับข้อมูลแดชบอร์ดจาก API:', dashboardData);
        
        // อัปเดตข้อมูลแดชบอร์ดด้วยข้อมูลจริงจาก API
        setSummaryData({
          todayTotal: dashboardData.todayTotal || 0,
          monthTotal: dashboardData.monthTotal || 0,
          last7Days: dashboardData.last7Days || [],
          latestOrders: dashboardData.latestOrders || []
        });
      } else {
        throw new Error(response.data.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // ตรวจสอบว่าเป็น error ที่เกิดจากการไม่ได้ลงทะเบียน route หรือไม่
      if ((error as any)?.response?.status === 404) {
        console.error('Dashboard API endpoint not found. Check if the route is registered properly.');
        
        // ในกรณีที่ API endpoint ไม่พบ และเป็นการโหลดครั้งแรก แสดงข้อมูลจำลองที่เรียบง่าย
        if (isLoading) {
          setSummaryData({
            todayTotal: 0,
            monthTotal: 0,
            last7Days: Array(7).fill(0).map((_, i) => ({
              date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              total: 0
            })),
            latestOrders: []
          });
        }
      } else {
        // แสดง toast เฉพาะกรณีที่ไม่ใช่ error 404
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ โปรดลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันกำหนดสีตามสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ฟังก์ชันแปลสถานะเป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอดำเนินการ';
      case 'processing':
        return 'กำลังดำเนินการ';
      case 'shipped':
        return 'จัดส่งแล้ว';
      case 'delivered':
        return 'ส่งถึงแล้ว';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  // ฟังก์ชันฟอร์แมตตัวเลขเป็นรูปแบบเงิน
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ฟังก์ชันฟอร์แมตวันที่และเวลา
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          แดชบอร์ด
        </h1>
        <p className="mt-2 text-gray-600">
          ภาพรวมยอดขาย สถิติ และคำสั่งซื้อล่าสุด
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : (
        <>
          {/* บัตรข้อมูลสรุป */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* บัตรข้อมูลยอดขายวันนี้ */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    ยอดขายวันนี้
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {formatCurrency(summaryData.todayTotal)}
                  </h3>
                  <p className="text-sm font-medium text-green-600 mt-1">
                    +4.3% จากเมื่อวาน
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <i className="fa-solid fa-chart-bar text-xl"></i>
                </div>
              </div>
            </div>

            {/* บัตรข้อมูลยอดขายเดือนนี้ */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    ยอดขายเดือนนี้
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {formatCurrency(summaryData.monthTotal)}
                  </h3>
                  <p className="text-sm font-medium text-green-600 mt-1">
                    +12.7% จากเดือนที่แล้ว
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <i className="fa-solid fa-calendar-day text-xl"></i>
                </div>
              </div>
            </div>

            {/* บัตรข้อมูลคำสั่งซื้อทั้งหมด */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    คำสั่งซื้อทั้งหมด
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {summaryData.latestOrders.length}
                  </h3>
                  <p className="text-sm font-medium text-green-600 mt-1">
                    {summaryData.latestOrders.filter(order => order.status === 'pending').length} รายการรอดำเนินการ
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <i className="fa-solid fa-box text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* กราฟและตารางข้อมูล */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* กราฟยอดขาย 7 วันล่าสุด */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ยอดขายย้อนหลัง 7 วัน
              </h2>
              <div className="h-60 relative">
                {/* จำลองกราฟด้วย DIV */}
                <div className="absolute inset-0 flex items-end">
                  {summaryData.last7Days.map((day, index) => {
                    // คำนวณความสูงของแท่งกราฟตามสัดส่วนของยอดขาย
                    const maxValue = Math.max(...summaryData.last7Days.map(d => d.total));
                    const height = maxValue ? (day.total / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-10/12 bg-blue-500 rounded-t-md"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="w-full text-center mt-2">
                          <span className="text-xs text-gray-600 block">
                            {new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-xs font-medium text-gray-800 block mt-1">
                            {day.total.toLocaleString('th-TH')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ข้อมูลสถิติเพิ่มเติม */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                สถิติการขนส่ง
              </h2>
              <div className="space-y-5">
                {/* สถิติอัตราการสำเร็จ */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">อัตราการสำเร็จ</span>
                    <span className="text-sm font-medium text-gray-800">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                {/* สถิติเวลาเฉลี่ยในการจัดส่ง */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">เวลาเฉลี่ยในการจัดส่ง</span>
                    <span className="text-sm font-medium text-gray-800">1.5 วัน</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                
                {/* สถิติอัตราการคืนสินค้า */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">อัตราการคืนสินค้า</span>
                    <span className="text-sm font-medium text-gray-800">2.3%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '2.3%' }}></div>
                  </div>
                </div>
                
                {/* สถิติคะแนนความพึงพอใจ */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">คะแนนความพึงพอใจ</span>
                    <span className="text-sm font-medium text-gray-800">4.8/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ตารางคำสั่งซื้อที่รอดำเนินการ */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                คำสั่งซื้อที่รอดำเนินการ
              </h2>
              <Link href="/orders-all" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                ดูทั้งหมด
              </Link>
            </div>
            
            {/* กรองเฉพาะคำสั่งซื้อที่มีสถานะ pending */}
            {summaryData.latestOrders.filter(order => order.status === 'pending').length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รหัสคำสั่งซื้อ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ลูกค้า
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ยอดรวม
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summaryData.latestOrders
                      .filter(order => order.status === 'pending')
                      .map((order, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/order/${order.id.replace('PD', '')}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {order.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.customer}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(order.total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDateTime(order.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              href={`/order/${order.id.replace('PD', '')}`} 
                              className="text-blue-600 hover:text-blue-800 mr-4"
                            >
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                ดูรายละเอียด
                              </span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">ไม่มีคำสั่งซื้อที่รอดำเนินการ</p>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;