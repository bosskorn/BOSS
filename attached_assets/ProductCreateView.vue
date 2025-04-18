<template>
  <div class="page-container">
    <!-- แถบเมนูด้านบนแบบ dropdown ตามที่ส่งมา -->
    <nav class="top-navbar">
      <div class="navbar-left">
        <a href="/" style="text-decoration: none;">
          <div class="navbar-title"><i class="fa-solid fa-truck-fast"></i> ระบบจัดการข้อมูลขนส่ง</div>
        </a>
      </div>
      <ul class="navbar-menu">
        <li><a href="/dashboard"><i class="fa-solid fa-chart-pie"></i><span>Dashboard</span></a></li>
        <li><a href="/topup"><i class="fa-solid fa-plus-circle"></i><span>เติมเครดิต</span></a></li>

        <li class="dropdown" ref="ordersDropdown">
          <a href="#" class="dropdown-toggle" @click.prevent="toggleDropdown('orders')" aria-haspopup="true" :aria-expanded="activeDropdown === 'orders'">
            <i class="fa-solid fa-clipboard-list"></i><span>คำสั่งซื้อ</span>
            <i class="fa-solid fa-caret-down" style="margin-left: 5px; font-size: 0.8em;"></i>
          </a>
          <ul class="dropdown-menu" :class="{ show: activeDropdown === 'orders' }">
            <li><a href="/orders-all"><i class="fa-solid fa-list-ul"></i><span>คำสั่งซื้อทั้งหมด</span></a></li>
            <li><a href="/create-order"><i class="fa-solid fa-plus-circle"></i><span>สร้างออเดอร์</span></a></li>
            <li><a href="/parcel-list"><i class="fa-solid fa-box-open"></i><span>รายการพัสดุ</span></a></li>
            <li><a href="/claims-list"><i class="fa-solid fa-shield-halved"></i><span>รายการเคลมพัสดุ</span></a></li>
          </ul>
        </li>

        <li class="dropdown" ref="productsDropdown">
          <a href="#" class="dropdown-toggle active" @click.prevent="toggleDropdown('products')" aria-haspopup="true" :aria-expanded="activeDropdown === 'products'">
            <i class="fa-solid fa-boxes-stacked"></i><span>สินค้า</span>
            <i class="fa-solid fa-caret-down" style="margin-left: 5px; font-size: 0.8em;"></i>
          </a>
          <ul class="dropdown-menu" :class="{ show: activeDropdown === 'products' }">
            <li><router-link to="/product-list"><i class="fa-solid fa-tags"></i><span>สินค้าทั้งหมด</span></router-link></li>
            <li><router-link to="/product-create" class="active"><i class="fa-solid fa-plus-square"></i><span>สร้างสินค้า</span></router-link></li>
            <li><router-link to="/category-manage"><i class="fa-solid fa-folder-plus"></i><span>เพิ่มหมวดหมู่สินค้า</span></router-link></li>
          </ul>
        </li>

        <li class="dropdown" ref="reportsDropdown">
          <a href="#" class="dropdown-toggle" @click.prevent="toggleDropdown('reports')" aria-haspopup="true" :aria-expanded="activeDropdown === 'reports'">
            <i class="fa-solid fa-file-alt"></i><span>รายงาน</span>
            <i class="fa-solid fa-caret-down" style="margin-left: 5px; font-size: 0.8em;"></i>
          </a>
          <ul class="dropdown-menu" :class="{ show: activeDropdown === 'reports' }">
            <li><a href="/reports/overview"><i class="fas fa-tachometer-alt"></i><span>ภาพรวมรายงาน</span></a></li>
            <li><a href="/reports/by-courier"><i class="fas fa-shipping-fast"></i><span>รายงานตามขนส่ง</span></a></li>
            <li><a href="/reports/by-area"><i class="fas fa-map-marked-alt"></i><span>รายงานตามพื้นที่</span></a></li>
            <li><a href="/reports/cod"><i class="fas fa-dollar-sign"></i><span>รายงาน COD</span></a></li>
            <li><a href="/reports/returns"><i class="fas fa-undo"></i><span>รายงานพัสดุตีกลับ</span></a></li>
            <li><a href="/claims-list"><i class="fas fa-shield-alt"></i><span>(ดูรายการเคลม)</span></a></li>
          </ul>
        </li>

        <li>
          <a href="#" @click.prevent="toggleSidebar">
            <i class="fa-solid fa-user"></i><span>บัญชี</span>
          </a> c]t
        </li>
      </ul>
    </nav>

    <!-- Sidebar Menu -->
    <div class="sidebar" :class="{ 'show': sidebarVisible }">
      <div class="sidebar-header">
        <div><i class="fa-solid fa-user"></i> บัญชีผู้ใช้</div>
        <button class="sidebar-close" @click="toggleSidebar">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="user-menu">
        <div class="user-info">
          <div class="user-avatar"><i class="fa-solid fa-user"></i></div>
          <div>
            <div class="user-name" id="sidebarUserName">กำลังโหลด...</div>
            <div class="user-role" id="sidebarUserRole">กำลังโหลด...</div>
          </div>
        </div>
        <div class="user-balance">
          <span><i class="fa-solid fa-wallet"></i> ยอดเงินคงเหลือ:</span>
          <span id="sidebarUserBalance">กำลังโหลด...</span>
        </div>
      </div>
      <ul class="sidebar-menu">
        <li><a href="/profile"><i class="fa-solid fa-user-gear"></i> ข้อมูลผู้ใช้</a></li>
        <li><a href="/topup"><i class="fa-solid fa-credit-card"></i> เติมเครดิต</a></li>
        <li><a href="#" @click.prevent="handleLogout"><i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ</a></li>
      </ul>
    </div>

    <!-- เนื้อหาหลักของหน้าสร้างสินค้า ตามรูปแบบในภาพ -->
    <main class="dashboard-content">
      <div class="container">
        <div class="product-create-container">
          <!-- หัวข้อสร้างสินค้าใหม่ -->
          <div class="section-header">
            <i class="fa-solid fa-plus-circle"></i> สร้างสินค้าใหม่
          </div>

          <!-- ส่วนข้อมูลทั่วไป -->
          <div class="section-content">
            <div class="section-title">
              <i class="fa-solid fa-info-circle"></i> ข้อมูลทั่วไป
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="productSKU">SKU *</label>
                <input
                  type="text"
                  id="productSKU"
                  v-model="product.sku"
                  class="form-control"
                  placeholder="รหัสสินค้าที่ใช้งาน"
                >
              </div>

              <div class="form-group">
                <label for="productName">ชื่อสินค้า *</label>
                <input
                  type="text"
                  id="productName"
                  v-model="product.name"
                  required
                  class="form-control"
                  placeholder="ชื่อสินค้าที่แสดง"
                >
              </div>

              <div class="form-group">
                <label for="productCategory">หมวดหมู่</label>
                <select
                  id="productCategory"
                  v-model="product.category_id"
                  class="form-control"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
                <div class="mt-2 text-sm text-gray-600" v-if="categories.length === 0">
                  ยังไม่มีหมวดหมู่ในระบบ <router-link to="/category-manage" class="text-indigo-600">คลิกที่นี่</router-link> เพื่อเพิ่มหมวดหมู่
                </div>
              </div>
            </div>

            <div class="form-group description-group">
              <label for="productDescription">รายละเอียดสินค้า</label>
              <textarea
                id="productDescription"
                v-model="product.description"
                class="form-control"
                rows="3"
                placeholder="รายละเอียดสินค้าเพิ่มเติม"
              ></textarea>
            </div>
          </div>

          <!-- ส่วนราคาและสต็อก -->
          <div class="section-content">
            <div class="section-title">
              <i class="fa-solid fa-dollar-sign"></i> ราคาและสต็อก
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="productPrice">ราคาขาย *</label>
                <input
                  type="number"
                  id="productPrice"
                  v-model="product.price"
                  required
                  min="0"
                  step="0.01"
                  class="form-control"
                  placeholder="0.00"
                >
              </div>

              <div class="form-group">
                <label for="productCost">ราคาต้นทุน/หน่วย</label>
                <input
                  type="number"
                  id="productCost"
                  v-model="product.cost"
                  min="0"
                  step="0.01"
                  class="form-control"
                  placeholder="0.00 (ไม่บังคับ)"
                >
              </div>

              <div class="form-group">
                <label for="productStock">จำนวนสต็อก</label>
                <input
                  type="number"
                  id="productStock"
                  v-model="product.stock"
                  min="0"
                  class="form-control"
                  placeholder="0"
                >
              </div>
            </div>
          </div>

          <!-- ส่วนรูปภาพสินค้า -->
          <div class="section-content">
            <div class="section-title">
              <i class="fa-solid fa-image"></i> รูปภาพสินค้า
            </div>

            <div class="form-row">
              <div class="form-group upload-group">
                <label>เลือกรูปภาพ</label>
                <div class="upload-container">
                  <input type="file" id="productImage" @change="handleImageUpload" ref="fileInput" accept="image/*" style="display: none">
                  <button type="button" class="upload-button" @click="$refs.fileInput.click()">
                    <i class="fa-solid fa-upload"></i> กดเพื่อแนบรูปภาพ
                  </button>
                  <div class="upload-placeholder">
                    {{ product.image ? product.image.name : 'No file chosen' }}
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>ตัวอย่างรูปภาพ</label>
                <div class="image-preview-placeholder">
                  <img v-if="imagePreview" :src="imagePreview" alt="ตัวอย่างรูปภาพ" class="preview-image">
                  <span v-else>ยังไม่มีรูปภาพ</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ส่วนสถานะสินค้า -->
          <div class="section-content">
            <div class="section-title">
              <i class="fa-solid fa-toggle-on"></i> สถานะสินค้า
            </div>

            <div class="form-group status-group">
              <label>สถานะ</label>
              <select
                id="productStatus"
                v-model="product.status"
                required
                class="form-control"
              >
                <option value="active">ใช้งาน (Active)</option>
                <option value="inactive">ไม่ใช้งาน (Inactive)</option>
              </select>
            </div>
          </div>

          <!-- ปุ่มบันทึก -->
          <div class="form-actions">
            <button type="button" @click="createProduct" class="btn btn-primary" :disabled="isSubmitting">
              <i class="fa-solid fa-save"></i> {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสินค้า' }}
            </button>
            <router-link to="/product-list" class="btn btn-secondary">
              <i class="fa-solid fa-times"></i> ยกเลิก
            </router-link>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { productService } from '../services/apiService';
import axios from 'axios';

export default {
  name: 'ProductCreate',
  setup() {
    const router = useRouter();
    const activeDropdown = ref(null);
    const ordersDropdown = ref(null);
    const productsDropdown = ref(null);
    const reportsDropdown = ref(null);
    const settingsDropdown = ref(null);
    const sidebarVisible = ref(false);

    const categories = ref([]);

    const product = ref({
      name: '',
      sku: '',
      category_id: '',
      price: 0,
      cost: 0,
      stock: 0,
      status: 'active',
      description: '',
      image: null
    });

    // ดึงข้อมูลหมวดหมู่จาก API
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/categories', {
          headers: {
            'x-auth-token': token
          }
        });

        if (response.data && response.data.success) {
          categories.value = response.data.categories;
        } else {
          console.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้:', response.data);
        }
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', err);
      }
    };

    const error = ref('');
    const isSubmitting = ref(false);
    const imagePreview = ref(null);
    // ใช้ productService จาก apiService.js แทนการกำหนด URL โดยตรง
    console.log('Using productService for API calls');

    // ฟังก์ชันสำหรับจัดการการอัปโหลดรูปภาพ
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
      if (!file.type.match('image.*')) {
        error.value = 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น';
        return;
      }

      // เก็บไฟล์ใน product.image เพื่อส่งไปยัง API
      product.value.image = file;

      // สร้าง URL สำหรับแสดงตัวอย่างรูปภาพ
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Dropdown refs for click outside detection
    const dropdownRefs = {
      orders: ordersDropdown,
      products: productsDropdown,
      reports: reportsDropdown,
      settings: settingsDropdown
    };

    // Toggle dropdown visibility
    const toggleDropdown = (dropdownName) => {
      if (activeDropdown.value === dropdownName) {
        activeDropdown.value = null;
      } else {
        activeDropdown.value = dropdownName;
      }
    };

    // Close dropdowns when clicking outside
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

    // Check authentication
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return false;
      }
      return true;
    };

    // Create product
    const createProduct = async () => {
      if (!checkAuth()) return;

      isSubmitting.value = true;
      error.value = '';

      try {
        // ไม่ได้ใช้ token ในการส่งข้อมูลแล้ว
        // const token = localStorage.getItem('token');

        // ใช้ FormData เพื่อส่งข้อมูลรวมถึงไฟล์รูปภาพ
        const formData = new FormData();
        formData.append('name', product.value.name);
        formData.append('sku', product.value.sku || '');
        formData.append('category_id', product.value.category_id || '');
        formData.append('description', product.value.description || '');
        formData.append('price', product.value.price);
        formData.append('cost', product.value.cost || 0);
        formData.append('stock', product.value.stock || 0);
        formData.append('status', product.value.status);

        // เพิ่มไฟล์รูปภาพถ้ามี
        if (product.value.image) {
          formData.append('image', product.value.image);
        }

        // แสดงข้อมูลการส่งในคอนโซล
        console.log('Sending product data to API');
        console.log('Form data:', [...formData.entries()]);

        // ใช้ productService แทนการเรียก axios โดยตรง
        // สร้างอ็อบเจ็กต์ข้อมูลสินค้าจาก FormData
        const productData = {};
        for (const [key, value] of formData.entries()) {
          productData[key] = value;
        }

        // เรียกใช้ productService.createProduct
        const response = await productService.createProduct(productData);

        if (response.success) {
          Swal.fire('สำเร็จ!', 'สร้างสินค้าใหม่เรียบร้อยแล้ว', 'success');
          router.push('/product-list');
        } else {
          error.value = response.message || 'ไม่สามารถสร้างสินค้าได้';
          Swal.fire('เกิดข้อผิดพลาด!', error.value, 'error');
        }
      } catch (err) {
        console.error('Error creating product:', err);
        console.error('Error details:', err.message);
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
        }

        error.value = 'เกิดข้อผิดพลาดในการสร้างสินค้า';
        if (err.response && err.response.data && err.response.data.message) {
          error.value = err.response.data.message;
        } else if (err.message) {
          // แสดงข้อความข้อผิดพลาดที่ชัดเจนขึ้น
          error.value = `เกิดข้อผิดพลาด: ${err.message}`;

          // แสดงคำแนะนำเพิ่มเติมสำหรับข้อผิดพลาด 404
          if (err.message.includes('404')) {
            error.value += '\n\nกรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่หรือไม่ และ URL ถูกต้อง';
          }
        }

        Swal.fire('เกิดข้อผิดพลาด!', error.value, 'error');
      } finally {
        isSubmitting.value = false;
      }
    };

    // Format balance
    const formatBalance = (balance) => {
      return Number(balance).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Toggle sidebar
    const toggleSidebar = () => {
      sidebarVisible.value = !sidebarVisible.value;
    };

    // Fetch user data
    const fetchUserData = async () => {
      try {
        // ใช้ userService แทนการเรียก fetch โดยตรง
        const response = await axios.get('http://localhost:3000/api/users/profile', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        console.log('User profile response:', response);

        // ตรวจสอบว่ามีข้อมูลใน response.data
        if (response.data && response.data.success) {
          const userData = response.data.user;
          document.getElementById('sidebarUserName').textContent = userData.username || userData.fullname;
          document.getElementById('sidebarUserRole').textContent = userData.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป';
          document.getElementById('sidebarUserBalance').textContent = formatBalance(userData.balance || 0) + ' บาท';
        }
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
      }
    };

    // Logout function
    const handleLogout = () => {
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        router.push('/login');
      } catch (error) {
        console.error("Error signing out: ", error);
        alert('เกิดข้อผิดพลาดในการออกจากระบบ');
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      if (!checkAuth()) return;

      document.addEventListener('click', handleClickOutside);

      // ไม่ต้องส่ง token เพราะ userService จะจัดการให้
      fetchUserData();

      // ดึงข้อมูลหมวดหมู่
      fetchCategories();

      // Set products dropdown to active by default
      activeDropdown.value = 'products';
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      product,
      categories,
      error,
      isSubmitting,
      imagePreview,
      activeDropdown,
      sidebarVisible,
      ordersDropdown,
      productsDropdown,
      reportsDropdown,
      settingsDropdown,
      toggleDropdown,
      toggleSidebar,
      createProduct,
      handleLogout,
      handleImageUpload
    };
  }
}
</script>

<style scoped>
@import '../assets/css/sidebar.css';

/* สไตล์สำหรับหน้า Dashboard */
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Kanit', sans-serif;
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
  background-color: #f4f6f9;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.product-create-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  background-color: #4CAF50;
  color: white;
  padding: 15px 20px;
  font-size: 1.2rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.section-header i {
  margin-right: 10px;
}

.section-content {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.section-title {
  color: #4CAF50;
  font-weight: 500;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 8px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
  min-width: 200px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  color: #333;
  font-family: 'Kanit', sans-serif;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.description-group {
  margin-top: 10px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-button {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.upload-button:hover {
  background-color: #e0e0e0;
}

.upload-button i {
  color: #4CAF50;
}

.upload-placeholder {
  border: 1px dashed #ddd;
  padding: 10px;
  text-align: center;
  color: #999;
  border-radius: 4px;
  background-color: #f9f9f9;
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-preview-placeholder {
  height: 120px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.status-group {
  max-width: 300px;
}

.form-actions {
  display: flex;
  gap: 15px;
  padding: 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Kanit', sans-serif;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #3d8b40;
}

.btn-primary:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  text-decoration: none;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.error-message {
  margin: 0 20px 20px;
  padding: 12px;
  background-color: #fdecea;
  color: #b71c1c;
  border-radius: 4px;
  border: 1px solid #f44336;
}

/* Responsive styles */
@media (max-width: 768px) {
  .container {
    padding: 0 10px;
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
