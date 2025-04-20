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
        {/* พื้นหลัง */}
        <circle cx="30" cy="30" r="30" fill="white" />

        {/* รูปร่างสามเหลี่ยมสื่อถึงความเร็ว */}
        <path
          d="M20 40 L40 20 L44 40 Z"
          fill="#1E88E5"
          strokeWidth="0"
        />
        
        {/* เส้นประสานด้านล่าง */}
        <path 
          d="M15 35 C25 25, 35 45, 50 32" 
          stroke="#1E88E5" 
          strokeWidth="4" 
          strokeLinecap="round"
          strokeDasharray="1 4"
        />
        
        {/* เส้นประสานด้านบน */}
        <path 
          d="M10 30 C20 20, 30 40, 45 25" 
          stroke="#0D47A1" 
          strokeWidth="4" 
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        
        {/* ตัวอักษร P */}
        <text 
          x="24" 
          y="36" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="20" 
          fill="white"
          transform="skewX(-10)"
        >
          P
        </text>
      </svg>
    </div>
  );
};

export default LogoIcon;