/**
 * 封装axios请求
 * 原理：单例模式创建axios实例，统一处理请求响应
 */

import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 从环境变量读取
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 请求发送前的处理
    console.log('🔵 发送请求:', config.method?.toUpperCase(), config.url)

    // 先注释掉token逻辑
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    console.log('✅ 请求成功:', response.config.url)
    return response.data
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response) {
      // 服务器有响应，但状态码不是2xx
      console.error('❌ 响应错误:', {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        url: error.config?.url,
      })

      switch (error.response.status) {
        case 400:
          return Promise.reject(new Error('请求参数错误'))
        case 401:
          // Token过期或无效（登录接口的401由调用方自行处理）
          if (error.config?.url !== '/api/auth/login') {
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            window.location.href = '/'
          }
          return Promise.reject(new Error('登录已过期，请重新登录'))
        case 403:
          return Promise.reject(new Error('没有权限访问'))
        case 404:
          return Promise.reject(new Error('请求的资源不存在'))
        case 500:
          return Promise.reject(new Error('服务器内部错误'))
        default:
          return Promise.reject(new Error(`请求失败: ${error.response.status}`))
      }
    } else if (error.request) {
      // 请求已发送，但没有收到响应
      console.error('网络错误:', error.message)
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    } else {
      // 请求设置错误
      console.error('请求配置错误:', error.message)
      return Promise.reject(new Error('请求配置错误: ' + error.message))
    }
  },
)

export default service
