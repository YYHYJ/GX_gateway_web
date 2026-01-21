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

  // ==================== 核心数据获取 ====================

  /**
   * 获取所有broker配置
   * API: GET /api/mqtt/broker/config
   * @returns {Promise<Array>} broker列表
   */
  async getBrokers() {
    try {
      const response = await this.axios.get(`${this.baseUrl}/broker/config`)

      // 根据您的返回格式处理
      if (response && response.code === 200 && Array.isArray(response.data)) {
        return response.data
      } else {
        console.warn('获取broker列表: 返回格式不符合预期', response)
        throw new Error('API返回格式错误')
      }
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
   * API: GET /api/mqtt/topic/config
   * @returns {Promise<Array>} topic列表
   */
  async getTopics() {
    try {
      const response = await this.axios.get(`${this.baseUrl}/topic/config`)

      // 根据您的返回格式处理
      if (response && response.code === 200 && Array.isArray(response.data)) {
        return response.data
      } else {
        console.warn('获取topic列表: 返回格式不符合预期', response)
        throw new Error('API返回格式错误')
      }
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

      // 转换为前端格式
      const connections = mqttDataFormatter.formatDbToFrontend(brokers, topics)
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
      const response = await this.axios.delete(`${this.baseUrl}/broker/config`, {
        data: { broker_id: id },
      })

      // 根据您的返回格式处理
      if (response && response.code === 200) {
        return true
      } else {
        throw new Error(response.data?.message || '删除失败')
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
      const response = await this.axios.delete(`${this.baseUrl}/topic/config`, {
        data: { id: id },
      })

      // 根据您的返回格式处理
      if (response && response.code === 200) {
        return true
      } else {
        throw new Error(response.data?.message || '删除topic失败')
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
          brokerName: brokerData.broker_name || '',
          basic: {
            brokerName: brokerData.broker_name || '',
            brokerHost: brokerData.broker_host || '',
            brokerPort: brokerData.broker_port || 1883,
            clientId: brokerData.client_id || '',
            keepaliveInterval: brokerData.keepalive_interval || 60,
            connectionTimeout: brokerData.connection_timeout || 30,
            cleanSession: brokerData.clean_session || true,
            qosLevel: brokerData.qos_level || 1,
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

      const response = await this.axios.post(`${this.baseUrl}/broker/config`, brokerData)

      // 根据您的返回格式处理
      if (response && response.code === 200) {
        return response.data
      } else {
        throw new Error(response.data?.message || '创建连接失败')
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
      const response = await this.axios.post(`${this.baseUrl}/topic/config`, topicData)

      // 根据您的返回格式处理
      if (response && response.code === 200) {
        return response.data
      } else {
        throw new Error(response.data?.message || '创建主题失败')
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

      const response = await this.axios.put(`${this.baseUrl}/broker/config`, brokerData)

      // 根据您的返回格式处理
      if (response && response.code === 200) {
        return {
          ...brokerData,
          message: response.data?.message || '更新成功',
          status: 'success',
        }
      } else {
        throw new Error(response.data?.message || '更新连接失败')
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
      const response = await this.axios.put(`${this.baseUrl}/topic/config`, topicData)

      // 根据您的返回格式处理
      if (response && response.code === 200) {
        return {
          ...topicData,
          message: response.data?.message || '更新成功',
          status: 'success',
        }
      } else {
        throw new Error(response.data?.message || '更新主题失败')
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
  async toggleBroker(id, enabled) {
    try {
      console.log(`切换broker ${id} 启用状态为: ${enabled}`)

      // 先获取broker当前配置
      const brokers = await this.getBrokers()
      const broker = brokers.find((b) => b.id === id)

      if (!broker) {
        throw new Error(`未找到ID为${id}的broker`)
      }

      // 构建完整的更新数据
      const updateData = {
        id: broker.id,
        broker_name: broker.broker_name || '',
        enabled: enabled ? 1 : 0,
        broker_host: broker.broker_host || '',
        broker_port: broker.broker_port || 1883,
        client_id: broker.client_id || '',
        username: broker.username || '',
        password: broker.password || '',
        qos_level: broker.qos_level || 1,
        keepalive_interval: broker.keepalive_interval || 60,
        clean_session: broker.clean_session || 1,
        auto_reconnect: broker.auto_reconnect || 1,
        reconnect_interval: broker.reconnect_interval || 5,
        max_inflight_messages: broker.max_inflight_messages || 20,
        topic_prefix: broker.topic_prefix || '',
        network_interface: broker.network_interface || '',
        bind_address: broker.bind_address || '',
        dns_servers: broker.dns_servers || '',
        connection_timeout: broker.connection_timeout || 30,
        tls_enabled: broker.tls_enabled || 0,
        ca_cert_path: broker.ca_cert_path || '',
        client_cert_path: broker.client_cert_path || '',
        client_key_path: broker.client_key_path || '',
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
        direction: topic.direction || 0,
        qos: topic.qos || 1,
        enabled: enabled ? 1 : 0,
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
