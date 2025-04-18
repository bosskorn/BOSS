import React, { useState, useEffect, useRef } from 'react';

interface DropdownProps {
  buttonText: string;
  icon?: string;
  children: React.ReactNode;
  buttonClassName?: string;
  dropdownClassName?: string;
}

const SimpleDropdown: React.FC<DropdownProps> = ({ 
  buttonText, 
  icon, 
  children, 
  buttonClassName = "flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-purple-50",
  dropdownClassName = "absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button 
        onClick={toggleDropdown}
        className={buttonClassName}
        aria-haspopup="true" 
        aria-expanded={isOpen}
      >
        {icon && <i className={`${icon} mr-2`}></i>}
        <span>{buttonText}</span>
        <i className={`fa-solid fa-caret-down ml-1 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      
      {isOpen && (
        <div className={dropdownClassName}>
          {children}
        </div>
      )}
    </div>
  );
};

export default SimpleDropdown;