import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  submenu?: MenuItem[];
}

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: {
    name: string;
    role: string;
    balance: number;
  };
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose, userData }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { logoutMutation } = useAuth();
  
  // เปิด/ปิดเมนูย่อย
  const toggleSubmenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path) 
        : [...prev, path]
    );
  };

  // ตรวจจับการคลิกภายนอก sidebar เพื่อปิด
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // เพิ่ม/ลบ class ในเวลาเปิด/ปิด sidebar
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isOpen]);

  // รายการเมนูทั้งหมด
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: 'fa-chart-pie', 
      label: 'แดชบอร์ด', 
    },
    { 
      path: '/orders-all', 
      icon: 'fa-clipboard-list', 
      label: 'คำสั่งซื้อทั้งหมด' 
    },
    { 
      path: '/create-order', 
      icon: 'fa-plus-circle', 
      label: 'สร้างออเดอร์' 
    },
    { 
      path: '/bulk-order-import', 
      icon: 'fa-file-import', 
      label: 'นำเข้าออเดอร์จาก Excel' 
    },
    { 
      path: '/parcel-list', 
      icon: 'fa-box-open', 
      label: 'รายการพัสดุ' 
    },
    { 
      path: '/user-claims', 
      icon: 'fa-shield-halved', 
      label: 'รายการเคลม' 
    },
    { 
      path: '/product-list', 
      icon: 'fa-tags', 
      label: 'สินค้าทั้งหมด' 
    },
    { 
      path: '/product-create', 
      icon: 'fa-plus-square', 
      label: 'สร้างสินค้า' 
    },
    { 
      path: '/category-management', 
      icon: 'fa-folder-plus', 
      label: 'จัดการหมวดหมู่' 
    },
    { 
      path: '#', 
      icon: 'fa-chart-line', 
      label: 'รายงาน',
      submenu: [
        { 
          path: '/reports/overview', 
          icon: 'fa-tachometer-alt', 
          label: 'ภาพรวมรายงาน' 
        },
        { 
          path: '/reports/by-courier', 
          icon: 'fa-shipping-fast', 
          label: 'รายงานตามขนส่ง' 
        },
        { 
          path: '/reports/by-area', 
          icon: 'fa-map-marked-alt', 
          label: 'รายงานตามพื้นที่' 
        },
        { 
          path: '/reports/cod', 
          icon: 'fa-dollar-sign', 
          label: 'รายงาน COD' 
        },
        { 
          path: '/reports/returns', 
          icon: 'fa-undo', 
          label: 'รายงานพัสดุตีกลับ' 
        },
      ]
    },
    { 
      path: '/settings', 
      icon: 'fa-cog', 
      label: 'ตั้งค่า' 
    },
    { 
      path: '/top-up', 
      icon: 'fa-wallet', 
      label: 'เติมเครดิต' 
    },
    { 
      path: '/auth', 
      icon: 'fa-sign-out-alt', 
      label: 'ออกจากระบบ' 
    }
  ];

  return (
    <>
      {/* Overlay เมื่อเปิด Sidebar (จะคลิกปิดได้) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" />
      )}

      {/* Sidebar เมนู */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ส่วนหัวข้อมูลผู้ใช้ */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">บัญชีของฉัน</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <i className="fa-solid fa-user text-2xl"></i>
            </div>
            <div>
              <p className="font-medium">{userData?.name || 'ผู้ใช้'}</p>
              <p className="text-sm opacity-80">{userData?.role || 'ผู้ดูแลระบบ'}</p>
            </div>
          </div>
          
          <p className="text-sm opacity-80 text-white mt-2 text-center">ระบบจัดการขนส่ง BLUEDASH</p>

          <div className="mt-3 px-3 py-2 bg-white bg-opacity-10 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm">เครดิตคงเหลือ</span>
              <span className="font-medium">{userData?.balance?.toLocaleString() || 0} บาท</span>
            </div>
          </div>
        </div>

        {/* รายการเมนู */}
        <div className="py-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                {item.submenu ? (
                  <div>
                    {/* หัวข้อเมนูที่มีเมนูย่อย */}
                    <button
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-blue-50 text-gray-700`}
                      onClick={() => toggleSubmenu(item.path)}
                    >
                      <div className="flex items-center">
                        <i className={`fa-solid ${item.icon} w-5 mr-3 text-gray-500`}></i>
                        <span>{item.label}</span>
                      </div>
                      <i className={`fa-solid ${expandedMenus.includes(item.path) ? 'fa-chevron-down' : 'fa-chevron-right'} text-gray-400 text-xs`}></i>
                    </button>

                    {/* เมนูย่อย */}
                    {expandedMenus.includes(item.path) && (
                      <ul className="mt-1 border-r border-blue-200">
                        {item.submenu.map((subItem) => {
                          const isActive = location === subItem.path;
                          return (
                            <li key={subItem.path}>
                              <Link
                                href={subItem.path}
                                className={`flex items-center pl-10 pr-4 py-2 text-sm ${
                                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-blue-50'
                                }`}
                                onClick={onClose}
                              >
                                <i className={`fa-solid ${subItem.icon} w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}></i>
                                <span className="text-sm">{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link 
                    href={item.path}
                    className={`flex items-center px-4 py-2 text-sm hover:bg-blue-50 ${
                      location === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={onClose}
                  >
                    <i className={`fa-solid ${item.icon} w-5 mr-3 ${location === item.path ? 'text-blue-600' : 'text-gray-500'}`}></i>
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ปุ่มออกจากระบบ */}
        <div className="py-4 px-4">
          <button 
            onClick={() => {
              if (logoutMutation) {
                logoutMutation.mutate();
              }
              onClose();
            }}
            className="w-full flex items-center px-4 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100"
          >
            <i className="fa-solid fa-sign-out-alt w-5 mr-3 text-red-600"></i>
            <span>ออกจากระบบ</span>
          </button>
        </div>

        {/* ส่วนล่าง */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-700 font-semibold">BLUE</span><span className="text-blue-500 font-semibold">DASH</span>
            </div>
            <span className="text-xs text-gray-500">v1.5.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;