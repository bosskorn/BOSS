import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import Layout from '@/components/Layout';

import { LuPackageOpen, LuTruck, LuPrinter, LuCopy, LuCheck, LuSearch, LuAlertCircle } from 'react-icons/lu';

// สำหรับการแสดงผลในรูปแบบ JSON
import { CopyToClipboard } from 'react-copy-to-clipboard';

// ประเภทข้อมูลสำหรับฟอร์ม
interface OrderFormData {
  // ข้อมูลผู้ส่ง
  srcName: string;
  srcPhone: string;
  srcProvinceName: string;
  srcCityName: string;
  srcDistrictName: string;
  srcPostalCode: string;
  srcDetailAddress: string;
  
  // ข้อมูลผู้รับ
  dstName: string;
  dstPhone: string;
  dstProvinceName: string;
  dstCityName: string;
  dstDistrictName: string;
  dstPostalCode: string;
  dstDetailAddress: string;
  
  // ข้อมูลพัสดุ
  weight: string; // น้ำหนักเป็นกิโลกรัม
  height: string; // ความสูงเป็นเซนติเมตร
  width: string; // ความกว้างเป็นเซนติเมตร
  length: string; // ความยาวเป็นเซนติเมตร
  
  // ประเภทการจัดส่ง
  expressCategory: string; // ประเภทการจัดส่ง (1 = ธรรมดา, 2 = ด่วน)
  articleCategory: string; // ประเภทพัสดุ (99 = อื่นๆ)
  itemCategory: string; // ประเภทสินค้า (100 = อื่นๆ)
  
  // ข้อมูลเก็บเงินปลายทาง
  codAmount: string; // จำนวนเงินเก็บเงินปลายทาง
  
  // ข้อมูลสินค้า
  itemName: string; // ชื่อสินค้า
  itemQuantity: string; // จำนวนชิ้น
  
  // ข้อมูลประกัน
  insuranceAmount: string; // มูลค่าประกัน
}

// หน้าจอสร้างออเดอร์ Flash Express
export default function FlashExpressShippingNew() {
  // ดึงข้อมูลผู้ใช้
  const { user } = useAuth();
  const { toast } = useToast();
  
  // แท็บปัจจุบัน
  const [tabValue, setTabValue] = useState('create');
  
  // สถานะการโหลด
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // สถานะการเลือกบริการเสริม
  const [hasCOD, setHasCOD] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  
  // ข้อมูลการสร้างออเดอร์
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // ข้อมูลฟอร์ม
  const [orderData, setOrderData] = useState<OrderFormData>({
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
    weight: "1", // 1 kg
    height: "10", // 10 cm
    width: "20", // 20 cm
    length: "30", // 30 cm
    
    // ประเภทการจัดส่ง
    expressCategory: "1", // 1 = ธรรมดา, 2 = ด่วน
    articleCategory: "99", // 99 = อื่นๆ
    itemCategory: "100", // 100 = อื่นๆ
    
    // ข้อมูลเก็บเงินปลายทาง
    codAmount: "0", // จำนวนเงินเก็บเงินปลายทาง
    
    // ข้อมูลสินค้า
    itemName: "สินค้า", // ชื่อสินค้า
    itemQuantity: "1", // จำนวนชิ้น
    
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
        itemCategory: parseInt(orderData.itemCategory),
        
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
        description: `เลขพัสดุ: ${response.data.trackingNumber || response.data.data?.pno || 'ไม่มีเลขพัสดุ'}`,
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

  // เปิดหน้าใบปะหน้าพัสดุ
  const openShippingLabel = (trackingNumber: string) => {
    if (!trackingNumber) {
      toast({
        title: "ไม่สามารถพิมพ์ใบปะหน้าพัสดุได้",
        description: "ไม่พบเลขพัสดุ",
        variant: "destructive",
      });
      return;
    }

    window.open(`/api/flash-express/print-label/${trackingNumber}`, '_blank');
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
        <div className="flex items-center mb-6 space-x-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <LuTruck className="text-purple-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
              จัดส่งพัสดุ Flash Express
            </h1>
            <p className="text-gray-600">สร้างเลขพัสดุและพิมพ์ใบปะหน้าได้ง่ายๆ</p>
          </div>
        </div>

        {isLoading && (
          <div className="mb-6">
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-gray-500 text-center">{progress}% - กำลังประมวลผล...</p>
          </div>
        )}

        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="create" className="px-6">
                <LuPackageOpen className="mr-2 h-4 w-4" />
                สร้างออเดอร์
              </TabsTrigger>
              <TabsTrigger value="history" className="px-6">
                <LuSearch className="mr-2 h-4 w-4" />
                ค้นหาพัสดุ
              </TabsTrigger>
              {result && (
                <TabsTrigger value="result" className="px-6">
                  <LuCheck className="mr-2 h-4 w-4" />
                  ผลลัพธ์
                </TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={useExampleData}
                disabled={isLoading}
                size="sm"
              >
                ใช้ข้อมูลตัวอย่าง
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={isLoading}
                size="sm"
              >
                ล้างข้อมูล
              </Button>
            </div>
          </div>

          <TabsContent value="create">
            <div className="grid grid-cols-1 gap-6">
              <Card className="border border-purple-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                  <CardTitle className="flex items-center">
                    <LuPackageOpen className="mr-2 h-5 w-5 text-purple-600" />
                    ข้อมูลออเดอร์ Flash Express
                  </CardTitle>
                  <CardDescription>
                    กรอกข้อมูลให้ครบถ้วนเพื่อสร้างเลขพัสดุสำหรับการจัดส่ง
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* ส่วนข้อมูลผู้ส่ง */}
                    <div>
                      <div className="flex items-center mb-4">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mr-2">ผู้ส่ง</Badge>
                        <h3 className="text-lg font-medium">ข้อมูลผู้ส่ง</h3>
                      </div>
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
                      <div className="flex items-center mb-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">ผู้รับ</Badge>
                        <h3 className="text-lg font-medium">ข้อมูลผู้รับ</h3>
                      </div>
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
                      <div className="flex items-center mb-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-2">พัสดุ</Badge>
                        <h3 className="text-lg font-medium">ข้อมูลพัสดุและสินค้า</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight">น้ำหนัก (กก.) *</Label>
                          <Input 
                            id="weight" 
                            name="weight" 
                            type="number" 
                            value={orderData.weight} 
                            onChange={handleInputChange} 
                            min="0.1" 
                            step="0.1" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expressCategory">ประเภทบริการ *</Label>
                          <Select 
                            value={orderData.expressCategory} 
                            onValueChange={(value) => handleSelectChange('expressCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกประเภทบริการ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>บริการจัดส่ง</SelectLabel>
                                <SelectItem value="1">ธรรมดา (Flash Standard)</SelectItem>
                                <SelectItem value="2">ด่วน (Flash Express)</SelectItem>
                              </SelectGroup>
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
                          <Label htmlFor="itemQuantity">จำนวนชิ้น</Label>
                          <Input 
                            id="itemQuantity" 
                            name="itemQuantity" 
                            type="number" 
                            value={orderData.itemQuantity} 
                            onChange={handleInputChange} 
                            min="1" 
                            placeholder="จำนวนชิ้น" 
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label>ขนาดพัสดุ (ซม.)</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">กว้าง</div>
                              <Input 
                                id="width" 
                                name="width" 
                                type="number" 
                                value={orderData.width} 
                                onChange={handleInputChange} 
                                min="1" 
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">ยาว</div>
                              <Input 
                                id="length" 
                                name="length" 
                                type="number" 
                                value={orderData.length} 
                                onChange={handleInputChange} 
                                min="1" 
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">สูง</div>
                              <Input 
                                id="height" 
                                name="height" 
                                type="number" 
                                value={orderData.height} 
                                onChange={handleInputChange} 
                                min="1" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />
                    
                    {/* ส่วนบริการเสริม */}
                    <div>
                      <div className="flex items-center mb-4">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 mr-2">บริการเสริม</Badge>
                        <h3 className="text-lg font-medium">บริการเสริม</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="hasCOD" 
                            checked={hasCOD} 
                            onCheckedChange={(checked) => setHasCOD(checked as boolean)} 
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor="hasCOD"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              เก็บเงินปลายทาง (COD)
                            </label>
                            <p className="text-sm text-gray-500">
                              เรียกเก็บเงินจากผู้รับปลายทางโดยบริษัทขนส่ง
                            </p>
                          </div>
                        </div>

                        {hasCOD && (
                          <div className="ml-6 p-3 border border-dashed rounded-lg border-orange-200 bg-orange-50">
                            <div className="space-y-2">
                              <Label htmlFor="codAmount">จำนวนเงิน COD (บาท) *</Label>
                              <Input 
                                id="codAmount" 
                                name="codAmount" 
                                type="number" 
                                value={orderData.codAmount} 
                                onChange={handleInputChange} 
                                min="1" 
                                placeholder="จำนวนเงินที่ต้องการเก็บปลายทาง"
                                required={hasCOD}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-start space-x-2 mt-4">
                          <Checkbox 
                            id="hasInsurance" 
                            checked={hasInsurance} 
                            onCheckedChange={(checked) => setHasInsurance(checked as boolean)} 
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor="hasInsurance"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              ประกันพัสดุ
                            </label>
                            <p className="text-sm text-gray-500">
                              ทำประกันพัสดุเพื่อคุ้มครองความเสียหายหรือสูญหาย
                            </p>
                          </div>
                        </div>

                        {hasInsurance && (
                          <div className="ml-6 p-3 border border-dashed rounded-lg border-blue-200 bg-blue-50">
                            <div className="space-y-2">
                              <Label htmlFor="insuranceAmount">มูลค่าประกัน (บาท) *</Label>
                              <Input 
                                id="insuranceAmount" 
                                name="insuranceAmount" 
                                type="number" 
                                value={orderData.insuranceAmount} 
                                onChange={handleInputChange} 
                                min="1" 
                                placeholder="มูลค่าสินค้าที่ต้องการประกัน"
                                required={hasInsurance}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-gray-50 p-6">
                  <Button 
                    variant="outline" 
                    onClick={resetForm}
                    disabled={isLoading}
                  >
                    ล้างข้อมูล
                  </Button>
                  <Button 
                    onClick={createOrder}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {isLoading ? 'กำลังสร้างออเดอร์...' : 'สร้างออเดอร์'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LuSearch className="mr-2 h-5 w-5 text-purple-600" />
                  ค้นหาพัสดุ
                </CardTitle>
                <CardDescription>
                  ค้นหาพัสดุที่เคยสร้างหรือตรวจสอบสถานะการจัดส่ง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tracking-number">เลขพัสดุ</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="tracking-number" 
                        placeholder="ระบุเลขพัสดุ เช่น TH015174P85B0A"
                        className="flex-1"
                      />
                      <Button className="flex-shrink-0 bg-purple-600 hover:bg-purple-700">
                        <LuSearch className="mr-2 h-4 w-4" />
                        ค้นหา
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <LuSearch className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">ยังไม่มีประวัติการค้นหา</h3>
                    <p className="text-gray-500 text-sm">ระบุเลขพัสดุที่ต้องการค้นหาด้านบน</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="result">
            {result && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <LuCheck className="mr-2 h-5 w-5 text-green-600" />
                      สร้างออเดอร์สำเร็จ
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">SUCCESS</Badge>
                  </div>
                  <CardDescription>
                    ออเดอร์ถูกสร้างเรียบร้อยแล้ว คุณสามารถพิมพ์ใบปะหน้าพัสดุได้
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg border text-center">
                      <div className="text-sm text-gray-500 mb-1">เลขพัสดุ</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {result.trackingNumber || result.data?.pno || '-'}
                      </div>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.trackingNumber || result.data?.pno);
                            toast({ 
                              title: "คัดลอกเรียบร้อย", 
                              description: "คัดลอกเลขพัสดุไปยังคลิปบอร์ดแล้ว"
                            });
                          }}
                        >
                          <LuCopy className="mr-1 h-3 w-3" />
                          คัดลอก
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => openShippingLabel(result.trackingNumber || result.data?.pno)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <LuPrinter className="mr-1 h-3 w-3" />
                          พิมพ์ใบปะหน้า
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mr-2">ผู้ส่ง</Badge>
                          ข้อมูลผู้ส่ง
                        </h4>
                        <div className="bg-white rounded-lg border p-4 text-sm">
                          <div className="font-medium">{orderData.srcName}</div>
                          <div>โทร: {orderData.srcPhone}</div>
                          <div className="mt-1">
                            {orderData.srcDetailAddress}, {orderData.srcDistrictName && `${orderData.srcDistrictName},`} {orderData.srcCityName}, {orderData.srcProvinceName}, {orderData.srcPostalCode}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">ผู้รับ</Badge>
                          ข้อมูลผู้รับ
                        </h4>
                        <div className="bg-white rounded-lg border p-4 text-sm">
                          <div className="font-medium">{orderData.dstName}</div>
                          <div>โทร: {orderData.dstPhone}</div>
                          <div className="mt-1">
                            {orderData.dstDetailAddress}, {orderData.dstDistrictName && `${orderData.dstDistrictName},`} {orderData.dstCityName}, {orderData.dstProvinceName}, {orderData.dstPostalCode}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-2">พัสดุ</Badge>
                        ข้อมูลพัสดุ
                      </h4>
                      <div className="bg-white rounded-lg border p-4 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-gray-500 text-xs">สินค้า</div>
                            <div>{orderData.itemName || "สินค้า"} x {orderData.itemQuantity}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">น้ำหนัก</div>
                            <div>{orderData.weight} กก.</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">ขนาด</div>
                            <div>{orderData.width}x{orderData.length}x{orderData.height} ซม.</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">ประเภทบริการ</div>
                            <div>{orderData.expressCategory === "1" ? "ธรรมดา" : "ด่วน"}</div>
                          </div>
                        </div>
                        {(hasCOD || hasInsurance) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-4">
                              {hasCOD && (
                                <div>
                                  <div className="text-gray-500 text-xs">เก็บเงินปลายทาง</div>
                                  <div>{orderData.codAmount} บาท</div>
                                </div>
                              )}
                              {hasInsurance && (
                                <div>
                                  <div className="text-gray-500 text-xs">ประกันพัสดุ</div>
                                  <div>{orderData.insuranceAmount} บาท</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 mr-2">API</Badge>
                        ข้อมูลตอบกลับจาก Flash Express API
                      </h4>
                      <div className="bg-gray-900 rounded-lg p-4 text-xs text-gray-200 font-mono overflow-auto max-h-60">
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      </div>
                      <div className="mt-2 text-right">
                        <CopyToClipboard 
                          text={JSON.stringify(result, null, 2)}
                          onCopy={() => {
                            setIsCopied(true);
                            toast({ title: "คัดลอกเรียบร้อย", description: "คัดลอกข้อมูล JSON ไปยังคลิปบอร์ดแล้ว" });
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                        >
                          <Button variant="ghost" size="sm">
                            {isCopied ? <LuCheck className="mr-1 h-3 w-3" /> : <LuCopy className="mr-1 h-3 w-3" />}
                            {isCopied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}
                          </Button>
                        </CopyToClipboard>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-gray-50 p-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setTabValue('create')}
                  >
                    สร้างออเดอร์ใหม่
                  </Button>
                  <Button 
                    onClick={() => openShippingLabel(result.trackingNumber || result.data?.pno)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <LuPrinter className="mr-2 h-4 w-4" />
                    พิมพ์ใบปะหน้าพัสดุ
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Alert Dialog สำหรับแสดงข้อผิดพลาด */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <LuAlertTriangle className="mr-2 h-5 w-5" />
              เกิดข้อผิดพลาด
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              ไม่สามารถสร้างออเดอร์ได้ โปรดตรวจสอบข้อมูลและลองใหม่อีกครั้ง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-100 rounded-md p-3 my-2 overflow-auto max-h-60">
            <pre className="text-xs text-red-800 whitespace-pre-wrap">
              {error?.response?.data ? JSON.stringify(error.response.data, null, 2) : error?.message}
            </pre>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>ตกลง</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}