/**
 * WebSocket 常量定义
 */

// WebSocket 消息类型
export const MessageType = {
  // 客户端发送给服务器的消息类型
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  HEARTBEAT: 'heartbeat',
  AUTH: 'auth',

  // 服务器发送给客户端的消息类型
  DEVICE_DATA: 'device_data', // 设备数据
  CONNECTION_ACK: 'connection_ack', // 连接确认
  ERROR: 'error', // 错误消息
  PONG: 'pong', // 心跳响应
}

// WebSocket 事件名称
export const WSEvent = {
  CONNECTED: 'ws:connected',
  DISCONNECTED: 'ws:disconnected',
  ERROR: 'ws:error',
  MESSAGE: 'ws:message',
  RECONNECTING: 'ws:reconnecting',
  RECONNECT_FAILED: 'ws:reconnect_failed',
}

// WebSocket 状态码
export const WSStatusCode = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RECEIVED: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MISSING_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
}

// 重连配置
export const ReconnectConfig = {
  MAX_ATTEMPTS: 10,
  BASE_INTERVAL: 1000,
  MAX_INTERVAL: 1000,
  BACKOFF_MULTIPLIER: 1.5,
}

// 心跳配置
export const HeartbeatConfig = {
  INTERVAL: 30000, // 30秒
  TIMEOUT: 10000, // 10秒超时
  ENABLED: false,
}

// 数据点类型
export const PointType = {
  INT16: 'int16',
  UINT16: 'uint16',
  INT32: 'int32',
  UINT32: 'uint32',
  FLOAT: 'float',
  DOUBLE: 'double',
  BIT: 'bit',
  STRING: 'string',
  BOOL: 'bool',
}

// 数据质量
export const DataQuality = {
  GOOD: 'good',
  BAD: 'bad',
  UNCERTAIN: 'uncertain',
  UNKNOWN: 'unknown',
}
