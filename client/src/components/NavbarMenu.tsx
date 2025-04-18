import React from 'react';
import { Link } from 'wouter';

interface NavbarMenuProps {
  onToggleSidebar: () => void;
}

const NavbarMenu: React.FC<NavbarMenuProps> = ({ onToggleSidebar }) => {
  return (
    <nav className="bg-white shadow-md py-2 px-4 sticky top-0 z-50 border-b-2 border-purple-500 purple-dash-line">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-xl font-semibold text-gray-800 hover:text-purple-600">
            <span className="text-purple-700">PURPLE</span><span className="text-purple-500">DASH</span>
          </Link>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={onToggleSidebar} 
            className="p-2 rounded-full hover:bg-purple-50"
          >
            <i className="fa-solid fa-user text-gray-600"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarMenu;