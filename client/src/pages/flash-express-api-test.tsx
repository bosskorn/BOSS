import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AddressData {
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
}

interface ShippingData {
  outTradeNo: string;
  srcName: string;
  srcPhone: string;
  srcProvinceName: string;
  srcCityName: string;
  srcDistrictName: string;
  srcPostalCode: string;
  srcDetailAddress: string;
  dstName: string;
  dstPhone: string;
  dstProvinceName: string;
  dstCityName: string;
  dstDistrictName: string;
  dstPostalCode: string;
  dstDetailAddress: string;
  articleCategory: number;
  expressCategory: number;
  weight: number;
  width?: number;
  length?: number;
  height?: number;
  insured: number;
  codEnabled: number;
  codAmount?: number;
  remark?: string;
}

export default function FlashExpressAPITest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rateResponse, setRateResponse] = useState<any>(null);
  const [shippingResponse, setShippingResponse] = useState<any>(null);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  
  // ข้อมูลที่อยู่สำหรับดึงอัตราค่าขนส่ง
  const [fromAddress, setFromAddress] = useState<AddressData>({
    province: 'กรุงเทพมหานคร',
    district: 'ลาดพร้าว',
    subdistrict: 'จรเข้บัว',
    zipcode: '10230'
  });
  
  const [toAddress, setToAddress] = useState<AddressData>({
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    subdistrict: 'ช้างคลาน',
    zipcode: '50100'
  });
  
  const [weight, setWeight] = useState(1.0);
  
  // ข้อมูลสำหรับสร้างการจัดส่ง
  const [shippingData, setShippingData] = useState<ShippingData>({
    outTradeNo: `TEST${Date.now()}`,
    srcName: user?.fullname || 'ผู้ทดสอบ',
    srcPhone: user?.phone || '0812345678',
    srcProvinceName: 'กรุงเทพมหานคร',
    srcCityName: 'ลาดพร้าว',
    srcDistrictName: 'จรเข้บัว',
    srcPostalCode: '10230',
    srcDetailAddress: user?.address || '123 ถนนทดสอบ',
    dstName: 'ลูกค้าทดสอบ',
    dstPhone: '0812345678',
    dstProvinceName: 'เชียงใหม่',
    dstCityName: 'เมืองเชียงใหม่',
    dstDistrictName: 'ช้างคลาน',
    dstPostalCode: '50100',
    dstDetailAddress: '456 ถนนทดสอบ ต.ช้างคลาน อ.เมือง จ.เชียงใหม่ 50100',
    articleCategory: 1, // เสื้อผ้า
    expressCategory: 1, // ส่งปกติ
    weight: 1000, // 1 kg (หน่วยเป็น g)
    insured: 0, // ไม่มีประกัน
    codEnabled: 0, // ไม่มี COD
  });
  
  // ดึงข้อมูลค่าจัดส่ง
  const getShippingRates = async () => {
    try {
      setLoading(true);
      
      console.log('กำลังเรียก API เพื่อดึงข้อมูลค่าจัดส่ง:', {
        fromAddress,
        toAddress,
        weight
      });
      
      const response = await apiRequest(
        'POST',
        '/api/shipping-methods/flash-express/rates',
        {
          fromAddress,
          toAddress,
          weight
        }
      );
      
      const data = await response.json();
      console.log('ข้อมูลค่าจัดส่งที่ได้รับ:', data);
      setRateResponse(data);
      
      toast({
        title: 'ดึงข้อมูลสำเร็จ',
        description: 'ได้รับข้อมูลค่าจัดส่งจาก Flash Express API แล้ว',
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลค่าจัดส่ง:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลค่าจัดส่งได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // สร้างการจัดส่ง
  const createShipping = async () => {
    try {
      setLoading(true);
      
      console.log('กำลังเรียก API เพื่อสร้างการจัดส่ง:', {
        orderData: shippingData
      });
      
      const response = await apiRequest(
        'POST',
        '/api/shipping-methods/flash-express/shipping',
        {
          orderData: shippingData
        }
      );
      
      const data = await response.json();
      console.log('ข้อมูลการจัดส่งที่ได้รับ:', data);
      setShippingResponse(data);
      
      if (data.success) {
        toast({
          title: 'สร้างการจัดส่งสำเร็จ',
          description: `เลขพัสดุ: ${data.trackingNumber}`,
        });
      } else {
        toast({
          title: 'สร้างการจัดส่งไม่สำเร็จ',
          description: data.message || 'เกิดข้อผิดพลาดในการสร้างการจัดส่ง',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสร้างการจัดส่ง:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างการจัดส่งได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // อัพเดตข้อมูลที่อยู่ต้นทาง
  const updateFromAddress = (key: keyof AddressData, value: string) => {
    setFromAddress(prev => ({ ...prev, [key]: value }));
  };
  
  // อัพเดตข้อมูลที่อยู่ปลายทาง
  const updateToAddress = (key: keyof AddressData, value: string) => {
    setToAddress(prev => ({ ...prev, [key]: value }));
  };
  
  // อัพเดตข้อมูลการจัดส่ง
  const updateShippingData = (key: keyof ShippingData, value: any) => {
    setShippingData(prev => ({ ...prev, [key]: value }));
  };
  
  // ทดสอบการเชื่อมต่อกับ Flash Express API โดยตรง
  const testConnection = async () => {
    try {
      setLoading(true);
      
      console.log('กำลังทดสอบการเชื่อมต่อกับ Flash Express API...');
      
      const response = await apiRequest(
        'GET',
        '/api/flash-express/test',
        null
      );
      
      const data = await response.json();
      console.log('ผลการทดสอบการเชื่อมต่อ:', data);
      setConnectionTestResult(data);
      
      toast({
        title: data.success ? 'การเชื่อมต่อสำเร็จ' : 'การเชื่อมต่อไม่สำเร็จ',
        description: data.message || (data.success ? 'สามารถเชื่อมต่อกับ Flash Express API ได้' : 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้'),
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ:', error);
      setConnectionTestResult({ success: false, error: String(error) });
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">ทดสอบการเชื่อมต่อ Flash Express API</h1>
        
        <Tabs defaultValue="connection">
          <TabsList className="mb-4">
            <TabsTrigger value="connection">ทดสอบการเชื่อมต่อ</TabsTrigger>
            <TabsTrigger value="rates">ทดสอบดึงข้อมูลค่าจัดส่ง</TabsTrigger>
            <TabsTrigger value="shipping">ทดสอบสร้างการจัดส่ง</TabsTrigger>
          </TabsList>
          
          {/* แท็บทดสอบดึงข้อมูลค่าจัดส่ง */}
          <TabsContent value="rates">
            <div className="grid md:grid-cols-2 gap-6">
              {/* ฟอร์มกรอกข้อมูล */}
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลต้นทางและปลายทาง</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">ที่อยู่ต้นทาง</h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="fromProvince">จังหวัด</Label>
                          <Input 
                            id="fromProvince"
                            value={fromAddress.province}
                            onChange={(e) => updateFromAddress('province', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromDistrict">อำเภอ/เขต</Label>
                          <Input 
                            id="fromDistrict"
                            value={fromAddress.district}
                            onChange={(e) => updateFromAddress('district', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromSubdistrict">ตำบล/แขวง</Label>
                          <Input 
                            id="fromSubdistrict"
                            value={fromAddress.subdistrict}
                            onChange={(e) => updateFromAddress('subdistrict', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromZipcode">รหัสไปรษณีย์</Label>
                          <Input 
                            id="fromZipcode"
                            value={fromAddress.zipcode}
                            onChange={(e) => updateFromAddress('zipcode', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">ที่อยู่ปลายทาง</h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="toProvince">จังหวัด</Label>
                          <Input 
                            id="toProvince"
                            value={toAddress.province}
                            onChange={(e) => updateToAddress('province', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="toDistrict">อำเภอ/เขต</Label>
                          <Input 
                            id="toDistrict"
                            value={toAddress.district}
                            onChange={(e) => updateToAddress('district', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="toSubdistrict">ตำบล/แขวง</Label>
                          <Input 
                            id="toSubdistrict"
                            value={toAddress.subdistrict}
                            onChange={(e) => updateToAddress('subdistrict', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="toZipcode">รหัสไปรษณีย์</Label>
                          <Input 
                            id="toZipcode"
                            value={toAddress.zipcode}
                            onChange={(e) => updateToAddress('zipcode', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="weight">น้ำหนัก (กิโลกรัม)</Label>
                      <Input 
                        id="weight"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <Button 
                      onClick={getShippingRates} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'กำลังดำเนินการ...' : 'ตรวจสอบค่าจัดส่ง'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* แสดงผลข้อมูลที่ได้รับ */}
              <Card>
                <CardHeader>
                  <CardTitle>ผลการดึงข้อมูลค่าจัดส่ง</CardTitle>
                </CardHeader>
                <CardContent>
                  {rateResponse ? (
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap h-[600px] overflow-auto">
                      <pre>{JSON.stringify(rateResponse, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      ยังไม่มีข้อมูล กรุณากดปุ่ม 'ตรวจสอบค่าจัดส่ง' เพื่อเริ่มดึงข้อมูล
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* แท็บทดสอบการเชื่อมต่อ */}
          <TabsContent value="connection">
            <div className="grid md:grid-cols-2 gap-6">
              {/* คำอธิบายการทดสอบ */}
              <Card>
                <CardHeader>
                  <CardTitle>ทดสอบการเชื่อมต่อกับ Flash Express API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <AlertTitle>วิธีการทดสอบ</AlertTitle>
                      <AlertDescription>
                        กดปุ่ม "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบว่าระบบสามารถเชื่อมต่อกับ Flash Express API ได้หรือไม่
                        การทดสอบนี้จะส่งคำขอตรวจสอบไปยัง Flash Express API โดยตรง
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={testConnection} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* แสดงผลลัพธ์การทดสอบ */}
              <Card>
                <CardHeader>
                  <CardTitle>ผลการทดสอบการเชื่อมต่อ</CardTitle>
                </CardHeader>
                <CardContent>
                  {connectionTestResult ? (
                    <div>
                      {connectionTestResult.success ? (
                        <Alert className="mb-4">
                          <AlertTitle className="text-green-600">เชื่อมต่อสำเร็จ</AlertTitle>
                          <AlertDescription>
                            สามารถเชื่อมต่อกับ Flash Express API ได้
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="mb-4" variant="destructive">
                          <AlertTitle>เชื่อมต่อไม่สำเร็จ</AlertTitle>
                          <AlertDescription>
                            {connectionTestResult.message || 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้'}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap h-[500px] overflow-auto">
                        <pre>{JSON.stringify(connectionTestResult, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      ยังไม่มีข้อมูล กรุณากดปุ่ม 'ทดสอบการเชื่อมต่อ' เพื่อเริ่มการทดสอบ
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* แท็บทดสอบสร้างการจัดส่ง */}
          <TabsContent value="shipping">
            <div className="grid md:grid-cols-2 gap-6">
              {/* ฟอร์มสร้างการจัดส่ง */}
              <Card>
                <CardHeader>
                  <CardTitle>สร้างการจัดส่งกับ Flash Express</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                    <div>
                      <Label htmlFor="outTradeNo">หมายเลขออเดอร์</Label>
                      <Input 
                        id="outTradeNo"
                        value={shippingData.outTradeNo}
                        onChange={(e) => updateShippingData('outTradeNo', e.target.value)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">ข้อมูลผู้ส่ง</h3>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label htmlFor="srcName">ชื่อผู้ส่ง</Label>
                          <Input 
                            id="srcName"
                            value={shippingData.srcName}
                            onChange={(e) => updateShippingData('srcName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="srcPhone">เบอร์โทรผู้ส่ง</Label>
                          <Input 
                            id="srcPhone"
                            value={shippingData.srcPhone}
                            onChange={(e) => updateShippingData('srcPhone', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="srcProvinceName">จังหวัด</Label>
                            <Input 
                              id="srcProvinceName"
                              value={shippingData.srcProvinceName}
                              onChange={(e) => updateShippingData('srcProvinceName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="srcCityName">อำเภอ/เขต</Label>
                            <Input 
                              id="srcCityName"
                              value={shippingData.srcCityName}
                              onChange={(e) => updateShippingData('srcCityName', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="srcDistrictName">ตำบล/แขวง</Label>
                            <Input 
                              id="srcDistrictName"
                              value={shippingData.srcDistrictName}
                              onChange={(e) => updateShippingData('srcDistrictName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="srcPostalCode">รหัสไปรษณีย์</Label>
                            <Input 
                              id="srcPostalCode"
                              value={shippingData.srcPostalCode}
                              onChange={(e) => updateShippingData('srcPostalCode', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="srcDetailAddress">ที่อยู่</Label>
                          <Input 
                            id="srcDetailAddress"
                            value={shippingData.srcDetailAddress}
                            onChange={(e) => updateShippingData('srcDetailAddress', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">ข้อมูลผู้รับ</h3>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label htmlFor="dstName">ชื่อผู้รับ</Label>
                          <Input 
                            id="dstName"
                            value={shippingData.dstName}
                            onChange={(e) => updateShippingData('dstName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dstPhone">เบอร์โทรผู้รับ</Label>
                          <Input 
                            id="dstPhone"
                            value={shippingData.dstPhone}
                            onChange={(e) => updateShippingData('dstPhone', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="dstProvinceName">จังหวัด</Label>
                            <Input 
                              id="dstProvinceName"
                              value={shippingData.dstProvinceName}
                              onChange={(e) => updateShippingData('dstProvinceName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dstCityName">อำเภอ/เขต</Label>
                            <Input 
                              id="dstCityName"
                              value={shippingData.dstCityName}
                              onChange={(e) => updateShippingData('dstCityName', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="dstDistrictName">ตำบล/แขวง</Label>
                            <Input 
                              id="dstDistrictName"
                              value={shippingData.dstDistrictName}
                              onChange={(e) => updateShippingData('dstDistrictName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dstPostalCode">รหัสไปรษณีย์</Label>
                            <Input 
                              id="dstPostalCode"
                              value={shippingData.dstPostalCode}
                              onChange={(e) => updateShippingData('dstPostalCode', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="dstDetailAddress">ที่อยู่</Label>
                          <Input 
                            id="dstDetailAddress"
                            value={shippingData.dstDetailAddress}
                            onChange={(e) => updateShippingData('dstDetailAddress', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">ข้อมูลพัสดุ</h3>
                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="articleCategory">ประเภทสินค้า</Label>
                            <Input 
                              id="articleCategory"
                              type="number"
                              value={shippingData.articleCategory}
                              onChange={(e) => updateShippingData('articleCategory', parseInt(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">1 = เสื้อผ้า, 2 = อิเล็กทรอนิกส์</span>
                          </div>
                          <div>
                            <Label htmlFor="expressCategory">ประเภทการจัดส่ง</Label>
                            <Input 
                              id="expressCategory"
                              type="number"
                              value={shippingData.expressCategory}
                              onChange={(e) => updateShippingData('expressCategory', parseInt(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">1 = ปกติ, 2 = ด่วน</span>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="weight">น้ำหนัก (กรัม)</Label>
                          <Input 
                            id="weight"
                            type="number"
                            min="100"
                            step="100"
                            value={shippingData.weight}
                            onChange={(e) => updateShippingData('weight', parseInt(e.target.value))}
                          />
                          <span className="text-xs text-muted-foreground">หน่วยเป็นกรัม (เช่น 1000 = 1 กก.)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="width">ความกว้าง (ซม.)</Label>
                            <Input 
                              id="width"
                              type="number"
                              value={shippingData.width || ""}
                              onChange={(e) => updateShippingData('width', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="length">ความยาว (ซม.)</Label>
                            <Input 
                              id="length"
                              type="number"
                              value={shippingData.length || ""}
                              onChange={(e) => updateShippingData('length', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="height">ความสูง (ซม.)</Label>
                            <Input 
                              id="height"
                              type="number"
                              value={shippingData.height || ""}
                              onChange={(e) => updateShippingData('height', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="insured">ประกันพัสดุ</Label>
                            <Input 
                              id="insured"
                              type="number"
                              min="0"
                              max="1"
                              value={shippingData.insured}
                              onChange={(e) => updateShippingData('insured', parseInt(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">0 = ไม่มี, 1 = มี</span>
                          </div>
                          <div>
                            <Label htmlFor="codEnabled">COD (เก็บเงินปลายทาง)</Label>
                            <Input 
                              id="codEnabled"
                              type="number"
                              min="0"
                              max="1"
                              value={shippingData.codEnabled}
                              onChange={(e) => updateShippingData('codEnabled', parseInt(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">0 = ไม่มี, 1 = มี</span>
                          </div>
                        </div>
                        {shippingData.codEnabled === 1 && (
                          <div>
                            <Label htmlFor="codAmount">ยอด COD (สตางค์)</Label>
                            <Input 
                              id="codAmount"
                              type="number"
                              min="100"
                              step="100"
                              value={shippingData.codAmount || ""}
                              onChange={(e) => updateShippingData('codAmount', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                            <span className="text-xs text-muted-foreground">หน่วยเป็นสตางค์ (เช่น 10000 = 100 บาท)</span>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="remark">หมายเหตุ</Label>
                          <Input 
                            id="remark"
                            value={shippingData.remark || ""}
                            onChange={(e) => updateShippingData('remark', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={createShipping} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'กำลังดำเนินการ...' : 'สร้างการจัดส่ง'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* แสดงผลข้อมูลที่ได้รับ */}
              <Card>
                <CardHeader>
                  <CardTitle>ผลการสร้างการจัดส่ง</CardTitle>
                </CardHeader>
                <CardContent>
                  {shippingResponse ? (
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap h-[600px] overflow-auto">
                      <pre>{JSON.stringify(shippingResponse, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      ยังไม่มีข้อมูล กรุณากดปุ่ม 'สร้างการจัดส่ง' เพื่อเริ่มสร้างการจัดส่ง
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}