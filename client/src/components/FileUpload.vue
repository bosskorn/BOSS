<template>
  <div 
    class="file-upload"
    :class="{ 'drag-over': isDragOver }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input 
      type="file" 
      id="fileUpload" 
      ref="fileInput"
      class="file-input" 
      @change="handleFileChange"
      accept=".csv,.xls,.xlsx"
    />
    <label for="fileUpload" class="file-label">
      <div>
        <i class="fas fa-cloud-upload-alt"></i>
        <p>คลิกหรือลากไฟล์มาวางที่นี่</p>
        <p class="file-formats">รองรับไฟล์ CSV, XLS, XLSX</p>
      </div>
    </label>
    <div v-if="file" class="file-info">
      <span class="file-name">{{ file.name }}</span>
      <div class="file-actions">
        <button class="file-upload-btn" @click="handleUpload" :disabled="isUploading">
          <i class="fas fa-upload"></i>
          <span>{{ isUploading ? 'กำลังอัพโหลด...' : 'อัพโหลด' }}</span>
        </button>
        <button class="file-cancel-btn" @click="cancelUpload">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'

const emit = defineEmits(['file-selected'])

const fileInput = ref(null)
const file = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)

// Handle file selection via input
const handleFileChange = (e) => {
  const selectedFile = e.target.files[0]
  if (selectedFile) {
    file.value = selectedFile
  }
}

// Handle drag and drop events
const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e) => {
  isDragOver.value = false
  const droppedFile = e.dataTransfer.files[0]
  if (droppedFile) {
    file.value = droppedFile
  }
}

// Handle file upload
const handleUpload = () => {
  if (!file.value) return
  
  isUploading.value = true
  
  // Emit the file to parent component for processing
  emit('file-selected', file.value)
  
  // Reset after upload (in real app, wait for upload to complete)
  setTimeout(() => {
    isUploading.value = false
    // Don't reset file here so user can see what was uploaded
  }, 1000)
}

// Cancel selected file
const cancelUpload = () => {
  file.value = null
  fileInput.value.value = null
}
</script>

<style scoped>
.file-upload {
  border: 2px dashed #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.file-upload:hover, .file-upload.drag-over {
  border-color: #4CAF50;
}

.file-input {
  display: none;
}

.file-label {
  display: block;
  cursor: pointer;
  color: #666;
}

.file-label i {
  font-size: 1.5rem;
  color: #4CAF50;
  margin-bottom: 8px;
}

.file-label p {
  margin: 4px 0;
  font-size: 0.875rem;
}

.file-formats {
  font-size: 0.75rem;
  color: #999;
}

.file-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e0e0e0;
}

.file-name {
  display: block;
  font-size: 0.875rem;
  margin-bottom: 8px;
  word-break: break-all;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.file-upload-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-upload-btn:hover {
  background-color: #388e3c;
}

.file-upload-btn:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.file-cancel-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.file-cancel-btn:hover {
  background-color: #d32f2f;
}
</style>
