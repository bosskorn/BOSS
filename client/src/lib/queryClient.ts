import { QueryClient, QueryFunction } from "@tanstack/react-query";
import api from "@/services/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      const errorData = await res.json();
      errorText = errorData.message || res.statusText;
    } catch {
      errorText = (await res.text()) || res.statusText;
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

// สำหรับการส่ง API Request แบบปกติ
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data ? { hasData: true } : { hasData: false });
  
  try {
    // ใช้ axios instance ที่ตั้งค่าไว้แล้วแทนการใช้ fetch โดยตรง
    if (method === "GET") {
      const res = await api.get(url);
      return new Response(JSON.stringify(res.data), {
        status: res.status,
        statusText: res.statusText,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else if (method === "POST") {
      const res = await api.post(url, data);
      return new Response(JSON.stringify(res.data), {
        status: res.status,
        statusText: res.statusText,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else if (method === "PUT") {
      const res = await api.put(url, data);
      return new Response(JSON.stringify(res.data), {
        status: res.status,
        statusText: res.statusText,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else if (method === "DELETE") {
      const res = await api.delete(url);
      return new Response(JSON.stringify(res.data), {
        status: res.status,
        statusText: res.statusText,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error(`API Request Error: ${method} ${url}`, error);
    if (error.response) {
      return new Response(JSON.stringify(error.response.data), {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    throw error;
  }
}

// ประเภทพฤติกรรมเมื่อเจอ 401
type UnauthorizedBehavior = "returnNull" | "throw";

// ฟังก์ชันสำหรับสร้าง query function
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log('Fetching with QueryFn:', queryKey[0]);
    
    try {
      // ใช้ axios instance เพื่อความสม่ำเสมอแทนที่จะใช้ fetch
      const path = queryKey[0] as string;
      const response = await api.get(path);
      
      console.log('QueryFn response:', path, response.status);
      return response.data;
    } catch (error) {
      console.error('QueryFn error:', queryKey[0], error);
      
      // จัดการกรณี 401 แล้วรีเทิร์น null ถ้าตั้งค่าไว้
      if (unauthorizedBehavior === "returnNull" && error.response?.status === 401) {
        return null;
      }
      
      throw error;
    }
  };

// สร้าง query client สำหรับใช้งาน
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 นาที
      retry: 1, // ลองใหม่ 1 ครั้งถ้าล้มเหลว
    },
    mutations: {
      retry: 1, // ลองใหม่ 1 ครั้งถ้าล้มเหลว
    },
  },
});
