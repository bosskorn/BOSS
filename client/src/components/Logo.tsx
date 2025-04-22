import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  // ขนาดของโลโก้ตามแต่ละขนาด
  const dimensions = {
    small: { width: 180, height: 60 },
    medium: { width: 270, height: 90 },
    large: { width: 360, height: 120 },
  };

  return (
    <div className={`inline-flex flex-shrink-0 ${className}`}>
      <svg
        width={dimensions[size].width}
        height={dimensions[size].height}
        viewBox={`0 0 ${180} ${60}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* พื้นหลังโลโก้ */}
        <rect width="180" height="60" rx="8" fill="#2E2157" />
        
        {/* ศูนย์กลางของเครือข่าย */}
        <circle 
          cx="50" 
          cy="30" 
          r="15" 
          fill="#FFC107" 
        />
        
        {/* จุดเครือข่ายสำหรับเชื่อมโยง */}
        <circle cx="20" cy="15" r="4" fill="#9C27B0" />
        <circle cx="25" cy="50" r="4" fill="#9C27B0" />
        <circle cx="75" cy="15" r="4" fill="#9C27B0" />
        <circle cx="80" cy="45" r="4" fill="#9C27B0" />
        <circle cx="45" cy="8" r="3" fill="#9C27B0" />
        
        {/* เส้นเชื่อมโยงหลัก */}
        <line 
          x1="20" 
          y1="15" 
          x2="50" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="25" 
          y1="50" 
          x2="50" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="75" 
          y1="15" 
          x2="50" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="80" 
          y1="45" 
          x2="50" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        <line 
          x1="45" 
          y1="8" 
          x2="50" 
          y2="30" 
          stroke="#9C27B0" 
          strokeWidth="1.5" 
        />
        
        {/* เส้นเชื่อมโยงรอง */}
        <line 
          x1="20" 
          y1="15" 
          x2="75" 
          y2="15" 
          stroke="#9C27B0" 
          strokeWidth="1" 
          strokeDasharray="2 1" 
        />
        <line 
          x1="25" 
          y1="50" 
          x2="80" 
          y2="45" 
          stroke="#9C27B0" 
          strokeWidth="1" 
          strokeDasharray="2 1"  
        />
        <line 
          x1="45" 
          y1="8" 
          x2="75" 
          y2="15" 
          stroke="#9C27B0" 
          strokeWidth="1" 
          strokeDasharray="2 1"  
        />
        
        {/* ไอคอนเส้นทางบนศูนย์กลาง */}
        <path 
          d="M45 30 L55 30 M50 25 L50 35" 
          stroke="#2E2157" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* ตัวอักษร Ship */}
        <text 
          x="95" 
          y="25" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="20" 
          fill="white"
        >
          Ship
        </text>
        
        {/* ตัวอักษร Sync */}
        <text 
          x="95" 
          y="45" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="20" 
          fill="#FFC107"
        >
          Sync
        </text>
      </svg>
    </div>
  );
};

export default Logo;