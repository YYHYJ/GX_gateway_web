/**
 * 时间设置相关 API
 *
 * 共 3 个接口：
 * 1. GET  /api/system/time      获取系统时间（供时钟显示）
 * 2. GET  /api/system/ntp       获取时间配置（时区+NTP/手动）
 *    POST /api/system/ntp       保存时间配置（时区+NTP/手动，一次提交）
 * 3. POST /api/system/ntp/sync  立即触发NTP同步
 */
import request from '@/utils/request'

// 获取系统时间与时区
// 返回: { datetime: "2025-01-15T14:32:08+08:00", timezone: "Asia/Shanghai (UTC+8)" }
export function getTimeInfo() {
  return request({
    url: '/api/system/time',
    method: 'get',
  })
}

// 获取时间配置
// 返回: { syncMode, timezone, server1, server2, interval }
export function getNtpConfig() {
  return request({
    url: '/api/system/ntp',
    method: 'get',
  })
}

// 保存时间配置（统一接口，一次提交所有配置）
// NTP模式: { syncMode: "ntp", timezone, server1, server2, interval }
// 手动模式: { syncMode: "manual", timezone, datetime: "2025-01-15T14:32:08" }
export function saveNtpConfig(data) {
  return request({
    url: '/api/system/ntp',
    method: 'post',
    data,
  })
}

