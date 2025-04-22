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
        <rect width="180" height="60" rx="8" fill="#00334E" />
        
        {/* ตัวอักษร S แบบมินิมอลที่มีเอกลักษณ์ */}
        <g>
          {/* ส่วนบนของตัว S - สีเทอร์ควอยซ์ */}
          <path 
            d="M35 25 C35 20, 40 18, 45 18 H55 C60 18, 65 20, 65 25 C65 30, 60 32, 55 32 H45" 
            stroke="#00B8A9" 
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* ส่วนล่างของตัว S - สีน้ำเงินเข้ม */}
          <path 
            d="M35 40 C35 35, 40 33, 45 33 H55 C60 33, 65 35, 65 40" 
            stroke="#005B97" 
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* หัวลูกศรตรงปลายตัว S */}
          <path 
            d="M67 35 L65 40 L62 37" 
            stroke="#005B97" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* เส้นประข้างล่าง แสดงการเคลื่อนที่ */}
          <path 
            d="M35 48 L65 48" 
            stroke="#5BD0C8" 
            strokeWidth="2"
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
        </g>
        
        {/* ตัวอักษร Ship */}
        <text 
          x="75" 
          y="30" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="20" 
          fill="white"
        >
          Ship
        </text>
        
        {/* ตัวอักษร Sync */}
        <text 
          x="75" 
          y="48" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="20" 
          fill="#00B8A9"
        >
          Sync
        </text>
      </svg>
    </div>
  );
};

export default Logo;