<template>
  <div class="page-container">
    <!-- แถบเมนูด้านบน -->
    <NavbarMenu
      :activeDropdown="activeDropdown"
      @toggle-dropdown="toggleDropdown"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- เมนูด้านข้าง -->
    <SidebarMenu :isOpen="sidebarOpen" @toggle="toggleSidebar" />

    <!-- Popup แจ้งเตือนแบบสวยงาม -->
    <div v-if="showPopup" class="popup-overlay">
      <div class="popup-container">
        <div class="popup-header" :class="popupType === 'success' ? 'bg-green-500' : 'bg-red-500'">
          <span v-if="popupType === 'success'" class="popup-icon">✓</span>
          <span v-else class="popup-icon">✗</span>
        </div>
        <div class="popup-content">
          <h3 class="popup-title">{{ popupTitle }}</h3>
          <p class="popup-message">{{ popupMessage }}</p>
          <button @click="closePopup" class="popup-button">ตกลง</button>
        </div>
      </div>
    </div>

    <!-- Popup ยืนยันการลบ -->
    <div v-if="showDeleteConfirm" class="popup-overlay">
      <div class="popup-container">
        <div class="popup-header bg-red-500">
          <span class="popup-icon">⚠</span>
        </div>
        <div class="popup-content">
          <h3 class="popup-title">ยืนยันการลบ</h3>
          <p class="popup-message">คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          <div class="flex justify-center space-x-4 mt-4">
            <button @click="cancelDelete" class="popup-button-secondary">ยกเลิก</button>
            <button @click="confirmDelete" class="popup-button-danger">ยืนยันการลบ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal สำหรับแก้ไขหมวดหมู่ -->
    <div v-if="editingCategory" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">แก้ไขหมวดหมู่</h3>
          <button @click="cancelEdit" class="modal-close">&times;</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="updateCategory">
            <div class="form-group mb-4">
              <label for="editCategoryName" class="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่ <span class="text-red-500">*</span></label>
              <input
                type="text"
                id="editCategoryName"
                v-model="editingCategory.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{ 'border-red-500': editValidationErrors.name }"
                required
              />
              <p v-if="editValidationErrors.name" class="mt-1 text-sm text-red-600">{{ editValidationErrors.name }}</p>
            </div>

            <div class="form-group mb-4">
              <label for="editCategoryDescription" class="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
              <textarea
                id="editCategoryDescription"
                v-model="editingCategory.description"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="editCategoryStatus"
                  v-model="editingCategory.isActive"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="editCategoryStatus" class="ml-2 block text-sm text-gray-900">เปิดใช้งาน</label>
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                @click="cancelEdit"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting">กำลังบันทึก...</span>
                <span v-else>บันทึก</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- เนื้อหาหลัก -->
    <main class="dashboard-content">
      <div class="container p-4 mx-auto md:p-6 lg:p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 md:text-3xl">
          เพิ่ม/จัดการหมวดหมู่สินค้า
        </h1>
        <p class="mt-2 text-gray-600">
          จัดการหมวดหมู่สินค้า เพื่อให้การค้นหาและจัดกลุ่มสินค้าในระบบมีประสิทธิภาพมากขึ้น
        </p>
      </div>

      <div class="p-6 mb-8 bg-white rounded-lg shadow-md">
        <h2 class="mb-4 text-xl font-semibold text-gray-700">เพิ่มหมวดหมู่ใหม่</h2>
        <form @submit.prevent="addCategory" class="space-y-4">
          <div>
            <label for="categoryName" class="block text-sm font-medium text-gray-700">
              ชื่อหมวดหมู่ <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="categoryName"
              v-model.trim="newCategory.name"
              required
              class="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              :class="{ 'border-red-500': validationErrors.name }"
              placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์, อาหาร, แฟชั่น"
            />
            <p v-if="validationErrors.name" class="mt-1 text-xs text-red-600">
              {{ validationErrors.name }}
            </p>
          </div>

          <div>
            <label for="categoryDescription" class="block text-sm font-medium text-gray-700">
              รายละเอียดหมวดหมู่ (ไม่บังคับ)
            </label>
            <textarea
              id="categoryDescription"
              v-model="newCategory.description"
              rows="3"
              class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับหมวดหมู่นี้..."
            ></textarea>
          </div>

          <div>
            <label for="categoryStatus" class="block text-sm font-medium text-gray-700">
              สถานะการใช้งาน
            </label>
            <select
              id="categoryStatus"
              v-model="newCategory.isActive"
              class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option :value="true">เปิดใช้งาน</option>
              <option :value="false">ปิดใช้งาน</option>
            </select>
            </div>

          <div class="flex items-center justify-end pt-2">
             <p v-if="showSuccessMessage" class="mr-4 text-sm text-green-600">
               เพิ่มหมวดหมู่เรียบร้อยแล้ว!
             </p>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มหมวดหมู่' }}
            </button>
          </div>
        </form>
      </div>

      <div class="p-6 bg-white rounded-lg shadow-md">
        <h2 class="mb-4 text-xl font-semibold text-gray-700">รายการหมวดหมู่ทั้งหมด</h2>

        <div class="mb-4">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="ค้นหาตามชื่อหมวดหมู่..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 md:w-1/3"
          />
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ชื่อหมวดหมู่</th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">รายละเอียด</th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">สถานะ</th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="filteredCategories.length === 0">
                <td colspan="4" class="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                  ไม่พบหมวดหมู่ที่ตรงกับการค้นหา
                </td>
              </tr>
              <tr v-for="category in filteredCategories" :key="category.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{{ category.name }}</td>
                <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{{ category.description || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                        class="inline-flex px-2 text-xs font-semibold leading-5 rounded-full">
                    {{ category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <button @click="startEditCategory(category)" class="action-button edit-button">
                    <i class="fa-solid fa-pen-to-square"></i>
                    <span>แก้ไข</span>
                  </button>
                  <button @click="confirmDeleteCategory(category.id)" class="action-button delete-button">
                    <i class="fa-solid fa-trash-can"></i>
                    <span>ลบ</span>
                  </button>
                </td>
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
import { ref, reactive, computed, onMounted } from 'vue';
import NavbarMenu from './NavbarMenu.vue';
import SidebarMenu from './SidebarMenu.vue';

// ตัวแปรสำหรับการจัดการเมนูและ sidebar
const activeDropdown = ref('products'); // ตั้งค่าเริ่มต้นให้เมนูสินค้าถูกเปิดไว้
const sidebarOpen = ref(false);

// ตัวแปรสำหรับ popup แจ้งเตือนแบบสวยงาม
const showPopup = ref(false);
const popupType = ref('success'); // 'success' หรือ 'error'
const popupTitle = ref('');
const popupMessage = ref('');

// ฟังก์ชันสำหรับแสดง popup
const showSuccessPopup = (title, message) => {
  popupType.value = 'success';
  popupTitle.value = title;
  popupMessage.value = message;
  showPopup.value = true;
};

const showErrorPopup = (title, message) => {
  popupType.value = 'error';
  popupTitle.value = title;
  popupMessage.value = message;
  showPopup.value = true;
};

const closePopup = () => {
  showPopup.value = false;
};

// ฟังก์ชันสำหรับจัดการเมนูและ sidebar
const toggleDropdown = (dropdownName) => {
  if (activeDropdown.value === dropdownName) {
    activeDropdown.value = null;
  } else {
    activeDropdown.value = dropdownName;
  }
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

  // --- State ---
  const newCategory = reactive({
    name: '',
    description: '',
    isActive: true, // ค่าเริ่มต้นเป็น "เปิดใช้งาน"
  });

  const existingCategories = ref([]); // เก็บรายการหมวดหมู่ทั้งหมด (ควรดึงมาจาก API)
  const searchTerm = ref('');
  const isSubmitting = ref(false);
  const showSuccessMessage = ref(false);
  const validationErrors = reactive({ name: null }); // สำหรับเก็บข้อผิดพลาด validation

  // ตัวแปรสำหรับการแก้ไขหมวดหมู่
  const editingCategory = ref(null); // เก็บข้อมูลหมวดหมู่ที่กำลังแก้ไข
  const editValidationErrors = reactive({ name: null }); // สำหรับเก็บข้อผิดพลาด validation ในการแก้ไข

  // ดึงข้อมูลจาก API จริง
  const fetchCategories = async () => {
    console.log('Fetching categories from API...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ไม่พบ token ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
        return;
      }

      const response = await fetch('http://localhost:3000/api/categories', {
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (data.success) {
        // แปลงข้อมูลจาก API ให้ตรงกับรูปแบบที่ใช้ในหน้าเว็บ
        existingCategories.value = data.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          isActive: cat.is_active === 1 || cat.is_active === true
        }));
        console.log('Categories loaded from API:', existingCategories.value);
      } else {
        console.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้:', data.message);
        // ใช้ข้อมูลตัวอย่างแทน
        existingCategories.value = [
          { id: 1, name: 'เสื้อผ้าบุรุษ', description: 'เสื้อผ้าสำหรับผู้ชาย', isActive: true },
          { id: 2, name: 'เครื่องใช้ไฟฟ้า', description: 'เครื่องใช้ไฟฟ้าภายในบ้าน', isActive: true },
          { id: 3, name: 'อาหารสด', description: '', isActive: false },
          { id: 4, name: 'อุปกรณ์กีฬา', description: 'อุปกรณ์สำหรับออกกำลังกาย', isActive: true },
        ];
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', error);
      // ใช้ข้อมูลตัวอย่างแทน
      existingCategories.value = [
        { id: 1, name: 'เสื้อผ้าบุรุษ', description: 'เสื้อผ้าสำหรับผู้ชาย', isActive: true },
        { id: 2, name: 'เครื่องใช้ไฟฟ้า', description: 'เครื่องใช้ไฟฟ้าภายในบ้าน', isActive: true },
        { id: 3, name: 'อาหารสด', description: '', isActive: false },
        { id: 4, name: 'อุปกรณ์กีฬา', description: 'อุปกรณ์สำหรับออกกำลังกาย', isActive: true },
      ];
    }
  };

  // เรียก fetch ข้อมูลเมื่อ component ถูก mount
  onMounted(fetchCategories);

  // --- Computed Properties ---
  const filteredCategories = computed(() => {
    if (!searchTerm.value) {
      return existingCategories.value;
    }
    const lowerSearchTerm = searchTerm.value.toLowerCase();
    return existingCategories.value.filter(category =>
      category.name.toLowerCase().includes(lowerSearchTerm)
    );
  });

  // --- Methods ---
  const resetForm = () => {
    newCategory.name = '';
    newCategory.description = '';
    newCategory.isActive = true;
    validationErrors.name = null;
  };

  const validateForm = () => {
    validationErrors.name = null; // Reset error ก่อน
    let isValid = true;

    // 1. ตรวจสอบว่ากรอกชื่อหรือไม่
    if (!newCategory.name) {
      validationErrors.name = 'กรุณากรอกชื่อหมวดหมู่';
      isValid = false;
    }
    // 2. ตรวจสอบว่าชื่อซ้ำหรือไม่ (เปรียบเทียบแบบ case-insensitive)
    else if (existingCategories.value.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
      validationErrors.name = 'ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง';
      isValid = false;
    }

    return isValid;
  };

  const addCategory = async () => {
    if (!validateForm()) {
      return; // หยุดถ้า validation ไม่ผ่าน
    }

    isSubmitting.value = true;
    showSuccessMessage.value = false; // ซ่อนข้อความสำเร็จก่อน (ถ้ามี)

    console.log('Submitting new category to API:', { ...newCategory });

    // ส่งข้อมูลไป API จริง
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('ไม่พบ token ไม่สามารถเพิ่มหมวดหมู่ได้');
      }

      // เตรียมข้อมูลที่จะส่งไป API
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description || '',
        is_active: newCategory.isActive
      };

      // ส่งข้อมูลไป API
      const response = await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();

      if (data.success) {
        // เพิ่มข้อมูลใหม่ลงใน list
        const addedCategory = {
          id: data.category.id,
          name: data.category.name,
          description: data.category.description || '',
          isActive: data.category.is_active === 1 || data.category.is_active === true
        };

        existingCategories.value.push(addedCategory);

        // Reset ฟอร์ม
        resetForm();

        // แสดง popup แจ้งเตือนแบบสวยงามเมื่อเพิ่มหมวดหมู่สำเร็จ
        showSuccessPopup(
          'เพิ่มหมวดหมู่สำเร็จ',
          `เพิ่มหมวดหมู่ "${addedCategory.name}" เรียบร้อยแล้ว`
        );

        // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 3 วินาที
        setTimeout(() => { showPopup.value = false; }, 3000);
      } else {
        throw new Error(data.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      // แจ้งเตือนผู้ใช้ว่าเกิดข้อผิดพลาดด้วย popup แบบสวยงาม
      showErrorPopup(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถเพิ่มหมวดหมู่ได้: ' + error.message
      );

      // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 5 วินาที
      setTimeout(() => { showPopup.value = false; }, 5000);
    } finally {
      isSubmitting.value = false;
    }
  };

  const startEditCategory = (category) => {
    console.log('Start editing:', category);
    // เปิด Modal สำหรับแก้ไขหมวดหมู่
    editingCategory.value = { ...category }; // คัดลอกข้อมูลหมวดหมู่ที่จะแก้ไข
    editValidationErrors.name = null; // รีเซ็ตข้อผิดพลาด
  };

  const cancelEdit = () => {
    // ปิด Modal แก้ไขหมวดหมู่
    editingCategory.value = null;
    editValidationErrors.name = null;
  };

  // ตัวแปรสำหรับการยืนยันการลบ
  const showDeleteConfirm = ref(false);
  const categoryToDelete = ref(null);

  // ฟังก์ชันสำหรับแสดง popup ยืนยันการลบ
  const confirmDeleteCategory = (categoryId) => {
    // เก็บ ID ของหมวดหมู่ที่ต้องการลบ
    categoryToDelete.value = categoryId;
    // แสดง popup ยืนยันการลบ
    showDeleteConfirm.value = true;
  };

  // ฟังก์ชันสำหรับยกเลิกการลบ
  const cancelDelete = () => {
    showDeleteConfirm.value = false;
    categoryToDelete.value = null;
  };

  // ฟังก์ชันสำหรับยืนยันการลบ
  const confirmDelete = async () => {
    if (!categoryToDelete.value) return;

    const categoryId = categoryToDelete.value;
    showDeleteConfirm.value = false; // ปิด popup ยืนยัน
    console.log('Deleting category ID:', categoryId);

    try {
      // เก็บข้อมูลหมวดหมู่ที่จะลบก่อนที่จะลบจาก UI
      const deletedCategory = existingCategories.value.find(cat => cat.id === categoryId);
      if (!deletedCategory) {
        throw new Error('ไม่พบหมวดหมู่ที่ต้องการลบ');
      }

      // ดึง token สำหรับการเรียก API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('ไม่พบ token ไม่สามารถลบหมวดหมู่ได้');
      }

      // เรียก API เพื่อลบหมวดหมู่
      console.log(`Deleting category with API: http://localhost:3000/api/categories/${categoryId}`);

      const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();
      console.log('Delete API response:', data);

      if (data.success) {
        // ลบออกจาก list ในหน้าเว็บ
        existingCategories.value = existingCategories.value.filter(cat => cat.id !== categoryId);

        // แสดง popup แจ้งเตือนแบบสวยงามเมื่อลบหมวดหมู่สำเร็จ
        showSuccessPopup(
          'ลบหมวดหมู่สำเร็จ',
          `ลบหมวดหมู่ "${deletedCategory.name}" เรียบร้อยแล้ว`
        );

        // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 3 วินาที
        setTimeout(() => { showPopup.value = false; }, 3000);
      } else {
        throw new Error(data.message || 'ไม่สามารถลบหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error deleting category:', error);

      // แสดง popup แจ้งเตือนแบบสวยงามเมื่อเกิดข้อผิดพลาด
      showErrorPopup(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถลบหมวดหมู่ได้: ' + (error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')
      );

      // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 5 วินาที
      setTimeout(() => { showPopup.value = false; }, 5000);
    }
  };

  // ฟังก์ชันสำหรับตรวจสอบข้อมูลการแก้ไข
  const validateEditForm = () => {
    editValidationErrors.name = null; // Reset error ก่อน
    let isValid = true;

    // 1. ตรวจสอบว่ากรอกชื่อหรือไม่
    if (!editingCategory.value.name) {
      editValidationErrors.name = 'กรุณากรอกชื่อหมวดหมู่';
      isValid = false;
    }
    // 2. ตรวจสอบว่าชื่อซ้ำหรือไม่ (เปรียบเทียบแบบ case-insensitive)
    else {
      const duplicateName = existingCategories.value.find(cat =>
        cat.id !== editingCategory.value.id &&
        cat.name.toLowerCase() === editingCategory.value.name.toLowerCase()
      );

      if (duplicateName) {
        editValidationErrors.name = 'ชื่อหมวดหมู่นี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง';
        isValid = false;
      }
    }

    return isValid;
  };

  // ฟังก์ชันสำหรับอัปเดตหมวดหมู่
  const updateCategory = async () => {
    if (!validateEditForm()) {
      return; // หยุดถ้า validation ไม่ผ่าน
    }

    isSubmitting.value = true;

    try {
      // ดึง token สำหรับการเรียก API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('ไม่พบ token ไม่สามารถแก้ไขหมวดหมู่ได้');
      }

      // เตรียมข้อมูลที่จะส่งไป API
      const categoryData = {
        name: editingCategory.value.name,
        description: editingCategory.value.description || '',
        is_active: editingCategory.value.isActive
      };

      console.log('Updating category ID:', editingCategory.value.id);
      console.log('Updating with data:', categoryData);

      // เรียก API เพื่ออัปเดตหมวดหมู่
      const response = await fetch(`http://localhost:3000/api/categories/${editingCategory.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        // อัปเดตข้อมูลใน existingCategories
        const index = existingCategories.value.findIndex(cat => cat.id === editingCategory.value.id);
        if (index !== -1) {
          existingCategories.value[index] = { ...editingCategory.value };
        }

        // ปิด Modal
        editingCategory.value = null;

        // แสดง popup แจ้งเตือนแบบสวยงาม
        showSuccessPopup(
          'แก้ไขหมวดหมู่สำเร็จ',
          'แก้ไขหมวดหมู่เรียบร้อยแล้ว'
        );

        // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 3 วินาที
        setTimeout(() => { showPopup.value = false; }, 3000);
      } else {
        throw new Error(data.message || 'ไม่สามารถแก้ไขหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error updating category:', error);

      // แสดง popup แจ้งเตือนแบบสวยงามเมื่อเกิดข้อผิดพลาด
      showErrorPopup(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถแก้ไขหมวดหมู่ได้: ' + (error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')
      );

      // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 5 วินาที
      setTimeout(() => { showPopup.value = false; }, 5000);
    } finally {
      isSubmitting.value = false;
    }
  };

  </script>

<style scoped>
@import '../assets/css/sidebar.css';
@import '../assets/css/tailwind.css';

/* สไตล์สำหรับหน้า Dashboard */
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Kanit', sans-serif;
  position: relative;
}

/* สไตล์สำหรับเนื้อหาหลัก */
.dashboard-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  transition: padding-right 0.3s ease;
}

/* สามารถเพิ่ม CSS เฉพาะสำหรับ component นี้ได้ */
/* ตัวอย่าง: กำหนดสไตล์เพิ่มเติมให้ Badge สถานะ */
.rounded-full {
  line-height: 1.25; /* ปรับปรุงการแสดงผลของ Badge */
}

/* สไตล์สำหรับปุ่มในตาราง */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  margin: 0 4px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.action-button i {
  margin-right: 6px;
  font-size: 0.9rem;
}

.edit-button {
  background-color: #4f46e5;
  color: white;
}

.edit-button:hover {
  background-color: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.delete-button {
  background-color: #ef4444;
  color: white;
}

.delete-button:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Popup แจ้งเตือนแบบสวยงาม */
.popup-overlay, .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.popup-container {
  width: 90%;
  max-width: 400px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  animation: popup-appear 0.3s ease-out;
}

.popup-header {
  padding: 16px;
  text-align: center;
}

.popup-icon {
  font-size: 32px;
  color: white;
  display: inline-block;
}

.popup-content {
  padding: 20px;
  text-align: center;
}

.popup-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.popup-message {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.popup-button {
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.popup-button:hover {
  background-color: #4338ca;
}

.popup-button-secondary {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.popup-button-secondary:hover {
  background-color: #4b5563;
}

.popup-button-danger {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.popup-button-danger:hover {
  background-color: #dc2626;
}

@keyframes popup-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Modal สำหรับแก้ไขหมวดหมู่ */
.modal-container {
  width: 90%;
  max-width: 500px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  animation: popup-appear 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #111827;
}

.modal-content {
  padding: 20px;
}
</style>