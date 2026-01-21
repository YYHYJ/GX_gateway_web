// src/views/transform/mqtt/mqttDataFormatter.js

/**
 * MQTT数据格式转换工具
 * 用于前后端JSON数据格式的转换
 * 对应后端数据库结构：
 * - mqtt_brokers表：存储MQTT broker连接配置
 * - mqtt_topics表：存储topic配置，direction字段区分发布/订阅
 */

// ==================== 数据库字段映射常量 ====================
export const DB_FIELDS = {
  // mqtt_brokers表字段
  BROKERS: {
    ID: 'id',
    BROKER_INDEX: 'broker_index',
    BROKER_NAME: 'broker_name',
    ENABLED: 'enabled',
    BROKER_HOST: 'broker_host',
    BROKER_PORT: 'broker_port',
    CLIENT_ID: 'client_id',
    USERNAME: 'username',
    PASSWORD: 'password',
    QOS_LEVEL: 'qos_level',
    KEEPALIVE_INTERVAL: 'keepalive_interval',
    CLEAN_SESSION: 'clean_session',
    AUTO_RECONNECT: 'auto_reconnect',
    RECONNECT_INTERVAL: 'reconnect_interval',
    MAX_INFLIGHT_MESSAGES: 'max_inflight_messages',
    TOPIC_PREFIX: 'topic_prefix',
    NETWORK_INTERFACE: 'network_interface',
    BIND_ADDRESS: 'bind_address',
    DNS_SERVERS: 'dns_servers',
    CONNECTION_TIMEOUT: 'connection_timeout',
    TLS_ENABLED: 'tls_enabled',
    CA_CERT_PATH: 'ca_cert_path',
    CLIENT_CERT_PATH: 'client_cert_path',
    CLIENT_KEY_PATH: 'client_key_path',
  },

  // mqtt_topics表字段
  TOPICS: {
    ID: 'id',
    BROKER_ID: 'broker_id',
    TOPIC_NAME: 'topic_name',
    DIRECTION: 'direction', // 0:发布, 1:订阅
    QOS: 'qos',
    ENABLED: 'enabled',
    DESCRIPTION: 'description',
    CREATED_AT: 'created_at',
  },
}

// Topic方向常量
export const TOPIC_DIRECTION = {
  PUBLISH: 0,
  SUBSCRIBE: 1,
}

// ==================== 数据转换函数 ====================

/**
 * 将后端数据库格式转换为前端使用的格式
 * @param {Array} brokersData - 后端返回的brokers数据
 * @param {Array} topicsData - 后端返回的topics数据
 * @returns {Array} 前端使用的connections格式
 */
export function formatDbToFrontend(brokersData = [], topicsData = []) {
  if (!Array.isArray(brokersData) || !Array.isArray(topicsData)) {
    console.warn('formatDbToFrontend: 参数类型错误，返回空数组')
    return []
  }

  return brokersData.map((broker) => {
    // 过滤出该broker的所有topics
    const brokerTopics = topicsData.filter(
      (topic) => topic[DB_FIELDS.TOPICS.BROKER_ID] === broker[DB_FIELDS.BROKERS.ID],
    )

    // 将topics按direction分组
    const publishTopics = brokerTopics
      .filter((topic) => topic[DB_FIELDS.TOPICS.DIRECTION] === TOPIC_DIRECTION.PUBLISH)
      .map((topic) => ({
        id: topic[DB_FIELDS.TOPICS.ID],
        type: 'publish',
        topic: topic[DB_FIELDS.TOPICS.TOPIC_NAME],
        qos: topic[DB_FIELDS.TOPICS.QOS] || 1,
        retain: false,
        enabled: Boolean(topic[DB_FIELDS.TOPICS.ENABLED]),
        description: topic[DB_FIELDS.TOPICS.DESCRIPTION] || '',
      }))

    const subscribeTopics = brokerTopics
      .filter((topic) => topic[DB_FIELDS.TOPICS.DIRECTION] === TOPIC_DIRECTION.SUBSCRIBE)
      .map((topic) => ({
        id: topic[DB_FIELDS.TOPICS.ID],
        type: 'subscribe',
        topic: topic[DB_FIELDS.TOPICS.TOPIC_NAME],
        qos: topic[DB_FIELDS.TOPICS.QOS] || 1,
        enabled: Boolean(topic[DB_FIELDS.TOPICS.ENABLED]),
        description: topic[DB_FIELDS.TOPICS.DESCRIPTION] || '',
      }))

    // 构建前端需要的connection对象
    return {
      id: broker[DB_FIELDS.BROKERS.ID],
      brokerName: broker[DB_FIELDS.BROKERS.BROKER_NAME] || '',
      enabled: Boolean(broker[DB_FIELDS.BROKERS.ENABLED]),
      status: broker.enabled ? '未连接' : '已禁用',
      lastActivity: '',

      // 基础连接配置（前端格式）
      basic: {
        enabled: Boolean(broker[DB_FIELDS.BROKERS.ENABLED]),
        brokerName: broker[DB_FIELDS.BROKERS.BROKER_NAME] || '', // 新增
        brokerHost: broker[DB_FIELDS.BROKERS.BROKER_HOST] || 'localhost',
        brokerPort: broker[DB_FIELDS.BROKERS.BROKER_PORT] || 1883,
        clientId: broker[DB_FIELDS.BROKERS.CLIENT_ID] || 'gateway_001',
        keepaliveInterval: broker[DB_FIELDS.BROKERS.KEEPALIVE_INTERVAL] || 60,
        connectionTimeout: broker[DB_FIELDS.BROKERS.CONNECTION_TIMEOUT] || 30,
        cleanSession: Boolean(broker[DB_FIELDS.BROKERS.CLEAN_SESSION]),
        qosLevel: broker[DB_FIELDS.BROKERS.QOS_LEVEL] || 1,
        // TLS相关字段
        tlsEnabled: Boolean(broker[DB_FIELDS.BROKERS.TLS_ENABLED]),
        twoWayAuth: !!(
          broker[DB_FIELDS.BROKERS.CLIENT_CERT_PATH] && broker[DB_FIELDS.BROKERS.CLIENT_KEY_PATH]
        ),
      },

      // 认证配置
      auth: {
        authType: broker[DB_FIELDS.BROKERS.USERNAME] ? 'password' : 'none',
        username: broker[DB_FIELDS.BROKERS.USERNAME] || '',
        password: broker[DB_FIELDS.BROKERS.PASSWORD] || '',
        caCert: broker[DB_FIELDS.BROKERS.CA_CERT_PATH] || '',
        clientCert: broker[DB_FIELDS.BROKERS.CLIENT_CERT_PATH] || '',
        clientKey: broker[DB_FIELDS.BROKERS.CLIENT_KEY_PATH] || '',
      },

      // 主题配置
      topics: {
        enablePublish: publishTopics.length > 0,
        enableSubscribe: subscribeTopics.length > 0,
        topics: [...publishTopics, ...subscribeTopics],
      },

      // 高级配置
      advanced: {
        autoReconnect: Boolean(broker[DB_FIELDS.BROKERS.AUTO_RECONNECT]),
        reconnectInterval: broker[DB_FIELDS.BROKERS.RECONNECT_INTERVAL] || 5,
        maxReconnectTimes: 10,
        maxInflightMessages: broker[DB_FIELDS.BROKERS.MAX_INFLIGHT_MESSAGES] || 20,
        topicPrefix: broker[DB_FIELDS.BROKERS.TOPIC_PREFIX] || '',
        networkInterface: broker[DB_FIELDS.BROKERS.NETWORK_INTERFACE] || '',
        bindAddress: broker[DB_FIELDS.BROKERS.BIND_ADDRESS] || '',
        dnsServers: broker[DB_FIELDS.BROKERS.DNS_SERVERS] || '',
      },
    }
  })
}

/**
 * 将前端格式转换为后端API期望的格式
 * 重要：这里生成的是后端create_mqtt_broker_config_handle函数期望的JSON
 * @param {Object} connection - 前端connection对象
 * @returns {Object} 后端API格式的数据
 */
export function formatFrontendToDb(connection) {
  if (!connection) {
    console.warn('formatFrontendToDb: connection参数为空')
    return null
  }

  const { basic, auth, advanced } = connection

  // === 构建符合后端API的JSON结构 ===
  const dbData = {
    // 后端API要求的必填字段
    broker_name: connection.brokerName || basic.brokerName || '',
    broker_host: basic.brokerHost || basic.host || 'localhost',
    broker_port: basic.brokerPort || basic.port || 1883,
    client_id: basic.clientId || `gateway_${Date.now()}`,

    // 后端API验证的字段 - 必须有值
    enabled: connection.enabled ? 1 : 0,

    // 认证信息
    username: auth.authType === 'password' ? auth.username : '',
    password: auth.authType === 'password' ? auth.password : '',

    // QoS和会话设置 - 使用后端期望的字段名
    qos_level: basic.qosLevel || parseInt(advanced.defaultPublishQos) || 1,
    keepalive_interval: basic.keepaliveInterval || basic.keepAlive || 60,
    clean_session: basic.cleanSession ? 1 : 0,

    // 重连设置
    auto_reconnect: Boolean(advanced.autoReconnect),
    reconnect_interval: advanced.reconnectInterval || 5,
    max_inflight_messages: advanced.maxInflightMessages || 20,

    // 网络设置
    topic_prefix: advanced.topicPrefix || '',
    network_interface: advanced.networkInterface || '',
    bind_address: advanced.bindAddress || '',
    dns_servers: advanced.dnsServers || '',

    // 连接设置
    connection_timeout: basic.connectionTimeout || advanced.connectTimeout || 30,

    // TLS设置
    tls_enabled: Boolean(basic.tlsEnabled),
    ca_cert_path: auth.caCert || '',
    client_cert_path: auth.clientCert || '',
    client_key_path: auth.clientKey || '',
  }

  return dbData
}

/**
 * 将前端格式转换为更新API格式
 * @param {Object} connection - 前端connection对象
 * @returns {Object} 后端更新API格式的数据
 */
export function formatFrontendToUpdateDb(connection) {
  if (!connection || !connection.id) {
    console.warn('formatFrontendToUpdateDb: connection参数无效')
    return null
  }

  const dbData = formatFrontendToDb(connection)
  if (!dbData) return null

  // 添加更新API需要的ID字段
  return {
    id: connection.id,
    ...dbData,
  }
}

/**
 * 获取默认的前端connection对象（用于添加新连接）
 * @returns {Object} 默认的connection对象
 */
export function getDefaultConnection() {
  const timestamp = Date.now()

  return {
    id: null,
    brokerName: '',
    enabled: false,
    status: '未连接',
    lastActivity: '',

    // 基础连接配置（对齐后端字段）
    basic: {
      enabled: false,
      brokerName: '',
      brokerHost: '',
      brokerPort: 1883,
      clientId: `gateway_${timestamp}`,
      keepaliveInterval: 60,
      connectionTimeout: 30,
      cleanSession: true,
      qosLevel: 1,
      tlsEnabled: false,
    },

    // 认证配置
    auth: {
      authType: 'none',
      username: '',
      password: '',
      caCert: '',
      clientCert: '',
      clientKey: '',
    },

    // 主题配置
    topics: {
      enablePublish: true,
      enableSubscribe: true,
      topics: [],
    },

    // 高级配置
    advanced: {
      autoReconnect: true,
      reconnectInterval: 5,
      maxInflightMessages: 20,
      topicPrefix: '',
      networkInterface: '',
      bindAddress: '',
      dnsServers: '',
    },
  }
}

// ==================== 数据验证函数 ====================

/**
 * 验证连接数据是否符合后端要求
 * @param {Object} connection - 前端connection对象
 * @returns {Array} 错误信息数组
 */
export function validateConnectionForBackend(connection) {
  const errors = []
  const { basic } = connection

  // 检查后端API要求的必填字段
  if (!connection.brokerName?.trim() && !basic?.brokerName?.trim()) {
    errors.push('连接名称(broker_name)不能为空')
  }

  if (!basic?.brokerHost?.trim() && !basic?.host?.trim()) {
    errors.push('Broker地址(broker_host)不能为空')
  }

  const port = basic?.brokerPort || basic?.port
  if (!port || port < 1 || port > 65535) {
    errors.push('端口号必须在1-65535之间')
  }

  if (!basic?.clientId?.trim()) {
    errors.push('客户端ID(client_id)不能为空')
  }

  // 检查认证一致性
  if (connection.auth?.authType === 'password') {
    if (!connection.auth?.username?.trim()) {
      errors.push('用户名不能为空')
    }
    if (!connection.auth?.password?.trim()) {
      errors.push('密码不能为空')
    }
  }

  return errors
}

// ==================== 导出 ====================
export default {
  // 常量
  DB_FIELDS,
  TOPIC_DIRECTION,

  // 数据转换
  formatDbToFrontend,
  formatFrontendToDb,
  formatFrontendToUpdateDb,

  // 数据创建
  getDefaultConnection,

  // 数据验证
  validateConnectionForBackend,
}
