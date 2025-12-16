<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="delete-confirm-modal">
      <div class="modal-header danger">
        <h3><i class="fas fa-exclamation-triangle"></i> 确认删除设备模板</h3>
        <!-- 修改关闭按钮 -->
        <button class="modal-close" @click="handleClose" :disabled="isDeleting">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="delete-warning">
          <div class="warning-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="warning-content">
            <h4>⚠️ 警告：此操作无法撤销！</h4>
            <p>
              您正在删除模板：<strong class="template-name">{{ template.name }}</strong>
            </p>

            <div class="delete-details">
              <div class="detail-item">
                <i class="fas fa-id-card"></i>
                <span>模板ID：</span>
                <strong>{{ template.id }}</strong>
              </div>
              <div class="detail-item">
                <i class="fas fa-industry"></i>
                <span>制造商：</span>
                <strong>{{ template.manufacturer || '未设置' }}</strong>
              </div>
              <div class="detail-item">
                <i class="fas fa-plug"></i>
                <span>协议类型：</span>
                <strong>{{ protocolDisplayName }}</strong>
              </div>
            </div>

            <div class="delete-impacts">
              <h5><i class="fas fa-exclamation-triangle"></i> 删除将导致以下影响：</h5>
              <ul>
                <li><i class="fas fa-times-circle"></i> 删除所有使用此模板的设备</li>
                <li><i class="fas fa-times-circle"></i> 删除此模板的所有Modbus数据点配置</li>
                <li><i class="fas fa-times-circle"></i> 删除所有相关的历史数据记录</li>
                <li><i class="fas fa-times-circle"></i> 此操作无法恢复，请谨慎操作</li>
              </ul>
            </div>

            <div class="delete-tip">
              <i class="fas fa-lightbulb"></i>
              提示：如果您只想临时禁用此模板，建议修改状态而非删除。
            </div>
          </div>
        </div>

        <div class="final-confirm">
          <label class="form-check">
            <input type="checkbox" v-model="confirmChecked" class="form-check-input" />
            <span class="form-check-label">我已了解上述风险，确认删除此模板</span>
          </label>

          <div class="confirm-input" v-if="confirmChecked">
            <p>
              请在下方输入模板名称 "<strong>{{ template.name }}</strong
              >" 以确认删除：
            </p>
            <input
              type="text"
              v-model="confirmInput"
              :placeholder="`请输入 ${template.name}`"
              class="form-control confirm-input-field"
              @keyup.enter="handleConfirm"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <!-- 修改取消按钮 -->
        <button class="btn btn-outline" @click="handleClose" :disabled="isDeleting">
          <i class="fas fa-times"></i> 取消
        </button>
        <!-- 修改删除按钮 -->
        <button
          class="btn btn-danger"
          @click="handleConfirm"
          :disabled="!isDeleteConfirmed || isDeleting"
          :class="{ 'animate-shake': isDeleteConfirmed && !isDeleting }"
        >
          <i v-if="isDeleting" class="fas fa-spinner fa-spin animate-spin"></i>
          <i v-else class="fas fa-trash"></i>
          {{ isDeleting ? '删除中...' : '确认删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import deviceTemplateService from '../../services/deviceTemplateService'
export default {
  name: 'DeleteConfirmModal',
  props: {
    template: {
      type: Object,
      required: true,
      default: () => ({
        id: null,
        name: '',
        manufacturer: '',
        protocol_type: '',
      }),
    },
  },
  data() {
    return {
      confirmChecked: false,
      confirmInput: '',
      isDeleting: false,
    }
  },
  computed: {
    isDeleteConfirmed() {
      return this.confirmChecked && this.confirmInput.trim() === this.template.name
    },
    protocolDisplayName() {
      // 临时写在这里，后续可以提取到工具函数
      const displayNameMap = {
        CAN: 'CAN总线',
        'IEC-61850': 'IEC 61850',
        MQTT: 'MQTT',
        ModbusRTU: 'Modbus RTU',
        ModbusTCP: 'Modbus TCP',
        OPCUA: 'OPC UA',
        RS232: 'RS232',
        RS485: 'RS485',
        HTTP: 'HTTP',
        CoAP: 'CoAP',
        WebSocket: 'WebSocket',
      }
      return displayNameMap[this.template.protocol_type] || this.template.protocol_type || '--'
    },
  },
  methods: {
    // 3. 重写 handleConfirm 方法，包含完整的删除逻辑
    async handleConfirm() {
      if (!this.isDeleteConfirmed) return

      this.isDeleting = true

      try {
        console.log('正在删除模板，ID:', this.template.id)

        // 4. 调用API删除模板
        const response = await deviceTemplateService.deleteDeviceTemplate(this.template.id)
        console.log('删除响应:', response)

        if (response && response.code === 200) {
          // 5. 删除成功，发送成功事件
          this.$emit('delete-success', {
            template: this.template,
            message: `模板 "${this.template.name}" 删除成功`,
          })
          this.$emit('close')
        } else {
          throw new Error(response?.message || `删除失败，错误码: ${response?.code || '未知'}`)
        }
      } catch (error) {
        console.error('删除模板失败:', error)

        // 6. 错误处理逻辑（从主页面复制过来）
        let errorMessage = '删除失败'

        if (error.message.includes('405')) {
          errorMessage = '删除方法不被允许，请检查API配置'
        } else if (error.message.includes('404')) {
          errorMessage = '模板不存在或已被删除'
          // 前端删除成功的情况
          this.$emit('delete-success', {
            template: this.template,
            message: '模板删除成功',
          })
          this.$emit('close')
          return
        } else if (error.message.includes('403')) {
          errorMessage = '没有权限删除此模板'
        } else if (error.message.includes('500')) {
          errorMessage = '服务器错误，请稍后重试'
        } else if (error.message.includes('Network Error')) {
          errorMessage = '网络连接失败，请检查网络设置'
        } else {
          errorMessage = `删除失败: ${error.message}`
        }

        // 7. 发送错误事件
        this.$emit('delete-error', {
          template: this.template,
          error: errorMessage,
        })
      } finally {
        this.isDeleting = false
      }
    },

    // 8. 修改关闭方法
    handleClose() {
      if (!this.isDeleting) {
        this.$emit('close')
      }
    },
  },
}
</script>

<style scoped>
/* 保持原有的删除确认模态框样式 */
.delete-confirm-modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  border-top: 4px solid var(--danger-color, #e74c3c);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-header.danger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid var(--danger-color, #e74c3c);
  background-color: #fff5f5;
}

.modal-header.danger h3 {
  margin: 0;
  color: var(--danger-color, #e74c3c);
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--gray-color, #95a5a6);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.modal-close:hover {
  background-color: #f5f5f5;
  color: var(--danger-color, #e74c3c);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.delete-warning {
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #fffaf0;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid var(--warning-color, #f39c12);
}

.warning-icon {
  font-size: 48px;
  color: var(--warning-color, #f39c12);
}

.warning-content {
  flex: 1;
}

.warning-content h4 {
  color: var(--danger-color, #e74c3c);
  margin-bottom: 10px;
  font-size: 16px;
}

.template-name {
  color: var(--danger-color, #e74c3c);
  font-size: 18px;
  font-weight: bold;
}

.delete-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item i {
  color: var(--secondary-color, #3498db);
}

.detail-item span {
  color: var(--gray-color, #95a5a6);
  font-size: 14px;
}

.detail-item strong {
  color: var(--dark-color, #34495e);
  font-size: 14px;
}

.delete-impacts {
  background-color: #fff5f5;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
  border: 1px solid #ffcdd2;
}

.delete-impacts h5 {
  color: var(--danger-color, #e74c3c);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-impacts ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.delete-impacts li {
  padding: 8px 0;
  border-bottom: 1px solid #ffebee;
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-impacts li:last-child {
  border-bottom: none;
}

.delete-impacts li i {
  color: var(--danger-color, #e74c3c);
}

.delete-tip {
  background-color: #e8f4fd;
  border-radius: 6px;
  padding: 12px 15px;
  margin-top: 15px;
  color: var(--secondary-color, #3498db);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.delete-tip i {
  color: var(--secondary-color, #3498db);
}

.final-confirm {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
  margin-top: 20px;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.form-check:hover {
  background-color: #f1f1f1;
}

.form-check-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-check-label {
  font-weight: 500;
  color: var(--dark-color, #34495e);
}

.confirm-input {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.confirm-input p {
  margin-bottom: 10px;
  color: var(--gray-color, #95a5a6);
  font-size: 14px;
}

.confirm-input strong {
  color: var(--danger-color, #e74c3c);
}

.confirm-input-field {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.3s;
}

.confirm-input-field:focus {
  outline: none;
  border-color: var(--danger-color, #e74c3c);
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.btn-danger {
  background-color: var(--danger-color, #e74c3c);
  color: white;
  border-color: var(--danger-color, #e74c3c);
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
  border-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
  animation-iteration-count: infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .delete-warning {
    flex-direction: column;
    text-align: center;
  }

  .warning-icon {
    font-size: 36px;
  }

  .delete-details {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }
}
</style>
