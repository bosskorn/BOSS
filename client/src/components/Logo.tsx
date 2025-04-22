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
        
        {/* ตัวอักษร Ship */}
        <text 
          x="17" 
          y="35" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="24" 
          fill="white"
          letterSpacing="0"
        >
          Ship
        </text>
        
        {/* ตัวอักษร Sync แบบสร้างความน่าจดจำ */}
        <text 
          x="81" 
          y="35" 
          fontFamily="Arial, sans-serif" 
          fontWeight="900" 
          fontSize="26" 
          fill="#FFDD00"
          letterSpacing="0"
        >
          Sync
        </text>
        
        {/* เอฟเฟคการซิงค์ (สัญลักษณ์การเชื่อมต่อ) */}
        <path 
          d="M125 22 L133 22 L133 17 L140 25 L133 33 L133 28 L125 28 Z" 
          fill="#FFDD00" 
        />
        
        {/* เอฟเฟคการซิงค์อีกด้าน */}
        <path 
          d="M75 28 L67 28 L67 33 L60 25 L67 17 L67 22 L75 22 Z" 
          fill="#FFDD00" 
        />
        
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