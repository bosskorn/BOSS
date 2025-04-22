import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import Logo from '@/components/Logo';
import LogoIcon from '@/components/LogoIcon';

const LogoShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-kanit">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">โลโก้ ShipSync</h1>
          <Link href="/">
            <Button variant="outline">กลับหน้าหลัก</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 flex flex-col justify-center items-center">
            <CardHeader>
              <CardTitle className="text-xl">โลโก้หลัก (ขนาดใหญ่)</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center bg-white p-6 rounded-lg shadow-sm">
              <Logo size="large" />
            </CardContent>
          </Card>

          <Card className="p-6 flex flex-col justify-center items-center">
            <CardHeader>
              <CardTitle className="text-xl">โลโก้หลัก (ขนาดกลาง)</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center bg-white p-6 rounded-lg shadow-sm">
              <Logo size="medium" />
            </CardContent>
          </Card>

          <Card className="p-6 flex flex-col justify-center items-center">
            <CardHeader>
              <CardTitle className="text-xl">โลโก้หลัก (ขนาดเล็ก)</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center bg-white p-6 rounded-lg shadow-sm">
              <Logo size="small" />
            </CardContent>
          </Card>

          <Card className="p-6 flex flex-col justify-center items-center">
            <CardHeader>
              <CardTitle className="text-xl">ไอคอนโลโก้</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 items-center">
              <div className="flex justify-center bg-white p-6 rounded-lg shadow-sm">
                <LogoIcon size={60} />
              </div>
              <div className="flex justify-center bg-white p-6 rounded-lg shadow-sm">
                <LogoIcon size={40} />
              </div>
              <div className="flex justify-center bg-white p-6 rounded-lg shadow-sm">
                <LogoIcon size={30} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">รายละเอียดโลโก้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">สี</h3>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-md bg-[#2962FF]"></div>
                    <p className="mt-2 text-sm">#2962FF</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-md bg-[#0D47A1]"></div>
                    <p className="mt-2 text-sm">#0D47A1</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-md bg-white border"></div>
                    <p className="mt-2 text-sm">#FFFFFF</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">องค์ประกอบ</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>พื้นหลังไล่ระดับสีจาก #2962FF ไปยัง #0D47A1</li>
                  <li>มีกล่องพัสดุสีขาวด้านซ้าย</li>
                  <li>ชื่อแบรนด์ "ShipSync" ตัวอักษรเฉียงสีขาว</li>
                  <li>มีเส้นคลื่นขนส่งสีขาวแสดงการเคลื่อนที่</li>
                  <li>สโลแกนไทย "ส่งพัสดุรวดเร็ว ตรงเวลา"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoShowcase;