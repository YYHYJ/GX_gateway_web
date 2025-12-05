/**
 * 封装axios请求
 * 原理：单例模式创建axios实例，统一处理请求响应
 */

import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,  // 从环境变量读取
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 请求发送前的处理
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 响应数据处理
    return response.data
  },
  error => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('未授权，请登录')
          // 可以跳转到登录页
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error('请求错误:', error.message)
      }
    }
    return Promise.reject(error)
  }
)

export default service
