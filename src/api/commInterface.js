/**
 * 通信接口相关API（CommunicationInterface 页面）
 */
import request from '@/utils/request'

// ========== Serial ==========

export function getSerialInterfaces() {
  return request({ url: '/api/interfaces/serial', method: 'get' })
}

export function updateSerialInterface(data) {
  return request({ url: '/api/interfaces/serial', method: 'put', data })
}

// ========== CAN ==========

export function getCanInterfaces() {
  return request({ url: '/api/interfaces/can', method: 'get' })
}

export function updateCanInterface(data) {
  return request({ url: '/api/interfaces/can', method: 'put', data })
}

// ========== GPIO ==========

export function getGpioStatus() {
  return request({ url: '/api/interfaces/gpio', method: 'get' })
}

export function updateGpioLevel(data) {
  return request({ url: '/api/interfaces/gpio/level', method: 'put', data })
}

export function updateGpioAlias(data) {
  return request({ url: '/api/interfaces/gpio/alias', method: 'put', data })
}
