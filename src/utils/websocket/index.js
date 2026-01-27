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
import { ref, onUnmounted, watch } from 'vue'
import { wsService } from './WebSocketService.js'
import { MessageType, WSEvent } from './constants.js'

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
  const eventUnsubscribers = ref([])

  // 连接状态监听
  const updateConnectionStatus = () => {
    isConnected.value = wsService.isConnected
  }

  // 消息处理
  const handleMessage = (data) => {
    console.log(`[useWebSocket] 收到消息:`, data)
    lastMessage.value = data
    if (onMessage && typeof onMessage === 'function') {
      onMessage(data)
    }
  }

  // 连接事件处理
  const handleConnected = (event) => {
    console.log('[useWebSocket] 连接成功')
    updateConnectionStatus()
    if (onConnected && typeof onConnected === 'function') {
      onConnected(event)
    }
  }

  // 断开连接事件处理
  const handleDisconnected = (event) => {
    console.log('[useWebSocket] 连接断开')
    updateConnectionStatus()
    if (onDisconnected && typeof onDisconnected === 'function') {
      onDisconnected(event)
    }
  }

  // 错误处理
  const handleError = (err) => {
    console.log('[useWebSocket] 发生错误:', err)
    error.value = err
    if (onError && typeof onError === 'function') {
      onError(err)
    }
  }

  // 订阅设备数据
  const subscribe = (id = deviceId) => {
    if (!id) {
      console.error('[useWebSocket] 设备ID不能为空')
      return null
    }

    console.log(`[useWebSocket] 订阅设备: ${id}`, {
      当前连接状态: wsService.isConnected,
    })

    if (unsubscribeFn.value) {
      unsubscribeFn.value()
      unsubscribeFn.value = null
    }

    // 创建新的回调函数
    const messageCallback = (data) => {
      console.log(`[useWebSocket] 执行设备 ${id} 的回调:`, data)
      handleMessage(data)
    }

    unsubscribeFn.value = wsService.subscribe(id, messageCallback)

    console.log(`[useWebSocket] ✅ 订阅完成，返回清理函数`)
    return unsubscribeFn.value
  }

  // 取消订阅
  const unsubscribe = () => {
    if (unsubscribeFn.value) {
      console.log('[useWebSocket] 取消订阅')
      unsubscribeFn.value()
      unsubscribeFn.value = null
    }
  }

  // 发送消息
  const send = (message) => {
    const result = wsService.send(message)
    console.log(`[useWebSocket] 发送消息:`, message, result ? '✅ 成功' : '❌ 失败')
    return result
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
    console.log('[useWebSocket] 手动连接')
    wsService.connect()
  }

  // 手动断开
  const disconnect = () => {
    console.log('[useWebSocket] 手动断开')
    wsService.disconnect()
  }

  // 重新连接
  const reconnect = () => {
    console.log('[useWebSocket] 重新连接')
    wsService.reconnect()
  }

  // 获取状态
  const getStatus = () => {
    return wsService.getStatus()
  }

  // 初始化事件监听
  const initEventListeners = () => {
    // 清理旧的事件监听
    cleanupEventListeners()

    // 监听连接状态变化
    const connectedUnsubscribe = wsService.on(WSEvent.CONNECTED, handleConnected)
    const disconnectedUnsubscribe = wsService.on(WSEvent.DISCONNECTED, handleDisconnected)
    const errorUnsubscribe = wsService.on(WSEvent.ERROR, handleError)

    eventUnsubscribers.value = [connectedUnsubscribe, disconnectedUnsubscribe, errorUnsubscribe]

    console.log('[useWebSocket] 事件监听已设置')
  }

  // 清理事件监听
  const cleanupEventListeners = () => {
    eventUnsubscribers.value.forEach((unsubscribe) => unsubscribe())
    eventUnsubscribers.value = []
  }

  // 初始化
  const init = () => {
    console.log('[useWebSocket] 初始化', { deviceId, autoSubscribe })

    // 设置事件监听
    initEventListeners()

    // 更新连接状态
    updateConnectionStatus()

    // 自动订阅逻辑
    if (autoSubscribe && deviceId) {
      if (wsService.isConnected) {
        // 如果已连接，等待一小段时间后订阅（确保认证完成）
        setTimeout(() => {
          subscribe(deviceId)
        }, 500)
      } else {
        // 如果未连接，监听连接事件，连接成功后再订阅
        const unsubscribe = wsService.on(WSEvent.CONNECTED, () => {
          console.log(`[useWebSocket] 连接成功，现在订阅设备: ${deviceId}`)
          setTimeout(() => {
            subscribe(deviceId)
            unsubscribe() // 只执行一次
          }, 500)
        })
        eventUnsubscribers.value.push(unsubscribe)
      }
    }
  }

  // 清理
  const cleanup = () => {
    console.log('[useWebSocket] 清理')
    unsubscribe()
    cleanupEventListeners()
  }

  // 监听连接状态变化，自动处理订阅
  watch(isConnected, (newVal) => {
    console.log(`[useWebSocket] 连接状态变化: ${newVal}`)
    if (newVal && autoSubscribe && deviceId) {
      // 连接成功时自动订阅
      setTimeout(() => {
        subscribe(deviceId)
      }, 500)
    }
  })

  // 初始化
  init()

  // 组件卸载时自动清理
  onUnmounted(() => {
    console.log('[useWebSocket] 组件卸载，执行清理')
    cleanup()
  })

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
  const deviceData = ref(null)
  const points = ref([])
  const lastUpdate = ref(null)

  // 自定义消息处理器
  const handleDeviceMessage = (data) => {
    if (data.device_id === String(deviceId)) {
      console.log(`[useDeviceMonitor] 收到设备 ${deviceId} 数据`)
      deviceData.value = data
      points.value = data.points || []
      lastUpdate.value = new Date().toISOString()
    }
  }

  const { isConnected, lastMessage, error, ...wsMethods } = useWebSocket({
    deviceId,
    autoSubscribe: true,
    onMessage: handleDeviceMessage,
  })

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
