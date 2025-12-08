<template>
  <div class="login-page">
    <div class="login-box">
      <h2>登录</h2>
      <form class="login-form" @submit.prevent="handleLogin">
        <input
          v-model="form.username"
          type="text"
          placeholder="用户名"
          required
          :disabled="loading"
        />
        <input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="密码"
          required
          :disabled="loading"
        />
        <label>
          <input v-model="showPassword" type="checkbox" :disabled="loading" />
          显示密码
        </label>
        <button type="submit" :disabled="loading || !form.username || !form.password">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
// 1. 导入外部模块（登录API）
import { login } from '@/api/auth.js'

export default {
  // 2. 组件定义开始
  name: 'Login',
  // 3. data函数：返回组件的数据
  data() {
    return {
      form: {
        username: '',
        password: '',
      },
      showPassword: false,
      loading: false,
      error: '',
    }
  },
  // 4. methods：组件的方法（用户交互触发的函数）
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''

      try {
        console.log('=== 调试信息 ===')
        console.log('请求数据:', this.form)

        const response = await login(this.form)
        console.log('后端响应:', response)

        // 假设后端返回格式：{ code: 200, message: '登录成功' }
        if (response.code === 200) {
          console.log('✅ 登录成功')

          // 只需要保存简单的登录状态
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('username', this.form.username)

          // 跳转到dashboard
          this.$router.push('/dashboard')
        } else {
          this.error = response.message || '登录失败'
        }
      } catch (err) {
        console.error('❌ 登录出错:', err)
        console.error('错误详情:', err)

        if (err.message.includes('Network Error')) {
          this.error = '网络连接失败，请检查：1. 后端服务是否运行 2. 网络是否连接'
        } else if (err.message.includes('timeout')) {
          this.error = '请求超时，请检查网络'
        } else if (err.response) {
          this.error = `服务器错误: ${err.response.status}`
        } else {
          this.error = '登录失败: ' + err.message
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 300px;
}

.login-box h2 {
  margin: 0 0 20px 0;
  text-align: center;
  color: #333;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.login-form input[type='text'],
.login-form input[type='password'] {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-form input:focus {
  outline: none;
  border-color: #007bff;
}

.login-form input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.login-form label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.login-form label input[type='checkbox'] {
  width: auto;
  cursor: pointer;
}

.login-form button {
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-form button:hover:not(:disabled) {
  background: #0056b3;
}

.login-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  font-size: 14px;
  margin: 5px 0 0 0;
  text-align: center;
}
</style>
