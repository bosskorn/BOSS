import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Box, Shield, Truck, BarChart4, File, UserCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white font-kanit">
      {/* Header/Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center">
              <Logo size="medium" className="mr-2" />
              <span className="text-2xl font-bold">SHIPSYNC</span>
            </div>
            <div className="space-x-4">
              <Link href="/auth">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-900">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center pb-20">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                ระบบจัดการขนส่งอัจฉริยะ<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                  สำหรับธุรกิจของคุณ
                </span>
              </h1>
              <p className="text-lg mb-8 text-purple-100">
                บริหารจัดการการขนส่งทั้งหมดในที่เดียว ด้วยระบบที่ใช้งานง่าย 
                พร้อมการวิเคราะห์ข้อมูลที่ช่วยให้ธุรกิจของคุณเติบโตอย่างมีประสิทธิภาพ
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-100">
                    เริ่มต้นใช้งานฟรี <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-900">
                    ติดต่อเรา
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl"></div>
                <div className="relative p-6 md:p-10">
                  <div className="flex justify-between mb-8">
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <Truck className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <BarChart4 className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <Box className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="space-y-4 text-center">
                    <h3 className="text-2xl font-semibold text-white">ส่งพัสดุรวดเร็ว ตรงเวลา</h3>
                    <p className="text-white/80">การจัดส่งที่รวดเร็วและแม่นยำ พร้อมการติดตามแบบเรียลไทม์</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-16 bg-gradient-to-b from-purple-700 to-transparent"></div>
      </div>
      
      {/* Features Section */}
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">คุณสมบัติหลักของระบบ</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            SHIPSYNC มีคุณสมบัติที่ครบถ้วนเพื่อให้การจัดการขนส่งของคุณเป็นเรื่องง่าย 
            ประหยัดเวลา และมีประสิทธิภาพสูงสุด
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Box className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">จัดการสินค้าและออเดอร์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                บริหารสินค้า หมวดหมู่ และออเดอร์ในที่เดียว พร้อมระบบบริหารคลังสินค้า
                และการติดตามสถานะการจัดส่ง
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">เชื่อมต่อกับขนส่งชั้นนำ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                สร้างและพิมพ์ใบแจ้งส่งพัสดุได้อัตโนมัติ รองรับการเชื่อมต่อกับ Flash Express 
                และบริการขนส่งชั้นนำต่างๆ
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <File className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">นำเข้าข้อมูลจากไฟล์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                นำเข้าข้อมูลสินค้า ลูกค้า และออเดอร์ได้อย่างง่ายดายจากไฟล์ Excel 
                และ CSV พร้อมระบบตรวจสอบความถูกต้อง
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart4 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">รายงานและการวิเคราะห์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                ดูภาพรวมและวิเคราะห์ข้อมูลธุรกิจด้วยรายงานที่ครอบคลุมทั้งยอดขาย
                การจัดส่ง และพฤติกรรมลูกค้า
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <UserCircle2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">จัดการลูกค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                จัดเก็บและจัดการข้อมูลลูกค้าอย่างเป็นระบบ พร้อมประวัติการสั่งซื้อ
                และระบบวิเคราะห์ที่อยู่อัตโนมัติ
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">ความปลอดภัยสูง</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                ระบบรักษาความปลอดภัยมาตรฐานสูง การเข้ารหัสข้อมูล และการควบคุม
                การเข้าถึงตามบทบาทของผู้ใช้งาน
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมเริ่มใช้งานแล้วหรือยัง?</h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            เริ่มต้นใช้งาน SHIPSYNC ได้ฟรีวันนี้ และยกระดับการจัดการขนส่งของคุณ
            สู่มาตรฐานใหม่ที่ง่าย รวดเร็ว และมีประสิทธิภาพมากขึ้น
          </p>
          <div className="flex justify-center flex-wrap gap-4">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-100">
                สมัครสมาชิกฟรี <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-900">
              ดูแพ็คเกจและราคา
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Logo size="small" className="mr-2" />
                <span className="text-xl font-bold">SHIPSYNC</span>
              </div>
              <p className="text-gray-400 mb-4">
                ระบบจัดการขนส่งอัจฉริยะ<br />
                ส่งพัสดุรวดเร็ว ตรงเวลา
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">บริษัท</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-purple-400">ทีมงาน</a></li>
                <li><a href="#" className="hover:text-purple-400">ข่าวสาร</a></li>
                <li><a href="#" className="hover:text-purple-400">ร่วมงานกับเรา</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">ฟีเจอร์</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400">จัดการออเดอร์</a></li>
                <li><a href="#" className="hover:text-purple-400">จัดการสินค้า</a></li>
                <li><a href="#" className="hover:text-purple-400">รายงาน</a></li>
                <li><a href="#" className="hover:text-purple-400">นำเข้าข้อมูล</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">ติดต่อเรา</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@shipsync.co.th</li>
                <li>02-123-4567</li>
                <li>กรุงเทพฯ, ประเทศไทย</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between">
            <p className="text-gray-500">&copy; 2025 SHIPSYNC. สงวนลิขสิทธิ์.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-purple-400">นโยบายความเป็นส่วนตัว</a>
              <a href="#" className="text-gray-500 hover:text-purple-400">เงื่อนไขการใช้งาน</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;