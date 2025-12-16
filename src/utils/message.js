// 消息类型常量
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

// 消息项类
class MessageItem {
  constructor(message, type = MESSAGE_TYPES.SUCCESS, options = {}) {
    this.id = Date.now() + Math.random()
    this.message = message
    this.type = type
    this.duration = options.duration || 3000
    this.autoClose = options.autoClose !== false
    this.onClose = options.onClose || null
  }
}

// 消息服务类
class MessageService {
  constructor() {
    this.messageQueue = []
    this.currentMessage = null
    this.isProcessing = false

    // 创建简单的事件总线
    this.eventBus = this.createEventBus()
  }

  // 创建简易事件总线
  createEventBus() {
    const listeners = {}

    return {
      $on(event, callback) {
        if (!listeners[event]) {
          listeners[event] = []
        }
        listeners[event].push(callback)
      },
      $emit(event, data) {
        if (listeners[event]) {
          listeners[event].forEach((callback) => {
            try {
              callback(data)
            } catch (error) {
              console.error('事件处理错误:', error)
            }
          })
        }
      },
      $off(event, callback) {
        if (listeners[event]) {
          const index = listeners[event].indexOf(callback)
          if (index > -1) {
            listeners[event].splice(index, 1)
          }
        }
      },
    }
  }

  // 显示消息（主方法）
  show(message, type = MESSAGE_TYPES.SUCCESS, options = {}) {
    const messageItem = new MessageItem(message, type, options)
    this.messageQueue.push(messageItem)

    // 延迟处理，避免多个消息同时触发
    setTimeout(() => {
      this.processQueue()
    }, 10)
  }

  // 快捷方法 - 成功消息
  success(message, options = {}) {
    this.show(message, MESSAGE_TYPES.SUCCESS, options)
  }

  // 快捷方法 - 错误消息
  error(message, options = {}) {
    this.show(message, MESSAGE_TYPES.ERROR, options)
  }

  // 快捷方法 - 警告消息
  warning(message, options = {}) {
    this.show(message, MESSAGE_TYPES.WARNING, options)
  }

  // 快捷方法 - 信息消息
  info(message, options = {}) {
    this.show(message, MESSAGE_TYPES.INFO, options)
  }

  // 处理消息队列
  processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return
    }

    this.isProcessing = true
    this.currentMessage = this.messageQueue.shift()

    // 通过事件总线发送消息显示事件
    this.eventBus.$emit('show-toast', {
      id: this.currentMessage.id,
      message: this.currentMessage.message,
      type: this.currentMessage.type,
      duration: this.currentMessage.duration,
      autoClose: this.currentMessage.autoClose,
    })

    // 如果自动关闭，设置定时器
    if (this.currentMessage.autoClose) {
      setTimeout(() => {
        this.closeCurrent()
      }, this.currentMessage.duration)
    }
  }

  // 关闭当前消息
  closeCurrent() {
    if (this.currentMessage) {
      // 触发关闭回调
      if (this.currentMessage.onClose) {
        this.currentMessage.onClose()
      }

      // 通知组件关闭
      this.eventBus.$emit('close-toast', { id: this.currentMessage.id })

      // 重置状态
      this.currentMessage = null
      this.isProcessing = false

      // 延迟处理下一条消息
      setTimeout(() => {
        this.processQueue()
      }, 300)
    }
  }

  // 手动关闭当前消息
  close() {
    this.closeCurrent()
  }

  // 清除所有消息
  clear() {
    this.messageQueue = []
    if (this.currentMessage) {
      this.closeCurrent()
    }
  }

  // 获取事件总线（供组件使用）
  getEventBus() {
    return this.eventBus
  }
}

// 创建单例实例
const messageService = new MessageService()

// 导出单例和常量
export default messageService
// export { MESSAGE_TYPES }
