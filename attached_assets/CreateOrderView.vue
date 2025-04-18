<template>
  <div>
    <!-- ใช้ NavbarMenu component เหมือนกับหน้าอื่นๆ -->
    <NavbarMenu
      :activeDropdown="activeDropdown"
      @toggle-dropdown="toggleDropdown"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- Popup แจ้งเตือนสำเร็จ -->
    <div v-if="showSuccessPopup" class="popup-overlay">
      <div class="popup-container">
        <div class="popup-header bg-green-500">
          <span class="popup-icon">✓</span>
        </div>
        <div class="popup-content">
          <h3 class="popup-title">สร้างออเดอร์สำเร็จ</h3>
          <p class="popup-message">สร้างออเดอร์เรียบร้อยแล้ว!<br>เลขพัสดุของคุณคือ: {{ trackingNumber }}</p>
          <button @click="closePopup" class="popup-button">ตกลง</button>
        </div>
      </div>
    </div>

    <div class="container">
      <section>
        <h2><i class="fa-solid fa-plus-circle"></i> สร้างออเดอร์ใหม่</h2>

        <form id="orderForm" @submit.prevent="submitOrder">
          <div class="form-container">
            <div class="form-section">
              <h3 class="form-section-title"><i class="fa-solid fa-user"></i> ข้อมูลผู้รับ</h3>

              <div class="form-group required">
                <label for="customerName">ชื่อ-นามสกุล</label>
                <input type="text" id="customerName" class="form-control" v-model="orderData.customerName" required>
              </div>

              <div class="form-group required">
                <label for="customerPhone">เบอร์โทรศัพท์</label>
                <input type="tel" id="customerPhone" class="form-control" v-model="orderData.customerPhone" required>
              </div>

              <div class="form-row">
                <div class="form-group required">
                  <label for="province">จังหวัด</label>
                  <select id="province" class="form-control" v-model="orderData.province" required>
                    <option value="">เลือกจังหวัด</option>
                    <option v-for="province in provinces" :key="province" :value="province">{{ province }}</option>
                  </select>
                </div>
                <div class="form-group required">
                  <label for="district">เขต/อำเภอ</label>
                  <input type="text" id="district" class="form-control" v-model="orderData.district" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group required">
                  <label for="subdistrict">แขวง/ตำบล</label>
                  <input type="text" id="subdistrict" class="form-control" v-model="orderData.subdistrict" required>
                </div>
                <div class="form-group required">
                  <label for="postalCode">รหัสไปรษณีย์</label>
                  <input type="text" id="postalCode" class="form-control" v-model="orderData.postalCode" required>
                </div>
              </div>

              <div class="form-group">
                <label for="address">ที่อยู่ (บ้านเลขที่, หมู่บ้าน, ถนน)</label>
                <textarea id="address" class="form-control" rows="3" v-model="orderData.address"></textarea>
              </div>

              <div class="form-group">
                <label for="note">หมายเหตุ</label>
                <textarea id="note" class="form-control" rows="2" v-model="orderData.note"></textarea>
              </div>
            </div>

            <div class="form-section">
              <h3 class="form-section-title"><i class="fa-solid fa-truck"></i> ข้อมูลการจัดส่ง</h3>

              <div class="form-group required">
                <label for="courier">บริษัทขนส่ง</label>
                <select id="courier" class="form-control" v-model="orderData.courier" required>
                  <option value="Flash Express">Flash Express</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="shippingDate">วันที่จัดส่ง</label>
                  <input type="date" id="shippingDate" class="form-control" placeholder="เลือกวันที่">
                </div>
                <div class="form-group">
                  <label for="codAmount">ยอดเก็บเงิน (COD)</label>
                  <input type="number" id="codAmount" class="form-control" placeholder="บาท" v-model.number="orderData.codAmount">
                </div>
              </div>

              <div class="form-group">
                <label for="packageType">ประเภทพัสดุ</label>
                <select id="packageType" class="form-control" v-model="orderData.packageType">
                   <option v-for="type in packageTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="weight">น้ำหนัก (กก.)</label>
                  <input type="number" id="weight" class="form-control" step="0.1" v-model.number="orderData.weight">
                </div>
                <div class="form-group">
                  <label for="size">ขนาด (ซม.)</label>
                  <input type="text" id="size" class="form-control" placeholder="กว้าง x ยาว x สูง" v-model="orderData.size">
                </div>
              </div>

              <h3 class="form-section-title"><i class="fa-solid fa-box-open"></i> รายการสินค้า</h3>

              <div class="product-items">
                <div class="product-item-header">
                  <div>สินค้า</div>
                  <div>จำนวน</div>
                  <div>ราคา/หน่วย</div>
                  <div>รวม</div>
                  <div></div>
                </div>

                <div v-for="(item, index) in orderData.products" :key="item.id" class="product-item">
                  <div>
                    <select class="form-control" v-model="item.selectedProduct" @change="updateProductPrice(item)">
                      <option value="">เลือกสินค้า</option>
                      <option v-if="isLoadingProducts" value="" disabled>กำลังโหลดข้อมูล...</option>
                      <option v-else-if="productLoadError" value="" disabled>ไม่สามารถโหลดข้อมูลสินค้าได้</option>
                      <option v-else-if="availableProducts.length === 0" value="" disabled>ไม่พบสินค้า</option>
                      <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                        {{ product.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <input type="number" class="form-control" v-model.number="item.quantity" min="1">
                  </div>
                  <div>
                     <input type="number" class="form-control" v-model.number="item.unitPrice" min="0" :disabled="!!item.selectedProduct">
                  </div>
                  <div>{{ (item.quantity * item.unitPrice).toFixed(2) }}</div>
                  <div>
                    <button type="button" class="remove-product-btn" @click="removeProductItem(index)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                <button type="button" class="add-product-btn" @click="addProductItem">
                  <i class="fa-solid fa-plus"></i> เพิ่มสินค้า
                </button>

                <div style="text-align: right; margin-top: 15px; font-weight: bold;">
                    ยอดรวมสินค้าทั้งหมด: {{ overallTotal.toFixed(2) }} บาท
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary"> <i class="fa-solid fa-times"></i> ยกเลิก
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fa-solid fa-save"></i> สร้างออเดอร์
            </button>
          </div>
        </form>
      </section>
    </div>

    <footer>
      <p>&copy; {{ currentYear }} ระบบจัดการข้อมูลขนส่ง | พัฒนาโดยทีมงาน</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import NavbarMenu from '@/components/NavbarMenu.vue';
import { createFlashExpressOrder, trackFlashExpressShipment } from '@/services/flashExpressAPI';
import { createOrder } from '@/services/orderService';
import { productService } from '@/services/apiService';

// Import Firebase functions (assuming firebase is configured elsewhere)
// import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { db, auth } from './firebaseConfig'; // Example: import initialized db and auth

// --- Reactive State ---
const orderData = reactive({
  customerName: '',
  customerPhone: '',
  province: '',
  district: '',
  subdistrict: '',
  postalCode: '',
  address: '',
  note: '',
  courier: 'Flash Express', // ตั้งค่าเริ่มต้นเป็น Flash Express
  shippingDate: null, // Flatpickr will manage this via the input element
  codAmount: null,
  packageType: 2, // Default value: ของใช้
  weight: null,
  size: '',
  products: [
    // Initial product item
    { id: Date.now(), selectedProduct: '', quantity: 1, unitPrice: 0 }
  ]
});

// ข้อมูลสินค้าจากฐานข้อมูล
const availableProducts = ref([]);
const isLoadingProducts = ref(false);
const productLoadError = ref('');

const provinces = ref([
  'กรุงเทพมหานคร', 'เชียงใหม่', 'นนทบุรี', 'สมุทรปราการ', 'ปทุมธานี', 'ชลบุรี', 'ภูเก็ต' // Add more as needed
]);

// เฉพาะ Flash Express เท่านั้น จึงไม่จำเป็นต้องมีตัวแปร couriers แล้ว

// ประเภทสินค้าของ Flash Express
const packageTypes = ref([
  { id: 0, name: 'เอกสาร' },
  { id: 1, name: 'อาหารแห้ง' },
  { id: 2, name: 'ของใช้' },
  { id: 3, name: 'อุปกรณ์ไอที' },
  { id: 4, name: 'เสื้อผ้า' },
  { id: 5, name: 'สื่อบันเทิง' },
  { id: 6, name: 'อะไหล่รถยนต์' },
  { id: 7, name: 'รองเท้า/กระเป๋า' },
  { id: 8, name: 'อุปกรณ์กีฬา' },
  { id: 9, name: 'เครื่องสำอางค์' },
  { id: 10, name: 'เฟอร์นิเจอร์' },
  { id: 11, name: 'ผลไม้' },
  { id: 99, name: 'อื่นๆ' }
]);

const activeDropdown = ref(null); // Tracks the name of the currently open dropdown

// --- Popup State ---
const showSuccessPopup = ref(false);
const trackingNumber = ref('');

// --- Computed Properties ---
// Calculate total for each product item dynamically
// ไม่ได้ใช้ตัวแปรนี้โดยตรง แต่คำนวณในแต่ละรายการแทน
// const productTotals = computed(() => {
//   return orderData.products.map(item => item.quantity * item.unitPrice);
// });

// Calculate the overall total price of all products
const overallTotal = computed(() => {
  return orderData.products.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
});

// Get the current year for the footer
const currentYear = computed(() => new Date().getFullYear());

// --- Methods ---
// Toggle dropdown visibility
const toggleDropdown = (name) => {
  activeDropdown.value = activeDropdown.value === name ? null : name;
};

// Toggle sidebar (for mobile view)
const toggleSidebar = () => {
  // This function is needed for NavbarMenu component but not used in this view
  console.log('Toggle sidebar');
};

// Close all dropdowns (used for click outside)
const closeDropdowns = () => {
  activeDropdown.value = null;
};

// Add a new empty product item row
const addProductItem = () => {
  orderData.products.push({
    id: Date.now(), // Use a more robust unique ID in production
    selectedProduct: '',
    quantity: 1,
    unitPrice: 0
  });
};

// Remove a product item row by its index
const removeProductItem = (index) => {
  if (orderData.products.length > 1) {
    orderData.products.splice(index, 1);
  } else {
    alert('ต้องมีสินค้าอย่างน้อย 1 รายการ'); // Keep original alert behavior
  }
};

// Update unit price when a product is selected
const updateProductPrice = (item) => {
    const product = availableProducts.value.find(p => p.id === item.selectedProduct);
    item.unitPrice = product ? product.price : 0;
    // Reset quantity if needed, or keep it
    // item.quantity = 1;
};


// Handle the form submission
const submitOrder = async () => {
  // Basic validation example
  if (!orderData.customerName || !orderData.customerPhone || !orderData.province || !orderData.courier || orderData.products.some(p => !p.selectedProduct || p.quantity < 1)) {
    alert('กรุณากรอกข้อมูลผู้รับ ขนส่ง และรายการสินค้าให้ครบถ้วนและถูกต้อง');
    return;
  }

  // Log data for debugging (use deep copy)
  console.log('Submitting Order Data:', JSON.parse(JSON.stringify(orderData)));

  // Show loading state
  const isSubmitting = ref(true);
  const orderResult = ref(null);
  const errorMessage = ref('');

  try {
    // ใช้ Flash Express เท่านั้น
    // ตรวจสอบว่ามีการตั้งค่า courier เป็น Flash Express หรือไม่
    if (orderData.courier === 'Flash Express') {
      // Call Flash Express API
      const flashResponse = await createFlashExpressOrder(orderData);
      console.log('Flash Express API Response:', flashResponse);

      if (flashResponse.code === 0 || flashResponse.code === '0') { // Success code from Flash Express (code: 0)
        // Prepare order data for database
        const orderPayload = {
          userId: 1, // Replace with actual user ID from authentication
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          province: orderData.province,
          district: orderData.district,
          subdistrict: orderData.subdistrict,
          postalCode: orderData.postalCode,
          address: orderData.address,
          note: orderData.note,
          courier: orderData.courier,
          shippingDate: orderData.shippingDate,
          codAmount: orderData.codAmount || 0,
          packageType: orderData.packageType,
          weight: orderData.weight || 0,
          size: orderData.size,
          products: orderData.products.map(p => ({
            productId: p.selectedProduct,
            productName: availableProducts.value.find(prod => prod.id === p.selectedProduct)?.name || 'N/A',
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            totalPrice: p.quantity * p.unitPrice
          })),
          totalAmount: overallTotal.value,
          trackingNumber: flashResponse.data.pno
        };

        // Store the result
        orderResult.value = {
          success: true,
          trackingNumber: flashResponse.data.pno,
          message: 'สร้างออเดอร์และเลขพัสดุเรียบร้อยแล้ว!'
        };

        // Show success popup
        trackingNumber.value = flashResponse.data.pno;
        showSuccessPopup.value = true;

        // ตั้งเวลาปิด popup อัตโนมัติหลังจาก 3 วินาที
        setTimeout(() => {
          showSuccessPopup.value = false;
        }, 3000);

        // Get tracking information for the new shipment
        try {
          const trackingInfo = await trackFlashExpressShipment(flashResponse.data.pno);
          console.log('Tracking information:', trackingInfo);

          // Save order to database
          try {
            const savedOrder = await createOrder(orderPayload, flashResponse.data.pno);
            console.log('Order saved to database:', savedOrder);
          } catch (dbError) {
            console.error('Error saving order to database:', dbError);
            // Still continue since we have the tracking number
          }

          // You could display tracking information in the UI if needed
        } catch (trackingError) {
          console.error('Error getting tracking information:', trackingError);
        }

        // Optionally reset the form
        // resetOrderForm();
      } else {
        // Handle API error
        errorMessage.value = `เกิดข้อผิดพลาดจาก Flash Express: ${flashResponse.message || 'ไม่ทราบสาเหตุ'}`;
        alert(errorMessage.value);
      }
    }
  } catch (error) {
    console.error('Error creating order:', error);
    errorMessage.value = `เกิดข้อผิดพลาดในการสร้างออเดอร์: ${error.message || 'ไม่ทราบสาเหตุ'}`;
    alert(errorMessage.value);
  } finally {
    isSubmitting.value = false;
  }
};

// ฟังก์ชันสำหรับปิด popup
const closePopup = () => {
  showSuccessPopup.value = false;
};

// --- Lifecycle Hooks ---

// ฟังก์ชันสำหรับโหลดข้อมูลสินค้าจากฐานข้อมูล
const loadProducts = async () => {
  try {
    isLoadingProducts.value = true;
    productLoadError.value = '';

    const response = await productService.getAllProducts();

    if (response && response.data && response.data.success) {
      // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
      availableProducts.value = response.data.products.map(product => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price)
      }));
    } else {
      productLoadError.value = 'ไม่สามารถโหลดข้อมูลสินค้าได้';
      console.error('Error loading products:', response);
    }
  } catch (error) {
    productLoadError.value = 'ไม่สามารถโหลดข้อมูลสินค้าได้';
    console.error('Error loading products:', error);
  } finally {
    isLoadingProducts.value = false;
  }
};

onMounted(() => {
  // โหลดข้อมูลสินค้าเมื่อ component ถูกโหลด
  loadProducts();

  // เนื่องจากไม่ได้ติดตั้ง flatpickr จึงใช้ native date input แทน
  // เพิ่ม event listener สำหรับการเปลี่ยนแปลงวันที่
  const dateInput = document.getElementById('shippingDate');
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      orderData.shippingDate = e.target.value;
    });
  }

  // Add global click listener to close dropdowns when clicking outside
  window.addEventListener('click', closeDropdowns);
});

onUnmounted(() => {
  // Clean up event listeners
  const dateInput = document.getElementById('shippingDate');
  if (dateInput) {
    dateInput.removeEventListener('change', () => {});
  }
  // Clean up global click listener
  window.removeEventListener('click', closeDropdowns);
});

</script>

<style scoped>
/* Scoped styles for this component */
/* Import global styles (Fonts, Font Awesome) in main.js or index.html */

.container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 25px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Form Styles */
h2 {
    color: #4CAF50; /* Green to match other pages */
    margin-bottom: 25px;
    border-bottom: 2px solid #dee2e6;
    padding-bottom: 12px;
    font-weight: 600;
}
h2 i { margin-right: 12px; }

.form-container {
    display: grid;
    /* grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); */
    grid-template-columns: 1fr 1fr; /* Fixed two columns */
    gap: 35px;
}

.form-section {
    background-color: #fdfdfd;
    padding: 25px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.form-section-title {
    font-size: 1.25em;
    color: #343a40;
    margin: -25px -25px 20px -25px; /* Extend to edges */
    padding: 15px 25px;
    border-bottom: 1px solid #e9ecef;
    background-color: #f8f9fa; /* Slight background for title */
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    font-weight: 500;
}
.form-section-title i { margin-right: 10px; color: #4CAF50; /* Green to match other pages */}

.form-group {
    margin-bottom: 18px;
}

.form-group.required label::after {
    content: ' *';
    color: #dc3545; /* Bootstrap danger color */
    margin-left: 3px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #495057; /* Darker gray for labels */
    font-size: 0.9em;
}

.form-control {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1em;
    box-sizing: border-box;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    background-color: #fff; /* Ensure background is white */
    color: #495057;
}
.form-control:focus {
    border-color: #86b7fe; /* Lighter blue focus */
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); /* Standard Bootstrap focus */
}
.form-control::placeholder {
    color: #adb5bd; /* Placeholder color */
    opacity: 1;
}
textarea.form-control {
    min-height: 80px; /* Minimum height for textareas */
    resize: vertical;
}
select.form-control {
    appearance: none; /* Custom arrow styling might be needed */
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px 12px;
    padding-right: 2.5rem; /* Space for arrow */
}
input[type="date"].form-control {
    position: relative;
}

.form-row {
    display: flex;
    gap: 20px; /* Increased gap */
}
.form-row .form-group {
    flex: 1;
}

/* Product Items Styles */
.product-items {
    margin-top: 25px;
}
.product-item-header, .product-item {
    display: grid;
    grid-template-columns: 3fr 1fr 1.5fr 1.5fr 0.5fr;
    gap: 15px;
    align-items: center;
    padding: 10px 5px; /* Add some horizontal padding */
    border-bottom: 1px solid #e9ecef;
}
.product-item:last-child {
    border-bottom: none; /* Remove border from last item before add button */
}
.product-item-header {
    font-weight: 600;
    color: #6c757d;
    padding-bottom: 12px;
    margin-bottom: 5px; /* Space below header */
    font-size: 0.85em;
    text-transform: uppercase;
}
.product-item > div:last-child {
    text-align: center;
}
.product-item .form-control {
    padding: 8px 10px; /* Slightly smaller padding for item inputs */
    font-size: 0.95em;
}

.remove-product-btn, .add-product-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    color: #dc3545;
    font-size: 1.2em; /* Slightly larger icon */
    transition: color 0.2s ease;
}
.remove-product-btn:hover {
    color: #a71d2a; /* Darker red on hover */
}

.add-product-btn {
    color: #4CAF50; /* Green to match other pages */
    background-color: #e8f5e9;
    border: 1px dashed #4CAF50;
    padding: 10px 18px;
    border-radius: 5px;
    margin-top: 20px;
    display: inline-flex;
    align-items: center;
    font-size: 0.95em;
    font-weight: 500;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}
.add-product-btn:hover {
    background-color: #c8e6c9;
    border-color: #3d8b40;
}
.add-product-btn i { margin-right: 8px; }

/* Form Actions */
.form-actions {
    margin-top: 35px;
    text-align: right;
    border-top: 1px solid #dee2e6;
    padding-top: 25px;
}
.btn {
    padding: 12px 25px; /* Larger buttons */
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    font-weight: 500;
    margin-left: 12px;
    transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
    display: inline-flex;
    align-items: center;
    vertical-align: middle; /* Align buttons if heights differ slightly */
}
.btn:active {
    transform: translateY(1px); /* Slight press effect */
}
.btn i { margin-right: 8px; font-size: 1.1em; }

.btn-primary {
    background-color: #4CAF50; /* Green to match other pages */
    color: white;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}
.btn-primary:hover {
    background-color: #3d8b40; /* Darker green on hover */
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}
.btn-secondary {
    background-color: #6c757d;
    color: white;
     box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}
.btn-secondary:hover {
    background-color: #5c636a;
     box-shadow: 0 4px 8px rgba(108, 117, 125, 0.4);
}

/* Footer Styles */
footer {
    text-align: center;
    margin-top: 40px;
    padding: 20px;
    background-color: #e9ecef;
    color: #6c757d;
    font-size: 0.9em;
    border-top: 1px solid #dee2e6;
}

/* Popup Styles */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.3s ease-out;
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
  background-color: #4CAF50; /* Green to match other elements */
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
  line-height: 1.5;
}

.popup-button {
  background-color: #4CAF50;
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
  background-color: #3d8b40;
}

@keyframes popup-appear {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive adjustments */
@media (max-width: 992px) { /* Adjust breakpoint if needed */
    .form-container {
        grid-template-columns: 1fr; /* Stack columns */
    }
}

@media (max-width: 768px) {
    .top-navbar { flex-direction: column; align-items: flex-start; padding: 15px; }
    .navbar-menu { flex-direction: column; width: 100%; margin-top: 10px; }
    .navbar-menu li { margin-left: 0; width: 100%; margin-bottom: 5px; }
    .navbar-menu li a { justify-content: flex-start; padding: 12px 15px; }
    .dropdown-menu { position: static; border: none; box-shadow: none; background-color: #495057; width: 100%; opacity: 1; visibility: visible; transform: none; transition: none; margin-top: 5px; border-radius: 0;}
    .dropdown-menu li a { color: #fff; padding: 10px 25px; }
    .dropdown-menu li a:hover { background-color: #5a6268; }
    .dropdown-menu.show { display: block; } /* Ensure it shows */

    .container { padding: 15px; }
    .form-section { padding: 20px; }
     .form-section-title {
        margin: -20px -20px 15px -20px;
        padding: 12px 20px;
    }
    .form-row {
        flex-direction: column;
        gap: 0;
    }
     .form-row .form-group { margin-bottom: 18px; } /* Restore margin when stacked */

    .product-item-header {
        display: none;
    }
    .product-item {
        grid-template-columns: 1fr 1fr; /* Two columns for items */
        gap: 10px 15px; /* Row and column gap */
        padding: 15px 10px;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        margin-bottom: 10px;
        border-bottom: 1px solid #e9ecef; /* Ensure border exists */
    }
     /* Assign grid areas or use explicit column spans */
    .product-item div:nth-child(1) { grid-column: 1 / -1; } /* Product select full width */
    .product-item div:nth-child(2) { grid-column: 1 / 2; } /* Quantity */
    .product-item div:nth-child(3) { grid-column: 2 / 3; } /* Unit Price */
    .product-item div:nth-child(4) { grid-column: 1 / 2; font-weight: bold; } /* Total */
    .product-item div:nth-child(5) { grid-column: 2 / 3; text-align: right; } /* Remove button */

     /* Add labels for clarity */
    .product-item div:nth-child(2)::before { content: "จำนวน: "; font-weight: 500; font-size: 0.85em; color: #6c757d; display: block; margin-bottom: 3px;}
    .product-item div:nth-child(3)::before { content: "ราคา/หน่วย: "; font-weight: 500; font-size: 0.85em; color: #6c757d; display: block; margin-bottom: 3px;}
    .product-item div:nth-child(4)::before { content: "รวม: "; font-weight: 500; font-size: 0.85em; color: #6c757d; display: block; margin-bottom: 3px;}

    .form-actions { text-align: center; }
    .form-actions .btn { width: 48%; margin: 5px 1%;} /* Make buttons take half width */
}

</style>

