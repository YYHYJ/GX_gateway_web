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
    component: () => import('@/views/datasense/DeviceModelConfig/DeviceModelConfig.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/data/device/modelConfig/:templateId/communication',
    name: 'CommunicationSpec',
    component: () => import('@/views/datasense/DeviceModelConfig/pages/CommunicationSpec.vue'),
    meta: {
      requiresAuth: true,
      title: '通信规约配置',
    },
    // 添加路由守卫，在进入前获取协议类型
    beforeEnter: async (to, from, next) => {
      try {
        const protocolType = to.query.protocol
        const templateId = to.params.templateId

        if (!protocolType || !templateId) {
          console.warn('缺少必要参数: protocolType 或 templateId')
        }

        next()
      } catch (error) {
        console.error('路由守卫错误:', error)
        next()
      }
    },
  },
  {
    path: '/data/device/instance',
    name: 'DeviceInstance',
    component: () => import('@/views/datasense/DeviceConfig/DeviceConfig.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/data/device/instance/monitor',
    name: 'Datamonitor',
    component: () => import('@/views/datasense/DeviceConfig/DataMonitor.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/data/device/instances/monitor',
    name: 'Datasmonitor',
    component: () => import('@/views/datasense/DeviceConfig/DatasMonitor.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/logs/system',
    name: 'SystemLog',
    component: () => import('@/views/log/SystemLog.vue'),
    meta: { requiresAuth: true, activeNav: 'log-system', activeSubItem: 'system-logs' },
  },
  {
    path: '/logs/operation',
    name: 'OperationLog',
    component: () => import('@/views/log/OperationLog.vue'),
    meta: { requiresAuth: true, activeNav: 'log-system', activeSubItem: 'operation-logs' },
  },
  {
    path: '/logs/communication',
    name: 'CommunicationLog',
    component: () => import('@/views/log/CommunicationLog.vue'),
    meta: { requiresAuth: true, activeNav: 'log-system', activeSubItem: 'communication-logs' },
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
