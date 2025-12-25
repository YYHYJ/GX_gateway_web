// src/api/index.js

/**
 * API统一管理
 * 原理：集中管理所有接口，便于维护
 */

import request from '@/utils/request'

// 设备相关API
export const deviceApi = {
  // 获取设备模板列表
  getDeviceTemplates(params) {
    return request({
      url: '/device/templates',
      method: 'get',
      params,
    })
  },

  // 获取设备模板详情
  getDeviceTemplate(id) {
    return request({
      url: `/device/template/${id}`,
      method: 'get',
    })
  },

  // 创建设备模板
  createDeviceTemplate(data) {
    return request({
      url: '/device/template',
      method: 'post',
      data,
    })
  },

  // 更新设备模板
  updateDeviceTemplate(id, data) {
    return request({
      url: `/device/template/${id}`,
      method: 'put',
      data,
    })
  },

  // 删除设备模板
  deleteDeviceTemplate(id) {
    return request({
      url: `/device/template/${id}`,
      method: 'delete',
    })
  },

  // 获取Modbus点位数据（根据你的实际API）
  getModbusPoints(data) {
    return request({
      url: '/device/model_detail_modbus1',
      method: 'post',
      data,
    })
  },

  // 保存Modbus点位
  saveModbusPoint(data) {
    return request({
      url: '/device/save_modbus_point',
      method: 'post',
      data,
    })
  },

  // 删除Modbus点位
  deleteModbusPoint(id) {
    return request({
      url: `/device/delete_modbus_point/${id}`,
      method: 'delete',
    })
  },

  // 批量操作Modbus点位
  batchUpdateModbusPoints(data) {
    return request({
      url: '/device/batch_modbus_points',
      method: 'post',
      data,
    })
  },

  // 导入点表
  importPoints(data) {
    return request({
      url: '/device/import_points',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 导出点表
  exportPoints(params) {
    return request({
      url: '/device/export_points',
      method: 'get',
      params,
      responseType: 'blob',
    })
  },
}

// 协议相关API
export const protocolApi = {
  // 获取协议类型列表
  getProtocolTypes() {
    return request({
      url: '/protocol/types',
      method: 'get',
    })
  },

  // 获取协议配置
  getProtocolConfig(protocolType, templateId) {
    return request({
      url: `/protocol/config/${protocolType}/${templateId}`,
      method: 'get',
    })
  },

  // 保存协议配置
  saveProtocolConfig(protocolType, templateId, data) {
    return request({
      url: `/protocol/config/${protocolType}/${templateId}`,
      method: 'post',
      data,
    })
  },

  // 测试协议连接
  testProtocolConnection(protocolType, config) {
    return request({
      url: `/protocol/test/${protocolType}`,
      method: 'post',
      data: config,
    })
  },
}

// 数据采集API
export const dataCollectionApi = {
  // 协议总览
  getProtocols() {
    return request({
      url: '/data/protocols',
      method: 'get',
    })
  },

  // 通信接口
  getCommunicationInterfaces() {
    return request({
      url: '/data/interfaces',
      method: 'get',
    })
  },

  // 设备实例
  getDeviceInstances(params) {
    return request({
      url: '/data/instances',
      method: 'get',
      params,
    })
  },

  // 采集调试
  debugCollection(data) {
    return request({
      url: '/data/debug',
      method: 'post',
      data,
    })
  },
}

// 日志系统API
export const logApi = {
  // 系统日志
  getSystemLogs(params) {
    return request({
      url: '/api/logs/system',
      method: 'get',
      params,
    })
  },

  // 操作日志
  getOperationLogs(params) {
    return request({
      url: '/api/logs/operation',
      method: 'get',
      params,
    })
  },

  // 通信日志
  getCommunicationLogs(params) {
    return request({
      url: '/api/logs/communication',
      method: 'get',
      params,
    })
  },
}

// OTA升级API
export const otaApi = {
  // 检查更新
  checkUpdate() {
    return request({
      url: '/ota/check',
      method: 'get',
    })
  },

  // 开始升级
  startUpgrade(data) {
    return request({
      url: '/ota/upgrade',
      method: 'post',
      data,
    })
  },

  // 获取升级状态
  getUpgradeStatus() {
    return request({
      url: '/ota/status',
      method: 'get',
    })
  },
}

// 系统API
export const systemApi = {
  getStatus() {
    return request({
      url: '/system/status',
      method: 'get',
    })
  },

  restart() {
    return request({
      url: '/system/restart',
      method: 'post',
    })
  },

  // 系统设置
  getSettings() {
    return request({
      url: '/system/settings',
      method: 'get',
    })
  },

  updateSettings(data) {
    return request({
      url: '/system/settings',
      method: 'put',
      data,
    })
  },

  // 网络配置
  getNetworkConfig() {
    return request({
      url: '/system/network',
      method: 'get',
    })
  },

  updateNetworkConfig(data) {
    return request({
      url: '/system/network',
      method: 'put',
      data,
    })
  },

  // 用户管理
  getUsers(params) {
    return request({
      url: '/system/users',
      method: 'get',
      params,
    })
  },

  createUser(data) {
    return request({
      url: '/system/user',
      method: 'post',
      data,
    })
  },

  updateUser(id, data) {
    return request({
      url: `/system/user/${id}`,
      method: 'put',
      data,
    })
  },

  deleteUser(id) {
    return request({
      url: `/system/user/${id}`,
      method: 'delete',
    })
  },

  // 数据备份
  backupData() {
    return request({
      url: '/system/backup',
      method: 'post',
    })
  },

  restoreData(data) {
    return request({
      url: '/system/restore',
      method: 'post',
      data,
    })
  },
}

// 用户认证API
export const authApi = {
  login(data) {
    return request({
      url: '/auth/login',
      method: 'post',
      data,
    })
  },

  logout() {
    return request({
      url: '/auth/logout',
      method: 'post',
    })
  },

  getUserInfo() {
    return request({
      url: '/auth/userinfo',
      method: 'get',
    })
  },
}

// 导出所有API
export default {
  device: deviceApi,
  protocol: protocolApi,
  dataCollection: dataCollectionApi,
  log: logApi,
  ota: otaApi,
  system: systemApi,
  auth: authApi,
}
