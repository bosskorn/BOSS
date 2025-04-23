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

import { 
  LuPackageOpen, 
  LuTruck, 
  LuPrinter, 
  LuCopy, 
  LuCheck, 
  LuSearch, 
  LuInfo, 
  LuFilePlus
} from 'react-icons/lu';

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
  
  // สถานะการแสดงผล
  const [showForm, setShowForm] = useState(true);
  
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
  const [trackingNumber, setTrackingNumber] = useState("");
  
  // ข้อมูลฟอร์ม
  const [orderData, setOrderData] = useState<OrderFormData>({
    // ข้อมูลผู้ส่ง (จะใช้ข้อมูลจากผู้ใช้งานโดยอัตโนมัติ)
    srcName: user?.fullname || "",
    srcPhone: user?.phone || "",
    srcProvinceName: user?.province || "กรุงเทพมหานคร",
    srcCityName: user?.district || "",
    srcDistrictName: user?.subdistrict || "",
    srcPostalCode: user?.zipcode || "",
    srcDetailAddress: user?.address || "",
    
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
      // คงข้อมูลผู้ส่งจากโปรไฟล์ผู้ใช้
      srcName: user?.fullname || "",
      srcPhone: user?.phone || "",
      srcProvinceName: user?.province || "กรุงเทพมหานคร",
      srcCityName: user?.district || "",
      srcDistrictName: user?.subdistrict || "",
      srcPostalCode: user?.zipcode || "",
      srcDetailAddress: user?.address || "",
      
      // รีเซ็ตข้อมูลผู้รับ
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
      // เตรียมข้อมูลสำหรับส่งไป API ตามรูปแบบที่ทำงานได้จริง
      // สร้าง nonceStr และ outTradeNo
      const nonceStr = Date.now().toString();
      const outTradeNo = `ORDER${Date.now()}`;
      
      const flashExpressOrderData = {
        // ข้อมูลพื้นฐานของบริษัทตามรูปแบบที่ถูกต้อง
        mchId: process.env.FLASH_EXPRESS_MERCHANT_ID,
        nonceStr: nonceStr,
        outTradeNo: outTradeNo,
        warehouseNo: `${process.env.FLASH_EXPRESS_MERCHANT_ID}_001`,
        
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
        dstHomePhone: orderData.dstPhone, // จำเป็นต้องมีตามตัวอย่าง
        dstProvinceName: orderData.dstProvinceName,
        dstCityName: orderData.dstCityName,
        dstDistrictName: orderData.dstDistrictName,
        dstPostalCode: orderData.dstPostalCode,
        dstDetailAddress: orderData.dstDetailAddress,
        
        // ข้อมูลการคืนพัสดุ (ใช้ข้อมูลผู้ส่ง)
        returnName: orderData.srcName,
        returnPhone: orderData.srcPhone,
        returnProvinceName: orderData.srcProvinceName,
        returnCityName: orderData.srcCityName,
        returnPostalCode: orderData.srcPostalCode,
        returnDetailAddress: orderData.srcDetailAddress,
        
        // ข้อมูลพัสดุและประเภทการจัดส่ง
        articleCategory: 1, // ใช้ค่า 1 ตามตัวอย่าง
        expressCategory: parseInt(orderData.expressCategory),
        weight: parseFloat(orderData.weight) * 1000, // แปลงเป็นกรัม
        
        // ข้อมูลประกัน
        insured: hasInsurance ? 1 : 0,
        insureDeclareValue: hasInsurance ? parseFloat(orderData.insuranceAmount) : 0,
        opdInsureEnabled: hasInsurance ? 1 : 0,
        
        // ข้อมูล COD
        codEnabled: hasCOD ? 1 : 0,
        codAmount: hasCOD ? parseFloat(orderData.codAmount) : 0,
        
        // ข้อมูลพัสดุย่อย
        subParcelQuantity: 1,
        subParcel: JSON.stringify([{
          outTradeNo: outTradeNo + "1",
          weight: parseFloat(orderData.weight) * 1000,
          width: parseInt(orderData.width),
          length: parseInt(orderData.length),
          height: parseInt(orderData.height),
          remark: ""
        }]),
        
        // ข้อมูลสินค้า
        subItemTypes: JSON.stringify([{
          itemName: orderData.itemName || "สินค้า",
          itemWeightSize: `${orderData.width}*${orderData.length}*${orderData.height} ${orderData.weight}Kg`,
          itemColor: "",
          itemQuantity: orderData.itemQuantity || "1"
        }]),
        
        // หมายเหตุ
        remark: ""
      };
      
      // กำหนดค่าให้กับฟิลด์ซ่อนที่ใช้สำหรับ Flash Express API
      // เพื่อให้มีหลายรูปแบบให้ Flash Express API เลือกใช้
      document.getElementById('snd_name')?.setAttribute('value', orderData.srcName);
      document.getElementById('snd_phone')?.setAttribute('value', orderData.srcPhone);
      document.getElementById('snd_province')?.setAttribute('value', orderData.srcProvinceName);
      document.getElementById('snd_district')?.setAttribute('value', orderData.srcCityName);
      document.getElementById('snd_subdistrict')?.setAttribute('value', orderData.srcDistrictName);
      document.getElementById('snd_address')?.setAttribute('value', orderData.srcDetailAddress);
      document.getElementById('snd_zipcode')?.setAttribute('value', orderData.srcPostalCode);
      
      document.getElementById('rcv_name')?.setAttribute('value', orderData.dstName);
      document.getElementById('rcv_phone')?.setAttribute('value', orderData.dstPhone);
      document.getElementById('rcv_province')?.setAttribute('value', orderData.dstProvinceName);
      document.getElementById('rcv_district')?.setAttribute('value', orderData.dstCityName);
      document.getElementById('rcv_subdistrict')?.setAttribute('value', orderData.dstDistrictName);
      document.getElementById('rcv_address')?.setAttribute('value', orderData.dstDetailAddress);
      document.getElementById('rcv_zipcode')?.setAttribute('value', orderData.dstPostalCode);

      setProgress(50);
      console.log('กำลังส่งข้อมูลไปยัง Flash Express API:', flashExpressOrderData);
      
      // เรียกใช้ API สร้างออเดอร์
      const response = await api.post('/api/flash-express/create-order', flashExpressOrderData);
      
      setProgress(100);
      console.log('การตอบกลับจาก API:', response.data);
      
      // เก็บข้อมูลผลลัพธ์
      setResult(response.data);
      setTrackingNumber(response.data.trackingNumber || response.data.data?.pno || '');
      
      // ซ่อนฟอร์ม และแสดงผลลัพธ์
      setShowForm(false);
      
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

        {/* แสดงฟอร์มสร้างออเดอร์หรือผลลัพธ์ */}
        {showForm ? (
          <div className="grid grid-cols-1 gap-6">
            <Card className="border border-purple-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <LuPackageOpen className="mr-2 h-5 w-5 text-purple-600" />
                      ข้อมูลออเดอร์ Flash Express
                    </CardTitle>
                    <CardDescription>
                      กรอกข้อมูลให้ครบถ้วนเพื่อสร้างเลขพัสดุสำหรับการจัดส่ง
                    </CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* ส่วนข้อมูลผู้ส่ง - ซ่อนฟอร์ม แต่แสดงข้อมูลผู้ส่งที่ใช้ */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mr-2">ผู้ส่ง</Badge>
                        <h3 className="text-lg font-medium">ข้อมูลผู้ส่ง (ใช้ข้อมูลจากโปรไฟล์ของคุณ)</h3>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md mb-4 border border-purple-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">ชื่อผู้ส่ง:</span>
                          <p className="text-gray-700">{orderData.srcName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">เบอร์โทรศัพท์:</span>
                          <p className="text-gray-700">{orderData.srcPhone}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">ที่อยู่:</span>
                          <p className="text-gray-700">
                            {orderData.srcDetailAddress} {orderData.srcDistrictName ? `ต.${orderData.srcDistrictName}` : ''} {orderData.srcCityName ? `อ.${orderData.srcCityName}` : ''} {orderData.srcProvinceName} {orderData.srcPostalCode}
                          </p>
                        </div>
                      </div>
                      <input type="hidden" name="srcName" value={orderData.srcName} />
                      <input type="hidden" name="srcPhone" value={orderData.srcPhone} />
                      <input type="hidden" name="srcProvinceName" value={orderData.srcProvinceName} />
                      <input type="hidden" name="srcCityName" value={orderData.srcCityName} />
                      <input type="hidden" name="srcDistrictName" value={orderData.srcDistrictName} />
                      <input type="hidden" name="srcPostalCode" value={orderData.srcPostalCode} />
                      <input type="hidden" name="srcDetailAddress" value={orderData.srcDetailAddress} />
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
                            {/* ฟิลด์ที่ซ่อนไว้สำหรับการส่งข้อมูลไปยัง Flash Express API */}
                            <input type="hidden" name="snd_name" id="snd_name" />
                            <input type="hidden" name="snd_phone" id="snd_phone" />
                            <input type="hidden" name="snd_province" id="snd_province" />
                            <input type="hidden" name="snd_district" id="snd_district" />
                            <input type="hidden" name="snd_subdistrict" id="snd_subdistrict" />
                            <input type="hidden" name="snd_address" id="snd_address" />
                            <input type="hidden" name="snd_zipcode" id="snd_zipcode" />
                            
                            <input type="hidden" name="rcv_name" id="rcv_name" />
                            <input type="hidden" name="rcv_phone" id="rcv_phone" />
                            <input type="hidden" name="rcv_province" id="rcv_province" />
                            <input type="hidden" name="rcv_district" id="rcv_district" />
                            <input type="hidden" name="rcv_subdistrict" id="rcv_subdistrict" />
                            <input type="hidden" name="rcv_address" id="rcv_address" />
                            <input type="hidden" name="rcv_zipcode" id="rcv_zipcode" />
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
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mr-2">บริการเสริม</Badge>
                      <h3 className="text-lg font-medium">บริการเสริม (ถ้ามี)</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="hasCOD" 
                          checked={hasCOD} 
                          onCheckedChange={(checked) => setHasCOD(checked as boolean)} 
                        />
                        <Label htmlFor="hasCOD" className="cursor-pointer">เก็บเงินปลายทาง (COD)</Label>
                      </div>
                      
                      {hasCOD && (
                        <div className="pl-6 space-y-2">
                          <Label htmlFor="codAmount">จำนวนเงินที่ต้องเก็บ (บาท)</Label>
                          <Input 
                            id="codAmount" 
                            name="codAmount" 
                            type="number" 
                            value={orderData.codAmount} 
                            onChange={handleInputChange} 
                            min="1" 
                            placeholder="ระบุจำนวนเงิน" 
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="hasInsurance" 
                          checked={hasInsurance} 
                          onCheckedChange={(checked) => setHasInsurance(checked as boolean)} 
                        />
                        <Label htmlFor="hasInsurance" className="cursor-pointer">ประกันพัสดุ</Label>
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
                            min="1" 
                            placeholder="ระบุมูลค่าประกัน" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6 bg-gray-50">
                <Button 
                  onClick={createOrder} 
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isLoading ? 'กำลังดำเนินการ...' : 'สร้างออเดอร์'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          /* หน้าแสดงผลลัพธ์หลังสร้างออเดอร์สำเร็จ */
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-green-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                <CardTitle className="flex items-center">
                  <LuCheck className="mr-2 h-5 w-5 text-green-600" />
                  ผลลัพธ์การสร้างออเดอร์
                </CardTitle>
                <CardDescription>
                  ออเดอร์ถูกสร้างสำเร็จแล้ว กรุณาเก็บข้อมูลเลขพัสดุไว้
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {result && (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 rounded-md border border-green-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 mr-2">สำเร็จ</Badge>
                          <h3 className="text-lg font-medium">การจัดส่งถูกสร้างเรียบร้อยแล้ว</h3>
                        </div>
                        <CopyToClipboard 
                          text={result.trackingNumber || result.data?.pno || ''} 
                          onCopy={() => {
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {isCopied ? <LuCheck className="mr-1 h-4 w-4" /> : <LuCopy className="mr-1 h-4 w-4" />}
                            {isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                          </Button>
                        </CopyToClipboard>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">เลขพัสดุ</div>
                          <div className="text-lg font-medium text-green-700">
                            {result.trackingNumber || result.data?.pno || 'ไม่มีเลขพัสดุ'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">หมายเลขอ้างอิงร้านค้า</div>
                          <div>{result.orderNumber || result.data?.outTradeNo || '-'}</div>
                        </div>
                        {result.data?.sortCode && (
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Sort Code</div>
                            <div>{result.data.sortCode}</div>
                          </div>
                        )}
                        {result.data?.lineCode && (
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Line Code</div>
                            <div>{result.data.lineCode}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 justify-end mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowForm(true);
                            resetForm();
                          }}
                          size="sm"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <LuFilePlus className="mr-1 h-4 w-4" />
                          สร้างออเดอร์ใหม่
                        </Button>
                        <Button 
                          onClick={() => openShippingLabel(result.trackingNumber || result.data?.pno || '')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <LuPrinter className="mr-1 h-4 w-4" />
                          พิมพ์ใบปะหน้าพัสดุ
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* แจ้งเตือนข้อผิดพลาด */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>เกิดข้อผิดพลาด</AlertDialogTitle>
            <AlertDialogDescription>
              {error?.response?.data?.message || error?.message || "ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>ตกลง</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}