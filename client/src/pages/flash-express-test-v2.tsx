import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

import Layout from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LuPackageCheck, LuArrowRight, LuPrinter, LuRotateCw, LuBellRing } from 'react-icons/lu';

export default function FlashExpressTestV2() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // ทดสอบว่า API key ถูกตั้งค่าไว้หรือไม่
  const checkCredentials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/flash-express-test-v2/check-credentials');
      setCredentials(response.data);
      
      toast({
        title: 'ตรวจสอบข้อมูลเชื่อมต่อเรียบร้อย',
        description: response.data.success 
          ? 'พบข้อมูล API key และ merchant ID' 
          : 'ไม่พบข้อมูล API key หรือ merchant ID',
        variant: response.data.success ? 'default' : 'destructive',
      });
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลเชื่อมต่อ:', err);
      
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลเชื่อมต่อ');
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถตรวจสอบข้อมูลเชื่อมต่อได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ทดสอบสร้างออเดอร์
  const testCreateOrder = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      toast({
        title: 'กำลังดำเนินการ',
        description: 'กำลังทดสอบส่งข้อมูลไปยัง Flash Express API...',
      });
      
      const response = await api.post('/api/flash-express-test-v2/test-order-v2');
      setResult(response.data);
      
      if (response.data.success && response.data.trackingNumber) {
        setTrackingNumber(response.data.trackingNumber);
        
        toast({
          title: 'สร้างออเดอร์สำเร็จ',
          description: `เลขพัสดุ: ${response.data.trackingNumber}`,
        });
      } else {
        toast({
          title: 'สร้างออเดอร์ไม่สำเร็จ',
          description: response.data.message || 'ไม่สามารถสร้างออเดอร์ได้',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการทดสอบสร้างออเดอร์:', err);
      
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการทดสอบสร้างออเดอร์');
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err.response?.data?.message || err.message || 'ไม่สามารถสร้างออเดอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // พิมพ์ใบปะหน้าพัสดุ
  const printShippingLabel = (trackingNo: string) => {
    window.open(`/api/flash-express/print-label/${trackingNo}`, '_blank');
  };

  // ตรวจสอบสถานะพัสดุ
  const checkTrackingStatus = async (trackingNo: string) => {
    if (!trackingNo) {
      toast({
        title: 'ไม่พบเลขพัสดุ',
        description: 'กรุณาสร้างออเดอร์ก่อนตรวจสอบสถานะ',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.get(`/api/flash-express/track/${trackingNo}`);
      
      toast({
        title: 'ตรวจสอบสถานะพัสดุเรียบร้อย',
        description: `พบข้อมูลสถานะพัสดุเลขที่ ${trackingNo}`,
      });
      
      console.log('ข้อมูลติดตามพัสดุ:', response.data);
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะพัสดุ:', err);
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err.response?.data?.message || err.message || 'ไม่สามารถตรวจสอบสถานะพัสดุได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>กรุณาเข้าสู่ระบบ</CardTitle>
              <CardDescription>
                คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้งานระบบทดสอบ
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <a href="/auth">ไปยังหน้าเข้าสู่ระบบ</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6 space-x-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <LuPackageCheck className="text-purple-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
              ทดสอบ Flash Express API (Version 2)
            </h1>
            <p className="text-gray-600">ทดสอบการเชื่อมต่อและสร้างออเดอร์ Flash Express ในรูปแบบใหม่</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-purple-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle>ทดสอบการเชื่อมต่อ</CardTitle>
              <CardDescription>
                ตรวจสอบว่าสามารถเชื่อมต่อกับ Flash Express API ได้หรือไม่
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                onClick={checkCredentials} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <LuRotateCw className="mr-2 h-4 w-4 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    ตรวจสอบข้อมูลเชื่อมต่อ
                  </>
                )}
              </Button>

              {credentials && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">ผลการตรวจสอบ:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">สถานะ:</span>
                      <Badge className={credentials.success ? "bg-green-500" : "bg-red-500"}>
                        {credentials.success ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Merchant ID:</span>
                      <span>{credentials.merchantId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">API Key:</span>
                      <span>{credentials.apiKeyConfigured ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-purple-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle>ทดสอบสร้างออเดอร์</CardTitle>
              <CardDescription>
                ทดสอบสร้างออเดอร์และเลขพัสดุผ่าน Flash Express API
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                onClick={testCreateOrder} 
                disabled={isLoading}
                className="w-full mb-4"
              >
                {isLoading ? (
                  <>
                    <LuRotateCw className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสร้างออเดอร์...
                  </>
                ) : (
                  <>
                    สร้างออเดอร์ทดสอบ
                  </>
                )}
              </Button>

              {trackingNumber && (
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => printShippingLabel(trackingNumber)}
                    className="flex-1"
                  >
                    <LuPrinter className="mr-2 h-4 w-4" />
                    พิมพ์ใบปะหน้า
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => checkTrackingStatus(trackingNumber)}
                    className="flex-1"
                  >
                    <LuArrowRight className="mr-2 h-4 w-4" />
                    ตรวจสอบสถานะ
                  </Button>
                </div>
              )}

              {result && result.success && (
                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">
                    สร้างออเดอร์สำเร็จ
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">เลขพัสดุ:</span>
                      <Badge>{result.trackingNumber}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sort Code:</span>
                      <span>{result.sortCode || 'ไม่มีข้อมูล'}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-md">
                  <div className="flex items-center text-red-800 mb-2">
                    <LuBellRing className="h-5 w-5 mr-2" />
                    <h3 className="font-medium">เกิดข้อผิดพลาด</h3>
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {result && (
          <Card className="mt-6 border border-purple-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle>ผลลัพธ์จาก API</CardTitle>
              <CardDescription>
                ข้อมูลผลลัพธ์ที่ได้รับจาก Flash Express API
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <pre className="bg-gray-50 p-4 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}