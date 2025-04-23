
import React, { useState } from 'react';
import { findOrderByMerchantTracking } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../hooks/use-toast';
import Layout from '../../components/Layout';

export default function FindByMerchantTrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingNumber) {
      toast({
        title: 'กรุณาระบุเลขติดตาม',
        description: 'โปรดใส่เลข Merchant Tracking Number เพื่อค้นหา',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await findOrderByMerchantTracking(trackingNumber);
      console.log('ข้อมูลที่ได้รับจากการค้นหา:', response);
      
      if (response.success) {
        setOrderData(response.data);
        toast({
          title: 'ค้นหาสำเร็จ',
          description: 'พบข้อมูลพัสดุเรียบร้อย',
        });
      } else {
        setOrderData(null);
        setError(response.message || 'ไม่พบข้อมูลพัสดุ');
        toast({
          title: 'ไม่พบข้อมูล',
          description: response.message || 'ไม่พบข้อมูลพัสดุจากเลขที่ค้นหา',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('เกิดข้อผิดพลาดในการค้นหา:', err);
      setOrderData(null);
      setError(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err.message || 'ไม่สามารถค้นหาข้อมูลได้ โปรดลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto my-10 px-4">
        <h1 className="text-2xl font-bold mb-6">ค้นหาพัสดุด้วยเลขอ้างอิงร้านค้า</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ค้นหาพัสดุ Flash Express</CardTitle>
            <CardDescription>
              ใส่เลขที่อ้างอิงร้านค้า (Merchant Tracking Number) เพื่อค้นหาพัสดุ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="กรอกเลขอ้างอิงร้านค้า"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            <p className="font-medium">ไม่พบข้อมูล</p>
            <p>{error}</p>
          </div>
        )}

        {orderData && (
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลพัสดุ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">รายละเอียดพัสดุ</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">เลขอ้างอิงร้านค้า:</td>
                        <td>{orderData.outTradeNo}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">เลขพัสดุ Flash Express:</td>
                        <td>{orderData.pno}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">สถานะ:</td>
                        <td>{orderData.orderStatusDesc || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">วันที่สร้าง:</td>
                        <td>{orderData.createTime ? new Date(orderData.createTime).toLocaleString('th-TH') : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">น้ำหนัก:</td>
                        <td>{orderData.weight ? `${orderData.weight} กรัม` : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">รายละเอียดผู้รับ</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">ชื่อผู้รับ:</td>
                        <td>{orderData.dstName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">เบอร์โทรผู้รับ:</td>
                        <td>{orderData.dstPhone || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">ที่อยู่:</td>
                        <td>{orderData.dstDetailAddress || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">จังหวัด:</td>
                        <td>{orderData.dstProvinceName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-medium text-gray-500">รหัสไปรษณีย์:</td>
                        <td>{orderData.dstPostalCode || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {orderData.sortCode && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="font-semibold text-lg mb-2 text-blue-800">ข้อมูลการคัดแยก</h3>
                  <p><span className="font-medium">รหัสคัดแยก:</span> {orderData.sortCode}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.print()}>พิมพ์ข้อมูล</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </Layout>
  );
}
