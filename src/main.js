/**
 * 入口文件
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 导入全局样式
import './styles/common.css'

// 创建Vue应用
const app = createApp(App)

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')
