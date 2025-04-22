import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import LogoIcon from '@/components/LogoIcon';
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
  
  // ถ้ายืนยันตัวตนแล้ว ให้ redirect ไปหน้าที่เหมาะสมตามบทบาทของผู้ใช้
  useEffect(() => {
    if (user) {
      // ตรวจสอบบทบาทของผู้ใช้ หากเป็น admin ให้ไปหน้า admin-dashboard
      if (user.role === 'admin') {
        console.log('Admin user detected, redirecting to admin dashboard');
        setLocation('/admin-dashboard');
      } else {
        // หากเป็นผู้ใช้ทั่วไป ให้ไปหน้า dashboard ปกติ
        console.log('Regular user detected, redirecting to dashboard');
        setLocation('/');
      }
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
      <div className="h-full flex flex-col justify-center items-center text-center px-6 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-700 relative overflow-hidden">
        {/* ลวดลายพื้นหลัง */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 0 10 L 40 10 M 10 0 L 10 40" stroke="white" strokeWidth="0.5" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 -left-20 w-80 h-80 bg-purple-300 rounded-full filter blur-3xl opacity-20"></div>
        </div>
        
        {/* เนื้อหาหลัก */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white border-opacity-20">
              <LogoIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="inline-block text-purple-200">Ship</span>
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">Sync</span>
            </h1>
            <p className="text-xl text-purple-200 font-medium italic">
              ส่งด่วน สะดวกรวดเร็ว
            </p>
          </div>
          
          <div className="mb-8 text-white">
            <h2 className="text-2xl font-bold mb-3">
              {activeTab === 'login' ? 'ยินดีต้อนรับกลับ!' : 'เริ่มต้นใช้งานเลย!'}
            </h2>
            <p className="text-purple-200 mb-6">
              {activeTab === 'login'
                ? 'เข้าสู่ระบบเพื่อจัดการการขนส่งของคุณอย่างมีประสิทธิภาพ'
                : 'ลงทะเบียนเพื่อใช้งานระบบจัดการการขนส่งอัจฉริยะ'}
            </p>
            
            {/* คุณสมบัติที่น่าสนใจ */}
            <div className="grid grid-cols-2 gap-5 text-left">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-2 rounded-lg inline-block mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-medium text-white">ติดตามพัสดุแบบเรียลไทม์</h3>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-lg inline-block mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-white">รายงานและวิเคราะห์ข้อมูล</h3>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-lg inline-block mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-white">ระบบเก็บเงินปลายทาง</h3>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-lg inline-block mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="font-medium text-white">นำเข้าข้อมูลอัตโนมัติ</h3>
              </div>
            </div>
          </div>
          
          {/* ไฮไลต์การเชื่อมต่อกับขนส่งชั้นนำ */}
          <div className="relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl blur-md opacity-60"></div>
            <div className="relative bg-white bg-opacity-15 backdrop-blur-md p-4 rounded-xl border border-white border-opacity-20">
              <div className="flex items-center mb-2">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-2 rounded-md mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold">การเชื่อมต่อระบบขนส่ง</h3>
              </div>
              <p className="text-purple-100 text-sm">
                เชื่อมต่อกับขนส่งชั้นนำในประเทศไทย ให้คุณจัดการการขนส่งได้อย่างมีประสิทธิภาพสูงสุด
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-4 text-xs text-white text-opacity-50">
          ShipSync Logistics Management System • v1.5.0
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
              <div className="flex justify-center mb-3">
                <LogoIcon size={48} />
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-purple-700">Ship</span>
                <span className="text-yellow-500">Sync</span>
              </h1>
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