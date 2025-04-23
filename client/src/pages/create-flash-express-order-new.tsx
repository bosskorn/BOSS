
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import api from '@/services/api';
import Layout from '@/components/Layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Truck, 
  PackageCheck, 
  User, 
  MapPin, 
  Phone, 
  Package, 
  Plus, 
  Trash, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

// สคีมาสำหรับฟอร์มสร้างออเดอร์
const createFlashOrderSchema = z.object({
  // ข้อมูลผู้ส่ง
  srcName: z.string().min(1, { message: 'กรุณากรอกชื่อผู้ส่ง' }),
  srcPhone: z.string().min(9, { message: 'กรุณากรอกเบอร์โทรผู้ส่ง' }),
  srcProvinceName: z.string().min(1, { message: 'กรุณาระบุจังหวัดของผู้ส่ง' }),
  srcCityName: z.string().min(1, { message: 'กรุณาระบุอำเภอของผู้ส่ง' }),
  srcDistrictName: z.string().optional(),
  srcPostalCode: z.string().min(5, { message: 'กรุณาระบุรหัสไปรษณีย์ของผู้ส่ง' }),
  srcDetailAddress: z.string().min(1, { message: 'กรุณาระบุที่อยู่โดยละเอียดของผู้ส่ง' }),
  
  // ข้อมูลผู้รับ
  dstName: z.string().min(1, { message: 'กรุณากรอกชื่อผู้รับ' }),
  dstPhone: z.string().min(9, { message: 'กรุณากรอกเบอร์โทรผู้รับ' }),
  dstHomePhone: z.string().optional(),
  dstProvinceName: z.string().min(1, { message: 'กรุณาระบุจังหวัดของผู้รับ' }),
  dstCityName: z.string().min(1, { message: 'กรุณาระบุอำเภอของผู้รับ' }),
  dstDistrictName: z.string().optional(),
  dstPostalCode: z.string().min(5, { message: 'กรุณาระบุรหัสไปรษณีย์ของผู้รับ' }),
  dstDetailAddress: z.string().min(1, { message: 'กรุณาระบุที่อยู่โดยละเอียดของผู้รับ' }),
  
  // ข้อมูลพัสดุ
  outTradeNo: z.string().optional(),
  expressCategory: z.number().default(1),
  articleCategory: z.number().default(1),
  weight: z.number().min(1, { message: 'น้ำหนักต้องมากกว่า 0 กรัม' }),
  width: z.number().optional(),
  length: z.number().optional(),
  height: z.number().optional(),
  
  // บริการเสริม
  insured: z.number().default(0),
  insureDeclareValue: z.number().optional(),
  opdInsureEnabled: z.number().default(0),
  
  // COD
  codEnabled: z.number().default(0),
  codAmount: z.number().optional(),
  
  // รายละเอียดสินค้า
  subItemTypes: z.array(
    z.object({
      itemName: z.string().min(1, { message: 'กรุณากรอกชื่อสินค้า' }),
      itemWeightSize: z.string().optional(),
      itemColor: z.string().optional(),
      itemQuantity: z.number().min(1, { message: 'จำนวนต้องมากกว่า 0' })
    })
  ).optional(),
  
  // หมายเหตุ
  remark: z.string().optional(),
});

type CreateFlashOrderFormValues = z.infer<typeof createFlashOrderSchema>;

const CreateFlashExpressOrderNew: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("sender");
  
  // State สำหรับจัดการป๊อบอัพแจ้งเตือนหลังจากสร้างออเดอร์สำเร็จ
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    trackingNumber?: string;
    sortCode?: string;
  }>({
    open: false,
    title: '',
    description: '',
  });
  
  // State สำหรับจัดการป๊อบอัพแจ้งเตือนข้อผิดพลาด
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    errorDetails?: string;
  }>({
    open: false,
    title: '',
    description: '',
  });
  
  // 1. การจัดการฟอร์มด้วย react-hook-form
  const form = useForm<CreateFlashOrderFormValues>({
    resolver: zodResolver(createFlashOrderSchema),
    defaultValues: {
      // ข้อมูลผู้ส่ง
      srcName: '',
      srcPhone: '',
      srcProvinceName: '',
      srcCityName: '',
      srcDistrictName: '',
      srcPostalCode: '',
      srcDetailAddress: '',
      
      // ข้อมูลผู้รับ
      dstName: '',
      dstPhone: '',
      dstHomePhone: '',
      dstProvinceName: '',
      dstCityName: '',
      dstDistrictName: '',
      dstPostalCode: '',
      dstDetailAddress: '',
      
      // ข้อมูลพัสดุ
      expressCategory: 1,
      articleCategory: 1,
      weight: 1000,
      width: 20,
      length: 30,
      height: 10,
      
      // บริการเสริม
      insured: 0,
      insureDeclareValue: 0,
      opdInsureEnabled: 0,
      
      // COD
      codEnabled: 0,
      codAmount: 0,
      
      // รายละเอียดสินค้า
      subItemTypes: [
        {
          itemName: '',
          itemWeightSize: 'กลาง',
          itemColor: 'ขาว',
          itemQuantity: 1
        }
      ],
      
      // หมายเหตุ
      remark: '',
    }
  });
  
  // ดึงข้อมูลผู้ใช้เมื่อโหลดหน้า
  useEffect(() => {
    if (user) {
      // กำหนดข้อมูลผู้ส่งเริ่มต้นจากข้อมูลผู้ใช้
      form.setValue('srcName', user.fullname || '');
      form.setValue('srcPhone', user.phone || '');
      form.setValue('srcProvinceName', user.province || '');
      form.setValue('srcCityName', user.district || '');
      form.setValue('srcDistrictName', user.subdistrict || '');
      form.setValue('srcPostalCode', user.zipcode || '');
      form.setValue('srcDetailAddress', user.address || '');
      
      // สร้างเลขออเดอร์
      const now = new Date();
      const timestamp = now.getTime();
      form.setValue('outTradeNo', `SS${timestamp}`);
    }
  }, [user, form]);
  
  // ฟังก์ชันการเพิ่มรายการสินค้า
  const addItem = () => {
    const subItemTypes = form.getValues('subItemTypes') || [];
    form.setValue('subItemTypes', [
      ...subItemTypes,
      {
        itemName: '',
        itemWeightSize: 'กลาง',
        itemColor: 'ขาว',
        itemQuantity: 1
      }
    ]);
  };
  
  // ฟังก์ชันการลบรายการสินค้า
  const removeItem = (index: number) => {
    const currentItems = form.getValues('subItemTypes') || [];
    if (currentItems.length <= 1) {
      toast({
        title: 'ไม่สามารถลบได้',
        description: 'ต้องมีสินค้าอย่างน้อย 1 รายการ',
        variant: 'destructive',
      });
      return;
    }
    
    const newItems = currentItems.filter((_, i) => i !== index);
    form.setValue('subItemTypes', newItems);
  };
  
  // ฟังก์ชันการตรวจสอบว่า COD ทำงานหรือไม่
  const isCodEnabled = () => {
    return form.watch('codEnabled') === 1;
  };
  
  // ฟังก์ชันการตรวจสอบว่า ซื้อประกันหรือไม่
  const isInsuredEnabled = () => {
    return form.watch('insured') === 1;
  };
  
  // ตรวจสอบและส่งข้อมูลฟอร์ม
  const onSubmit = async (data: CreateFlashOrderFormValues) => {
    try {
      setIsLoading(true);
      
      // ถ้าเป็น COD ตรวจสอบว่าได้กรอก codAmount หรือไม่
      if (data.codEnabled === 1 && (!data.codAmount || data.codAmount <= 0)) {
        form.setError('codAmount', {
          type: 'manual',
          message: 'กรุณาระบุจำนวนเงิน COD'
        });
        setIsLoading(false);
        return;
      }
      
      // ถ้าซื้อประกัน ตรวจสอบว่าได้กรอกมูลค่าสินค้าหรือไม่
      if (data.insured === 1 && (!data.insureDeclareValue || data.insureDeclareValue <= 0)) {
        form.setError('insureDeclareValue', {
          type: 'manual',
          message: 'กรุณาระบุมูลค่าสินค้า'
        });
        setIsLoading(false);
        return;
      }
      
      // แปลงค่า codAmount เป็นสตางค์ (บาท x 100)
      if (data.codEnabled === 1 && data.codAmount) {
        data.codAmount = Math.floor(data.codAmount * 100);
      }
      
      // แปลงค่า insureDeclareValue เป็นสตางค์ (บาท x 100)
      if (data.insured === 1 && data.insureDeclareValue) {
        data.insureDeclareValue = Math.floor(data.insureDeclareValue * 100);
      }
      
      // แปลง subItemTypes เป็น JSON
      const subItemTypes = data.subItemTypes ? data.subItemTypes.map(item => ({
        ...item,
        itemQuantity: String(item.itemQuantity)
      })) : [];
      
      // ส่งข้อมูลไปยัง API
      const response = await api.post('/api/shipping-methods/flash-express/shipping', {
        orderData: {
          ...data,
          subItemTypes: JSON.stringify(subItemTypes)
        }
      });
      
      if (response.data.success) {
        toast({
          title: 'สร้างออเดอร์สำเร็จ',
          description: `เลขพัสดุ: ${response.data.trackingNumber}`,
        });
        
        // แสดงป๊อปอัพยืนยันการสร้างออเดอร์สำเร็จ
        setDialog({
          open: true,
          title: 'สร้างออเดอร์สำเร็จ',
          description: 'ออเดอร์ของคุณได้ถูกสร้างเรียบร้อยแล้ว',
          trackingNumber: response.data.trackingNumber,
          sortCode: response.data.sortCode
        });
        
        // เคลียร์ฟอร์ม
        form.reset();
      } else {
        throw new Error(response.data.message || 'ไม่สามารถสร้างออเดอร์ได้');
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการสร้างออเดอร์:', error);
      
      // แสดงข้อผิดพลาดให้ผู้ใช้
      let errorMessage = 'ไม่สามารถสร้างออเดอร์ได้';
      let errorDetails = '';
      
      if (error.response) {
        errorMessage = error.response.data.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
        errorDetails = JSON.stringify(error.response.data, null, 2);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertDialog({
        open: true,
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        errorDetails: errorDetails
      });
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // ควบคุมการเปลี่ยนแท็บและตรวจสอบความถูกต้องของข้อมูล
  const handleTabChange = async (value: string) => {
    try {
      // ตรวจสอบความถูกต้องของข้อมูลก่อนเปลี่ยนแท็บ
      if (value === "receiver") {
        // ตรวจสอบข้อมูลผู้ส่ง
        const isValid = await form.trigger([
          'srcName', 
          'srcPhone', 
          'srcProvinceName', 
          'srcCityName', 
          'srcPostalCode', 
          'srcDetailAddress'
        ]);
        
        if (!isValid) {
          toast({
            title: "กรุณากรอกข้อมูลให้ครบถ้วน",
            description: "กรุณากรอกข้อมูลผู้ส่งให้ครบถ้วนก่อนไปขั้นตอนถัดไป",
            variant: "destructive",
          });
          return;
        }
      } else if (value === "parcel") {
        // ตรวจสอบข้อมูลผู้รับ
        const isValid = await form.trigger([
          'dstName', 
          'dstPhone', 
          'dstProvinceName', 
          'dstCityName', 
          'dstPostalCode', 
          'dstDetailAddress'
        ]);
        
        if (!isValid) {
          toast({
            title: "กรุณากรอกข้อมูลให้ครบถ้วน",
            description: "กรุณากรอกข้อมูลผู้รับให้ครบถ้วนก่อนไปขั้นตอนถัดไป",
            variant: "destructive",
          });
          return;
        }
      } else if (value === "confirm") {
        // ตรวจสอบข้อมูลพัสดุ
        const isValid = await form.trigger(['weight']);
        
        if (!isValid) {
          toast({
            title: "กรุณากรอกข้อมูลให้ครบถ้วน",
            description: "กรุณากรอกข้อมูลพัสดุให้ครบถ้วนก่อนไปขั้นตอนถัดไป",
            variant: "destructive",
          });
          return;
        }
      }
      
      // ถ้าผ่านการตรวจสอบจึงเปลี่ยนแท็บ
      setActiveTab(value);
    } catch (error) {
      console.error("Error in handleTabChange:", error);
      // กรณีเกิด error ที่ไม่คาดคิด ให้เปลี่ยนแท็บไปเลย
      setActiveTab(value);
    }
  };
  
  // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>กรุณาเข้าสู่ระบบ</CardTitle>
              <CardDescription>
                คุณจำเป็นต้องเข้าสู่ระบบก่อนใช้งานหน้าสร้างออเดอร์
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setLocation('/auth')}>ไปยังหน้าเข้าสู่ระบบ</Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">สร้างออเดอร์ Flash Express</h1>
          <p className="text-gray-600 text-lg mt-2">สร้างออเดอร์และจัดส่งสินค้าผ่าน Flash Express อย่างรวดเร็ว</p>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-500 mt-4 rounded-full"></div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="sender" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">1</div>
                <span className="text-xs sm:text-sm">ข้อมูลผู้ส่ง</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="receiver" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">2</div>
                <span className="text-xs sm:text-sm">ข้อมูลผู้รับ</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="parcel" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">3</div>
                <span className="text-xs sm:text-sm">ข้อมูลพัสดุ</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="confirm" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">4</div>
                <span className="text-xs sm:text-sm">ตรวจสอบ</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* ขั้นตอนที่ 1: ข้อมูลผู้ส่ง */}
              <TabsContent value="sender">
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 1</span>
                        ข้อมูลผู้ส่ง
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="srcName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อผู้ส่ง <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อผู้ส่ง" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="srcPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เบอร์โทรผู้ส่ง <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="เบอร์โทรผู้ส่ง" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="srcDetailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ที่อยู่ผู้ส่ง <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="บ้านเลขที่ ถนน ตึก" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="srcProvinceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จังหวัด <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="จังหวัด" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="srcCityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>อำเภอ/เขต <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="อำเภอ/เขต" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="srcDistrictName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ตำบล/แขวง</FormLabel>
                            <FormControl>
                              <Input placeholder="ตำบล/แขวง" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="srcPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>รหัสไปรษณีย์ <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="รหัสไปรษณีย์" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <Button 
                        type="button"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        onClick={() => handleTabChange('receiver')}
                      >
                        ถัดไป <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* ขั้นตอนที่ 2: ข้อมูลผู้รับ */}
              <TabsContent value="receiver">
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 2</span>
                        ข้อมูลผู้รับ
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อผู้รับ <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อผู้รับ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dstPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เบอร์โทรผู้รับ <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="เบอร์โทรผู้รับ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="dstHomePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เบอร์โทรศัพท์บ้านผู้รับ (ถ้ามี)</FormLabel>
                          <FormControl>
                            <Input placeholder="เบอร์โทรศัพท์บ้าน" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dstDetailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ที่อยู่ผู้รับ <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="บ้านเลขที่ ถนน ตึก" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dstProvinceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จังหวัด <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="จังหวัด" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dstCityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>อำเภอ/เขต <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="อำเภอ/เขต" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dstDistrictName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ตำบล/แขวง</FormLabel>
                            <FormControl>
                              <Input placeholder="ตำบล/แขวง" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dstPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>รหัสไปรษณีย์ <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="รหัสไปรษณีย์" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-between">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => handleTabChange('sender')}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                      </Button>
                      <Button 
                        type="button"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        onClick={() => handleTabChange('parcel')}
                      >
                        ถัดไป <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* ขั้นตอนที่ 3: ข้อมูลพัสดุ */}
              <TabsContent value="parcel">
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <Package className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 3</span>
                        ข้อมูลพัสดุ
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="outTradeNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เลขออเดอร์</FormLabel>
                            <FormControl>
                              <Input placeholder="เลขออเดอร์" {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              ระบบจะสร้างเลขออเดอร์อัตโนมัติ
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expressCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ประเภทการจัดส่ง <span className="text-red-500">*</span></FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกประเภทการจัดส่ง" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">ปกติ</SelectItem>
                                <SelectItem value="2">ด่วนพิเศษ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="articleCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ประเภทสินค้า <span className="text-red-500">*</span></FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกประเภทสินค้า" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">เสื้อผ้า/สิ่งทอ</SelectItem>
                                <SelectItem value="2">เครื่องสำอาง/ความงาม</SelectItem>
                                <SelectItem value="3">อาหาร/เครื่องดื่ม</SelectItem>
                                <SelectItem value="4">อุปกรณ์อิเล็กทรอนิกส์</SelectItem>
                                <SelectItem value="5">เครื่องใช้ในบ้าน</SelectItem>
                                <SelectItem value="6">อุปกรณ์ไอที</SelectItem>
                                <SelectItem value="7">สุขภาพ/การแพทย์</SelectItem>
                                <SelectItem value="8">ของเล่น/ของขวัญ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>น้ำหนัก (กรัม) <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="น้ำหนัก (กรัม)" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              น้ำหนักเป็นกรัม เช่น 1 กิโลกรัม = 1000 กรัม
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ความกว้าง (ซม.)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="ความกว้าง (ซม.)" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ความยาว (ซม.)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="ความยาว (ซม.)" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ความสูง (ซม.)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="ความสูง (ซม.)" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="border border-purple-100 rounded-lg p-4 bg-purple-50/50">
                      <h3 className="font-medium text-purple-800 mb-4">บริการเสริม</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="insured"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === 1}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked ? 1 : 0);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  ซื้อประกันสินค้า (Flash Care)
                                </FormLabel>
                                <FormDescription>
                                  คุ้มครองสินค้าเสียหายระหว่างการขนส่ง
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {isInsuredEnabled() && (
                          <FormField
                            control={form.control}
                            name="insureDeclareValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>มูลค่าสินค้า (บาท) <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="มูลค่าสินค้า (บาท)" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="opdInsureEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === 1}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked ? 1 : 0);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  ซื้อบริการบรรจุภัณฑ์พิเศษ (Box Shield)
                                </FormLabel>
                                <FormDescription>
                                  บรรจุภัณฑ์พิเศษเพื่อป้องกันความเสียหาย
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="codEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === 1}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked ? 1 : 0);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  เก็บเงินปลายทาง (COD)
                                </FormLabel>
                                <FormDescription>
                                  เก็บเงินค่าสินค้าจากผู้รับปลายทาง
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {isCodEnabled() && (
                          <FormField
                            control={form.control}
                            name="codAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>จำนวนเงิน COD (บาท) <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="จำนวนเงิน (บาท)" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="border border-purple-100 rounded-lg p-4 bg-purple-50/50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-purple-800">รายละเอียดสินค้า</h3>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addItem}
                          size="sm"
                          className="border-dashed border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Plus className="mr-2 h-4 w-4" /> เพิ่มสินค้า
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {form.watch('subItemTypes')?.map((_, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <FormField
                                control={form.control}
                                name={`subItemTypes.${index}.itemName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">ชื่อสินค้า</FormLabel>
                                    <FormControl>
                                      <Input placeholder="ชื่อสินค้า" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`subItemTypes.${index}.itemColor`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">สี</FormLabel>
                                    <FormControl>
                                      <Input placeholder="สี" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`subItemTypes.${index}.itemWeightSize`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">ขนาด</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="ขนาด" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="เล็ก">เล็ก</SelectItem>
                                        <SelectItem value="กลาง">กลาง</SelectItem>
                                        <SelectItem value="ใหญ่">ใหญ่</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`subItemTypes.${index}.itemQuantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">จำนวน</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="จำนวน" 
                                        min={1}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="col-span-1 self-end pb-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="remark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>หมายเหตุ</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" 
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4 flex justify-between">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => handleTabChange('receiver')}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                      </Button>
                      <Button 
                        type="button"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        onClick={() => handleTabChange('confirm')}
                      >
                        ถัดไป <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* ขั้นตอนที่ 4: ตรวจสอบและยืนยัน */}
              <TabsContent value="confirm">
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 4</span>
                        ตรวจสอบและยืนยัน
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                        <h3 className="font-medium text-purple-900 mb-2">ข้อมูลเลขออเดอร์</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">เลขออเดอร์:</span>
                            <p className="font-medium">{form.getValues('outTradeNo')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                          <h3 className="font-medium text-purple-900 mb-2">ข้อมูลผู้ส่ง</h3>
                          <p className="font-medium">
                            {form.getValues('srcName')}<br />
                            {form.getValues('srcPhone')}<br />
                            {form.getValues('srcDetailAddress')}<br />
                            {form.getValues('srcDistrictName') && `ต.${form.getValues('srcDistrictName')} `}
                            อ.{form.getValues('srcCityName')}<br />
                            จ.{form.getValues('srcProvinceName')} {form.getValues('srcPostalCode')}
                          </p>
                        </div>
                        
                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                          <h3 className="font-medium text-purple-900 mb-2">ข้อมูลผู้รับ</h3>
                          <p className="font-medium">
                            {form.getValues('dstName')}<br />
                            {form.getValues('dstPhone')}<br />
                            {form.getValues('dstDetailAddress')}<br />
                            {form.getValues('dstDistrictName') && `ต.${form.getValues('dstDistrictName')} `}
                            อ.{form.getValues('dstCityName')}<br />
                            จ.{form.getValues('dstProvinceName')} {form.getValues('dstPostalCode')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                        <h3 className="font-medium text-purple-900 mb-2">ข้อมูลพัสดุ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">ประเภทการจัดส่ง:</span>
                            <p className="font-medium">
                              {form.getValues('expressCategory') === 1 ? 'ปกติ' : 'ด่วนพิเศษ'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">ประเภทสินค้า:</span>
                            <p className="font-medium">
                              {form.getValues('articleCategory') === 1 ? 'เสื้อผ้า/สิ่งทอ' : 
                                form.getValues('articleCategory') === 2 ? 'เครื่องสำอาง/ความงาม' :
                                form.getValues('articleCategory') === 3 ? 'อาหาร/เครื่องดื่ม' :
                                form.getValues('articleCategory') === 4 ? 'อุปกรณ์อิเล็กทรอนิกส์' :
                                form.getValues('articleCategory') === 5 ? 'เครื่องใช้ในบ้าน' :
                                form.getValues('articleCategory') === 6 ? 'อุปกรณ์ไอที' :
                                form.getValues('articleCategory') === 7 ? 'สุขภาพ/การแพทย์' :
                                'ของเล่น/ของขวัญ'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">น้ำหนัก:</span>
                            <p className="font-medium">{form.getValues('weight')} กรัม</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">ขนาด (กxยxส):</span>
                            <p className="font-medium">
                              {form.getValues('width') || 0} x {form.getValues('length') || 0} x {form.getValues('height') || 0} ซม.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                        <h3 className="font-medium text-purple-900 mb-2">บริการเสริม</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${form.getValues('insured') === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {form.getValues('insured') === 1 ? '✓' : '×'}
                            </div>
                            <span>ซื้อประกันสินค้า (Flash Care)</span>
                            {form.getValues('insured') === 1 && form.getValues('insureDeclareValue') && (
                              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                                มูลค่า {form.getValues('insureDeclareValue')} บาท
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${form.getValues('opdInsureEnabled') === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {form.getValues('opdInsureEnabled') === 1 ? '✓' : '×'}
                            </div>
                            <span>ซื้อบริการบรรจุภัณฑ์พิเศษ (Box Shield)</span>
                          </div>
                          
                          <div className="flex items-center">
                            <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${form.getValues('codEnabled') === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {form.getValues('codEnabled') === 1 ? '✓' : '×'}
                            </div>
                            <span>เก็บเงินปลายทาง (COD)</span>
                            {form.getValues('codEnabled') === 1 && form.getValues('codAmount') && (
                              <Badge className="ml-2 bg-orange-100 text-orange-800 hover:bg-orange-200">
                                {form.getValues('codAmount')} บาท
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {form.getValues('subItemTypes') && form.getValues('subItemTypes').length > 0 && (
                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                          <h3 className="font-medium text-purple-900 mb-2">รายละเอียดสินค้า</h3>
                          <div className="space-y-2">
                            {form.getValues('subItemTypes')?.map((item, index) => (
                              <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                                <div>
                                  <span className="font-medium">{item.itemName}</span>
                                  <span className="text-sm text-gray-500 ml-2">({item.itemColor}, {item.itemWeightSize})</span>
                                </div>
                                <span className="font-medium">x{item.itemQuantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {form.getValues('remark') && (
                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                          <h3 className="font-medium text-purple-900 mb-2">หมายเหตุ</h3>
                          <p>{form.getValues('remark')}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 flex justify-between">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => handleTabChange('parcel')}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? 'กำลังสร้างออเดอร์...' : 'สร้างออเดอร์'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </div>
      
      {/* Dialog แสดงผลหลังจากสร้างออเดอร์สำเร็จ */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl">{dialog.title}</DialogTitle>
            </div>
            <DialogDescription>
              {dialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg my-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">เลขพัสดุ:</p>
                <p className="font-semibold">{dialog.trackingNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">รหัสเรียงพัสดุ:</p>
                <p className="font-semibold">{dialog.sortCode}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog({ ...dialog, open: false });
                window.location.reload(); // รีเฟรชหน้าเพื่อล้างฟอร์มและเริ่มสร้างออเดอร์ใหม่
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> สร้างออเดอร์ใหม่
            </Button>
            <Button
              type="button"
              onClick={() => {
                setDialog({ ...dialog, open: false });
                setLocation('/orders');
              }}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Truck className="mr-2 h-4 w-4" /> ดูรายการออเดอร์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AlertDialog สำหรับแสดงข้อผิดพลาด */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center space-x-2">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">{alertDialog.title}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base mt-2">
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {alertDialog.errorDetails && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 my-3 text-sm text-gray-700 max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-1">รายละเอียดข้อผิดพลาด:</p>
              <p className="whitespace-pre-wrap">{alertDialog.errorDetails}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction className="bg-blue-600 hover:bg-blue-700">
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CreateFlashExpressOrderNew;
