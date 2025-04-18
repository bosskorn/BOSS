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
        {/* สีพื้นหลัง */}
        <rect width="240" height="80" rx="12" fill="white" />
        
        {/* เส้นประสานด้านล่าง (เส้นขนส่งม่วง) */}
        <path 
          d="M20 50 C60 30, 120 70, 220 45" 
          stroke="#8A2BE2" 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeDasharray="1 7"
        />
        
        {/* เส้นประสานด้านบน (เส้นขนส่งม่วงเข้ม) */}
        <path 
          d="M30 40 C80 20, 150 60, 210 30" 
          stroke="#6A1CB2" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray="2 4"
        />
        
        {/* ตัวอักษรแนวเฉียง PURPLE */}
        <text 
          x="45" 
          y="42" 
          fontFamily="Arial, sans-serif" 
          fontWeight="800" 
          fontSize="28" 
          fill="#8A2BE2"
          transform="skewX(-10)"
        >
          PURPLE
        </text>
        
        {/* ตัวอักษรแนวเฉียง DASH */}
        <text 
          x="145" 
          y="42" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="28" 
          fill="#6A1CB2"
          transform="skewX(-10)"
        >
          DASH
        </text>
        
        {/* สโลแกน */}
        <text 
          x="60" 
          y="65" 
          fontFamily="Kanit, sans-serif" 
          fontWeight="600" 
          fontSize="12" 
          fill="#6A1CB2"
        >
          ส่งด่วน ม่วงสะดุด!
        </text>
      </svg>
    </div>
  );
};

export default Logo;