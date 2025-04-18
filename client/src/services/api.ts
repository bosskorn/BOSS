import axios from 'axios'

// Base URL for API requests
const API_URL = '/api'

// Set up axios with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['x-auth-token'] = token
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

// Export API functions
export default api
