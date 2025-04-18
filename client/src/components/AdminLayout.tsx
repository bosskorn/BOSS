import React, { useState } from 'react';
import NavbarMenuAdmin from './NavbarMenuAdmin';
import SidebarMenuAdmin from './SidebarMenuAdmin';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // ตรวจสอบว่าเป็นผู้ดูแลระบบหรือไม่
  if (user && user.role !== 'admin') {
    // ถ้าไม่ใช่ผู้ดูแลระบบ ให้นำทางกลับไปที่หน้า dashboard
    setLocation('/dashboard');
    return null;
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ข้อมูลผู้ใช้สำหรับแสดงใน sidebar
  const userData = user ? {
    name: user.fullname || user.username,
    role: user.role || 'admin',
    balance: Number(user.balance) || 0
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-kanit">
      {/* แถบนำทางด้านบน */}
      <NavbarMenuAdmin onToggleSidebar={toggleSidebar} />
      
      {/* เมนูด้านข้าง (สไลด์เข้าออก) */}
      <SidebarMenuAdmin 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userData={userData}
      />
      
      {/* เนื้อหาหลัก */}
      <main className="flex-grow pt-16">
        {children}
      </main>
      
      {/* ส่วนท้าย */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-2 md:mb-0">
              &copy; {new Date().getFullYear()} PURPLEDASH - ระบบจัดการข้อมูลขนส่งอัจฉริยะ | หน้าผู้ดูแลระบบ
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-500 hover:text-purple-600">
                <i className="fa-solid fa-circle-info mr-1"></i> ช่วยเหลือ
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-600">
                <i className="fa-solid fa-envelope mr-1"></i> ติดต่อทีมงาน
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;