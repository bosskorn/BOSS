import axios from 'axios'

// Base URL for API requests
// ไม่ต้องมี /api เพราะพาทของ API เริ่มต้นด้วย /api อยู่แล้ว
const API_URL = ''

console.log('Initializing axios with withCredentials: true');

// Set up axios with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true // ส่ง cookies และ credentials ไปด้วยทุกครั้ง
})

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      // เปลี่ยนจาก x-auth-token เป็น Authorization header แบบ Bearer token
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// API functions for fetching data

// Get summary data for dashboard
export const fetchSummaryData = async () => {
  try {
    const response = await api.get('/orders/summary')
    return response.data
  } catch (error) {
    console.error('Error fetching summary data:', error)
    throw error
  }
}

// Get user profile
export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/users/profile')
    return response.data.user
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

// File upload
export const uploadFile = async (formData: FormData) => {
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Function for making API requests using fetch API
export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // เพิ่ม JWT token ถ้ามี
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // ยังคงส่ง cookies สำหรับ session-based auth
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  return fetch(url.startsWith('/') ? url : `/${url}`, options);
};

// Export API functions
export default api
