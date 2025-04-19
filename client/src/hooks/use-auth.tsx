import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // ตรวจสอบสถานะการเข้าสู่ระบบของผู้ใช้
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log('Checking authentication status...');
        
        // ดึง token จาก localStorage
        const token = localStorage.getItem('auth_token');
        
        // ถ้าไม่มี token ให้ถือว่ายังไม่ได้เข้าสู่ระบบ
        if (!token) {
          console.log('No auth token found in localStorage');
          return null;
        }
        
        // ใช้ fetch API แทน axios เพื่อแก้ปัญหา cookie
        const response = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}` // ส่ง token ไปกับ request
          },
          credentials: 'include' // สำคัญสำหรับการส่ง cookie
        });
        
        // ถ้าไม่ได้รับรหัส 200 OK
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Not logged in or token expired (401)');
            // ลบ token ที่หมดอายุ
            localStorage.removeItem('auth_token');
            return null;
          }
          throw new Error(`API responded with status ${response.status}`);
        }
        
        // แปลงคำตอบเป็น JSON
        const data = await response.json();
        console.log('Auth check response:', response.status, data);
        
        // ตรวจสอบว่าการเข้าสู่ระบบสำเร็จหรือไม่
        if (data.success && data.user) {
          console.log('User found:', data.user.username);
          return data.user;
        } else {
          console.log('No user found or invalid response format');
          console.log('API response data:', data);
          return null;
        }
      } catch (error: any) {
        console.error('Error checking auth:', error.message);
        // ในกรณีที่มีข้อผิดพลาด ให้ลบ token
        localStorage.removeItem('auth_token');
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 นาที
    retry: false,
  });

  // Mutation สำหรับการเข้าสู่ระบบ
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log('Login form submitted:', credentials);
        
        // ใช้ fetch API แทนการใช้ axios เพื่อแก้ปัญหา cookie ที่ iPad
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include' // สำคัญสำหรับการส่ง/รับ cookies
        });
        
        const data = await response.json();
        console.log('Login response:', response.status, data);
        
        // ตรวจสอบว่าเข้าสู่ระบบสำเร็จหรือไม่
        if (!data.success) {
          throw new Error(data.message || "เข้าสู่ระบบล้มเหลว");
        }
        
        // ตรวจสอบว่าได้รับข้อมูลผู้ใช้หรือไม่
        if (!data.user) {
          throw new Error("ไม่ได้รับข้อมูลผู้ใช้จากเซิร์ฟเวอร์");
        }
        
        // แสดงผลดีบั๊ก
        console.log('Logged in successfully as:', data.user.username);
        
        // ส่งข้อมูลผู้ใช้กลับไป
        return data.user;
      } catch (error: any) {
        console.error("Login error:", error.response?.data || error.message);
        
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        throw error;
      }
    },
    onSuccess: (data: any) => {
      console.log('Login successful, response data:', data);
      
      // บันทึก token ลงใน localStorage
      if (data.token) {
        console.log('Found token in response, saving to localStorage');
        localStorage.setItem('auth_token', data.token);
      } else {
        // ถ้าไม่พบ token ในข้อมูลโดยตรง ให้ตรวจสอบในรูปแบบการตอบกลับอื่น
        if (typeof data === 'object' && data !== null) {
          if (data.data?.token) {
            console.log('Found token in data.data.token, saving to localStorage');
            localStorage.setItem('auth_token', data.data.token);
          }
        }
      }
      
      // กำหนดข้อมูลผู้ใช้ให้ถูกต้อง
      const userData = data.user || (data.data?.user) || data;
      console.log('Saving user data to cache:', userData);
      
      // บันทึกข้อมูลผู้ใช้ลงใน cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // แสดงข้อความแจ้งเตือน
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับเข้าสู่ระบบจัดการขนส่ง PurpleDash",
      });
      
      // ล้าง cache และดึงข้อมูลใหม่ทั้งหมดเมื่อล็อกอินสำเร็จ
      setTimeout(() => {
        queryClient.invalidateQueries();
      }, 500);
    },
    onError: (error: Error) => {
      // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
      toast({
        title: "เข้าสู่ระบบล้มเหลว",
        description: error.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับการลงทะเบียน
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        console.log('Registering new user:', {
          username: userData.username,
          password: '[MASKED]'
        });
        
        // ใช้ fetch แทน axios เพื่อความสอดคล้อง
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
          credentials: 'include' // สำคัญสำหรับการส่ง/รับ cookies
        });
        
        const data = await response.json();
        console.log('Register response:', response.status, data);
        
        // ตรวจสอบว่าลงทะเบียนสำเร็จหรือไม่
        if (!data.success) {
          throw new Error(data.message || "ลงทะเบียนล้มเหลว");
        }
        
        // ตรวจสอบว่าได้รับข้อมูลผู้ใช้หรือไม่
        if (!data.user) {
          throw new Error("ไม่ได้รับข้อมูลผู้ใช้จากเซิร์ฟเวอร์");
        }
        
        return data.user;
      } catch (error: any) {
        console.error("Register error:", error.response?.data || error.message);
        
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        throw error;
      }
    },
    onSuccess: (data: any) => {
      console.log('Registration successful, response data:', data);
      
      // บันทึก token ลงใน localStorage ถ้ามี
      if (data.token) {
        console.log('Found token in registration response, saving to localStorage');
        localStorage.setItem('auth_token', data.token);
      } else if (data.data?.token) {
        console.log('Found token in data.data.token, saving to localStorage');
        localStorage.setItem('auth_token', data.data.token);
      }
      
      // กำหนดข้อมูลผู้ใช้
      const userData = data.user || (data.data?.user) || data;
      
      // บันทึกข้อมูลผู้ใช้ลงใน cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // แสดงข้อความแจ้งเตือน
      toast({
        title: "ลงทะเบียนสำเร็จ",
        description: "บัญชีของคุณถูกสร้างขึ้นแล้ว คุณได้เข้าสู่ระบบโดยอัตโนมัติ",
      });
      
      // ล้าง cache และดึงข้อมูลใหม่ทั้งหมด
      setTimeout(() => {
        queryClient.invalidateQueries();
      }, 500);
    },
    onError: (error: Error) => {
      // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
      toast({
        title: "ลงทะเบียนล้มเหลว",
        description: error.message || "ไม่สามารถลงทะเบียนได้ กรุณาลองอีกครั้ง",
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับการออกจากระบบ
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('Logging out...');
        
        // ใช้ fetch แทน axios เพื่อความสอดคล้อง
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // สำคัญสำหรับการส่ง cookie
        });
        
        const data = await response.json();
        console.log('Logout response:', response.status, data);
        
        return data;
      } catch (error: any) {
        console.error("Logout error:", error.message);
        throw error;
      }
    },
    onSuccess: () => {
      // ลบ token ออกจาก localStorage
      localStorage.removeItem('auth_token');
      
      // ลบข้อมูลผู้ใช้ออกจาก cache
      queryClient.setQueryData(["/api/user"], null);
      
      // แสดงข้อความแจ้งเตือน
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "คุณได้ออกจากระบบแล้ว",
      });
      
      // ล้าง cache ทั้งหมด
      queryClient.clear();
    },
    onError: (error: Error) => {
      // แสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
      toast({
        title: "ออกจากระบบล้มเหลว",
        description: error.message || "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    },
  });

  // เช็คสถานะการล็อกอินทุกครั้งที่โหลดหน้า
  useEffect(() => {
    console.log('Auth provider mounted, checking authentication status...');
    
    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    refetchUser();
    
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}