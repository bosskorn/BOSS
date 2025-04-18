import React from 'react';
import { Link } from 'wouter';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: {
    name: string;
    role: string;
    balance: number;
  };
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose, userData = { name: 'ผู้ใช้ทดสอบระบบ', role: 'ผู้ดูแลระบบ', balance: 0 } }) => {
  // จำลองการออกจากระบบ
  const handleLogout = () => {
    console.log('Logging out...');
    // นำทางไปยังหน้าล็อกอิน (ในการใช้งานจริงควรทำการ clear token)
    window.location.href = '/auth';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative flex flex-col w-72 max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-emerald-100 bg-emerald-50">
          <h2 className="text-lg font-medium text-emerald-800">บัญชีผู้ใช้</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-emerald-100 text-emerald-700">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="flex flex-col p-5 border-b">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <p className="font-medium">{userData.name}</p>
              <p className="text-sm text-gray-500">{userData.role}</p>
            </div>
          </div>
          <div className="flex flex-col bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <span className="text-sm text-gray-600 mb-1">
              ยอดเงินคงเหลือ
            </span>
            <span className="text-xl font-semibold text-emerald-700 flex items-center">
              <i className="fa-solid fa-wallet mr-2 text-emerald-500"></i>
              {new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: 2
              }).format(userData.balance)}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">เมนูหลัก</div>
          <ul className="space-y-1">
            <li>
              <Link href="/profile" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700">
                <i className="fa-solid fa-user-gear w-5 mr-2 text-emerald-500"></i> ข้อมูลผู้ใช้
              </Link>
            </li>
            <li>
              <Link href="/topup" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700">
                <i className="fa-solid fa-credit-card w-5 mr-2 text-emerald-500"></i> เติมเครดิต
              </Link>
            </li>
            <li>
              <Link href="/settings" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-emerald-50 text-gray-700 hover:text-emerald-700">
                <i className="fa-solid fa-gear w-5 mr-2 text-emerald-500"></i> ตั้งค่าระบบ
              </Link>
            </li>
            <li className="mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={handleLogout} 
                className="flex items-center px-3 py-2 text-sm rounded-md text-left w-full hover:bg-red-50 text-gray-700 hover:text-red-700"
              >
                <i className="fa-solid fa-right-from-bracket w-5 mr-2 text-red-500"></i> ออกจากระบบ
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            <p>เวอร์ชัน 1.0.0</p>
            <p className="mt-1">© 2025 ระบบจัดการข้อมูลขนส่ง</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;