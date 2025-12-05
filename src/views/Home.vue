<template>
  <div class="home">
    <h1>GX Gateway 管理系统</h1>
    <p>当前环境: {{ envMode }}</p>
    <button @click="testConnection">测试后端连接</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api'

const envMode = import.meta.env.VITE_APP_MODE

const testConnection = async () => {
  try {
    // 测试连接你的后端API
    const data = await api.system.getStatus()
    console.log('后端连接成功:', data)
    alert('后端连接成功！')
  } catch (error) {
    console.error('后端连接失败:', error)
    alert('后端连接失败，请确保WSL后端在运行')
  }
}
</script>

<style scoped>
.home {
  padding: 40px;
  text-align: center;
}

.home h1 {
  color: #333;
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #66b1ff;
}
</style>
