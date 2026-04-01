/**
 * 网络配置相关API（NetworkConfig 页面）
 */
import request from '@/utils/request'

// ========== 网口 ==========

// 获取所有网口列表（含状态、当前IP、配置等）
export function getInterfaces() {
  return request({ url: '/api/network/interfaces', method: 'get' })
}

// 保存单个网口配置（DHCP/静态IP，name 在 body 中）
export function updateInterface(data) {
  return request({ url: '/api/network/interfaces', method: 'put', data })
}

// ========== 静态路由 ==========

// 获取路由列表（含默认路由）
export function getRoutes() {
  return request({ url: '/api/network/routes', method: 'get' })
}

// 新增静态路由
export function addRoute(data) {
  return request({ url: '/api/network/routes', method: 'post', data })
}

// 更新静态路由（用 destination+netmask 定位）
export function updateRoute(data) {
  return request({ url: '/api/network/routes', method: 'put', data })
}

// 删除静态路由（用 destination+netmask 定位）
export function deleteRoute(data) {
  return request({ url: '/api/network/routes', method: 'delete', data })
}

// 更新默认路由
export function updateDefaultRoute(data) {
  return request({ url: '/api/network/routes/default', method: 'put', data })
}

// ========== VPN ==========

// 获取 VPN 配置及连接状态
export function getVpnConfig() {
  return request({ url: '/api/network/vpn', method: 'get' })
}

// 保存 VPN 配置
export function updateVpnConfig(data) {
  return request({ url: '/api/network/vpn', method: 'put', data })
}

// VPN 连接/断开
export function vpnConnect(action) {
  return request({ url: '/api/network/vpn/connection', method: 'post', data: { action } })
}
