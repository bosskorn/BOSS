import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { User, LogOut, Package, Truck, FolderTree, ShoppingBag, BarChart, Settings } from 'lucide-react';
import Logo from './Logo';
import { useQuery } from '@tanstack/react-query';
import { Category as CategoryType } from '@shared/schema';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarMenuWithCategories: React.FC<SidebarMenuProps> = ({ isOpen, onClose }) => {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const sidebar = document.getElementById('sidebar-menu');
      if (isOpen && sidebar && !sidebar.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ดึงข้อมูลหมวดหมู่หลัก (parent_id is null)
  const { data: mainCategories, isLoading } = useQuery<CategoryType[]>({
    queryKey: ['/api/categories/main'],
    queryFn: async () => {
      const res = await fetch('/api/categories?parentId=null');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!user,
  });

  const handleNavigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
    onClose();
  };

  return (
    <div
      id="sidebar-menu"
      className={`fixed top-0 left-0 h-full bg-white w-64 shadow-lg z-50 transition-transform duration-300 transform font-kanit ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center p-4 border-b border-gray-200">
          <Logo size="small" />
        </div>
        
        <div className="flex flex-col p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-sm">{user?.fullname || 'ผู้ใช้งาน'}</div>
              <div className="text-xs text-gray-500">{user?.username || 'ไม่ระบุชื่อผู้ใช้'}</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/dashboard'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart className="mr-3 h-5 w-5 text-purple-500" />
              แดชบอร์ด
            </button>
            
            <button
              onClick={() => handleNavigate('/create-order')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/create-order'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Truck className="mr-3 h-5 w-5 text-purple-500" />
              สร้างคำสั่งซื้อ
            </button>
            
            <div className="border-t border-gray-200 my-2"></div>
            
            <button
              onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                location.includes('/category') || location.includes('/product')
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <Package className="mr-3 h-5 w-5 text-purple-500" />
                <span>จัดการสินค้า</span>
              </div>
              <svg
                className={`w-4 h-4 transform transition-transform ${isCategoryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isCategoryExpanded && (
              <div className="pl-10 space-y-1">
                <button
                  onClick={() => handleNavigate('/product-management')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location === '/product-management'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className="mr-3 h-4 w-4 text-purple-400" />
                  จัดการสินค้า
                </button>
                
                <button
                  onClick={() => handleNavigate('/category-management')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location === '/category-management'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FolderTree className="mr-3 h-4 w-4 text-purple-400" />
                  จัดการหมวดหมู่
                </button>
                
                <button
                  onClick={() => handleNavigate('/product-create')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location === '/product-create'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 h-4 w-4 flex items-center justify-center text-purple-400">+</span>
                  เพิ่มสินค้าใหม่
                </button>
              </div>
            )}
            
            <div className="border-t border-gray-200 my-2"></div>
            
            <button
              onClick={() => handleNavigate('/settings')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location === '/settings'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="mr-3 h-5 w-5 text-purple-500" />
              ตั้งค่า
            </button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-700 rounded-md hover:bg-red-50"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenuWithCategories;