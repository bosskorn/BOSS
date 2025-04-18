<template>
  <div class="page-container">
    <div class="auth-container">
      <div class="auth-logo">
        <i class="fa-solid fa-truck-fast fa-3x" style="color: #4CAF50;"></i>
      </div>
      <h2 class="auth-title">ระบบจัดการขนส่ง</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">ชื่อผู้ใช้งาน/อีเมล</label>
          <input type="text" id="email" class="form-control" v-model="email" required placeholder="กรอกชื่อผู้ใช้งานหรืออีเมล">
        </div>
        <div class="form-group">
          <label for="password">รหัสผ่าน</label>
          <input type="password" id="password" class="form-control" v-model="password" required placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)">
        </div>

        <div class="alert alert-danger" v-if="errorMessage">{{ errorMessage }}</div>

        <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span v-if="isLoading">กำลังดำเนินการ...</span>
          <span v-else>เข้าสู่ระบบ</span>
        </button>
      </form>

      <div style="text-align: center; margin-top: 20px;">
        ยังไม่มีบัญชี? <a href="#" @click.prevent="goToRegister" style="color: #4CAF50;">สมัครสมาชิกที่นี่</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { API_BASE_URL } from '@/services/apiService';

const router = useRouter();

// State สำหรับฟอร์ม
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// ใช้ apiService แทนการกำหนด URL โดยตรง
console.log('Using apiService for API calls');

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  if (!email.value || !password.value) {
    errorMessage.value = 'กรุณากรอกอีเมลและรหัสผ่าน';
    isLoading.value = false;
    return;
  }

  try {
    // ส่งข้อมูลไปยัง Backend API ผ่าน authService
    console.log('Sending login request with credentials:', { username: email.value, password: '******' });

    // ใช้ authService.login แทนการเรียก axios โดยตรง
    console.log('Sending login request to:', 'http://localhost:3000/api/auth/login');
    console.log('With credentials:', { username: email.value, password: '******' });

    // ใช้ axios กับ URL ที่เป็นมาตรฐานเดียวกันทั้งระบบ

    // ใช้ URL เต็มเพื่อทดสอบการเชื่อมต่อโดยตรง
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: email.value,
      password: password.value
    });

    console.log('Login response:', response);

    // เข้าถึงข้อมูลจาก response.data
    const result = response.data;

    if (result.success) {
      // เก็บ token ที่ได้จาก API
      localStorage.setItem('token', result.token);

      // ดึงข้อมูลผู้ใช้ผ่าน axios โดยตรง
      const userResponse = await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'x-auth-token': result.token
        }
      });

      console.log('User verification response:', userResponse);

      // เข้าถึงข้อมูลจาก userResponse.data
      const userResult = userResponse.data;

      if (userResult.success) {
        const userData = userResult.user;
        const userRole = userData.role || 'user';
        sessionStorage.setItem('userRole', userRole);
        console.log('User role:', userRole);

        // ตรวจสอบ token ว่าเป็น admin หรือไม่
        if (userRole === 'admin' || result.token.startsWith('admin-token-')) {
          console.log('Redirecting to AdminLayout page');
          router.push('/AdminLayout');
        } else {
          console.log('Redirecting to dashboard page');
          router.push('/dashboard');
        }
      }
    } else {
      errorMessage.value = result.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    }
  } catch (error) {
    console.error("Login error:", error);
    if (error.response) {
      console.log('Error response:', error.response.status, error.response.data);
      if (error.response.status === 404) {
        errorMessage.value = 'API endpoint ไม่พบ (ตรวจสอบ URL และ API ที่ใช้)';
      } else if (error.response.status === 400) {
        errorMessage.value = error.response.data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else {
        errorMessage.value = `เกิดข้อผิดพลาด: ${error.response.status} - ${error.response.data.message || 'ไม่ทราบสาเหตุ'}`;
      }
    } else {
      errorMessage.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง';
    }
    password.value = '';
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
/* ใช้ CSS จากไฟล์ main.css แล้ว */
.w-100 {
  width: 100%;
}
</style>