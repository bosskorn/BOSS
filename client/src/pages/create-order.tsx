import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import api, { apiRequest } from '@/services/api';
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
import { 
  Truck, 
  PackageCheck, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Plus, 
  Trash, 
  AlertCircle,
  CreditCard,
  Banknote
} from 'lucide-react';

// Schema สำหรับแยกที่อยู่
interface AddressComponents {
  houseNumber?: string;
  village?: string;
  soi?: string;
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  zipcode?: string;
  building?: string;
  floor?: string;
  roomNumber?: string;
  storeName?: string;
}

// สคีมาสำหรับฟอร์มสร้างออเดอร์
const createOrderSchema = z.object({
  // ข้อมูลลูกค้า
  customerName: z.string().min(1, { message: 'กรุณากรอกชื่อลูกค้า' }),
  customerPhone: z.string().min(1, { message: 'กรุณากรอกเบอร์โทรลูกค้า' }),
  customerEmail: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }).optional().or(z.literal('')),
  
  // ข้อมูลที่อยู่
  fullAddress: z.string().min(1, { message: 'กรุณากรอกที่อยู่จัดส่ง' }),
  houseNumber: z.string().optional(),
  village: z.string().optional(),
  soi: z.string().optional(),
  road: z.string().optional(),
  subdistrict: z.string().min(1, { message: 'กรุณากรอกตำบล/แขวง' }),
  district: z.string().min(1, { message: 'กรุณากรอกอำเภอ/เขต' }),
  province: z.string().min(1, { message: 'กรุณากรอกจังหวัด' }),
  zipcode: z.string().min(5, { message: 'รหัสไปรษณีย์ไม่ถูกต้อง' }),
  building: z.string().optional(),
  floor: z.string().optional(),
  roomNumber: z.string().optional(),
  storeName: z.string().optional(),
  
  // สินค้า
  items: z.array(
    z.object({
      productId: z.number().optional(),
      name: z.string().min(1, { message: 'กรุณากรอกชื่อสินค้า' }),
      quantity: z.number().min(1, { message: 'จำนวนต้องมากกว่า 0' }),
      price: z.number().min(0, { message: 'ราคาต้องไม่ติดลบ' }),
    })
  ).min(1, { message: 'ต้องมีสินค้าอย่างน้อย 1 รายการ' }),
  
  // ขนส่ง
  shippingMethod: z.string().min(1, { message: 'กรุณาเลือกวิธีการจัดส่ง' }),
  shippingCost: z.number().min(0, { message: 'ค่าจัดส่งต้องไม่ติดลบ' }),
  codAmount: z.number().min(0, { message: 'จำนวนเงินต้องไม่ติดลบ' }).optional(),
  isCOD: z.boolean().default(false),
  
  // หมายเหตุ
  note: z.string().optional(),
  
  // ราคารวม
  total: z.number().min(0, { message: 'ราคารวมต้องไม่ติดลบ' }),
});

type CreateOrderFormValues = z.infer<typeof createOrderSchema>;

const CreateOrderPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [addressFormatted, setAddressFormatted] = useState<AddressComponents>({});
  const [fullAddressOriginal, setFullAddressOriginal] = useState('');
  const [processingAddress, setProcessingAddress] = useState(false);
  
  // แบ่งส่วนของโค้ดเพื่อความชัดเจน
  // 1. การจัดการฟอร์มด้วย react-hook-form
  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      fullAddress: '',
      houseNumber: '',
      village: '',
      soi: '',
      road: '',
      subdistrict: '',
      district: '',
      province: '',
      zipcode: '',
      building: '',
      floor: '',
      roomNumber: '',
      storeName: '',
      items: [
        {
          productId: undefined,
          name: '',
          quantity: 1,
          price: 0
        }
      ],
      shippingMethod: '',
      shippingCost: 0,
      codAmount: 0,
      isCOD: false,
      note: '',
      total: 0
    }
  });
  
  // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือยัง
  if (!user) {
    // ให้แสดงข้อความแนะนำ
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
  
  // ดึงข้อมูลสินค้าเมื่อโหลดหน้า
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/api/products');
        if (response.data.success) {
          setProducts(response.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);
  
  // คำนวณราคารวมเมื่อรายการสินค้าหรือค่าจัดส่งเปลี่ยนแปลง
  useEffect(() => {
    const items = form.getValues('items');
    const shippingCost = form.getValues('shippingCost') || 0;
    
    // คำนวณราคาสินค้าทั้งหมด
    const itemsTotal = items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 0);
    }, 0);
    
    // คำนวณราคารวมทั้งหมด
    const total = itemsTotal + shippingCost;
    
    form.setValue('total', total);
  }, [form.watch('items'), form.watch('shippingCost')]);
  
  // ดึงตัวเลือกการจัดส่งเมื่อกรอกข้อมูลที่อยู่ครบถ้วน
  useEffect(() => {
    const zipcode = form.watch('zipcode');
    const province = form.watch('province');
    const district = form.watch('district');
    const subdistrict = form.watch('subdistrict');
    
    if (zipcode && province && district && subdistrict) {
      fetchShippingOptions();
    }
  }, [form.watch('zipcode'), form.watch('province'), form.watch('district'), form.watch('subdistrict')]);
  
  // เมื่อเลือก COD ให้เปลี่ยนค่า codAmount เป็นค่า total
  useEffect(() => {
    const isCOD = form.watch('isCOD');
    const total = form.watch('total');
    
    if (isCOD) {
      form.setValue('codAmount', total);
    } else {
      form.setValue('codAmount', 0);
    }
  }, [form.watch('isCOD'), form.watch('total')]);
  
  // ฟังก์ชันดึงตัวเลือกการจัดส่ง (จำลอง)
  const fetchShippingOptions = async () => {
    try {
      // จำลองการเรียก API ของ Flash Express
      // ในกรณีจริงจะต้องส่งข้อมูลที่อยู่ไปยัง API ของ Flash Express
      
      // ข้อมูลตัวอย่าง (ในโปรเจ็คจริงควรดึงจาก API)
      const mockOptions = [
        {
          id: 1,
          name: 'Flash Express - ส่งด่วน',
          price: 60,
          deliveryTime: '1-2 วัน',
          provider: 'Flash Express',
          serviceId: 'FLASH-FAST',
          logo: '/images/flash-express.png'
        },
        {
          id: 2,
          name: 'Flash Express - ส่งธรรมดา',
          price: 40,
          deliveryTime: '2-3 วัน',
          provider: 'Flash Express',
          serviceId: 'FLASH-NORMAL',
          logo: '/images/flash-express.png'
        },
        {
          id: 3,
          name: 'ไปรษณีย์ไทย - EMS',
          price: 50,
          deliveryTime: '1-3 วัน',
          provider: 'Thailand Post',
          serviceId: 'TP-EMS',
          logo: '/images/thailand-post.png'
        },
        {
          id: 4,
          name: 'ไปรษณีย์ไทย - ลงทะเบียน',
          price: 30,
          deliveryTime: '3-5 วัน',
          provider: 'Thailand Post',
          serviceId: 'TP-REG',
          logo: '/images/thailand-post.png'
        }
      ];
      
      setShippingOptions(mockOptions);
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลตัวเลือกการจัดส่งได้',
        variant: 'destructive',
      });
    }
  };
  
  // 2. ฟังก์ชันวิเคราะห์ที่อยู่อัตโนมัติโดยใช้ Longdo Map API
  const analyzeAddress = async () => {
    const fullAddress = form.getValues('fullAddress');
    
    if (!fullAddress) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกที่อยู่ก่อนวิเคราะห์',
        variant: 'destructive',
      });
      return;
    }
    
    setProcessingAddress(true);
    setFullAddressOriginal(fullAddress);
    
    try {
      // เรียกใช้ API วิเคราะห์ที่อยู่ของ Longdo Map
      const response = await apiRequest(
        'POST',
        '/api/shipping/analyze-address',
        { fullAddress }
      );
      
      if (!response.ok) {
        throw new Error('API วิเคราะห์ที่อยู่ล้มเหลว');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.address) {
        throw new Error('ไม่พบข้อมูลที่อยู่');
      }
      
      // ตรวจสอบว่ามีข้อมูลที่อยู่ครบถ้วนหรือไม่
      const addressComponents: AddressComponents = data.address;
      
      // เพื่อให้แน่ใจว่าไม่มีการกำหนดค่า undefined ให้กับฟอร์ม
      const validatedComponents: AddressComponents = {
        houseNumber: addressComponents.houseNumber || '',
        village: addressComponents.village || '',
        soi: addressComponents.soi || '',
        road: addressComponents.road || '',
        subdistrict: addressComponents.subdistrict || '',
        district: addressComponents.district || '',
        province: addressComponents.province || '',
        zipcode: addressComponents.zipcode || '',
      };
      
      // อัพเดทแบบฟอร์ม
      Object.entries(validatedComponents).forEach(([key, value]) => {
        if (value) {
          form.setValue(key as keyof CreateOrderFormValues, value);
        }
      });
      
      setAddressFormatted(validatedComponents);
      
      toast({
        title: 'วิเคราะห์ที่อยู่สำเร็จ',
        description: 'กรุณาตรวจสอบและแก้ไขข้อมูลที่อยู่ให้ถูกต้อง',
      });
    } catch (error) {
      console.error('Error analyzing address:', error);
      toast({
        title: 'วิเคราะห์ที่อยู่ไม่สำเร็จ',
        description: 'กรุณากรอกข้อมูลที่อยู่ด้วยตนเอง',
        variant: 'destructive',
      });
    } finally {
      setProcessingAddress(false);
    }
  };
  
  // 3. ฟังก์ชันเพิ่ม/ลบรายการสินค้า
  const addItem = () => {
    const currentItems = form.getValues('items');
    form.setValue('items', [
      ...currentItems,
      {
        productId: undefined,
        name: '',
        quantity: 1,
        price: 0
      }
    ]);
  };
  
  const removeItem = (index: number) => {
    const currentItems = form.getValues('items');
    if (currentItems.length > 1) {
      form.setValue('items', currentItems.filter((_, i) => i !== index));
    } else {
      toast({
        title: 'ไม่สามารถลบรายการสินค้าได้',
        description: 'ต้องมีสินค้าอย่างน้อย 1 รายการ',
        variant: 'destructive',
      });
    }
  };
  
  const handleProductSelect = (index: number, productId: number) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const currentItems = form.getValues('items');
      currentItems[index] = {
        ...currentItems[index],
        productId,
        name: selectedProduct.name,
        price: selectedProduct.price
      };
      form.setValue('items', currentItems);
    }
  };
  
  // 4. ฟังก์ชันเมื่อเลือกตัวเลือกการจัดส่ง
  const handleShippingMethodSelect = (shippingId: string) => {
    const option = shippingOptions.find(o => o.id.toString() === shippingId);
    if (option) {
      form.setValue('shippingMethod', option.name);
      form.setValue('shippingCost', option.price);
    }
  };
  
  // 5. ฟังก์ชันวิเคราะห์ที่อยู่จากข้อมูลลูกค้า
  const handleFullCustomerDataPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    // ป้องกันการทำงานปกติของ paste
    e.preventDefault();
    
    // ใส่ข้อมูลที่ paste ลงใน textarea
    form.setValue('fullAddress', pastedText);
    
    // วิเคราะห์ที่อยู่อัตโนมัติ และข้อมูลลูกค้า
    processCustomerData(pastedText);
  };
  
  const processCustomerData = (data: string) => {
    try {
      // แยกบรรทัด
      const lines = data.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return;
      }
      
      // สมมติว่าบรรทัดแรกคือชื่อลูกค้า (อาจมีเบอร์โทรด้วย)
      const firstLine = lines[0];
      
      // ตรวจสอบเบอร์โทร
      const phoneRegex = /(\d{9,10})/g;
      const phoneMatch = data.match(phoneRegex);
      const phone = phoneMatch ? phoneMatch[0] : '';
      
      // ดึงชื่อลูกค้า (ถ้ามีเบอร์โทรในบรรทัดแรก ให้ตัดออก)
      let name = firstLine;
      if (phone && firstLine.includes(phone)) {
        name = firstLine.replace(phone, '').trim();
      }
      
      // ตรวจสอบอีเมล
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emailMatch = data.match(emailRegex);
      const email = emailMatch ? emailMatch[0] : '';
      
      // ที่อยู่คือทุกบรรทัดยกเว้นบรรทัดแรก (ถ้ามี)
      const address = lines.slice(1).join(' ');
      
      // อัพเดทฟอร์ม
      if (name) form.setValue('customerName', name);
      if (phone) form.setValue('customerPhone', phone);
      if (email) form.setValue('customerEmail', email);
      if (address) form.setValue('fullAddress', address);
      
      // วิเคราะห์ที่อยู่ต่อ
      if (address) {
        analyzeAddress();
      }
      
      toast({
        title: 'นำเข้าข้อมูลลูกค้าสำเร็จ',
        description: 'กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้อง',
      });
    } catch (error) {
      console.error('Error processing customer data:', error);
      toast({
        title: 'นำเข้าข้อมูลลูกค้าไม่สำเร็จ',
        description: 'กรุณากรอกข้อมูลด้วยตนเอง',
        variant: 'destructive',
      });
    }
  };
  
  // 6. ฟังก์ชันส่งฟอร์ม
  const onSubmit = async (data: CreateOrderFormValues) => {
    setIsLoading(true);
    
    try {
      // จำลองการส่งข้อมูลไปยัง API
      console.log('Order data:', data);
      
      // ถ้าเป็น COD และมีการเลือกขนส่ง Flash Express
      if (data.isCOD && data.shippingMethod.includes('Flash Express')) {
        // จำลองการเรียก API Flash Express
        const flashExpressResponse = await simulateFlashExpressAPI(data);
        console.log('Flash Express response:', flashExpressResponse);
      }
      
      // แสดงข้อความสำเร็จ
      toast({
        title: 'สร้างออเดอร์สำเร็จ',
        description: 'ออเดอร์ถูกสร้างเรียบร้อยแล้ว',
      });
      
      // รีเซ็ตฟอร์ม
      form.reset();
      
      // นำทางไปยังหน้ารายการออเดอร์
      setLocation('/orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'สร้างออเดอร์ไม่สำเร็จ',
        description: error.message || 'ไม่สามารถสร้างออเดอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // จำลองการเรียก API Flash Express
  const simulateFlashExpressAPI = async (data: CreateOrderFormValues) => {
    // จำลองการเรียก API Flash Express
    // ในกรณีจริงจะต้องส่งข้อมูลไปยัง API ของ Flash Express
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          tracking_number: 'FLE' + Math.floor(Math.random() * 10000000),
          label_url: 'https://example.com/label.pdf',
        });
      }, 1000);
    });
  };
  
  // 7. ฟังก์ชันแสดงผลสรุปราคา
  const renderOrderSummary = () => {
    const items = form.watch('items');
    const shippingCost = form.watch('shippingCost');
    const isCOD = form.watch('isCOD');
    const total = form.watch('total');
    
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 0);
    }, 0);
    
    return (
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-xl">สรุปรายการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>ราคาสินค้ารวม:</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ค่าจัดส่ง:</span>
            <span>฿{shippingCost?.toLocaleString() || 0}</span>
          </div>
          {isCOD && (
            <div className="flex justify-between text-orange-600">
              <span>เก็บเงินปลายทาง (COD):</span>
              <span>฿{total.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>ราคารวมทั้งสิ้น:</span>
            <span>฿{total.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit bg-gradient-to-br from-white to-purple-50 rounded-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">สร้างออเดอร์ใหม่</h1>
          <p className="text-gray-600 text-lg mt-2">สร้างออเดอร์และจัดส่งสินค้าถึงลูกค้าของคุณอย่างรวดเร็ว</p>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-500 mt-4 rounded-full"></div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* ข้อมูลลูกค้า */}
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">ข้อมูลลูกค้า</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อลูกค้า</FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อ-นามสกุล" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เบอร์โทรศัพท์</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Phone className="w-4 h-4 mr-2 text-gray-400 self-center" />
                                <Input placeholder="0812345678" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>อีเมล (ถ้ามี)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Mail className="w-4 h-4 mr-2 text-gray-400 self-center" />
                              <Input placeholder="example@email.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* ข้อมูลที่อยู่ */}
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-purple-800">ที่อยู่จัดส่ง</CardTitle>
                        <CardDescription className="text-purple-600/70">
                          วางข้อมูลลูกค้าทั้งหมด (Copy & Paste) เพื่อแยกข้อมูลอัตโนมัติ
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ที่อยู่เต็ม</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="วางข้อความที่มีข้อมูลลูกค้าและที่อยู่ทั้งหมดที่นี่..." 
                              rows={4} 
                              onPaste={handleFullCustomerDataPaste}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              onClick={analyzeAddress}
                              disabled={!field.value || processingAddress}
                              className="mt-2"
                            >
                              {processingAddress ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ที่อยู่อัตโนมัติ'}
                            </Button>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="houseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>บ้านเลขที่</FormLabel>
                            <FormControl>
                              <Input placeholder="บ้านเลขที่" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="village"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>หมู่บ้าน/อาคาร (ถ้ามี)</FormLabel>
                            <FormControl>
                              <Input placeholder="ชื่อหมู่บ้านหรืออาคาร" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="soi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ซอย (ถ้ามี)</FormLabel>
                            <FormControl>
                              <Input placeholder="ซอย" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="road"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ถนน (ถ้ามี)</FormLabel>
                            <FormControl>
                              <Input placeholder="ถนน" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subdistrict"
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
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>อำเภอ/เขต</FormLabel>
                            <FormControl>
                              <Input placeholder="อำเภอ/เขต" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จังหวัด</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกจังหวัด" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[
                                  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", 
                                  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", 
                                  "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", 
                                  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", 
                                  "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", 
                                  "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", 
                                  "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", 
                                  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", 
                                  "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", 
                                  "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
                                  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", 
                                  "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", 
                                  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", 
                                  "อุทัยธานี", "อุบลราชธานี"
                                ].map((province) => (
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
                        name="zipcode"
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
                  </CardContent>
                </Card>
                
                {/* สินค้า */}
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <Package className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">รายการสินค้า</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {form.watch('items').map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-purple-50 to-white p-6 rounded-lg border border-purple-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">สินค้ารายการที่ {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="md:col-span-2">
                            <FormLabel>สินค้า</FormLabel>
                            <Select
                              onValueChange={(value) => handleProductSelect(index, parseInt(value))}
                              value={item.productId?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกสินค้า" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map(p => (
                                  <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name} - ฿{p.price}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`items.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ชื่อสินค้า</FormLabel>
                                <FormControl>
                                  <Input placeholder="ชื่อสินค้า" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ราคา</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseFloat(e.target.value) || 0);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>จำนวน</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseInt(e.target.value) || 1);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มสินค้า
                    </Button>
                  </CardContent>
                </Card>
                
                {/* การจัดส่ง */}
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                        <Truck className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-purple-800">การจัดส่ง</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* ตัวเลือกการจัดส่ง */}
                    {shippingOptions.length > 0 ? (
                      <div className="space-y-4">
                        <FormLabel>เลือกวิธีการจัดส่ง</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {shippingOptions.map((option) => (
                            <div
                              key={option.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                form.watch('shippingMethod') === option.name
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                              onClick={() => handleShippingMethodSelect(option.id.toString())}
                            >
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <div className="font-medium">{option.name}</div>
                                  <div className="text-sm text-gray-500">
                                    จัดส่งภายใน {option.deliveryTime}
                                  </div>
                                </div>
                                <div className="text-lg font-semibold">
                                  ฿{option.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">รอข้อมูลที่อยู่</p>
                          <p className="text-sm text-gray-600">
                            กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วนเพื่อดูตัวเลือกการจัดส่ง
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <FormField
                        control={form.control}
                        name="isCOD"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center">
                                <Banknote className="w-4 h-4 mr-2 text-orange-600" />
                                เก็บเงินปลายทาง (COD)
                              </FormLabel>
                              <FormDescription>
                                ลูกค้าชำระเงินเมื่อได้รับสินค้า
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {form.watch('isCOD') && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start">
                        <CreditCard className="w-5 h-5 text-orange-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">การเก็บเงินปลายทาง (COD)</p>
                          <p className="text-sm text-gray-600">
                            จำนวนเงินที่เก็บปลายทาง: ฿{form.watch('total').toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>หมายเหตุ (ถ้ามี)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="ระบุข้อความหรือหมายเหตุเพิ่มเติม เช่น คำแนะนำในการจัดส่ง"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* สรุปรายการและปุ่มสั่งซื้อ */}
              <div className="space-y-6">
                {renderOrderSummary()}
                
                <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                  <CardContent className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 transition-all duration-300 transform hover:scale-[1.02] font-medium text-lg py-6"
                      disabled={isLoading}
                    >
                      <PackageCheck className="w-5 h-5 mr-2" />
                      {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการสร้างออเดอร์'}
                    </Button>
                    <p className="text-center text-gray-500 text-sm mt-4">
                      คลิกที่ปุ่มด้านบนเพื่อส่งคำสั่งซื้อและเริ่มกระบวนการจัดส่ง
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default CreateOrderPage;