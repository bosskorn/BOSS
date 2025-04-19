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
import { Loader2, User, Lock, Store, MapPin, Phone, Mail } from 'lucide-react';
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
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: 'กรุณาระบุรหัสผ่านปัจจุบันที่มีความยาวอย่างน้อย 6 ตัวอักษร' }),
  newPassword: z.string().min(6, { message: 'กรุณาระบุรหัสผ่านใหม่ที่มีความยาวอย่างน้อย 6 ตัวอักษร' }),
  confirmPassword: z.string().min(6, { message: 'กรุณายืนยันรหัสผ่านใหม่' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

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
  }, [toast]);

  // อัพเดตข้อมูลโปรไฟล์
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      setLoadingProfile(true);
      
      const response = await axios.put('/api/user/profile', data, {
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
          fullname: data.fullname,
          email: data.email || null,
          phone: data.phone || null,
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* แท็บตั้งค่า */}
          <div className="md:col-span-3">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">ข้อมูลส่วนตัว</TabsTrigger>
                <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
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
                        
                        <FormField
                          control={profileForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ที่อยู่</FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกที่อยู่" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormDescription>
                                ที่อยู่จะถูกใช้เป็นค่าเริ่มต้นในการจัดส่งสินค้า
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" disabled={loadingProfile} className="bg-purple-600 hover:bg-purple-700">
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
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;