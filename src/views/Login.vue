<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 品牌 -->
      <div class="login-brand">
        <div class="brand-icon">
          <i class="fas fa-network-wired"></i>
        </div>
        <h1>数据采集网关</h1>
        <p>GX IoT Gateway</p>
      </div>

      <!-- 表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-field">
          <div class="input-wrap">
            <i class="fas fa-user"></i>
            <input
              v-model="form.username"
              type="text"
              placeholder="用户名"
              required
              :disabled="loading"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-field">
          <div class="input-wrap">
            <i class="fas fa-lock"></i>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="密码"
              required
              :disabled="loading"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-pwd"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="loading || !form.username || !form.password"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          {{ loading ? '登录中...' : '登 录' }}
        </button>

        <div v-if="error" class="error-msg">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
      </form>

      <div class="login-footer">© 2025 果下科技</div>
    </div>
  </div>
</template>

<script>
import { login } from '@/api/auth.js'

export default {
  name: 'Login',
  data() {
    return {
      form: { username: '', password: '' },
      showPassword: false,
      loading: false,
      error: '',
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      try {
        const response = await login(this.form)
        if (response.code === 200) {
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('username', this.form.username)
          this.$router.push('/dashboard')
        } else {
          this.error = response.message || '登录失败'
        }
      } catch (err) {
        if (err.message.includes('Network Error')) {
          this.error = '网络连接失败，请检查后端服务是否运行'
        } else if (err.message.includes('timeout')) {
          this.error = '请求超时，请检查网络连接'
        } else if (err.response?.status === 401) {
          this.error = '用户名或密码错误'
        } else if (err.response) {
          this.error = `服务器错误: ${err.response.status}`
        } else {
          this.error = '用户名或密码错误'
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
  background: linear-gradient(135deg, #e8f4fd 0%, #d6eaf8 50%, #ebf5fb 100%);
}

.login-card {
  width: 380px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  padding: 40px 36px 28px;
}

/* 品牌 */
.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3498db, #5dade2);
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.25);
}

.brand-icon i {
  font-size: 26px;
  color: #fff;
}

.login-brand h1 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 1px;
}

.login-brand p {
  margin: 0;
  font-size: 12px;
  color: #95a5a6;
  letter-spacing: 1px;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid #e1e5e9;
  border-radius: 8px;
  padding: 0 14px;
  gap: 12px;
  background: #fff;
  transition: all 0.2s;
}

.input-wrap:focus-within {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.08);
}

.input-wrap > i {
  color: #85c1e9;
  font-size: 14px;
  flex-shrink: 0;
}

.input-wrap input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 15px;
  color: #2c3e50;
  background: transparent !important;
}

.input-wrap input:-webkit-autofill,
.input-wrap input:-webkit-autofill:hover,
.input-wrap input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #2c3e50 !important;
  transition: background-color 5000s ease-in-out 0s;
}

.input-wrap input::placeholder {
  color: #bdc3c7;
}

.input-wrap input:disabled {
  cursor: not-allowed;
}

.toggle-pwd {
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  flex-shrink: 0;
}

.toggle-pwd:hover {
  color: #3498db;
}

/* 登录按钮 */
.btn-login {
  padding: 12px;
  background: linear-gradient(135deg, #3498db 0%, #2e86c1 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  margin-top: 4px;
  letter-spacing: 2px;
}

.btn-login:hover:not(:disabled) {
  background: linear-gradient(135deg, #2e86c1 0%, #2874a6 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-login:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 错误 */
.error-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: #fdecea;
  border-radius: 6px;
  color: #c0392b;
  font-size: 13px;
}

/* 底部 */
.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 11px;
  color: #bdc3c7;
}

@media (max-width: 480px) {
  .login-card {
    width: 92%;
    padding: 32px 24px 24px;
  }
}
</style>
