/**
 * WebSocket 服务类 - 修复版
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

    // 订阅管理器 - 使用字符串作为key
    this.subscribers = new Map()

    this.messageQueue = []
    this.isConnected = false
    this.isConnecting = false
    this.lastHeartbeatTime = null

    // 配置
    this.config = {
      url: import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`,
      autoConnect: true,
      autoReconnect: true,
      maxQueueSize: 100,
      debug: true, // 强制开启调试
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
    eventBus.emit(WSEvent.CONNECTED, event)

    // 发送认证
    this.sendAuth()

    // 启动心跳
    this.startHeartbeat()

    // 发送队列消息
    this.flushMessageQueue()

    // 重新订阅（连接成功后立即执行）
    this.resubscribeAll()
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data)
      console.log('[WebSocket] 📨 收到消息:', data)

      // 处理心跳
      if (data.type === MessageType.PONG) {
        this.handlePong(data)
        return
      }

      // 处理设备数据 - 关键修复：统一使用字符串匹配
      if (data.device_id !== undefined) {
        const deviceIdStr = String(data.device_id)

        console.log('[WebSocket] 🔍 查找设备订阅:', {
          原始ID: data.device_id,
          字符串ID: deviceIdStr,
          当前订阅列表: Array.from(this.subscribers.keys()),
        })

        if (this.subscribers.has(deviceIdStr)) {
          const callbacks = this.subscribers.get(deviceIdStr)
          console.log(`[WebSocket] ✅ 找到 ${callbacks.size} 个订阅者`)

          callbacks.forEach((callback) => {
            try {
              callback(data)
            } catch (error) {
              console.error(`设备 ${deviceIdStr} 回调失败:`, error)
            }
          })
        } else {
          console.warn(`[WebSocket] ⚠️ 未找到设备订阅: ${deviceIdStr}`)
        }
      }

      // 全局事件
      eventBus.emit(WSEvent.MESSAGE, data)
      if (data.type) {
        eventBus.emit(`ws:message:${data.type}`, data)
      }
    } catch (error) {
      console.error('[WebSocket] 消息解析失败:', error)
      eventBus.emit(WSEvent.ERROR, { type: 'parse_error', error })
    }
  }

  handlePong(data) {
    this.lastHeartbeatTime = Date.now()
    clearTimeout(this.heartbeatTimeoutTimer)
  }

  handleClose(event) {
    this.isConnected = false
    this.isConnecting = false
    console.log('[WebSocket] 连接关闭', event.code, event.reason)

    this.clearHeartbeat()
    eventBus.emit(WSEvent.DISCONNECTED, event)

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
    eventBus.emit(WSEvent.ERROR, { type: 'connection_error', error })
  }

  send(message) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[WebSocket] 连接未就绪，消息入队:', message.type || message)
      this.queueMessage(message)
      return false
    }

    try {
      // 特殊处理订阅消息
      if (message.type === MessageType.SUBSCRIBE) {
        console.log('[WebSocket] 📤 发送订阅消息:', {
          设备ID: message.device_id,
          时间: new Date().toLocaleTimeString(),
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

  // 核心修复：确保订阅一定成功
  subscribe(deviceId, callback) {
    const deviceIdStr = String(deviceId)

    console.log('[WebSocket] 🎯 订阅请求:', {
      原始ID: deviceId,
      存储为: deviceIdStr,
      已有订阅: this.subscribers.has(deviceIdStr),
    })

    if (!this.subscribers.has(deviceIdStr)) {
      this.subscribers.set(deviceIdStr, new Set())
    }

    const callbacks = this.subscribers.get(deviceIdStr)
    callbacks.add(callback)

    console.log(`[WebSocket] ✅ 订阅成功，设备: ${deviceIdStr}，订阅者: ${callbacks.size}`)

    // 立即发送订阅消息，并确保发送成功
    this.ensureSubscribeMessage(deviceIdStr)

    return () => {
      this.unsubscribe(deviceIdStr, callback)
    }
  }

  // 确保订阅消息发送成功
  ensureSubscribeMessage(deviceIdStr) {
    const sendSubscribe = () => {
      const success = this.send({
        type: MessageType.SUBSCRIBE,
        device_id: deviceIdStr,
        timestamp: Date.now(),
      })

      if (!success) {
        console.log(`[WebSocket] ⏳ 订阅消息入队，1秒后重试: ${deviceIdStr}`)
        setTimeout(() => sendSubscribe(), 1000)
      }
    }

    sendSubscribe()

    // 3秒后再发送一次，确保后端收到
    setTimeout(() => {
      this.send({
        type: MessageType.SUBSCRIBE,
        device_id: deviceIdStr,
        timestamp: Date.now(),
        confirm: true,
      })
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

  // 重连时重新订阅
  resubscribeAll() {
    if (this.subscribers.size === 0) return

    console.log(`[WebSocket] 🔄 重新订阅 ${this.subscribers.size} 个设备...`)

    this.subscribers.forEach((callbacks, deviceId) => {
      if (callbacks.size > 0) {
        // 给每个设备发送订阅消息
        this.send({
          type: MessageType.SUBSCRIBE,
          device_id: deviceId,
          timestamp: Date.now(),
          reconnect: true,
        })
        console.log(`[WebSocket] 🔁 重订阅设备: ${deviceId}`)
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
    eventBus.emit(WSEvent.RECONNECTING, { attempt: this.reconnectAttempts, delay })

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
}

export const wsService = new WebSocketService()
