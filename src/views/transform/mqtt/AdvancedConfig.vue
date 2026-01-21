<!-- src/views/transform/mqtt/AdvancedConfig.vue 修正版 -->
<template>
  <div class="advanced-config">
    <div class="section-header">
      <h4><i class="fas fa-sliders-h"></i> 高级配置</h4>
    </div>

    <div class="section-content">
      <!-- 重连配置 -->
      <div class="config-section">
        <div class="section-title">
          <h5><i class="fas fa-redo"></i> 重连配置</h5>
        </div>

        <div class="config-row">
          <div class="config-item">
            <div class="label-group">
              <span class="config-label">自动重连</span>
            </div>
            <select v-model="config.autoReconnect" :disabled="!enabled" class="boolean-select">
              <option :value="true">启用</option>
              <option :value="false">禁用</option>
            </select>
          </div>

          <div class="config-item">
            <div class="label-group">
              <span class="config-label">重连间隔</span>
            </div>
            <div class="input-with-unit">
              <input
                type="number"
                v-model="config.reconnectInterval"
                :disabled="!enabled"
                min="1"
                max="300"
                step="1"
              />
              <span class="unit">秒</span>
            </div>
          </div>

          <div class="config-item">
            <div class="label-group">
              <span class="config-label">最大传输中消息数</span>
            </div>
            <input
              type="number"
              v-model="config.maxInflightMessages"
              :disabled="!enabled"
              min="1"
              max="100"
              step="1"
            />
          </div>
        </div>
      </div>

      <!-- 主题前缀配置 -->
      <div class="config-section">
        <div class="section-title">
          <h5><i class="fas fa-tag"></i> 主题配置</h5>
        </div>

        <div class="config-row">
          <div class="config-item full-width">
            <div class="label-group">
              <span class="config-label">主题前缀</span>
            </div>
            <input
              type="text"
              v-model="config.topicPrefix"
              placeholder="energy/"
              :disabled="!enabled"
            />
            <div class="hint">所有发布和订阅的主题将自动添加此前缀</div>
          </div>
        </div>
      </div>

      <!-- 网络配置 -->
      <div class="config-section">
        <div class="section-title">
          <h5><i class="fas fa-network-wired"></i> 网络配置</h5>
        </div>

        <div class="config-row">
          <div class="config-item">
            <div class="label-group">
              <span class="config-label">网络接口</span>
            </div>
            <input
              type="text"
              v-model="config.networkInterface"
              placeholder="eth0"
              :disabled="!enabled"
            />
          </div>

          <div class="config-item">
            <div class="label-group">
              <span class="config-label">绑定地址</span>
            </div>
            <input
              type="text"
              v-model="config.bindAddress"
              placeholder="0.0.0.0"
              :disabled="!enabled"
            />
          </div>

          <div class="config-item">
            <div class="label-group">
              <span class="config-label">DNS服务器</span>
            </div>
            <input
              type="text"
              v-model="config.dnsServers"
              placeholder="8.8.8.8, 8.8.4.4"
              :disabled="!enabled"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdvancedConfig',
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
    config: {
      handler(newVal) {
        this.$emit('config-change', { ...newVal })
      },
      deep: true,
      immediate: true,
    },
    configData: {
      handler(newVal) {
        if (JSON.stringify(this.config) !== JSON.stringify(newVal)) {
          this.config = { ...newVal }
        }
      },
      deep: true,
    },
  },
  methods: {
    getConfig() {
      return { ...this.config }
    },

    validate() {
      const errors = []

      if (
        this.config.reconnectInterval &&
        (this.config.reconnectInterval < 1 || this.config.reconnectInterval > 300)
      ) {
        errors.push('重连间隔必须在1-300秒之间')
      }

      if (
        this.config.maxInflightMessages &&
        (this.config.maxInflightMessages < 1 || this.config.maxInflightMessages > 100)
      ) {
        errors.push('最大传输中消息数必须在1-100之间')
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },

    getEmptyAdvancedConfig() {
      return {
        autoReconnect: true,
        reconnectInterval: 5,
        maxInflightMessages: 20,
        topicPrefix: '',
        networkInterface: '',
        bindAddress: '',
        dnsServers: '',
      }
    },
  },
}
</script>

<style scoped>
.advanced-config {
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
  color: #9b59b6;
}

.section-content {
  padding: 20px;
}

/* 配置区域 */
.config-section {
  background: #f8fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin-bottom: 16px;
}

.section-title h5 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #e1e5e9;
  padding-bottom: 8px;
}

.section-title h5 i {
  color: #7f8c8d;
}

/* 栅格布局 */
.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;
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

/* 输入框样式 */
input[type='text'],
input[type='number'],
select,
textarea {
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

textarea {
  height: auto;
  min-height: 80px;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.4;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #9b59b6;
  box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.1);
}

input:disabled,
select:disabled,
textarea:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
  color: #95a5a6;
  border-color: #ecf0f1;
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
.boolean-select,
.interface-select,
.log-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237f8c8d' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 32px;
}

/* 提示文本 */
.hint {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .config-row {
    gap: 16px;
  }
}

@media (max-width: 992px) {
  .config-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .config-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .config-section {
    padding: 12px 16px;
  }

  .section-content {
    padding: 16px;
  }

  .section-header {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .input-with-unit input {
    padding-right: 50px;
  }

  .unit {
    right: 8px;
  }
}
</style>
