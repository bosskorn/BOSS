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
        <circle cx="30" cy="30" r="30" fill="#0056D6" />
        
        {/* ตัวอักษร S */}
        <text 
          x="27" 
          y="35" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="22" 
          fill="white"
        >
          S
        </text>
        
        {/* เส้นประด้านล่างตัวอักษร */}
        <path 
          d="M20 36 L40 36" 
          stroke="white" 
          strokeWidth="1.5"
          strokeDasharray="2 1"
        />
        
        {/* จุดเล็กๆ ต่อจากเส้นประ */}
        <circle cx="42.5" cy="36" r="1" fill="white" />
        <circle cx="45" cy="36" r="1" fill="white" />
      </svg>
    </div>
  );
};

export default LogoIcon;