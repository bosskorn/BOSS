import React, { useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LuInfo, LuServer, LuCheck, LuX, LuTriangle, LuPackage, LuTruck } from 'react-icons/lu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResponse {
  success: boolean;
  message: string;
  response?: any;
  error?: any;
  timestamp?: string;
  // Extended properties
  merchant_id?: string;
  api_key_status?: string;
  weight_grams?: number;
  express_type?: string;
  shipping_rate_baht?: number;
  tracking_number?: string;
  sort_code?: string;
  order_number?: string;
  pdf_url?: string;
}

export default function FlashExpressAPITest() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnectionTesting, setIsConnectionTesting] = useState(false);
  const [connectionResponse, setConnectionResponse] = useState<TestResponse | null>(null);
  
  const [isRateTesting, setIsRateTesting] = useState(false);
  const [weight, setWeight] = useState('1');
  const [expressType, setExpressType] = useState('1');
  const [rateResponse, setRateResponse] = useState<TestResponse | null>(null);
  
  const [isOrderTesting, setIsOrderTesting] = useState(false);
  const [orderResponse, setOrderResponse] = useState<TestResponse | null>(null);

  // ทดสอบการเชื่อมต่อกับ Flash Express API
  const testConnection = async () => {
    setIsConnectionTesting(true);
    setConnectionResponse(null);
    
    try {
      const response = await axios.get('/api/flash-express-api-test/connection-test');
      setConnectionResponse(response.data);
      
      toast({
        title: 'ทดสอบสำเร็จ',
        description: 'สามารถเชื่อมต่อกับ Flash Express API ได้',
        variant: 'default',
      });
    } catch (err: any) {
      console.error('Error testing Flash Express API connection:', err);
      
      let errorData = null;
      let errorMessage = 'มีข้อผิดพลาดในการทดสอบการเชื่อมต่อ';
      
      if (err.response) {
        errorData = err.response.data;
        errorMessage = err.response.data.message || errorMessage;
      }
      
      setConnectionResponse({
        success: false,
        message: errorMessage,
        error: errorData
      });
      
      toast({
        title: 'ทดสอบไม่สำเร็จ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnectionTesting(false);
    }
  };
  
  // ทดสอบการคำนวณค่าจัดส่ง
  const testShippingRate = async () => {
    setIsRateTesting(true);
    setRateResponse(null);
    
    try {
      const weightValue = parseInt(weight);
      const expressValue = parseInt(expressType);
      
      if (isNaN(weightValue) || weightValue <= 0) {
        throw new Error('น้ำหนักไม่ถูกต้อง');
      }
      
      const response = await axios.get(`/api/flash-express-api-test/shipping-rate-test?weight=${weightValue * 1000}&express_type=${expressValue}`);
      setRateResponse(response.data);
      
      toast({
        title: 'ทดสอบสำเร็จ',
        description: 'สามารถคำนวณค่าจัดส่งได้',
        variant: 'default',
      });
    } catch (err: any) {
      console.error('Error testing Flash Express shipping rate:', err);
      
      let errorData = null;
      let errorMessage = 'มีข้อผิดพลาดในการคำนวณค่าจัดส่ง';
      
      if (err.message === 'น้ำหนักไม่ถูกต้อง') {
        errorMessage = err.message;
      } else if (err.response) {
        errorData = err.response.data;
        errorMessage = err.response.data.message || errorMessage;
      }
      
      setRateResponse({
        success: false,
        message: errorMessage,
        error: errorData
      });
      
      toast({
        title: 'ทดสอบไม่สำเร็จ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsRateTesting(false);
    }
  };
  
  // ทดสอบการสร้างคำสั่งจัดส่ง
  const testCreateOrder = async () => {
    setIsOrderTesting(true);
    setOrderResponse(null);
    
    try {
      // ใช้ข้อมูลตัวอย่างสำหรับทดสอบ
      const testData = {
        senderName: "ทดสอบส่ง",
        senderPhone: "0899999999",
        senderProvince: "กรุงเทพมหานคร",
        senderCity: "ลาดพร้าว",
        senderDistrict: "จรเข้บัว",
        senderPostcode: "10230",
        senderAddress: "ที่อยู่ทดสอบ",
        
        receiverName: "ทดสอบรับ",
        receiverPhone: "0888888888",
        receiverProvince: "กรุงเทพมหานคร",
        receiverCity: "ห้วยขวาง",
        receiverDistrict: "สามเสนนอก",
        receiverPostcode: "10310",
        receiverAddress: "ที่อยู่ทดสอบ",
        
        weight: 1000, // น้ำหนักในกรัม (1 kg)
        width: 20,    // ความกว้างในเซนติเมตร
        length: 30,   // ความยาวในเซนติเมตร
        height: 10,   // ความสูงในเซนติเมตร
        
        expressCategory: 1, // 1 = ธรรมดา, 2 = ด่วน
        articleCategory: 1, // 1 = เอกสาร, 2 = พัสดุ
        itemCategory: 100,  // 100 = อื่นๆ
      };
      
      const response = await axios.post('/api/flash-express-api-test/create-simple-order', testData);
      setOrderResponse(response.data);
      
      toast({
        title: 'ทดสอบสำเร็จ',
        description: 'สามารถสร้างคำสั่งจัดส่งได้',
        variant: 'default',
      });
    } catch (err: any) {
      console.error('Error testing Flash Express create order:', err);
      
      let errorData = null;
      let errorMessage = 'มีข้อผิดพลาดในการสร้างคำสั่งจัดส่ง';
      
      if (err.response) {
        errorData = err.response.data;
        errorMessage = err.response.data.message || errorMessage;
      }
      
      setOrderResponse({
        success: false,
        message: errorMessage,
        error: errorData
      });
      
      toast({
        title: 'ทดสอบไม่สำเร็จ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsOrderTesting(false);
    }
  };
  
  // แสดงผลการทดสอบการเชื่อมต่อ
  const renderConnectionResult = () => {
    if (!connectionResponse) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <Alert variant={connectionResponse.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {connectionResponse.success ? (
              <LuCheck className="h-5 w-5" />
            ) : (
              <LuX className="h-5 w-5" />
            )}
            <AlertTitle>{connectionResponse.success ? "การเชื่อมต่อสำเร็จ" : "การเชื่อมต่อล้มเหลว"}</AlertTitle>
          </div>
          <AlertDescription>
            {connectionResponse.message}
          </AlertDescription>
        </Alert>
        
        <div className="bg-slate-50 p-4 rounded border mt-4">
          <div className="text-sm font-medium mb-2">ข้อมูลการเชื่อมต่อ:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Merchant ID:</span> {connectionResponse.merchant_id || 'N/A'}
            </div>
            <div>
              <span className="font-medium">สถานะ API Key:</span>{' '}
              <Badge 
                variant="outline" 
                className={connectionResponse.api_key_status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                {connectionResponse.api_key_status || 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">เวลาทดสอบ:</span> {connectionResponse.timestamp || new Date().toISOString()}
            </div>
          </div>
        </div>
        
        {connectionResponse.response && (
          <div className="mt-4">
            <Label>ข้อมูลตอบกลับจาก API:</Label>
            <div className="bg-slate-950 text-slate-50 p-3 rounded text-xs overflow-auto mt-1">
              <pre>{JSON.stringify(connectionResponse.response, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {connectionResponse.error && (
          <div className="mt-4">
            <Label>ข้อผิดพลาด:</Label>
            <div className="bg-red-950 text-red-50 p-3 rounded text-xs overflow-auto mt-1">
              <pre>{JSON.stringify(connectionResponse.error, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // แสดงผลการทดสอบการคำนวณค่าจัดส่ง
  const renderRateResult = () => {
    if (!rateResponse) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <Alert variant={rateResponse.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {rateResponse.success ? (
              <LuCheck className="h-5 w-5" />
            ) : (
              <LuX className="h-5 w-5" />
            )}
            <AlertTitle>{rateResponse.success ? "การคำนวณค่าจัดส่งสำเร็จ" : "การคำนวณค่าจัดส่งล้มเหลว"}</AlertTitle>
          </div>
          <AlertDescription>
            {rateResponse.message}
          </AlertDescription>
        </Alert>
        
        {rateResponse.success && (
          <div className="bg-slate-50 p-4 rounded border mt-4">
            <div className="text-sm font-medium mb-2">ข้อมูลค่าจัดส่ง:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">น้ำหนัก:</span> {rateResponse.weight_grams ? `${rateResponse.weight_grams / 1000} kg` : 'N/A'}
              </div>
              <div>
                <span className="font-medium">ประเภทการจัดส่ง:</span> {rateResponse.express_type || 'N/A'}
              </div>
              <div>
                <span className="font-medium">ค่าจัดส่ง:</span>{' '}
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {rateResponse.shipping_rate_baht ? `${rateResponse.shipping_rate_baht.toFixed(2)} บาท` : 'N/A'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">เวลาคำนวณ:</span> {rateResponse.timestamp || new Date().toISOString()}
              </div>
            </div>
          </div>
        )}
        
        {rateResponse.response && (
          <div className="mt-4">
            <Label>ข้อมูลตอบกลับจาก API:</Label>
            <div className="bg-slate-950 text-slate-50 p-3 rounded text-xs overflow-auto mt-1">
              <pre>{JSON.stringify(rateResponse.response, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {rateResponse.error && (
          <div className="mt-4">
            <Label>ข้อผิดพลาด:</Label>
            <div className="bg-red-950 text-red-50 p-3 rounded text-xs overflow-auto mt-1">
              <pre>{JSON.stringify(rateResponse.error, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // แสดงผลการทดสอบการสร้างคำสั่งจัดส่ง
  const renderOrderResult = () => {
    if (!orderResponse) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <Alert variant={orderResponse.success ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {orderResponse.success ? (
              <LuCheck className="h-5 w-5" />
            ) : (
              <LuX className="h-5 w-5" />
            )}
            <AlertTitle>{orderResponse.success ? "การสร้างคำสั่งจัดส่งสำเร็จ" : "การสร้างคำสั่งจัดส่งล้มเหลว"}</AlertTitle>
          </div>
          <AlertDescription>
            {orderResponse.message}
          </AlertDescription>
        </Alert>
        
        {orderResponse.success && (
          <div className="bg-slate-50 p-4 rounded border mt-4">
            <div className="text-sm font-medium mb-2">ข้อมูลพัสดุ:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">เลขพัสดุ:</span>{' '}
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {orderResponse.tracking_number || 'N/A'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">รหัสคัดแยก:</span> {orderResponse.sort_code || 'N/A'}
              </div>
              <div>
                <span className="font-medium">เลขอ้างอิง:</span> {orderResponse.order_number || 'N/A'}
              </div>
              {orderResponse.pdf_url && (
                <div className="md:col-span-2">
                  <span className="font-medium">ใบปะหน้าพัสดุ:</span>{' '}
                  <a 
                    href={orderResponse.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    เปิดใบปะหน้าพัสดุ
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {orderResponse.response && (
          <div className="mt-4">
            <Label>ข้อมูลตอบกลับจาก API:</Label>
            <div className="bg-slate-950 text-slate-50 p-3 rounded text-xs overflow-auto mt-1">
              <pre>{JSON.stringify(orderResponse.response, null, 2)}</pre>
            </div>
          </div>
        )}
        
        {orderResponse.error && (
          <div className="mt-4">
            <Label>ข้อผิดพลาด:</Label>
            <div className="bg-red-950 text-red-50 p-3 rounded text-xs overflow-auto mt-1">
              <pre>{JSON.stringify(orderResponse.error, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // ถ้ายังไม่ได้ล็อกอิน ให้แสดงข้อความแจ้ง
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>กรุณาเข้าสู่ระบบ</CardTitle>
              <CardDescription>
                คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้งานเครื่องมือทดสอบ API
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
      <div className="container mx-auto py-8 px-4 font-kanit">
        <div className="flex items-center mb-6 space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <LuServer className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-600 bg-clip-text text-transparent">
              ทดสอบ Flash Express API
            </h1>
            <p className="text-gray-600">ตรวจสอบการเชื่อมต่อและทดสอบการใช้งาน API</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Alert>
            <LuInfo className="h-4 w-4" />
            <AlertTitle>เกี่ยวกับเครื่องมือทดสอบ</AlertTitle>
            <AlertDescription>
              เครื่องมือนี้ใช้สำหรับทดสอบการเชื่อมต่อกับ Flash Express API และการใช้งานฟังก์ชันต่างๆ 
              เช่น การคำนวณค่าจัดส่งและการสร้างเลขพัสดุ
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>ทดสอบ Flash Express API</CardTitle>
              <CardDescription>
                เลือกการทดสอบที่ต้องการจากแท็บด้านล่าง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connection">
                    <div className="flex items-center gap-1.5">
                      <LuServer className="h-4 w-4" />
                      <span>การเชื่อมต่อ</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="shipping-rate">
                    <div className="flex items-center gap-1.5">
                      <LuTruck className="h-4 w-4" />
                      <span>ค่าจัดส่ง</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="create-order">
                    <div className="flex items-center gap-1.5">
                      <LuPackage className="h-4 w-4" />
                      <span>สร้างพัสดุ</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="connection" className="space-y-4">
                  <div className="pt-4">
                    <div className="flex items-center mb-4">
                      <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">01</Badge>
                      <h3 className="text-lg font-medium">ทดสอบการเชื่อมต่อกับ Flash Express API</h3>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="merchant-id">Merchant ID</Label>
                            <Input
                              id="merchant-id"
                              value={process.env.FLASH_EXPRESS_MERCHANT_ID || import.meta.env.VITE_FLASH_EXPRESS_MERCHANT_ID || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="api-key-status">API Key Status</Label>
                            <div className="flex items-center">
                              <Badge 
                                variant={connectionResponse?.api_key_status === 'Active' ? 'outline' : 'destructive'}
                                className={connectionResponse?.api_key_status === 'Active' ? "ml-2 bg-green-50 text-green-700 border-green-200" : "ml-2"}
                              >
                                {connectionResponse?.api_key_status || 'ยังไม่ได้ทดสอบ'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end">
                            <Button 
                              onClick={testConnection} 
                              disabled={isConnectionTesting}
                            >
                              {isConnectionTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {renderConnectionResult()}
                  </div>
                </TabsContent>
                
                <TabsContent value="shipping-rate" className="space-y-4">
                  <div className="pt-4">
                    <div className="flex items-center mb-4">
                      <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">02</Badge>
                      <h3 className="text-lg font-medium">ทดสอบการคำนวณค่าจัดส่ง</h3>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="weight">น้ำหนักพัสดุ (กิโลกรัม)</Label>
                            <Input
                              id="weight"
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="express-type">ประเภทการจัดส่ง</Label>
                            <select
                              id="express-type"
                              value={expressType}
                              onChange={(e) => setExpressType(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="1">ธรรมดา (Flash Standard)</option>
                              <option value="2">ด่วน (Flash Express)</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-end">
                            <Button
                              onClick={testShippingRate}
                              disabled={isRateTesting}
                            >
                              {isRateTesting ? 'กำลังคำนวณ...' : 'คำนวณค่าจัดส่ง'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {renderRateResult()}
                  </div>
                </TabsContent>
                
                <TabsContent value="create-order" className="space-y-4">
                  <div className="pt-4">
                    <div className="flex items-center mb-4">
                      <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700 border-purple-200">03</Badge>
                      <h3 className="text-lg font-medium">ทดสอบการสร้างคำสั่งจัดส่ง</h3>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <Alert variant="destructive" className="mb-4">
                          <LuTriangle className="h-4 w-4" />
                          <AlertTitle>ข้อควรระวัง</AlertTitle>
                          <AlertDescription>
                            การทดสอบนี้จะสร้างเลขพัสดุจริงในระบบ Flash Express โดยใช้ข้อมูลตัวอย่าง
                          </AlertDescription>
                        </Alert>
                        
                        <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm">
                          <div className="font-medium mb-2">ข้อมูลที่ใช้ทดสอบ:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">ผู้ส่ง:</span> ทดสอบส่ง (0899999999) กรุงเทพฯ
                            </div>
                            <div>
                              <span className="font-medium">ผู้รับ:</span> ทดสอบรับ (0888888888) กรุงเทพฯ
                            </div>
                            <div>
                              <span className="font-medium">น้ำหนัก:</span> 1 กิโลกรัม
                            </div>
                            <div>
                              <span className="font-medium">ขนาด:</span> 30 x 20 x 10 ซม.
                            </div>
                            <div>
                              <span className="font-medium">ประเภทการจัดส่ง:</span> ธรรมดา (Flash Standard)
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end">
                          <Button
                            onClick={testCreateOrder}
                            disabled={isOrderTesting}
                            variant="default"
                          >
                            {isOrderTesting ? 'กำลังสร้างคำสั่งจัดส่ง...' : 'ทดสอบสร้างคำสั่งจัดส่ง'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {renderOrderResult()}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}