import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';

interface SidebarMenuAdminProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: {
    name: string;
    role?: string | null;
    balance: number;
  };
}

const SidebarMenuAdmin: React.FC<SidebarMenuAdminProps> = ({ isOpen, onClose, userData }) => {
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

  // รายการเมนูสำหรับผู้ดูแลระบบ
  const adminMenuItems = [
    { 
      path: '/admin-dashboard', 
      icon: 'fa-chart-pie', 
      label: 'แดชบอร์ดผู้ดูแลระบบ', 
    },
    { 
      path: '/admin/users', 
      icon: 'fa-users', 
      label: 'จัดการผู้ใช้งาน', 
    },
    { 
      path: '/admin/orders', 
      icon: 'fa-clipboard-list', 
      label: 'จัดการคำสั่งซื้อทั้งหมด', 
    },
    { 
      path: '/admin/shipping-providers', 
      icon: 'fa-truck-fast', 
      label: 'ผู้ให้บริการขนส่ง' 
    },
    { 
      path: '/admin/products', 
      icon: 'fa-box', 
      label: 'จัดการสินค้าทั้งหมด' 
    },
    { 
      path: '/admin/categories', 
      icon: 'fa-folder-tree', 
      label: 'หมวดหมู่ทั้งหมด' 
    },
    { 
      path: '/admin/reports', 
      icon: 'fa-chart-column', 
      label: 'รายงานระบบ' 
    },
    { 
      path: '/admin/logs', 
      icon: 'fa-list-check', 
      label: 'บันทึกกิจกรรม' 
    },
    { 
      path: '/admin/settings/payments', 
      icon: 'fa-credit-card', 
      label: 'ตั้งค่าการชำระเงิน' 
    },
    { 
      path: '/admin/settings/api', 
      icon: 'fa-code', 
      label: 'การเชื่อมต่อ API' 
    },
    { 
      path: '/admin/settings/security', 
      icon: 'fa-shield-halved', 
      label: 'ความปลอดภัย' 
    },
    { 
      path: '/admin/settings/system', 
      icon: 'fa-gears', 
      label: 'ตั้งค่าระบบ' 
    },
    { 
      path: '/admin/backup', 
      icon: 'fa-database', 
      label: 'สำรองข้อมูล' 
    },
    { 
      path: '/dashboard', 
      icon: 'fa-arrow-right-from-bracket', 
      label: 'กลับสู่โหมดผู้ใช้' 
    },
    { 
      path: '/auth', 
      icon: 'fa-sign-out-alt', 
      label: 'ออกจากระบบ' 
    }
  ];

  // กลุ่มเมนูสำหรับการจัดแสดง
  const menuGroups = [
    {
      title: 'ภาพรวมระบบ',
      items: adminMenuItems.slice(0, 2),
    },
    {
      title: 'การจัดการ',
      items: adminMenuItems.slice(2, 8),
    },
    {
      title: 'การตั้งค่า',
      items: adminMenuItems.slice(8, 13),
    },
    {
      title: 'บัญชี',
      items: adminMenuItems.slice(13),
    },
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
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ส่วนหัวข้อมูลผู้ดูแลระบบ */}
        <div className="bg-gradient-to-r from-violet-900 to-purple-700 text-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">ระบบผู้ดูแล</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <i className="fa-solid fa-user-shield text-2xl"></i>
            </div>
            <div>
              <p className="font-medium">{userData?.name || 'ผู้ดูแลระบบ'}</p>
              <p className="text-sm opacity-90 bg-violet-800 px-2 py-0.5 rounded-full inline-block mt-1">
                {userData?.role || 'admin'}
              </p>
            </div>
          </div>
          
          <div className="mt-3 px-3 py-2 bg-white bg-opacity-10 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm">สถานะระบบ</span>
              <span className="font-medium flex items-center">
                <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                พร้อมใช้งาน
              </span>
            </div>
          </div>
        </div>

        {/* รายการเมนูเป็นกลุ่ม */}
        <div className="py-2">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path}
                      className={`flex items-center px-4 py-2 text-sm hover:bg-purple-50 ${
                        location === item.path ? 'bg-purple-50 text-purple-800 font-medium' : 'text-gray-700'
                      }`}
                      onClick={onClose}
                    >
                      <i className={`fa-solid ${item.icon} w-5 mr-3 ${location === item.path ? 'text-purple-800' : 'text-gray-500'}`}></i>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ส่วนล่าง */}
        <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-purple-800 font-semibold">PURPLE</span><span className="text-purple-600 font-semibold">DASH</span>
              <span className="ml-1 text-xs px-1 py-0.5 bg-gray-100 text-gray-800 rounded">ADMIN</span>
            </div>
            <span className="text-xs text-gray-500">v1.5.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenuAdmin;