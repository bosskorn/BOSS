import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

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

  // สำหรับ dropdown และ sidebar
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // โหลดข้อมูลแดชบอร์ดเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ฟังก์ชันเรียกข้อมูลแดชบอร์ดจาก API
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // สำหรับการสาธิต ใช้ข้อมูลจำลอง
      // ในการใช้งานจริง ควรเปลี่ยนเป็น await axios.get('/api/dashboard/summary')
      
      // ข้อมูลจำลองสำหรับรายได้วันนี้และเดือนนี้
      const todayTotal = 25850.50;
      const monthTotal = 358920.75;
      
      // ข้อมูลจำลองสำหรับรายได้ย้อนหลัง 7 วัน
      const last7Days: DailySale[] = [
        { date: '2023-04-12', total: 15240.00 },
        { date: '2023-04-13', total: 18650.75 },
        { date: '2023-04-14', total: 22450.50 },
        { date: '2023-04-15', total: 19875.25 },
        { date: '2023-04-16', total: 23150.00 },
        { date: '2023-04-17', total: 24780.50 },
        { date: '2023-04-18', total: 25850.50 }
      ];
      
      // ข้อมูลจำลองสำหรับคำสั่งซื้อล่าสุด
      const latestOrders: Order[] = [
        { id: 'ORD-20230418-001', customer: 'บริษัท เอ็กซ์วาย จำกัด', total: 5680.00, date: '2023-04-18 14:30:25', status: 'processing' },
        { id: 'ORD-20230418-002', customer: 'คุณสมชาย มีสุข', total: 1250.50, date: '2023-04-18 13:15:10', status: 'pending' },
        { id: 'ORD-20230418-003', customer: 'บริษัท ไทยเทรด จำกัด', total: 8950.25, date: '2023-04-18 11:45:18', status: 'shipped' },
        { id: 'ORD-20230417-001', customer: 'คุณสมหญิง รักดี', total: 3450.00, date: '2023-04-17 16:20:32', status: 'delivered' },
        { id: 'ORD-20230417-002', customer: 'ห้างหุ้นส่วน พัฒนา', total: 12750.75, date: '2023-04-17 15:10:45', status: 'cancelled' }
      ];
      
      // อัปเดตข้อมูลแดชบอร์ด
      setSummaryData({
        todayTotal,
        monthTotal,
        last7Days,
        latestOrders
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // สลับการแสดงผล dropdown
  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // สลับการแสดงผล sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // จำลองการออกจากระบบ
  const handleLogout = () => {
    console.log('Logging out...');
    // นำทางไปยังหน้าล็อกอิน (ในการใช้งานจริงควรทำการ clear token)
    window.location.href = '/auth';
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
    <div className="min-h-screen bg-gray-100 font-kanit">
      {/* ส่วนหัวและเมนู */}
      <header className="bg-white shadow-md">
        <div className="container px-4 py-3 mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-truck-fast text-green-600 text-xl"></i>
            <h1 className="text-xl font-semibold">ระบบจัดการขนส่ง</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleDropdown('products')}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <i className="fa-solid fa-boxes-stacked"></i>
              <span>สินค้า</span>
              <i className={`fa-solid fa-caret-down ml-1 transition-transform ${activeDropdown === 'products' ? 'rotate-180' : ''}`}></i>
            </button>
            <button 
              onClick={toggleSidebar}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <i className="fa-solid fa-user"></i>
              <span>บัญชี</span>
            </button>
          </div>
        </div>
        
        {/* Dropdown เมนูสินค้า */}
        {activeDropdown === 'products' && (
          <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border border-gray-200 right-10 w-48">
            <div className="py-1">
              <Link href="/product-list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-tags mr-2"></i>สินค้าทั้งหมด
              </Link>
              <Link href="/product-create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-plus-square mr-2"></i>สร้างสินค้า
              </Link>
              <Link href="/category-manage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-folder-plus mr-2"></i>เพิ่มหมวดหมู่สินค้า
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar */}
      {sidebarVisible && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleSidebar}></div>
          <div className="relative flex flex-col w-72 max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">บัญชีผู้ใช้</h2>
              <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-200">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="flex flex-col p-4 border-b">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div>
                  <p className="font-medium">ผู้ใช้ทดสอบระบบ</p>
                  <p className="text-sm text-gray-500">ผู้ดูแลระบบ</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="text-sm flex items-center">
                  <i className="fa-solid fa-wallet mr-2 text-green-600"></i> ยอดเงินคงเหลือ:
                </span>
                <span className="font-semibold">0.00 บาท</span>
              </div>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-1">
                <li>
                  <a href="/profile" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                    <i className="fa-solid fa-user-gear w-5 mr-2"></i> ข้อมูลผู้ใช้
                  </a>
                </li>
                <li>
                  <a href="/topup" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                    <i className="fa-solid fa-credit-card w-5 mr-2"></i> เติมเครดิต
                  </a>
                </li>
                <li>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center px-3 py-2 text-sm rounded-md text-left w-full hover:bg-gray-100"
                  >
                    <i className="fa-solid fa-right-from-bracket w-5 mr-2"></i> ออกจากระบบ
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* เนื้อหาหลัก */}
      <main className="container mx-auto p-4 md:p-6">
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
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
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
                      const height = (day.total / maxValue) * 100;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-10/12 bg-green-500 rounded-t-md"
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

            {/* ตารางคำสั่งซื้อล่าสุด */}
            <div className="mt-8 bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    คำสั่งซื้อล่าสุด
                  </h2>
                  <Link href="/orders">
                    <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      ดูทั้งหมด
                    </button>
                  </Link>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เลขที่คำสั่งซื้อ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ลูกค้า
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สั่งซื้อ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        มูลค่า
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summaryData.latestOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(order.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/orders/${order.id}`}>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              ดูรายละเอียด
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;