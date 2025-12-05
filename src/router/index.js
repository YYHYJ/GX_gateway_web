/**
 * 路由配置
 * 原理：定义应用的路由映射关系
 */

import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  // 可以在这里添加更多路由
]

const router = createRouter({
  // 使用HTML5 History模式
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
