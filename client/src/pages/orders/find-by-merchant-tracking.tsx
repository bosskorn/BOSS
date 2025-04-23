import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { findOrderByMerchantTracking } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function FindByMerchantTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingNumber) {
      toast({
        title: 'โปรดระบุเลข Merchant Tracking',
        description: 'กรุณากรอกเลข Merchant Tracking Number ที่ต้องการค้นหา',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('กำลังค้นหาพัสดุด้วย Merchant Tracking Number:', trackingNumber);

      const response = await findOrderByMerchantTracking(trackingNumber);

      if (response.success) {
        setResult(response.data);
        toast({
          title: 'ค้นหาสำเร็จ',
          description: 'พบข้อมูลพัสดุเรียบร้อยแล้ว',
        });
      } else {
        setResult(null);
        setError(response.message || 'ไม่พบข้อมูลพัสดุ');
        toast({
          title: 'ไม่พบข้อมูล',
          description: response.message || 'ไม่พบข้อมูลพัสดุจากเลข Merchant Tracking ที่ระบุ',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการค้นหาพัสดุ:', error);
      setResult(null);
      setError(error.message || 'เกิดข้อผิดพลาดในการค้นหาพัสดุ');
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'เกิดข้อผิดพลาดในการค้นหาพัสดุ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">ค้นหาพัสดุด้วย Merchant Tracking Number</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ค้นหาพัสดุ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                placeholder="กรอกเลข Merchant Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
              </Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>Merchant Tracking Number คือเลขอ้างอิงที่ร้านค้ากำหนดเอง (เช่น เลขออเดอร์ของคุณ) ที่ส่งไปกับพัสดุตอนสร้างเลขพัสดุ</p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ไม่พบข้อมูล</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลพัสดุ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.pno && (
                  <div>
                    <h3 className="text-lg font-medium">เลขพัสดุ Flash Express</h3>
                    <p className="text-xl font-bold">{result.pno}</p>
                  </div>
                )}

                {result.outTradeNo && (
                  <div>
                    <h3 className="text-lg font-medium">เลขอ้างอิงร้านค้า</h3>
                    <p className="text-xl">{result.outTradeNo}</p>
                  </div>
                )}

                {result.createTime && (
                  <div>
                    <h3 className="text-lg font-medium">วันที่สร้าง</h3>
                    <p>{new Date(result.createTime).toLocaleString('th-TH')}</p>
                  </div>
                )}

                {result.currentStatus !== undefined && (
                  <div>
                    <h3 className="text-lg font-medium">สถานะปัจจุบัน</h3>
                    <p className="text-xl font-medium">
                      {result.currentStatusDesc || getStatusText(result.currentStatus)}
                    </p>
                  </div>
                )}

                <div className="bg-muted rounded-md p-4 mt-6">
                  <h3 className="text-lg font-medium mb-2">ข้อมูลทั้งหมด</h3>
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// แปลงรหัสสถานะเป็นข้อความที่อ่านง่าย
function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    1: 'สร้างเลขพัสดุแล้ว',
    2: 'อยู่ระหว่างการขนส่ง',
    3: 'จัดส่งสำเร็จแล้ว',
    4: 'เกิดปัญหาระหว่างการจัดส่ง',
    5: 'พัสดุถูกส่งคืน',
    6: 'ยกเลิกพัสดุแล้ว',
    7: 'รอดำเนินการ',
    // เพิ่มสถานะอื่นๆ ตามที่ Flash Express กำหนด
  };

  return statusMap[status] || `สถานะรหัส ${status}`;
}