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
import { Label } from '@/components/ui/label';
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
  Banknote,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ShoppingBag
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

const CreateOrderTabsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [addressFormatted, setAddressFormatted] = useState<AddressComponents>({});
  const [fullAddressOriginal, setFullAddressOriginal] = useState('');
  const [processingAddress, setProcessingAddress] = useState(false);
  const [loadingZipcodeData, setLoadingZipcodeData] = useState(false);
  const [activeTab, setActiveTab] = useState("customer"); // สถานะสำหรับแสดงขั้นตอนปัจจุบัน
  
  // สถานะสำหรับเก็บข้อมูลจังหวัด อำเภอ และตำบล
  const [provinces, setProvinces] = useState<{id: string, name_th: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name_th: string}[]>([]);
  const [subdistricts, setSubdistricts] = useState<{id: string, name_th: string, zip_code: string}[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  
  // คำนวณราคารวมสินค้า (subTotal) สำหรับแสดงผลในหน้า
  const [subTotal, setSubTotal] = useState(0);
  
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
    
    // ดึงข้อมูลจังหวัด
    fetchProvinces();
  }, []);
  
  // คำนวณราคารวมเมื่อรายการสินค้าหรือค่าจัดส่งเปลี่ยนแปลง
  useEffect(() => {
    const items = form.getValues('items');
    const shippingCost = form.getValues('shippingCost') || 0;
    
    // คำนวณราคาสินค้าทั้งหมด
    const itemsTotal = items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 0);
    }, 0);
    
    // บันทึกค่า subTotal สำหรับแสดงผล
    setSubTotal(itemsTotal);
    
    // คำนวณราคารวมทั้งหมด
    const total = itemsTotal + shippingCost;
    
    form.setValue('total', total);
  }, [form.watch('items'), form.watch('shippingCost')]);
  
  // ฟังก์ชันดึงข้อมูลจังหวัด
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await apiRequest('GET', '/api/locations/provinces');
      const data = await response.json();
      if (data.success && data.provinces) {
        setProvinces(data.provinces);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลจังหวัดได้',
        variant: 'destructive',
      });
    } finally {
      setLoadingProvinces(false);
    }
  };
  
  // ฟังก์ชันวิเคราะห์ที่อยู่อัตโนมัติแบบไม่ใช้ API ภายนอก
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
      // วิเคราะห์ที่อยู่ด้วยการแยกประเภทข้อมูลด้วยตนเอง
      const addressComponents = parseAddressFromText(fullAddress);
      
      // ถ้าไม่มีส่วนประกอบที่อยู่เลย แสดงว่าวิเคราะห์ไม่สำเร็จ
      if (Object.keys(addressComponents).length === 0) {
        throw new Error('ไม่สามารถวิเคราะห์ที่อยู่ได้');
      }
      
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
  
  // ฟังก์ชันช่วยแยกประเภทข้อมูลที่อยู่จากข้อความ
  const parseAddressFromText = (text: string): AddressComponents => {
    const components: AddressComponents = {};
    
    // แยกตามบรรทัด
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const addressText = lines.join(' ');
    
    // ดึงรหัสไปรษณีย์ (เป็นตัวเลข 5 หลักที่มักจะอยู่ท้ายที่อยู่)
    const zipRegex = /\b(\d{5})\b/;
    const zipMatch = addressText.match(zipRegex);
    if (zipMatch) {
      components.zipcode = zipMatch[1];
    }
    
    // ดึงเลขที่บ้าน/อาคาร (ตัวเลข/ตัวเลข หรือตัวเลขอย่างเดียว ที่อยู่ต้นประโยค)
    const houseNumberRegex = /(?:^|\s)([0-9\/\-]+)(?:\s|$)/;
    const houseNumberMatch = addressText.match(houseNumberRegex);
    if (houseNumberMatch) {
      components.houseNumber = houseNumberMatch[1];
    }
    
    // ดึงชื่อหมู่บ้าน/อาคาร หรือ หมู่ที่
    const villageRegex = /(?:หมู่บ้าน|หมู่|ม\.|อาคาร|คอนโด)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const villageMatch = addressText.match(villageRegex);
    if (villageMatch) {
      components.village = villageMatch[0].trim();
    }
    
    // ดึงข้อมูลซอย
    const soiRegex = /(?:ซอย|ซ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const soiMatch = addressText.match(soiRegex);
    if (soiMatch) {
      components.soi = soiMatch[0].trim();
    }
    
    // ดึงข้อมูลถนน
    const roadRegex = /(?:ถนน|ถ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const roadMatch = addressText.match(roadRegex);
    if (roadMatch) {
      components.road = roadMatch[0].trim();
    }
    
    // รายชื่อจังหวัดเพื่อค้นหาในข้อความ
    const provinceNames = [
      "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", 
      "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", 
      "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", 
      "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", 
      "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", 
      "ปราจีนบุรี", "ปัตตานี", "พะเยา", "พระนครศรีอยุธยา", "พังงา", "พัทลุง", 
      "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", 
      "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", 
      "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", 
      "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", 
      "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", 
      "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", 
      "อุทัยธานี", "อุบลราชธานี"
    ];
    
    // ค้นหาจังหวัด
    for (const name of provinceNames) {
      if (addressText.includes(name)) {
        components.province = name;
        break;
      }
    }
    
    // ค้นหาอำเภอ/เขต ตำบล/แขวง
    const districtRegex = /(?:อำเภอ|อ\.|เขต)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const subdistrictRegex = /(?:ตำบล|ต\.|แขวง)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    
    const districtMatch = addressText.match(districtRegex);
    const subdistrictMatch = addressText.match(subdistrictRegex);
    
    if (districtMatch) {
      components.district = districtMatch[0].trim();
    }
    
    if (subdistrictMatch) {
      components.subdistrict = subdistrictMatch[0].trim();
    }
    
    return components;
  };
  
  // ฟังก์ชันรวมสำหรับวิเคราะห์และแยกข้อมูลลูกค้าทั้งหมด
  const handleFullCustomerDataPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    if (!pastedText) return; // ไม่ทำอะไรถ้าไม่มีข้อมูลที่วาง
    
    // ทำการวิเคราะห์ข้อมูลที่วางทันที
    setTimeout(() => {
      const fullAddress = form.getValues('fullAddress');
      if (fullAddress && fullAddress === pastedText) {
        // ถ้ามีการเปลี่ยนแปลงข้อมูลในช่องที่อยู่เต็ม ให้วิเคราะห์ข้อมูลลูกค้า
        analyzeCustomerData(pastedText);
      }
    }, 100);
  };
  
  // ฟังก์ชันวิเคราะห์ข้อมูลลูกค้า (ชื่อ, เบอร์โทร, อีเมล) จากข้อความ
  const analyzeCustomerData = (text: string | undefined) => {
    if (!text) return; // ตรวจสอบว่ามีข้อความที่วางหรือไม่
    
    // แยกข้อความตามบรรทัด
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const fullText = lines.join(' ');
    
    // ค้นหาชื่อลูกค้า (มักจะอยู่ต้นประโยค หรือก่อนเบอร์โทร)
    if (!form.getValues('customerName')) {
      // ถ้าเป็นในรูปแบบที่มีชื่อตามด้วยวงเล็บที่มีเบอร์โทร เช่น "FH-ลาดพร้าว54(0919866556)"
      const nameWithPhonePattern = /^([^(]+)\((\d+)\)/;
      const nameWithPhoneMatch = fullText.match(nameWithPhonePattern);
      
      if (nameWithPhoneMatch) {
        form.setValue('customerName', nameWithPhoneMatch[1].trim());
        
        // ถ้าพบเบอร์โทรในวงเล็บและเบอร์โทรยังไม่ได้ถูกตั้งค่า
        if (!form.getValues('customerPhone') && nameWithPhoneMatch[2]) {
          form.setValue('customerPhone', nameWithPhoneMatch[2].replace(/[\s-]/g, ''));
        }
      }
      // ถ้าไม่อยู่ในรูปแบบข้างต้น ให้ใช้วิธีดึงจากบรรทัดแรก
      else if (lines.length > 0) {
        const nameMatch = lines[0].match(/^[ก-๙a-zA-Z0-9\s.,-]+/);
        if (nameMatch) {
          form.setValue('customerName', nameMatch[0].trim());
        }
      }
    }
    
    // ค้นหาเบอร์โทรศัพท์ (ถ้ายังไม่ได้ถูกตั้งค่าจากขั้นตอนก่อนหน้า)
    if (!form.getValues('customerPhone')) {
      // รองรับหลายรูปแบบเบอร์โทร
      const phoneRegex = /(?:โทร|เบอร์|tel|phone|:|\+66|0)[:\s]*(\d[\d\s-]{8,})/i;
      const simplePhoneRegex = /\b(\d{9,10})\b/; // เบอร์โทรที่เป็นตัวเลข 9-10 หลัก
      
      // ค้นหาในรูปแบบมาตรฐาน (มีคำนำหน้า)
      for (const line of lines) {
        const phoneMatch = line.match(phoneRegex);
        if (phoneMatch) {
          // ลบอักขระพิเศษออกจากเบอร์โทร
          const cleanPhone = phoneMatch[1].replace(/[\s-]/g, '');
          form.setValue('customerPhone', cleanPhone);
          break;
        }
      }
      
      // ถ้ายังไม่พบ ให้ค้นหาแบบง่าย (เป็นเลข 9-10 หลัก)
      if (!form.getValues('customerPhone')) {
        for (const line of lines) {
          const simplePhoneMatch = line.match(simplePhoneRegex);
          if (simplePhoneMatch) {
            form.setValue('customerPhone', simplePhoneMatch[1]);
            break;
          }
        }
      }
    }
    
    // ค้นหาอีเมล
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    for (const line of lines) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        form.setValue('customerEmail', emailMatch[0]);
        break;
      }
    }
    
      // วิเคราะห์ที่อยู่อัตโนมัติหากมีข้อมูลที่อยู่
    if (form.getValues('fullAddress')) {
      analyzeAddress();
    }
  };
  
  // ฟังก์ชันดึงตัวเลือกการจัดส่ง (จำลอง)
  const fetchShippingOptions = async () => {
    try {
      // จำลองการเรียก API ของ Flash Express
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
  
  // ฟังก์ชันการเพิ่มรายการสินค้า
  const addItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [
      ...items,
      {
        productId: undefined,
        name: '',
        quantity: 1,
        price: 0
      }
    ]);
  };
  
  // ฟังก์ชันการลบรายการสินค้า
  const removeItem = (index: number) => {
    const currentItems = form.getValues('items');
    if (currentItems.length <= 1) {
      toast({
        title: 'ไม่สามารถลบได้',
        description: 'ต้องมีสินค้าอย่างน้อย 1 รายการ',
        variant: 'destructive',
      });
      return;
    }
    
    const newItems = currentItems.filter((_, i) => i !== index);
    form.setValue('items', newItems);
  };
  
  // ฟังก์ชันการเลือกสินค้าจากรายการ
  const handleProductSelect = (productId: number, index: number) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const items = form.getValues('items');
      items[index].productId = selectedProduct.id;
      items[index].name = selectedProduct.name;
      items[index].price = Number(selectedProduct.price);
      form.setValue('items', items);
    }
  };
  
  // ฟังก์ชันการเลือกวิธีการจัดส่ง
  const handleShippingSelect = (shippingId: number) => {
    const selectedShipping = shippingOptions.find(s => s.id === shippingId);
    if (selectedShipping) {
      form.setValue('shippingMethod', selectedShipping.name);
      form.setValue('shippingCost', selectedShipping.price);
    }
  };
  
  // ฟังก์ชันตรวจสอบและส่งข้อมูลฟอร์ม
  const onSubmit = async (data: CreateOrderFormValues) => {
    setIsLoading(true);
    
    try {
      // จำลองการเรียก API ของ Flash Express เมื่อเลือก COD
      if (data.isCOD) {
        await simulateFlashExpressAPI(data);
      }
      
      // ส่งข้อมูลไปยังเซิร์ฟเวอร์
      const response = await api.post('/api/orders', data);
      
      if (response.data.success) {
        toast({
          title: 'สร้างออเดอร์สำเร็จ',
          description: `สร้างออเดอร์หมายเลข ${response.data.order.id} เรียบร้อยแล้ว`,
        });
        
        // กระโดดไปหน้าดูออเดอร์
        setLocation(`/order/${response.data.order.id}`);
      } else {
        throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการสร้างออเดอร์');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างออเดอร์ได้ โปรดลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // ฟังก์ชันจำลองการเรียก API ของ Flash Express
  const simulateFlashExpressAPI = async (data: CreateOrderFormValues) => {
    // ในสถานการณ์จริง จะต้องเรียก API ของ Flash Express เพื่อสร้างใบเสร็จ COD
    console.log('ข้อมูลที่จะส่งไปยัง Flash Express API สำหรับ COD:', {
      orderInfo: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: {
          houseNumber: data.houseNumber,
          village: data.village,
          soi: data.soi,
          road: data.road,
          subdistrict: data.subdistrict,
          district: data.district,
          province: data.province,
          zipcode: data.zipcode,
        },
        items: data.items,
        codAmount: data.codAmount,
        total: data.total,
      }
    });
    
    // ในที่นี้ เราจะจำลองการเรียก API โดยการหน่วงเวลา
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('ได้รับการตอบกลับจาก Flash Express API สำหรับ COD: สำเร็จ');
        resolve(true);
      }, 1000);
    });
  };
  
  // คอมโพเนนต์สรุปรายการสั่งซื้อ (แสดงทางด้านขวาของฟอร์ม)
  const OrderSummary = () => {
    const items = form.watch('items');
    const shippingCost = form.watch('shippingCost');
    const total = form.watch('total');
    const isCOD = form.watch('isCOD');
    const codAmount = form.watch('codAmount');
    
    return (
      <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 sticky top-4">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
          <div className="flex items-center">
            <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <CardTitle className="text-purple-800">สรุปรายการ</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.name || `รายการที่ ${index + 1}`} x{item.quantity}</span>
              <span>฿{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between">
            <span>รวมค่าสินค้า:</span>
            <span>฿{subTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ค่าจัดส่ง:</span>
            <span>฿{(shippingCost || 0).toLocaleString()}</span>
          </div>
          {isCOD && (
            <div className="flex justify-between text-orange-600">
              <span>เก็บเงินปลายทาง (COD):</span>
              <span>฿{(codAmount || 0).toLocaleString()}</span>
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
  
  // ควบคุมการเปลี่ยนแท็บและตรวจสอบความถูกต้องของข้อมูล
  const handleTabChange = (value: string) => {
    // ตรวจสอบว่าสามารถไปยังแท็บถัดไปได้หรือไม่
    if (value === "products" && (!form.getValues('customerName') || !form.getValues('customerPhone') || 
        !form.getValues('province') || !form.getValues('district') || !form.getValues('subdistrict') || !form.getValues('zipcode'))) {
      form.trigger(['customerName', 'customerPhone', 'province', 'district', 'subdistrict', 'zipcode']);
      return;
    }
    
    if (value === "shipping" && (!form.getValues('items') || form.getValues('items').length === 0)) {
      form.trigger(['items']);
      return;
    }
    
    if (value === "confirm" && !form.getValues('shippingMethod')) {
      form.trigger(['shippingMethod']);
      return;
    }
    
    setActiveTab(value);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 font-kanit bg-gradient-to-br from-white to-purple-50 rounded-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">สร้างออเดอร์ใหม่</h1>
          <p className="text-gray-600 text-lg mt-2">สร้างออเดอร์และจัดส่งสินค้าถึงลูกค้าของคุณอย่างรวดเร็ว</p>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-500 mt-4 rounded-full"></div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="customer" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">1</div>
                <span className="text-xs sm:text-sm">ข้อมูลลูกค้า/ที่อยู่</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">2</div>
                <span className="text-xs sm:text-sm">สินค้า</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-purple-100 text-purple-700 text-xs">3</div>
                <span className="text-xs sm:text-sm">การจัดส่ง</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* ขั้นตอนที่ 1: ข้อมูลลูกค้า */}
                  <TabsContent value="customer">
                    <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                        <div className="flex items-center">
                          <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                            <User className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-purple-800">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 1</span>
                            ข้อมูลลูกค้า
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {/* ส่วนวิเคราะห์ข้อมูลลูกค้าอัตโนมัติถูกลบออกตามคำขอ */}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ชื่อลูกค้า <span className="text-red-500">*</span></FormLabel>
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
                                <FormLabel>เบอร์โทรศัพท์ <span className="text-red-500">*</span></FormLabel>
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
                        <div className="pt-4 flex justify-end">
                          <Button 
                            type="button"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                            onClick={() => handleTabChange('address')}
                          >
                            ถัดไป <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ขั้นตอนที่ 2: ที่อยู่จัดส่ง */}
                  <TabsContent value="address">
                    <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                        <div className="flex items-center">
                          <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-purple-800">
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 2</span>
                              ที่อยู่จัดส่ง
                            </CardTitle>
                            <CardDescription className="text-purple-600/70">
                              วางข้อมูลลูกค้าทั้งหมด (Copy & Paste) เพื่อแยกข้อมูลอัตโนมัติ
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
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
                                <FormLabel>บ้านเลขที่ <span className="text-red-500">*</span></FormLabel>
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
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="province"
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
                              name="district"
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
                          
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="subdistrict"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ตำบล/แขวง <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="ตำบล/แขวง" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="zipcode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>รหัสไปรษณีย์ <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="10900" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="pt-4 flex justify-between">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => handleTabChange('customer')}
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                          </Button>
                          <Button 
                            type="button"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                            onClick={() => handleTabChange('products')}
                          >
                            ถัดไป <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ขั้นตอนที่ 3: เพิ่มสินค้า */}
                  <TabsContent value="products">
                    <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                        <div className="flex items-center">
                          <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                            <Package className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-purple-800">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 3</span>
                            เพิ่มสินค้า
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        {form.watch('items').map((item, index) => (
                          <div key={index} className="space-y-4 p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-purple-900">รายการสินค้าที่ {index + 1}</h4>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ชื่อสินค้า <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input placeholder="ชื่อสินค้า" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="space-y-2">
                                <Label>เลือกจากรายการสินค้า</Label>
                                <Select 
                                  onValueChange={(value) => handleProductSelect(Number(value), index)}
                                  value={form.getValues(`items.${index}.productId`)?.toString() || ''}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกสินค้า" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products && products.map((product) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name} (฿{Number(product.price).toLocaleString()})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>จำนวน <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min={1} 
                                        placeholder="จำนวน" 
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(parseInt(e.target.value) || 0);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ราคาต่อชิ้น <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min={0} 
                                        step={0.01} 
                                        placeholder="ราคา" 
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
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addItem}
                          className="w-full border-dashed border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Plus className="mr-2 h-4 w-4" /> เพิ่มสินค้า
                        </Button>
                        
                        <div className="pt-4 flex justify-between">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => handleTabChange('address')}
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" /> ย้อนกลับ
                          </Button>
                          <Button 
                            type="button"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                            onClick={() => handleTabChange('shipping')}
                          >
                            ถัดไป <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ขั้นตอนที่ 4: การจัดส่ง */}
                  <TabsContent value="shipping">
                    <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                        <div className="flex items-center">
                          <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                            <Truck className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-purple-800">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 4</span>
                            การจัดส่ง
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div className="space-y-4">
                          <Label>เลือกวิธีการจัดส่ง <span className="text-red-500">*</span></Label>
                          <div className="grid grid-cols-1 gap-4">
                            {shippingOptions && shippingOptions.map(option => (
                              <Card 
                                key={option.id} 
                                className={`border ${form.watch('shippingMethod') === option.name ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200'} cursor-pointer transition-all hover:border-purple-300`}
                                onClick={() => handleShippingSelect(option.id)}
                              >
                                <CardContent className="p-4 flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className="mr-4">
                                      <img src={option.logo || '/placeholder.png'} alt={option.provider} className="h-10 w-10 object-contain" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{option.name}</h4>
                                      <p className="text-sm text-gray-500">{option.deliveryTime}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold">฿{option.price}</span>
                                    {form.watch('shippingMethod') === option.name && (
                                      <Badge className="ml-2 bg-purple-600">เลือก</Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {form.formState.errors.shippingMethod && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.shippingMethod.message}</p>
                          )}
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="isCOD"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0 pt-4 my-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="font-medium flex items-center cursor-pointer">
                                  <Banknote className="w-4 h-4 mr-2 text-orange-500" />
                                  เก็บเงินปลายทาง (COD)
                                </FormLabel>
                                <FormDescription>
                                  เก็บเงินค่าสินค้าและค่าจัดส่งจากผู้รับปลายทาง
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch('isCOD') && (
                          <FormField
                            control={form.control}
                            name="codAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>จำนวนเงินที่เก็บปลายทาง <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={0} 
                                    step={0.01} 
                                    placeholder="จำนวนเงิน" 
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value) || 0);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  จำนวนเงินรวมทั้งค่าสินค้าและค่าจัดส่ง
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>หมายเหตุ</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="ระบุรายละเอียดเพิ่มเติม เช่น คำแนะนำการจัดส่ง..." 
                                  rows={3}
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
                            onClick={() => handleTabChange('products')}
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

                  {/* ขั้นตอนที่ 5: ตรวจสอบและยืนยัน */}
                  <TabsContent value="confirm">
                    <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                        <div className="flex items-center">
                          <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                            <CheckCheck className="w-5 h-5" />
                          </div>
                          <CardTitle className="text-purple-800">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 5</span>
                            ตรวจสอบและยืนยัน
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="space-y-4">
                          <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <h3 className="font-medium text-purple-900 mb-2">ข้อมูลลูกค้า</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-500">ชื่อลูกค้า:</span>
                                <p className="font-medium">{form.getValues('customerName')}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">เบอร์โทรศัพท์:</span>
                                <p className="font-medium">{form.getValues('customerPhone')}</p>
                              </div>
                              {form.getValues('customerEmail') && (
                                <div className="md:col-span-2">
                                  <span className="text-sm text-gray-500">อีเมล:</span>
                                  <p className="font-medium">{form.getValues('customerEmail')}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <h3 className="font-medium text-purple-900 mb-2">ที่อยู่จัดส่ง</h3>
                            <p className="font-medium">
                              {form.getValues('houseNumber')} 
                              {form.getValues('village') && ` ${form.getValues('village')}`}
                              {form.getValues('soi') && ` ${form.getValues('soi')}`}
                              {form.getValues('road') && ` ${form.getValues('road')}`}
                              <br />
                              ต.{form.getValues('subdistrict')} อ.{form.getValues('district')} 
                              <br />
                              จ.{form.getValues('province')} {form.getValues('zipcode')}
                            </p>
                          </div>
                          
                          <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <h3 className="font-medium text-purple-900 mb-2">รายการสินค้า</h3>
                            <div className="space-y-2">
                              {form.getValues('items').map((item, index) => (
                                <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                                  <div>
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                                  </div>
                                  <span className="font-medium">฿{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <h3 className="font-medium text-purple-900 mb-2">การจัดส่ง</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>วิธีการจัดส่ง:</span>
                                <span className="font-medium">{form.getValues('shippingMethod')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>ค่าจัดส่ง:</span>
                                <span className="font-medium">฿{form.getValues('shippingCost').toLocaleString()}</span>
                              </div>
                              {form.getValues('isCOD') && (
                                <div className="flex justify-between">
                                  <span>เก็บเงินปลายทาง (COD):</span>
                                  <span className="font-medium text-orange-600">฿{form.getValues('codAmount').toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {form.getValues('note') && (
                            <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                              <h3 className="font-medium text-purple-900 mb-2">หมายเหตุ</h3>
                              <p>{form.getValues('note')}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 flex justify-between">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => handleTabChange('shipping')}
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
                </div>
                
                {/* สรุปรายการสั่งซื้อ (ด้านขวา) */}
                <div className="lg:col-span-1">
                  <OrderSummary />
                </div>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CreateOrderTabsPage;