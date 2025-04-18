// Types shared between client and server

// User types
export interface User {
  id: number
  username: string
  fullname?: string
  role: 'admin' | 'user'
  balance: number
}

export interface UserCredentials {
  username: string
  password: string
}

export interface RegisterData extends UserCredentials {
  fullname?: string
}

// Order types
export interface Order {
  id: string
  customer: string
  total: number
  date: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  total: number
}

// Summary data for dashboard
export interface SummaryData {
  todayTotal: number
  monthTotal: number
  last7Days: DailySales[]
  latestOrders: LatestOrder[]
}

export interface DailySales {
  date: string
  total: number
}

export interface LatestOrder {
  id: string
  customer: string
  total: number
}

// File upload response
export interface UploadResponse {
  success: boolean
  message: string
  filename?: string
  records?: number
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}

export interface ErrorResponse {
  success: false
  message: string
  errors?: string[]
}
