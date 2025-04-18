import { useState } from 'react';
import Layout from '@/components/Layout';
import Logo from '@/components/Logo';
import LogoIcon from '@/components/LogoIcon';

export default function LogoDisplay() {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-8 text-purple-800">PURPLEDASH - แบรนด์ใหม่ของคุณ</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium mb-4 text-purple-700">โลโก้หลัก</h2>
          <div className="flex justify-center bg-gray-50 p-10 rounded-lg border border-gray-200 mb-4">
            <Logo size={size} />
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button onClick={() => setSize('small')} className={`px-3 py-1 rounded ${size === 'small' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
              เล็ก
            </button>
            <button onClick={() => setSize('medium')} className={`px-3 py-1 rounded ${size === 'medium' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
              กลาง
            </button>
            <button onClick={() => setSize('large')} className={`px-3 py-1 rounded ${size === 'large' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
              ใหญ่
            </button>
          </div>
          
          <div className="text-gray-600 text-sm">
            <p>โลโก้หลักแสดงชื่อแบรนด์ "PURPLEDASH" พร้อมสโลแกน "ส่งด่วน ม่วงสะดุด!"</p>
            <p>การออกแบบใช้สีม่วงสด (#8A2BE2) เป็นหลัก และมีเส้นประสานที่สื่อถึงความเร็วและความคล่องตัว</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium mb-4 text-purple-700">ไอคอนโลโก้</h2>
          <div className="flex flex-col items-center justify-center">
            <div className="flex space-x-6 mb-8">
              <div className="flex flex-col items-center">
                <LogoIcon size={40} />
                <span className="text-sm text-gray-500 mt-2">40px</span>
              </div>
              <div className="flex flex-col items-center">
                <LogoIcon size={60} />
                <span className="text-sm text-gray-500 mt-2">60px</span>
              </div>
              <div className="flex flex-col items-center">
                <LogoIcon size={80} />
                <span className="text-sm text-gray-500 mt-2">80px</span>
              </div>
            </div>
          </div>
          
          <div className="text-gray-600 text-sm">
            <p>ไอคอนโลโก้สามารถนำไปใช้ในพื้นที่ที่จำกัด เช่น favicon, โปรไฟล์โซเชียลมีเดีย หรือสถานที่ที่ต้องการ</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium mb-4 text-purple-700">สีของแบรนด์</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-[#8A2BE2] rounded-lg shadow-md"></div>
              <span className="text-sm mt-2">Primary Purple</span>
              <span className="text-xs text-gray-500">#8A2BE2</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-[#6A1CB2] rounded-lg shadow-md"></div>
              <span className="text-sm mt-2">Deep Purple</span>
              <span className="text-xs text-gray-500">#6A1CB2</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-[#A35AEA] rounded-lg shadow-md"></div>
              <span className="text-sm mt-2">Light Purple</span>
              <span className="text-xs text-gray-500">#A35AEA</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-[#E0CFFC] rounded-lg shadow-md"></div>
              <span className="text-sm mt-2">Pale Purple</span>
              <span className="text-xs text-gray-500">#E0CFFC</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white border border-gray-200 rounded-lg shadow-md"></div>
              <span className="text-sm mt-2">White</span>
              <span className="text-xs text-gray-500">#FFFFFF</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4 text-purple-700">คอนเซปต์แบรนด์</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800">แบรนด์: "PURPLEDASH"</h3>
              <p className="text-gray-600">สื่อถึงความเร็วในการจัดส่ง (DASH) ด้วยความเป็นเอกลักษณ์ของสีม่วง (PURPLE)</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">สโลแกน: "ส่งด่วน ม่วงสะดุด!"</h3>
              <p className="text-gray-600">สื่อสารให้เห็นถึงความรวดเร็วในการจัดส่ง และความโดดเด่นของแบรนด์ด้วยสีม่วง</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">จุดขาย:</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>ขนส่งเร็วพิเศษตามเวลาที่กำหนด</li>
                <li>ระบบติดตามแบบเรียลไทม์ชั้นนำ</li>
                <li>บริการที่มีเอกลักษณ์และโดดเด่น (ม่วงสะดุด!)</li>
              </ul>
            </div>
            <div className="flex items-center space-x-4 mt-4">
              <span className="delivery-dash">ส่งด่วน ม่วงสะดุด!</span>
              <div className="purple-dash-line w-64 h-10 flex items-center justify-center">
                <span className="text-purple-600 font-medium">เส้นประเคลื่อนไหว</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}