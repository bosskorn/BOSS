import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  LogIn, 
  UserPlus, 
  User, 
  Key, 
  AtSign, 
  Phone 
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

// สคีมาสำหรับการเข้าสู่ระบบ
const loginSchema = z.object({
  username: z.string().min(3, { message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }),
  password: z.string().min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }),
});

// สคีมาสำหรับการลงทะเบียน
const registerSchema = z.object({
  username: z.string().min(3, { message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }),
  password: z.string().min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }),
  fullname: z.string().min(3, { message: 'ชื่อ-นามสกุลต้องมีอย่างน้อย 3 ตัวอักษร' }),
  email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
  phone: z.string().min(9, { message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }).max(10, { message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // ถ้ายืนยันตัวตนแล้ว ให้ redirect ไปหน้าหลัก
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);
  
  // สร้างฟอร์มสำหรับการเข้าสู่ระบบ
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // สร้างฟอร์มสำหรับการลงทะเบียน
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
    },
  });
  
  // ส่งข้อมูลฟอร์มเข้าสู่ระบบ
  const onLoginSubmit = (data: LoginFormValues) => {
    console.log('Login form submitted:', data);
    loginMutation.mutate(data);
  };
  
  // ส่งข้อมูลฟอร์มลงทะเบียน
  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log('Register form submitted:', data);
    registerMutation.mutate(data);
  };
  
  // สำหรับแสดง 3D model หรือข้อความต้อนรับในฝั่งขวา
  const renderWelcomeSection = () => {
    return (
      <div className="h-full flex flex-col justify-center items-center text-center px-6 bg-gradient-to-br from-purple-50 to-white">
        <div className="mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-5xl font-bold">PD</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            PURPLEDASH
          </h1>
          <p className="text-xl italic text-purple-600 font-medium mt-1">
            ส่งด่วน ม่วงสะดุด!
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {activeTab === 'login' ? 'ยินดีต้อนรับกลับ!' : 'เริ่มต้นใช้งานเลย!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {activeTab === 'login'
              ? 'เข้าสู่ระบบเพื่อจัดการการขนส่งของคุณอย่างมีประสิทธิภาพ'
              : 'ลงทะเบียนเพื่อใช้งานระบบจัดการการขนส่งอัจฉริยะ'}
          </p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">ติดตามพัสดุ</h3>
                <p className="text-sm text-gray-600">ติดตามสถานะการจัดส่งแบบเรียลไทม์</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">นำเข้าข้อมูล</h3>
                <p className="text-sm text-gray-600">นำเข้าข้อมูลจาก Excel และ CSV ได้อย่างง่ายดาย</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">การจัดส่งแบบ COD</h3>
                <p className="text-sm text-gray-600">รองรับการเก็บเงินปลายทางกับ Flash Express</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">รายงานและการวิเคราะห์</h3>
                <p className="text-sm text-gray-600">ดูรายงานและวิเคราะห์ข้อมูลการขนส่งเพื่อเพิ่มประสิทธิภาพ</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-sm">
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-purple-700 text-xl flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Flash Express API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-900 text-sm">
                ระบบเชื่อมต่อกับ Flash Express API ช่วยให้คุณสามารถจัดการการขนส่งได้อย่างมีประสิทธิภาพ
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="flex flex-col md:flex-row min-h-screen font-kanit">
        <div className="md:w-1/2 lg:w-5/12 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">PURPLEDASH</h1>
              <p className="text-gray-600">ระบบจัดการขนส่งอัจฉริยะ</p>
            </div>
            
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  ลงทะเบียน
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
                    <CardDescription>
                      กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-500" />
                                ชื่อผู้ใช้
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกชื่อผู้ใช้" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Key className="w-4 h-4 mr-2 text-gray-500" />
                                รหัสผ่าน
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="กรอกรหัสผ่าน"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              กำลังเข้าสู่ระบบ...
                            </>
                          ) : (
                            <>
                              <LogIn className="mr-2 h-4 w-4" />
                              เข้าสู่ระบบ
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t rounded-b-lg flex justify-between">
                    <div className="text-xs text-gray-500">
                      หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl">ลงทะเบียน</CardTitle>
                    <CardDescription>
                      สร้างบัญชีใหม่เพื่อเริ่มใช้งานระบบ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-500" />
                                ชื่อผู้ใช้
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกชื่อผู้ใช้" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Key className="w-4 h-4 mr-2 text-gray-500" />
                                รหัสผ่าน
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="กรอกรหัสผ่าน"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Separator className="my-4" />
                        
                        <FormField
                          control={registerForm.control}
                          name="fullname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ชื่อ-นามสกุล</FormLabel>
                              <FormControl>
                                <Input placeholder="กรอกชื่อ-นามสกุล" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center">
                                  <AtSign className="w-4 h-4 mr-2 text-gray-500" />
                                  อีเมล
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="example@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                  เบอร์โทรศัพท์
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="0812345678" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              กำลังลงทะเบียน...
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              ลงทะเบียน
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="hidden md:block md:w-1/2 lg:w-7/12">
          {renderWelcomeSection()}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;