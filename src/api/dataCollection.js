/**
 * 数据采集相关API
 */
import request from '@/utils/request'

// ========== 协议管理 ==========
// 获取协议列表
export function getProtocols() {
  return request({
    url: '/api/data/protocols',
    method: 'get',
  })
}

// 获取协议类型
export function getProtocolTypes() {
  return request({
    url: '/api/protocol/types',
    method: 'get',
  })
}

// 获取协议配置
export function getProtocolConfig(protocolType, templateId) {
  return request({
    url: `/api/protocol/config/${protocolType}/${templateId}`,
    method: 'get',
  })
}

// 保存协议配置
export function saveProtocolConfig(protocolType, templateId, data) {
  return request({
    url: `/api/protocol/config/${protocolType}/${templateId}`,
    method: 'post',
    data,
  })
}

// 测试协议连接
export function testProtocolConnection(protocolType, config) {
  return request({
    url: `/api/protocol/test/${protocolType}`,
    method: 'post',
    data: config,
  })
}

// ========== 通信接口 ==========
// 获取通信接口列表
export function getCommunicationInterfaces() {
  return request({
    url: '/api/data/interfaces',
    method: 'get',
  })
}

// ========== 设备实例 ==========
// 获取设备实例列表
export function getDeviceInstances(params) {
  return request({
    url: '/api/data/instances',
    method: 'get',
    params,
  })
}

// ========== 采集调试 ==========
// 采集调试
export function debugCollection(data) {
  return request({
    url: '/api/data/debug',
    method: 'post',
    data,
  })
}
