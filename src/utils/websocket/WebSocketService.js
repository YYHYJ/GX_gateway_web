/**
 * WebSocket 服务类
 * 这是一个单例类，整个应用只有一个实例
 */
import { eventBus } from './eventBus.js'
import {
  MessageType,
  WSEvent,
  WSStatusCode,
  ReconnectConfig,
  HeartbeatConfig,
} from './constants.js'

class WebSocketService {
  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance
    }

    this.ws = null
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.heartbeatTimeoutTimer = null

    this.subscribers = new Map()
    this.messageQueue = []
    this.isConnected = false
    this.isConnecting = false
    this.lastHeartbeatTime = null

    this.config = {
      url: import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? `wss://${window.location.host}/ws` : `ws://${window.location.host}/ws`),
      autoConnect: true,
      autoReconnect: true,
      maxQueueSize: 100,
      debug: true,
    }

    this.init()
    WebSocketService.instance = this
    return this
  }

  init() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected && !this.isConnecting) {
        this.connect()
      } else if (document.visibilityState === 'hidden') {
        this.clearHeartbeat()
      }
    })

    if (this.config.autoConnect) {
      this.connect()
    }
  }

  connect() {
    if (this.isConnecting || this.isConnected) return

    this.isConnecting = true
    console.log('[WebSocket] 正在连接...')

    try {
      this.ws = new WebSocket(this.config.url)
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
    } catch (error) {
      this.handleError(error)
    }
  }

  handleOpen(event) {
    this.isConnected = true
    this.isConnecting = false
    this.reconnectAttempts = 0

    console.log('[WebSocket] ✅ 连接成功')

    // 使用新的事件接口
    this.emit(WSEvent.CONNECTED, event)

    this.sendAuth()
    this.startHeartbeat()
    this.flushMessageQueue()

    // 延迟执行重新订阅，确保认证完成
    setTimeout(() => {
      this.resubscribeAll()
    }, 200)
  }

  handleMessage(event) {
    const receiveTime = Date.now()
    console.log(`[WebSocket] 📨 ${receiveTime} - 收到原始消息`)
    try {
      const data = JSON.parse(event.data)
      console.log('[WebSocket] 📨 收到消息:', data)

      if (data.type === MessageType.PONG) {
        this.handlePong()
        return
      }

      // 处理订阅响应
      if (data.type === 'subscribe_response') {
        console.log(`[WebSocket] 📋 订阅响应:`, {
          成功: data.success,
          消息: data.message,
          设备ID: data.device_id,
        })
        return
      }

      if (data.device_id !== undefined) {
        const deviceIdStr = String(data.device_id)

        console.log('[WebSocket] 🔍 查找设备订阅:', {
          原始ID: data.device_id,
          字符串ID: deviceIdStr,
          当前订阅列表: Array.from(this.subscribers.keys()),
          详情: Array.from(this.subscribers.entries()).map(
            ([id, callbacks]) => `${id}: ${callbacks.size}个回调`,
          ),
        })

        if (this.subscribers.has(deviceIdStr)) {
          const callbacks = this.subscribers.get(deviceIdStr)
          console.log(`[WebSocket] 🔄 ${Date.now()} - 执行 ${callbacks.size} 个回调`)

          callbacks.forEach((callback, index) => {
            try {
              console.log(`[WebSocket] 🔄 执行回调 ${index + 1}/${callbacks.size}`)
              callback(data)
            } catch (error) {
              console.error(`设备 ${deviceIdStr} 回调失败:`, error)
            }
          })
        } else {
          console.warn(`[WebSocket] ⚠️ 未找到设备订阅: ${deviceIdStr}`)
          console.warn(`[WebSocket] ℹ️ 可能原因：订阅消息还未发送或服务器提前返回数据`)
        }
      }

      this.emit(WSEvent.MESSAGE, data)
      if (data.type) {
        this.emit(`ws:message:${data.type}`, data)
      }
    } catch (error) {
      console.error('[WebSocket] 消息解析失败:', error)
      this.emit(WSEvent.ERROR, { type: 'parse_error', error })
    }
  }

  handlePong() {
    this.lastHeartbeatTime = Date.now()
    clearTimeout(this.heartbeatTimeoutTimer)
  }

  handleClose(event) {
    this.isConnected = false
    this.isConnecting = false
    console.log('[WebSocket] 连接关闭', event.code, event.reason)

    this.clearHeartbeat()
    this.emit(WSEvent.DISCONNECTED, event)

    if (
      event.code !== WSStatusCode.NORMAL_CLOSURE &&
      this.config.autoReconnect &&
      this.reconnectAttempts < ReconnectConfig.MAX_ATTEMPTS
    ) {
      this.scheduleReconnect()
    }
  }

  handleError(error) {
    this.isConnecting = false
    console.error('[WebSocket] 错误:', error)
    this.emit(WSEvent.ERROR, { type: 'connection_error', error })
  }

  send(message) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[WebSocket] 连接未就绪，消息入队:', message.type || message)
      this.queueMessage(message)
      return false
    }

    try {
      if (message.type === MessageType.SUBSCRIBE) {
        console.log('[WebSocket] 📤 发送订阅消息:', {
          设备ID: message.device_id,
          时间: new Date().toLocaleTimeString(),
          连接状态: '已连接',
        })
      }

      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('[WebSocket] 发送失败:', error)
      this.queueMessage(message)
      return false
    }
  }

  subscribe(deviceId, callback) {
    const deviceIdStr = String(deviceId)

    console.log('[WebSocket] 🎯 订阅请求:', {
      原始ID: deviceId,
      存储为: deviceIdStr,
      已有订阅: this.subscribers.has(deviceIdStr),
      连接状态: {
        isConnected: this.isConnected,
        isConnecting: this.isConnecting,
      },
    })

    if (!this.subscribers.has(deviceIdStr)) {
      this.subscribers.set(deviceIdStr, new Set())
    }

    const callbacks = this.subscribers.get(deviceIdStr)
    callbacks.add(callback)

    console.log(`[WebSocket] ✅ 本地订阅成功，设备: ${deviceIdStr}，订阅者: ${callbacks.size}`)

    // 如果已连接，立即发送订阅消息
    if (this.isConnected) {
      console.log(`[WebSocket] 🔗 已连接，立即发送订阅: ${deviceIdStr}`)
      this.ensureSubscribeMessage(deviceIdStr)
    } else {
      console.log(`[WebSocket] ⏳ 未连接，订阅将在连接成功后自动发送`)
      // 监听连接事件，连接成功后发送订阅
      const unsubscribe = this.on(WSEvent.CONNECTED, () => {
        setTimeout(() => {
          console.log(`[WebSocket] 🔗 连接成功，现在发送订阅: ${deviceIdStr}`)
          this.ensureSubscribeMessage(deviceIdStr)
          unsubscribe() // 只执行一次
        }, 300)
      })
    }

    return () => {
      this.unsubscribe(deviceIdStr, callback)
    }
  }

  ensureSubscribeMessage(deviceIdStr) {
    console.log(`[WebSocket] 📨 确保订阅消息发送: ${deviceIdStr}`)

    const sendSubscribe = () => {
      const success = this.send({
        type: MessageType.SUBSCRIBE,
        device_id: deviceIdStr,
        timestamp: Date.now(),
      })

      if (!success) {
        console.log(`[WebSocket] ⏳ 订阅消息入队，1秒后重试: ${deviceIdStr}`)
        setTimeout(() => sendSubscribe(), 1000)
      } else {
        console.log(`[WebSocket] ✅ 订阅消息已发送: ${deviceIdStr}`)
      }
    }

    sendSubscribe()

    // 3秒后再发送一次确认
    setTimeout(() => {
      if (this.isConnected) {
        this.send({
          type: MessageType.SUBSCRIBE,
          device_id: deviceIdStr,
          timestamp: Date.now(),
          confirm: true,
        })
        console.log(`[WebSocket] 🔁 发送订阅确认: ${deviceIdStr}`)
      }
    }, 3000)
  }

  unsubscribe(deviceId, callback) {
    const deviceIdStr = String(deviceId)
    if (!this.subscribers.has(deviceIdStr)) return

    const callbacks = this.subscribers.get(deviceIdStr)
    callbacks.delete(callback)

    if (callbacks.size === 0) {
      this.subscribers.delete(deviceIdStr)
      this.send({
        type: MessageType.UNSUBSCRIBE,
        device_id: deviceIdStr,
        timestamp: Date.now(),
      })
    }
  }

  resubscribeAll() {
    if (this.subscribers.size === 0) {
      console.log('[WebSocket] ℹ️ 没有需要重新订阅的设备')
      return
    }

    console.log(`[WebSocket] 🔄 重新订阅 ${this.subscribers.size} 个设备...`)

    this.subscribers.forEach((callbacks, deviceId) => {
      if (callbacks.size > 0) {
        console.log(`[WebSocket] 🔁 重订阅设备: ${deviceId} (${callbacks.size}个订阅者)`)
        this.send({
          type: MessageType.SUBSCRIBE,
          device_id: deviceId,
          timestamp: Date.now(),
          reconnect: true,
        })
      }
    })
  }

  disconnect() {
    console.log('[WebSocket] 手动断开连接')

    this.clearReconnect()
    this.clearHeartbeat()
    this.subscribers.clear()

    if (this.ws) {
      this.ws.close(WSStatusCode.NORMAL_CLOSURE, 'Manual disconnect')
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
  }

  reconnect() {
    this.disconnect()
    setTimeout(() => this.connect(), 1000)
  }

  scheduleReconnect() {
    this.clearReconnect()
    this.reconnectAttempts++

    const delay = Math.min(
      ReconnectConfig.MAX_INTERVAL,
      ReconnectConfig.BASE_INTERVAL *
        Math.pow(ReconnectConfig.BACKOFF_MULTIPLIER, this.reconnectAttempts - 1),
    )

    console.log(`[WebSocket] ⏰ 计划重连，第 ${this.reconnectAttempts} 次，延迟 ${delay}ms`)
    this.emit(WSEvent.RECONNECTING, { attempt: this.reconnectAttempts, delay })

    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  startHeartbeat() {
    if (!HeartbeatConfig.ENABLED) return

    this.clearHeartbeat()
    this.lastHeartbeatTime = Date.now()

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: MessageType.HEARTBEAT, timestamp: Date.now() })

        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.log('[WebSocket] 心跳超时，重连')
          this.reconnect()
        }, HeartbeatConfig.TIMEOUT)
      }
    }, HeartbeatConfig.INTERVAL)
  }

  sendAuth() {
    const token = localStorage.getItem('token')
    if (token) {
      this.send({ type: MessageType.AUTH, token, timestamp: Date.now() })
    }
  }

  queueMessage(message) {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      this.messageQueue.shift()
    }
    this.messageQueue.push({ message, timestamp: Date.now() })
  }

  flushMessageQueue() {
    if (this.messageQueue.length === 0) return

    console.log(`[WebSocket] 发送 ${this.messageQueue.length} 条队列消息`)
    while (this.messageQueue.length > 0) {
      const { message } = this.messageQueue.shift()
      this.send(message)
    }
  }

  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscribersCount: this.subscribers.size,
      queueSize: this.messageQueue.length,
      lastHeartbeatTime: this.lastHeartbeatTime,
    }
  }

  // ========== 事件接口 ==========

  on(event, callback) {
    return eventBus.on(event, callback)
  }

  off(event, callback) {
    eventBus.off(event, callback)
  }

  once(event, callback) {
    return eventBus.once(event, callback)
  }

  addEventListener(event, callback) {
    return this.on(event, callback)
  }

  removeEventListener(event, callback) {
    this.off(event, callback)
  }

  emit(event, data) {
    eventBus.emit(event, data)
  }
}

export const wsService = new WebSocketService()
