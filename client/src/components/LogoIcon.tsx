import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
}

const LogoIcon: React.FC<LogoIconProps> = ({ size = 50, className = '' }) => {
  return (
    <div className={`inline-flex flex-shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* พื้นหลังวงกลม */}
        <circle cx="30" cy="30" r="30" fill="#0B2F5C" />
        
        {/* ลูกศรสีส้ม - ด้านซ้ายบน */}
        <path 
          d="M12 20 C18 20, 24 20, 30 25" 
          stroke="#FF7D1A" 
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* ลูกศรสีส้ม - หัวลูกศร */}
        <path 
          d="M27 21 L33 25 L28 28" 
          stroke="#FF7D1A" 
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* ลูกศรสีฟ้า - ด้านล่างขวา */}
        <path 
          d="M48 40 C42 40, 36 40, 30 35" 
          stroke="#00B2FF" 
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* ลูกศรสีฟ้า - หัวลูกศร */}
        <path 
          d="M33 39 L27 35 L32 32" 
          stroke="#00B2FF" 
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* ลูกศรสีเขียว - แนวไขว้ตรงกลาง */}
        <path 
          d="M20 40 C25 35, 30 32, 35 25" 
          stroke="#01C27C" 
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* ลูกศรสีเขียว - หัวลูกศร */}
        <path 
          d="M33 25 L38 20 L38 28" 
          stroke="#01C27C" 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* ตัวอักษร S */}
        <text 
          x="26" 
          y="38" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="14" 
          fill="white"
        >
          S
        </text>
      </svg>
    </div>
  );
};

export default LogoIcon;