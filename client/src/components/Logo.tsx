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

  // คำนวณอัตราส่วนตามขนาด
  const scale = dimensions[size].width / 180;

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
        <rect width="180" height="60" rx="10" fill="#0056D6" />
        
        {/* ตัวอักษร ShipSync */}
        <text 
          x="17" 
          y="35" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="24" 
          fill="white"
          letterSpacing="0"
        >
          ShipSync
        </text>
        
        {/* เส้นประด้านล่างตัวอักษร */}
        <path 
          d="M17 40 L125 40" 
          stroke="white" 
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        
        {/* จุดเล็กๆ ต่อจากเส้นประ */}
        <circle cx="132" cy="40" r="2" fill="white" />
        <circle cx="140" cy="40" r="2" fill="white" />
        <circle cx="148" cy="40" r="2" fill="white" />
        
        {/* สโลแกนภาษาไทย */}
        <text 
          x="84" 
          y="52" 
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