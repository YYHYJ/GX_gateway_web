/**
 * 日志相关API
 */
import request from '@/utils/request'

// 获取系统日志
export function getSystemLogs(params) {
  return request({
    url: '/api/logs/system',
    method: 'get',
    params,
  })
}

// 获取操作日志
export function getOperationLogs(params) {
  return request({
    url: '/api/logs/operation',
    method: 'get',
    params,
  })
}

// 获取通信日志
export function getCommunicationLogs(params) {
  return request({
    url: '/api/logs/communication',
    method: 'get',
    params,
  })
}
