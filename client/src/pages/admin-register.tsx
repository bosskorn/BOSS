import React, { useState } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';

// สร้าง Schema สำหรับการตรวจสอบข้อมูลการสมัครสมาชิกผู้ดูแลระบบ
const adminRegisterSchema = z.object({
  username: z.string().min(3, { message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }),
  password: z.string().min(6, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }),
  confirmPassword: z.string(),
  fullname: z.string().min(3, { message: 'ชื่อ-นามสกุลต้องมีอย่างน้อย 3 ตัวอักษร' }),
  email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
  phone: z.string().min(9, { message: 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัว' }),
  adminKey: z.string() // ไม่จำเป็นต้องตรวจสอบความยาว เนื่องจากเป็นฟิลด์ซ่อน
}).refine(data => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword']
});

type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;

const AdminRegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // สร้าง form สำหรับการสมัครสมาชิกผู้ดูแลระบบ
  const registerForm = useForm<AdminRegisterFormValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      fullname: '',
      email: '',
      phone: '',
      adminKey: ''
    }
  });

  // ฟังก์ชันสำหรับการสมัครสมาชิกผู้ดูแลระบบ
  const handleRegister = async (data: AdminRegisterFormValues) => {
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...adminData } = data;
      
      console.log('Sending admin register request with data:', { 
        username: adminData.username,
        fullname: adminData.fullname,
        email: adminData.email,
        phone: adminData.phone,
        adminKey: '******',
        password: '******'
      });
      
      const response = await axios.post('/api/register/admin', adminData);
      
      console.log('Admin Register response:', response);
      
      if (response.data.success) {
        toast({
          title: 'สมัครสมาชิกผู้ดูแลระบบสำเร็จ',
          description: response.data.message || 'บัญชีผู้ดูแลระบบของคุณถูกสร้างแล้ว กำลังเข้าสู่ระบบ...',
          variant: 'default',
        });
        
        // เข้าสู่ระบบโดยอัตโนมัติและนำทางไปยังหน้าแดชบอร์ดผู้ดูแลระบบ
        setLocation('/admin-dashboard');
      } else {
        toast({
          title: 'สมัครสมาชิกผู้ดูแลระบบไม่สำเร็จ',
          description: response.data.message || 'เกิดข้อผิดพลาดไม่สามารถสมัครสมาชิกได้',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Admin Register error:', error);
      
      toast({
        title: 'สมัครสมาชิกผู้ดูแลระบบไม่สำเร็จ',
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
      <div className="max-w-4xl w-full space-y-8 bg-white/90 p-8 rounded-lg shadow-xl backdrop-blur-xl relative z-10 float-box mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">
            สมัครสมาชิกสำหรับผู้ดูแลระบบ
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ลงทะเบียนเพื่อเข้าใช้ระบบจัดการข้อมูลขนส่งอัจฉริยะในฐานะผู้ดูแลระบบ
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={registerForm.handleSubmit(handleRegister)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนที่ 1: ข้อมูลส่วนตัว */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">ข้อมูลส่วนตัว</h3>
              
              <div>
                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullname"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกชื่อ-นามสกุล"
                  {...registerForm.register('fullname')}
                />
                {registerForm.formState.errors.fullname && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.fullname.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="example@email.com"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="08xxxxxxxx"
                  {...registerForm.register('phone')}
                />
                {registerForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.phone.message}</p>
                )}
              </div>
              

            </div>
            
            {/* ส่วนที่ 2: ข้อมูลบัญชี */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">ข้อมูลบัญชี</h3>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  {...registerForm.register('username')}
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.username.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)"
                  {...registerForm.register('password')}
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  {...registerForm.register('confirmPassword')}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              {/* ฟิลด์ adminKey ซ่อนไว้และใส่ค่า default */}
              <input
                type="hidden"
                id="adminKey"
                value="PURPLEDASH2025"
                {...registerForm.register('adminKey')}
              />
            </div>
          </div>
          
          <div className="mt-8">
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fa-solid fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">คำเตือนสำหรับผู้ดูแลระบบ</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      บัญชีผู้ดูแลระบบมีสิทธิ์ในการจัดการข้อมูลสำคัญของระบบ โปรดเก็บรักษาข้อมูลบัญชีของคุณให้ปลอดภัย ระบบจะบันทึกการกระทำทั้งหมดของผู้ดูแลระบบ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fa-solid fa-user-shield"></i>
              </span>
              {isLoading ? 'กำลังดำเนินการ...' : 'สมัครเป็นผู้ดูแลระบบ'}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{' '}
              <a 
                href="/auth" 
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                เข้าสู่ระบบที่นี่
              </a>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              สมัครเป็นผู้ใช้ทั่วไป?{' '}
              <a 
                href="/auth" 
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                สมัครสมาชิกที่นี่
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegisterPage;