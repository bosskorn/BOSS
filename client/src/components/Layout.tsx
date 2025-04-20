import React, { useState } from 'react';
import NavbarMenu from './NavbarMenu';
import SidebarMenu from './SidebarMenu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-kanit">
      {/* Navbar ด้านบน */}
      <NavbarMenu onToggleSidebar={toggleSidebar} />
      
      {/* Sidebar ด้านข้าง */}
      <SidebarMenu isOpen={sidebarOpen} onClose={toggleSidebar} />
      
      {/* เนื้อหาหลัก */}
      <main className="container mx-auto p-4 md:p-6 pt-6">
        {children}
      </main>

      {/* ฟุตเตอร์ */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <i className="fa-solid fa-truck-fast mr-2 text-blue-600"></i>
                <span className="text-blue-700 font-semibold">BLUE</span>
                <span className="text-blue-500 font-semibold">DASH</span>
              </div>
              <p className="text-gray-600 text-sm">© 2025 เสี่ยวไป๋ เอ็กเพรส จัดส่งด่วนทั่วไทย สงวนลิขสิทธิ์.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="delivery-dash">จัดส่งทั่วไทย รวดเร็วทันใจ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;