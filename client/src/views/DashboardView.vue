<template>
  <div class="dashboard-container">
    <!-- แถบเมนูด้านบน -->
    <NavbarMenu
      :activeDropdown="activeDropdown"
      @toggle-dropdown="toggleDropdown"
      @toggle-sidebar="toggleSidebar"
      @refs-ready="handleRefsReady"
    />

    <!-- เมนูด้านข้าง -->
    <SidebarMenu :isOpen="sidebarOpen" @toggle="toggleSidebar" />

    <!-- เนื้อหาหลักของหน้า Dashboard -->
    <main class="dashboard-content" :class="{'md:ml-64': sidebarOpen}">
      <h1 class="text-2xl font-semibold mb-6">ยินดีต้อนรับสู่ระบบจัดการข้อมูลขนส่ง</h1>
      
      <!-- Dashboard Summary -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- ยอดรวมวันนี้ -->
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <i class="fas fa-calendar-day text-primary"></i>
              </div>
              <h3 class="text-gray-600 font-medium ml-3">ยอดรวมวันนี้</h3>
            </div>
            <p class="text-2xl font-semibold">{{ formatCurrency(todayTotal) }}</p>
            <p class="text-sm text-green-500 mt-2">
              <i class="fas fa-arrow-up mr-1"></i>
              <span>+12.5% จากเมื่อวาน</span>
            </p>
          </div>
          
          <!-- ยอดรวมเดือนนี้ -->
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 rounded-full bg-secondary bg-opacity-10 flex items-center justify-center">
                <i class="fas fa-calendar-alt text-secondary"></i>
              </div>
              <h3 class="text-gray-600 font-medium ml-3">ยอดรวมเดือนนี้</h3>
            </div>
            <p class="text-2xl font-semibold">{{ formatCurrency(monthTotal) }}</p>
            <p class="text-sm text-green-500 mt-2">
              <i class="fas fa-arrow-up mr-1"></i>
              <span>+8.3% จากเดือนที่แล้ว</span>
            </p>
          </div>
          
          <!-- จำนวนคำสั่งซื้อ -->
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 rounded-full bg-accent bg-opacity-10 flex items-center justify-center">
                <i class="fas fa-shopping-cart text-accent"></i>
              </div>
              <h3 class="text-gray-600 font-medium ml-3">คำสั่งซื้อวันนี้</h3>
            </div>
            <p class="text-2xl font-semibold">24 รายการ</p>
            <p class="text-sm text-green-500 mt-2">
              <i class="fas fa-arrow-up mr-1"></i>
              <span>+5 รายการ จากเมื่อวาน</span>
            </p>
          </div>
          
          <!-- จำนวนลูกค้าใหม่ -->
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 rounded-full bg-purple-500 bg-opacity-10 flex items-center justify-center">
                <i class="fas fa-users text-purple-500"></i>
              </div>
              <h3 class="text-gray-600 font-medium ml-3">ลูกค้าใหม่</h3>
            </div>
            <p class="text-2xl font-semibold">8 ราย</p>
            <p class="text-sm text-red-500 mt-2">
              <i class="fas fa-arrow-down mr-1"></i>
              <span>-2 ราย จากเมื่อวาน</span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Charts and Tables Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Sales Chart -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100 lg:col-span-2">
          <h3 class="text-lg font-medium text-gray-700 mb-6">ยอดขาย 7 วันล่าสุด</h3>
          
          <!-- Bar Chart -->
          <div class="h-64 flex items-end space-x-4 mb-4">
            <div v-for="(day, index) in last7Days" :key="index" class="flex-1 flex flex-col items-center">
              <div 
                class="w-full bg-primary bg-opacity-80 hover:bg-opacity-100 rounded-t-sm transition-all" 
                :style="`height: ${day.total / 150}px`"
              ></div>
              <span class="text-xs mt-2 text-gray-600">{{ formatDate(day.date) }}</span>
            </div>
          </div>
          
          <!-- Chart Legend -->
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
              <span class="font-medium">รวมรายได้: </span>
              <span class="text-primary font-semibold">
                {{ formatCurrency(last7Days.reduce((total, day) => total + day.total, 0)) }}
              </span>
            </div>
            <button class="text-sm text-secondary hover:text-blue-700">
              <i class="fas fa-expand-arrows-alt mr-1"></i>
              <span>ดูเพิ่มเติม</span>
            </button>
          </div>
        </div>
        
        <!-- Latest Orders -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-medium text-gray-700">คำสั่งซื้อล่าสุด</h3>
            <a href="#" class="text-sm text-secondary hover:text-blue-700">ดูทั้งหมด</a>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th class="pb-3">เลขที่</th>
                  <th class="pb-3">ลูกค้า</th>
                  <th class="pb-3 text-right">ยอดรวม</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="order in latestOrders" :key="order.id" class="hover:bg-gray-50">
                  <td class="py-3 text-sm">
                    <span class="font-medium text-primary">{{ order.id }}</span>
                  </td>
                  <td class="py-3 text-sm">{{ order.customer }}</td>
                  <td class="py-3 text-sm text-right font-medium">{{ formatCurrency(order.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Action Button -->
          <div class="mt-6">
            <button class="w-full py-2 bg-primary text-white rounded hover:bg-green-600 transition-colors">
              <i class="fas fa-plus mr-1"></i>
              <span>เพิ่มคำสั่งซื้อใหม่</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Quick Access Tools -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-primary transition-colors group">
          <div class="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
            <i class="fas fa-file-import text-primary group-hover:text-white"></i>
          </div>
          <h3 class="text-lg font-medium mb-2">นำเข้าข้อมูล</h3>
          <p class="text-gray-500 text-sm">อัพโหลดไฟล์ CSV, Excel เพื่อนำเข้าข้อมูลคำสั่งซื้อ สินค้า หรือลูกค้า</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-secondary transition-colors group">
          <div class="w-12 h-12 rounded-full bg-secondary bg-opacity-10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-all">
            <i class="fas fa-file-export text-secondary group-hover:text-white"></i>
          </div>
          <h3 class="text-lg font-medium mb-2">ส่งออกข้อมูล</h3>
          <p class="text-gray-500 text-sm">ส่งออกรายงานยอดขาย คำสั่งซื้อ สินค้าคงคลัง ในรูปแบบไฟล์ที่ต้องการ</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-accent transition-colors group">
          <div class="w-12 h-12 rounded-full bg-accent bg-opacity-10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all">
            <i class="fas fa-truck text-accent group-hover:text-white"></i>
          </div>
          <h3 class="text-lg font-medium mb-2">ติดตามการขนส่ง</h3>
          <p class="text-gray-500 text-sm">ตรวจสอบสถานะการขนส่งทั้งหมด ดูข้อมูลการจัดส่งแบบเรียลไทม์</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NavbarMenu from '../components/NavbarMenu.vue'
import SidebarMenu from '../components/SidebarMenu.vue'
import { fetchSummaryData, fetchUserProfile } from '../services/api'

// ตัวแปรสำหรับข้อมูลสรุปยอดขาย
const todayTotal = ref(0)
const monthTotal = ref(0)
const last7Days = ref([])
const latestOrders = ref([])

// ตัวแปรสำหรับเก็บสถานะของ dropdown ที่เปิดอยู่
const activeDropdown = ref(null)

// ตัวแปรสำหรับเก็บสถานะของเมนูด้านข้าง
const sidebarOpen = ref(window.innerWidth >= 768)

// Refs สำหรับอ้างอิงถึงองค์ประกอบ dropdown
const dropdownRefs = ref({
  orders: null,
  products: null,
  reports: null
})

// ฟังก์ชันสำหรับจัดรูปแบบเงิน
const formatCurrency = (val) => {
  return Number(val).toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB'
  })
}

// ฟังก์ชันสำหรับจัดรูปแบบวันที่
const formatDate = (iso) => {
  const date = new Date(iso)
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short'
  })
}

// ฟังก์ชันสำหรับเปิด/ปิด dropdown
const toggleDropdown = (dropdownName) => {
  if (activeDropdown.value === dropdownName) {
    activeDropdown.value = null // ปิด dropdown ถ้าคลิกที่เดิม
  } else {
    activeDropdown.value = dropdownName // เปิด dropdown ที่คลิก
  }
}

// ฟังก์ชันสำหรับเปิด/ปิดเมนูด้านข้าง
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// ฟังก์ชันสำหรับปิด dropdown เมื่อคลิกที่อื่น
const handleClickOutside = (event) => {
  let clickedInside = false
  
  for (const key in dropdownRefs.value) {
    if (dropdownRefs.value[key] && dropdownRefs.value[key].contains(event.target)) {
      clickedInside = true
      break
    }
  }
  
  if (!clickedInside) {
    activeDropdown.value = null
  }
}

// ฟังก์ชันสำหรับรับ refs จาก NavbarMenu
const handleRefsReady = (refs) => {
  // อัพเดต refs เพื่อใช้ในการตรวจสอบการคลิกภายนอก
  dropdownRefs.value = refs
}

// ฟังก์ชันสำหรับการโหลดข้อมูลสรุป
const loadSummaryData = async () => {
  try {
    const data = await fetchSummaryData()
    todayTotal.value = data.todayTotal
    monthTotal.value = data.monthTotal
    last7Days.value = data.last7Days
    latestOrders.value = data.latestOrders
  } catch (error) {
    console.error('Failed to load summary data:', error)
    // กำหนดค่าเริ่มต้นในกรณีที่มีข้อผิดพลาด
    todayTotal.value = 15000
    monthTotal.value = 450000
    last7Days.value = [
      { date: '2023-05-01', total: 12000 },
      { date: '2023-05-02', total: 15000 },
      { date: '2023-05-03', total: 8000 },
      { date: '2023-05-04', total: 20000 },
      { date: '2023-05-05', total: 18000 },
      { date: '2023-05-06', total: 25000 },
      { date: '2023-05-07', total: 22000 }
    ]
    latestOrders.value = [
      { id: '1001', customer: 'สมชาย ใจดี', total: 5000 },
      { id: '1002', customer: 'สมหญิง รักดี', total: 3500 },
      { id: '1003', customer: 'สมศักดิ์ มีเงิน', total: 8000 },
      { id: '1004', customer: 'สมประสงค์ ประสบผล', total: 12000 }
    ]
  }
}

// โหลดข้อมูลผู้ใช้
const loadUserProfile = async () => {
  try {
    await fetchUserProfile()
  } catch (error) {
    console.error('Failed to load user profile:', error)
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // ตรวจสอบขนาดหน้าจอและปรับสถานะ sidebar
  const handleResize = () => {
    if (window.innerWidth >= 768 && !sidebarOpen.value) {
      sidebarOpen.value = true
    }
  }
  window.addEventListener('resize', handleResize)
  
  // โหลดข้อมูล
  loadSummaryData()
  loadUserProfile()
  
  return () => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import '../assets/css/sidebar.css';

.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

.dashboard-content {
  flex: 1;
  padding: 1.5rem;
  background-color: #f5f7fa;
  transition: margin-left 0.3s ease;
}

/* Colors */
:root {
  --primary: #4CAF50;
  --secondary: #2196F3;
  --accent: #FF9800;
  --error: #E53935;
  --success: #43A047;
  --warning: #FFB300;
  --background: #f5f7fa;
  --surface: #ffffff;
}

.text-primary {
  color: var(--primary);
}

.text-secondary {
  color: var(--secondary);
}

.text-accent {
  color: var(--accent);
}

.bg-primary {
  background-color: var(--primary);
}

.bg-secondary {
  background-color: var(--secondary);
}

.bg-accent {
  background-color: var(--accent);
}

h1 {
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .md\:ml-64 {
    margin-left: 16rem;
  }
}
</style>
