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
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">บัญชีผู้ใช้</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="flex flex-col p-4 border-b">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <p className="font-medium">{userData.name}</p>
              <p className="text-sm text-gray-500">{userData.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <span className="text-sm flex items-center">
              <i className="fa-solid fa-wallet mr-2 text-green-600"></i> ยอดเงินคงเหลือ:
            </span>
            <span className="font-semibold">
              {new Intl.NumberFormat('th-TH', {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: 2
              }).format(userData.balance)} บาท
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/profile">
                <a className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                  <i className="fa-solid fa-user-gear w-5 mr-2"></i> ข้อมูลผู้ใช้
                </a>
              </Link>
            </li>
            <li>
              <Link href="/topup">
                <a className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                  <i className="fa-solid fa-credit-card w-5 mr-2"></i> เติมเครดิต
                </a>
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout} 
                className="flex items-center px-3 py-2 text-sm rounded-md text-left w-full hover:bg-gray-100"
              >
                <i className="fa-solid fa-right-from-bracket w-5 mr-2"></i> ออกจากระบบ
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default SidebarMenu;