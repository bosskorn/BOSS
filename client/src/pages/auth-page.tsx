import React, { useState } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import purpleDashLogo from '../assets/purpledash-logo.png';

// สร้าง Schema สำหรับการตรวจสอบข้อมูลการสมัครสมาชิก
const registerSchema = z.object({
  username: z.string().min(3, { message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }),
  password: z.string().min(6, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }),
  confirmPassword: z.string(),
  fullname: z.string().min(3, { message: 'ชื่อ-นามสกุลต้องมีอย่างน้อย 3 ตัวอักษร' })
}).refine(data => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword']
});

// สร้าง Schema สำหรับการตรวจสอบข้อมูลการเข้าสู่ระบบ
const loginSchema = z.object({
  username: z.string().min(1, { message: 'กรุณากรอกชื่อผู้ใช้' }),
  password: z.string().min(1, { message: 'กรุณากรอกรหัสผ่าน' })
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // สร้าง form สำหรับการเข้าสู่ระบบ
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // สร้าง form สำหรับการสมัครสมาชิก
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      fullname: ''
    }
  });

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Sending login request with credentials:', { username: data.username, password: '******' });
      
      const response = await axios.post('/api/login', {
        username: data.username,
        password: data.password
      });
      
      console.log('Login response:', response);
      
      if (response.status === 200) {
        toast({
          title: 'เข้าสู่ระบบสำเร็จ',
          description: 'ยินดีต้อนรับเข้าสู่ระบบ',
          variant: 'default',
        });
        
        // นำทางไปยังหน้าแดชบอร์ด
        setLocation('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        variant: 'destructive',
      });
      
      loginForm.reset({ username: data.username, password: '' });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการสมัครสมาชิก
  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...userData } = data;
      
      console.log('Sending register request with data:', { 
        username: userData.username,
        password: '******',
        fullname: userData.fullname
      });
      
      const response = await axios.post('/api/register', userData);
      
      console.log('Register response:', response);
      
      if (response.status === 201) {
        toast({
          title: 'สมัครสมาชิกสำเร็จ',
          description: 'กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านที่สร้างขึ้น',
          variant: 'default',
        });
        
        // รีเซ็ตฟอร์มและเปลี่ยนไปที่หน้าเข้าสู่ระบบ
        registerForm.reset();
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Register error:', error);
      
      toast({
        title: 'สมัครสมาชิกไม่สำเร็จ',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-kanit relative overflow-hidden">
      {/* พื้นหลังแบบเคลื่อนไหว 3D */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 z-0">
        <div className="absolute inset-0 opacity-20">
          {/* รูปแบบกราฟิกเส้นทางขนส่ง */}
          <div className="absolute h-[150px] w-[150px] -top-10 left-20 bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute h-[250px] w-[250px] top-40 -right-20 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute h-[200px] w-[200px] bottom-20 left-40 bg-purple-600 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* เส้นทางจำลอง */}
          <div className="absolute top-1/4 left-0 right-0 h-1 bg-white opacity-10 purple-dash-line"></div>
          <div className="absolute top-2/3 left-0 right-0 h-1 bg-white opacity-10 purple-dash-line" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-0 right-0 h-1 bg-white opacity-10 purple-dash-line" style={{animationDelay: '2s'}}></div>
          
          {/* วงกลมจุดเริ่มต้นและปลายทาง */}
          <div className="absolute top-1/4 left-10 h-4 w-4 bg-white rounded-full opacity-40"></div>
          <div className="absolute top-1/4 right-10 h-4 w-4 bg-white rounded-full opacity-60"></div>
          <div className="absolute top-2/3 left-20 h-4 w-4 bg-white rounded-full opacity-50"></div>
          <div className="absolute top-2/3 right-20 h-4 w-4 bg-white rounded-full opacity-30"></div>
          <div className="absolute bottom-1/4 left-40 h-4 w-4 bg-white rounded-full opacity-60"></div>
          <div className="absolute bottom-1/4 right-40 h-4 w-4 bg-white rounded-full opacity-40"></div>
          
          {/* รถขนส่งเคลื่อนที่ */}
          <div className="absolute top-1/4 left-0 animate-truck">
            <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center">
              <i className="fa-solid fa-truck-fast text-purple-700 text-xs"></i>
            </div>
          </div>
          <div className="absolute top-2/3 right-0 animate-truck-reverse">
            <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center">
              <i className="fa-solid fa-truck-fast text-purple-700 text-xs"></i>
            </div>
          </div>
        </div>
      </div>
      
      {/* คอนเทนเนอร์หลัก */}
      <div className="max-w-md w-full space-y-8 bg-white/90 p-8 rounded-lg shadow-xl backdrop-blur-xl relative z-10 float-box">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={purpleDashLogo} 
              alt="PURPLEDASH Logo" 
              className="h-14 glow-purple"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-3">
            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </h2>
        </div>
        
        {isLogin ? (
          <form className="mt-8 space-y-6" onSubmit={loginForm.handleSubmit(handleLogin)}>
            <div className="rounded-md -space-y-px">
              <div className="mb-4">
                <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ใช้งาน
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  {...loginForm.register('username')}
                />
                {loginForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.username.message}</p>
                )}
              </div>
              
              <div className="mb-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกรหัสผ่าน"
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i className="fa-solid fa-right-to-bracket"></i>
                </span>
                {isLoading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชี?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(false)} 
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  สมัครสมาชิกที่นี่
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={registerForm.handleSubmit(handleRegister)}>
            <div className="rounded-md -space-y-px">
              <div className="mb-4">
                <label htmlFor="register-fullname" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล
                </label>
                <input
                  id="register-fullname"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกชื่อ-นามสกุล"
                  {...registerForm.register('fullname')}
                />
                {registerForm.formState.errors.fullname && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.fullname.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ใช้งาน
                </label>
                <input
                  id="register-username"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  {...registerForm.register('username')}
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.username.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน
                </label>
                <input
                  id="register-password"
                  type="password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)"
                  {...registerForm.register('password')}
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="mb-2">
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  {...registerForm.register('confirmPassword')}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <i className="fa-solid fa-user-plus"></i>
                </span>
                {isLoading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก'}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                มีบัญชีอยู่แล้ว?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(true)} 
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  เข้าสู่ระบบที่นี่
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;