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
        {/* พื้นหลังวงกลมแบบไล่ระดับสี */}
        <circle cx="30" cy="30" r="30" fill="url(#blueGradientIcon)" />
        
        {/* ไล่ระดับสี */}
        <defs>
          <linearGradient id="blueGradientIcon" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#2962FF" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>
        </defs>
        
        {/* กล่องพัสดุ */}
        <rect x="17" y="20" width="26" height="20" rx="2" fill="white" />
        <path d="M17 26 L43 26" stroke="#2962FF" strokeWidth="2" />
        <path d="M30 20 L30 40" stroke="#2962FF" strokeWidth="2" />
        
        {/* คลื่นการเคลื่อนที่ (แทนการขนส่ง) */}
        <path 
          d="M15 38 C25 28, 35 48, 50 35" 
          stroke="rgba(255, 255, 255, 0.7)" 
          strokeWidth="4" 
          strokeLinecap="round"
          strokeDasharray="1 4"
        />
        
        {/* เส้นการเคลื่อนที่ */}
        <path 
          d="M10 33 C20 23, 30 43, 45 28" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        
        {/* ตัวอักษร S */}
        <text 
          x="24" 
          y="35" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="16" 
          fill="#0D47A1"
          transform="skewX(-10)"
        >
          S
        </text>
      </svg>
    </div>
  );
};

export default LogoIcon;