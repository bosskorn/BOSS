import api from './api'

// Interface for user data
interface User {
  id: number
  username: string
  fullname?: string
  role?: string
  balance?: number
}

// Interface for registration data
interface RegisterData {
  username: string
  password: string
  fullname?: string
}

// Register a new user
export const register = async (userData: RegisterData): Promise<User> => {
  try {
    const response = await api.post('/auth/register', userData)
    const { token, user } = response.data
    
    // Store token in localStorage
    localStorage.setItem('token', token)
    
    return user
  } catch (error) {
    console.error('Registration failed:', error)
    throw error
  }
}

// Login
export const login = async (username: string, password: string): Promise<User> => {
  try {
    const response = await api.post('/auth/login', { username, password })
    const { token, user } = response.data
    
    // Store token in localStorage
    localStorage.setItem('token', token)
    
    return user
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
    
    // Remove token from localStorage
    localStorage.removeItem('token')
  } catch (error) {
    console.error('Logout failed:', error)
    throw error
  }
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token')
}

// Get the current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get('/users/profile')
    return response.data.user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
