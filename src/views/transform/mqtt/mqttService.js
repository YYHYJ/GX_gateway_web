// src/views/transform/mqtt/mqttService.js
import mqttDataFormatter from './mqttDataFormatter.js'

/**
 * MQTT配置服务层 - 匹配实际API格式
 */
class MqttService {
  constructor(axiosInstance) {
    // 接收axios实例
    this.axios = axiosInstance
    this.baseUrl = '/api/mqtt'
  }

  getResponseData(response) {
    if (!response || typeof response !== 'object') {
      return response
    }

    // 当 axios 响应拦截器已经返回 body 时，避免丢掉顶层 code/message
    if (response.data !== undefined) {
      if (response.code !== undefined) {
        return response
      }
      if (response.data && typeof response.data === 'object' && response.data.code !== undefined) {
        return response.data
      }
      return response.data
    }

    return response
  }

  isSuccessPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return false
    }
    if (payload.code === 200 || payload.code === 0) {
      return true
    }
    if (payload.success === true) {
      return true
    }
    if (payload.status === 'success' || payload.status === 'ok') {
      return true
    }
    if (typeof payload.message === 'string' && /成功|success/i.test(payload.message)) {
      return true
    }
    return false
  }

  // ==================== 核心数据获取 ====================

  /**
   * 获取所有broker配置
   * API: GET /api/mqtt/broker/list
   * @returns {Promise<Array>} broker列表
   */
  async getBrokers() {
    try {
      const response = await this.axios.get(`${this.baseUrl}/broker/list`)
      const payload = this.getResponseData(response)

      if (Array.isArray(payload)) {
        return payload
      } else if (payload && payload.code === 200 && Array.isArray(payload.data)) {
        return payload.data
      }

      console.warn('获取broker列表: 返回格式不符合预期', response)
      throw new Error('API返回格式错误')
    } catch (error) {
      console.error('获取broker列表失败:', error)

      // 根据错误类型提供更友好的错误信息
      if (error.response) {
        throw new Error(
          `服务器错误: ${error.response.status} - ${error.response.data?.message || '未知错误'}`,
        )
      } else if (error.request) {
        throw new Error('网络错误: 无法连接到服务器')
      } else {
        throw new Error(`请求失败: ${error.message}`)
      }
    }
  }

  /**
   * 获取所有topic配置
   * API: GET /api/mqtt/topic/list
   * @returns {Promise<Array>} topic列表
   */
  async getTopics() {
    try {
      const response = await this.axios.get(`${this.baseUrl}/topic/list`)
      const payload = this.getResponseData(response)

      if (Array.isArray(payload)) {
        return payload
      } else if (payload && payload.code === 200 && Array.isArray(payload.data)) {
        return payload.data
      }

      console.warn('获取topic列表: 返回格式不符合预期', response)
      throw new Error('API返回格式错误')
    } catch (error) {
      console.error('获取topic列表失败:', error)

      if (error.response) {
        throw new Error(
          `服务器错误: ${error.response.status} - ${error.response.data?.message || '未知错误'}`,
        )
      } else if (error.request) {
        throw new Error('网络错误: 无法连接到服务器')
      } else {
        throw new Error(`请求失败: ${error.message}`)
      }
    }
  }

  /**
   * 获取所有broker连接的运行状态（单独接口）
   * API: GET /api/mqtt/broker/status
   * 返回示例: { code:200, data: [{ broker_id: 1, connected: true, broker_index: 0 }, ...] }
   */
  async getBrokerStatuses() {
    try {
      const response = await this.axios.get(`${this.baseUrl}/broker/status`)
      const payload = this.getResponseData(response)
      if (Array.isArray(payload)) {
        return payload
      }
      if (payload && payload.code === 200 && Array.isArray(payload.data)) {
        return payload.data
      }
      console.warn('获取broker状态: 返回格式不符合预期', response)
      return []
    } catch (error) {
      console.error('获取broker状态失败:', error)
      return []
    }
  }

  /**
   * 获取完整连接配置（brokers + topics）
   * 这是最常用的方法，在组件加载时调用
   * @returns {Promise<Array>} 前端格式的connections
   */
  async getAllConnections() {
    try {
      console.log('开始获取MQTT连接配置...')

      // 并行获取brokers和topics
      const [brokers, topics] = await Promise.all([this.getBrokers(), this.getTopics()])

      console.log('获取brokers成功，数量:', brokers.length)
      console.log('获取topics成功，数量:', topics.length)

      // 获取broker运行状态并尝试合并（如果后端提供了单独状态接口）
      let statuses = []
      try {
        statuses = await this.getBrokerStatuses()
      } catch (e) {
        console.warn('获取broker状态失败，将使用配置中的状态:', e)
      }

      const mergedBrokers = (Array.isArray(brokers) ? brokers : []).map((broker) => {
        const match = (statuses || []).find((s) => {
          if (!s) return false
          // 尝试通过多种字段匹配：broker_id, id, broker_index
          if (
            s.broker_id !== undefined &&
            (s.broker_id === broker.id ||
              s.broker_id === broker.broker_id ||
              s.broker_id === broker.broker_index)
          )
            return true
          if (
            s.broker_index !== undefined &&
            broker.broker_index !== undefined &&
            s.broker_index === broker.broker_index
          )
            return true
          return false
        })

        if (match) {
          const connected =
            'connected' in match ? Boolean(match.connected) : match.conn_status === 'connected'
          return { ...broker, connected }
        }
        return broker
      })

      // 转换为前端格式
      const connections = mqttDataFormatter.formatDbToFrontend(mergedBrokers, topics)
      console.log('转换后的connections:', connections)

      return connections
    } catch (error) {
      console.error('获取完整连接配置失败:', error)
      throw error
    }
  }

  // ==================== 删除操作 ====================

  /**
   * 删除broker配置
   * @param {Number} id - broker ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async deleteBroker(id) {
    try {
      const response = await this.axios.delete(`${this.baseUrl}/broker/delete`, {
        data: { id },
      })
      const payload = this.getResponseData(response)

      if (this.isSuccessPayload(payload)) {
        return true
      } else {
        throw new Error(payload?.message || '删除失败')
      }
    } catch (error) {
      console.error(`删除broker ${id} 失败:`, error)
      throw error
    }
  }

  /**
   * 删除topic配置
   * @param {Number} id - topic ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async deleteTopic(id) {
    try {
      const response = await this.axios.delete(`${this.baseUrl}/topic/delete`, {
        data: { id },
      })
      const payload = this.getResponseData(response)

      if (this.isSuccessPayload(payload)) {
        return true
      } else {
        throw new Error(payload?.message || '删除topic失败')
      }
    } catch (error) {
      console.error(`删除topic ${id} 失败:`, error)
      throw error
    }
  }

  // ==================== 创建操作 ====================

  /**
   * 创建broker配置
   * @param {Object} brokerData - broker数据
   * @returns {Promise<Object>} 创建结果
   */
  async createBroker(brokerData) {
    try {
      console.log('正在创建broker配置:', brokerData)

      // 使用转换器验证数据（如果有验证函数）
      if (mqttDataFormatter.validateConnectionForBackend) {
        const connection = {
          brokerName: brokerData.broker_name || brokerData.brokerName || '',
          basic: {
            brokerName: brokerData.broker_name || brokerData.brokerName || '',
            brokerHost: brokerData.host || brokerData.broker_host || '',
            brokerPort: brokerData.port || brokerData.broker_port || 1883,
            clientId: brokerData.client_id || brokerData.clientId || '',
            keepaliveInterval: brokerData.keepalive || brokerData.keepalive_interval || 60,
            connectionTimeout: brokerData.connection_timeout || brokerData.connectionTimeout || 30,
            cleanSession: brokerData.clean_session ?? brokerData.cleanSession ?? true,
            qosLevel: brokerData.qos ?? brokerData.qos_level ?? 1,
          },
          auth: {
            username: brokerData.username || '',
            password: brokerData.password || '',
          },
        }

        const errors = mqttDataFormatter.validateConnectionForBackend(connection)
        if (errors.length > 0) {
          throw new Error(`数据验证失败: ${errors.join(', ')}`)
        }
      }

      const response = await this.axios.post(`${this.baseUrl}/broker/create`, brokerData)
      const payload = this.getResponseData(response)

      if (payload && payload.code === 200) {
        return payload.data
      } else {
        throw new Error(payload?.message || '创建连接失败')
      }
    } catch (error) {
      console.error('创建broker失败:', error)
      throw error
    }
  }

  /**
   * 创建topic配置
   * @param {Object} topicData - topic数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTopic(topicData) {
    try {
      const response = await this.axios.post(`${this.baseUrl}/topic/create`, topicData)
      const payload = this.getResponseData(response)

      if (payload && payload.code === 200) {
        return payload.data
      } else {
        throw new Error(payload?.message || '创建主题失败')
      }
    } catch (error) {
      console.error('创建topic失败:', error)
      throw error
    }
  }

  // ==================== 更新操作 ====================

  /**
   * 更新broker配置
   * @param {Object} brokerData - broker数据，必须包含id字段
   * @returns {Promise<Object>} 更新结果
   */
  async updateBroker(brokerData) {
    try {
      console.log('正在更新broker配置:', brokerData)

      // 验证必填字段
      if (!brokerData.id) {
        throw new Error('更新broker时必须提供id')
      }

      const response = await this.axios.put(`${this.baseUrl}/broker/update`, brokerData)
      const payload = this.getResponseData(response)

      if (this.isSuccessPayload(payload)) {
        return {
          ...brokerData,
          message: payload?.message || '更新成功',
          status: 'success',
        }
      } else {
        throw new Error(payload?.message || '更新连接失败')
      }
    } catch (error) {
      console.error('更新broker失败:', error)
      throw error
    }
  }

  /**
   * 更新topic配置
   * @param {Object} topicData - topic数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateTopic(topicData) {
    try {
      const response = await this.axios.put(`${this.baseUrl}/topic/update`, topicData)
      const payload = this.getResponseData(response)

      if (this.isSuccessPayload(payload)) {
        return {
          ...topicData,
          message: payload?.message || '更新成功',
          status: 'success',
        }
      } else {
        throw new Error(payload?.message || '更新主题失败')
      }
    } catch (error) {
      console.error('更新topic失败:', error)
      throw error
    }
  }

  // ==================== 状态切换操作 ====================

  /**
   * 切换broker启用状态
   * @param {Number} id - broker ID
   * @param {Boolean} enabled - 启用状态
   * @returns {Promise<Object>} 更新结果
   */
  async toggleBroker(id, enabled, fallbackBroker = null) {
    try {
      console.log(`切换broker ${id} 启用状态为: ${enabled}`)

      // 先获取broker当前配置
      const brokers = await this.getBrokers()
      const broker = brokers.find((b) => b.id === id)

      if (!broker) {
        throw new Error(`未找到ID为${id}的broker`)
      }

      const getField = (rawValue, fallbackValue, defaultValue) => {
        if (rawValue !== undefined && rawValue !== null && rawValue !== '') return rawValue
        if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== '')
          return fallbackValue
        return defaultValue
      }

      const fallback = fallbackBroker || {}
      const fallbackBasic = fallback.basic || {}
      const fallbackAuth = fallback.auth || {}
      const fallbackAdvanced = fallback.advanced || {}

      const updateData = {
        id: broker.id,
        broker_name: getField(
          broker.broker_name,
          fallback.brokerName || fallbackBasic.brokerName,
          '',
        ),
        enabled: Boolean(enabled),
        host: getField(broker.host ?? broker.broker_host, fallbackBasic.brokerHost, ''),
        port: getField(broker.port ?? broker.broker_port, fallbackBasic.brokerPort, 1883),
        client_id: getField(broker.client_id, fallbackBasic.clientId, ''),
        username: getField(broker.username, fallbackAuth.username, ''),
        password: getField(broker.password, fallbackAuth.password, ''),
        qos: getField(broker.qos ?? broker.qos_level, fallbackBasic.qosLevel, 1),
        keepalive: getField(
          broker.keepalive ?? broker.keepalive_interval,
          fallbackBasic.keepaliveInterval,
          60,
        ),
        clean_session: getField(broker.clean_session, fallbackBasic.cleanSession, 1),
        auto_reconnect: getField(broker.auto_reconnect, fallbackAdvanced.autoReconnect, 1),
        reconnect_interval: getField(
          broker.reconnect_interval,
          fallbackAdvanced.reconnectInterval,
          5,
        ),
        max_inflight_messages: getField(
          broker.max_inflight_messages,
          fallbackAdvanced.maxInflightMessages,
          20,
        ),
        topic_prefix: getField(broker.topic_prefix, fallbackAdvanced.topicPrefix, ''),
        network_interface: getField(
          broker.network_interface,
          fallbackAdvanced.networkInterface,
          '',
        ),
        bind_address: getField(broker.bind_address, fallbackAdvanced.bindAddress, ''),
        dns_servers: getField(broker.dns_servers, fallbackAdvanced.dnsServers, ''),
        connection_timeout: getField(
          broker.connection_timeout,
          fallbackBasic.connectionTimeout,
          30,
        ),
        tls_enabled: getField(broker.tls_enabled, fallbackBasic.tlsEnabled, 0),
        ca_cert_path: getField(broker.ca_cert_path, fallbackAuth.caCert, ''),
        client_cert_path: getField(broker.client_cert_path, fallbackAuth.clientCert, ''),
        client_key_path: getField(broker.client_key_path, fallbackAuth.clientKey, ''),
      }

      return await this.updateBroker(updateData)
    } catch (error) {
      console.error(`切换broker ${id} 状态失败:`, error)
      throw error
    }
  }

  /**
   * 切换topic启用状态
   * @param {Number} id - topic ID
   * @param {Boolean} enabled - 启用状态
   * @returns {Promise<Object>} 更新结果
   */
  async toggleTopic(id, enabled) {
    try {
      console.log(`切换topic ${id} 启用状态为: ${enabled}`)

      // 先获取topic当前配置
      const topics = await this.getTopics()
      const topic = topics.find((t) => t.id === id)

      if (!topic) {
        throw new Error(`未找到ID为${id}的topic`)
      }

      // 构建完整的更新数据
      const updateData = {
        id: topic.id,
        broker_id: topic.broker_id,
        topic_name: topic.topic_name || '',
        direction: topic.direction ?? 0,
        qos: topic.qos ?? 1,
        enabled: Boolean(enabled),
        description: topic.description || '',
      }

      return await this.updateTopic(updateData)
    } catch (error) {
      console.error(`切换topic ${id} 状态失败:`, error)
      throw error
    }
  }

  /**
   * 根据broker ID获取其所有topics
   * @param {Number} brokerId - broker ID
   * @returns {Promise<Array>} topic列表
   */
  async getTopicsByBrokerId(brokerId) {
    try {
      const allTopics = await this.getTopics()
      return allTopics.filter((topic) => topic.broker_id === brokerId)
    } catch (error) {
      console.error(`获取broker ${brokerId} 的topics失败:`, error)
      throw error
    }
  }

  /**
   * 使用转换器验证连接数据
   * @param {Object} connection - 前端connection对象
   * @returns {Array} 错误信息数组
   */
  validateConnection(connection) {
    if (!mqttDataFormatter.validateConnectionForBackend) {
      return []
    }
    return mqttDataFormatter.validateConnectionForBackend(connection)
  }

  /**
   * 将前端格式转换为后端API格式（用于创建）
   * @param {Object} connection - 前端connection对象
   * @returns {Object} 后端API格式的数据
   */
  formatToBackendData(connection) {
    return mqttDataFormatter.formatFrontendToDb(connection)
  }

  /**
   * 将前端格式转换为更新API格式
   * @param {Object} connection - 前端connection对象
   * @returns {Object} 后端更新API格式的数据
   */
  formatToUpdateData(connection) {
    if (!connection.id) {
      throw new Error('更新时connection必须包含id')
    }

    const baseData = mqttDataFormatter.formatFrontendToDb(connection)
    return {
      id: connection.id,
      ...baseData,
    }
  }
}

// 导出单例实例
let instance = null

export function createMqttService(axiosInstance) {
  if (!instance) {
    instance = new MqttService(axiosInstance)
  } else if (axiosInstance && instance.axios !== axiosInstance) {
    // 如果传入了新的axios实例，更新它
    instance.axios = axiosInstance
  }
  return instance
}

// 默认导出
export default MqttService
