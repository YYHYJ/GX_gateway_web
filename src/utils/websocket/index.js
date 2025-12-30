/**
 * WebSocket 模块统一导出
 */

// 核心服务
export { wsService } from './WebSocketService.js'

// 事件总线
export { eventBus } from './eventBus.js'

// 常量
export * from './constants.js'

// 工具函数
// export * from './utils.js' // 如果有工具函数的话

/**
 * WebSocket Hook（Vue 3 Composition API）
 * 提供便捷的WebSocket使用方式
 */
import { ref, onUnmounted } from 'vue'
import { wsService } from './WebSocketService.js'
import { MessageType } from './constants.js'

/**
 * 使用WebSocket服务
 * @param {Object} options 配置选项
 * @returns {Object} WebSocket相关状态和方法
 */
export function useWebSocket(options = {}) {
  const {
    deviceId = null,
    autoSubscribe = true,
    onMessage = null,
    onConnected = null,
    onDisconnected = null,
    onError = null,
  } = options

  const isConnected = ref(wsService.isConnected)
  const lastMessage = ref(null)
  const error = ref(null)
  const unsubscribeFn = ref(null)

  // 连接状态监听
  const updateConnectionStatus = () => {
    isConnected.value = wsService.isConnected
  }

  // 消息处理
  const handleMessage = (data) => {
    lastMessage.value = data
    if (onMessage && typeof onMessage === 'function') {
      onMessage(data)
    }
  }

  // 连接事件处理
  const handleConnected = (event) => {
    updateConnectionStatus()
    if (onConnected && typeof onConnected === 'function') {
      onConnected(event)
    }
  }

  // 断开连接事件处理
  const handleDisconnected = (event) => {
    updateConnectionStatus()
    if (onDisconnected && typeof onDisconnected === 'function') {
      onDisconnected(event)
    }
  }

  // 错误处理
  const handleError = (err) => {
    error.value = err
    if (onError && typeof onError === 'function') {
      onError(err)
    }
  }

  // 订阅设备数据
  const subscribe = (id = deviceId) => {
    if (!id) {
      console.error('设备ID不能为空')
      return null
    }

    if (unsubscribeFn.value) {
      unsubscribeFn.value()
    }

    unsubscribeFn.value = wsService.subscribe(id, handleMessage)
    return unsubscribeFn.value
  }

  // 取消订阅
  const unsubscribe = () => {
    if (unsubscribeFn.value) {
      unsubscribeFn.value()
      unsubscribeFn.value = null
    }
  }

  // 发送消息
  const send = (message) => {
    return wsService.send(message)
  }

  // 发送心跳
  const sendHeartbeat = () => {
    return send({
      type: MessageType.HEARTBEAT,
      timestamp: Date.now(),
    })
  }

  // 发送订阅消息
  const sendSubscribe = (id = deviceId) => {
    return send({
      type: MessageType.SUBSCRIBE,
      device_id: id,
      timestamp: Date.now(),
    })
  }

  // 发送取消订阅消息
  const sendUnsubscribe = (id = deviceId) => {
    return send({
      type: MessageType.UNSUBSCRIBE,
      device_id: id,
      timestamp: Date.now(),
    })
  }

  // 手动连接
  const connect = () => {
    wsService.connect()
  }

  // 手动断开
  const disconnect = () => {
    wsService.disconnect()
  }

  // 重新连接
  const reconnect = () => {
    wsService.reconnect()
  }

  // 获取状态
  const getStatus = () => {
    return wsService.getStatus()
  }

  // 初始化
  const init = () => {
    // 监听连接事件
    wsService.on('ws:connected', handleConnected)
    wsService.on('ws:disconnected', handleDisconnected)
    wsService.on('ws:error', handleError)

    // 自动订阅
    if (autoSubscribe && deviceId) {
      subscribe(deviceId)
    }

    updateConnectionStatus()
  }

  // 清理
  const cleanup = () => {
    unsubscribe()
    wsService.off('ws:connected', handleConnected)
    wsService.off('ws:disconnected', handleDisconnected)
    wsService.off('ws:error', handleError)
  }

  // 初始化
  init()

  // 组件卸载时自动清理
  onUnmounted(cleanup)

  return {
    // 状态
    isConnected,
    lastMessage,
    error,

    // 方法
    subscribe,
    unsubscribe,
    send,
    sendHeartbeat,
    sendSubscribe,
    sendUnsubscribe,
    connect,
    disconnect,
    reconnect,
    getStatus,

    // 清理函数（可用于手动清理）
    cleanup,
  }
}

/**
 * 设备监控Hook
 * 专门用于设备数据监控
 */
export function useDeviceMonitor(deviceId) {
  const { isConnected, lastMessage, error, ...wsMethods } = useWebSocket({
    deviceId,
    autoSubscribe: true,
  })

  const deviceData = ref(null)
  const points = ref([])
  const lastUpdate = ref(null)

  // 处理设备数据
  const handleDeviceMessage = (data) => {
    if (data.device_id === String(deviceId)) {
      deviceData.value = data
      points.value = data.points || []
      lastUpdate.value = new Date().toISOString()
    }
  }

  // 获取数据点
  const getPoint = (pointCode) => {
    return points.value.find((point) => point.point_code === pointCode)
  }

  // 获取数据点值
  const getPointValue = (pointCode) => {
    const point = getPoint(pointCode)
    return point ? point.value : null
  }

  // 获取数据点原始值
  const getPointRawValue = (pointCode) => {
    const point = getPoint(pointCode)
    return point ? point.raw_value : null
  }

  return {
    // WebSocket状态
    isConnected,
    lastMessage,
    error,

    // 设备数据
    deviceData,
    points,
    lastUpdate,

    // 工具方法
    getPoint,
    getPointValue,
    getPointRawValue,

    // WebSocket方法
    ...wsMethods,
  }
}

// 默认导出wsService
export default wsService
