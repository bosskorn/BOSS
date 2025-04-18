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
    <div className="min-h-screen bg-gray-100 font-kanit">
      {/* Navbar ด้านบน */}
      <NavbarMenu onToggleSidebar={toggleSidebar} />
      
      {/* Sidebar ด้านข้าง */}
      <SidebarMenu isOpen={sidebarOpen} onClose={toggleSidebar} />
      
      {/* เนื้อหาหลัก */}
      <main className="container mx-auto p-4 md:p-6 pt-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;