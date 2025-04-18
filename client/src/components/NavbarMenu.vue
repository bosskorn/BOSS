<template>
  <nav class="top-navbar">
    <div class="navbar-left">
      <!-- Sidebar Toggle Button -->
      <button 
        @click="$emit('toggle-sidebar')" 
        class="sidebar-toggle"
      >
        <i class="fas fa-bars"></i>
      </button>
      
      <!-- App Title -->
      <div class="navbar-title">
        <i class="fas fa-truck"></i>
        <span>ระบบจัดการข้อมูลขนส่ง</span>
      </div>
    </div>
    
    <!-- Navbar Menu -->
    <ul class="navbar-menu">
      <!-- ปุ่มหน้าหลัก -->
      <li>
        <router-link to="/" class="nav-link">
          <i class="fas fa-home"></i>
          <span>หน้าหลัก</span>
        </router-link>
      </li>
      
      <!-- เมนู Orders -->
      <li ref="ordersDropdown">
        <a 
          href="#" 
          class="nav-link dropdown-toggle"
          @click.prevent="$emit('toggle-dropdown', 'orders')"
          :class="{ 'active': activeDropdown === 'orders' }"
        >
          <i class="fas fa-shopping-cart"></i>
          <span>คำสั่งซื้อ</span>
          <i class="fas fa-caret-down" :class="{ 'rotate': activeDropdown === 'orders' }"></i>
        </a>
        <ul 
          class="dropdown-menu" 
          :class="{ 'show': activeDropdown === 'orders' }"
        >
          <li><a href="#"><i class="fas fa-list-ul"></i>รายการทั้งหมด</a></li>
          <li><a href="#"><i class="fas fa-plus"></i>เพิ่มคำสั่งซื้อ</a></li>
          <li class="dropdown-divider"></li>
          <li><a href="#"><i class="fas fa-file-invoice"></i>ใบเสร็จ</a></li>
        </ul>
      </li>
      
      <!-- เมนู Products -->
      <li ref="productsDropdown">
        <a 
          href="#" 
          class="nav-link dropdown-toggle"
          @click.prevent="$emit('toggle-dropdown', 'products')"
          :class="{ 'active': activeDropdown === 'products' }"
        >
          <i class="fas fa-box"></i>
          <span>สินค้า</span>
          <i class="fas fa-caret-down" :class="{ 'rotate': activeDropdown === 'products' }"></i>
        </a>
        <ul 
          class="dropdown-menu" 
          :class="{ 'show': activeDropdown === 'products' }"
        >
          <li><a href="#"><i class="fas fa-list-ul"></i>รายการสินค้า</a></li>
          <li><a href="#"><i class="fas fa-plus"></i>เพิ่มสินค้า</a></li>
          <li class="dropdown-divider"></li>
          <li><a href="#"><i class="fas fa-tags"></i>หมวดหมู่</a></li>
        </ul>
      </li>
      
      <!-- เมนู Reports -->
      <li ref="reportsDropdown">
        <a 
          href="#" 
          class="nav-link dropdown-toggle"
          @click.prevent="$emit('toggle-dropdown', 'reports')"
          :class="{ 'active': activeDropdown === 'reports' }"
        >
          <i class="fas fa-chart-pie"></i>
          <span>รายงาน</span>
          <i class="fas fa-caret-down" :class="{ 'rotate': activeDropdown === 'reports' }"></i>
        </a>
        <ul 
          class="dropdown-menu" 
          :class="{ 'show': activeDropdown === 'reports' }"
        >
          <li><a href="#"><i class="fas fa-chart-bar"></i>ยอดขาย</a></li>
          <li><a href="#"><i class="fas fa-chart-line"></i>แนวโน้มธุรกิจ</a></li>
          <li class="dropdown-divider"></li>
          <li><a href="#"><i class="fas fa-file-export"></i>ส่งออกรายงาน</a></li>
        </ul>
      </li>
      
      <!-- ไอคอนแจ้งเตือน -->
      <li>
        <a href="#" class="icon-button">
          <i class="fas fa-bell"></i>
        </a>
      </li>
      
      <!-- โปรไฟล์ผู้ใช้ -->
      <li>
        <a href="#" class="icon-button" @click.prevent="handleLogout">
          <i class="fas fa-user"></i>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../services/auth'

const props = defineProps({
  activeDropdown: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['toggle-dropdown', 'toggle-sidebar', 'refs-ready'])

const router = useRouter()

// Refs for dropdowns
const ordersDropdown = ref(null)
const productsDropdown = ref(null)
const reportsDropdown = ref(null)

// Handle logout
const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Send refs to parent component after mount
onMounted(() => {
  emit('refs-ready', {
    orders: ordersDropdown.value,
    products: productsDropdown.value,
    reports: reportsDropdown.value
  })
})
</script>

<style scoped>
.top-navbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 20;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.sidebar-toggle {
  border: none;
  background: transparent;
  color: #555;
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.sidebar-toggle:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
}

.navbar-title {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.navbar-title i {
  margin-right: 8px;
  color: #4CAF50;
}

.navbar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  height: 100%;
}

.navbar-menu li {
  position: relative;
  margin-left: 10px;
  height: 100%;
  display: flex;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #555;
  padding: 0 10px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  height: 100%;
  border-bottom: 3px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.nav-link i:not(.fa-caret-down) {
  margin-right: 5px;
  width: 16px;
  text-align: center;
}

.nav-link:hover, .nav-link.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #555;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
}

/* Dropdown styles */
.dropdown-toggle {
  position: relative;
  padding-right: 20px;
}

.dropdown-toggle .fa-caret-down {
  position: absolute;
  right: 5px;
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.dropdown-toggle .fa-caret-down.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 5px 0;
  margin: 0;
  min-width: 200px;
  z-index: 1000;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-menu li {
  margin: 0;
  height: auto;
  display: block;
}

.dropdown-menu li a {
  color: #333;
  padding: 10px 15px;
  display: block;
  white-space: nowrap;
  font-size: 0.9rem;
  text-decoration: none;
  transition: background-color 0.2s;
}

.dropdown-menu li a:hover {
  background-color: #f8f9fa;
  color: #4CAF50;
}

.dropdown-menu li a i {
  width: 20px;
  margin-right: 8px;
  color: #6c757d;
}

.dropdown-divider {
  height: 1px;
  margin: 0.5rem 0;
  overflow: hidden;
  background-color: #e9ecef;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navbar-menu li:not(:last-child):not(:nth-last-child(2)) {
    display: none;
  }
  
  .navbar-title span {
    display: none;
  }
}
</style>
