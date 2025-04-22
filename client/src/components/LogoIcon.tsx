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
        <circle cx="30" cy="30" r="30" fill="#00334E" />
        
        {/* ตัวอักษร S แบบมินิมอล */}
        <g>
          {/* ส่วนบนของตัว S - สีเทอร์ควอยซ์ */}
          <path 
            d="M20 25 C20 20, 25 18, 30 18 H35 C40 18, 45 20, 45 25 C45 30, 40 32, 35 32 H30" 
            stroke="#00B8A9" 
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* ส่วนล่างของตัว S - สีน้ำเงินเข้ม */}
          <path 
            d="M20 40 C20 35, 25 33, 30 33 H35 C40 33, 45 35, 45 40" 
            stroke="#005B97" 
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* หัวลูกศรตรงปลายตัว S */}
          <path 
            d="M47 35 L45 40 L42 37" 
            stroke="#005B97" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* เส้นประข้างล่าง แสดงการเคลื่อนที่ */}
          <path 
            d="M20 48 L40 48" 
            stroke="#5BD0C8" 
            strokeWidth="2"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};

export default LogoIcon;