<!-- src/views/transform/mqtt/BasicConfig.vue -->
<template>
  <div class="basic-config">
    <div class="section-header">
      <h4><i class="fas fa-cog"></i> 基础连接配置</h4>
    </div>

    <div class="section-content">
      <!-- 启用开关 -->
      <div class="config-row first-row">
        <div class="config-item full-width enable-toggle">
          <label class="config-label enable-label">
            <input type="checkbox" v-model="config.enabled" class="checkbox" />
            <span class="enable-text">启用此连接</span>
          </label>
        </div>
      </div>

      <!-- 第一行：连接名称 + Broker地址 -->
      <div class="config-row">
        <div class="config-item">
          <div class="label-group">
            <span class="config-label">连接名称</span>
            <span class="required">*</span>
          </div>
          <input
            type="text"
            v-model="config.brokerName"
            placeholder="生产环境MQTT"
            :disabled="!config.enabled"
          />
        </div>

        <div class="config-item address-group">
          <div class="label-group">
            <span class="config-label">Broker地址</span>
            <span class="required">*</span>
          </div>
          <div class="input-group">
            <input
              type="text"
              v-model="config.brokerHost"
              placeholder="mqtt.broker.com"
              :disabled="!config.enabled"
              class="host-input"
            />
            <span class="port-label">:</span>
            <input
              type="number"
              v-model="config.brokerPort"
              placeholder="1883"
              :disabled="!config.enabled"
              class="port-input"
              min="1"
              max="65535"
            />
          </div>
        </div>
      </div>

      <!-- 第二行：客户端ID + 保活时间 -->
      <div class="config-row">
        <div class="config-item">
          <div class="label-group">
            <span class="config-label">客户端ID</span>
            <span class="required">*</span>
          </div>
          <input
            type="text"
            v-model="config.clientId"
            placeholder="gateway_001"
            :disabled="!config.enabled"
          />
        </div>

        <div class="config-item">
          <div class="label-group">
            <span class="config-label">保活时间</span>
          </div>
          <div class="input-with-unit">
            <input
              type="number"
              v-model="config.keepaliveInterval"
              :disabled="!config.enabled"
              min="5"
              step="1"
            />
            <span class="unit">秒</span>
          </div>
        </div>
      </div>

      <!-- 第三行：连接超时 + 清理会话 -->
      <div class="config-row">
        <div class="config-item">
          <div class="label-group">
            <span class="config-label">连接超时</span>
          </div>
          <div class="input-with-unit">
            <input
              type="number"
              v-model="config.connectionTimeout"
              :disabled="!config.enabled"
              min="1"
              step="1"
            />
            <span class="unit">秒</span>
          </div>
        </div>

        <div class="config-item">
          <div class="label-group">
            <span class="config-label">清理会话</span>
          </div>
          <select v-model="config.cleanSession" :disabled="!config.enabled" class="session-select">
            <option :value="true">是</option>
            <option :value="false">否</option>
          </select>
        </div>
      </div>

      <!-- 第四行：默认QoS等级 -->
      <div class="config-row">
        <div class="config-item">
          <div class="label-group">
            <span class="config-label">默认QoS等级</span>
          </div>
          <select v-model="config.qosLevel" :disabled="!config.enabled" class="qos-select">
            <option value="0">QoS 0 - 至多一次</option>
            <option value="1">QoS 1 - 至少一次</option>
            <option value="2">QoS 2 - 恰好一次</option>
          </select>
        </div>
        <div class="config-item">
          <!-- 占位，保持布局一致 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BasicConfig',
  props: {
    configData: {
      type: Object,
      required: true,
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
  methods: {
    // 获取当前配置
    getConfig() {
      return { ...this.config }
    },

    // 验证配置
    validate() {
      const errors = []

      if (!this.config.brokerName?.trim()) {
        errors.push('连接名称不能为空')
      }

      if (!this.config.brokerHost?.trim()) {
        errors.push('Broker地址不能为空')
      }

      if (!this.config.brokerPort || this.config.brokerPort < 1 || this.config.brokerPort > 65535) {
        errors.push('端口号必须在1-65535之间')
      }

      if (!this.config.clientId?.trim()) {
        errors.push('客户端ID不能为空')
      }

      if (this.config.keepaliveInterval < 5) {
        errors.push('保活时间不能小于5秒')
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
}
</script>

<style scoped>
/* 样式保持不变 */
.basic-config {
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
  color: #3498db;
}

.section-content {
  padding: 20px 20px 16px;
}

/* 第一行启用开关 */
.config-row.first-row {
  margin-bottom: 8px;
  min-height: auto;
}

.enable-toggle {
  padding: 2px 0;
  margin-bottom: 0;
}

.enable-label {
  display: inline-flex;
  align-items: center;
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
}

.enable-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
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

.config-item {
  display: flex;
  flex-direction: column;
  min-height: 60px;
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

/* 输入框基础样式 */
input[type='text'],
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

/* 复选框样式 */
.checkbox {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

/* Broker地址组 */
.address-group {
  display: flex;
  flex-direction: column;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-input {
  flex: 3;
}

.port-label {
  color: #7f8c8d;
  font-weight: 500;
  min-width: 10px;
}

.port-input {
  flex: 1;
  min-width: 80px;
}

/* 带单位的输入框 */
.input-with-unit {
  position: relative;
  width: 100%;
}

.input-with-unit input {
  padding-right: 40px;
}

.unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  font-size: 14px;
}

/* 下拉选择框 */
.session-select,
.qos-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237f8c8d' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 32px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-row {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .config-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .config-row.first-row {
    margin-bottom: 4px;
  }

  .section-content {
    padding: 16px 16px 12px;
  }

  .section-header {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .port-label {
    display: none;
  }

  .host-input,
  .port-input {
    width: 100%;
  }
}
</style>
