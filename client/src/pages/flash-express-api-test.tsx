
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/AdminLayout';

// Schemas
const provinceList = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา',
  'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก',
  'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน',
  'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา',
  'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต',
  'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี',
  'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
  'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี',
  'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

// คำนิยามประเภทสินค้า
const articleCategories = [
  { value: "1", label: "เสื้อผ้า" },
  { value: "2", label: "อื่นๆ" },
  { value: "3", label: "อุปกรณ์อิเล็กทรอนิกส์" },
  { value: "4", label: "หนังสือ" },
  { value: "5", label: "ของเล่น" },
  { value: "6", label: "อาหารและเครื่องดื่ม" },
  { value: "7", label: "เครื่องสำอาง" },
  { value: "8", label: "ยา" },
  { value: "9", label: "เครื่องใช้ในบ้าน" }
];

// คำนิยามประเภทการจัดส่ง
const expressCategories = [
  { value: "1", label: "ด่วน (1-2 วัน)" },
  { value: "2", label: "ปกติ (2-3 วัน)" }
];

const orderFormSchema = z.object({
  // ข้อมูลพื้นฐาน
  outTradeNo: z.string().default(() => `TEST${Date.now()}`),
  
  // ข้อมูลผู้ส่ง
  srcName: z.string().min(2, 'กรุณาระบุชื่อผู้ส่ง'),
  srcPhone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง'),
  srcProvinceName: z.string().min(1, 'กรุณาเลือกจังหวัด'),
  srcCityName: z.string().min(1, 'กรุณาเลือกอำเภอ/เขต'),
  srcDistrictName: z.string().optional(),
  srcPostalCode: z.string().min(5, 'กรุณาระบุรหัสไปรษณีย์'),
  srcDetailAddress: z.string().min(5, 'กรุณาระบุที่อยู่'),

  // ข้อมูลผู้รับ
  dstName: z.string().min(2, 'กรุณาระบุชื่อผู้รับ'),
  dstPhone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง'),
  dstHomePhone: z.string().optional(),
  dstProvinceName: z.string().min(1, 'กรุณาเลือกจังหวัด'),
  dstCityName: z.string().min(1, 'กรุณาเลือกอำเภอ/เขต'),
  dstDistrictName: z.string().optional(),
  dstPostalCode: z.string().min(5, 'กรุณาระบุรหัสไปรษณีย์'),
  dstDetailAddress: z.string().min(5, 'กรุณาระบุที่อยู่'),

  // ข้อมูลพัสดุ
  weight: z.coerce.number().min(0.1, 'น้ำหนักต้องมากกว่า 0.1 กก.').max(30, 'น้ำหนักต้องไม่เกิน 30 กก.'),
  width: z.coerce.number().min(1, 'ความกว้างต้องมากกว่า 1 ซม.').max(100, 'ความกว้างต้องไม่เกิน 100 ซม.').optional(),
  length: z.coerce.number().min(1, 'ความยาวต้องมากกว่า 1 ซม.').max(100, 'ความยาวต้องไม่เกิน 100 ซม.').optional(),
  height: z.coerce.number().min(1, 'ความสูงต้องมากกว่า 1 ซม.').max(100, 'ความสูงต้องไม่เกิน 100 ซม.').optional(),
  
  // ประเภทสินค้าและการจัดส่ง
  articleCategory: z.string().default("2"), // 2 = อื่นๆ (default)
  expressCategory: z.string().default("1"), // 1 = ด่วน (default)
  
  // บริการเสริม
  insured: z.coerce.number().default(0),
  insureDeclareValue: z.coerce.number().optional(),
  opdInsureEnabled: z.coerce.number().default(0),
  codEnabled: z.coerce.number().default(0),
  codAmount: z.coerce.number().default(0),
  
  // อื่นๆ
  remark: z.string().optional(),
  
  // ข้อมูลสินค้า (จำเป็นเมื่อใช้ COD)
  subItemTypes: z.array(
    z.object({
      itemName: z.string().default("สินค้า"),
      itemWeightSize: z.string().default("1kg"),
      itemColor: z.string().default("-"),
      itemQuantity: z.coerce.number().min(1).default(1)
    })
  ).optional()
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function FlashExpressApiTest() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<string[]>([]);
  const [recipientDistricts, setRecipientDistricts] = useState<string[]>([]);
  const [recipientSubdistricts, setRecipientSubdistricts] = useState<string[]>([]);
  const [calculatingRate, setCalculatingRate] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // ข้อมูลเขต และแขวง (mock data)
  const districtData: Record<string, Record<string, string[]>> = {
    'กรุงเทพมหานคร': {
      'เขตพระนคร': ['พระบรมมหาราชวัง', 'วังบูรพาภิรมย์', 'วัดราชบพิธ', 'สำราญราษฎร์', 'ศาลเจ้าพ่อเสือ'],
      'เขตดุสิต': ['ดุสิต', 'วชิรพยาบาล', 'สวนจิตรลดา', 'สี่แยกมหานาค', 'บางซื่อ'],
      'เขตหนองจอก': ['กระทุ่มราย', 'หนองจอก', 'คลองสิบ', 'คลองสิบสอง', 'โคกแฝด'],
      'เขตบางรัก': ['มหาพฤฒาราม', 'สีลม', 'สุริยวงศ์', 'บางรัก', 'สี่พระยา'],
      'เขตบางเขน': ['อนุสาวรีย์', 'ท่าแร้ง'],
      'เขตบางกะปิ': ['คลองจั่น', 'หัวหมาก'],
      'เขตปทุมวัน': ['รองเมือง', 'วังใหม่', 'ปทุมวัน', 'ลุมพินี'],
      'เขตป้อมปราบศัตรูพ่าย': ['วังบูรพาภิรมย์', 'วัดเทพศิรินทร์', 'คลองมหานาค', 'ป้อมปราบ'],
      'เขตพญาไท': ['สามเสนใน'],
      'เขตธนบุรี': ['วัดกัลยาณ์', 'หิรัญรูจี', 'บางยี่เรือ', 'บุคคโล', 'ตลาดพลู'],
      'เขตบางกอกใหญ่': ['วัดอรุณ', 'วัดท่าพระ'],
      'เขตห้วยขวาง': ['ห้วยขวาง', 'บางกะปิ', 'สามเสนนอก'],
      'เขตลาดพร้าว': ['จรเข้บัว', 'ลาดพร้าว'],
      'เขตบางนา': ['บางนา']
    },
    'พระนครศรีอยุธยา': {
      'บางปะอิน': ['บางปะอิน', 'บ้านแป้ง', 'บางกระสั้น', 'คลองจิก', 'เชียงรากน้อย', 'บ้านพลับ'],
      'พระนครศรีอยุธยา': ['ประตูชัย', 'เวียงสระ', 'กะมัง', 'สวนพริก', 'หอรัตนไชย', 'ไผ่ลิง']
    }
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      outTradeNo: `TEST${Date.now()}`,
      srcName: '',
      srcPhone: '',
      srcProvinceName: 'กรุงเทพมหานคร',
      srcCityName: '',
      srcDistrictName: '',
      srcPostalCode: '',
      srcDetailAddress: '',
      dstName: '',
      dstPhone: '',
      dstHomePhone: '',
      dstProvinceName: 'กรุงเทพมหานคร',
      dstCityName: '',
      dstDistrictName: '',
      dstPostalCode: '',
      dstDetailAddress: '',
      weight: 1,
      width: 10,
      length: 20,
      height: 10,
      articleCategory: "2",
      expressCategory: "1",
      insured: 0,
      insureDeclareValue: 0,
      opdInsureEnabled: 0,
      codEnabled: 0,
      codAmount: 0,
      remark: 'ทดสอบการส่งพัสดุ',
      subItemTypes: [
        { itemName: 'สินค้าทดสอบ', itemWeightSize: '1kg', itemColor: '-', itemQuantity: 1 }
      ]
    },
  });

  // ตรวจจับการเปลี่ยนแปลงค่าที่สำคัญ
  const senderProvince = form.watch('srcProvinceName');
  const senderDistrict = form.watch('srcCityName');
  const recipientProvince = form.watch('dstProvinceName');
  const recipientDistrict = form.watch('dstCityName');
  const codEnabled = form.watch('codEnabled');

  // ดึงข้อมูลผู้ใช้จาก API เมื่อโหลดหน้า
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user-profile', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // กำหนดค่าเริ่มต้นสำหรับผู้ส่ง
            form.setValue('srcName', data.user.fullname || '');
            form.setValue('srcPhone', data.user.phone || '');
            form.setValue('srcProvinceName', data.user.province || 'กรุงเทพมหานคร');
            form.setValue('srcCityName', data.user.district || '');
            form.setValue('srcDistrictName', data.user.subdistrict || '');
            form.setValue('srcPostalCode', data.user.zipcode || '');
            form.setValue('srcDetailAddress', data.user.address || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // ฟังก์ชันโหลดอำเภอเมื่อเลือกจังหวัด (สำหรับผู้ส่ง)
  useEffect(() => {
    if (senderProvince) {
      const availableDistricts = Object.keys(districtData[senderProvince] || {});
      setDistricts(availableDistricts);
      form.setValue('srcCityName', '');
      form.setValue('srcDistrictName', '');
      form.setValue('srcPostalCode', '');
    }
  }, [senderProvince, form]);

  // ฟังก์ชันโหลดตำบลเมื่อเลือกอำเภอ (สำหรับผู้ส่ง)
  useEffect(() => {
    if (senderProvince && senderDistrict) {
      const availableSubdistricts = districtData[senderProvince]?.[senderDistrict] || [];
      setSubdistricts(availableSubdistricts);
      form.setValue('srcDistrictName', '');

      // กำหนดรหัสไปรษณีย์ตามพื้นที่ (ตัวอย่าง)
      if (senderProvince === 'กรุงเทพมหานคร') {
        if (['เขตพระนคร', 'เขตป้อมปราบศัตรูพ่าย', 'เขตสัมพันธวงศ์'].includes(senderDistrict)) {
          form.setValue('srcPostalCode', '10200');
        } else if (['เขตดุสิต'].includes(senderDistrict)) {
          form.setValue('srcPostalCode', '10300');
        } else if (['เขตบางรัก', 'เขตสาทร', 'เขตปทุมวัน'].includes(senderDistrict)) {
          form.setValue('srcPostalCode', '10330');
        } else if (['เขตพญาไท', 'เขตดินแดง', 'เขตห้วยขวาง'].includes(senderDistrict)) {
          form.setValue('srcPostalCode', '10400');
        } else if (['เขตลาดพร้าว'].includes(senderDistrict)) {
          form.setValue('srcPostalCode', '10230');
        }
      } else if (senderProvince === 'พระนครศรีอยุธยา') {
        if (senderDistrict === 'บางปะอิน') {
          form.setValue('srcPostalCode', '13160');
        } else {
          form.setValue('srcPostalCode', '13000');
        }
      }
    }
  }, [senderProvince, senderDistrict, form]);

  // ฟังก์ชันโหลดอำเภอเมื่อเลือกจังหวัด (สำหรับผู้รับ)
  useEffect(() => {
    if (recipientProvince) {
      const availableDistricts = Object.keys(districtData[recipientProvince] || {});
      setRecipientDistricts(availableDistricts);
      form.setValue('dstCityName', '');
      form.setValue('dstDistrictName', '');
      form.setValue('dstPostalCode', '');
    }
  }, [recipientProvince, form]);

  // ฟังก์ชันโหลดตำบลเมื่อเลือกอำเภอ (สำหรับผู้รับ)
  useEffect(() => {
    if (recipientProvince && recipientDistrict) {
      const availableSubdistricts = districtData[recipientProvince]?.[recipientDistrict] || [];
      setRecipientSubdistricts(availableSubdistricts);
      form.setValue('dstDistrictName', '');

      // กำหนดรหัสไปรษณีย์ตามพื้นที่ (ตัวอย่าง)
      if (recipientProvince === 'กรุงเทพมหานคร') {
        if (['เขตพระนคร', 'เขตป้อมปราบศัตรูพ่าย', 'เขตสัมพันธวงศ์'].includes(recipientDistrict)) {
          form.setValue('dstPostalCode', '10200');
        } else if (['เขตดุสิต'].includes(recipientDistrict)) {
          form.setValue('dstPostalCode', '10300');
        } else if (['เขตบางรัก', 'เขตสาทร', 'เขตปทุมวัน'].includes(recipientDistrict)) {
          form.setValue('dstPostalCode', '10330');
        } else if (['เขตพญาไท', 'เขตดินแดง', 'เขตห้วยขวาง'].includes(recipientDistrict)) {
          form.setValue('dstPostalCode', '10400');
        } else if (['เขตลาดพร้าว'].includes(recipientDistrict)) {
          form.setValue('dstPostalCode', '10230');
        }
      } else if (recipientProvince === 'พระนครศรีอยุธยา') {
        if (recipientDistrict === 'บางปะอิน') {
          form.setValue('dstPostalCode', '13160');
        } else {
          form.setValue('dstPostalCode', '13000');
        }
      }
    }
  }, [recipientProvince, recipientDistrict, form]);

  // ส่งคำขอสร้างเลขพัสดุ
  const handleCreateShipping = async () => {
    try {
      setIsLoading(true);
      
      // ดึงข้อมูลจากฟอร์ม
      const values = form.getValues();
      
      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const requestData = {
        orderData: {
          ...values,
          // แปลงข้อมูลตามที่ Flash Express API ต้องการ
          // ปรับค่าน้ำหนักเป็นกรัม
          weight: String(Math.round(values.weight * 1000)),
          // ปรับขนาดเป็น String
          width: String(values.width || 10),
          length: String(values.length || 10),
          height: String(values.height || 10),
          // ค่าตัวเลขอื่นๆเป็น String
          insured: String(values.insured),
          codEnabled: String(values.codEnabled),
          articleCategory: values.articleCategory,
          expressCategory: values.expressCategory,
          
          // เพิ่มข้อมูลที่จำเป็นสำหรับ Flash Express API
          parcelKind: "1", // ประเภทพัสดุ (1=ทั่วไป)
          expressTypeId: "1", // ประเภทการจัดส่ง (1=ส่งด่วน)
          productType: "1", // ประเภทสินค้า (1=ทั่วไป)
          payType: "1", // วิธีการชำระเงิน (1=ผู้ส่งจ่าย)
          transportType: "1", // ประเภทการขนส่ง (1=ปกติ)
          pricingType: "1",
          pricingTable: "1",
          opdInsureEnabled: String(values.opdInsureEnabled || 0),
          
          // ถ้า COD เปิดใช้งาน ให้แปลงค่าเป็นสตางค์ 
          codAmount: values.codEnabled ? String(Math.round(values.codAmount * 100)) : "0",
          insuredAmount: values.insured ? String(Math.round(values.insureDeclareValue || 2000) * 100) : "0",
        }
      };

      console.log('กำลังเรียก API เพื่อสร้างการจัดส่ง:', requestData);
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/shipping-methods/flash-express/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('ข้อมูลการจัดส่งที่ได้รับ:', data);
      setOrderResult(data);

      if (data.success) {
        toast({
          title: 'สร้างเลขพัสดุสำเร็จ',
          description: `เลขพัสดุของคุณคือ ${data.trackingNumber}`,
        });
      } else {
        toast({
          title: 'ไม่สามารถสร้างเลขพัสดุได้',
          description: data.message || 'กรุณาตรวจสอบข้อมูลและลองอีกครั้ง',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('API Request Error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างเลขพัสดุได้ กรุณาลองอีกครั้งในภายหลัง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">ทดสอบสร้างเลขพัสดุ Flash Express API</h1>
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
            >
              กลับไปหน้าแดชบอร์ด
            </Button>
          </div>

          <Tabs defaultValue="create-order" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="create-order">สร้างเลขพัสดุ</TabsTrigger>
              <TabsTrigger value="result" disabled={!orderResult}>ผลลัพธ์</TabsTrigger>
            </TabsList>

            <TabsContent value="create-order">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>สร้างเลขพัสดุกับ Flash Express</CardTitle>
                  <CardDescription>
                    กรอกข้อมูลให้ครบถ้วนเพื่อสร้างเลขพัสดุกับ Flash Express
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form className="space-y-6">
                      {/* ข้อมูลพื้นฐาน */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">ข้อมูลพื้นฐาน</h3>
                        <Separator />

                        <FormField
                          control={form.control}
                          name="outTradeNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>เลขออเดอร์ (Order Number)</FormLabel>
                              <FormControl>
                                <Input placeholder="เลขออเดอร์" {...field} />
                              </FormControl>
                              <FormDescription>
                                เลขออเดอร์จะถูกสร้างอัตโนมัติ แต่คุณสามารถกำหนดเองได้
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* ข้อมูลผู้ส่ง */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">ข้อมูลผู้ส่ง</h3>
                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="srcName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ชื่อผู้ส่ง</FormLabel>
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
                                <FormLabel>เบอร์โทรศัพท์ผู้ส่ง</FormLabel>
                                <FormControl>
                                  <Input placeholder="เบอร์โทรศัพท์" {...field} />
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
                              <FormLabel>ที่อยู่</FormLabel>
                              <FormControl>
                                <Input placeholder="บ้านเลขที่ หมู่บ้าน ถนน ซอย" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="srcProvinceName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>จังหวัด</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกจังหวัด" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {provinceList.map((province) => (
                                      <SelectItem key={province} value={province}>
                                        {province}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="srcCityName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>อำเภอ/เขต</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!senderProvince}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกอำเภอ/เขต" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {districts.map((district) => (
                                      <SelectItem key={district} value={district}>
                                        {district}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="srcDistrictName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ตำบล/แขวง</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!senderDistrict}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกตำบล/แขวง" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {subdistricts.map((subdistrict) => (
                                      <SelectItem key={subdistrict} value={subdistrict}>
                                        {subdistrict}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="srcPostalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>รหัสไปรษณีย์</FormLabel>
                                <FormControl>
                                  <Input placeholder="รหัสไปรษณีย์" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* ข้อมูลผู้รับ */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">ข้อมูลผู้รับ</h3>
                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="dstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ชื่อผู้รับ</FormLabel>
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
                                <FormLabel>เบอร์โทรศัพท์ผู้รับ</FormLabel>
                                <FormControl>
                                  <Input placeholder="เบอร์โทรศัพท์" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="dstDetailAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ที่อยู่</FormLabel>
                              <FormControl>
                                <Input placeholder="บ้านเลขที่ หมู่บ้าน ถนน ซอย" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="dstProvinceName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>จังหวัด</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกจังหวัด" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {provinceList.map((province) => (
                                      <SelectItem key={province} value={province}>
                                        {province}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dstCityName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>อำเภอ/เขต</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!recipientProvince}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกอำเภอ/เขต" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {recipientDistricts.map((district) => (
                                      <SelectItem key={district} value={district}>
                                        {district}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dstDistrictName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ตำบล/แขวง</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!recipientDistrict}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกตำบล/แขวง" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {recipientSubdistricts.map((subdistrict) => (
                                      <SelectItem key={subdistrict} value={subdistrict}>
                                        {subdistrict}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dstPostalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>รหัสไปรษณีย์</FormLabel>
                                <FormControl>
                                  <Input placeholder="รหัสไปรษณีย์" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* ข้อมูลพัสดุ */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">ข้อมูลพัสดุ</h3>
                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="expressCategory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ประเภทการจัดส่ง</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกประเภทการจัดส่ง" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {expressCategories.map((category) => (
                                      <SelectItem key={category.value} value={category.value}>
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="articleCategory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ประเภทสินค้า</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="เลือกประเภทสินค้า" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {articleCategories.map((category) => (
                                      <SelectItem key={category.value} value={category.value}>
                                        {category.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>น้ำหนัก (กก.)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" min="0.1" max="30" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="width"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ความกว้าง (ซม.)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="1" min="1" max="100" {...field} />
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
                                  <Input type="number" step="1" min="1" max="100" {...field} />
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
                                  <Input type="number" step="1" min="1" max="100" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="remark"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>หมายเหตุ</FormLabel>
                              <FormControl>
                                <Textarea placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* บริการเสริม */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">บริการเสริม</h3>
                        <Separator />

                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="insured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">ประกันพัสดุ (Flash care)</FormLabel>
                                  <FormDescription>
                                    บริการประกันพัสดุมูลค่า 2,000 บาท (คิดค่าบริการเพิ่ม 20 บาท)
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value === 1}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked ? 1 : 0);
                                      if (checked && !form.getValues('insureDeclareValue')) {
                                        form.setValue('insureDeclareValue', 2000);
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {form.watch('insured') === 1 && (
                            <FormField
                              control={form.control}
                              name="insureDeclareValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>มูลค่าสินค้าที่ประกัน (บาท)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      placeholder="มูลค่าสินค้า"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    1 บาท = 100 สตางค์ (ระบบจะแปลงให้อัตโนมัติ)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name="codEnabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">เก็บเงินปลายทาง (COD)</FormLabel>
                                  <FormDescription>
                                    บริการเก็บเงินปลายทาง (คิดค่าบริการเพิ่ม 3% ของยอดเงิน ขั้นต่ำ 10 บาท)
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value === 1}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked ? 1 : 0);
                                      if (!checked) {
                                        form.setValue('codAmount', 0);
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {codEnabled === 1 && (
                            <FormField
                              control={form.control}
                              name="codAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ยอดเงินที่ต้องการเก็บปลายทาง (บาท)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      placeholder="จำนวนเงิน"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    1 บาท = 100 สตางค์ (ระบบจะแปลงให้อัตโนมัติ)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        disabled={isLoading}
                        onClick={handleCreateShipping}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        สร้างเลขพัสดุ
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
                  <p>
                    * บริการนี้ใช้สำหรับการสร้างเลขพัสดุกับ Flash Express เท่านั้น
                  </p>
                  <p>
                    * เมื่อสร้างเลขพัสดุแล้ว ระบบจะหักค่าบริการจากเครดิตของท่านทันที
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="result">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>ผลลัพธ์การสร้างเลขพัสดุ</CardTitle>
                  <CardDescription>
                    ผลการสร้างเลขพัสดุกับ Flash Express
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orderResult && (
                    <div className="space-y-4">
                      {orderResult.success ? (
                        <>
                          <div className="p-4 bg-green-50 rounded-md border border-green-200">
                            <h3 className="text-lg font-semibold text-green-700">สร้างเลขพัสดุสำเร็จ</h3>
                            <div className="mt-2 space-y-2">
                              <p><span className="font-medium">เลขพัสดุ:</span> {orderResult.trackingNumber}</p>
                              <p><span className="font-medium">Sort Code:</span> {orderResult.sortCode}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setLocation(`/flash-express-label/${orderResult.trackingNumber}`)}
                            >
                              พิมพ์ใบปะหน้าพัสดุ
                            </Button>
                            
                            <Button onClick={() => {
                              form.reset();
                              setOrderResult(null);
                            }}>
                              สร้างเลขพัสดุใหม่
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-red-50 rounded-md border border-red-200">
                          <h3 className="text-lg font-semibold text-red-700">ไม่สามารถสร้างเลขพัสดุได้</h3>
                          <p className="mt-2 text-red-600">{orderResult.message}</p>
                          
                          {orderResult.errorDetails && (
                            <div className="mt-4">
                              <h4 className="font-medium">รายละเอียดข้อผิดพลาด:</h4>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                                {typeof orderResult.errorDetails === 'string' 
                                  ? orderResult.errorDetails 
                                  : JSON.stringify(orderResult.errorDetails, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          <Button 
                            className="mt-4" 
                            variant="outline"
                            onClick={() => setOrderResult(null)}
                          >
                            กลับไปแก้ไขข้อมูล
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
