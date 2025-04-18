<template>
  <div 
    class="sidebar"
    :class="{ 'closed': !isOpen }"
  >
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fas fa-truck"></i>
        <span>ระบบขนส่ง</span>
      </div>
      <button 
        class="sidebar-close" 
        @click="$emit('toggle')"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <!-- User Profile -->
    <div class="user-profile">
      <div class="user-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="user-info">
        <div class="user-name" id="sidebarUserName">{{ userData.fullname || userData.username || 'ผู้ใช้งาน' }}</div>
        <div class="user-role" id="sidebarUserRole">{{ userData.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป' }}</div>
      </div>
      <div class="user-balance">
        <span>ยอดเงินคงเหลือ:</span>
        <span id="sidebarUserBalance">{{ formatBalance(userData.balance || 0) }} บาท</span>
      </div>
    </div>
    
    <!-- Sidebar Menu -->
    <nav class="sidebar-nav">
      <ul>
        <li>
          <router-link to="/" class="sidebar-link">
            <i class="fas fa-home"></i>
            <span>หน้าหลัก</span>
          </router-link>
        </li>
        <li>
          <a href="#" class="sidebar-link">
            <i class="fas fa-shopping-cart"></i>
            <span>คำสั่งซื้อ</span>
          </a>
        </li>
        <li>
          <a href="#" class="sidebar-link">
            <i class="fas fa-box"></i>
            <span>สินค้า</span>
          </a>
        </li>
        <li>
          <a href="#" class="sidebar-link">
            <i class="fas fa-truck"></i>
            <span>ขนส่ง</span>
          </a>
        </li>
        <li>
          <a href="#" class="sidebar-link">
            <i class="fas fa-users"></i>
            <span>ลูกค้า</span>
          </a>
        </li>
        <li>
          <a href="#" class="sidebar-link">
            <i class="fas fa-chart-pie"></i>
            <span>รายงาน</span>
          </a>
        </li>
        <li>
          <a href="#" class="sidebar-link">
            <i class="fas fa-cog"></i>
            <span>ตั้งค่า</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Import Data Section -->
    <div class="import-section">
      <h3>นำเข้าข้อมูล</h3>
      
      <FileUpload @file-selected="handleFileUpload" />
    </div>

    <!-- Logout Button -->
    <div class="logout-section">
      <a href="#" class="logout-button" @click.prevent="handleLogout">
        <i class="fas fa-sign-out-alt"></i>
        <span>ออกจากระบบ</span>
      </a>
    </div>
    
    <!-- Backdrop for Mobile -->
    <div 
      v-if="isOpen" 
      class="sidebar-backdrop"
      @click="$emit('toggle')"
    ></div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FileUpload from './FileUpload.vue'
import { logout } from '../services/auth'
import { uploadFile } from '../services/api'
import { fetchUserProfile } from '../services/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const router = useRouter()
const userData = ref({
  username: '',
  fullname: '',
  role: 'user',
  balance: 0
})

// Format currency for balance
const formatBalance = (balance) => {
  return Number(balance).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Handle logout
const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Handle file upload
const handleFileUpload = async (file) => {
  try {
    // Show some feedback (could use a toast notification)
    console.log(`Uploading file: ${file.name}`)
    
    const formData = new FormData()
    formData.append('file', file)
    
    const result = await uploadFile(formData)
    
    // Show success feedback
    console.log('File uploaded successfully:', result)
    
    // Could refresh data after successful upload
    // refreshData()
  } catch (error) {
    console.error('File upload failed:', error)
    // Show error feedback
  }
}

// Load user data on component mount
onMounted(async () => {
  try {
    const user = await fetchUserProfile()
    if (user) {
      userData.value = user
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
  }
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 256px;
  height: 100vh;
  background-color: #ffffff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 30;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.sidebar.closed {
  transform: translateX(-100%);
}

.sidebar-header {
  height: 64px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.sidebar-logo i {
  color: #4CAF50;
  margin-right: 10px;
}

.sidebar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sidebar-close:hover {
  background-color: #f1f1f1;
  color: #333;
}

/* User Profile */
.user-profile {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f1f1f1;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 12px;
}

.user-info {
  margin-bottom: 10px;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-role {
  font-size: 0.875rem;
  color: #666;
}

.user-balance {
  background-color: #f1f1f1;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
}

.user-balance span:last-child {
  font-weight: 500;
  color: #4CAF50;
}

/* Sidebar Navigation */
.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.sidebar-link:hover, .sidebar-link.router-link-active {
  background-color: #f1f1f1;
  color: #4CAF50;
}

.sidebar-link i {
  width: 20px;
  margin-right: 12px;
  color: #4CAF50;
}

/* Import Section */
.import-section {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.import-section h3 {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

/* Logout Section */
.logout-section {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.logout-button {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: #f1f1f1;
}

.logout-button i {
  width: 20px;
  margin-right: 12px;
  color: #f44336;
}

/* Backdrop for mobile */
.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
  display: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar-backdrop {
    display: block;
  }
  
  .sidebar {
    width: 280px;
  }
}
</style>
