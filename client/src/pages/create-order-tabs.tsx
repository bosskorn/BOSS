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
  
  // ไม่ต้องใช้สถานะสำหรับเก็บข้อมูลจังหวัด อำเภอ และตำบลอีกต่อไป
  // เนื่องจากเราเปลี่ยนมาใช้การกรอกข้อมูลแทนการเลือก
  
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
  
  // ฟังก์ชันช่วยแยกประเภทข้อมูลที่อยู่จากข้อความ - ปรับปรุงใหม่เพื่อประสิทธิภาพที่ดีขึ้น
  const parseAddressFromText = (text: string): AddressComponents => {
    const components: AddressComponents = {};
    
    // ทำความสะอาดข้อความก่อนวิเคราะห์
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const addressText = lines.join(' ');
    
    console.log("กำลังวิเคราะห์ที่อยู่:", addressText);
    
    // ดึงรหัสไปรษณีย์ (เป็นตัวเลข 5 หลัก)
    const zipRegex = /\b(\d{5})\b/;
    const zipMatch = addressText.match(zipRegex);
    if (zipMatch) {
      components.zipcode = zipMatch[1];
      console.log("พบรหัสไปรษณีย์:", components.zipcode);
    }
    
    // ดึงเลขที่บ้าน (มีหลายรูปแบบ)
    // 1. รูปแบบที่มีคำนำหน้า "เลขที่" หรือ "บ้านเลขที่"
    const houseNumberWithPrefixRegex = /(เลขที่|บ้านเลขที่|บ้าน|เลข)\s*([0-9\/]+)/i;
    const houseNumberWithPrefixMatch = addressText.match(houseNumberWithPrefixRegex);
    
    // 2. รูปแบบที่เป็นเลขที่บ้านแบบง่าย (ตัวเลข หรือ ตัวเลข/ตัวเลข ที่ขึ้นต้นประโยค)
    const simpleHouseNumberRegex = /^([0-9\/]+)(?:\s|,)/;
    
    // 3. รูปแบบเลขที่บ้านทั่วไป (ตัวเลขที่ตามด้วยช่องว่างหรือเครื่องหมายจุลภาค)
    const generalHouseNumberRegex = /\b(\d+\/\d+|\d+)\b/;
    
    if (houseNumberWithPrefixMatch) {
      components.houseNumber = houseNumberWithPrefixMatch[2].trim();
      console.log("พบเลขที่บ้าน (จากคำนำหน้า):", components.houseNumber);
    } else {
      const simpleMatch = lines[0]?.match(simpleHouseNumberRegex);
      if (simpleMatch) {
        components.houseNumber = simpleMatch[1].trim();
        console.log("พบเลขที่บ้าน (แบบง่าย):", components.houseNumber);
      } else {
        const generalMatch = addressText.match(generalHouseNumberRegex);
        if (generalMatch && !components.zipcode?.includes(generalMatch[1])) {
          components.houseNumber = generalMatch[1].trim();
          console.log("พบเลขที่บ้าน (ทั่วไป):", components.houseNumber);
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
    
    const districtWithPrefixMatch = addressText.match(districtWithPrefixRegex);
    const subdistrictWithPrefixMatch = addressText.match(subdistrictWithPrefixRegex);
    
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
    const words = addressText.split(/\s+|,+/).filter(Boolean);
    
    // คำที่ควรข้ามในการวิเคราะห์
    const skipWords = ['ซอย', 'ซ.', 'ถนน', 'ถ.', 'หมู่', 'ม.', 'หมู่บ้าน', 'อาคาร', 'คอนโด', 'เพลส', 'แมนชั่น', 'อพาร์ทเม้นท์', 'แฟลต', 'เรสซิเดนซ์'];
    
    // รายชื่ออำเภอและตำบลที่มีชื่อเดียวกัน (มักพบในกรุงเทพฯ)
    const commonDistrictNames = [
      'ลาดพร้าว', 'บางนา', 'บางเขน', 'จตุจักร', 'ดินแดง', 'ห้วยขวาง', 'บางกะปิ', 'คลองเตย', 
      'พระโขนง', 'ดอนเมือง', 'หลักสี่', 'สายไหม', 'บางซื่อ', 'จอมทอง', 'ราษฎร์บูรณะ', 
      'คลองสาน', 'บางกอกน้อย', 'บางกอกใหญ่', 'ดุสิต', 'พญาไท', 'ราชเทวี', 'ปทุมวัน', 
      'ยานนาวา', 'สาทร', 'บางคอแหลม', 'บางพลัด', 'ภาษีเจริญ', 'หนองแขม', 'ทุ่งครุ', 
      'บางขุนเทียน', 'บางบอน', 'พระนคร', 'ป้อมปราบ', 'สัมพันธวงศ์', 'คลองสามวา',
      'หนองจอก', 'ลาดกระบัง', 'มีนบุรี', 'บึงกุ่ม', 'ประเวศ', 'สวนหลวง', 'คันนายาว', 
      'สะพานสูง', 'วังทองหลาง'
    ];
    
    // ถ้ายังไม่พบอำเภอ/เขต หรือ ตำบล/แขวง ให้ค้นหาจากชื่อที่พบบ่อย
    if (!components.district || !components.subdistrict) {
      for (const districtName of commonDistrictNames) {
        const districtRegex = new RegExp(`\\b${districtName}\\b`, 'i');
        if (districtRegex.test(addressText)) {
          // นับจำนวนครั้งที่ชื่อนี้ปรากฏในข้อความ
          // นับเฉพาะคำที่ตรงกันแบบเต็มคำ
          const occurrences = words.filter(word => {
            return word.toLowerCase() === districtName.toLowerCase();
          }).length;
          
          console.log(`พบคำว่า "${districtName}" จำนวน ${occurrences} ครั้ง`);
          
          // ถ้าพบมากกว่า 1 ครั้ง อาจเป็นทั้งเขตและแขวง
          if (occurrences >= 2) {
            if (!components.district) {
              components.district = districtName;
              console.log("กำหนดเป็นเขต/อำเภอ:", districtName);
            }
            if (!components.subdistrict) {
              components.subdistrict = districtName;
              console.log("กำหนดเป็นแขวง/ตำบล:", districtName);
            }
          } 
          // ถ้าพบครั้งเดียว
          else {
            // ถ้ายังไม่มีเขต/อำเภอ ให้กำหนดเป็นเขต/อำเภอก่อน
            if (!components.district) {
              components.district = districtName;
              console.log("กำหนดเป็นเขต/อำเภอ (พบครั้งเดียว):", districtName);
            }
            // ถ้ามีเขต/อำเภอแล้ว แต่ยังไม่มีแขวง/ตำบล ให้กำหนดเป็นแขวง/ตำบล
            else if (!components.subdistrict && components.district !== districtName) {
              components.subdistrict = districtName;
              console.log("กำหนดเป็นแขวง/ตำบล (พบครั้งเดียว):", districtName);
            }
          }
        }
      }
    }
    
    // หากยังไม่พบแขวง/ตำบล หรือ เขต/อำเภอ ให้วิเคราะห์จากคำทั่วไปที่เหลือ
    if (!components.district || !components.subdistrict) {
      // ค้นหา "ลาดพร้าว" ก่อนเป็นพิเศษ (เคสที่พบบ่อย)
      if (addressText.includes("ลาดพร้าว") && !components.district) {
        components.district = "ลาดพร้าว";
        console.log("กำหนดเขต/อำเภอเป็น 'ลาดพร้าว' (พบในข้อความ)");
      }
      
      // กรองคำที่ไม่เกี่ยวข้องออก
      const relevantWords = words.filter(word => {
        // ตัดเครื่องหมายต่างๆ ออก
        word = word.replace(/["']/g, '');
        
        // ข้ามคำที่เป็นเบอร์โทรศัพท์ 9-10 หลัก (เริ่มต้นด้วย 0)
        if (/^0\d{8,9}$/.test(word)) {
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
            (components.village && components.village.includes(word))) {
          return false;
        }
        
        // ข้ามคำที่เป็นชื่อจังหวัด
        if (provinceNames.some(province => province.toLowerCase() === word.toLowerCase())) {
          return false;
        }
        
        // ข้ามคำที่น่าจะเป็นชื่อลูกค้า (เช่น น้องซี, พี่ต้น)
        const likelyThaiNamePrefixes = ['น้อง', 'พี่', 'คุณ', 'ป้า', 'ลุง', 'นาย', 'นาง', 'น.ส.'];
        if (likelyThaiNamePrefixes.some(prefix => word.startsWith(prefix))) {
          return false;
        }
        
        return true;
      });
      
      console.log("คำที่เหลือสำหรับวิเคราะห์:", relevantWords);
      
      // ตรวจสอบชื่อเขตที่พบบ่อยใน contextual analysis
      if (!components.district && components.province && components.province.includes("กรุงเทพ")) {
        // อันดับแรกตรวจสอบจากคำที่มีในข้อความ
        for (const districtName of commonDistrictNames) {
          const districtRegex = new RegExp(`\\b${districtName}\\b`, 'i');
          if (districtRegex.test(addressText)) {
            components.district = districtName;
            console.log("กำหนดเขตกรุงเทพฯ:", districtName);
            break;
          }
        }
      }
      
      // ถ้ามีคำที่เหลือ และยังไม่พบเขต/อำเภอ
      if (relevantWords.length > 0 && !components.district) {
        // ตรวจสอบว่าคำแรกน่าจะเป็นชื่อถนนหรือไม่
        if (commonRoadNames.includes(relevantWords[0])) {
          // ถ้าเป็นชื่อถนน ให้ข้ามไป
          console.log("ข้ามคำแรกเพราะเป็นชื่อถนน:", relevantWords[0]);
          
          if (relevantWords.length > 1) {
            components.district = relevantWords[1];
            console.log("กำหนดเขต/อำเภอจากคำที่เหลือ:", components.district);
          }
        } else {
          components.district = relevantWords[0];
          console.log("กำหนดเขต/อำเภอจากคำที่เหลือ:", components.district);
        }
      }
      
      // ถ้ามีคำที่เหลือมากกว่า 1 คำ และยังไม่พบแขวง/ตำบล
      if (relevantWords.length > 1 && !components.subdistrict) {
        // ตรวจสอบว่าคำที่สองน่าจะเป็นชื่อถนนหรือไม่
        if (commonRoadNames.includes(relevantWords[1])) {
          // ถ้าเป็นชื่อถนน และมีคำที่สาม ให้ใช้คำที่สาม
          if (relevantWords.length > 2) {
            components.subdistrict = relevantWords[2];
            console.log("กำหนดแขวง/ตำบลจากคำที่เหลือ (ข้ามถนน):", components.subdistrict);
          }
        } else {
          components.subdistrict = relevantWords[1];
          console.log("กำหนดแขวง/ตำบลจากคำที่เหลือ:", components.subdistrict);
        }
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
    
    // กำหนดข้อมูลที่ต้องการค้นหาและประมวลผล
    form.setValue('fullAddress', text); // ตั้งค่าข้อความเต็มไว้ก่อน
    
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
    
    // ค้นหาชื่อลูกค้า (มักเป็นบรรทัดแรก)
    if (lines.length >= 1 && !form.getValues('customerName')) {
      // ถ้าบรรทัดแรกไม่ใช่เบอร์โทรศัพท์ (ไม่ใช่ตัวเลขทั้งบรรทัด)
      if (!/^\d+$/.test(lines[0])) {
        form.setValue('customerName', lines[0].trim());
      }
    }
    
    // ค้นหาเบอร์โทรศัพท์
    let phoneFound = false;
    
    // 1. ค้นหาเบอร์โทรในบรรทัดที่ 2 (กรณีที่เป็นตัวเลข 9-10 หลักเท่านั้น)
    if (lines.length >= 2 && !phoneFound) {
      const secondLine = lines[1].trim().replace(/[\s-]/g, '');
      if (/^\d{9,10}$/.test(secondLine)) {
        form.setValue('customerPhone', secondLine);
        phoneFound = true;
      }
    }
    
    // 2. หากไม่พบในบรรทัดที่สอง ค้นหาเบอร์โทรในทุกบรรทัด ในรูปแบบต่างๆ
    if (!phoneFound) {
      // รูปแบบที่มีคำนำหน้า (โทร, เบอร์, tel:, etc.)
      const phoneWithPrefixRegex = /(?:โทร|เบอร์|tel|phone|:|\+66|0)[:\s]*(\d[\d\s-]{8,})/i;
      
      // รูปแบบเบอร์โทร 9-10 หลักที่ไม่มีคำนำหน้า
      const simplePhoneRegex = /\b(\d{9,10})\b/;
      
      // ค้นหาในทุกบรรทัด กรณีที่เบอร์โทรมีคำนำหน้า
      for (const line of lines) {
        const phoneMatch = line.match(phoneWithPrefixRegex);
        if (phoneMatch) {
          const cleanPhone = phoneMatch[1].replace(/[\s-]/g, '');
          form.setValue('customerPhone', cleanPhone);
          phoneFound = true;
          break;
        }
      }
      
      // ถ้ายังไม่พบ ค้นหาเบอร์โทรแบบง่ายในทุกบรรทัด
      if (!phoneFound) {
        for (const line of lines) {
          const simplePhoneMatch = line.match(simplePhoneRegex);
          if (simplePhoneMatch) {
            // ตรวจสอบว่าเป็นเบอร์โทรที่ถูกต้อง (ไม่ใช่รหัสไปรษณีย์หรือตัวเลขอื่นๆ)
            const potentialPhone = simplePhoneMatch[1];
            
            // เบอร์โทรของไทยมักขึ้นต้นด้วย 0
            if (potentialPhone.startsWith('0')) {
              form.setValue('customerPhone', potentialPhone);
              phoneFound = true;
              break;
            }
          }
        }
      }
      
      // ถ้ายังไม่พบ ให้ตรวจสอบบรรทัดแรกว่าเป็นตัวเลขเพียงอย่างเดียวหรือไม่
      if (!phoneFound && lines.length > 0) {
        const firstLine = lines[0].trim().replace(/[\s-]/g, '');
        if (/^\d{9,10}$/.test(firstLine)) {
          form.setValue('customerPhone', firstLine);
          
          // ถ้าบรรทัดแรกเป็นเบอร์โทร ให้ใช้บรรทัดที่สองเป็นชื่อแทน (ถ้ามี)
          if (lines.length >= 2 && !form.getValues('customerName')) {
            form.setValue('customerName', lines[1].trim());
          }
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
        break;
      }
    }
    
    // ระวัง: เมื่อวิเคราะห์ข้อมูลลูกค้าแล้ว ให้เอาเฉพาะส่วนของที่อยู่ไปวิเคราะห์ต่อ
    // กรองข้อมูลที่เป็นชื่อและเบอร์โทรออกก่อนวิเคราะห์ที่อยู่ เพื่อลดความสับสน
    let addressOnly = text;
    
    // ลบส่วนที่เป็นชื่อออก (บรรทัดแรก)
    if (lines.length >= 1 && form.getValues('customerName')) {
      addressOnly = addressOnly.replace(form.getValues('customerName'), '');
    }
    
    // ลบส่วนที่เป็นเบอร์โทรออก
    if (form.getValues('customerPhone')) {
      addressOnly = addressOnly.replace(form.getValues('customerPhone'), '');
    }
    
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
                                  placeholder="วางข้อมูลทั้งหมดที่นี่ เช่น FH-ลาดพร้าว54(0919866556) 372 ถ. ลาดพร้าววังหิน ลาดพร้าว ลาดพร้าว กรุงเทพ 10230" 
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
                                  {processingAddress ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ข้อมูลอัตโนมัติ'}
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
                          <FormField
                            control={form.control}
                            name="customerEmail"
                            render={({ field }) => (
                              <FormItem className="mt-4">
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
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="text-purple-800 font-semibold mb-3">ที่อยู่จัดส่ง</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <FormField
                              control={form.control}
                              name="village"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>หมู่บ้าน/คอนโด</FormLabel>
                                  <FormControl>
                                    <Input placeholder="ชื่อหมู่บ้านหรือคอนโด (ถ้ามี)" {...field} />
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