
import React from 'react';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useLocation } from 'wouter';
import { LuTruck, LuPackageOpen, LuArrowRight } from 'react-icons/lu';

export default function CreateFlashExpressOrder() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="flex items-center mb-6 space-x-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <LuTruck className="text-purple-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
              จัดส่งพัสดุกับ Flash Express
            </h1>
            <p className="text-gray-600">บริการจัดส่งพัสดุสำหรับร้านค้าออนไลน์</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-purple-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <div className="flex items-center">
                <LuPackageOpen className="mr-2 h-5 w-5 text-purple-600" />
                <CardTitle>สร้างเลขพัสดุ Flash Express แบบใหม่</CardTitle>
              </div>
              <CardDescription>
                ใช้บริการจัดส่งพัสดุกับ Flash Express รองรับทั่วประเทศ
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1 mb-4">
                <li className="flex items-center">
                  <LuArrowRight className="mr-2 h-4 w-4 text-green-500" />
                  <span>สร้างเลขพัสดุได้อย่างรวดเร็ว</span>
                </li>
                <li className="flex items-center">
                  <LuArrowRight className="mr-2 h-4 w-4 text-green-500" />
                  <span>ติดตามสถานะพัสดุได้แบบเรียลไทม์</span>
                </li>
                <li className="flex items-center">
                  <LuArrowRight className="mr-2 h-4 w-4 text-green-500" />
                  <span>พิมพ์ใบปะหน้าพัสดุได้ทันที</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => setLocation('/flash-express-shipping-new')}
              >
                <LuTruck className="mr-2 h-4 w-4" /> สร้างเลขพัสดุ Flash Express
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border border-blue-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <div className="flex items-center">
                <LuPackageOpen className="mr-2 h-5 w-5 text-blue-600" />
                <CardTitle>ตรวจสอบสถานะพัสดุ</CardTitle>
              </div>
              <CardDescription>
                ติดตามและตรวจสอบสถานะพัสดุที่จัดส่งกับ Flash Express
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-1 mb-4">
                <li className="flex items-center">
                  <LuArrowRight className="mr-2 h-4 w-4 text-green-500" />
                  <span>ติดตามสถานะพัสดุแบบเรียลไทม์</span>
                </li>
                <li className="flex items-center">
                  <LuArrowRight className="mr-2 h-4 w-4 text-green-500" />
                  <span>ตรวจสอบประวัติการจัดส่ง</span>
                </li>
                <li className="flex items-center">
                  <LuArrowRight className="mr-2 h-4 w-4 text-green-500" />
                  <span>ขอพิมพ์ใบปะหน้าพัสดุซ้ำได้</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                variant="outline"
                onClick={() => setLocation('/orders/find-by-merchant-tracking')}
              >
                <LuTruck className="mr-2 h-4 w-4" /> ติดตามสถานะพัสดุ
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
