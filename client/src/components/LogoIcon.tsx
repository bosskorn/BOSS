import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
}

const LogoIcon: React.FC<LogoIconProps> = ({ size = 40, className = '' }) => {
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
        <circle cx="30" cy="30" r="30" fill="#007E33" />
        
        {/* ตัวอักษร S */}
        <text 
          x="25" 
          y="38" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="24" 
          fill="#FFEE58"
        >
          S
        </text>
        
        {/* เอฟเฟคการซิงค์ (สัญลักษณ์การเชื่อมต่อ) */}
        <path 
          d="M42 24 L45 24 L45 21 L48 26 L45 31 L45 28 L42 28 Z" 
          fill="#FFEE58" 
        />
        
        {/* เอฟเฟคการซิงค์อีกด้าน */}
        <path 
          d="M18 28 L15 28 L15 31 L12 26 L15 21 L15 24 L18 24 Z" 
          fill="#FFEE58" 
        />
        
        {/* เส้นประด้านล่างตัวอักษร */}
        <path 
          d="M20 42 L40 42" 
          stroke="white" 
          strokeWidth="1.5"
          strokeDasharray="2 1"
        />
      </svg>
    </div>
  );
};

export default LogoIcon;