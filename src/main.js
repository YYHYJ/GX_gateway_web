import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import request from './utils/request'

// 导入全局样式
import './styles/common.css'
import messageService from './utils/message'
import { eventBus, WSEvent } from '@/utils/websocket'

// 全局错误处理
eventBus.on(WSEvent.ERROR, (error) => {
  console.error('WebSocket错误:', error)
})

// 全局连接状态监听
eventBus.on(WSEvent.CONNECTED, () => {
  console.log('WebSocket已连接')
})

// 全局断开连接处理
eventBus.on(WSEvent.DISCONNECTED, () => {
  console.warn('WebSocket已断开')
})

// 创建Vue应用
const app = createApp(App)

// 将消息服务挂载到 Vue 全局属性
app.config.globalProperties.$message = messageService

// 也可以添加到 app 实例上，方便访问
app.$message = messageService

// 将axios实例挂载到Vue全局属性
app.config.globalProperties.$axios = request
// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')
