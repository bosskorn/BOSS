import React from 'react';
import { Link } from 'wouter';
import { MapPin, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/Logo';

const TravelLanding: React.FC = () => {
  return (
    <div className="bg-white font-kanit min-h-screen">
      <nav className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/auth">
              <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">สมัครใช้งาน</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent leading-tight">
              ค้นหาสถานที่ท่องเที่ยวในฝัน
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Travelly ช่วยให้คุณวางแผนทริป จองที่พัก และตั๋วเครื่องบินได้อย่างง่ายดายในที่เดียว
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-full text-base font-medium">
                  เริ่มต้นใช้งานฟรี
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" className="border-blue-600 text-blue-600 h-12 px-8 rounded-full text-base font-medium hover:bg-blue-50">
                  ดูคุณสมบัติ
                </Button>
              </a>
            </div>
          </div>
          <div className="md:w-1/2">
            <img
              src="https://source.unsplash.com/featured/?travel"
              alt="Travel"
              className="rounded-lg shadow-md w-full"
            />
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">คุณสมบัติเด่น</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ทุกอย่างที่คุณต้องการสำหรับการท่องเที่ยวในที่เดียว
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <MapPin className="h-8 w-8 text-blue-600" />,
                title: 'ค้นหาสถานที่',
                description: 'ค้นหาที่เที่ยวทั่วโลก พร้อมรีวิวและคำแนะนำจากผู้ใช้งานจริง',
              },
              {
                icon: <Calendar className="h-8 w-8 text-blue-600" />,
                title: 'วางแผนทริป',
                description: 'เลือกวันเดินทางและจัดตารางทริปอย่างง่ายดาย',
              },
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: 'ชุมชนผู้เดินทาง',
                description: 'แบ่งปันประสบการณ์และรับคำแนะนำจากนักเดินทางคนอื่นๆ',
              },
              {
                icon: <Star className="h-8 w-8 text-blue-600" />,
                title: 'รีวิวที่พักและสายการบิน',
                description: 'ข้อมูลรีวิวจากผู้ใช้งานจริง ช่วยให้ตัดสินใจได้ดียิ่งขึ้น',
              },
            ].map((feature, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow p-6 rounded-xl">
                <CardContent className="p-0">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมออกเดินทางแล้วหรือยัง?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            ลงทะเบียนกับ Travelly และเริ่มต้นวางแผนทริปในฝันของคุณได้ทันที
          </p>
          <Link href="/auth">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 rounded-full text-base font-medium">
              สมัครใช้งาน
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TravelLanding;
