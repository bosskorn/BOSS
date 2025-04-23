import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function TestFlashExpressV2Page() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันสร้างคำสั่งจัดส่งพัสดุใหม่
  const createOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/flash-express-test-v2/create-order', {});
      
      console.log('API Response:', response.data);
      setResponse(response.data);
      
      if (response.data.success) {
        toast({
          title: 'สร้างคำสั่งจัดส่งสำเร็จ',
          description: `เลขพัสดุ: ${response.data.trackingNumber || 'ไม่พบเลขพัสดุ'}`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: response.data.message || 'ไม่สามารถสร้างคำสั่งจัดส่งได้',
          variant: 'destructive'
        });
        setError(response.data.message || 'ไม่สามารถสร้างคำสั่งจัดส่งได้');
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'ไม่สามารถเชื่อมต่อกับ API ได้';
      setError(errorMessage);
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>ทดสอบ Flash Express API (เวอร์ชันใหม่)</CardTitle>
            <CardDescription>สร้างคำสั่งจัดส่งด้วยข้อมูลตัวอย่างตามรูปแบบที่กำหนด</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">รายละเอียดการทดสอบ</h3>
                <p>จะทำการส่งข้อมูลตัวอย่างไปยัง Flash Express API โดยใช้โครงสร้างข้อมูลตามตัวอย่าง</p>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <h4 className="font-semibold">ข้อผิดพลาด</h4>
                  <p>{error}</p>
                </div>
              )}
              
              {response && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="font-semibold mb-2">ผลลัพธ์</h4>
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-80">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={createOrder} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'กำลังดำเนินการ...' : 'ทดสอบสร้างคำสั่งจัดส่ง'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}