import api from './api'

// Interfaces for order data
export interface Order {
  id: string
  customer: string
  total: number
  date: string
  status: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  total: number
}

// Get all orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get('/orders')
    return response.data.orders
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

// Get a single order by ID
export const getOrderById = async (id: string): Promise<Order> => {
  try {
    const response = await api.get(`/orders/${id}`)
    return response.data.order
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error)
    throw error
  }
}

// Create a new order
export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<Order> => {
  try {
    const response = await api.post('/orders', orderData)
    return response.data.order
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// Update an existing order
export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<Order> => {
  try {
    const response = await api.put(`/orders/${id}`, orderData)
    return response.data.order
  } catch (error) {
    console.error(`Error updating order ${id}:`, error)
    throw error
  }
}

// Delete an order
export const deleteOrder = async (id: string): Promise<void> => {
  try {
    await api.delete(`/orders/${id}`)
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error)
    throw error
  }
}
