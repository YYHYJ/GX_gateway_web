/**
 * API统一管理
 * 原理：集中管理所有接口，便于维护
 */

import request from '@/utils/request'

// 设备相关API
export const deviceApi = {
  // 获取设备列表
  getList(params) {
    return request({
      url: '/device/list',
      method: 'get',
      params
    })
  },

  // 创建设备
  create(data) {
    return request({
      url: '/device/create',
      method: 'post',
      data
    })
  },

  // 更新设备
  update(id, data) {
    return request({
      url: `/device/update/${id}`,
      method: 'put',
      data
    })
  },

  // 删除设备
  delete(id) {
    return request({
      url: `/device/delete/${id}`,
      method: 'delete'
    })
  }
}

// 网关配置API
export const gatewayApi = {
  getConfig() {
    return request({
      url: '/gateway/config',
      method: 'get'
    })
  },

  updateConfig(data) {
    return request({
      url: '/gateway/config',
      method: 'put',
      data
    })
  }
}

// 系统API
export const systemApi = {
  getStatus() {
    return request({
      url: '/system/status',
      method: 'get'
    })
  },

  restart() {
    return request({
      url: '/system/restart',
      method: 'post'
    })
  }
}

// 用户认证API
export const authApi = {
  login(data) {
    return request({
      url: '/auth/login',
      method: 'post',
      data
    })
  },

  logout() {
    return request({
      url: '/auth/logout',
      method: 'post'
    })
  },

  getUserInfo() {
    return request({
      url: '/auth/userinfo',
      method: 'get'
    })
  }
}

// 导出所有API
export default {
  device: deviceApi,
  gateway: gatewayApi,
  system: systemApi,
  auth: authApi
}
