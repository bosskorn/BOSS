import React, { useState, useEffect, useRef } from 'react';
import { Link, useRoute } from 'wouter';

interface NavbarMenuProps {
  onToggleSidebar: () => void;
}

const NavbarMenu: React.FC<NavbarMenuProps> = ({ onToggleSidebar }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Refs สำหรับ dropdowns
  const ordersDropdownRef = useRef<HTMLLIElement>(null);
  const productsDropdownRef = useRef<HTMLLIElement>(null);
  const reportsDropdownRef = useRef<HTMLLIElement>(null);
  
  // ตรวจสอบว่าอยู่ที่หน้าไหนเพื่อไฮไลท์เมนู
  const [isProductsList] = useRoute('/product-list');
  const [isProductCreate] = useRoute('/product-create');
  const [isCategoryManage] = useRoute('/category-manage');
  const [isDashboard] = useRoute('/dashboard');

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown === 'orders' && 
        ordersDropdownRef.current && 
        !ordersDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      } else if (
        activeDropdown === 'products' && 
        productsDropdownRef.current && 
        !productsDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      } else if (
        activeDropdown === 'reports' && 
        reportsDropdownRef.current && 
        !reportsDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <nav className="bg-white shadow-md py-2 px-4 sticky top-0 z-30">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <Link href="/">
            <a className="flex items-center text-xl font-semibold text-gray-800 hover:text-green-600">
              <i className="fa-solid fa-truck-fast mr-2 text-green-600"></i> ระบบจัดการข้อมูลขนส่ง
            </a>
          </Link>
        </div>
        
        <ul className="flex flex-wrap justify-center md:justify-end space-x-1 md:space-x-4">
          <li className="relative">
            <Link href="/dashboard">
              <a className={`flex items-center px-3 py-2 text-sm rounded-md ${isDashboard ? 'bg-gray-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                <i className="fa-solid fa-chart-pie mr-2"></i>
                <span>Dashboard</span>
              </a>
            </Link>
          </li>
          
          <li className="relative">
            <Link href="/topup">
              <a className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                <i className="fa-solid fa-plus-circle mr-2"></i>
                <span>เติมเครดิต</span>
              </a>
            </Link>
          </li>
          
          <li ref={ordersDropdownRef} className="relative">
            <button 
              onClick={() => toggleDropdown('orders')}
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              aria-haspopup="true" 
              aria-expanded={activeDropdown === 'orders'}
            >
              <i className="fa-solid fa-clipboard-list mr-2"></i>
              <span>คำสั่งซื้อ</span>
              <i className={`fa-solid fa-caret-down ml-1 text-xs transition-transform ${activeDropdown === 'orders' ? 'rotate-180' : ''}`}></i>
            </button>
            
            {activeDropdown === 'orders' && (
              <ul className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <li>
                  <Link href="/orders-all">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fa-solid fa-list-ul mr-2"></i>
                      <span>คำสั่งซื้อทั้งหมด</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/create-order">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fa-solid fa-plus-circle mr-2"></i>
                      <span>สร้างออเดอร์</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/parcel-list">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fa-solid fa-box-open mr-2"></i>
                      <span>รายการพัสดุ</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/claims-list">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fa-solid fa-shield-halved mr-2"></i>
                      <span>รายการเคลมพัสดุ</span>
                    </a>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          
          <li ref={productsDropdownRef} className="relative">
            <button 
              onClick={() => toggleDropdown('products')}
              className={`flex items-center px-3 py-2 text-sm rounded-md ${activeDropdown === 'products' || isProductsList || isProductCreate || isCategoryManage ? 'bg-gray-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}
              aria-haspopup="true" 
              aria-expanded={activeDropdown === 'products'}
            >
              <i className="fa-solid fa-boxes-stacked mr-2"></i>
              <span>สินค้า</span>
              <i className={`fa-solid fa-caret-down ml-1 text-xs transition-transform ${activeDropdown === 'products' ? 'rotate-180' : ''}`}></i>
            </button>
            
            {activeDropdown === 'products' && (
              <ul className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <li>
                  <Link href="/product-list">
                    <a className={`block px-4 py-2 text-sm ${isProductsList ? 'bg-gray-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <i className="fa-solid fa-tags mr-2"></i>
                      <span>สินค้าทั้งหมด</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/product-create">
                    <a className={`block px-4 py-2 text-sm ${isProductCreate ? 'bg-gray-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <i className="fa-solid fa-plus-square mr-2"></i>
                      <span>สร้างสินค้า</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/category-manage">
                    <a className={`block px-4 py-2 text-sm ${isCategoryManage ? 'bg-gray-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <i className="fa-solid fa-folder-plus mr-2"></i>
                      <span>เพิ่มหมวดหมู่สินค้า</span>
                    </a>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          
          <li ref={reportsDropdownRef} className="relative">
            <button 
              onClick={() => toggleDropdown('reports')}
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              aria-haspopup="true" 
              aria-expanded={activeDropdown === 'reports'}
            >
              <i className="fa-solid fa-file-alt mr-2"></i>
              <span>รายงาน</span>
              <i className={`fa-solid fa-caret-down ml-1 text-xs transition-transform ${activeDropdown === 'reports' ? 'rotate-180' : ''}`}></i>
            </button>
            
            {activeDropdown === 'reports' && (
              <ul className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <li>
                  <Link href="/reports/overview">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-tachometer-alt mr-2"></i>
                      <span>ภาพรวมรายงาน</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/reports/by-courier">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-shipping-fast mr-2"></i>
                      <span>รายงานตามขนส่ง</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/reports/by-area">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-map-marked-alt mr-2"></i>
                      <span>รายงานตามพื้นที่</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/reports/cod">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-dollar-sign mr-2"></i>
                      <span>รายงาน COD</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/reports/returns">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-undo mr-2"></i>
                      <span>รายงานพัสดุตีกลับ</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/claims-list">
                    <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-shield-alt mr-2"></i>
                      <span>(ดูรายการเคลม)</span>
                    </a>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          
          <li className="relative">
            <button 
              onClick={onToggleSidebar} 
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              <i className="fa-solid fa-user mr-2"></i>
              <span>บัญชี</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavbarMenu;