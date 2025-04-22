import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  // ขนาดของโลโก้ตามแต่ละขนาด
  const dimensions = {
    small: { width: 200, height: 70 },
    medium: { width: 300, height: 105 },
    large: { width: 400, height: 140 },
  };

  return (
    <div className={`inline-flex flex-shrink-0 ${className}`}>
      <svg
        width={dimensions[size].width}
        height={dimensions[size].height}
        viewBox={`0 0 ${200} ${70}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* พื้นหลังโลโก้ */}
        <rect width="200" height="70" rx="12" fill="#0B2F5C" />
        
        {/* ลูกศรเคลื่อนไหวสีส้ม - ด้านซ้ายบน */}
        <path 
          d="M30 15 C45 15, 60 15, 75 25 S85 40, 100 42"
          stroke="#FF7D1A" 
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* ลูกศรเคลื่อนไหวสีส้ม - หัวลูกศร */}
        <path 
          d="M95 37 L105 42 L95 47" 
          stroke="#FF7D1A" 
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* ลูกศรเคลื่อนไหวสีฟ้า - ด้านล่างขวา */}
        <path 
          d="M175 50 C160 50, 145 50, 130 40 S120 25, 105 23"
          stroke="#00B2FF" 
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* ลูกศรเคลื่อนไหวสีฟ้า - หัวลูกศร */}
        <path 
          d="M110 28 L100 23 L110 18" 
          stroke="#00B2FF" 
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* ลูกศรเคลื่อนไหวสีเขียว - แนวไขว้ตรงกลาง */}
        <path 
          d="M75 50 C85 45, 95 40, 100 32 S105 25, 115 20"
          stroke="#01C27C" 
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* ลูกศรเคลื่อนไหวสีเขียว - หัวลูกศร */}
        <path 
          d="M110 18 L120 15 L115 25" 
          stroke="#01C27C" 
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* ตัวอักษร Ship */}
        <text 
          x="50" 
          y="45" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="22" 
          fill="white"
          letterSpacing="0"
        >
          Ship
        </text>
        
        {/* ตัวอักษร Sync */}
        <text 
          x="115" 
          y="45" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="22" 
          fill="white"
          letterSpacing="0"
        >
          Sync
        </text>
        
        {/* สโลแกนภาษาไทย */}
        <text 
          x="100" 
          y="60" 
          fontFamily="Kanit, sans-serif" 
          fontWeight="400" 
          fontSize="10" 
          fill="white"
          textAnchor="middle"
        >
          ส่งพัสดุรวดเร็ว เชื่อถือได้
        </text>
      </svg>
    </div>
  );
};

export default Logo;