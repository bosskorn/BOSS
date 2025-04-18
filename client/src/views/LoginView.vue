<template>
  <div class="login-container">
    <div class="login-form-container">
      <div class="login-logo">
        <i class="fas fa-truck text-primary text-3xl"></i>
        <h1 class="text-2xl font-semibold text-gray-800">ระบบจัดการข้อมูลขนส่ง</h1>
      </div>
      
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">ชื่อผู้ใช้</label>
          <div class="input-wrapper">
            <i class="fas fa-user"></i>
            <input 
              id="username" 
              v-model="username" 
              type="text" 
              placeholder="ชื่อผู้ใช้ของคุณ" 
              required
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">รหัสผ่าน</label>
          <div class="input-wrapper">
            <i class="fas fa-lock"></i>
            <input 
              id="password" 
              v-model="password" 
              type="password" 
              placeholder="รหัสผ่านของคุณ" 
              required
            >
          </div>
        </div>
        
        <div class="remember-me">
          <input id="remember" type="checkbox" v-model="remember">
          <label for="remember">จดจำฉัน</label>
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-circle-notch fa-spin"></i> กำลังเข้าสู่ระบบ...
          </span>
          <span v-else>เข้าสู่ระบบ</span>
        </button>
      </form>
      
      <div class="register-section">
        <h2 class="text-xl font-medium text-gray-700 mb-4">ยังไม่มีบัญชี?</h2>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="reg-username">ชื่อผู้ใช้</label>
            <div class="input-wrapper">
              <i class="fas fa-user"></i>
              <input 
                id="reg-username" 
                v-model="regUsername" 
                type="text" 
                placeholder="กรอกชื่อผู้ใช้" 
                required
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="fullname">ชื่อ-นามสกุล</label>
            <div class="input-wrapper">
              <i class="fas fa-id-card"></i>
              <input 
                id="fullname" 
                v-model="fullname" 
                type="text" 
                placeholder="กรอกชื่อ-นามสกุล" 
                required
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="reg-password">รหัสผ่าน</label>
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input 
                id="reg-password" 
                v-model="regPassword" 
                type="password" 
                placeholder="กรอกรหัสผ่าน" 
                required
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirm-password">ยืนยันรหัสผ่าน</label>
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input 
                id="confirm-password" 
                v-model="confirmPassword" 
                type="password" 
                placeholder="ยืนยันรหัสผ่าน" 
                required
              >
            </div>
          </div>
          
          <button 
            type="submit" 
            class="register-button" 
            :disabled="isRegistering || !canRegister"
          >
            <span v-if="isRegistering">
              <i class="fas fa-circle-notch fa-spin"></i> กำลังสมัครสมาชิก...
            </span>
            <span v-else>สมัครสมาชิก</span>
          </button>
        </form>
      </div>
    </div>
    
    <div class="login-image-container">
      <div class="login-content">
        <h2 class="text-3xl font-bold mb-4">ระบบจัดการขนส่งที่ครบวงจร</h2>
        <p class="text-xl mb-6">ติดตามการขนส่ง, จัดการคำสั่งซื้อ และวิเคราะห์ข้อมูลทางธุรกิจได้ง่ายๆ</p>
        <div class="feature-list">
          <div class="feature-item">
            <i class="fas fa-chart-line"></i>
            <span>รายงานและกราฟสรุปยอดขาย</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-truck"></i>
            <span>ติดตามสถานะการจัดส่งแบบเรียลไทม์</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-file-import"></i>
            <span>นำเข้าข้อมูลได้หลากหลายรูปแบบ</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-users"></i>
            <span>จัดการข้อมูลลูกค้าอย่างเป็นระบบ</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '../services/auth'

const router = useRouter()

// Login form state
const username = ref('')
const password = ref('')
const remember = ref(false)
const isLoading = ref(false)

// Register form state
const regUsername = ref('')
const fullname = ref('')
const regPassword = ref('')
const confirmPassword = ref('')
const isRegistering = ref(false)

// Error handling
const error = ref('')

// Computed properties
const canRegister = computed(() => {
  return regUsername.value.length >= 3 && 
         fullname.value.length >= 3 && 
         regPassword.value.length >= 6 && 
         regPassword.value === confirmPassword.value
})

// Login handler
const handleLogin = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    await login(username.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
  } finally {
    isLoading.value = false
  }
}

// Register handler
const handleRegister = async () => {
  if (isRegistering.value || !canRegister.value) return
  
  isRegistering.value = true
  error.value = ''
  
  try {
    if (regPassword.value !== confirmPassword.value) {
      throw new Error('รหัสผ่านไม่ตรงกัน')
    }
    
    await register({
      username: regUsername.value,
      password: regPassword.value,
      fullname: fullname.value
    })
    
    // Automatically login after successful registration
    await login(regUsername.value, regPassword.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
  } finally {
    isRegistering.value = false
  }
}

// Check for token on mount
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-form-container {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
}

.login-image-container {
  flex: 1;
  background: linear-gradient(135deg, #43a047, #2e7d32);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
  display: none;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.text-primary {
  color: #4CAF50;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #424242;
}

.input-wrapper {
  position: relative;
}

.input-wrapper i {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #9e9e9e;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #4CAF50;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.login-button, .register-button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button {
  background-color: #4CAF50;
  color: white;
  margin-bottom: 1.5rem;
}

.register-button {
  background-color: #2196F3;
  color: white;
}

.login-button:hover {
  background-color: #388e3c;
}

.register-button:hover {
  background-color: #1976d2;
}

.login-button:disabled, .register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.login-content {
  max-width: 500px;
}

.feature-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  margin-top: 2rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
}

.feature-item i {
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .login-image-container {
    display: flex;
  }
  
  .feature-list {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
