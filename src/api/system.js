/**
 * 系统相关API
 */
import request from '@/utils/request'

// ========== 系统信息 ==========
// 获取系统信息
export function getSystemInfo() {
  return request({
    url: '/api/system/info',
    method: 'get',
  })
}

// 获取系统状态
export function getSystemStatus() {
  return request({
    url: '/api/system/status',
    method: 'get',
  })
}

// 重启系统
export function restartSystem() {
  return request({
    url: '/api/system/restart',
    method: 'post',
  })
}

// ========== 系统设置 ==========
// 获取系统设置
export function getSettings() {
  return request({
    url: '/api/system/settings',
    method: 'get',
  })
}

// 更新系统设置
export function updateSettings(data) {
  return request({
    url: '/api/system/settings',
    method: 'put',
    data,
  })
}

// ========== 用户管理 ==========
// 获取用户列表
export function getUsers(params) {
  return request({
    url: '/api/system/users',
    method: 'get',
    params,
  })
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/api/system/user',
    method: 'post',
    data,
  })
}

// 更新用户
export function updateUser(id, data) {
  return request({
    url: `/api/system/user/${id}`,
    method: 'put',
    data,
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/api/system/user/${id}`,
    method: 'delete',
  })
}

// ========== 数据备份 ==========
// 备份数据
export function backupData() {
  return request({
    url: '/api/system/backup',
    method: 'post',
  })
}

// 恢复数据
export function restoreData(data) {
  return request({
    url: '/api/system/restore',
    method: 'post',
    data,
  })
}
