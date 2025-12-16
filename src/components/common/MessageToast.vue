<template>
  <transition name="fade-slide" @after-leave="handleAfterLeave">
    <div v-if="visible" :class="['message-toast', type]" role="alert" ref="toastElement">
      <i :class="iconClass"></i>
      <span class="message-text">{{ message }}</span>
      <button class="message-close" @click="handleClose" aria-label="关闭消息">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'MessageToast',
  props: {
    messageId: {
      type: [String, Number],
      default: null,
    },
    message: {
      type: String,
      required: true,
      default: '',
    },
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
    },
    duration: {
      type: Number,
      default: 3000,
    },
    autoClose: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      visible: false,
      timer: null,
      isManualClose: false,
    }
  },
  computed: {
    iconClass() {
      const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
      }
      return iconMap[this.type] || 'fas fa-info-circle'
    },
  },
  methods: {
    // 显示消息
    show() {
      this.visible = true
      this.isManualClose = false

      // 清除之前的定时器
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }

      // 如果启用自动关闭，设置定时器
      if (this.autoClose && this.duration > 0) {
        this.timer = setTimeout(() => {
          this.handleClose()
        }, this.duration)
      }
    },

    // 处理关闭
    handleClose() {
      if (this.visible) {
        this.isManualClose = true
        this.visible = false
      }
    },

    // 过渡动画结束后
    handleAfterLeave() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      // 发出关闭事件，传递消息ID
      this.$emit('closed', {
        id: this.messageId,
        manualClose: this.isManualClose,
      })
    },
  },
  watch: {
    message(newMessage) {
      if (newMessage && !this.visible) {
        // 当有新消息且当前不可见时显示
        this.show()
      }
    },
  },
  mounted() {
    // 组件挂载后自动显示
    if (this.message) {
      this.show()
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  },
}
</script>

<style scoped>
/* 保持原有的样式不变 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: var(--border-radius, 6px);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9999;
  box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
  min-width: 300px;
  max-width: 400px;
  animation: slideInRight 0.3s ease;
  border-left: 4px solid transparent;
}

.message-toast i:first-child {
  font-size: 18px;
}

.message-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.message-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.message-close:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

/* 消息类型样式 */
.message-toast.success {
  background-color: var(--success-color, #2ecc71);
  color: white;
  border-left-color: #27ae60;
}

.message-toast.error {
  background-color: var(--danger-color, #e74c3c);
  color: white;
  border-left-color: #c0392b;
}

.message-toast.warning {
  background-color: var(--warning-color, #f39c12);
  color: white;
  border-left-color: #d68910;
}

.message-toast.info {
  background-color: var(--secondary-color, #3498db);
  color: white;
  border-left-color: #2980b9;
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-toast {
    left: 20px;
    right: 20px;
    max-width: none;
    top: 10px;
  }
}
</style>
