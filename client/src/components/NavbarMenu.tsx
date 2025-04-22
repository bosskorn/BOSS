import React, { useState, useEffect, useRef } from 'react';
import { Link, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface NavbarMenuProps {
  onToggleSidebar: () => void;
}

const NavbarMenu: React.FC<NavbarMenuProps> = ({ onToggleSidebar }) => {
  // State for active dropdown and mobile menu
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // ใช้ข้อมูลผู้ใช้จาก Auth Context
  const { user } = useAuth();
  
  // Reference to navbar element for click outside detection
  const navbarRef = useRef<HTMLElement>(null);
  
  // Current route checks
  const [isDashboard] = useRoute('/dashboard');
  const [isProductsList] = useRoute('/product-list');
  const [isProductCreate] = useRoute('/product-create');
  const [isCategoryManage] = useRoute('/category-manage');
  const [isOrdersList] = useRoute('/orders-all');
  const [isCreateOrder] = useRoute('/create-order');
  const [isParcelList] = useRoute('/parcel-list');
  const [isClaimsList] = useRoute('/claims-list');
  const [isBulkOrderImport] = useRoute('/bulk-order-import');
  
  // Open dropdown on hover or click
  const openDropdown = (name: string) => {
    setActiveDropdown(name);
  };
  
  // Close dropdown function
  const closeDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    }
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    const menu = document.querySelector('.navbar-menu');
    if (menu) {
      menu.classList.toggle('show');
    }
    
    // เพิ่มคลาสให้กับ body เพื่อป้องกันการเลื่อนพื้นหลัง
    if (!mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  };
  
  // Close all dropdowns
  const closeAllDropdowns = () => {
    setActiveDropdown(null);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        closeAllDropdowns();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // ปิดเมนูมือถือเมื่อออกจากคอมโพเนนต์
  useEffect(() => {
    return () => {
      // คืนค่าสถานะเริ่มต้นเมื่อคอมโพเนนต์ถูกทำลาย
      document.body.classList.remove('menu-open');
    };
  }, []);
  
  // ปิดเมนูมือถือเมื่อคลิกที่ลิงก์ในเมนู
  const handleMenuLinkClick = () => {
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  return (
    <nav className="shipsync-navbar" ref={navbarRef}>
      {/* Logo Section */}
      <div className="navbar-brand">
        <Link href="/" className="logo-link">
          <div className="logo-container">
            <div className="logo-icon">
              <i className="fa-solid fa-truck-fast mr-2 text-purple-600"></i>
            </div>
            <div className="logo-text ml-2">
              <span className="logo-main">ShipSync</span>
              <span className="logo-sub">Delivery System</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Main Menu */}
      <ul className={`navbar-menu ${mobileMenuOpen ? 'show' : ''}`}>
        {/* Dashboard */}
        <li className="menu-item">
          <Link 
            href="/dashboard" 
            className={`menu-link ${isDashboard ? 'active' : ''}`}
            onClick={handleMenuLinkClick}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span className="menu-text">Dashboard</span>
          </Link>
        </li>
        
        {/* Orders Dropdown */}
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('orders')}
          onMouseLeave={() => closeDropdown('orders')}
        >
          <a 
            href="#" 
            className={`menu-link dropdown-toggle ${(isOrdersList || isCreateOrder || isParcelList || isClaimsList || isBulkOrderImport) ? 'active' : ''}`}
            onClick={(e) => {e.preventDefault(); activeDropdown === 'orders' ? closeDropdown('orders') : openDropdown('orders');}}
            aria-expanded={activeDropdown === 'orders'}
          >
            <i className="fas fa-clipboard-list"></i>
            <span className="menu-text">คำสั่งซื้อ</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'orders' ? 'show' : ''}`}>
            <li>
              <Link 
                href="/orders-all" 
                className={isOrdersList ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-list-ul"></i> คำสั่งซื้อทั้งหมด
              </Link>
            </li>
            <li>
              <Link 
                href="/create-order" 
                className={isCreateOrder ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-plus-circle"></i> สร้างออเดอร์
              </Link>
            </li>
            <li>
              <Link href="/parcel-list" className={isParcelList ? 'active' : ''}>
                <i className="fas fa-box-open"></i> รายการพัสดุ
              </Link>
            </li>
            <li>
              <Link href="/claims-list" className={isClaimsList ? 'active' : ''}>
                <i className="fas fa-shield-alt"></i> รายการเคลมพัสดุ
              </Link>
            </li>
            <li>
              <Link 
                href="/bulk-order-import" 
                className={isBulkOrderImport ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-file-import"></i> นำเข้าออเดอร์ด้วยไฟล์ Excel
              </Link>
            </li>
          </ul>
        </li>
        
        {/* Products Dropdown */}
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('products')}
          onMouseLeave={() => closeDropdown('products')}
        >
          <a 
            href="#" 
            className={`menu-link dropdown-toggle ${(isProductsList || isProductCreate || isCategoryManage) ? 'active' : ''}`}
            onClick={(e) => {e.preventDefault(); activeDropdown === 'products' ? closeDropdown('products') : openDropdown('products');}}
            aria-expanded={activeDropdown === 'products'}
          >
            <i className="fas fa-boxes"></i>
            <span className="menu-text">สินค้า</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'products' ? 'show' : ''}`}>
            <li>
              <Link href="/product-list" className={isProductsList ? 'active' : ''}>
                <i className="fas fa-tags"></i> สินค้าทั้งหมด
              </Link>
            </li>
            <li>
              <Link href="/product-create" className={isProductCreate ? 'active' : ''}>
                <i className="fas fa-plus-square"></i> สร้างสินค้า
              </Link>
            </li>
            <li>
              <Link href="/category-manage" className={isCategoryManage ? 'active' : ''}>
                <i className="fas fa-folder-plus"></i> หมวดหมู่สินค้า
              </Link>
            </li>
          </ul>
        </li>
        
        {/* Reports Dropdown */}
        {/* ซ่อนเมนูรายงานตามต้องการ
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('reports')}
          onMouseLeave={() => closeDropdown('reports')}
        >
          <a 
            href="#" 
            className="menu-link dropdown-toggle"
            onClick={(e) => {e.preventDefault(); activeDropdown === 'reports' ? closeDropdown('reports') : openDropdown('reports');}}
            aria-expanded={activeDropdown === 'reports'}
          >
            <i className="fas fa-chart-bar"></i>
            <span className="menu-text">รายงาน</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'reports' ? 'show' : ''}`}>
            <li>
              <Link href="/reports/overview">
                <i className="fas fa-chart-pie"></i> ภาพรวมรายงาน
              </Link>
            </li>
            <li>
              <Link href="/reports/by-courier">
                <i className="fas fa-truck"></i> ตามขนส่ง
              </Link>
            </li>
            <li>
              <Link href="/reports/by-area">
                <i className="fas fa-map-marked-alt"></i> ตามพื้นที่
              </Link>
            </li>
            <li>
              <Link href="/reports/cod">
                <i className="fas fa-money-bill-wave"></i> รายงาน COD
              </Link>
            </li>
            <li>
              <Link href="/reports/returns">
                <i className="fas fa-undo"></i> พัสดุตีกลับ
              </Link>
            </li>
          </ul>
        </li>
        */}
        
        {/* Account */}
        <li className="menu-item account-item">
          <button 
            onClick={(e) => {
              onToggleSidebar();
              if (mobileMenuOpen) {
                toggleMobileMenu(); // ปิดเมนูมือถือเมื่อกดปุ่มบัญชี
              }
            }} 
            className="menu-link"
          >
            <div className="flex items-center">
              <i className="fas fa-user-circle text-purple-600 mr-1"></i>
              <span className="menu-text">
                {user ? 'บัญชีของฉัน' : 'บัญชี'}
              </span>
            </div>
          </button>
        </li>
      </ul>
      
      {/* Mobile Toggle */}
      <button className="mobile-toggle" onClick={toggleMobileMenu}>
        <i className="fas fa-bars"></i>
      </button>
    </nav>
  );
};

export default NavbarMenu;