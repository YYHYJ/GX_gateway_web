/**
 * 入口文件
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 导入全局样式
import './styles/common.css'
import messageService from './utils/message'

// 创建Vue应用
const app = createApp(App)

// 将消息服务挂载到 Vue 全局属性
app.config.globalProperties.$message = messageService

// 也可以添加到 app 实例上，方便访问
app.$message = messageService

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')
