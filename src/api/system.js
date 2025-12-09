import request from '@/utils/request'

/**
 * 获取系统信息
 * @returns {Promise} 返回Promise对象
 */
export function getSystemInfo() {
  return request({
    url: '/api/system/info',
    method: 'get',
  })
}

/**
 * 获取硬件资源信息
 * @returns {Promise} 返回Promise对象
 */
export function getHardwareInfo() {
  return request({
    url: '/api/system/status',
    method: 'get',
  })
}

/**
 * 获取网络状态信息
 * @returns {Promise} 返回Promise对象
 */
export function getSystemStatus() {
  return request({
    url: '/api/system/status',
    method: 'get',
  })
}

export default {
  getSystemInfo,
  getSystemStatus,
  // getNetworkInfo,
}
