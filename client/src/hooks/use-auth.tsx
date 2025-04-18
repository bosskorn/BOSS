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
        
        // ใช้ axios ที่ตั้งค่าไว้แล้ว
        const response = await api.get('/api/user');
        
        console.log('Auth check response:', response.status, response.data);
        
        // ตรวจสอบว่าการเข้าสู่ระบบสำเร็จหรือไม่
        if (response.data.success && response.data.user) {
          return response.data.user;
        }
        
        return null;
      } catch (error: any) {
        console.error('Error checking auth:', error.response?.status, error.message);
        
        // ถ้าเป็น 401 แสดงว่ายังไม่ได้เข้าสู่ระบบ ให้ return null
        if (error.response?.status === 401) {
          return null;
        }
        
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 นาที
    retry: false,
  });

  // Mutation สำหรับการเข้าสู่ระบบ
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log('Logging in with credentials:', {
          username: credentials.username,
          password: '[MASKED]'
        });
        
        // ใช้ axios ที่ตั้งค่าไว้แล้ว
        const response = await api.post("/api/login", credentials);
        
        console.log('Login response:', response.status, response.data);
        
        // ตรวจสอบว่าเข้าสู่ระบบสำเร็จหรือไม่
        if (!response.data.success) {
          throw new Error(response.data.message || "เข้าสู่ระบบล้มเหลว");
        }
        
        // ตรวจสอบว่าได้รับข้อมูลผู้ใช้หรือไม่
        if (!response.data.user) {
          throw new Error("ไม่ได้รับข้อมูลผู้ใช้จากเซิร์ฟเวอร์");
        }
        
        // สร้าง session ต่อทันทีโดยเรียก API ตรวจสอบผู้ใช้
        await api.get('/api/user');
        
        // ส่งข้อมูลผู้ใช้กลับไป
        return response.data.user;
      } catch (error: any) {
        console.error("Login error:", error.response?.data || error.message);
        
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      // บันทึกข้อมูลผู้ใช้ลงใน cache
      queryClient.setQueryData(["/api/user"], user);
      
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
        
        // ใช้ axios ที่ตั้งค่าไว้แล้ว
        const response = await api.post("/api/register", userData);
        
        console.log('Register response:', response.status, response.data);
        
        // ตรวจสอบว่าลงทะเบียนสำเร็จหรือไม่
        if (!response.data.success) {
          throw new Error(response.data.message || "ลงทะเบียนล้มเหลว");
        }
        
        // ตรวจสอบว่าได้รับข้อมูลผู้ใช้หรือไม่
        if (!response.data.user) {
          throw new Error("ไม่ได้รับข้อมูลผู้ใช้จากเซิร์ฟเวอร์");
        }
        
        return response.data.user;
      } catch (error: any) {
        console.error("Register error:", error.response?.data || error.message);
        
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      // บันทึกข้อมูลผู้ใช้ลงใน cache
      queryClient.setQueryData(["/api/user"], user);
      
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
        
        // ใช้ axios ที่ตั้งค่าไว้แล้ว
        const response = await api.post("/api/logout");
        
        console.log('Logout response:', response.status, response.data);
        
        return response.data;
      } catch (error: any) {
        console.error("Logout error:", error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
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