import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import api, { apiRequest } from '@/services/api';
import { parseCustomerAndAddressData } from '@/utils/addressParser';
import { getMockShippingOptions, createMockShipment } from '@/services/mock-shipping';
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
  ShoppingBag,
  CheckCircle2
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
  customerName?: string;
  customerPhone?: string;
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
  
  // ข้อมูลการจัดส่ง (เพิ่มเติม)
  orderNumber: z.string().optional(),
  trackingNumber: z.string().optional(),
  sortCode: z.string().optional(),
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
  
  // ไม่ต้องใช้สถานะสำหรับเก็บข้อมูลจังหวัด อำเภอ และตำบลอีกต่อไป
  // เนื่องจากเราเปลี่ยนมาใช้การกรอกข้อมูลแทนการเลือก
  
  // คำนวณราคารวมสินค้า (subTotal) สำหรับแสดงผลในหน้า
  const [subTotal, setSubTotal] = useState(0);
  
  // State สำหรับจัดการป๊อบอัพแจ้งเตือนหลังจากสร้างออเดอร์สำเร็จ
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    orderNumber?: string;
    trackingNumber?: string;
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
      total: 0,
      orderNumber: '',
      trackingNumber: '',
      sortCode: ''
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
  
  // กำหนด interface สำหรับข้อมูลผู้ส่ง
  interface SenderInfo {
    name: string;
    phone: string;
    email: string;
    address: string;
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  }
  
  // กำหนด state สำหรับเก็บข้อมูลผู้ส่ง
  const [senderInfo, setSenderInfo] = useState<SenderInfo | null>(null);
  
  // ดึงข้อมูลสินค้า, ข้อมูลผู้ส่ง และตัวเลือกการจัดส่งเมื่อโหลดหน้า
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
    
    // เรียกใช้งานฟังก์ชันดึงตัวเลือกการจัดส่ง
    fetchProducts();
    fetchShippingOptions();
    
    // ดึงข้อมูลผู้ส่ง (ข้อมูลผู้ใช้) 
    if (user) {
      // กำหนดข้อมูลผู้ส่งเริ่มต้นจากข้อมูลผู้ใช้
      console.log("กำลังดึงข้อมูลผู้ส่งจากโปรไฟล์:", user);
      
      if (user.fullname) {
        // ตั้งค่าข้อมูลผู้ส่งจากโปรไฟล์ผู้ใช้
        const userSenderInfo: SenderInfo = {
          name: user.fullname || "",
          phone: user.phone || "",
          email: user.email || "",
          address: user.address || "",
          province: user.province || "",
          district: user.district || "",
          subdistrict: user.subdistrict || "",
          zipcode: user.zipcode || ""
        };
        
        console.log("ข้อมูลผู้ส่งที่ดึงจากโปรไฟล์:", userSenderInfo);
        
        // บันทึกข้อมูลผู้ส่งไว้ใน state
        setSenderInfo(userSenderInfo);
        
        // แสดงข้อความแจ้งเตือนว่าได้ใช้ข้อมูลจากโปรไฟล์
        toast({
          title: 'ดึงข้อมูลผู้ส่งสำเร็จ',
          description: 'ระบบใช้ข้อมูลผู้ส่งจากโปรไฟล์ของคุณ',
        });
      } else {
        console.log("ไม่พบข้อมูลผู้ส่งในโปรไฟล์ผู้ใช้");
        toast({
          title: 'ไม่พบข้อมูลผู้ส่ง',
          description: 'กรุณากำหนดข้อมูลผู้ส่งในหน้าตั้งค่าโปรไฟล์',
          variant: 'destructive',
        });
      }
    }
  }, [user]);
  
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
      // ใช้ฟังก์ชันใหม่ที่วิเคราะห์ทั้งข้อมูลลูกค้าและที่อยู่
      const addressComponents = parseCustomerAndAddressData(fullAddress);
      
      console.log("ผลการวิเคราะห์:", addressComponents);
      
      // ถ้าไม่มีส่วนประกอบที่อยู่เลย แสดงว่าวิเคราะห์ไม่สำเร็จ
      if (Object.keys(addressComponents).length === 0) {
        throw new Error('ไม่สามารถวิเคราะห์ที่อยู่ได้');
      }
      
      // เพื่อให้แน่ใจว่าไม่มีการกำหนดค่า undefined ให้กับฟอร์ม
      const validatedComponents: AddressComponents = {
        houseNumber: addressComponents.houseNumber || '',
        village: addressComponents.building || '',  // ใช้ building ถ้ามี
        soi: addressComponents.soi || '',
        road: addressComponents.road || '',
        subdistrict: addressComponents.subdistrict || '',
        district: addressComponents.district || '',
        province: addressComponents.province || '',
        zipcode: addressComponents.zipcode || '',
        customerName: addressComponents.customerName || '',
        customerPhone: addressComponents.customerPhone || '',
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
  
  // ฟังก์ชันช่วยแยกประเภทข้อมูลที่อยู่จากข้อความ - ปรับปรุงใหม่เพื่อประสิทธิภาพที่ดีขึ้น
  const parseAddressFromText = (text: string): AddressComponents => {
    const components: AddressComponents = {};
    
    // ทำความสะอาดข้อความก่อนวิเคราะห์
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const addressText = lines.join(' ');
    
    console.log("กำลังวิเคราะห์ที่อยู่:", addressText);
    
    // ลบข้อมูลเบอร์โทรศัพท์ออกก่อน เพื่อไม่ให้ปะปนกับที่อยู่
    let cleanedText = addressText;
    
    // ลบเบอร์โทรที่อยู่ในวงเล็บ เช่น (0812345678)
    cleanedText = cleanedText.replace(/\(\d{9,10}\)/g, '');
    
    // ลบเบอร์โทรทั่วไป (เริ่มต้นด้วย 0 ตามด้วยตัวเลข 8-9 หลัก)
    cleanedText = cleanedText.replace(/\b0\d{8,9}\b/g, '');
    
    // ลบเบอร์โทรที่มีขีดหรือช่องว่าง เช่น 081-234-5678
    cleanedText = cleanedText.replace(/0\d{1,2}[- .]\d{3,4}[- .]\d{3,4}/g, '');
    
    // ดึงรหัสไปรษณีย์ (เป็นตัวเลข 5 หลัก)
    const zipRegex = /\b(\d{5})\b/;
    const zipMatch = cleanedText.match(zipRegex);
    if (zipMatch) {
      components.zipcode = zipMatch[1];
      console.log("พบรหัสไปรษณีย์:", components.zipcode);
    }
    
    // ลบรหัสไปรษณีย์ออกเพื่อไม่ให้ถูกนำมาใช้เป็นเลขที่บ้าน
    if (components.zipcode) {
      cleanedText = cleanedText.replace(components.zipcode, '');
    }
    
    // ดึงเลขที่บ้าน (มีหลายรูปแบบ)
    // 1. รูปแบบที่มีคำนำหน้า "เลขที่" หรือ "บ้านเลขที่"
    const houseNumberWithPrefixRegex = /(เลขที่|บ้านเลขที่|บ้าน|เลข)\s*([0-9\/\-\\]+\s*[ก-ฮ]?)/i;
    const houseNumberWithPrefixMatch = cleanedText.match(houseNumberWithPrefixRegex);
    
    // 2. รูปแบบที่เป็นเลขที่บ้านแบบง่าย (ตัวเลข หรือ ตัวเลข/ตัวเลข ที่ขึ้นต้นประโยค)
    const simpleHouseNumberRegex = /^([0-9\/\-\\]+\s*[ก-ฮ]?)(?:\s|,)/;
    
    // 3. รูปแบบเลขที่บ้านที่มักพบ คือมีเลขบ้านตามด้วยชื่อถนน
    const commonHouseNumberRegex = /\b(\d+\/?\d*[ก-ฮ]?)\s+(ถนน|ถ\.|ซอย|ซ\.)/i;
    
    if (houseNumberWithPrefixMatch) {
      components.houseNumber = houseNumberWithPrefixMatch[2].trim();
      console.log("พบเลขที่บ้าน (จากคำนำหน้า):", components.houseNumber);
    } else {
      const simpleMatch = lines[0]?.match(simpleHouseNumberRegex);
      if (simpleMatch) {
        components.houseNumber = simpleMatch[1].trim();
        console.log("พบเลขที่บ้าน (แบบง่าย):", components.houseNumber);
      } else {
        const commonMatch = cleanedText.match(commonHouseNumberRegex);
        if (commonMatch) {
          components.houseNumber = commonMatch[1].trim();
          console.log("พบเลขที่บ้าน (รูปแบบทั่วไป):", components.houseNumber);
        } else {
          // 4. มองหาตัวเลขที่น่าจะเป็นเลขที่บ้าน (ในตอนต้นของประโยค)
          const words = cleanedText.split(/\s+/);
          for (let i = 0; i < Math.min(3, words.length); i++) {
            // ตรวจสอบว่าคำนี้เป็นตัวเลขหรือมีตัวเลข/ตัวเลข หรือไม่
            if (/^\d+$|^\d+\/\d+$/.test(words[i])) {
              components.houseNumber = words[i].trim();
              console.log("พบเลขที่บ้าน (จากคำตอนต้น):", components.houseNumber);
              break;
            }
          }
        }
      }
    }
    
    // ดึงชื่อหมู่บ้าน/อาคาร ที่มีคำนำหน้า
    const villageWithPrefixRegex = /(หมู่บ้าน|หมู่|ม\.|อาคาร|คอนโด)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const villageWithPrefixMatch = addressText.match(villageWithPrefixRegex);
    
    // ดึงชื่ออาคาร/หมู่บ้านที่ตามด้วยคำว่า "เพลส" หรือคำอื่นๆ ที่บ่งบอกว่าเป็นอาคาร
    const buildingNameRegex = /(\S+)\s+(เพลส|แมนชั่น|คอนโด|อพาร์ทเม้นท์|อพาร์ตเมนต์|อพาร์ตเมนท์|แฟลต|ทาวเวอร์|วิลล่า|วิลเลจ|การ์เด้น)/i;
    const buildingNameMatch = addressText.match(buildingNameRegex);
    
    if (villageWithPrefixMatch) {
      components.village = villageWithPrefixMatch[0].trim();
      console.log("พบหมู่บ้าน/อาคาร (จากคำนำหน้า):", components.village);
    } else if (buildingNameMatch) {
      components.village = buildingNameMatch[0].trim();
      console.log("พบชื่ออาคาร/หมู่บ้าน (จากคำลงท้าย):", components.village);
    }
    
    // ดึงข้อมูลซอย (หลายรูปแบบ)
    // 1. ซอยที่มีคำนำหน้า "ซอย" หรือ "ซ."
    const soiWithPrefixRegex = /(ซอย|ซ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const soiWithPrefixMatch = addressText.match(soiWithPrefixRegex);
    
    // 2. ซอยที่เป็นตัวเลขและอยู่หลังชื่อถนน (เช่น โชคชัย 4 ซอย 59)
    const numericSoiRegex = /\b(ซอย\s*\d+|ซ\.\s*\d+)\b/i;
    const numericSoiMatch = addressText.match(numericSoiRegex);
    
    if (soiWithPrefixMatch) {
      components.soi = soiWithPrefixMatch[0].trim();
      console.log("พบซอย (จากคำนำหน้า):", components.soi);
    } else if (numericSoiMatch) {
      components.soi = numericSoiMatch[0].trim();
      console.log("พบซอย (เลข):", components.soi);
    }
    
    // ดึงข้อมูลถนน (หลายรูปแบบ)
    // 1. ถนนที่มีคำนำหน้า "ถนน" หรือ "ถ."
    const roadWithPrefixRegex = /(ถนน|ถ\.)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
    const roadWithPrefixMatch = addressText.match(roadWithPrefixRegex);
    
    // 2. ชื่อถนนที่พบบ่อยและไม่มีคำนำหน้า
    const commonRoadNames = [
      'ลาดพร้าว', 'รัชดาภิเษก', 'รัชดา', 'สุขุมวิท', 'เพชรบุรี', 'พหลโยธิน', 'รามคำแหง',
      'เจริญกรุง', 'สีลม', 'สาทร', 'เพชรเกษม', 'บางนา-ตราด', 'นวมินทร์', 'พระราม', 'โชคชัย',
      'ประชาอุทิศ', 'ประชาชื่น', 'วิภาวดี', 'วิภาวดีรังสิต', 'งามวงศ์วาน', 'ติวานนท์', 'กรุงธนบุรี',
      'จรัญสนิทวงศ์', 'เอกชัย', 'กาญจนาภิเษก', 'ศรีนครินทร์', 'อ่อนนุช', 'ลาซาล', 'บางนา'
    ];
    
    if (roadWithPrefixMatch) {
      components.road = roadWithPrefixMatch[0].trim();
      console.log("พบถนน (จากคำนำหน้า):", components.road);
    } else {
      // ตรวจสอบชื่อถนนที่พบบ่อยและอาจไม่มีคำนำหน้า
      for (const roadName of commonRoadNames) {
        const roadPattern = new RegExp(`\\b${roadName}\\s*(\\d+)?\\b`, 'i');
        const specificRoadMatch = addressText.match(roadPattern);
        
        if (specificRoadMatch && !components.road) {
          components.road = specificRoadMatch[0].trim();
          console.log("พบถนน (ชื่อเฉพาะ):", components.road);
          break;
        }
      }
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
    
    // ค้นหาจังหวัด (ในรูปแบบที่ไม่มีคำนำหน้า)
    for (const name of provinceNames) {
      if (addressText.includes(name)) {
        components.province = name;
        console.log("พบจังหวัด:", components.province);
        break;
      }
    }
    
    // ค้นหาอำเภอ/เขต และ ตำบล/แขวง ที่มีคำนำหน้า
    const districtWithPrefixRegex = /(อำเภอ|อ\.|เขต)\s*([^\s,]+(?:\s+[^\s,]+)*?)(?=\s+|$|,|\s+แขวง|\s+ตำบล|\s+จังหวัด)/i;
    const subdistrictWithPrefixRegex = /(ตำบล|ต\.|แขวง)\s*([^\s,]+(?:\s+[^\s,]+)*?)(?=\s+|$|,|\s+เขต|\s+อำเภอ|\s+จังหวัด)/i;
    
    const districtWithPrefixMatch = cleanedText.match(districtWithPrefixRegex);
    const subdistrictWithPrefixMatch = cleanedText.match(subdistrictWithPrefixRegex);
    
    if (districtWithPrefixMatch) {
      // ดึงเฉพาะชื่ออำเภอ/เขต ไม่รวมคำนำหน้า
      components.district = districtWithPrefixMatch[2].trim();
      console.log("พบอำเภอ/เขต (มีคำนำหน้า):", components.district);
    }
    
    if (subdistrictWithPrefixMatch) {
      // ดึงเฉพาะชื่อตำบล/แขวง ไม่รวมคำนำหน้า
      components.subdistrict = subdistrictWithPrefixMatch[2].trim();
      console.log("พบตำบล/แขวง (มีคำนำหน้า):", components.subdistrict);
    }
    
    // ค้นหาอำเภอและตำบลที่อาจไม่มีคำนำหน้า
    const words = cleanedText.split(/\s+|,+/).filter(Boolean);
    
    // คำที่ควรข้ามในการวิเคราะห์
    const skipWords = ['ซอย', 'ซ.', 'ถนน', 'ถ.', 'หมู่', 'ม.', 'หมู่บ้าน', 'อาคาร', 'คอนโด', 'เพลส', 'แมนชั่น', 'อพาร์ทเม้นท์', 'แฟลต', 'เรสซิเดนซ์', 'โทร', 'เบอร์', 'tel', 'phone'];
    
    // รายชื่ออำเภอและตำบลที่มีชื่อเดียวกัน (มักพบในกรุงเทพฯ)
    const commonDistrictNames = [
      'ลาดพร้าว', 'บางนา', 'บางเขน', 'จตุจักร', 'ดินแดง', 'ห้วยขวาง', 'บางกะปิ', 'คลองเตย', 
      'พระโขนง', 'ดอนเมือง', 'หลักสี่', 'สายไหม', 'บางซื่อ', 'จอมทอง', 'ราษฎร์บูรณะ', 
      'คลองสาน', 'บางกอกน้อย', 'บางกอกใหญ่', 'ดุสิต', 'พญาไท', 'ราชเทวี', 'ปทุมวัน', 
      'ยานนาวา', 'สาทร', 'บางคอแหลม', 'บางพลัด', 'ภาษีเจริญ', 'หนองแขม', 'ทุ่งครุ', 
      'บางขุนเทียน', 'บางบอน', 'พระนคร', 'ป้อมปราบ', 'สัมพันธวงศ์', 'คลองสามวา',
      'หนองจอก', 'ลาดกระบัง', 'มีนบุรี', 'บึงกุ่ม', 'ประเวศ', 'สวนหลวง', 'คันนายาว', 
      'สะพานสูง', 'วังทองหลาง', 'บางแค', 'ลาดกระบัง', 'ทวีวัฒนา', 'บางพลี', 'บางบัวทอง', 
      'บางใหญ่', 'ปากเกร็ด', 'ดอนเมือง', 'สามพราน', 'เมือง', 'หนองแขม', 'ศรีราชา'
    ];
    
    // ถ้ายังไม่พบอำเภอ/เขต หรือ ตำบล/แขวง ให้ค้นหาจากชื่อที่พบบ่อย
    if (!components.district || !components.subdistrict) {
      for (const districtName of commonDistrictNames) {
        // หาคำที่ตรงกันแบบเต็มคำ
        const districtRegex = new RegExp(`(?:^|\\s|,)(${districtName})(?:$|\\s|,)`, 'i');
        const districtMatch = cleanedText.match(districtRegex);
        
        if (districtMatch) {
          const foundDistrictName = districtMatch[1];
          
          // นับจำนวนครั้งที่ชื่อนี้ปรากฏในข้อความ
          // นับเฉพาะคำที่ตรงกันแบบเต็มคำ
          const occurrences = words.filter(word => {
            return word.toLowerCase() === districtName.toLowerCase();
          }).length;
          
          console.log(`พบคำว่า "${foundDistrictName}" จำนวน ${occurrences} ครั้ง`);
          
          // ถ้ายังไม่มีชื่อเขต
          if (!components.district) {
            components.district = foundDistrictName;
            console.log("กำหนดเป็นเขต/อำเภอ:", foundDistrictName);
          }
          // ถ้ามีเขตแล้ว แต่ยังไม่มีตำบล และชื่อไม่ซ้ำกับเขต
          else if (!components.subdistrict && components.district !== foundDistrictName) {
            components.subdistrict = foundDistrictName;
            console.log("กำหนดเป็นแขวง/ตำบล:", foundDistrictName);
          }
          // ถ้าพบมากกว่า 1 ครั้ง และชื่อเหมือนกัน อาจเป็นทั้งเขตและแขวง
          else if (occurrences >= 2 && !components.subdistrict) {
            components.subdistrict = foundDistrictName;
            console.log("กำหนดเป็นแขวง/ตำบล (ซ้ำกับเขต):", foundDistrictName);
          }
        }
      }
    }
    
    // หากยังไม่พบแขวง/ตำบล หรือ เขต/อำเภอ ให้วิเคราะห์จากคำทั่วไปที่เหลือ
    if (!components.district || !components.subdistrict) {
      // กรณีพิเศษ: ถ้าพบจังหวัดกรุงเทพฯ และยังไม่มีเขต
      if (components.province && 
          (components.province.includes("กรุงเทพ") || components.province.includes("กทม")) && 
          !components.district) {
        // ค้นหาด้วยชื่อถนนที่มักเชื่อมโยงกับเขตเฉพาะ
        const streetToDistrictMap: Record<string, string> = {
          'ลาดพร้าว': 'ลาดพร้าว',
          'รัชดาภิเษก': 'ดินแดง',
          'เพชรบุรี': 'ราชเทวี',
          'สุขุมวิท': 'วัฒนา',
          'พหลโยธิน': 'พญาไท',
          'อโศก': 'วัฒนา',
          'สีลม': 'บางรัก',
          'พระราม 9': 'ห้วยขวาง',
          'พระราม 4': 'คลองเตย',
          'เจริญกรุง': 'บางรัก',
          'ทองหล่อ': 'วัฒนา',
          'เอกมัย': 'วัฒนา',
          'อ่อนนุช': 'สวนหลวง',
          'รามคำแหง': 'บางกะปิ'
        };
        
        if (components.road) {
          for (const [street, district] of Object.entries(streetToDistrictMap)) {
            if (components.road.includes(street)) {
              components.district = district;
              console.log(`กำหนดเขตจากชื่อถนน ${street}:`, district);
              break;
            }
          }
        }
      }
      
      // ถ้ายังไม่มีเขต/อำเภอ หรือแขวง/ตำบล ค้นหาจากคำที่เหลือ
      // กรองคำที่ไม่เกี่ยวข้องออก
      const relevantWords = words.filter(word => {
        // ตัดเครื่องหมายต่างๆ ออก
        word = word.replace(/["']/g, '');
        
        // ข้ามคำที่เป็นเบอร์โทรศัพท์
        if (/^0\d{8,9}$/.test(word) || /^\d{5}$/.test(word)) {
          return false;
        }
        
        // ข้ามคำที่เป็นคำนำหน้า ตัวเลข หรือคำที่สั้นเกินไป
        if (skipWords.some(skip => word.toLowerCase().includes(skip.toLowerCase())) || 
            /^\d+$/.test(word) || 
            word.length < 3) {
          return false;
        }
        
        // ข้ามคำที่เป็นส่วนประกอบที่พบแล้ว
        if (components.province === word || 
            components.district === word || 
            components.subdistrict === word || 
            (components.road && components.road.includes(word)) || 
            (components.soi && components.soi.includes(word)) || 
            (components.village && components.village.includes(word)) ||
            (components.houseNumber && components.houseNumber.includes(word))) {
          return false;
        }
        
        // ข้ามคำที่เป็นชื่อจังหวัด
        if (provinceNames.some(province => province.toLowerCase() === word.toLowerCase())) {
          return false;
        }
        
        // ข้ามคำที่น่าจะเป็นชื่อลูกค้า (เช่น น้องซี, พี่ต้น)
        const likelyThaiNamePrefixes = ['น้อง', 'พี่', 'คุณ', 'ป้า', 'ลุง', 'นาย', 'นาง', 'น.ส.', 'ตา', 'ยาย'];
        if (likelyThaiNamePrefixes.some(prefix => word.startsWith(prefix))) {
          return false;
        }
        
        return true;
      });
      
      console.log("คำที่เหลือสำหรับวิเคราะห์:", relevantWords);
      
      // ถ้ามีคำที่เหลือ และยังไม่พบอำเภอ/เขต
      if (relevantWords.length > 0 && !components.district) {
        // ตรวจสอบว่าคำนี้เป็นชื่อเขต/อำเภอที่พบบ่อยหรือไม่
        const isCommonDistrict = commonDistrictNames.some(name => 
          relevantWords[0].toLowerCase() === name.toLowerCase()
        );
        
        if (isCommonDistrict) {
          components.district = relevantWords[0];
          console.log("กำหนดเขต/อำเภอจากคำที่พบบ่อย:", components.district);
          
          // ถ้ามีมากกว่า 1 คำ และคำที่ 2 ไม่ใช่ถนน ให้ใช้เป็นตำบล/แขวง
          if (relevantWords.length > 1 && !components.subdistrict) {
            const isSecondWordACommonRoad = commonRoadNames.some(name => 
              relevantWords[1].toLowerCase() === name.toLowerCase()
            );
            
            if (!isSecondWordACommonRoad) {
              components.subdistrict = relevantWords[1];
              console.log("กำหนดแขวง/ตำบลจากคำที่เหลือลำดับที่ 2:", components.subdistrict);
            }
          }
        } 
        // ถ้าไม่ใช่ชื่อเขต/อำเภอที่พบบ่อย ให้ตรวจสอบคำที่เหลือทั้งหมด
        else {
          // ถ้าคำแรกน่าจะเป็นชื่อถนน ให้ข้ามไปใช้คำที่ 2
          const isFirstWordARoad = commonRoadNames.some(name => 
            relevantWords[0].toLowerCase() === name.toLowerCase()
          );
          
          if (isFirstWordARoad && relevantWords.length > 1) {
            components.district = relevantWords[1];
            console.log("กำหนดเขต/อำเภอจากคำที่เหลือลำดับที่ 2 (ข้ามถนน):", components.district);
          } else {
            components.district = relevantWords[0];
            console.log("กำหนดเขต/อำเภอจากคำที่เหลือลำดับที่ 1:", components.district);
          }
        }
      }
      
      // ถ้ามีคำที่เหลือมากกว่า 1 คำ และยังไม่พบแขวง/ตำบล
      if (relevantWords.length > 1 && !components.subdistrict) {
        // ถ้าคำแรกถูกใช้เป็นเขตแล้ว ให้ใช้คำที่ 2
        if (components.district === relevantWords[0] && relevantWords.length > 1) {
          components.subdistrict = relevantWords[1];
          console.log("กำหนดแขวง/ตำบลจากคำที่เหลือลำดับที่ 2:", components.subdistrict);
        }
        // ถ้าคำที่ 2 ถูกใช้เป็นเขตแล้ว ให้ใช้คำที่ 1
        else if (components.district === relevantWords[1]) {
          components.subdistrict = relevantWords[0];
          console.log("กำหนดแขวง/ตำบลจากคำที่เหลือลำดับที่ 1:", components.subdistrict);
        }
        // ถ้ายังไม่มีการกำหนดตำบล/แขวง ให้ใช้คำที่ 2
        else if (!components.subdistrict) {
          components.subdistrict = relevantWords[1];
          console.log("กำหนดแขวง/ตำบลจากคำที่เหลือลำดับที่ 2 (ไม่ซ้ำ):", components.subdistrict);
        }
      }
    }
    
    // ตรวจสอบเพิ่มเติม: ถ้ามีเขต/อำเภอแล้ว แต่ยังไม่มีแขวง/ตำบล
    // ในบางกรณี เขตและแขวงใช้ชื่อเดียวกัน (โดยเฉพาะในกรุงเทพฯ)
    if (components.district && !components.subdistrict && 
        components.province && components.province.includes("กรุงเทพ")) {
      // เช็คว่าชื่อเขตอยู่ในรายชื่อที่มักใช้ชื่อเดียวกันกับแขวงหรือไม่
      const sameNameDistrictAndSubdistrict = [
        'จตุจักร', 'ดินแดง', 'ลาดพร้าว', 'บางนา', 'บางเขน', 'ดอนเมือง', 'ทุ่งครุ',
        'บางซื่อ', 'สวนหลวง', 'คลองเตย', 'ประเวศ', 'พระโขนง', 'สะพานสูง', 'ลาดกระบัง'
      ];
      
      if (sameNameDistrictAndSubdistrict.includes(components.district)) {
        components.subdistrict = components.district;
        console.log("กำหนดแขวงให้เหมือนเขตในกรุงเทพฯ:", components.subdistrict);
      }
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
        // วิเคราะห์ข้อมูลลูกค้าและที่อยู่พร้อมกันทั้งหมด
        analyzeAllCustomerData(pastedText);
      }
    }, 100);
  };
  
  // ฟังก์ชันวิเคราะห์ข้อมูลทั้งหมดของลูกค้า (ชื่อ, เบอร์โทร, อีเมล และที่อยู่) จากข้อความ
  const analyzeAllCustomerData = (text: string | undefined) => {
    if (!text) return; // ตรวจสอบว่ามีข้อความที่วางหรือไม่
    
    // เก็บข้อความเดิมไว้
    const originalText = text;
    
    // กำหนดข้อมูลที่ต้องการค้นหาและประมวลผล
    form.setValue('fullAddress', text); // ตั้งค่าข้อความเต็มไว้ก่อน
    
    // ค้นหาเบอร์โทรศัพท์ก่อน ควรทำก่อนที่จะวิเคราะห์ชื่อ
    let phoneFound = false;
    let foundPhoneNumber = "";
    let phonePosition = -1;
    let phoneLength = 0;
    
    // 1. รูปแบบเบอร์โทรที่ถูกครอบด้วยวงเล็บ (เช่น (0819876543))
    const phoneInParenthesesRegex = /\((\d{9,10})\)/;
    const phoneInParenthesesMatch = text.match(phoneInParenthesesRegex);
    if (phoneInParenthesesMatch && !phoneFound) {
      foundPhoneNumber = phoneInParenthesesMatch[1];
      if (foundPhoneNumber.startsWith('0') && foundPhoneNumber.length >= 9 && foundPhoneNumber.length <= 10) {
        form.setValue('customerPhone', foundPhoneNumber);
        phoneFound = true;
        phonePosition = text.indexOf(phoneInParenthesesMatch[0]);
        phoneLength = phoneInParenthesesMatch[0].length;
        console.log("พบเบอร์โทรจากวงเล็บ:", foundPhoneNumber);
      }
    }
    
    // 2. รูปแบบที่มีคำนำหน้า (โทร, เบอร์, tel:, etc.)
    if (!phoneFound) {
      const phoneWithPrefixRegex = /(?:โทร|เบอร์|tel|phone|:|\+66)[:\s]*(0\d[\d\s-]{7,})/i;
      const phoneWithPrefixMatch = text.match(phoneWithPrefixRegex);
      if (phoneWithPrefixMatch) {
        foundPhoneNumber = phoneWithPrefixMatch[1].replace(/[\s-]/g, '');
        if (foundPhoneNumber.startsWith('0') && foundPhoneNumber.length >= 9 && foundPhoneNumber.length <= 10) {
          form.setValue('customerPhone', foundPhoneNumber);
          phoneFound = true;
          phonePosition = text.indexOf(phoneWithPrefixMatch[0]);
          phoneLength = phoneWithPrefixMatch[0].length;
          console.log("พบเบอร์โทรจากคำนำหน้า:", foundPhoneNumber);
        }
      }
    }
    
    // 3. รูปแบบเบอร์โทรแบบง่าย (เช่น 0819876543)
    if (!phoneFound) {
      const simplePhoneRegex = /\b(0\d{8,9})\b/;
      const simplePhoneMatch = text.match(simplePhoneRegex);
      if (simplePhoneMatch) {
        foundPhoneNumber = simplePhoneMatch[1];
        form.setValue('customerPhone', foundPhoneNumber);
        phoneFound = true;
        phonePosition = text.indexOf(simplePhoneMatch[0]);
        phoneLength = simplePhoneMatch[0].length;
        console.log("พบเบอร์โทรแบบง่าย:", foundPhoneNumber);
      }
    }
    
    // 4. ค้นหาเบอร์โทรจากรูปแบบที่มีขีด ช่องว่าง หรือจุด (เช่น 081-987-6543)
    if (!phoneFound) {
      const formattedPhoneRegex = /\b(0\d{1,2}[- .]\d{3,4}[- .]\d{3,4})\b/;
      const formattedPhoneMatch = text.match(formattedPhoneRegex);
      if (formattedPhoneMatch) {
        foundPhoneNumber = formattedPhoneMatch[1].replace(/[- .]/g, '');
        if (foundPhoneNumber.length >= 9 && foundPhoneNumber.length <= 10) {
          form.setValue('customerPhone', foundPhoneNumber);
          phoneFound = true;
          phonePosition = text.indexOf(formattedPhoneMatch[0]);
          phoneLength = formattedPhoneMatch[0].length;
          console.log("พบเบอร์โทรแบบมีรูปแบบ:", foundPhoneNumber);
        }
      }
    }
    
    // แยกข้อความตามบรรทัด
    let lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // จัดการกับกรณีที่ข้อมูลถูกวางในบรรทัดเดียวกัน คั่นด้วยเครื่องหมายจุลภาค
    if (lines.length <= 1) {
      // แยกข้อความด้วยเครื่องหมายจุลภาคหรือช่องว่าง (เพิ่มเติม)
      const parts = text.split(/[,|]/).map(part => part.trim()).filter(Boolean);
      if (parts.length > 1) {
        lines = parts;
      }
    }
    
    // ตัดเครื่องหมายอัญประกาศหรือเครื่องหมายคำพูดออกจากข้อความทั้งหมด
    lines = lines.map(line => line.replace(/["']/g, ''));
    
    console.log('ข้อความที่วิเคราะห์ (หลังการทำความสะอาด):', lines);

    // ค้นหาชื่อลูกค้า ตามรูปแบบต่างๆ
    let nameExtracted = false;
    let namePosition = -1;
    let nameLength = 0;
    
    // 1. รูปแบบชื่อบริษัท: "บริษัท XXX จำกัด"
    if (!nameExtracted && !form.getValues('customerName')) {
      const companyRegex = /(บริษัท\s+[\wก-๙]+\s+จำกัด)/i;
      const companyMatch = text.match(companyRegex);
      
      if (companyMatch) {
        form.setValue('customerName', companyMatch[1]);
        nameExtracted = true;
        namePosition = text.indexOf(companyMatch[1]);
        nameLength = companyMatch[1].length;
        console.log("พบชื่อบริษัท:", companyMatch[1]);
      }
    }
    
    // 2. รูปแบบที่พบบ่อยสำหรับข้อมูลที่มีชื่อร้านค้า+ชื่อคน ตามด้วยเบอร์โทรในวงเล็บ
    // เช่น "ร้านค้า A (น้องบี) (0819876543)"
    if (!nameExtracted && lines.length >= 1 && !form.getValues('customerName')) {
      // ใช้ regex ที่มีความแม่นยำมากขึ้น
      const shopNameWithPersonRegex = /^([^(]+)(?:\s*\(([^)]+)\))?/;
      const shopNameMatch = lines[0].match(shopNameWithPersonRegex);
      
      if (shopNameMatch) {
        let fullName = '';
        
        // มีชื่อร้านค้า/บุคคล
        if (shopNameMatch[1] && shopNameMatch[1].trim()) {
          fullName = shopNameMatch[1].trim();
        }
        
        // มีชื่อคนในวงเล็บ
        if (shopNameMatch[2] && shopNameMatch[2].trim() && shopNameMatch[2].trim().length < 15) {
          // ตรวจสอบว่าในวงเล็บไม่ใช่เบอร์โทร
          if (!/^\d+$/.test(shopNameMatch[2].trim())) {
            if (fullName) {
              fullName += ' (' + shopNameMatch[2].trim() + ')';
            } else {
              fullName = shopNameMatch[2].trim();
            }
          }
        }
        
        // ถ้าพบชื่อและเป็นชื่อที่สมเหตุสมผล (ไม่ใช่ส่วนของที่อยู่)
        const addressKeywords = ['ตำบล', 'แขวง', 'อำเภอ', 'เขต', 'จังหวัด', 'รหัสไปรษณีย์'];
        if (fullName && !addressKeywords.some(word => fullName.includes(word))) {
          form.setValue('customerName', fullName);
          nameExtracted = true;
          namePosition = text.indexOf(fullName);
          nameLength = fullName.length;
          console.log("พบชื่อลูกค้ารูปแบบร้านค้า/บุคคล:", fullName);
        }
      }
    }
    
    // 3. รูปแบบคุณ/นาย/นาง ตามด้วยชื่อ
    if (!nameExtracted && !form.getValues('customerName')) {
      const titleNameRegex = /(คุณ|นาย|นาง|น\.ส\.|น\.สาว|ดร\.|ดอกเตอร์|อาจารย์)\s+([\wก-๙\s]{2,}?)(?=\s+(?:โทร|เบอร์|0\d|เลข|บ้าน|ถนน|ซอย|\d|$))/i;
      const titleNameMatch = text.match(titleNameRegex);
      
      if (titleNameMatch) {
        const fullName = titleNameMatch[0].trim();
        form.setValue('customerName', fullName);
        nameExtracted = true;
        namePosition = text.indexOf(fullName);
        nameLength = fullName.length;
        console.log("พบชื่อลูกค้าแบบมีคำนำหน้า:", fullName);
      }
    }
    
    // 4. ถ้ายังไม่พบชื่อลูกค้า ลองใช้บรรทัดแรก
    if (!nameExtracted && lines.length >= 1 && !form.getValues('customerName')) {
      // ตรวจสอบบรรทัดแรกว่าเป็นชื่อลูกค้าหรือไม่
      // ข้ามถ้าเป็นเบอร์โทรศัพท์ (ไม่ใช่ตัวเลขทั้งบรรทัด)
      const firstLine = lines[0].trim();
      if (!/^\d+$/.test(firstLine)) {
        // ตรวจสอบว่าไม่ใช่ที่อยู่ (ไม่มีคำที่เกี่ยวข้องกับที่อยู่)
        const addressRelatedWords = ['บ้านเลขที่', 'เลขที่', 'ซอย', 'ซ.', 'ถนน', 'ถ.', 'หมู่', 'ม.', 'ตำบล', 'ต.', 'แขวง', 'อำเภอ', 'อ.', 'เขต', 'จังหวัด', 'จ.', 'รหัสไปรษณีย์'];
        const isLikelyAddress = addressRelatedWords.some(word => firstLine.includes(word));
        
        // ถ้าไม่น่าจะเป็นที่อยู่ ให้ถือว่าเป็นชื่อลูกค้า
        if (!isLikelyAddress && firstLine.length < 50) { // ถ้าความยาวไม่มากเกินไป
          form.setValue('customerName', firstLine);
          nameExtracted = true;
          namePosition = text.indexOf(firstLine);
          nameLength = firstLine.length;
          console.log("พบชื่อลูกค้าจากบรรทัดแรก:", firstLine);
        }
      }
    }
    
    // ค้นหาอีเมล
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    let emailFound = false;
    
    for (const line of lines) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        form.setValue('customerEmail', emailMatch[0]);
        emailFound = true;
        console.log("พบอีเมล:", emailMatch[0]);
        break;
      }
    }
    
    // ระวัง: เมื่อวิเคราะห์ข้อมูลลูกค้าแล้ว ให้เอาเฉพาะส่วนของที่อยู่ไปวิเคราะห์ต่อ
    // กรองข้อมูลที่เป็นชื่อและเบอร์โทรออกก่อนวิเคราะห์ที่อยู่ เพื่อลดความสับสน
    let addressOnly = originalText;
    
    // ลบส่วนที่เป็นชื่อออก ถ้ารู้ตำแหน่ง
    if (namePosition >= 0 && nameLength > 0) {
      addressOnly = addressOnly.substring(0, namePosition) + ' ' + addressOnly.substring(namePosition + nameLength);
    } else if (form.getValues('customerName')) {
      // ถ้าไม่รู้ตำแหน่งแน่ชัด ลองใช้การแทนที่
      addressOnly = addressOnly.replace(form.getValues('customerName'), '');
    }
    
    // ลบส่วนที่เป็นเบอร์โทรออก ถ้ารู้ตำแหน่ง
    if (phonePosition >= 0 && phoneLength > 0) {
      addressOnly = addressOnly.substring(0, phonePosition) + ' ' + addressOnly.substring(phonePosition + phoneLength);
    } else if (form.getValues('customerPhone')) {
      // ถ้าไม่รู้ตำแหน่งแน่ชัด ลองใช้การแทนที่
      addressOnly = addressOnly.replace(form.getValues('customerPhone'), '');
    }
    
    // ลบวงเล็บว่างที่เหลือซึ่งอาจเกิดจากการลบเบอร์โทร
    addressOnly = addressOnly.replace(/\(\s*\)/g, '');
    
    // ปรับรูปแบบข้อความ ลบบรรทัดว่าง และช่องว่างไม่จำเป็น
    addressOnly = addressOnly.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    form.setValue('fullAddress', addressOnly);
    
    // วิเคราะห์ที่อยู่แยกเป็นส่วนๆ (ส่งเฉพาะข้อมูลที่อยู่ไปวิเคราะห์)
    analyzeAddress();
  };
  
  // ฟังก์ชันวิเคราะห์ข้อมูลลูกค้า (ชื่อ, เบอร์โทร, อีเมล) จากข้อความ
  // เก็บไว้เป็น alias เพื่อความเข้ากันได้กับโค้ดเดิม
  const analyzeCustomerData = (text: string | undefined) => {
    // เรียกใช้ฟังก์ชันใหม่แทน
    analyzeAllCustomerData(text);
  };
  
  // ฟังก์ชันดึงตัวเลือกการจัดส่งโดยใช้บริการขนส่งจำลอง
  const fetchShippingOptions = async () => {
    try {
      console.log("กำลังดึงข้อมูลตัวเลือกการจัดส่ง...");
      
      // สร้างตัวเลือกการจัดส่งเริ่มต้น (สำหรับกรณีเรียก API ไม่สำเร็จ)
      const defaultOptions = [
        {
          id: 'xiaobaix_express',
          name: 'เสี่ยวไป๋ เอ็กเพรส - ด่วน (1 วัน)',
          price: 60,
          deliveryTime: '1 วัน',
          provider: 'เสี่ยวไป๋ เอ็กเพรส',
          serviceId: 'xiaobaix_express',
          logo: '/assets/shipping-icon.png',
          icon: '⚡',
          isPopular: true
        },
        {
          id: 'xiaobaix_normal',
          name: 'เสี่ยวไป๋ เอ็กเพรส - ปกติ',
          price: 40,
          deliveryTime: '1-2 วัน',
          provider: 'เสี่ยวไป๋ เอ็กเพรส',
          serviceId: 'xiaobaix_normal',
          logo: '/assets/shipping-icon.png',
          icon: '🚚'
        },
        {
          id: 'speedline_economy',
          name: 'SpeedLine - ประหยัด',
          price: 35,
          deliveryTime: '2-3 วัน',
          provider: 'SpeedLine',
          serviceId: 'speedline_economy',
          logo: '/assets/shipping-icon.png',
          icon: '🚚'
        },
        {
          id: 'thaistar_premium',
          name: 'ThaiStar - พรีเมียม',
          price: 55,
          deliveryTime: '1-2 วัน',
          provider: 'ThaiStar Delivery',
          serviceId: 'thaistar_premium',
          logo: '/assets/shipping-icon.png',
          icon: '⭐'
        }
      ];
      
      // พยายามดึงข้อมูลจากบริการขนส่งจำลอง
      try {
        // สร้างข้อมูลที่อยู่สำหรับส่งไปยังบริการขนส่งจำลอง
        const address = {
          province: form.getValues('province') || 'กรุงเทพมหานคร',
          district: form.getValues('district') || 'พระนคร',
          zipcode: form.getValues('zipcode') || '10200'
        };
        
        // เรียกใช้บริการขนส่งจำลอง
        const options = await getMockShippingOptions(address, 1);
        
        if (options && options.length > 0) {
          console.log("ดึงข้อมูลตัวเลือกการจัดส่งจากบริการจำลองสำเร็จ:", options);
          
          // แปลงรูปแบบข้อมูลให้ตรงกับที่ใช้ในฟอร์ม
          const formattedOptions = options.map(option => ({
            id: option.code,
            name: `${option.providerName} - ${option.name}`,
            price: option.price,
            deliveryTime: option.estimatedDays === 0 ? 'วันนี้' : 
                         option.estimatedDays === 1 ? '1 วัน' :
                         `${option.estimatedDays} วัน`,
            provider: option.providerName,
            serviceId: option.code,
            logo: '/assets/shipping-icon.png',
            icon: option.icon || '🚚',
            isPopular: option.isPopular || false,
            isCODAvailable: option.isCODAvailable,
            maxCODAmount: option.maxCODAmount
          }));
          
          setShippingOptions(formattedOptions);
          return;
        } else {
          console.log("ไม่พบข้อมูลตัวเลือกการจัดส่งจากบริการจำลอง ใช้ข้อมูลเริ่มต้นแทน");
        }
      } catch (apiError) {
        console.error("เกิดข้อผิดพลาดในการเรียกบริการขนส่งจำลอง:", apiError);
        console.log("ใช้ข้อมูลเริ่มต้นแทน");
      }
      
      // ถ้าเรียกบริการจำลองไม่สำเร็จหรือไม่มีข้อมูล ให้ใช้ข้อมูลเริ่มต้น
      setShippingOptions(defaultOptions);
      
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
  
  // สร้างเลขพัสดุจากบริการขนส่งจำลอง
  const createMockShippingService = async (data: CreateOrderFormValues) => {
    try {
      console.log('กำลังเรียกใช้บริการขนส่งจำลองเพื่อสร้างเลขพัสดุ...');
      
      // สร้างเลขออเดอร์
      const orderNumber = `BD${Date.now()}`;
      console.log('สร้างเลขออเดอร์:', orderNumber);
      
      // แก้ไขข้อมูลจังหวัดให้ถูกต้อง
      let provinceName = data.province;
      if (provinceName === 'กรุงเทพ' || provinceName === 'กทม' || provinceName === 'กรุงเทพฯ') {
        provinceName = 'กรุงเทพมหานคร';
      }
      
      // ตรวจสอบและแก้ไขข้อมูลเบอร์โทรศัพท์ให้ถูกต้อง
      const customerPhone = data.customerPhone.replace(/[- ]/g, ''); // ลบเครื่องหมายขีดและช่องว่าง
      
      // สร้างที่อยู่รวม - ตรวจสอบว่ามีข้อมูลครบถ้วน
      const detailAddress = [
        data.houseNumber,
        data.building,
        data.floor ? `ชั้น ${data.floor}` : '',
        data.roomNumber ? `ห้อง ${data.roomNumber}` : '',
        data.village,
        data.soi,
        data.road
      ].filter(Boolean).join(' ');
      
      if (!detailAddress || detailAddress.trim() === '') {
        setAlertDialog({
          open: true,
          title: 'ที่อยู่ไม่ครบถ้วน',
          description: 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน โดยเฉพาะเลขที่บ้านหรือถนน',
          errorDetails: 'ตรวจสอบข้อมูลที่อยู่ในแท็บข้อมูลลูกค้า'
        });
        throw new Error('ที่อยู่ไม่ครบถ้วน กรุณากรอกเลขที่บ้านหรือถนน');
      }
      
      // ข้อมูลผู้ส่ง
      const sender = {
        name: senderInfo?.name || 'บริษัท บลูแดช จำกัด',
        phone: senderInfo?.phone || '0812345678',
        address: {
          province: senderInfo?.province || 'กรุงเทพมหานคร',
          district: senderInfo?.district || 'คลองเตย',
          subdistrict: senderInfo?.subdistrict || 'คลองเตย',
          zipcode: senderInfo?.zipcode || '10110',
          addressLine1: senderInfo?.address || '123 ถนนสุขุมวิท'
        }
      };
      
      // ข้อมูลผู้รับ
      const recipient = {
        name: data.customerName,
        phone: customerPhone,
        address: {
          province: provinceName,
          district: data.district,
          subdistrict: data.subdistrict,
          zipcode: data.zipcode,
          addressLine1: detailAddress
        }
      };
      
      // คำนวณน้ำหนักและมูลค่าสินค้า
      const totalValue = data.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      // ข้อมูลรายละเอียดการจัดส่ง
      const shipmentDetails = {
        weight: 1, // น้ำหนักเริ่มต้น 1 กิโลกรัม
        dimensions: {
          width: 20,
          height: 10,
          length: 30
        },
        value: totalValue,
        isCOD: data.isCOD,
        codAmount: data.isCOD ? data.codAmount : undefined
      };
      
      // ดึง serviceId จากชื่อบริการที่เลือก
      const selectedShipping = shippingOptions.find(option => option.name === data.shippingMethod);
      const shippingCode = selectedShipping?.serviceId || 'xiaobaix_normal';
      
      console.log('ข้อมูลการจัดส่ง:', {
        sender,
        recipient,
        details: shipmentDetails,
        shippingCode
      });
      
      try {
        // เรียกใช้บริการขนส่งจำลอง
        const result = await createMockShipment(sender, recipient, shipmentDetails, shippingCode);
        console.log('ผลการสร้างเลขพัสดุ:', result);
        
        if (result && result.trackingNumber) {
          console.log('สร้างเลขพัสดุสำเร็จ:', result.trackingNumber);
          
          // ส่งข้อมูลกลับไปยังฟังก์ชัน onSubmit
          return {
            orderNumber,
            trackingNumber: result.trackingNumber,
            sortCode: '00' // ในบริการจำลองไม่มี sortCode จึงใช้ค่าเริ่มต้น
          };
        } else {
          throw new Error('ไม่ได้รับเลขพัสดุจากบริการขนส่ง');
        }
      } catch (apiError: any) {
        console.error('เกิดข้อผิดพลาดในการสร้างเลขพัสดุ:', apiError);
        
        setAlertDialog({
          open: true,
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถสร้างเลขพัสดุจากบริการขนส่งจำลองได้',
          errorDetails: apiError.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
        });
        
        throw new Error(`ไม่สามารถสร้างเลขพัสดุได้: ${apiError.message}`);
      }
    } catch (error: any) {
      console.error('Error creating mock shipping:', error);
      throw error;
    }
  };
  
  // ฟังก์ชันการเลือกวิธีการจัดส่ง
  const handleShippingSelect = (shippingId: string | number) => {
    const selectedShipping = shippingOptions.find(s => s.id === shippingId);
    if (selectedShipping) {
      console.log('เลือกตัวเลือกการจัดส่ง:', selectedShipping);
      form.setValue('shippingMethod', selectedShipping.name);
      form.setValue('shippingCost', selectedShipping.price);
      
      // ตรวจสอบว่าตัวเลือกนี้รองรับ COD หรือไม่
      if (selectedShipping.isCODAvailable === false && form.getValues('isCOD')) {
        toast({
          title: 'ไม่รองรับ COD',
          description: 'บริการจัดส่งนี้ไม่รองรับการเก็บเงินปลายทาง',
          variant: 'destructive',
        });
        form.setValue('isCOD', false);
      }
    }
  };
  
  // ฟังก์ชันตรวจสอบและส่งข้อมูลฟอร์ม
  const onSubmit = async (data: CreateOrderFormValues) => {
    setIsLoading(true);
    
    try {
      // สร้างข้อมูลสำหรับส่งไปยังเซิร์ฟเวอร์
      const orderData = { ...data };
      
      // เรียกใช้บริการขนส่งจำลองเพื่อสร้างเลขพัสดุ
      let shippingInfo;
      try {
        shippingInfo = await createMockShippingService(data);
        console.log('ได้รับข้อมูลการจัดส่งจากบริการขนส่งจำลอง:', shippingInfo);
        
        // เพิ่มข้อมูลเลขพัสดุและรหัสการเรียงลำดับเข้าไปในออเดอร์
        orderData.orderNumber = shippingInfo.orderNumber;
        orderData.trackingNumber = shippingInfo.trackingNumber;
        orderData.sortCode = shippingInfo.sortCode;
        
        // ส่งข้อมูลไปยังเซิร์ฟเวอร์เมื่อได้รับเลขพัสดุจริงเท่านั้น
        console.log('กำลังส่งข้อมูลออเดอร์ไปยังเซิร์ฟเวอร์:', orderData);
        const response = await api.post('/api/orders', orderData);
        
        if (response.data.success) {
          // แสดง dialog ยืนยันการสร้างออเดอร์สำเร็จ แทนการไปหน้าอื่นทันที
          setDialog({
            open: true,
            title: 'สร้างออเดอร์สำเร็จ',
            description: 'ออเดอร์ของคุณได้ถูกบันทึกเรียบร้อยแล้ว',
            orderNumber: response.data.order.id || orderData.orderNumber,
            trackingNumber: orderData.trackingNumber
          });
          
          // เคลียร์ฟอร์ม
          form.reset();
        } else {
          throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการสร้างออเดอร์');
        }
      } catch (shippingError: any) {
        console.error('เกิดข้อผิดพลาดในการสร้างเลขพัสดุ:', shippingError);
        
        // ไม่ว่าจะเป็น COD หรือไม่ ถ้าไม่สามารถสร้างเลขพัสดุได้ จะแจ้งเตือนและยกเลิกการสร้างออเดอร์
        setAlertDialog({
          open: true,
          title: 'ไม่สามารถสร้างเลขพัสดุได้',
          description: 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
          errorDetails: shippingError.message || 'ไม่สามารถเชื่อมต่อกับบริการขนส่งได้'
        });
        
        // ยกเลิกการสร้างออเดอร์เมื่อไม่สามารถรับเลขพัสดุได้
        throw new Error('ไม่สามารถสร้างเลขพัสดุจากบริการขนส่งได้');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      // แสดงข้อมูลข้อผิดพลาดเพิ่มเติมเพื่อการดีบัก
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
        console.error('Response error headers:', error.response.headers);
      }
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างออเดอร์ได้ โปรดลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // เรียกใช้ Flash Express API สำหรับสร้างเลขพัสดุ
  const createFlashExpressShipping = async (data: CreateOrderFormValues) => {
    try {
      console.log('กำลังเรียกใช้ Flash Express API เพื่อสร้างเลขพัสดุ...');
      
      // สร้างเลขออเดอร์
      const orderNumber = `PD${Date.now()}`;
      console.log('สร้างเลขออเดอร์:', orderNumber);
      
      // แก้ไขข้อมูลจังหวัดให้ถูกต้องตามรูปแบบที่ Flash Express ต้องการ
      let provinceName = data.province;
      if (provinceName === 'กรุงเทพ' || provinceName === 'กทม' || provinceName === 'กรุงเทพฯ') {
        provinceName = 'กรุงเทพมหานคร';
      }
      
      // ตรวจสอบและแก้ไขข้อมูลเบอร์โทรศัพท์ให้ถูกต้อง
      const customerPhone = data.customerPhone.replace(/[- ]/g, ''); // ลบเครื่องหมายขีดและช่องว่าง
      
      // สร้างที่อยู่รวม - ตรวจสอบว่ามีข้อมูลครบถ้วน
      const detailAddress = [
        data.houseNumber,
        data.building,
        data.floor ? `ชั้น ${data.floor}` : '',
        data.roomNumber ? `ห้อง ${data.roomNumber}` : '',
        data.village,
        data.soi,
        data.road
      ].filter(Boolean).join(' ');
      
      if (!detailAddress || detailAddress.trim() === '') {
        setAlertDialog({
          open: true,
          title: 'ที่อยู่ไม่ครบถ้วน',
          description: 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน โดยเฉพาะเลขที่บ้านหรือถนน',
          errorDetails: 'ตรวจสอบข้อมูลที่อยู่ในแท็บข้อมูลลูกค้า'
        });
        throw new Error('ที่อยู่ไม่ครบถ้วน กรุณากรอกเลขที่บ้านหรือถนน');
      }
      
      // ข้อมูลที่จะส่งไปยัง Flash Express API
      const flashExpressData = {
        outTradeNo: orderNumber,
        srcName: 'บริษัท เพอร์เพิลแดช จำกัด', // ชื่อบริษัทผู้ส่ง (สามารถดึงจากระบบ)
        srcPhone: '0812345678', // เบอร์โทรผู้ส่ง (สามารถดึงจากระบบ)
        srcProvinceName: 'กรุงเทพมหานคร', // จังหวัดของผู้ส่ง (สามารถดึงจากระบบ)
        srcCityName: 'คลองเตย', // อำเภอของผู้ส่ง (สามารถดึงจากระบบ)
        srcDistrictName: 'คลองเตย', // ตำบลของผู้ส่ง (สามารถดึงจากระบบ)
        srcPostalCode: '10110', // รหัสไปรษณีย์ของผู้ส่ง (สามารถดึงจากระบบ)
        srcDetailAddress: '123 ถนนสุขุมวิท', // ที่อยู่โดยละเอียดของผู้ส่ง (สามารถดึงจากระบบ)
        
        // ข้อมูลผู้รับ
        dstName: data.customerName,
        dstPhone: customerPhone,
        dstProvinceName: provinceName,
        dstCityName: data.district,
        dstDistrictName: data.subdistrict,
        dstPostalCode: data.zipcode,
        
        // สร้างที่อยู่รวม
        dstDetailAddress: detailAddress,
        
        // ข้อมูลพัสดุ
        articleCategory: 1, // ประเภทสินค้า (1: เสื้อผ้า/สิ่งทอ)
        expressCategory: 1, // ประเภทการจัดส่ง (1: ปกติ)
        weight: 1500, // น้ำหนัก (กรัม)
        width: 20, // ความกว้าง (ซม.)
        length: 30, // ความยาว (ซม.)
        height: 10, // ความสูง (ซม.)
        insured: 0, // ไม่ซื้อประกัน
        
        // ข้อมูล COD
        codEnabled: data.isCOD ? 1 : 0,
        codAmount: data.isCOD && data.codAmount ? Math.round(data.codAmount * 100) : undefined,
        
        // รายละเอียดสินค้า
        subItemTypes: data.items.map(item => ({
          itemName: item.name,
          itemWeightSize: "กลาง",
          itemColor: "ขาว", // ต้องระบุสีตามที่ Flash Express API ต้องการ
          itemQuantity: item.quantity
        }))
      };
      
      console.log('ส่งข้อมูลไปยัง Flash Express API:', JSON.stringify(flashExpressData, null, 2));
      
      try {
        // แก้ไขจาก apiRequest เป็น api.post (ใช้ axios interceptor ที่จัดการ token ไว้แล้ว)
        // เพื่อให้ทำงานได้ถูกต้องบนอุปกรณ์ iPad
        const response = await api.post('/api/shipping/create', flashExpressData);
        console.log('Flash Express API response:', response.data);
        
        if (response.data.success && response.data.trackingNumber) {
          console.log('สร้างเลขพัสดุสำเร็จ:', response.data.trackingNumber);
          
          // เพิ่มเลขพัสดุเข้าไปในข้อมูลออเดอร์
          return {
            orderNumber,
            trackingNumber: response.data.trackingNumber,
            sortCode: response.data.sortCode
          };
        } else {
          // ถ้าไม่มี success หรือไม่มี trackingNumber (แต่ไม่มี error)
          console.error('Flash Express API response ไม่มีข้อมูลที่จำเป็น:', response.data);
          
          setAlertDialog({
            open: true,
            title: 'ไม่สามารถสร้างเลขพัสดุได้',
            description: 'ไม่สามารถสร้างเลขพัสดุจาก Flash Express API ได้',
            errorDetails: response.data.message || 'API ไม่ตอบสนองหรือข้อมูลไม่ครบถ้วน โปรดตรวจสอบข้อมูลให้ถูกต้อง'
          });
          
          throw new Error('ไม่สามารถสร้างเลขพัสดุจาก Flash Express API ได้');
        }
      } catch (apiError: any) {
        console.error('Flash Express API error', apiError);
        
        // บันทึกรายละเอียดข้อผิดพลาดจาก API
        let errorMessage = 'ไม่สามารถเชื่อมต่อกับ Flash Express API ได้';
        let errorDetails = 'โปรดตรวจสอบการเชื่อมต่อเครือข่ายหรือลองใหม่ในภายหลัง';
        
        if (apiError.response) {
          console.error('API Error response:', apiError.response.data);
          errorMessage = apiError.response.data.message || 'มีข้อผิดพลาดจาก Flash Express API';
          errorDetails = JSON.stringify({
            status: apiError.response.status,
            data: apiError.response.data
          }, null, 2);
        }
        
        // แสดงป๊อปอัพแจ้งเตือนข้อผิดพลาด
        setAlertDialog({
          open: true,
          title: 'ไม่สามารถสร้างเลขพัสดุได้',
          description: errorMessage,
          errorDetails: errorDetails
        });
        
        throw apiError;
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการเรียก Flash Express API:', error);
      
      // กรณีไม่ใช่ข้อผิดพลาดจากการเรียก API โดยตรง
      // แสดงป๊อปอัพแจ้งเตือนข้อผิดพลาดตั้งต้น
      if (error.message && !alertDialog.open) {
        setAlertDialog({
          open: true,
          title: 'ไม่สามารถสร้างเลขพัสดุได้',
          description: error.message,
          errorDetails: 'โปรดตรวจสอบข้อมูลและลองใหม่อีกครั้ง'
        });
      }
      
      throw new Error(`ไม่สามารถสร้างเลขพัสดุ: ${error.message}`);
    }
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

    // หากเป็นแท็บ address ให้ข้ามไปที่ products แทน
    if (value === "address") {
      value = "products";
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
                  
                  {/* ขั้นตอนที่ 1: ข้อมูลลูกค้าและที่อยู่จัดส่ง */}
                  <TabsContent value="customer">
                    <Card className="border border-purple-100 shadow-lg shadow-purple-100/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                        <div className="flex items-center">
                          <div className="bg-purple-600 p-2 rounded-lg mr-3 text-white">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-purple-800">
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mr-2">ขั้นตอนที่ 1</span>
                              ข้อมูลลูกค้าและที่อยู่จัดส่ง
                            </CardTitle>
                            <CardDescription className="text-purple-600/70">
                              วางข้อมูลลูกค้าและที่อยู่ (Copy & Paste) เพื่อแยกข้อมูลอัตโนมัติ
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        {/* ส่วนวิเคราะห์ข้อมูลลูกค้าและที่อยู่อัตโนมัติ */}
                        <FormField
                          control={form.control}
                          name="fullAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ข้อมูลลูกค้าและที่อยู่ทั้งหมด</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="วางข้อมูลทั้งหมดที่นี่ เช่น ร้านบางกอก (คุณสมชาย) 0812345678 บ้านเลขที่ 123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110" 
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
                                  {processingAddress ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ข้อมูล'}
                                </Button>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                          <h3 className="text-purple-800 font-semibold mb-3">ข้อมูลลูกค้า</h3>
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

                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="text-purple-800 font-semibold mb-3">ที่อยู่จัดส่ง</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <FormField
                              control={form.control}
                              name="houseNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>บ้านเลขที่และถนน <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="บ้านเลขที่และถนน" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          

                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={form.control}
                              name="province"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>จังหวัด <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="กรุณาระบุจังหวัด" 
                                      {...field} 
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        // ล้างค่าอำเภอและตำบลที่เลือกไว้ เมื่อมีการเปลี่ยนจังหวัด
                                        form.setValue('district', '');
                                        form.setValue('subdistrict', '');
                                        form.setValue('zipcode', '');
                                      }}
                                    />
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
                                    <Input 
                                      placeholder="กรุณาระบุอำเภอ/เขต" 
                                      {...field} 
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        // ล้างค่าตำบลและรหัสไปรษณีย์ที่เลือกไว้ เมื่อมีการเปลี่ยนอำเภอ
                                        form.setValue('subdistrict', '');
                                        form.setValue('zipcode', '');
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={form.control}
                              name="subdistrict"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ตำบล/แขวง <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="กรุณาระบุตำบล/แขวง" 
                                      {...field}
                                    />
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
                                    <Input placeholder="10xxx" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="pt-4 flex justify-end">
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

                  {/* ขั้นตอนที่ 2: เพิ่มสินค้า */}
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
                            onClick={() => handleTabChange('customer')}
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
                        
                        {/* เพิ่มปุ่มใช้ข้อมูลผู้ส่งจากโปรไฟล์ */}
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              // ใช้ข้อมูลผู้ส่งจากโปรไฟล์
                              if (senderInfo) {
                                // กำหนดค่าฟิลด์ที่เกี่ยวข้องในฟอร์ม
                                if (senderInfo.name) form.setValue('customerName', `ผู้ส่ง: ${senderInfo.name}`);
                                if (senderInfo.phone) form.setValue('customerPhone', senderInfo.phone);
                                
                                // ถ้ามีข้อมูลที่อยู่ของผู้ส่ง ก็กำหนดค่าในฟอร์ม
                                let addressFields = '';
                                if (senderInfo.address) addressFields += senderInfo.address + ' ';
                                if (senderInfo.subdistrict) addressFields += senderInfo.subdistrict + ' ';
                                if (senderInfo.district) addressFields += senderInfo.district + ' ';
                                if (senderInfo.province) addressFields += senderInfo.province + ' ';
                                if (senderInfo.zipcode) addressFields += senderInfo.zipcode;
                                
                                if (addressFields.trim()) {
                                  form.setValue('fullAddress', addressFields.trim());
                                  
                                  // วิเคราะห์ที่อยู่ที่ได้จากผู้ส่ง
                                  const addressComponents = parseCustomerAndAddressData(addressFields);
                                  
                                  // กำหนดค่าให้ฟิลด์ต่างๆ
                                  if (senderInfo.address) form.setValue('houseNumber', senderInfo.address);
                                  if (senderInfo.subdistrict) form.setValue('subdistrict', senderInfo.subdistrict);
                                  if (senderInfo.district) form.setValue('district', senderInfo.district);
                                  if (senderInfo.province) form.setValue('province', senderInfo.province);
                                  if (senderInfo.zipcode) form.setValue('zipcode', senderInfo.zipcode);
                                }
                                
                                toast({
                                  title: 'ใช้ข้อมูลผู้ส่งจากโปรไฟล์',
                                  description: 'กำหนดข้อมูลผู้ส่งจากโปรไฟล์ของคุณสำเร็จ',
                                });
                              } else {
                                toast({
                                  title: 'ไม่พบข้อมูลผู้ส่ง',
                                  description: 'กรุณากำหนดข้อมูลผู้ส่งในหน้าตั้งค่าโปรไฟล์',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <User className="mr-2 h-4 w-4" />
                            ใช้ข้อมูลผู้ส่งจากโปรไฟล์
                          </Button>
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

                              <br />
                              ต.{form.getValues('subdistrict')} อ.{form.getValues('district')} 
                              <br />
                              จ.{form.getValues('province')} {form.getValues('zipcode')}
                            </p>
                          </div>
                          
                          <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <h3 className="font-medium text-purple-900 mb-2">รายการสินค้า</h3>
                            <div className="space-y-2">
                              {(form.getValues('items') || []).map((item, index) => (
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
                                <span className="font-medium">฿{(form.getValues('shippingCost') || 0).toLocaleString()}</span>
                              </div>
                              {form.getValues('isCOD') && (
                                <div className="flex justify-between">
                                  <span>เก็บเงินปลายทาง (COD):</span>
                                  <span className="font-medium text-orange-600">฿{(form.getValues('codAmount') || 0).toLocaleString()}</span>
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
                            type="button"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                            disabled={isLoading}
                            onClick={() => {
                              console.log('กดปุ่มสร้างออเดอร์');
                              const formValues = form.getValues();
                              console.log('ค่าในฟอร์ม:', formValues);
                              onSubmit(formValues);
                            }}
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
                <p className="text-sm text-gray-500">เลขออเดอร์:</p>
                <p className="font-semibold">{dialog.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">เลขพัสดุ:</p>
                <p className="font-semibold">{dialog.trackingNumber}</p>
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

export default CreateOrderTabsPage;