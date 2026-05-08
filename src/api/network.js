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

// 获取 VPN 配置
export function getVpnConfig() {
  return request({ url: '/api/vpn/config', method: 'get' })
}

// 更新 VPN 配置
export function updateVpnConfig(data) {
  return request({ url: '/api/vpn/config', method: 'post', data })
}

// 获取 VPN 连接状态
export function getVpnStatus() {
  return request({ url: '/api/vpn/status', method: 'get' })
}

// 启动 VPN
export function startVpn() {
  return request({ url: '/api/vpn/start', method: 'post' })
}

// 停止 VPN
export function stopVpn() {
  return request({ url: '/api/vpn/stop', method: 'post' })
}

// 重启 VPN
export function restartVpn() {
  return request({ url: '/api/vpn/restart', method: 'post' })
}
