import React, { useState, useEffect } from 'react';
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
import { useLocation } from 'wouter';
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
  srcEmail?: string;
  dstName: string;
  dstPhone: string;
  dstProvinceName: string;
  dstCityName: string;
  dstDistrictName: string;
  dstPostalCode: string;
  dstDetailAddress: string;
  dstEmail?: string;
  weight: string;
  width?: string;
  length?: string;
  height?: string;
  parcelKind: string;
  expressCategory: string;
  articleCategory: string;
  insured: string;
  codEnabled: string;
  codAmount?: string;
  insuredAmount?: string;
  remark?: string;
  productType: string;
  transportType: string;
  payType: string;
  expressTypeId: string;
}

export default function FlashExpressAPITest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [rateResponse, setRateResponse] = useState<any>(null);
  const [shippingResponse, setShippingResponse] = useState<any>(null);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);

  // ฟังก์ชันที่จะทำงานเมื่อคอมโพเนนต์โหลดเสร็จ
  useEffect(() => {
    // สร้างเลขอ้างอิงใหม่ทุกครั้งที่โหลดหน้า
    setShippingData(prev => ({
      ...prev,
      outTradeNo: `TEST${Date.now()}`
    }));

    // ดึงข้อมูลผู้ใช้ถ้ามี
    if (user) {
      setShippingData(prev => ({
        ...prev,
        srcName: user.fullname || prev.srcName,
        srcPhone: user.phone || prev.srcPhone,
        srcDetailAddress: user.address || prev.srcDetailAddress
      }));
    }

    // ถ้ามี tab parameter ให้เปลี่ยนไปที่แท็บนั้น
    if (location.includes('?tab=')) {
      const tabParam = location.split('?tab=')[1];
      if (['connection', 'rates', 'shipping'].includes(tabParam)) {
        // ตั้งค่า default tab ตาม parameter
        document.querySelector(`[data-value="${tabParam}"]`)?.click();
      }
    }
  }, [user]);

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
    srcName: user?.fullname || 'กรธนภัทร นาคคงคำ',
    srcPhone: user?.phone || '0829327325',
    srcProvinceName: 'กรุงเทพมหานคร',
    srcCityName: 'ลาดพร้าว',
    srcDistrictName: 'จรเข้บัว',
    srcPostalCode: '10230',
    srcDetailAddress: user?.address || '26 ลาดปลาเค้า 24 แยก 8',
    dstName: 'ธัญลักษณ์ ภาคภูมิ',
    dstPhone: '0869972410',
    dstProvinceName: 'พระนครศรีอยุธยา',
    dstCityName: 'บางปะอิน',
    dstDistrictName: 'เชียงรากน้อย',
    dstPostalCode: '13160',
    dstDetailAddress: '138/348 ม.7 ซ.20 ต.เชียงรากน้อย อ.บางปะอิน',
    weight: "1000", // 1 kg (หน่วยเป็น g) - ต้องเป็น string
    width: "10", // ความกว้างเป็น cm - ต้องเป็น string
    length: "10", // ความยาวเป็น cm - ต้องเป็น string
    height: "10", // ความสูงเป็น cm - ต้องเป็น string
    // ข้อมูลที่จำเป็นตามข้อกำหนดของ Flash Express API
    parcelKind: "1", // ประเภทพัสดุ (1=ทั่วไป)
    expressCategory: "1", // 1=ส่งด่วน, 2=ส่งธรรมดา
    articleCategory: "2", // ประเภทสินค้า (2=อื่นๆ)
    expressTypeId: "1", // ประเภทการส่ง (1=ส่งด่วน)
    productType: "1", // ประเภทสินค้า (1=ทั่วไป)
    payType: "1", // วิธีการชำระเงิน (1=ผู้ส่งจ่าย)
    transportType: "1", // ประเภทการขนส่ง (1=ปกติ)
    insured: "0", // 0=ไม่ซื้อ Flash care
    codEnabled: "0", // 0=ไม่ใช่ COD
    codAmount: "0", // จำนวนเงิน COD (ถ้ามี)
    insuredAmount: "0", // จำนวนเงินประกัน (ถ้ามี)
    remark: "ทดสอบการส่งพัสดุ", // หมายเหตุ
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

      // แปลงข้อมูลเพื่อให้มั่นใจว่าส่งตามฟอร์แมตที่ถูกต้อง
      const formattedShippingData = {
        ...shippingData,
        // แปลงค่าทุกอย่างให้เป็น string ตามข้อกำหนดของ Flash Express API
        weight: String(shippingData.weight),
        width: String(shippingData.width || 20),
        length: String(shippingData.length || 30),
        height: String(shippingData.height || 10),
        insured: String(shippingData.insured || 0),
        codEnabled: String(shippingData.codEnabled || 0),
        codAmount: String(shippingData.codAmount || 0),
        insuredAmount: String(shippingData.insuredAmount || 0),
        expressCategory: String(shippingData.expressCategory || 1),
        articleCategory: String(shippingData.articleCategory || 2)
      };

      const response = await apiRequest(
        'POST',
        '/api/shipping-methods/flash-express/shipping',
        {
          orderData: formattedShippingData
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
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการสร้างการจัดส่ง:', error);
      
      // แสดงข้อมูลข้อผิดพลาดเพิ่มเติมถ้ามี response data
      const errorDetail = error.response?.data 
        ? JSON.stringify(error.response.data, null, 2) 
        : error.message;
        
      setShippingResponse({
        success: false,
        error: error.message,
        details: error.response?.data || {},
        status: error.response?.status || 'unknown'
      });
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถสร้างการจัดส่งได้: ${error.message}`,
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

      console.log('กำลังทดสอบการเชื่อมต่อกับ Flash Express API... (URL: https://open-api.flashexpress.com)');

      // เปลี่ยนมาใช้ endpoint ใหม่ที่เราเพิ่งสร้าง
      const response = await apiRequest(
        'GET',
        '/api/shipping/test-connection',
        null
      );

      try {
        // พยายามแปลงข้อมูลเป็น JSON
        const data = await response.json();
        console.log('ผลการทดสอบการเชื่อมต่อ Flash Express API:', data);
        setConnectionTestResult(data);

        let description = data.message || (data.success ? 'สามารถเชื่อมต่อกับ Flash Express API ได้' : 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้');

        // เพิ่มรายละเอียดหากมีข้อมูล API response
        if (data.apiResponse) {
          console.log('รายละเอียดการตอบกลับจาก API:', data.apiResponse);

          if (data.apiResponse.data) {
            description += ` (API Response Code: ${data.apiResponse.data.code || 'N/A'})`;
          }
        }

        // เพิ่มข้อมูล HTML response หากได้รับการตอบกลับเป็น HTML
        if (data.htmlAnalysis) {
          console.log('ได้รับการตอบกลับเป็น HTML:', data.htmlAnalysis);
          description += ' - เซิร์ฟเวอร์ตอบกลับด้วย HTML แทน JSON ซึ่งอาจเกิดจากการเปลี่ยนเส้นทาง';
        }

        toast({
          title: data.success ? 'การเชื่อมต่อสำเร็จ' : 'การเชื่อมต่อไม่สำเร็จ',
          description: description,
          variant: data.success ? 'default' : 'destructive',
        });
      } catch (jsonError) {
        // หากไม่สามารถแปลงเป็น JSON ได้ แสดงว่าอาจได้รับ HTML แทน
        console.error('เกิดข้อผิดพลาดในการแปลงข้อมูล JSON:', jsonError);

        try {
          const text = await response.text();
          console.log('ข้อมูลการตอบกลับ (ไม่ใช่ JSON):', text.substring(0, 500) + '...');
          setConnectionTestResult({ success: false, rawResponse: text });

          toast({
            title: 'เกิดข้อผิดพลาดรูปแบบข้อมูล',
            description: 'ได้รับข้อมูลที่ไม่ใช่ JSON ซึ่งอาจเกิดจากปัญหาในการเชื่อมต่อ',
            variant: 'destructive',
          });
        } catch (textError) {
          setConnectionTestResult({ success: false, error: String(textError) });
          toast({
            title: 'เกิดข้อผิดพลาด',
            description: 'ไม่สามารถอ่านข้อมูลการตอบกลับจากเซิร์ฟเวอร์',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ:', error);
      setConnectionTestResult({ 
        success: false, 
        error: String(error),
        message: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      });

      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถเชื่อมต่อกับ Flash Express API ได้: ${error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`,
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

                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTitle className="text-amber-800">การวิเคราะห์ปัญหา</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        หากมีปัญหาในการเชื่อมต่อกับ Flash Express API อาจมีสาเหตุจาก:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>การตั้งค่า API Key หรือ Merchant ID ไม่ถูกต้อง</li>
                          <li>การสร้างลายเซ็นสำหรับ API ไม่ถูกต้อง</li>
                          <li>รูปแบบของคำขอไม่ตรงตามที่ Flash Express API กำหนด</li>
                          <li>การตั้งค่า Content-Type ไม่ถูกต้อง (ต้องเป็น application/x-www-form-urlencoded)</li>
                          <li>ปัญหาการเชื่อมต่อจาก Replit ไปยัง Flash Express API</li>
                        </ul>
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
                        <Alert className="mb-4 bg-green-50 border-green-200">
                          <AlertTitle className="text-green-600">เชื่อมต่อสำเร็จ</AlertTitle>
                          <AlertDescription className="text-green-700">
                            สามารถเชื่อมต่อกับ Flash Express API ได้
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="mb-4 bg-red-50 border-red-200">
                          <AlertTitle className="text-red-600">เชื่อมต่อไม่สำเร็จ</AlertTitle>
                          <AlertDescription className="text-red-700">
                            {connectionTestResult.message || 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้'}
                            {connectionTestResult.statusText && (
                              <div className="mt-2">
                                <span className="font-semibold">สถานะ:</span> {connectionTestResult.statusText}
                              </div>
                            )}
                            {connectionTestResult.error && connectionTestResult.error.response && (
                              <div className="mt-2">
                                <span className="font-semibold">รหัสข้อผิดพลาด:</span> {connectionTestResult.error.response.status}
                                <br />
                                <span className="font-semibold">ข้อความจาก API:</span> {connectionTestResult.error.response.statusText}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {typeof connectionTestResult === 'string' ? (
                        <div className="bg-muted p-4 rounded-md mb-4">
                          <div className="font-medium text-red-500 mb-2">ปัญหาการแสดงผลข้อมูล HTML แทน JSON</div>
                          <p className="text-sm mb-4">ระบบได้รับการตอบกลับในรูปแบบ HTML แทนที่จะเป็น JSON ซึ่งอาจเกิดจากปัญหาการเชื่อมต่อหรือการตั้งค่า CORS</p>
                          <div className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-[400px]">
                            {connectionTestResult.substring(0, 500)}...
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted p-4 rounded-md whitespace-pre-wrap h-[380px] overflow-auto mb-4">
                          <pre>{JSON.stringify(connectionTestResult, null, 2)}</pre>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h3 className="font-medium text-sm">การแก้ไขปัญหา:</h3>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          <li>ตรวจสอบว่าตั้งค่า API Key และ Merchant ID ถูกต้อง</li>
                          <li>ตรวจสอบว่าการสร้างลายเซ็นถูกต้องตามเอกสารของ Flash Express API</li>
                          <li>ตรวจสอบว่า Content-Type เป็น application/x-www-form-urlencoded</li>
                          <li>ตรวจสอบการเรียงลำดับของพารามิเตอร์ตามที่ API กำหนด</li>
                          <li>ทดสอบจาก Postman หรือเครื่องมืออื่นเพื่อยืนยันว่า API ใช้งานได้จริง</li>
                        </ul>
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

                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-2 w-full"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          console.log('กำลังทดสอบการสร้างเลขพัสดุแบบละเอียด:', shippingData);

                          const response = await fetch('/api/shipping/flash-express/debug-create', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(shippingData)
                          });

                          const data = await response.json();
                          console.log('ผลลัพธ์การทดสอบละเอียด:', data);

                          toast({
                            title: 'การทดสอบเสร็จสิ้น',
                            description: 'กรุณาตรวจสอบข้อมูลในคอนโซล',
                          });
                        } catch (error) {
                          console.error('เกิดข้อผิดพลาดในการทดสอบละเอียด:', error);
                          toast({
                            title: 'เกิดข้อผิดพลาด',
                            description: 'ไม่สามารถทดสอบได้ กรุณาลองอีกครั้ง',
                            variant: 'destructive',
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      ทดสอบแบบละเอียด (Debug)
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