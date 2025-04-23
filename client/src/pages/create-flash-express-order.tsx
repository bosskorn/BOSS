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

const orderFormSchema = z.object({
  // ข้อมูลผู้ส่ง
  senderName: z.string().min(2, 'กรุณาระบุชื่อผู้ส่ง'),
  senderPhone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง'),
  senderAddress: z.object({
    address: z.string().min(5, 'กรุณาระบุที่อยู่'),
    province: z.string().min(1, 'กรุณาเลือกจังหวัด'),
    district: z.string().min(1, 'กรุณาเลือกอำเภอ/เขต'),
    subdistrict: z.string().min(1, 'กรุณาเลือกตำบล/แขวง'),
    zipcode: z.string().min(5, 'กรุณาระบุรหัสไปรษณีย์'),
  }),

  // ข้อมูลผู้รับ
  recipientName: z.string().min(2, 'กรุณาระบุชื่อผู้รับ'),
  recipientPhone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง'),
  recipientAddress: z.object({
    address: z.string().min(5, 'กรุณาระบุที่อยู่'),
    province: z.string().min(1, 'กรุณาเลือกจังหวัด'),
    district: z.string().min(1, 'กรุณาเลือกอำเภอ/เขต'),
    subdistrict: z.string().min(1, 'กรุณาเลือกตำบล/แขวง'),
    zipcode: z.string().min(5, 'กรุณาระบุรหัสไปรษณีย์'),
  }),

  // ข้อมูลพัสดุ
  weight: z.coerce.number().min(0.1, 'น้ำหนักต้องมากกว่า 0.1 กก.').max(30, 'น้ำหนักต้องไม่เกิน 30 กก.'),
  width: z.coerce.number().min(1, 'ความกว้างต้องมากกว่า 1 ซม.').max(100, 'ความกว้างต้องไม่เกิน 100 ซม.'),
  length: z.coerce.number().min(1, 'ความยาวต้องมากกว่า 1 ซม.').max(100, 'ความยาวต้องไม่เกิน 100 ซม.'),
  height: z.coerce.number().min(1, 'ความสูงต้องมากกว่า 1 ซม.').max(100, 'ความสูงต้องไม่เกิน 100 ซม.'),

  // อื่นๆ
  remark: z.string().optional(),
  insured: z.coerce.number().default(0),
  codEnabled: z.coerce.number().default(0),
  codAmount: z.coerce.number().default(0),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function CreateFlashExpressOrderPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shippingRate, setShippingRate] = useState<number | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<string[]>([]);
  const [recipientDistricts, setRecipientDistricts] = useState<string[]>([]);
  const [recipientSubdistricts, setRecipientSubdistricts] = useState<string[]>([]);
  const [calculatingRate, setCalculatingRate] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      senderName: '',
      senderPhone: '',
      senderAddress: {
        address: '',
        province: 'กรุงเทพมหานคร',
        district: '',
        subdistrict: '',
        zipcode: '',
      },
      recipientName: '',
      recipientPhone: '',
      recipientAddress: {
        address: '',
        province: 'กรุงเทพมหานคร',
        district: '',
        subdistrict: '',
        zipcode: '',
      },
      weight: 1,
      width: 10,
      length: 20,
      height: 10,
      remark: '',
      insured: 0,
      codEnabled: 0,
      codAmount: 0,
    },
  });

  // Watch necessary values for calculations
  const senderProvince = form.watch('senderAddress.province');
  const senderDistrict = form.watch('senderAddress.district');
  const recipientProvince = form.watch('recipientAddress.province');
  const recipientDistrict = form.watch('recipientAddress.district');
  const weight = form.watch('weight');
  const width = form.watch('width');
  const length = form.watch('length');
  const height = form.watch('height');
  const insured = form.watch('insured');
  const codEnabled = form.watch('codEnabled');
  const codAmount = form.watch('codAmount');

  // ข้อมูลเขต และแขวง (ใช้ข้อมูลจริงแทนข้อมูล mock)
  const districtData = {
    'กรุงเทพมหานคร': {
      'เขตพระนคร': ['พระบรมมหาราชวัง', 'วังบูรพาภิรมย์', 'วัดราชบพิธ', 'สำราญราษฎร์', 'ศาลเจ้าพ่อเสือ', 'เสาชิงช้า', 'บวรนิเวศ', 'ตลาดยอด', 'ชนะสงคราม', 'บ้านพานถม', 'บางขุนพรหม', 'วัดสามพระยา'],
      'เขตดุสิต': ['ดุสิต', 'วชิรพยาบาล', 'สวนจิตรลดา', 'สี่แยกมหานาค', 'บางซื่อ', 'ถนนนครไชยศรี', 'สามเสนใน'],
      'เขตหนองจอก': ['กระทุ่มราย', 'หนองจอก', 'คลองสิบ', 'คลองสิบสอง', 'โคกแฝด', 'คู้ฝั่งเหนือ', 'ลำผักชี', 'ลำต้อยติ่ง'],
      'เขตบางรัก': ['มหาพฤฒาราม', 'สีลม', 'สุริยวงศ์', 'บางรัก', 'สี่พระยา'],
      'เขตบางเขน': ['อนุสาวรีย์', 'ท่าแร้ง'],
      'เขตบางกะปิ': ['คลองจั่น', 'หัวหมาก'],
      'เขตปทุมวัน': ['รองเมือง', 'วังใหม่', 'ปทุมวัน', 'ลุมพินี'],
      'เขตป้อมปราบศัตรูพ่าย': ['วังบูรพาภิรมย์', 'วัดเทพศิรินทร์', 'คลองมหานาค', 'ป้อมปราบ', 'บ้านบาตร'],
      'เขตพระโขนง': ['บางจาก'],
      'เขตมีนบุรี': ['มีนบุรี', 'แสนแสบ'],
      'เขตลาดกระบัง': ['ลาดกระบัง', 'คลองสองต้นนุ่น', 'คลองสามประเวศ', 'ลำปลาทิว', 'ทับยาว', 'ขุมทอง'],
      'เขตยานนาวา': ['ช่องนนทรี', 'บางโพงพาง'],
      'เขตสัมพันธวงศ์': ['จักรวรรดิ', 'สัมพันธวงศ์', 'ตลาดน้อย'],
      'เขตพญาไท': ['สามเสนใน'],
      'เขตธนบุรี': ['วัดกัลยาณ์', 'หิรัญรูจี', 'บางยี่เรือ', 'บุคคโล', 'ตลาดพลู', 'ดาวคะนอง', 'สำเหร่'],
      'เขตบางกอกใหญ่': ['วัดอรุณ', 'วัดท่าพระ'],
      'เขตห้วยขวาง': ['ห้วยขวาง', 'บางกะปิ', 'สามเสนนอก'],
      'เขตคลองสาน': ['คลองต้นไทร', 'คลองสาน', 'บางลำภูล่าง', 'สมเด็จเจ้าพระยา'],
      'เขตตลิ่งชัน': ['คลองชักพระ', 'ตลิ่งชัน', 'ฉิมพลี', 'บางพรม', 'บางระมาด', 'บางเชือกหนัง'],
      'เขตบางกอกน้อย': ['ศิริราช', 'บ้านช่างหล่อ', 'บางขุนนนท์', 'บางขุนศรี', 'อรุณอมรินทร์', 'บางยี่ขัน'],
      'เขตบางขุนเทียน': ['ท่าข้าม', 'แสมดำ'],
      'เขตภาษีเจริญ': ['บางหว้า', 'บางด้วน', 'บางแวก', 'คลองขวาง', 'ปากคลองภาษีเจริญ', 'คูหาสวรรค์', 'บางจาก'],
      'เขตหนองแขม': ['หนองแขม', 'หนองค้างพลู'],
      'เขตราษฎร์บูรณะ': ['ราษฎร์บูรณะ', 'บางปะกอก'],
      'เขตบางพลัด': ['บางพลัด', 'บางอ้อ', 'บางบำหรุ', 'บางยี่ขัน'],
      'เขตดินแดง': ['ดินแดง'],
      'เขตบึงกุ่ม': ['คลองกุ่ม', 'นวมินทร์'],
      'เขตสาทร': ['ทุ่งวัดดอน', 'ยานนาวา', 'ทุ่งมหาเมฆ'],
      'เขตบางซื่อ': ['บางซื่อ'],
      'เขตจตุจักร': ['จตุจักร', 'จอมพล', 'จันทรเกษม', 'ลาดยาว', 'เสนานิคม'],
      'เขตบางคอแหลม': ['บางคอแหลม', 'วัดพระยาไกร', 'บางโคล่'],
      'เขตประเวศ': ['ประเวศ', 'หนองบอน', 'ดอกไม้', 'ดอกไม้'],
      'เขตคลองเตย': ['คลองเตย', 'คลองตัน', 'พระโขนง'],
      'เขตสวนหลวง': ['สวนหลวง'],
      'เขตจอมทอง': ['จอมทอง', 'บางมด', 'บางค้อ', 'บางขุนเทียน'],
      'เขตดอนเมือง': ['สีกัน', 'ดอนเมือง'],
      'เขตราชเทวี': ['ทุ่งพญาไท', 'ถนนเพชรบุรี', 'ถนนพญาไท', 'มักกะสัน'],
      'เขตลาดพร้าว': ['จรเข้บัว', 'ลาดพร้าว'],
      'เขตวัฒนา': ['คลองตันเหนือ', 'คลองเตยเหนือ', 'พระโขนงเหนือ'],
      'เขตบางแค': ['บางแค', 'บางแคเหนือ', 'บางไผ่', 'หลักสอง'],
      'เขตหลักสี่': ['ตลาดบางเขน', 'ทุ่งสองห้อง'],
      'เขตสายไหม': ['สายไหม', 'ออเงิน', 'คลองถนน'],
      'เขตคันนายาว': ['คันนายาว'],
      'เขตสะพานสูง': ['สะพานสูง'],
      'เขตวังทองหลาง': ['วังทองหลาง'],
      'เขตคลองสามวา': ['สามวาตะวันออก', 'สามวาตะวันตก', 'บางชัน', 'ทรายกองดิน', 'ทรายกองดินใต้'],
      'เขตบางนา': ['บางนา'],
      'เขตทวีวัฒนา': ['ทวีวัฒนา', 'ศาลาธรรมสพน์'],
      'เขตทุ่งครุ': ['ทุ่งครุ', 'บางมด'],
      'เขตบางบอน': ['บางบอน']
    },
    'นนทบุรี': {
      'เมืองนนทบุรี': ['สวนใหญ่', 'ตลาดขวัญ', 'บางเขน', 'บางกระสอ', 'ท่าทราย', 'บางไผ่', 'บางศรีเมือง', 'บางกร่าง', 'ไทรม้า', 'บางรักน้อย'],
      'บางกรวย': ['วัดชลอ', 'บางกรวย', 'บางสีทอง', 'บางขนุน', 'บางขุนกอง', 'บางคูเวียง', 'มหาสวัสดิ์', 'ปลายบาง', 'บางแม่นาง']
    }
  };

  // ฟังก์ชันโหลดอำเภอเมื่อเลือกจังหวัด (สำหรับผู้ส่ง)
  useEffect(() => {
    if (senderProvince) {
      // ใช้ข้อมูลจริงจากตัวแปร districtData ที่กำหนดไว้
      const availableDistricts = Object.keys(districtData[senderProvince] || {});
      setDistricts(availableDistricts);

      // รีเซ็ตค่าที่เกี่ยวข้อง
      form.setValue('senderAddress.district', '');
      form.setValue('senderAddress.subdistrict', '');
      form.setValue('senderAddress.zipcode', '');
    }
  }, [senderProvince, form]);

  // ฟังก์ชันโหลดตำบลเมื่อเลือกอำเภอ (สำหรับผู้ส่ง)
  useEffect(() => {
    if (senderProvince && senderDistrict) {
      // ใช้ข้อมูลจริงจากตัวแปร districtData ที่กำหนดไว้
      const availableSubdistricts = districtData[senderProvince]?.[senderDistrict] || [];
      setSubdistricts(availableSubdistricts);

      // รีเซ็ตค่าที่เกี่ยวข้อง
      form.setValue('senderAddress.subdistrict', '');

      // กำหนดรหัสไปรษณีย์ตามพื้นที่ (ตัวอย่าง)
      if (senderProvince === 'กรุงเทพมหานคร') {
        if (['เขตพระนคร', 'เขตป้อมปราบศัตรูพ่าย', 'เขตสัมพันธวงศ์'].includes(senderDistrict)) {
          form.setValue('senderAddress.zipcode', '10200');
        } else if (['เขตดุสิต'].includes(senderDistrict)) {
          form.setValue('senderAddress.zipcode', '10300');
        } else if (['เขตบางรัก', 'เขตสาทร', 'เขตปทุมวัน'].includes(senderDistrict)) {
          form.setValue('senderAddress.zipcode', '10330');
        } else if (['เขตพญาไท', 'เขตดินแดง', 'เขตห้วยขวาง'].includes(senderDistrict)) {
          form.setValue('senderAddress.zipcode', '10400');
        } else if (['เขตคลองเตย', 'เขตวัฒนา'].includes(senderDistrict)) {
          form.setValue('senderAddress.zipcode', '10110');
        } else if (['เขตบางกะปิ', 'เขตวังทองหลาง', 'เขตลาดพร้าว'].includes(senderDistrict)) {
          form.setValue('senderAddress.zipcode', '10310');
        } else {
          form.setValue('senderAddress.zipcode', '10XXX');
        }
      } else if (senderProvince === 'นนทบุรี') {
        form.setValue('senderAddress.zipcode', '11000');
      } else {
        form.setValue('senderAddress.zipcode', '');
      }
    }
  }, [senderProvince, senderDistrict, form]);

  // ฟังก์ชันโหลดอำเภอเมื่อเลือกจังหวัด (สำหรับผู้รับ)
  useEffect(() => {
    if (recipientProvince) {
      // ใช้ข้อมูลจริงจากตัวแปร districtData ที่กำหนดไว้
      const availableDistricts = Object.keys(districtData[recipientProvince] || {});
      setRecipientDistricts(availableDistricts);

      // รีเซ็ตค่าที่เกี่ยวข้อง
      form.setValue('recipientAddress.district', '');
      form.setValue('recipientAddress.subdistrict', '');
      form.setValue('recipientAddress.zipcode', '');
    }
  }, [recipientProvince, form]);

  // ฟังก์ชันโหลดตำบลเมื่อเลือกอำเภอ (สำหรับผู้รับ)
  useEffect(() => {
    if (recipientProvince && recipientDistrict) {
      // ใช้ข้อมูลจริงจากตัวแปร districtData ที่กำหนดไว้
      const availableSubdistricts = districtData[recipientProvince]?.[recipientDistrict] || [];
      setRecipientSubdistricts(availableSubdistricts);

      // รีเซ็ตค่าที่เกี่ยวข้อง
      form.setValue('recipientAddress.subdistrict', '');

      // กำหนดรหัสไปรษณีย์ตามพื้นที่ (ตัวอย่าง)
      if (recipientProvince === 'กรุงเทพมหานคร') {
        if (['เขตพระนคร', 'เขตป้อมปราบศัตรูพ่าย', 'เขตสัมพันธวงศ์'].includes(recipientDistrict)) {
          form.setValue('recipientAddress.zipcode', '10200');
        } else if (['เขตดุสิต'].includes(recipientDistrict)) {
          form.setValue('recipientAddress.zipcode', '10300');
        } else if (['เขตบางรัก', 'เขตสาทร', 'เขตปทุมวัน'].includes(recipientDistrict)) {
          form.setValue('recipientAddress.zipcode', '10330');
        } else if (['เขตพญาไท', 'เขตดินแดง', 'เขตห้วยขวาง'].includes(recipientDistrict)) {
          form.setValue('recipientAddress.zipcode', '10400');
        } else if (['เขตคลองเตย', 'เขตวัฒนา'].includes(recipientDistrict)) {
          form.setValue('recipientAddress.zipcode', '10110');
        } else if (['เขตบางกะปิ', 'เขตวังทองหลาง', 'เขตลาดพร้าว'].includes(recipientDistrict)) {
          form.setValue('recipientAddress.zipcode', '10310');
        } else {
          form.setValue('recipientAddress.zipcode', '10XXX');
        }
      } else if (recipientProvince === 'นนทบุรี') {
        form.setValue('recipientAddress.zipcode', '11000');
      } else {
        form.setValue('recipientAddress.zipcode', '');
      }
    }
  }, [recipientProvince, recipientDistrict, form]);

  // คำนวณค่าจัดส่งอัตโนมัติเมื่อมีการเปลี่ยนแปลงข้อมูลที่เกี่ยวข้อง
  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วนแล้วหรือไม่
    const senderZipcode = form.getValues('senderAddress.zipcode');
    const recipientZipcode = form.getValues('recipientAddress.zipcode');
    const senderSubdistrict = form.getValues('senderAddress.subdistrict');
    const recipientSubdistrict = form.getValues('recipientAddress.subdistrict');

    if (
      senderZipcode &&
      recipientZipcode &&
      senderProvince &&
      recipientProvince &&
      senderDistrict &&
      recipientDistrict &&
      senderSubdistrict &&
      recipientSubdistrict &&
      weight
    ) {
      calculateShippingRate();
    }
  }, [
    senderProvince,
    senderDistrict,
    recipientProvince,
    recipientDistrict,
    form.watch('senderAddress.subdistrict'),
    form.watch('recipientAddress.subdistrict'),
    form.watch('senderAddress.zipcode'),
    form.watch('recipientAddress.zipcode'),
    weight,
    width,
    length,
    height,
  ]);

  // ฟังก์ชันแปลงชื่อเขต/อำเภอให้เข้ากับรูปแบบที่ Flash Express API ต้องการ
  const formatDistrictName = (district: string) => {
    // ตัด "เขต" ออกจากชื่อเขตของกรุงเทพฯ
    if (district.startsWith('เขต')) {
      return district.substring(3).trim();
    }
    return district;
  };

  // ฟังก์ชันแปลงชื่อแขวง/ตำบลให้เข้ากับรูปแบบที่ Flash Express API ต้องการ
  const formatSubdistrictName = (subdistrict: string) => {
    // ตัด "แขวง" ออกจากชื่อแขวงของกรุงเทพฯ
    if (subdistrict.startsWith('แขวง')) {
      return subdistrict.substring(4).trim();
    }
    return subdistrict;
  };

  // ฟังก์ชันคำนวณค่าจัดส่ง
  const calculateShippingRate = async () => {
    try {
      setCalculatingRate(true);
      console.log('กำลังคำนวณค่าจัดส่ง...');

      // ดึงข้อมูลจากฟอร์ม
      const senderProvince = form.getValues('senderAddress.province');
      const senderDistrict = form.getValues('senderAddress.district');
      const senderSubdistrict = form.getValues('senderAddress.subdistrict');
      const senderZipcode = form.getValues('senderAddress.zipcode');

      const recipientProvince = form.getValues('recipientAddress.province');
      const recipientDistrict = form.getValues('recipientAddress.district');
      const recipientSubdistrict = form.getValues('recipientAddress.subdistrict');
      const recipientZipcode = form.getValues('recipientAddress.zipcode');

      console.log('ข้อมูลต้นทาง:', {
        province: senderProvince,
        district: senderDistrict,
        subdistrict: senderSubdistrict,
        zipcode: senderZipcode
      });

      console.log('ข้อมูลปลายทาง:', {
        province: recipientProvince,
        district: recipientDistrict,
        subdistrict: recipientSubdistrict,
        zipcode: recipientZipcode
      });

      // แปลงข้อมูลให้ตรงกับที่ Flash Express API ต้องการ
      const originAddress = {
        province: senderProvince,
        district: formatDistrictName(senderDistrict),
        subdistrict: formatSubdistrictName(senderSubdistrict),
        zipcode: senderZipcode,
      };

      const destinationAddress = {
        province: recipientProvince,
        district: formatDistrictName(recipientDistrict),
        subdistrict: formatSubdistrictName(recipientSubdistrict),
        zipcode: recipientZipcode,
      };

      const packageDetails = {
        weight: form.getValues('weight'),
        width: form.getValues('width'),
        length: form.getValues('length'),
        height: form.getValues('height'),
      };

      console.log('ส่งข้อมูลไปยัง API:', {
        originAddress,
        destinationAddress,
        packageDetails
      });

      // เรียกใช้ API คำนวณค่าจัดส่ง
      const response = await fetch('/api/shipping/flash-express-new/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originAddress,
          destinationAddress,
          packageDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShippingRate(data.price);
      } else {
        toast({
          title: 'ไม่สามารถคำนวณค่าจัดส่งได้',
          description: data.error || 'กรุณาตรวจสอบข้อมูลที่อยู่และลองอีกครั้ง',
          variant: 'destructive',
        });
        setShippingRate(null);
      }
    } catch (error) {
      console.error('Error calculating shipping rate:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถคำนวณค่าจัดส่งได้ กรุณาลองอีกครั้งในภายหลัง',
        variant: 'destructive',
      });
      setShippingRate(null);
    } finally {
      setCalculatingRate(false);
    }
  };

  // คำนวณค่าบริการเพิ่มเติม
  const calculateAdditionalFees = () => {
    let total = shippingRate || 0;

    // ค่าประกันพัสดุ
    if (insured === 1) {
      total += 20; // ค่าประกันพัสดุ 20 บาท
    }

    // ค่าบริการเก็บเงินปลายทาง
    if (codEnabled === 1 && codAmount > 0) {
      const codFee = Math.max(codAmount * 0.03, 10); // 3% ของยอดเงิน หรือขั้นต่ำ 10 บาท
      total += codFee;
    }

    // ค่าธรรมเนียมแพลตฟอร์ม
    total += 25; // ค่าธรรมเนียมแพลตฟอร์ม 25 บาท

    return total;
  };

  // ส่งคำขอสร้างเลขพัสดุ
  const onSubmit: SubmitHandler<OrderFormValues> = async (values) => {
    try {
      setIsLoading(true);
      console.log('กำลังสร้างเลขพัสดุ Flash Express...');

      // แปลงข้อมูลให้ตรงกับที่ Flash Express API ต้องการ
      const senderInfo = values.senderAddress;
      const receiverInfo = values.recipientAddress;
      const packageInfo = {
        weight: values.weight,
        width: values.width,
        length: values.length,
        height: values.height,
      };

      const orderData = {
        outTradeNo: `TEST${Date.now()}`,
        srcName: senderInfo.name,
        srcPhone: senderInfo.phone,
        srcProvinceName: senderInfo.province,
        srcCityName: senderInfo.district,
        srcDistrictName: senderInfo.subdistrict,
        srcPostalCode: senderInfo.zipcode,
        srcDetailAddress: senderInfo.address,
        dstName: receiverInfo.name,
        dstPhone: receiverInfo.phone,
        dstHomePhone: receiverInfo.phone, 
        dstProvinceName: receiverInfo.province,
        dstCityName: receiverInfo.district,
        dstDistrictName: receiverInfo.subdistrict,
        dstPostalCode: receiverInfo.zipcode,
        dstDetailAddress: receiverInfo.address,
        weight: packageInfo.weight || "1000",
        width: "10",
        length: "10",
        height: "10",
        parcelKind: "1",
        expressCategory: "1",
        articleCategory: "2",
        expressTypeId: "1",
        productType: "1",
        payType: "1",
        transportType: "1",
        insured: "0",
        codEnabled: "0",
        codAmount: "0",
        insuredAmount: "0",
        pricingType: "1", 
        pricingTable: "1", 
        opdInsureEnabled: "0", 
        remark: values.remark || "ทดสอบการส่งพัสดุ",
        subItemTypes: [{
          itemName: "สินค้าทดสอบ",
          itemQuantity: "1",
          itemWeightSize: "1kg",
          itemColor: "-"
        }]
      };


      console.log('ข้อมูลที่จะส่งไปยัง API (หลังการแปลง):', orderData);

      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/shipping/flash-express-new/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'สร้างเลขพัสดุสำเร็จ',
          description: `เลขพัสดุของคุณคือ ${data.trackingNumber}`,
        });

        // ไปยังหน้ารายละเอียดออเดอร์
        setLocation(`/order-detail/${data.orderId}`);
      } else {
        toast({
          title: 'ไม่สามารถสร้างเลขพัสดุได้',
          description: data.error || 'กรุณาตรวจสอบข้อมูลและลองอีกครั้ง',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างเลขพัสดุได้ กรุณาลองอีกครั้งในภายหลัง',
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
            <h1 className="text-3xl font-bold tracking-tight">สร้างพัสดุกับ Flash Express</h1>
            <Button
              variant="outline"
              onClick={() => setLocation('/create-order')}
            >
              กลับไปหน้าสร้างคำสั่งซื้อ
            </Button>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>สร้างเลขพัสดุใหม่กับ Flash Express</CardTitle>
              <CardDescription>
                กรอกข้อมูลให้ครบถ้วนเพื่อสร้างเลขพัสดุกับ Flash Express
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  {/* ข้อมูลผู้ส่ง */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">ข้อมูลผู้ส่ง</h3>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="senderName"
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
                        name="senderPhone"
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
                      name="senderAddress.address"
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
                        name="senderAddress.province"
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
                        name="senderAddress.district"
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
                        name="senderAddress.subdistrict"
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
                        name="senderAddress.zipcode"
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
                        name="recipientName"
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
                        name="recipientPhone"
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
                      name="recipientAddress.address"
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
                        name="recipientAddress.province"
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
                        name="recipientAddress.district"
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
                        name="recipientAddress.subdistrict"
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
                        name="recipientAddress.zipcode"
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
                            <Input placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" {...field} />
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
                              <FormLabel className="text-base">ประกันพัสดุ</FormLabel>
                              <FormDescription>
                                บริการประกันพัสดุมูลค่า 2,000 บาท (คิดค่าบริการเพิ่ม 20 บาท)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value === 1}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? 1 : 0);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  {/* สรุปค่าบริการ */}
                  <div className="rounded-lg border p-4 space-y-4">
                    <h3 className="text-lg font-medium">สรุปค่าบริการ</h3>
                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>ค่าจัดส่งพัสดุ</span>
                        <span>
                          {calculatingRate ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `${shippingRate || 0} บาท`
                          )}
                        </span>
                      </div>

                      {insured === 1 && (
                        <div className="flex justify-between">
                          <span>ค่าประกันพัสดุ</span>
                          <span>20 บาท</span>
                        </div>
                      )}

                      {codEnabled === 1 && codAmount > 0 && (
                        <div className="flex justify-between">
                          <span>ค่าบริการเก็บเงินปลายทาง (3%)</span>
                          <span>{Math.max(codAmount * 0.03, 10).toFixed(2)} บาท</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>ค่าธรรมเนียมแพลตฟอร์ม</span>
                        <span>25 บาท</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between font-bold">
                        <span>ยอดรวมทั้งสิ้น</span>
                        <span>{calculateAdditionalFees().toFixed(2)} บาท</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={isLoading || calculatingRate || !shippingRate}
                    onClick={async () => {
                      try {
                        console.log('เริ่มส่งข้อมูลไปยัง API...');
                        const values = form.getValues();
                        console.log('ข้อมูลของฟอร์ม:', values);
                        setIsLoading(true);

                        // ส่งข้อมูลไปยัง API
                        const response = await fetch('/api/shipping/flash-express-new/create', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify(values),
                        });

                        const data = await response.json();
                        console.log('API ตอบกลับ:', data);

                        if (data.success) {
                          toast({
                            title: 'สร้างเลขพัสดุสำเร็จ',
                            description: `เลขพัสดุของคุณคือ ${data.trackingNumber}`,
                          });

                          // ไปยังหน้ารายละเอียดออเดอร์
                          setLocation(`/order-detail/${data.orderId}`);
                        } else {
                          toast({
                            title: 'ไม่สามารถสร้างเลขพัสดุได้',
                            description: data.error || 'กรุณาตรวจสอบข้อมูลและลองอีกครั้ง',
                            variant: 'destructive',
                          });
                        }
                      } catch (error) {
                        console.error('Error creating shipment:', error);
                        toast({
                          title: 'เกิดข้อผิดพลาด',
                          description: 'ไม่สามารถสร้างเลขพัสดุได้ กรุณาลองอีกครั้งในภายหลัง',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
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
              <p>
                * หากเกิดปัญหาในการใช้งาน กรุณาติดต่อเจ้าหน้าที่
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}