import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ประเภทการจัดส่ง Flash Express
const expressCategories = [
  { value: '1', label: 'ธรรมดา' },
  { value: '2', label: 'ด่วนพิเศษ (Express)' }
];

// ประเภทสินค้า
const articleCategories = [
  { value: '1', label: 'เสื้อผ้า' },
  { value: '2', label: 'อุปกรณ์อิเล็กทรอนิกส์' },
  { value: '3', label: 'อุปกรณ์ไอที' },
  { value: '4', label: 'ของใช้ในบ้าน' },
  { value: '99', label: 'อื่นๆ' }
];

export default function FlashExpressOrder() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [tabValue, setTabValue] = useState("create");
  const [hasCOD, setHasCOD] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  
  // ข้อมูลทั่วไปของออเดอร์
  const [orderData, setOrderData] = useState({
    // ข้อมูลผู้ส่ง
    srcName: "",
    srcPhone: "",
    srcProvinceName: "กรุงเทพมหานคร",
    srcCityName: "",
    srcDistrictName: "",
    srcPostalCode: "",
    srcDetailAddress: "",
    
    // ข้อมูลผู้รับ
    dstName: "",
    dstPhone: "",
    dstProvinceName: "กรุงเทพมหานคร",
    dstCityName: "",
    dstDistrictName: "",
    dstPostalCode: "",
    dstDetailAddress: "",
    
    // ข้อมูลพัสดุ
    weight: "1", // น้ำหนักในกิโลกรัม
    height: "10", // ความสูงในเซนติเมตร
    width: "20", // ความกว้างในเซนติเมตร
    length: "30", // ความยาวในเซนติเมตร
    
    // ข้อมูลเกี่ยวกับบริการ
    expressCategory: "1", // ประเภทการจัดส่ง (1 = ธรรมดา)
    articleCategory: "99", // ประเภทสินค้า (99 = อื่นๆ)
    itemCategory: "100", // ประเภทสินค้า (100 = อื่นๆ)
    
    // ข้อมูล COD
    codAmount: "0", // จำนวนเงิน COD
    
    // ข้อมูลสินค้า
    itemName: "สินค้า", // ชื่อสินค้า
    itemQuantity: "1", // จำนวนสินค้า
    
    // ข้อมูลประกัน
    insuranceAmount: "0", // มูลค่าประกัน
  });

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setOrderData({
      srcName: "",
      srcPhone: "",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "",
      srcDistrictName: "",
      srcPostalCode: "",
      srcDetailAddress: "",
      
      dstName: "",
      dstPhone: "",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "",
      dstDistrictName: "",
      dstPostalCode: "",
      dstDetailAddress: "",
      
      weight: "1",
      height: "10",
      width: "20",
      length: "30",
      
      expressCategory: "1",
      articleCategory: "99",
      itemCategory: "100",
      
      codAmount: "0",
      
      itemName: "สินค้า",
      itemQuantity: "1",
      
      insuranceAmount: "0",
    });
    setHasCOD(false);
    setHasInsurance(false);
  };

  // อัปเดตค่าในฟอร์ม
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // อัปเดตค่าใน select
  const handleSelectChange = (name: string, value: string) => {
    setOrderData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // สร้างออเดอร์
  const createOrder = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้ฟีเจอร์นี้",
        variant: "destructive",
      });
      return;
    }

    // ตรวจสอบข้อมูลขั้นพื้นฐาน
    if (!orderData.srcName || !orderData.srcPhone || !orderData.srcPostalCode || !orderData.srcDetailAddress) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลผู้ส่งให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    if (!orderData.dstName || !orderData.dstPhone || !orderData.dstPostalCode || !orderData.dstDetailAddress) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลผู้รับให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(25);
    setError(null);
    setResult(null);

    try {
      // เตรียมข้อมูลสำหรับส่งไป API
      const flashExpressOrderData = {
        // ข้อมูลผู้ส่ง
        srcName: orderData.srcName,
        srcPhone: orderData.srcPhone,
        srcProvinceName: orderData.srcProvinceName,
        srcCityName: orderData.srcCityName,
        srcDistrictName: orderData.srcDistrictName,
        srcPostalCode: orderData.srcPostalCode,
        srcDetailAddress: orderData.srcDetailAddress,
        
        // ข้อมูลผู้รับ
        dstName: orderData.dstName,
        dstPhone: orderData.dstPhone,
        dstProvinceName: orderData.dstProvinceName,
        dstCityName: orderData.dstCityName,
        dstDistrictName: orderData.dstDistrictName,
        dstPostalCode: orderData.dstPostalCode,
        dstDetailAddress: orderData.dstDetailAddress,
        
        // ข้อมูลพัสดุ
        weight: parseFloat(orderData.weight) * 1000, // แปลงเป็นกรัม
        height: parseInt(orderData.height),
        width: parseInt(orderData.width),
        length: parseInt(orderData.length),
        
        // ข้อมูลเกี่ยวกับการจัดส่ง
        expressCategory: parseInt(orderData.expressCategory),
        articleCategory: parseInt(orderData.articleCategory),
        itemCategory: 100, // ต้องเพิ่มฟิลด์นี้เพื่อให้ Flash Express API ทำงานได้
        
        // ข้อมูลการชำระเงิน
        codEnabled: hasCOD ? 1 : 0,
        codAmount: hasCOD ? parseFloat(orderData.codAmount) : 0,
        
        // ข้อมูลประกัน
        insured: hasInsurance ? 1 : 0,
        opdInsureEnabled: hasInsurance ? 1 : 0,
        insuranceAmount: hasInsurance ? parseFloat(orderData.insuranceAmount) : 0,
        
        // ข้อมูลการชำระค่าจัดส่ง
        settlementType: 1, // 1 = ผู้ส่งเป็นผู้ชำระ
        payType: 1, // รูปแบบการชำระเงิน
        
        // ข้อมูลสินค้า
        subItemTypes: [{
          itemName: orderData.itemName || "สินค้า",
          itemQuantity: parseInt(orderData.itemQuantity) || 1
        }]
      };

      setProgress(50);
      console.log('กำลังส่งข้อมูลไปยัง Flash Express API:', flashExpressOrderData);
      
      // เรียกใช้ API สร้างออเดอร์
      const response = await api.post('/api/flash-express/create-order', flashExpressOrderData);
      
      setProgress(100);
      console.log('การตอบกลับจาก API:', response.data);
      
      setResult(response.data);
      setTabValue("result"); // เปลี่ยนแท็บไปยังผลลัพธ์
      
      toast({
        title: "สร้างออเดอร์สำเร็จ",
        description: `เลขพัสดุ: ${response.data.trackingNumber || 'ไม่มีเลขพัสดุ'}`,
      });
    } catch (err: any) {
      console.error("เกิดข้อผิดพลาดในการสร้างออเดอร์:", err);
      
      setError(err);
      setIsAlertOpen(true);
      
      let errorMessage = "ไม่สามารถสร้างออเดอร์ได้";
      
      if (err.response) {
        errorMessage = err.response.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ใช้ข้อมูลตัวอย่าง
  const useExampleData = () => {
    setOrderData({
      srcName: "ทดสอบส่ง",
      srcPhone: "0899999999",
      srcProvinceName: "กรุงเทพมหานคร",
      srcCityName: "ลาดพร้าว",
      srcDistrictName: "จรเข้บัว",
      srcPostalCode: "10230",
      srcDetailAddress: "ที่อยู่ทดสอบ",
      
      dstName: "ทดสอบรับ",
      dstPhone: "0888888888",
      dstProvinceName: "กรุงเทพมหานคร",
      dstCityName: "ห้วยขวาง",
      dstDistrictName: "สามเสนนอก",
      dstPostalCode: "10310",
      dstDetailAddress: "ที่อยู่ทดสอบ",
      
      weight: "1",
      height: "10",
      width: "20",
      length: "30",
      
      expressCategory: "1",
      articleCategory: "99",
      itemCategory: "100",
      
      codAmount: "0",
      
      itemName: "สินค้าทดสอบ",
      itemQuantity: "1",
      
      insuranceAmount: "0",
    });
  };

  // ทดสอบการสร้างออเดอร์ด้วยข้อมูลทดสอบที่กำหนดไว้ล่วงหน้า
  const testCreateOrder = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้ฟีเจอร์นี้",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(50);
    setError(null);
    setResult(null);

    try {
      // เรียกใช้ API ทดสอบ
      console.log('กำลังทดสอบเรียก API Flash Express...');
      const response = await api.post('/api/flash-express-test/test-create-order');
      console.log('การตอบกลับจาก API:', response.data);
      
      setProgress(100);
      setResult(response.data);
      setTabValue("result"); // เปลี่ยนแท็บไปยังผลลัพธ์
      
      toast({
        title: "ทดสอบสำเร็จ",
        description: `เลขพัสดุ: ${response.data.trackingNumber || 'ไม่มีเลขพัสดุ'}`,
      });
    } catch (err: any) {
      console.error("เกิดข้อผิดพลาดในการทดสอบ:", err);
      
      setError(err);
      setIsAlertOpen(true);
      
      let errorMessage = "ไม่สามารถทดสอบการสร้างออเดอร์ได้";
      
      if (err.response) {
        errorMessage = err.response.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
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
                คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้งานระบบสร้างออเดอร์
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
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
          สร้างออเดอร์ Flash Express
        </h1>
        <p className="text-gray-600 mb-8">กรอกข้อมูลเพื่อสร้างเลขพัสดุสำหรับการจัดส่งผ่าน Flash Express</p>

        {isLoading && (
          <div className="mb-6">
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-gray-500 text-center">{progress}% - กำลังประมวลผล...</p>
          </div>
        )}

        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="create">สร้างออเดอร์</TabsTrigger>
            <TabsTrigger value="test">ทดสอบระบบ</TabsTrigger>
            {result && <TabsTrigger value="result">ผลลัพธ์</TabsTrigger>}
          </TabsList>

          <TabsContent value="create">
            <div className="grid grid-cols-1 gap-6">
              <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                  <CardTitle>ข้อมูลออเดอร์ Flash Express</CardTitle>
                  <CardDescription>
                    กรอกข้อมูลให้ครบถ้วนเพื่อสร้างเลขพัสดุสำหรับการจัดส่ง
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* ส่วนข้อมูลผู้ส่ง */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">ข้อมูลผู้ส่ง</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="srcName">ชื่อผู้ส่ง *</Label>
                          <Input 
                            id="srcName" 
                            name="srcName" 
                            value={orderData.srcName} 
                            onChange={handleInputChange} 
                            placeholder="กรอกชื่อผู้ส่ง" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="srcPhone">เบอร์โทรผู้ส่ง *</Label>
                          <Input 
                            id="srcPhone" 
                            name="srcPhone" 
                            value={orderData.srcPhone} 
                            onChange={handleInputChange} 
                            placeholder="0xxxxxxxxx" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="srcProvinceName">จังหวัด *</Label>
                          <Input 
                            id="srcProvinceName" 
                            name="srcProvinceName" 
                            value={orderData.srcProvinceName} 
                            onChange={handleInputChange} 
                            placeholder="กรุงเทพมหานคร" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="srcCityName">เขต/อำเภอ *</Label>
                          <Input 
                            id="srcCityName" 
                            name="srcCityName" 
                            value={orderData.srcCityName} 
                            onChange={handleInputChange} 
                            placeholder="เขต/อำเภอ" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="srcDistrictName">แขวง/ตำบล</Label>
                          <Input 
                            id="srcDistrictName" 
                            name="srcDistrictName" 
                            value={orderData.srcDistrictName} 
                            onChange={handleInputChange} 
                            placeholder="แขวง/ตำบล" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="srcPostalCode">รหัสไปรษณีย์ *</Label>
                          <Input 
                            id="srcPostalCode" 
                            name="srcPostalCode" 
                            value={orderData.srcPostalCode} 
                            onChange={handleInputChange} 
                            placeholder="รหัสไปรษณีย์" 
                            required 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="srcDetailAddress">ที่อยู่ *</Label>
                          <Input 
                            id="srcDetailAddress" 
                            name="srcDetailAddress" 
                            value={orderData.srcDetailAddress} 
                            onChange={handleInputChange} 
                            placeholder="บ้านเลขที่ ถนน ซอย หมู่" 
                            required 
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ส่วนข้อมูลผู้รับ */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">ข้อมูลผู้รับ</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dstName">ชื่อผู้รับ *</Label>
                          <Input 
                            id="dstName" 
                            name="dstName" 
                            value={orderData.dstName} 
                            onChange={handleInputChange} 
                            placeholder="กรอกชื่อผู้รับ" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dstPhone">เบอร์โทรผู้รับ *</Label>
                          <Input 
                            id="dstPhone" 
                            name="dstPhone" 
                            value={orderData.dstPhone} 
                            onChange={handleInputChange} 
                            placeholder="0xxxxxxxxx" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dstProvinceName">จังหวัด *</Label>
                          <Input 
                            id="dstProvinceName" 
                            name="dstProvinceName" 
                            value={orderData.dstProvinceName} 
                            onChange={handleInputChange} 
                            placeholder="กรุงเทพมหานคร" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dstCityName">เขต/อำเภอ *</Label>
                          <Input 
                            id="dstCityName" 
                            name="dstCityName" 
                            value={orderData.dstCityName} 
                            onChange={handleInputChange} 
                            placeholder="เขต/อำเภอ" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dstDistrictName">แขวง/ตำบล</Label>
                          <Input 
                            id="dstDistrictName" 
                            name="dstDistrictName" 
                            value={orderData.dstDistrictName} 
                            onChange={handleInputChange} 
                            placeholder="แขวง/ตำบล" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dstPostalCode">รหัสไปรษณีย์ *</Label>
                          <Input 
                            id="dstPostalCode" 
                            name="dstPostalCode" 
                            value={orderData.dstPostalCode} 
                            onChange={handleInputChange} 
                            placeholder="รหัสไปรษณีย์" 
                            required 
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="dstDetailAddress">ที่อยู่ *</Label>
                          <Input 
                            id="dstDetailAddress" 
                            name="dstDetailAddress" 
                            value={orderData.dstDetailAddress} 
                            onChange={handleInputChange} 
                            placeholder="บ้านเลขที่ ถนน ซอย หมู่" 
                            required 
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ส่วนข้อมูลพัสดุ */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">ข้อมูลพัสดุ</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight">น้ำหนัก (กิโลกรัม) *</Label>
                          <Input 
                            id="weight" 
                            name="weight" 
                            type="number" 
                            value={orderData.weight} 
                            onChange={handleInputChange} 
                            placeholder="น้ำหนักพัสดุ" 
                            required 
                            min="0.1"
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expressCategory">ประเภทการจัดส่ง *</Label>
                          <Select 
                            value={orderData.expressCategory} 
                            onValueChange={(value) => handleSelectChange("expressCategory", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกประเภทการจัดส่ง" />
                            </SelectTrigger>
                            <SelectContent>
                              {expressCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="articleCategory">ประเภทสินค้า *</Label>
                          <Select 
                            value={orderData.articleCategory} 
                            onValueChange={(value) => handleSelectChange("articleCategory", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกประเภทสินค้า" />
                            </SelectTrigger>
                            <SelectContent>
                              {articleCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="itemName">ชื่อสินค้า</Label>
                          <Input 
                            id="itemName" 
                            name="itemName" 
                            value={orderData.itemName} 
                            onChange={handleInputChange} 
                            placeholder="ชื่อสินค้า" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="itemQuantity">จำนวนสินค้า</Label>
                          <Input 
                            id="itemQuantity" 
                            name="itemQuantity" 
                            type="number" 
                            value={orderData.itemQuantity} 
                            onChange={handleInputChange} 
                            placeholder="จำนวนสินค้า" 
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="length">ความยาว (ซม.)</Label>
                          <Input 
                            id="length" 
                            name="length" 
                            type="number" 
                            value={orderData.length} 
                            onChange={handleInputChange} 
                            placeholder="ความยาว" 
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="width">ความกว้าง (ซม.)</Label>
                          <Input 
                            id="width" 
                            name="width" 
                            type="number" 
                            value={orderData.width} 
                            onChange={handleInputChange} 
                            placeholder="ความกว้าง" 
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">ความสูง (ซม.)</Label>
                          <Input 
                            id="height" 
                            name="height" 
                            type="number" 
                            value={orderData.height} 
                            onChange={handleInputChange} 
                            placeholder="ความสูง" 
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* ส่วนบริการเสริม */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">บริการเสริม</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="hasCOD" 
                            checked={hasCOD} 
                            onCheckedChange={(checked) => setHasCOD(checked === true)}
                          />
                          <Label htmlFor="hasCOD">เก็บเงินปลายทาง (COD)</Label>
                        </div>
                        
                        {hasCOD && (
                          <div className="pl-6 space-y-2">
                            <Label htmlFor="codAmount">จำนวนเงิน COD (บาท)</Label>
                            <Input 
                              id="codAmount" 
                              name="codAmount" 
                              type="number" 
                              value={orderData.codAmount} 
                              onChange={handleInputChange} 
                              placeholder="จำนวนเงิน COD" 
                              min="1"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="hasInsurance" 
                            checked={hasInsurance} 
                            onCheckedChange={(checked) => setHasInsurance(checked === true)}
                          />
                          <Label htmlFor="hasInsurance">ประกันพัสดุ</Label>
                        </div>
                        
                        {hasInsurance && (
                          <div className="pl-6 space-y-2">
                            <Label htmlFor="insuranceAmount">มูลค่าประกัน (บาท)</Label>
                            <Input 
                              id="insuranceAmount" 
                              name="insuranceAmount" 
                              type="number" 
                              value={orderData.insuranceAmount} 
                              onChange={handleInputChange} 
                              placeholder="มูลค่าประกัน" 
                              min="1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 justify-between border-t bg-gray-50 py-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetForm}>รีเซ็ตข้อมูล</Button>
                    <Button variant="outline" onClick={useExampleData}>ใช้ข้อมูลตัวอย่าง</Button>
                  </div>
                  <Button 
                    onClick={createOrder} 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {isLoading ? "กำลังสร้างออเดอร์..." : "สร้างออเดอร์"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="test">
            <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle>ทดสอบการสร้างออเดอร์</CardTitle>
                <CardDescription>
                  ทดสอบการเชื่อมต่อกับ Flash Express API เพื่อสร้างเลขพัสดุด้วยข้อมูลตัวอย่าง
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4 text-gray-600">
                  การทดสอบนี้จะส่งข้อมูลตัวอย่างไปยัง Flash Express API โดยตรง โดยไม่ต้องกรอกฟอร์ม ใช้สำหรับการทดสอบระบบเท่านั้น
                </p>
                <Alert className="mb-4 border-yellow-300 bg-yellow-50 text-yellow-800">
                  <AlertTitle className="text-yellow-800 font-medium">ข้อควรระวัง!</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    การทดสอบนี้จะสร้างเลขพัสดุจริงในระบบ Flash Express ซึ่งอาจส่งผลต่อการทำงานหรือค่าบริการตามที่ Flash Express กำหนด
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={testCreateOrder} 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isLoading ? "กำลังทดสอบ..." : "ทดสอบการสร้างออเดอร์"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {result && (
            <TabsContent value="result">
              <Card className="border border-green-100 shadow-lg shadow-green-100/20">
                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                  <CardTitle className="text-green-700">ผลการสร้างออเดอร์ (สำเร็จ)</CardTitle>
                  <CardDescription>
                    ข้อมูลออเดอร์ที่ถูกสร้างในระบบ Flash Express
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <div className="flex flex-wrap gap-4 items-center">
                        <div>
                          <p className="text-sm text-gray-500">เลขพัสดุ</p>
                          <p className="text-lg font-bold text-green-600">{result.trackingNumber}</p>
                        </div>
                        <Badge className="bg-green-500">{result.sortCode ? `ศูนย์คัดแยก: ${result.sortCode}` : 'กำลังรอจัดส่ง'}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2">รายละเอียดทั้งหมด</h3>
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button 
                      onClick={() => setTabValue("create")} 
                      variant="outline"
                    >
                      สร้างออเดอร์ใหม่
                    </Button>
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <a 
                        href={`/api/flash-express/print-label/${result.trackingNumber}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        พิมพ์ใบปะหน้าพัสดุ
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>เกิดข้อผิดพลาด</AlertDialogTitle>
              <AlertDialogDescription>
                {error?.response?.data?.message || error?.message || "ไม่สามารถสร้างออเดอร์ได้"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 my-4">
              <pre className="text-xs whitespace-pre-wrap">
                {error?.response?.data ? JSON.stringify(error.response.data, null, 2) : error?.toString()}
              </pre>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>ปิด</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}