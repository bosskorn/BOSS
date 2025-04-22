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
      badge: 'new',
      badgeColor: 'bg-purple-600'
    },
    { 
      path: '/admin/users', 
      icon: 'fa-users', 
      label: 'จัดการผู้ใช้และร้านค้า',
      description: 'ข้อมูลผู้ใช้งาน ร้านค้า และสิทธิ์การเข้าถึง' 
    },
    { 
      path: '/admin/shipments', 
      icon: 'fa-truck-fast', 
      label: 'จัดการพัสดุทั้งหมด',
      description: 'ติดตามและจัดการการขนส่งทั้งหมดในระบบ',
      badge: '25',
      badgeColor: 'bg-orange-500'
    },
    { 
      path: '/claims-list', 
      icon: 'fa-file-circle-exclamation', 
      label: 'รายการเคลมและปัญหา',
      description: 'จัดการเรื่องร้องเรียน ปัญหาการจัดส่ง และการชดเชย',
      badge: '6',
      badgeColor: 'bg-red-500'
    },
    { 
      path: '/admin/shipping-providers', 
      icon: 'fa-truck-container', 
      label: 'เครือข่ายขนส่ง',
      description: 'จัดการผู้ให้บริการขนส่งและเครือข่าย'
    },
    { 
      path: '/admin/areas', 
      icon: 'fa-map-location-dot', 
      label: 'จัดการพื้นที่และเขต',
      description: 'กำหนดเขตพื้นที่ อัตราค่าส่ง และข้อจำกัด'
    },
    { 
      path: '/admin/warehouses', 
      icon: 'fa-warehouse', 
      label: 'คลังสินค้าและจุดรับส่ง',
      description: 'จัดการคลังสินค้าและจุดรับส่งพัสดุ'
    },
    { 
      path: '/admin/financial', 
      icon: 'fa-money-bill-transfer', 
      label: 'การเงินและบัญชี',
      description: 'ธุรกรรมการเงิน COD และการชำระเงิน',
      badge: '15',
      badgeColor: 'bg-green-600'
    },
    { 
      path: '/admin/billing', 
      icon: 'fa-file-invoice-dollar', 
      label: 'ใบแจ้งหนี้และการเรียกเก็บ',
      description: 'ระบบใบแจ้งหนี้ การเรียกเก็บเงิน และส่วนลด'
    },
    { 
      path: '/admin/pricing', 
      icon: 'fa-tags', 
      label: 'อัตราค่าบริการ',
      description: 'กำหนดราคา ส่วนลด และแพ็คเกจ'
    },
    { 
      path: '/admin/reports', 
      icon: 'fa-chart-column', 
      label: 'รายงานและวิเคราะห์',
      description: 'รายงานประสิทธิภาพ สถิติ และการวิเคราะห์'
    },
    { 
      path: '/admin/marketing', 
      icon: 'fa-bullhorn', 
      label: 'การตลาดและโปรโมชั่น',
      description: 'โปรโมชั่น คูปอง และแคมเปญการตลาด'
    },
    { 
      path: '/admin/logs', 
      icon: 'fa-list-check', 
      label: 'ประวัติการทำงาน',
      description: 'บันทึกกิจกรรมและการใช้งานระบบ'
    },
    { 
      path: '/admin/system-settings', 
      icon: 'fa-gears', 
      label: 'ตั้งค่าระบบ',
      description: 'การตั้งค่าทั่วไป API และระบบความปลอดภัย'
    },
    { 
      path: '/admin/integrations', 
      icon: 'fa-plug-circle-bolt', 
      label: 'การเชื่อมต่อภายนอก',
      description: 'API Webhooks และบริการภายนอก',
      badge: 'beta',
      badgeColor: 'bg-blue-500'
    },
    { 
      path: '/dashboard', 
      icon: 'fa-arrow-right-from-bracket', 
      label: 'กลับสู่โหมดผู้ใช้',
      description: 'ออกจากโหมดผู้ดูแลระบบไปยังโหมดผู้ใช้งาน'
    },
    { 
      path: '/auth', 
      icon: 'fa-sign-out-alt', 
      label: 'ออกจากระบบ',
      description: 'ออกจากระบบและกลับไปยังหน้าเข้าสู่ระบบ'
    }
  ];

  // กลุ่มเมนูสำหรับการจัดแสดง
  const menuGroups = [
    {
      title: 'แดชบอร์ด',
      items: adminMenuItems.slice(0, 2), // แดชบอร์ด, จัดการผู้ใช้
    },
    {
      title: 'การจัดการโลจิสติกส์',
      items: adminMenuItems.slice(2, 7), // พัสดุ, เคลม, เครือข่ายขนส่ง, พื้นที่, คลังสินค้า
    },
    {
      title: 'การเงินและบัญชี',
      items: adminMenuItems.slice(7, 10), // การเงิน, ใบแจ้งหนี้, อัตราค่าบริการ
    },
    {
      title: 'รายงานและการตลาด',
      items: adminMenuItems.slice(10, 13), // รายงาน, การตลาด, ประวัติการทำงาน
    },
    {
      title: 'ระบบและการตั้งค่า',
      items: adminMenuItems.slice(12, 14), // ตั้งค่าระบบ, การเชื่อมต่อภายนอก
    },
    {
      title: 'บัญชีผู้ใช้',
      items: adminMenuItems.slice(14), // กลับสู่โหมดผู้ใช้, ออกจากระบบ
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
                      className={`flex items-start px-4 py-3 text-sm hover:bg-purple-50 ${
                        location === item.path ? 'bg-purple-50 text-purple-800 font-medium' : 'text-gray-700'
                      }`}
                      onClick={onClose}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <i className={`fa-solid ${item.icon} w-5 ${location === item.path ? 'text-purple-800' : 'text-gray-500'}`}></i>
                      </div>
                      <div className="ml-3 flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-purple-600'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 pr-4 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
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
              <span className="text-blue-700 font-semibold">Ship</span><span className="text-blue-500 font-semibold">Sync</span>
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