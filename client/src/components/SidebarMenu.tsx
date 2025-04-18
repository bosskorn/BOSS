import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';

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
      path: '/order-list', 
      icon: 'fa-clipboard-list', 
      label: 'คำสั่งซื้อทั้งหมด', 
    },
    { 
      path: '/create-order', 
      icon: 'fa-plus-circle', 
      label: 'สร้างออเดอร์' 
    },
    { 
      path: '/parcel-list', 
      icon: 'fa-box-open', 
      label: 'รายการพัสดุ' 
    },
    { 
      path: '/claims-list', 
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
    { 
      path: '/settings', 
      icon: 'fa-cog', 
      label: 'ตั้งค่า' 
    },
    { 
      path: '/topup', 
      icon: 'fa-plus-circle', 
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
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 text-white p-4">
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
          
          <p className="text-sm opacity-80 text-white mt-2 text-center">ระบบจัดการขนส่ง PURPLEDASH</p>

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
                <Link 
                  href={item.path}
                  className={`flex items-center px-4 py-2 text-sm hover:bg-purple-50 ${
                    location === item.path ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
                  }`}
                  onClick={onClose}
                >
                  <i className={`fa-solid ${item.icon} w-5 mr-3 ${location === item.path ? 'text-purple-600' : 'text-gray-500'}`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ส่วนล่าง */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-purple-700 font-semibold">PURPLE</span><span className="text-purple-500 font-semibold">DASH</span>
            </div>
            <span className="text-xs text-gray-500">v1.5.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;