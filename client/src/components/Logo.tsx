import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  // ขนาดของโลโก้ตามแต่ละขนาด
  const dimensions = {
    small: { width: 120, height: 40 },
    medium: { width: 180, height: 60 },
    large: { width: 240, height: 80 },
  };

  return (
    <div className={`inline-flex flex-shrink-0 ${className}`}>
      <svg
        width={dimensions[size].width}
        height={dimensions[size].height}
        viewBox="0 0 240 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* พื้นหลังโลโก้แบบไล่ระดับสี */}
        <rect width="240" height="80" rx="12" fill="url(#blueGradient)" />
        
        {/* ไล่ระดับสี */}
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#2962FF" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>
        </defs>

        {/* คลื่นการเคลื่อนที่ (แทนการขนส่ง) */}
        <path 
          d="M20 50 C60 30, 120 70, 220 45" 
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth="6" 
          strokeLinecap="round"
          strokeDasharray="1 7"
        />
        
        {/* เส้นทางการเคลื่อนที่ */}
        <path 
          d="M30 40 C80 20, 150 60, 210 30" 
          stroke="white" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray="2 4"
        />
        
        {/* ไอคอนกล่องพัสดุ */}
        <rect x="15" y="28" width="22" height="22" rx="2" fill="white" />
        <path d="M15 34 L37 34" stroke="#2962FF" strokeWidth="2" />
        <path d="M26 28 L26 50" stroke="#2962FF" strokeWidth="2" />

        {/* ตัวอักษร Ship */}
        <text 
          x="50" 
          y="48" 
          fontFamily="Arial, sans-serif" 
          fontWeight="800" 
          fontSize="28" 
          fill="white"
          transform="skewX(-10)"
        >
          Ship
        </text>
        
        {/* ตัวอักษร Sync */}
        <text 
          x="120" 
          y="48" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="28" 
          fill="white"
          transform="skewX(-10)"
        >
          Sync
        </text>
        
        {/* สโลแกนภาษาไทย */}
        <text 
          x="62" 
          y="65" 
          fontFamily="Kanit, sans-serif" 
          fontWeight="600" 
          fontSize="12" 
          fill="white"
        >
          ส่งพัสดุรวดเร็ว ตรงเวลา
        </text>
      </svg>
    </div>
  );
};

export default Logo;