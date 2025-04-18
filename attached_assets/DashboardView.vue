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
    <main class="dashboard-content">
      <h1>ยินดีต้อนรับสู่ระบบจัดการข้อมูลขนส่ง</h1>
      <div class="dashboard-summary">
        <div class="summary-grid">
          <!-- การ์ดสรุป -->
          <div class="summary-card">
            <h3>ยอดรวมวันนี้</h3>
            <p class="value">{{ formatCurrency(todayTotal) }}</p>
          </div>
          <div class="summary-card">
            <h3>ยอดรวมเดือนนี้</h3>
            <p class="value">{{ formatCurrency(monthTotal) }}</p>
          </div>

          <!-- กราฟยอดขาย -->
          <div class="summary-chart">
            <h3>ยอดขาย 7 วันล่าสุด</h3>
            <ul class="chart-bar">
              <li v-for="(day, i) in last7Days" :key="i">
                <span :style="{ height: day.total / 1000 + 'px' }"></span>
                <small>{{ formatDate(day.date) }}</small>
              </li>
            </ul>
          </div>

          <!-- ตารางล่าสุด -->
          <div class="summary-table">
            <h3>คำสั่งซื้อล่าสุด</h3>
            <table>
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>ลูกค้า</th>
                  <th>ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in latestOrders" :key="order.id">
                  <td>{{ order.id }}</td>
                  <td>{{ order.customer }}</td>
                  <td>{{ formatCurrency(order.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import SidebarMenu from './SidebarMenu.vue';
import NavbarMenu from './NavbarMenu.vue';

// ตัวแปรสำหรับข้อมูลสรุปยอดขาย
// ข้อมูลสรุปยอดขาย
const todayTotal = ref(0)
const monthTotal = ref(0)
const last7Days = ref([])
const latestOrders = ref([])

// ฟังก์ชันสำหรับจัดรูปแบบเงิน
const formatCurrency = (val) =>
  Number(val).toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB'
  })

// ฟังก์ชันสำหรับจัดรูปแบบวันที่
const formatDate = (iso) => {
  const date = new Date(iso)
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short'
  })
}

// ตัวแปรสำหรับเก็บสถานะของ dropdown ที่เปิดอยู่
const activeDropdown = ref(null);

// ตัวแปรสำหรับเก็บสถานะของเมนูด้านข้าง
const sidebarOpen = ref(false);

// Refs สำหรับอ้างอิงถึงองค์ประกอบ dropdown
const ordersDropdown = ref(null);
const productsDropdown = ref(null);
const reportsDropdown = ref(null);

// เก็บ refs ไว้ในออบเจ็คต์เพื่อใช้ในการตรวจสอบการคลิกภายนอก
const dropdownRefs = {
  orders: ordersDropdown,
  products: productsDropdown,
  reports: reportsDropdown
};

// ฟังก์ชันสำหรับเปิด/ปิด dropdown
const toggleDropdown = (dropdownName) => {
  if (activeDropdown.value === dropdownName) {
    activeDropdown.value = null; // ปิด dropdown ถ้าคลิกที่เดิม
  } else {
    activeDropdown.value = dropdownName; // เปิด dropdown ที่คลิก
  }
};

// ฟังก์ชันสำหรับเปิด/ปิดเมนูด้านข้าง
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

// ฟังก์ชันสำหรับปิด dropdown เมื่อคลิกที่อื่น
const handleClickOutside = (event) => {
  let clickedInside = false;
  for (const key in dropdownRefs) {
    if (dropdownRefs[key].value && dropdownRefs[key].value.contains(event.target)) {
      clickedInside = true;
      break;
    }
  }
  if (!clickedInside) {
    activeDropdown.value = null;
  }
};

// ฟังก์ชันสำหรับรับ refs จาก NavbarMenu
const handleRefsReady = (refs) => {
  // อัพเดต refs เพื่อใช้ในการตรวจสอบการคลิกภายนอก
  for (const key in refs) {
    if (dropdownRefs[key]) {
      dropdownRefs[key].value = refs[key];
    }
  }
};

// เพิ่ม/ลบ event listener สำหรับการคลิกภายนอก
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  console.log('Dashboard component mounted');

  // ดึงข้อมูลผู้ใช้จาก API
  fetchUserData();

  // ดึงข้อมูลสรุปยอดขาย
  fetchSummaryData();
});

// ฟังก์ชันสำหรับดึงข้อมูลสรุปยอดขาย
const fetchSummaryData = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:3000/api/orders/summary', {
      headers: {
        'x-auth-token': token
      }
    })

    todayTotal.value = res.data.todayTotal || 15000
    monthTotal.value = res.data.monthTotal || 450000
    last7Days.value = res.data.last7Days || [
      { date: '2023-05-01', total: 12000 },
      { date: '2023-05-02', total: 15000 },
      { date: '2023-05-03', total: 8000 },
      { date: '2023-05-04', total: 20000 },
      { date: '2023-05-05', total: 18000 },
      { date: '2023-05-06', total: 25000 },
      { date: '2023-05-07', total: 22000 }
    ]
    latestOrders.value = res.data.latestOrders || [
      { id: '1001', customer: 'สมชาย ใจดี', total: 5000 },
      { id: '1002', customer: 'สมหญิง รักดี', total: 3500 },
      { id: '1003', customer: 'สมศักดิ์ มีเงิน', total: 8000 },
      { id: '1004', customer: 'สมประสงค์ ประสบผล', total: 12000 }
    ]
  } catch (err) {
    console.error('ไม่สามารถโหลดข้อมูลยอดขาย:', err)
    // ใช้ข้อมูลทดสอบแทน
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
};

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await axios.get('http://localhost:3000/api/users/profile', {
      headers: {
        'x-auth-token': token
      }
    });

    if (response.data && response.data.success) {
      const userData = response.data.user;
      console.log('User data fetched in Dashboard:', userData);

      // อัพเดตข้อมูลใน DOM โดยตรง
      const sidebarUserNameElement = document.getElementById('sidebarUserName');
      if (sidebarUserNameElement) {
        sidebarUserNameElement.textContent = userData.fullname || userData.username;
      }

      const sidebarUserRoleElement = document.getElementById('sidebarUserRole');
      if (sidebarUserRoleElement && userData.role) {
        sidebarUserRoleElement.textContent = userData.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป';
      }

      const sidebarUserBalanceElement = document.getElementById('sidebarUserBalance');
      if (sidebarUserBalanceElement) {
        sidebarUserBalanceElement.textContent = formatBalance(userData.balance || 0) + ' บาท';
      }
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
  }
};

// ฟังก์ชันสำหรับจัดรูปแบบเงิน
const formatBalance = (balance) => {
  return Number(balance).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  console.log('Dashboard component will unmount');
});
</script>

<style scoped>
@import '../assets/css/sidebar.css';

/* สไตล์สำหรับหน้า Dashboard */
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Kanit', sans-serif;
  position: relative;
}

/* สไตล์สำหรับแถบเมนูด้านบน */
.top-navbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  font-family: 'Kanit', sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-title {
  color: #333;
  font-size: 1.2em;
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
  margin-left: 15px;
  height: 100%;
  display: flex;
  align-items: center;
}

.navbar-menu li a {
  text-decoration: none;
  color: #555;
  padding: 0 10px;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  height: 100%;
  border-bottom: 3px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.navbar-menu li a:hover,
.navbar-menu li a.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.navbar-menu li a i {
  margin-right: 5px;
  width: 16px;
  text-align: center;
}

.navbar-menu li a span {
  display: inline-block;
}

/* Dropdown specific styles */
.dropdown {
  position: relative;
}

.dropdown-toggle {
  cursor: pointer;
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
  font-size: 0.9em;
  border-bottom: none;
  height: auto;
}

.dropdown-menu li a:hover {
  background-color: #f8f9fa;
  color: #4CAF50;
  border-bottom: none;
}

.dropdown-menu li a i {
  width: auto;
  margin-right: 8px;
  color: #6c757d;
}

.dropdown-divider {
  height: 1px;
  margin: 0.5rem 0;
  overflow: hidden;
  background-color: #e9ecef;
  border: none;
}

/* ปรับแต่งไอคอน caret */
.fa-caret-down {
  transition: transform 0.2s ease;
}

.dropdown-toggle[aria-expanded="true"] .fa-caret-down {
  transform: rotate(180deg);
}

/* สไตล์สำหรับเนื้อหาหลัก */
.dashboard-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  transition: padding-right 0.3s ease;
}

.dashboard-content h1 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: #333;
}

.dashboard-summary {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 20px;
  min-height: 300px;
}

/* สไตล์สำหรับ summary grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.summary-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.summary-card h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #6c757d;
}

.summary-card .value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4CAF50;
  margin: 0;
}

.summary-chart {
  grid-column: span 2;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-chart h3 {
  margin: 0 0 20px 0;
  font-size: 1rem;
  color: #6c757d;
}

.chart-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 150px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.chart-bar li {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 5px;
}

.chart-bar li span {
  width: 100%;
  background-color: #4CAF50;
  border-radius: 4px 4px 0 0;
  margin-bottom: 5px;
  min-height: 5px;
}

.chart-bar li small {
  font-size: 0.8rem;
  color: #6c757d;
}

.summary-table {
  grid-column: span 2;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-table h3 {
  margin: 0 0 20px 0;
  font-size: 1rem;
  color: #6c757d;
}

.summary-table table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table th,
.summary-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.summary-table th {
  font-weight: 600;
  color: #495057;
}

.summary-table td {
  color: #6c757d;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-chart,
  .summary-table {
    grid-column: span 1;
  }
}

</style>