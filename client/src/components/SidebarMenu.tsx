import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

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
  const { logoutMutation } = useAuth();

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

  // ไม่ใช้รายการเมนูแล้ว เนื่องจากย้ายไปแสดงในแถบด้านบน

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
          <div className="px-4 py-3 text-center text-sm text-gray-500">
            เมนูถูกย้ายไปที่แถบนำทางด้านบน
          </div>
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