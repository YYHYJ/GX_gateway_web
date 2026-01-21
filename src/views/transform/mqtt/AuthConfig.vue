<!-- src/views/transform/mqtt/AuthConfig.vue -->
<template>
  <div class="auth-config">
    <div class="section-header">
      <h4><i class="fas fa-key"></i> 认证配置</h4>
    </div>

    <div class="section-content">
      <!-- 认证方式选择 -->
      <div class="config-row auth-type-row">
        <div class="config-item full-width">
          <div class="label-group">
            <span class="config-label">认证方式</span>
          </div>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                v-model="config.authType"
                value="none"
                :disabled="!enabled"
                class="radio"
              />
              <span class="radio-label">无需认证</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                v-model="config.authType"
                value="password"
                :disabled="!enabled"
                class="radio"
              />
              <span class="radio-label">用户名密码认证</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 用户名密码认证 -->
      <div v-if="config.authType === 'password'" class="auth-form">
        <div class="config-row">
          <div class="config-item">
            <div class="label-group">
              <span class="config-label">用户名</span>
              <span class="required">*</span>
            </div>
            <input
              type="text"
              v-model="config.username"
              :disabled="!enabled"
              placeholder="请输入用户名"
            />
          </div>
          <div class="config-item">
            <div class="label-group">
              <span class="config-label">密码</span>
              <span class="required">*</span>
            </div>
            <input
              type="password"
              v-model="config.password"
              :disabled="!enabled"
              placeholder="请输入密码"
            />
          </div>
        </div>
      </div>

      <!-- 认证方式说明 -->
      <div class="info-box">
        <div class="info-icon">
          <i class="fas fa-info-circle"></i>
        </div>
        <div class="info-content">
          <p class="info-title">认证说明：</p>
          <p class="info-text">
            • <strong>无需认证</strong>：连接到无需认证的MQTT Broker<br />
            • <strong>用户名密码认证</strong>：使用用户名和密码进行身份验证
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthConfig',
  props: {
    configData: {
      type: Object,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['config-change'],
  data() {
    return {
      config: { ...this.configData },
    }
  },
  watch: {
    // 监听配置变化，通知父组件
    config: {
      handler(newVal) {
        this.$emit('config-change', { ...newVal })
      },
      deep: true,
      immediate: true,
    },

    // 监听props变化，更新本地配置
    configData: {
      handler(newVal) {
        // 避免循环更新
        if (JSON.stringify(this.config) !== JSON.stringify(newVal)) {
          this.config = { ...newVal }
        }
      },
      deep: true,
    },
  },
}
</script>

<style scoped>
.auth-config {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e1e5e9;
}

.section-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.section-header h4 i {
  color: #f39c12;
}

.section-content {
  padding: 20px 20px 16px;
}

/* 栅格布局系统 */
.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
  align-items: start;
  min-height: 60px;
}

.auth-type-row {
  margin-bottom: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

/* 标签组样式 */
.label-group {
  margin-bottom: 8px;
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-label {
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
  line-height: 1.4;
}

.required {
  color: #e74c3c;
  font-size: 14px;
}

/* 认证方式单选按钮组 */
.radio-group {
  display: flex;
  gap: 32px;
  margin-top: 4px;
}

.radio-option {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
}

.radio {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.radio-label {
  color: #34495e;
  font-size: 14px;
  user-select: none;
}

/* 输入框基础样式 */
input[type='text'],
input[type='password'],
input[type='number'],
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
  background: #fff;
  transition: all 0.2s;
  height: 40px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

input:disabled,
select:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
  color: #95a5a6;
  border-color: #ecf0f1;
}

/* 认证表单区域 */
.auth-form {
  margin-top: 8px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 信息提示框 */
.info-box {
  margin-top: 24px;
  padding: 16px;
  background-color: #f0f7ff;
  border: 1px solid #d0e3ff;
  border-radius: 6px;
  display: flex;
  gap: 12px;
}

.info-icon {
  color: #3498db;
  font-size: 18px;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 6px 0;
  font-size: 14px;
}

.info-text {
  color: #5c6c7d;
  margin: 0;
  line-height: 1.5;
  font-size: 13px;
}

.info-text strong {
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-row {
    gap: 20px;
  }

  .radio-group {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .config-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .auth-form {
    padding: 16px;
  }

  .section-content {
    padding: 16px 16px 12px;
  }

  .section-header {
    padding: 12px 16px;
  }

  .radio-group {
    gap: 20px;
    flex-wrap: wrap;
  }

  .info-box {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .radio-group {
    gap: 16px;
    flex-direction: column;
  }
}
</style>
