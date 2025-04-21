import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Lock, Store, MapPin, Phone, Mail, Info, Truck, AlertTriangle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// สร้าง Schema สำหรับการตรวจสอบข้อมูลในฟอร์ม
const profileFormSchema = z.object({
  fullname: z.string().min(2, { message: 'กรุณาระบุชื่อที่มีความยาวอย่างน้อย 2 ตัวอักษร' }),
  email: z.string().email({ message: 'กรุณาระบุอีเมลที่ถูกต้อง' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  subdistrict: z.string().optional().or(z.literal('')),
  zipcode: z.string().optional().or(z.literal('')),
}).transform(data => {
  // แปลงค่า email ที่เป็น '' เป็น null เพื่อหลีกเลี่ยง validation error
  return {
    ...data,
    email: data.email === '' ? null : data.email
  };
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: 'กรุณาระบุรหัสผ่านปัจจุบันที่มีความยาวอย่างน้อย 6 ตัวอักษร' }),
  newPassword: z.string().min(6, { message: 'กรุณาระบุรหัสผ่านใหม่ที่มีความยาวอย่างน้อย 6 ตัวอักษร' }),
  confirmPassword: z.string().min(6, { message: 'กรุณายืนยันรหัสผ่านใหม่' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

// Interface สำหรับตัวเลือกขนส่ง
interface ShippingMethod {
  id: number;
  name: string;
  enabled: boolean;
  logo?: string;
  basePrice: number;
  description?: string;
  estimatedDelivery?: string;
}

// Interface สำหรับการตั้งค่าขนส่ง
interface ShippingSettings {
  shipping_methods: ShippingMethod[];
}

// ข้อมูลขนส่งเริ่มต้น (จะถูกแทนที่ด้วยข้อมูลจริงจาก API)
const defaultShippingMethods: ShippingMethod[] = [
  {
    id: 1,
    name: 'Flash Express',
    enabled: true,
    basePrice: 35,
    description: 'บริการขนส่งด่วนทั่วประเทศ',
    estimatedDelivery: '1-2 วันทำการ'
  },
  {
    id: 2,
    name: 'Thailand Post (EMS)',
    enabled: false,
    basePrice: 42,
    description: 'ไปรษณีย์ไทย บริการ EMS',
    estimatedDelivery: '1-3 วันทำการ'
  },
  {
    id: 3,
    name: 'SCG Express',
    enabled: false,
    basePrice: 40,
    description: 'บริการจัดส่งรวดเร็ว มาตรฐานสูง',
    estimatedDelivery: '1-2 วันทำการ'
  },
  {
    id: 4,
    name: 'Kerry Express',
    enabled: false,
    basePrice: 38,
    description: 'เครือข่ายครอบคลุมทั่วประเทศ',
    estimatedDelivery: '1-2 วันทำการ'
  },
  {
    id: 5,
    name: 'J&T Express',
    enabled: false,
    basePrice: 36,
    description: 'บริการจัดส่งพัสดุระดับภูมิภาค',
    estimatedDelivery: '1-3 วันทำการ'
  }
];

// ประเภทของข้อมูลผู้ใช้
interface UserProfile {
  id: number;
  username: string;
  fullname: string;
  role: string;
  balance: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  zipcode: string | null;
  createdAt: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const { toast } = useToast();

  // ฟอร์มสำหรับข้อมูลโปรไฟล์
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullname: '',
      email: '',
      phone: '',
      address: '',
      province: '',
      district: '',
      subdistrict: '',
      zipcode: '',
    },
  });

  // ฟอร์มสำหรับเปลี่ยนรหัสผ่าน
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // ฟังก์ชันดึงข้อมูลขนส่งจาก API
  const fetchShippingMethods = async () => {
    try {
      setLoadingShipping(true);
      // ในบทความการทดสอบนี้ใช้ข้อมูลจำลอง แต่ในการใช้งานจริงควรดึงข้อมูลจาก API
      // const response = await axios.get('/api/shipping/methods', { withCredentials: true });
      // if (response.data && response.data.success) {
      //   setShippingMethods(response.data.methods);
      // }
      
      // ใช้ข้อมูลจำลองเริ่มต้น
      setTimeout(() => {
        setShippingMethods(defaultShippingMethods);
        setLoadingShipping(false);
      }, 500);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลขนส่ง:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลขนส่งได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
      setLoadingShipping(false);
    }
  };

  // ฟังก์ชันเปลี่ยนสถานะการเปิด/ปิดขนส่ง
  const toggleShippingMethod = async (id: number, enabled: boolean) => {
    try {
      const updatedMethods = shippingMethods.map(method => 
        method.id === id ? { ...method, enabled } : method
      );
      setShippingMethods(updatedMethods);
      
      // ส่งข้อมูลไปยัง API ในการใช้งานจริง
      // await axios.put(`/api/shipping/methods/${id}`, { enabled }, { withCredentials: true });
      
      toast({
        title: enabled ? 'เปิดใช้งานขนส่งสำเร็จ' : 'ปิดใช้งานขนส่งสำเร็จ',
        description: `คุณได้${enabled ? 'เปิด' : 'ปิด'}ใช้งานขนส่ง ${shippingMethods.find(m => m.id === id)?.name} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพเดตสถานะขนส่ง:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัพเดตสถานะขนส่งได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  // ฟังก์ชันอัพเดตราคาขนส่ง
  const updateShippingPrice = async (id: number, newPrice: number) => {
    try {
      if (newPrice < 0) {
        toast({
          title: 'ราคาไม่ถูกต้อง',
          description: 'ราคาขนส่งต้องเป็นจำนวนบวก',
          variant: 'destructive',
        });
        return;
      }
      
      const updatedMethods = shippingMethods.map(method => 
        method.id === id ? { ...method, basePrice: newPrice } : method
      );
      setShippingMethods(updatedMethods);
      
      // ส่งข้อมูลไปยัง API ในการใช้งานจริง
      // await axios.put(`/api/shipping/methods/${id}`, { basePrice: newPrice }, { withCredentials: true });
      
      toast({
        title: 'อัพเดตราคาขนส่งสำเร็จ',
        description: `คุณได้อัพเดตราคาขนส่ง ${shippingMethods.find(m => m.id === id)?.name} เป็น ฿${newPrice} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพเดตราคาขนส่ง:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัพเดตราคาขนส่งได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  // ดึงข้อมูลผู้ใช้จาก API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await axios.get('/api/user', {
          withCredentials: true
        });

        if (response.data && response.data.success) {
          const userData = response.data.user;
          setUserProfile(userData);
          
          // กำหนดค่าเริ่มต้นให้กับฟอร์ม
          profileForm.reset({
            fullname: userData.fullname || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            province: userData.province || '',
            district: userData.district || '',
            subdistrict: userData.subdistrict || '',
            zipcode: userData.zipcode || '',
          });
          
          // แสดง log เพื่อดูข้อมูลที่ได้รับจาก API
          console.log('ข้อมูลผู้ใช้จาก API:', userData);
        } else {
          console.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้', response.data);
          toast({
            title: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
            description: 'กรุณาลองใหม่อีกครั้ง',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
    // ดึงข้อมูลขนส่ง
    fetchShippingMethods();
  }, [toast]);

  // อัพเดตข้อมูลโปรไฟล์
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      setLoadingProfile(true);
      
      // แปลงค่า empty string เป็น null เพื่อความเข้ากันได้กับ API
      const profileData = {
        fullname: data.fullname,
        email: data.email === '' ? null : data.email,
        phone: data.phone === '' ? null : data.phone,
        address: data.address === '' ? null : data.address,
        province: data.province === '' ? null : data.province,
        district: data.district === '' ? null : data.district,
        subdistrict: data.subdistrict === '' ? null : data.subdistrict,
        zipcode: data.zipcode === '' ? null : data.zipcode,
      };
      
      const response = await axios.put('/api/user/profile', profileData, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        toast({
          title: 'อัพเดตข้อมูลสำเร็จ',
          description: 'ข้อมูลโปรไฟล์ของคุณถูกอัพเดตเรียบร้อยแล้ว',
        });
        
        // อัพเดตข้อมูลผู้ใช้ในสถานะ
        setUserProfile({
          ...userProfile!,
          fullname: profileData.fullname || null,
          email: profileData.email || null,
          phone: profileData.phone || null,
          address: profileData.address || null,
          province: profileData.province || null,
          district: profileData.district || null,
          subdistrict: profileData.subdistrict || null,
          zipcode: profileData.zipcode || null,
        });
      } else {
        toast({
          title: 'อัพเดตข้อมูลไม่สำเร็จ',
          description: 'ไม่สามารถอัพเดตข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัพเดตข้อมูลโปรไฟล์:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัพเดตข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const onPasswordSubmit = async (data: z.infer<typeof passwordFormSchema>) => {
    try {
      setLoadingPassword(true);
      
      const response = await axios.put('/api/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        toast({
          title: 'เปลี่ยนรหัสผ่านสำเร็จ',
          description: 'รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว',
        });
        passwordForm.reset();
      } else {
        toast({
          title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
          description: response.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl font-kanit">
        <h1 className="text-2xl font-bold mb-6">ตั้งค่า</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* ข้อมูลผู้ใช้ */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">บัญชีผู้ใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {userProfile ? userProfile.fullname.charAt(0) : '?'}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{userProfile?.fullname || 'กำลังโหลด...'}</h3>
                    <p className="text-gray-500 text-sm">{userProfile?.username || ''}</p>
                    <div className="mt-2 bg-purple-50 py-1 px-2 rounded-full text-xs text-purple-800 inline-block">
                      {userProfile?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>{userProfile?.email || 'ยังไม่ได้ระบุอีเมล'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>{userProfile?.phone || 'ยังไม่ได้ระบุเบอร์โทรศัพท์'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Store className="mr-2 h-4 w-4" />
                    <span>ยอดเงิน: ฿{parseFloat(userProfile?.balance || '0').toLocaleString()}</span>
                  </div>
                  
                  {userProfile?.address && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <h4 className="font-medium text-sm mb-1">ที่อยู่ผู้ส่ง</h4>
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {userProfile.address}
                          {userProfile.subdistrict && <>, {userProfile.subdistrict}</>}
                          {userProfile.district && <>, {userProfile.district}</>}
                          {userProfile.province && <>, {userProfile.province}</>}
                          {userProfile.zipcode && <> {userProfile.zipcode}</>}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* แท็บตั้งค่า */}
          <div className="md:col-span-3">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">ข้อมูลส่วนตัว</TabsTrigger>
                <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
                <TabsTrigger value="shipping">ขนส่ง</TabsTrigger>
              </TabsList>
              
              {/* แท็บข้อมูลส่วนตัว */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                    <CardDescription>แก้ไขข้อมูลส่วนตัวของคุณ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="fullname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ชื่อ-นามสกุล</FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกชื่อและนามสกุล" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>อีเมล</FormLabel>
                              <FormControl>
                                <Input placeholder="example@email.com" type="email" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>เบอร์โทรศัพท์</FormLabel>
                              <FormControl>
                                <Input placeholder="0xxxxxxxxx" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <h3 className="text-lg font-medium mt-6 mb-3">ที่อยู่สำหรับรับพัสดุ</h3>
                        <div className="border p-4 rounded-md bg-gray-50 dark:bg-gray-900 space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ที่อยู่</FormLabel>
                                <FormControl>
                                  <Input placeholder="บ้านเลขที่ ถนน ซอย อาคาร" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormDescription>
                                  กรุณาระบุรายละเอียดที่อยู่ เช่น บ้านเลขที่ ถนน ซอย หรืออาคาร
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="subdistrict"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>แขวง/ตำบล</FormLabel>
                                  <FormControl>
                                    <Input placeholder="แขวง/ตำบล" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="district"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>เขต/อำเภอ</FormLabel>
                                  <FormControl>
                                    <Input placeholder="เขต/อำเภอ" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="province"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>จังหวัด</FormLabel>
                                  <FormControl>
                                    <Input placeholder="จังหวัด" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="zipcode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>รหัสไปรษณีย์</FormLabel>
                                  <FormControl>
                                    <Input placeholder="รหัสไปรษณีย์" {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Button type="submit" disabled={loadingProfile} className="bg-purple-600 hover:bg-purple-700 mt-4">
                          {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          บันทึกข้อมูล
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* แท็บความปลอดภัย */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
                    <CardDescription>อัพเดตรหัสผ่านเพื่อความปลอดภัย</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกรหัสผ่านปัจจุบัน" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Separator className="my-4" />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>รหัสผ่านใหม่</FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกรหัสผ่านใหม่" type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" disabled={loadingPassword} className="bg-purple-600 hover:bg-purple-700">
                          {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          เปลี่ยนรหัสผ่าน
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* แท็บขนส่ง */}
              <TabsContent value="shipping">
                <Card>
                  <CardHeader>
                    <CardTitle>ตั้งค่าขนส่ง</CardTitle>
                    <CardDescription>จัดการตัวเลือกและราคาการจัดส่งสินค้าของคุณ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingShipping ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                        <p className="mt-2 text-gray-500">กำลังโหลดข้อมูลขนส่ง...</p>
                      </div>
                    ) : shippingMethods.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-900">
                        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                        <h3 className="text-lg font-medium mb-1">ไม่พบข้อมูลขนส่ง</h3>
                        <p className="text-gray-500 mb-4">ยังไม่มีตัวเลือกขนส่งในระบบ</p>
                        <Button variant="outline" className="mx-auto">
                          <span>รีเฟรช</span>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-gray-500 mb-6 flex items-start">
                          <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <p>
                            เปิดหรือปิดบริการขนส่งตามที่ต้องการ โดยขนส่งที่ปิดจะไม่แสดงเป็นตัวเลือกในหน้าสร้างออเดอร์ 
                            นอกจากนี้คุณยังสามารถปรับราคาขนส่งเริ่มต้นสำหรับแต่ละบริการได้ตามต้องการ
                          </p>
                        </div>
                        
                        <div className="space-y-6">
                          {shippingMethods.map((method) => (
                            <div key={method.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Truck className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0" />
                                  <div>
                                    <h4 className="font-medium text-base">{method.name}</h4>
                                    <p className="text-sm text-gray-500">{method.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">ระยะเวลาส่งโดยประมาณ: {method.estimatedDelivery}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-sm text-gray-500">{method.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                                    <Switch 
                                      checked={method.enabled} 
                                      onCheckedChange={(checked) => toggleShippingMethod(method.id, checked)}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">ราคา:</span>
                                    <div className="relative">
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">฿</span>
                                      <Input 
                                        type="number"
                                        value={method.basePrice.toString()}
                                        onChange={(e) => {
                                          const newPrice = parseFloat(e.target.value);
                                          if (!isNaN(newPrice)) {
                                            updateShippingPrice(method.id, newPrice);
                                          }
                                        }}
                                        className="pl-6 w-24"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end mt-6">
                          <Button
                            onClick={() => fetchShippingMethods()}
                            variant="outline"
                            className="mr-2"
                          >
                            รีเซ็ต
                          </Button>
                          <Button 
                            disabled={loadingShipping}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {loadingShipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            บันทึกการตั้งค่า
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;