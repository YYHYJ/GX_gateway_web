/**
 * OTA升级相关API
 */
import request from '@/utils/request'

// 检查更新
export function checkUpdate() {
  return request({
    url: '/api/ota/check',
    method: 'get',
  })
}

// 开始升级
export function startUpgrade(data) {
  return request({
    url: '/api/ota/upgrade',
    method: 'post',
    data,
  })
}

// 获取升级状态
export function getUpgradeStatus() {
  return request({
    url: '/api/ota/status',
    method: 'get',
  })
}
