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
        <circle cx="30" cy="30" r="30" fill="#2E2157" />
        
        {/* ศูนย์กลางของเครือข่าย */}
        <circle 
          cx="30" 
          cy="30" 
          r="12" 
          fill="#FFC107" 
        />
        
        {/* ไอคอนเส้นทางบนศูนย์กลาง */}
        <path 
          d="M26 30 L34 30 M30 26 L30 34" 
          stroke="#2E2157" 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        
        {/* จุดเครือข่ายรอบนอก */}
        <circle cx="12" cy="18" r="3" fill="#9C27B0" />
        <circle cx="15" cy="45" r="3" fill="#9C27B0" />
        <circle cx="45" cy="15" r="3" fill="#9C27B0" />
        <circle cx="48" cy="42" r="3" fill="#9C27B0" />
        <circle cx="30" cy="8" r="3" fill="#9C27B0" />
        
        {/* เส้นเชื่อมโยงหลัก */}
        <line 
          x1="12" 
          y1="18" 
          x2="30" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="15" 
          y1="45" 
          x2="30" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="45" 
          y1="15" 
          x2="30" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="48" 
          y1="42" 
          x2="30" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="30" 
          y1="8" 
          x2="30" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        
        {/* เส้นเชื่อมโยงรอง */}
        <line 
          x1="12" 
          y1="18" 
          x2="45" 
          y2="15" 
          stroke="#9C27B0" 
          strokeWidth="1" 
          strokeDasharray="1.5 1" 
        />
        <line 
          x1="15" 
          y1="45" 
          x2="48" 
          y2="42" 
          stroke="#9C27B0" 
          strokeWidth="1" 
          strokeDasharray="1.5 1"  
        />
      </svg>
    </div>
  );
};

export default LogoIcon;