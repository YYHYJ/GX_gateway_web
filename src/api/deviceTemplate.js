/**
 * 设备模板相关API
 */
import request from '@/utils/request'

// ========== 设备模板管理 ==========
// 获取所有设备模板
export function getDeviceTemplates() {
  return request({
    url: '/api/device/modelConfig',
    method: 'get',
  })
}

// 根据ID获取单个模板
export function getDeviceTemplate(id) {
  return request({
    url: `/api/device/modelConfig/${id}`,
    method: 'get',
  })
}

// 创建模板
export function createDeviceTemplate(data) {
  return request({
    url: '/api/device/modelConfig',
    method: 'post',
    data,
  })
}

// 更新模板
export function updateDeviceTemplate(id, data) {
  return request({
    url: `/api/device/modelConfig/${id}`,
    method: 'put',
    data,
  })
}

// 删除模板
export function deleteDeviceTemplate(id) {
  return request({
    url: `/api/device/modelConfig/${id}`,
    method: 'delete',
  })
}

// ========== Modbus点位管理 ==========
// 获取Modbus点位数据
export function getModbusPoints(data) {
  return request({
    url: '/api/device/modbus/points',
    method: 'post',
    data,
  })
}

// 保存Modbus点位
export function saveModbusPoint(data) {
  return request({
    url: '/api/device/modbus/point',
    method: 'post',
    data,
  })
}

// 删除Modbus点位
export function deleteModbusPoint(id) {
  return request({
    url: `/api/device/modbus/point/${id}`,
    method: 'delete',
  })
}

// 批量更新Modbus点位
export function batchUpdateModbusPoints(data) {
  return request({
    url: '/api/device/modbus/points/batch',
    method: 'post',
    data,
  })
}

// ========== 点表导入导出 ==========
// 导入点表
export function importPoints(data) {
  return request({
    url: '/api/device/points/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 导出点表
export function exportPoints(params) {
  return request({
    url: '/api/device/points/export',
    method: 'get',
    params,
    responseType: 'blob',
  })
}
