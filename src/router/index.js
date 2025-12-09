import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    // 分解：
    // 1. 这是一个箭头函数，没有函数名（匿名）
    // 2. 没有参数：() 表示不接受参数
    // 3. 函数体：import('@/views/Login.vue')
    // 4. import()返回Promise，所以这个箭头函数返回Promise
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/data/device/modelConfig',
    name: 'DeviceTemplate',
    component: () => import('@/views/data/DeviceModelConfig.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  // 使用HTML5 History模式
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫：检查是否登录
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 检查是否有登录状态
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      // 未登录，重定向到登录页
      next('/')
    } else {
      next()
    }
  } else {
    // 访问登录页，如果已登录，重定向到控制台
    if (to.path === '/') {
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (isLoggedIn) {
        next('/dashboard')
      } else {
        next()
      }
    } else {
      next()
    }
  }
})

export default router
