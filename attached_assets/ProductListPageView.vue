<template>
    <div class="page-container">
       <!-- แถบเมนูด้านบน -->
    <NavbarMenu
      :activeDropdown="activeDropdown"
      @toggle-dropdown="toggleDropdown"
      @toggle-sidebar="toggleSidebar"
      @refs-ready="handleRefsReady"
    />

      <div class="content-container">
        <div class="card-container">
          <div class="card-header">
            <i class="fa-solid fa-tags"></i> สินค้าทั้งหมด
          </div>

          <div class="card-body">
            <!-- ส่วนค้นหาและกรอง -->
            <div class="form-row">
              <div class="form-group" style="flex: 2;">
                <label for="productSearch">ค้นหาสินค้า (ชื่อ หรือ SKU):</label>
                <input
                  type="text"
                  id="productSearch"
                  class="form-control"
                  v-model="searchTerm"
                  placeholder="กรอกชื่อสินค้า หรือ SKU"
                  @keyup.enter="applyProductFilters"
                >
              </div>
              <div class="form-group">
                <label for="productCategoryFilter">หมวดหมู่:</label>
                <select id="productCategoryFilter" class="form-control" v-model="selectedCategory">
                  <option value="">ทั้งหมด</option>
                  <option value="เสื้อผ้า">เสื้อผ้า</option>
                  <option value="เครื่องสำอาง">เครื่องสำอาง</option>
                  <option value="อาหารเสริม">อาหารเสริม</option>
                </select>
              </div>
              <div class="form-group">
                <label for="productStatusFilter">สถานะ:</label>
                <select id="productStatusFilter" class="form-control" v-model="selectedStatus">
                  <option value="">ทั้งหมด</option>
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                </select>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
              <button
                class="btn btn-primary"
                @click="applyProductFilters"
                style="margin-right: 10px;"
              >
                <i class="fas fa-search"></i> ค้นหา
              </button>
              <router-link
                to="/product-create"
                class="btn btn-secondary"
              >
                <i class="fas fa-plus"></i> เพิ่มสินค้า
              </router-link>
            </div>

            <div class="alert alert-danger" v-if="error">{{ error }}</div>

            <!-- ส่วนแสดงรายการสินค้า -->
            <div class="table-container">
              <h3 style="margin-bottom: 15px;">
                <i class="fa-solid fa-list"></i> รายการสินค้า ({{ formatNumber(products.length) }} รายการ)
              </h3>

              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 60px;">รูปภาพ</th>
                    <th style="width: 120px;">SKU</th>
                    <th>ชื่อสินค้า</th>
                    <th style="width: 120px;">หมวดหมู่</th>
                    <th style="width: 100px; text-align: right;">ราคา (บาท)</th>
                    <th style="width: 80px; text-align: right;">คงเหลือ</th>
                    <th style="width: 80px; text-align: center;">สถานะ</th>
                    <th style="width: 100px; text-align: center;">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="products.length === 0">
                    <td colspan="8" style="text-align: center; padding: 30px;">
                      <div v-if="loading" style="display: flex; justify-content: center; align-items: center;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i> กำลังโหลดข้อมูล...
                      </div>
                      <div v-else>ไม่พบสินค้า</div>
                    </td>
                  </tr>
                  <tr v-for="product in products" :key="product.id">
                    <td>
                      <img
                        v-if="product.imageUrl"
                        :src="getImageUrl(product.imageUrl)"
                        width="40"
                        height="40"
                        style="object-fit: cover; border-radius: 4px;"
                        :alt="product.name"
                      >
                      <span v-else><i class="fas fa-image" style="color: #ddd;"></i></span>
                    </td>
                    <td>{{ product.sku || '-' }}</td>
                    <td>{{ product.name || '-' }}</td>
                    <td>{{ product.category || '-' }}</td>
                    <td style="text-align: right;">{{ formatCurrency(product.price) }}</td>
                    <td style="text-align: right;">{{ product.stock || 0 }}</td>
                    <td style="text-align: center;">
                      <span :class="getStatusBadgeClass(product.status)">
                        {{ getStatusText(product.status) }}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <button @click="editProduct(product.id)" class="btn-icon btn-edit" title="แก้ไข">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="confirmDeleteProduct(product.id, product.name)" class="btn-icon btn-delete" title="ลบ">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Edit Product Modal -->
        <div v-if="showEditModal" class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h3>แก้ไขสินค้า</h3>
                <button type="button" class="close-btn" @click="closeEditModal">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div class="modal-body">
                <form @submit.prevent="submitEditProduct">
                  <div class="form-group">
                    <label for="editProductName">ชื่อสินค้า:</label>
                    <input
                      type="text"
                      id="editProductName"
                      class="form-control"
                      v-model="editingProduct.name"
                      required
                    >
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="editProductPrice">ราคา:</label>
                      <input
                        type="number"
                        id="editProductPrice"
                        class="form-control"
                        v-model="editingProduct.price"
                        required
                      >
                    </div>

                    <div class="form-group">
                      <label for="editProductCategory">หมวดหมู่:</label>
                      <input
                        type="text"
                        id="editProductCategory"
                        class="form-control"
                        v-model="editingProduct.category"
                        required
                      >
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="editProductStatus">สถานะ:</label>
                    <select
                      id="editProductStatus"
                      class="form-control"
                      v-model="editingProduct.status"
                      required
                    >
                      <option value="active">ใช้งาน</option>
                      <option value="inactive">ไม่ใช้งาน</option>
                    </select>
                  </div>

                  <div class="form-actions" style="text-align: right; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" @click="closeEditModal" style="margin-right: 10px;">
                      ยกเลิก
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="updatingProduct">
                      <i class="fas fa-save"></i>
                      {{ updatingProduct ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- เมนูด้านข้าง -->
      <SidebarMenu :isOpen="sidebarOpen" @toggle="toggleSidebar" />
    </div>
  </template>

  <script>
  import axios from 'axios';
  import Swal from 'sweetalert2';
  import SidebarMenu from './SidebarMenu.vue';
  import NavbarMenu from './NavbarMenu.vue';

  export default {
    name: 'ProductList',
    components: {
      SidebarMenu,
      NavbarMenu
    },
    data() {
      return {
        products: [],
        searchTerm: '',
        selectedCategory: '',
        selectedStatus: '',
        loading: false,
        loadingMessage: 'กำลังโหลด...',
        error: '',
        showEditModal: false,
        editingProduct: {
          id: '',
          name: '',
          price: 0,
          category: '',
          status: 'active'
        },
        updatingProduct: false,
        apiUrl: 'http://localhost:3000/api',
        activeDropdown: null,
        sidebarOpen: false
      }
    },
    created() {
      this.checkAuth();
      this.loadProducts();
    },
    mounted() {
      document.addEventListener('click', this.handleClickOutside);
      // ดึงข้อมูลผู้ใช้จาก API
      const token = localStorage.getItem('token');
      if (token) {
        this.fetchUserData(token);
      }
    },
    beforeUnmount() {
      document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
      checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
          this.error = "กรุณาเข้าสู่ระบบ";
          this.$router.push('/login');
          return false;
        }
        return true;
      },
      async loadProducts() {
        if (!this.checkAuth()) return;

        this.loading = true;
        this.error = '';

        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${this.apiUrl}/products`, {
            headers: {
              'x-auth-token': token
            },
            params: {
              search: this.searchTerm,
              category: this.selectedCategory,
              status: this.selectedStatus
            }
          });

          if (response.data.success) {
            this.products = response.data.products || [];
          } else {
            this.error = response.data.message || "โหลดข้อมูลผิดพลาด";
            Swal.fire('เกิดข้อผิดพลาด!', this.error, 'error');
          }
        } catch (err) {
          console.error(err);
          this.error = "โหลดข้อมูลผิดพลาด";
          Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
        } finally {
          this.loading = false;
        }
      },
      applyProductFilters() {
        this.loadProducts();
      },
      async editProduct(productId) {
        if (!this.checkAuth()) return;

        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${this.apiUrl}/products/${productId}`, {
            headers: {
              'x-auth-token': token
            }
          });

          if (response.data.success) {
            const productData = response.data.product;
            this.editingProduct = {
              id: productId,
              name: productData.name || '',
              price: productData.price || 0,
              category: productData.category || '',
              status: productData.status || 'active'
            };
            this.showEditModal = true;
          } else {
            Swal.fire('ไม่พบสินค้า!', 'ไม่พบสินค้าที่ต้องการแก้ไข', 'error');
          }
        } catch (error) {
          console.error("Error getting product:", error);
          Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
        }
      },
      async submitEditProduct() {
        if (!this.checkAuth()) return;

        this.updatingProduct = true;

        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(
            `${this.apiUrl}/products/${this.editingProduct.id}`,
            {
              name: this.editingProduct.name,
              price: parseFloat(this.editingProduct.price),
              category: this.editingProduct.category,
              status: this.editingProduct.status
            },
            {
              headers: {
                'x-auth-token': token
              }
            }
          );

          if (response.data.success) {
            Swal.fire('สำเร็จ!', 'ข้อมูลสินค้าได้ถูกอัปเดตแล้ว', 'success');
            this.loadProducts();
            this.closeEditModal();
          } else {
            Swal.fire('เกิดข้อผิดพลาด!', response.data.message || 'ไม่สามารถอัปเดตข้อมูลสินค้าได้', 'error');
          }
        } catch (error) {
          console.error("Error updating product:", error);
          Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถอัปเดตข้อมูลสินค้าได้', 'error');
        } finally {
          this.updatingProduct = false;
        }
      },
      closeEditModal() {
        this.showEditModal = false;
        this.editingProduct = {
          id: '',
          name: '',
          price: 0,
          category: '',
          status: 'active'
        };
      },
      confirmDeleteProduct(productId, productName) {
        Swal.fire({
          title: 'ยืนยันการลบ',
          text: `คุณต้องการลบสินค้า "${productName}" ใช่หรือไม่?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'ใช่, ลบ!',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6'
        }).then(async (result) => {
          if (result.isConfirmed) {
            await this.deleteProduct(productId, productName);
          }
        });
      },
      async deleteProduct(productId, productName) {
        if (!this.checkAuth()) return;

        try {
          const token = localStorage.getItem('token');
          const response = await axios.delete(`${this.apiUrl}/products/${productId}`, {
            headers: {
              'x-auth-token': token
            }
          });

          if (response.data.success) {
            Swal.fire('ลบแล้ว!', `สินค้า "${productName}" ถูกลบแล้ว`, 'success');
            this.loadProducts();
          } else {
            Swal.fire('เกิดข้อผิดพลาด!', response.data.message || 'ไม่สามารถลบสินค้าได้', 'error');
          }
        } catch (error) {
          console.error("Error deleting product:", error);
          Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถลบสินค้าได้', 'error');
        }
      },
      formatCurrency(amount) {
        return new Intl.NumberFormat('th-TH', {
          style: 'currency',
          currency: 'THB',
          minimumFractionDigits: 2
        }).format(amount || 0);
      },
      formatNumber(value) {
        return new Intl.NumberFormat('th-TH').format(value);
      },
      getStatusBadgeClass(status) {
        switch (status?.toLowerCase()) {
          case 'active':
            return 'badge badge-success';
          case 'inactive':
            return 'badge badge-secondary';
          default:
            return 'badge badge-info';
        }
      },

      getStatusText(status) {
        switch (status?.toLowerCase()) {
          case 'active':
            return 'ใช้งาน';
          case 'inactive':
            return 'ไม่ใช้งาน';
          default:
            return status || '-';
        }
      },

      getImageUrl(imageUrl) {
        if (!imageUrl) return '';

        // ถ้าเป็น URL เต็มรูปแบบ (ขึ้นต้นด้วย http หรือ https) ให้ใช้ตามนั้น
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }

        // ถ้าเป็นเส้นทางที่ขึ้นต้นด้วย / ให้เพิ่ม URL ของ API เซิร์ฟเวอร์
        if (imageUrl.startsWith('/')) {
          return `http://localhost:3000${imageUrl}`;
        }

        // กรณีอื่นๆ ให้เพิ่มเส้นทางเต็ม
        return `http://localhost:3000/${imageUrl}`;
      },
      toggleDropdown(dropdownName) {
        if (this.activeDropdown === dropdownName) {
          this.activeDropdown = null; // ปิด dropdown ถ้าคลิกที่เดิม
        } else {
          this.activeDropdown = dropdownName; // เปิด dropdown ที่คลิก
        }
      },
      handleClickOutside(event) {
        if (!event.target.closest('.dropdown')) {
          this.activeDropdown = null;
        }
      },
      // ฟังก์ชันสำหรับจัดรูปแบบตัวเลขเป็นเงิน
      formatBalance(balance) {
        return Number(balance).toLocaleString('th-TH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      },

      async fetchUserData(token) {
        try {
          // ใช้ axios แทน fetch เพื่อให้สอดคล้องกับส่วนอื่นๆ
          const response = await axios.get('http://localhost:3000/api/users/profile', {
            headers: {
              'x-auth-token': token
            }
          });

          if (response.data && response.data.success) {
            const userData = response.data.user;
            console.log('User data fetched in ProductList:', userData);

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
              sidebarUserBalanceElement.textContent = this.formatBalance(userData.balance || 0) + ' บาท';
            }
          }
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        }
      },
      handleLogout() {
        try {
          localStorage.removeItem('token');
          sessionStorage.removeItem('userRole');
          this.$router.push('/login');
        } catch (error) {
          console.error("Error signing out: ", error);
          alert('เกิดข้อผิดพลาดในการออกจากระบบ');
        }
      },

      toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
      },

      handleRefsReady(refs) {
        // อัพเดต refs เพื่อใช้ในการตรวจสอบการคลิกภายนอก
        this.ordersDropdown = refs.orders;
        this.productsDropdown = refs.products;
        this.reportsDropdown = refs.reports;
      }
    }
  }
  </script>

  <style scoped>
  /* Navigation bar styles */

  .container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  #product-filters {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }

  .filter-actions-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-top: 15px;
  }

  .input-item {
    display: flex;
    flex-direction: column;
  }

  .input-item label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
  }

  .input-item input,
  .input-item select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .button-group-end {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    justify-content: flex-end;
  }
/* สไตล์สำหรับหน้า Dashboard */
.dashboard-container {
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
  background-color: #f5f7fa;
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


  /* ใช้ CSS จากไฟล์ product_list.css และ fonts.css */
  @import url('../assets/css/fonts.css');
  @import url('../assets/css/product_list.css');

  /* กำหนดค่าเพิ่มเติมสำหรับหน้า product-list */
  #product-table {
    font-family: 'Kanit', sans-serif;
  }

  #product-table th {
    font-weight: 500;
    font-size: 0.9em;
    text-transform: none;
    letter-spacing: 0.3px;
  }

  #product-table td {
    font-size: 0.95em;
  }

  .card-header {
    font-weight: 500;
  }

  .status-badge {
    font-weight: 500;
    font-size: 0.85em;
  }
  </style>
