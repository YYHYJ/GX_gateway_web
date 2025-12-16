<template>
  <div class="global-message-container">
    <!-- 只显示当前活跃的消息 -->
    <MessageToast
      v-if="currentMessage"
      :key="currentMessage.id"
      :message-id="currentMessage.id"
      :message="currentMessage.text"
      :type="currentMessage.type"
      :duration="currentMessage.duration"
      :auto-close="currentMessage.autoClose"
      @closed="handleMessageClosed"
    />
  </div>
</template>

<script>
import MessageToast from './MessageToast.vue'
import messageService from '@/utils/message'

export default {
  name: 'GlobalMessageContainer',
  components: {
    MessageToast,
  },
  data() {
    return {
      currentMessage: null,
      messageQueue: [],
    }
  },
  created() {
    // 获取消息服务的事件总线
    const eventBus = messageService.getEventBus()

    // 监听显示消息事件
    eventBus.$on('show-toast', this.handleShowToast)

    // 监听关闭消息事件
    eventBus.$on('close-toast', this.handleCloseToast)
  },
  beforeUnmount() {
    // 清理事件监听
    const eventBus = messageService.getEventBus()
    if (eventBus) {
      eventBus.$off('show-toast', this.handleShowToast)
      eventBus.$off('close-toast', this.handleCloseToast)
    }
  },
  methods: {
    // 处理显示消息事件
    handleShowToast(messageData) {
      // 如果当前没有消息，直接显示
      if (!this.currentMessage) {
        this.currentMessage = {
          id: messageData.id,
          text: messageData.message,
          type: messageData.type,
          duration: messageData.duration,
          autoClose: messageData.autoClose,
        }
      } else {
        // 如果已经有消息，放入队列
        this.messageQueue.push({
          id: messageData.id,
          text: messageData.message,
          type: messageData.type,
          duration: messageData.duration,
          autoClose: messageData.autoClose,
        })
      }
    },

    // 处理关闭消息事件（来自服务端）
    handleCloseToast({ id }) {
      // 如果关闭的是当前消息
      if (this.currentMessage && this.currentMessage.id === id) {
        this.showNextMessage()
      }
    },

    // 处理消息组件关闭事件（来自UI）
    handleMessageClosed({ id, manualClose }) {
      // 如果关闭的是当前消息
      if (this.currentMessage && this.currentMessage.id === id) {
        this.showNextMessage()
      }
    },

    // 显示下一条消息
    showNextMessage() {
      // 延迟显示下一条消息，确保动画完成
      setTimeout(() => {
        if (this.messageQueue.length > 0) {
          this.currentMessage = this.messageQueue.shift()
        } else {
          this.currentMessage = null
        }
      }, 300) // 与消息服务的延迟时间保持一致
    },
  },
}
</script>

<style scoped>
.global-message-container {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none; /* 允许点击穿透到下层 */
}

/* 确保消息组件本身可以接收点击 */
.global-message-container > * {
  pointer-events: auto;
}
</style>
