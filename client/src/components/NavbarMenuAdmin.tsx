import React, { useState, useEffect, useRef } from 'react';
import { Link, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import '../styles/admin-navbar.css';

interface NavbarMenuAdminProps {
  onToggleSidebar: () => void;
}

const NavbarMenuAdmin: React.FC<NavbarMenuAdminProps> = ({ onToggleSidebar }) => {
  // State for active dropdown and mobile menu
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // ใช้ข้อมูลผู้ใช้จาก Auth Context
  const { user } = useAuth();
  
  // Reference to navbar element for click outside detection
  const navbarRef = useRef<HTMLElement>(null);
  
  // Current route checks
  const [isAdminDashboard] = useRoute('/admin-dashboard');
  const [isUserManage] = useRoute('/admin/users');
  const [isOrdersManage] = useRoute('/admin/orders');
  const [isShippingProviders] = useRoute('/admin/shipping-providers');
  const [isProductsManage] = useRoute('/admin/products');
  const [isCategoriesManage] = useRoute('/admin/categories');
  const [isReports] = useRoute('/admin/reports');
  const [isLogs] = useRoute('/admin/logs');
  const [isPaymentSettings] = useRoute('/admin/settings/payments');
  const [isApiSettings] = useRoute('/admin/settings/api');
  const [isSecuritySettings] = useRoute('/admin/settings/security');
  const [isSystemSettings] = useRoute('/admin/settings/system');
  const [isBackup] = useRoute('/admin/backup');
  
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
    const menu = document.querySelector('.admin-navbar-menu');
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
    <nav className="admin-navbar" ref={navbarRef}>
      {/* Logo Section */}
      <div className="navbar-brand">
        <Link href="/admin-dashboard" className="logo-link">
          <div className="logo-container">
            <div className="logo-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="logo-text">
              <span className="logo-main">PURPLEDASH</span>
              <span className="logo-sub">ระบบผู้ดูแล</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Main Menu - Added display: flex to make it visible */}
      <ul className={`admin-navbar-menu ${mobileMenuOpen ? 'show' : ''}`} style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
        {/* Dashboard */}
        <li className="menu-item">
          <Link 
            href="/admin-dashboard" 
            className={`menu-link ${isAdminDashboard ? 'active' : ''}`}
            onClick={handleMenuLinkClick}
          >
            <i className="fas fa-chart-pie"></i>
            <span className="menu-text">แดชบอร์ดผู้ดูแล</span>
          </Link>
        </li>

        {/* จัดการผู้ใช้งาน */}
        <li className="menu-item">
          <Link 
            href="/admin/users" 
            className={`menu-link ${isUserManage ? 'active' : ''}`}
            onClick={handleMenuLinkClick}
          >
            <i className="fas fa-users"></i>
            <span className="menu-text">จัดการผู้ใช้งาน</span>
          </Link>
        </li>
        
        {/* Order Management */}
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('orders-admin')}
          onMouseLeave={() => closeDropdown('orders-admin')}
        >
          <a 
            href="#" 
            className={`menu-link dropdown-toggle ${isOrdersManage ? 'active' : ''}`}
            onClick={(e) => {e.preventDefault(); activeDropdown === 'orders-admin' ? closeDropdown('orders-admin') : openDropdown('orders-admin');}}
            aria-expanded={activeDropdown === 'orders-admin'}
          >
            <i className="fas fa-clipboard-list"></i>
            <span className="menu-text">จัดการคำสั่งซื้อ</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'orders-admin' ? 'show' : ''}`}>
            <li>
              <Link 
                href="/admin/orders" 
                className={isOrdersManage ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-list-ul"></i> คำสั่งซื้อทั้งหมด
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/orders/pending" 
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-clock"></i> รออนุมัติ
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/orders/problems" 
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-exclamation-triangle"></i> มีปัญหา
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/shipping-providers" 
                className={isShippingProviders ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-truck-loading"></i> ผู้ให้บริการขนส่ง
              </Link>
            </li>
          </ul>
        </li>
        
        {/* การจัดการสินค้าและหมวดหมู่ */}
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('products-admin')}
          onMouseLeave={() => closeDropdown('products-admin')}
        >
          <a 
            href="#" 
            className={`menu-link dropdown-toggle ${(isProductsManage || isCategoriesManage) ? 'active' : ''}`}
            onClick={(e) => {e.preventDefault(); activeDropdown === 'products-admin' ? closeDropdown('products-admin') : openDropdown('products-admin');}}
            aria-expanded={activeDropdown === 'products-admin'}
          >
            <i className="fas fa-boxes"></i>
            <span className="menu-text">จัดการสินค้า</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'products-admin' ? 'show' : ''}`}>
            <li>
              <Link 
                href="/admin/products" 
                className={isProductsManage ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-tags"></i> จัดการสินค้าทั้งหมด
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/categories" 
                className={isCategoriesManage ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-folder-open"></i> จัดการหมวดหมู่
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/products/pending" 
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-exclamation-circle"></i> สินค้ารออนุมัติ
              </Link>
            </li>
          </ul>
        </li>
        
        {/* การตั้งค่า */}
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('settings-admin')}
          onMouseLeave={() => closeDropdown('settings-admin')}
        >
          <a 
            href="#" 
            className={`menu-link dropdown-toggle ${(isPaymentSettings || isApiSettings || isSecuritySettings || isSystemSettings) ? 'active' : ''}`}
            onClick={(e) => {e.preventDefault(); activeDropdown === 'settings-admin' ? closeDropdown('settings-admin') : openDropdown('settings-admin');}}
            aria-expanded={activeDropdown === 'settings-admin'}
          >
            <i className="fas fa-cogs"></i>
            <span className="menu-text">การตั้งค่า</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'settings-admin' ? 'show' : ''}`}>
            <li>
              <Link 
                href="/admin/settings/payments" 
                className={isPaymentSettings ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-credit-card"></i> ตั้งค่าการชำระเงิน
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/settings/api" 
                className={isApiSettings ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-code"></i> การเชื่อมต่อ API
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/settings/security" 
                className={isSecuritySettings ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-shield-alt"></i> ความปลอดภัย
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/settings/system" 
                className={isSystemSettings ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-sliders-h"></i> ตั้งค่าระบบ
              </Link>
            </li>
          </ul>
        </li>
        
        {/* รายงานและล็อก */}
        <li 
          className="menu-item dropdown"
          onMouseEnter={() => openDropdown('reports-admin')}
          onMouseLeave={() => closeDropdown('reports-admin')}
        >
          <a 
            href="#" 
            className={`menu-link dropdown-toggle ${(isReports || isLogs) ? 'active' : ''}`}
            onClick={(e) => {e.preventDefault(); activeDropdown === 'reports-admin' ? closeDropdown('reports-admin') : openDropdown('reports-admin');}}
            aria-expanded={activeDropdown === 'reports-admin'}
          >
            <i className="fas fa-chart-bar"></i>
            <span className="menu-text">รายงาน/กิจกรรม</span>
            <i className="fas fa-chevron-down dropdown-arrow"></i>
          </a>
          
          <ul className={`dropdown-menu ${activeDropdown === 'reports-admin' ? 'show' : ''}`}>
            <li>
              <Link 
                href="/admin/reports" 
                className={isReports ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-chart-line"></i> รายงานระบบ
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/logs" 
                className={isLogs ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-clipboard-list"></i> บันทึกกิจกรรม
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/backup" 
                className={isBackup ? 'active' : ''}
                onClick={handleMenuLinkClick}
              >
                <i className="fas fa-database"></i> สำรองข้อมูล
              </Link>
            </li>
          </ul>
        </li>
        
        {/* โหมดผู้ใช้ */}
        <li className="menu-item">
          <Link 
            href="/dashboard" 
            className="menu-link"
            onClick={handleMenuLinkClick}
          >
            <i className="fas fa-user"></i>
            <span className="menu-text">โหมดผู้ใช้</span>
          </Link>
        </li>
        
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
            <i className="fas fa-user-shield"></i>
            <span className="menu-text">
              {user ? (user.fullname || user.username) : 'ผู้ดูแลระบบ'}
              <span className="admin-badge">ADMIN</span>
            </span>
          </button>
        </li>
      </ul>
      
      {/* Mobile Toggle with Text */}
      <div className="mobile-menu-container">
        <span className="mobile-menu-text">กดเพื่อเปิดเมนูผู้ดูแล</span>
        <button className="mobile-toggle" onClick={toggleMobileMenu}>
          <i className="fas fa-shield-alt"></i>
        </button>
      </div>
    </nav>
  );
};

export default NavbarMenuAdmin;