
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

export default function CreateOrderTest() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [orderData, setOrderData] = useState({
    outTradeNo: `ORD${Date.now().toString().slice(-8)}`,
    expressCategory: 1,
    srcName: 'ผู้ส่งทดสอบ',
    srcPhone: '0812345678',
    srcProvinceName: 'กรุงเทพมหานคร',
    srcCityName: 'ลาดพร้าว',
    srcPostalCode: '10230',
    srcDetailAddress: '123 ถนนลาดพร้าว',
    dstName: 'ผู้รับทดสอบ',
    dstPhone: '0897654321',
    dstProvinceName: 'เชียงใหม่',
    dstCityName: 'เมืองเชียงใหม่',
    dstPostalCode: '50000',
    dstDetailAddress: '456 ถนนนิมมานเหมินท์',
    items: [
      {
        name: 'สินค้าทดสอบ',
        quantity: 1,
        price: 500
      }
    ]
  });

  const [jsonData, setJsonData] = useState(JSON.stringify(orderData, null, 2));

  const handleTestAPI = async () => {
    setLoading(true);
    try {
      let dataToSend;
      try {
        dataToSend = JSON.parse(jsonData);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'รูปแบบ JSON ไม่ถูกต้อง',
          description: 'กรุณาตรวจสอบรูปแบบ JSON ที่ต้องการส่ง',
        });
        setLoading(false);
        return;
      }

      console.log('กำลังส่งข้อมูล:', dataToSend);
      
      const response = await axios.post('/api/orders/create', dataToSend);
      console.log('ผลการสร้างออเดอร์:', response.data);
      
      setResponse(response.data);
      
      toast({
        title: 'ส่งข้อมูลสำเร็จ',
        description: response.data.success 
          ? `สร้างออเดอร์สำเร็จ: ${response.data.order?.id || 'ไม่มีข้อมูล ID'}`
          : `เกิดข้อผิดพลาด: ${response.data.message || 'ไม่ระบุ'}`,
        variant: response.data.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      
      // จัดการ error จาก axios
      let errorMessage = 'ไม่สามารถสร้างออเดอร์ได้';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        setResponse(error.response.data);
      }
      
      toast({
        variant: 'destructive',
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonData(e.target.value);
  };

  const handleRandomOrderNumber = () => {
    const newOrderData = {
      ...JSON.parse(jsonData),
      outTradeNo: `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`
    };
    setJsonData(JSON.stringify(newOrderData, null, 2));
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">ทดสอบการสร้างออเดอร์</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลสำหรับทดสอบ</CardTitle>
              <CardDescription>แก้ไข JSON ตามที่ต้องการและกดปุ่มทดสอบ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleRandomOrderNumber} variant="outline" size="sm">
                  สุ่มเลขออเดอร์ใหม่
                </Button>
                
                <Textarea 
                  value={jsonData} 
                  onChange={handleCodeChange}
                  className="font-mono text-sm h-[600px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleTestAPI} disabled={loading}>
                {loading ? 'กำลังทดสอบ...' : 'ทดสอบการสร้างออเดอร์'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ผลลัพธ์</CardTitle>
              <CardDescription>ข้อมูลที่ได้รับจาก API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md h-[600px] overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {response ? JSON.stringify(response, null, 2) : 'ยังไม่มีข้อมูล'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
