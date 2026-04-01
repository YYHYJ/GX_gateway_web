<template>
  <MainLayout
    active-nav="system-management"
    active-sub-item="user-management"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="用户管理" :breadcrumbs="breadcrumbs" />

      <div class="user-mgmt-content">
        <!-- 当前账户信息 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-user-circle"></i>
              当前账户
            </div>
            <span class="status-badge status-normal">在线</span>
          </div>
          <div class="card-content">
            <div class="info-grid cols-4">
              <div class="info-item">
                <div class="info-label">用户名</div>
                <div class="info-value">admin</div>
              </div>
              <div class="info-item">
                <div class="info-label">角色</div>
                <div class="info-value">系统管理员</div>
              </div>
              <div class="info-item">
                <div class="info-label">上次登录</div>
                <div class="info-value">{{ lastLoginTime }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">登录IP</div>
                <div class="info-value">192.168.1.100</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 修改密码 -->
        <div class="card password-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-key"></i>
              修改密码
            </div>
          </div>
          <div class="card-content">
            <div class="password-form">
              <div class="form-group">
                <label>当前密码</label>
                <div class="password-input-wrap">
                  <input
                    :type="showOld ? 'text' : 'password'"
                    class="form-control"
                    v-model="form.oldPassword"
                    placeholder="请输入当前密码"
                  />
                  <i
                    class="fas toggle-eye"
                    :class="showOld ? 'fa-eye-slash' : 'fa-eye'"
                    @click="showOld = !showOld"
                  ></i>
                </div>
              </div>

              <div class="form-group">
                <label>新密码</label>
                <div class="password-input-wrap">
                  <input
                    :type="showNew ? 'text' : 'password'"
                    class="form-control"
                    v-model="form.newPassword"
                    placeholder="请输入新密码"
                    @input="checkStrength"
                  />
                  <i
                    class="fas toggle-eye"
                    :class="showNew ? 'fa-eye-slash' : 'fa-eye'"
                    @click="showNew = !showNew"
                  ></i>
                </div>
                <!-- 密码强度 -->
                <div class="strength-bar" v-if="form.newPassword">
                  <div class="strength-track">
                    <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPercent }"></div>
                  </div>
                  <span class="strength-text" :class="strengthClass">{{ strengthText }}</span>
                </div>
              </div>

              <div class="form-group">
                <label>确认新密码</label>
                <div class="password-input-wrap">
                  <input
                    :type="showConfirm ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'input-error': form.confirmPassword && !passwordMatch }"
                    v-model="form.confirmPassword"
                    placeholder="请再次输入新密码"
                  />
                  <i
                    class="fas toggle-eye"
                    :class="showConfirm ? 'fa-eye-slash' : 'fa-eye'"
                    @click="showConfirm = !showConfirm"
                  ></i>
                </div>
                <div class="form-hint error" v-if="form.confirmPassword && !passwordMatch">
                  <i class="fas fa-exclamation-circle"></i> 两次输入的密码不一致
                </div>
              </div>

              <div class="password-rules">
                <div class="rules-title"><i class="fas fa-info-circle"></i> 密码要求</div>
                <ul>
                  <li :class="{ met: rules.length }"><i class="fas" :class="rules.length ? 'fa-check-circle' : 'fa-circle'"></i> 长度不少于 8 位</li>
                  <li :class="{ met: rules.upper }"><i class="fas" :class="rules.upper ? 'fa-check-circle' : 'fa-circle'"></i> 包含大写字母</li>
                  <li :class="{ met: rules.lower }"><i class="fas" :class="rules.lower ? 'fa-check-circle' : 'fa-circle'"></i> 包含小写字母</li>
                  <li :class="{ met: rules.number }"><i class="fas" :class="rules.number ? 'fa-check-circle' : 'fa-circle'"></i> 包含数字</li>
                </ul>
              </div>

              <div class="card-footer" style="justify-content: flex-end; border-top: none; padding: 16px 0 0;">
                <button
                  class="btn btn-primary"
                  @click="handleSubmit"
                  :disabled="!canSubmit || saving"
                >
                  <i class="fas fa-save"></i> {{ saving ? '保存中...' : '确认修改' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

export default {
  name: 'UserManagement',
  components: { MainLayout, PageHeader },
  data() {
    return {
      breadcrumbs: [{ title: '系统管理' }, { title: '用户管理' }],
      saving: false,
      showOld: false,
      showNew: false,
      showConfirm: false,
      lastLoginTime: '2025-01-15 09:23:45',
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      strength: 0,
    }
  },
  computed: {
    rules() {
      const p = this.form.newPassword
      return {
        length: p.length >= 8,
        upper: /[A-Z]/.test(p),
        lower: /[a-z]/.test(p),
        number: /[0-9]/.test(p),
      }
    },
    passwordMatch() {
      return this.form.newPassword === this.form.confirmPassword
    },
    canSubmit() {
      return (
        this.form.oldPassword &&
        this.rules.length &&
        this.rules.upper &&
        this.rules.lower &&
        this.rules.number &&
        this.passwordMatch &&
        this.form.confirmPassword
      )
    },
    strengthClass() {
      if (this.strength <= 1) return 'weak'
      if (this.strength <= 2) return 'medium'
      if (this.strength <= 3) return 'strong'
      return 'very-strong'
    },
    strengthPercent() {
      return (this.strength / 4) * 100 + '%'
    },
    strengthText() {
      const map = { weak: '弱', medium: '中', strong: '强', 'very-strong': '很强' }
      return map[this.strengthClass]
    },
  },
  methods: {
    handleNavigation() {},

    checkStrength() {
      const r = this.rules
      this.strength = [r.length, r.upper, r.lower, r.number].filter(Boolean).length
    },

    handleSubmit() {
      if (!this.canSubmit) return
      this.saving = true
      // TODO: 接入真实API后替换
      setTimeout(() => {
        this.saving = false
        this.form.oldPassword = ''
        this.form.newPassword = ''
        this.form.confirmPassword = ''
        this.strength = 0
        alert('密码修改成功（Mock）')
      }, 800)
    },
  },
}
</script>

<style scoped>
.user-mgmt-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 密码表单限宽居中 */
.password-card .card-content {
  display: flex;
  justify-content: center;
}

.password-form {
  width: 100%;
  max-width: 480px;
}

/* 密码输入框带眼睛图标 */
.password-input-wrap {
  position: relative;
}

.password-input-wrap .form-control {
  padding-right: 40px;
}

.toggle-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
}

.toggle-eye:hover {
  color: #3498db;
}

/* 输入错误 */
.input-error {
  border-color: #e74c3c !important;
}

.form-hint.error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #e74c3c;
}

/* 密码强度条 */
.strength-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-track {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

.strength-fill.weak { background: #e74c3c; }
.strength-fill.medium { background: #f39c12; }
.strength-fill.strong { background: #3498db; }
.strength-fill.very-strong { background: #2ecc71; }

.strength-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 32px;
}

.strength-text.weak { color: #e74c3c; }
.strength-text.medium { color: #f39c12; }
.strength-text.strong { color: #3498db; }
.strength-text.very-strong { color: #2ecc71; }

/* 密码规则 */
.password-rules {
  padding: 14px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e1e5e9;
  margin-top: 4px;
}

.rules-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.rules-title i {
  color: #3498db;
  margin-right: 4px;
}

.password-rules ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.password-rules li {
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.password-rules li i {
  font-size: 11px;
}

.password-rules li.met {
  color: #2ecc71;
}

.password-rules li.met i {
  color: #2ecc71;
}

@media (max-width: 600px) {
  .password-rules ul {
    grid-template-columns: 1fr;
  }
}
</style>
