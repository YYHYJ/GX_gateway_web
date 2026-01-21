<!-- src/views/transform/mqtt/mqtt.vue -->
<template>
  <MainLayout
    active-nav="data"
    active-sub-nav="mqtt-config"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader title="MQTT配置" :breadcrumbs="breadcrumbs" :actions="pageActions" />

      <div class="mqtt-config-content">
        <!-- 1. 多连接管理面板 -->
        <MqttConnectionsManager
          ref="connectionsManager"
          :connections="mqttConnections"
          :active-connection-id="activeConnectionId"
          @connection-select="handleConnectionSelect"
          @connection-add="handleConnectionAdd"
          @connection-delete="handleConnectionDelete"
          @connections-loaded="handleConnectionsLoaded"
          @connections-error="handleConnectionsError"
        />

        <!-- 2. 配置区域（新增或编辑） -->
        <div v-if="isEditing || isCreating" class="config-area">
          <!-- 配置标题 -->
          <div class="config-header">
            <h4>
              <i class="fas" :class="isCreating ? 'fa-plus-circle' : 'fa-edit'"></i>
              {{ isCreating ? '创建新连接' : '编辑连接配置' }}
              <span v-if="isEditing && activeConnection" class="connection-name">
                {{ activeConnection.brokerName || '未命名连接' }}
              </span>
            </h4>
            <button v-if="isCreating" class="btn btn-cancel" @click="cancelCreate">
              <i class="fas fa-times"></i> 取消
            </button>
          </div>

          <!-- 选项卡导航 -->
          <div class="config-tabs">
            <div class="tab-buttons">
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'basic' }"
                @click="activeTab = 'basic'"
              >
                <i class="fas fa-cog"></i>
                基础配置
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'auth' }"
                @click="activeTab = 'auth'"
              >
                <i class="fas fa-key"></i>
                认证配置
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'topics' }"
                @click="activeTab = 'topics'"
              >
                <i class="fas fa-list"></i>
                主题管理
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'advanced' }"
                @click="activeTab = 'advanced'"
              >
                <i class="fas fa-sliders-h"></i>
                高级配置
              </button>
            </div>

            <div class="tab-content">
              <!-- 基础配置标签页 -->
              <div v-if="activeTab === 'basic'" class="tab-pane">
                <BasicConfig
                  :key="configKey + '-basic'"
                  :config-data="currentConfig.basic"
                  @config-change="onBasicConfigChange"
                />
              </div>

              <!-- 认证配置标签页 -->
              <div v-if="activeTab === 'auth'" class="tab-pane">
                <AuthConfig
                  :key="configKey + '-auth'"
                  :config-data="currentConfig.auth"
                  :enabled="currentConfig.basic.enabled"
                  @config-change="onAuthConfigChange"
                />
              </div>

              <!-- topic管理标签页 -->
              <div v-if="activeTab === 'topics'" class="tab-pane">
                <TopicManager
                  :key="configKey + '-topics'"
                  :config-data="currentConfig.topics"
                  :enabled="currentConfig.basic.enabled"
                  @config-change="onTopicsConfigChange"
                />
              </div>
              <!-- 高级配置标签页 -->
              <div v-if="activeTab === 'advanced'" class="tab-pane">
                <AdvancedConfig
                  :key="configKey + '-advanced'"
                  :config-data="currentConfig.advanced"
                  :enabled="currentConfig.basic.enabled"
                  @config-change="onAdvancedConfigChange"
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="config-actions">
            <button v-if="isCreating" class="btn btn-cancel" @click="cancelCreate">
              <i class="fas fa-times"></i> 取消创建
            </button>
            <button
              v-if="isCreating"
              class="btn btn-primary btn-save"
              @click="saveNewConnection"
              :disabled="isSaving"
            >
              <i class="fas fa-check"></i> {{ isSaving ? '创建中...' : '创建连接' }}
            </button>
            <button
              v-if="isEditing"
              class="btn btn-primary btn-save"
              @click="saveConnectionConfig"
              :disabled="isSaving"
            >
              <i class="fas fa-save"></i> {{ isSaving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </div>

        <!-- 3. 无连接选中时的提示 -->
        <div v-else-if="mqttConnections.length === 0" class="no-connection-selected">
          <div class="empty-state">
            <i class="fas fa-plug"></i>
            <h4>暂无MQTT连接配置</h4>
            <p>点击左上角的"添加连接"按钮创建新的MQTT客户端连接</p>
            <button class="btn btn-primary" @click="startCreateConnection">
              <i class="fas fa-plus"></i> 创建新连接
            </button>
          </div>
        </div>

        <!-- 4. 有连接但未选中时的提示 -->
        <div v-else class="no-connection-selected">
          <div class="empty-state">
            <i class="fas fa-plug"></i>
            <h4>请选择一个MQTT连接进行配置</h4>
            <p>从左侧列表中选择一个连接进行编辑，或者创建新的连接</p>
            <button class="btn btn-primary" @click="startCreateConnection">
              <i class="fas fa-plus"></i> 创建新连接
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import MqttConnectionsManager from '@/views/transform/mqtt/MqttConnectionsManager.vue'
import BasicConfig from '@/views/transform/mqtt/BasicConfig.vue'
import AuthConfig from '@/views/transform/mqtt/AuthConfig.vue'
import TopicManager from '@/views/transform/mqtt/TopicManager.vue'
import AdvancedConfig from '@/views/transform/mqtt/AdvancedConfig.vue'
import mqttDataFormatter from '@/views/transform/mqtt/mqttDataFormatter.js' // 新增导入
import { createMqttService } from '@/views/transform/mqtt/mqttService.js'

export default {
  name: 'MQTT',
  components: {
    MainLayout,
    PageHeader,
    MqttConnectionsManager,
    BasicConfig,
    AuthConfig,
    TopicManager,
    AdvancedConfig,
  },
  data() {
    return {
      breadcrumbs: [
        { title: '数据转发', link: '/data-forwarding' },
        { title: 'MQTT配置', link: '/data-forwarding/mqtt' },
      ],
      pageActions: [],

      // 连接管理
      mqttConnections: [],
      activeConnectionId: null,

      // 配置模式：新增或编辑
      isCreating: false,
      isEditing: false,
      activeTab: 'basic',
      isSaving: false, // 保存状态

      // 当前编辑的配置数据
      currentConfig: {
        basic: this.getEmptyBasicConfig(),
        auth: this.getEmptyAuthConfig(),
        topics: this.getEmptyTopicsConfig(),
        advanced: this.getEmptyAdvancedConfig(),
      },
    }
  },
  computed: {
    activeConnection() {
      return this.mqttConnections.find((conn) => conn.id === this.activeConnectionId)
    },

    configKey() {
      // 用于强制重新渲染组件
      return `${this.isCreating ? 'create' : 'edit'}-${this.activeConnectionId || 'new'}`
    },
  },
  methods: {
    handleNavigation(nav) {
      console.log('导航变化:', nav)
    },

    // 开始创建新连接
    startCreateConnection() {
      this.isCreating = true
      this.isEditing = false
      this.activeConnectionId = null
      this.activeTab = 'basic'

      // 重置为空的配置
      this.currentConfig = {
        basic: this.getEmptyBasicConfig(),
        auth: this.getEmptyAuthConfig(),
        topics: this.getEmptyTopicsConfig(),
        advanced: this.getEmptyAdvancedConfig(),
      }
    },

    // 取消创建
    cancelCreate() {
      this.isCreating = false
      this.isEditing = false
      this.activeConnectionId = null

      // ✅ 优化：如果有连接，只设置activeConnectionId，不立即加载
      if (this.mqttConnections.length > 0) {
        this.activeConnectionId = this.mqttConnections[0].id
        // 不立即加载编辑数据，等用户点击时再加载
      }
    },

    // 处理连接管理事件
    handleConnectionAdd() {
      // 添加连接按钮被点击
      this.startCreateConnection()
    },

    handleConnectionSelect(connectionId) {
      // 切换到编辑模式
      this.isCreating = false
      this.isEditing = true
      this.activeConnectionId = connectionId
      this.activeTab = 'basic'

      // ✅ 加载连接配置（用户点击时才加载）
      this.loadConnectionForEdit(connectionId)
    },

    handleConnectionDelete(connectionId) {
      // 子组件已经调用了API删除，这里只需要更新本地状态
      this.mqttConnections = this.mqttConnections.filter((c) => c.id !== connectionId)

      // 如果删除的是当前编辑的连接
      if (this.activeConnectionId === connectionId) {
        this.isEditing = false
        this.activeConnectionId = null

        // 如果有其他连接，选中第一个
        if (this.mqttConnections.length > 0) {
          this.activeConnectionId = this.mqttConnections[0].id
          this.loadConnectionForEdit(this.activeConnectionId)
        }
      }
    },

    // 加载连接配置进行编辑
    async loadConnectionForEdit(connectionId) {
      try {
        // 使用mqttService获取完整数据
        const mqttService = createMqttService(this.$axios)

        // 1. 获取所有brokers
        const brokers = await mqttService.getBrokers()
        const broker = brokers.find((b) => b.id === connectionId)

        if (!broker) {
          this.showError('未找到该连接')
          return
        }

        // 2. 获取该broker的所有topics
        const allTopics = await mqttService.getTopics()
        const brokerTopics = allTopics.filter((t) => t.broker_id === connectionId)

        // 转换为前端格式
        const publishTopics = brokerTopics
          .filter((t) => t.direction === 0)
          .map((t) => ({
            id: t.id,
            type: 'publish',
            topic: t.topic_name,
            qos: t.qos || 1,
            retain: false, // 数据库可能没有这个字段
            enabled: Boolean(t.enabled),
            description: t.description || '',
          }))

        const subscribeTopics = brokerTopics
          .filter((t) => t.direction === 1)
          .map((t) => ({
            id: t.id,
            type: 'subscribe',
            topic: t.topic_name,
            qos: t.qos || 1,
            enabled: Boolean(t.enabled),
            description: t.description || '',
          }))

        // 3. 设置当前配置
        this.currentConfig = {
          basic: {
            enabled: Boolean(broker.enabled),
            brokerName: broker.broker_name || '',
            brokerHost: broker.broker_host || '',
            brokerPort: broker.broker_port || 1883,
            clientId: broker.client_id || `gateway_${Date.now()}`,
            keepaliveInterval: broker.keepalive_interval || 60,
            connectionTimeout: broker.connection_timeout || 30,
            cleanSession: Boolean(broker.clean_session),
            qosLevel: broker.qos_level?.toString() || '1',
            tlsEnabled: Boolean(broker.tls_enabled),
          },
          auth: {
            authType: broker.username ? 'password' : 'none',
            username: broker.username || '',
            password: broker.password || '',
            caCert: broker.ca_cert_path || '',
            clientCert: broker.client_cert_path || '',
            clientKey: broker.client_key_path || '',
          },
          topics: {
            enablePublish: publishTopics.length > 0,
            enableSubscribe: subscribeTopics.length > 0,
            topics: [...publishTopics, ...subscribeTopics],
          },
          advanced: {
            autoReconnect: Boolean(broker.auto_reconnect),
            reconnectInterval: broker.reconnect_interval || 5,
            maxInflightMessages: broker.max_inflight_messages || 20,
            topicPrefix: broker.topic_prefix || '',
            networkInterface: broker.network_interface || '',
            bindAddress: broker.bind_address || '',
            dnsServers: broker.dns_servers || '',
          },
        }

        this.isEditing = true
      } catch (error) {
        console.error('加载连接配置失败:', error)
        this.showError('加载连接配置失败: ' + error.message)
        this.isEditing = false
      }
    },
    // 配置变更事件
    onBasicConfigChange(config) {
      this.currentConfig.basic = { ...config }
    },

    onAuthConfigChange(config) {
      this.currentConfig.auth = { ...config }
    },

    // 构建完整连接对象（符合转换器格式）
    buildConnectionObject() {
      const { basic, auth, advanced } = this.currentConfig

      return {
        id: this.activeConnection ? this.activeConnection.id : null,
        brokerName: basic.brokerName || '',
        enabled: basic.enabled,
        status: '未连接',
        lastActivity: new Date().toLocaleString(),
        basic: {
          enabled: basic.enabled,
          brokerName: basic.brokerName,
          brokerHost: basic.brokerHost,
          brokerPort: basic.brokerPort,
          clientId: basic.clientId,
          keepaliveInterval: basic.keepaliveInterval,
          connectionTimeout: basic.connectionTimeout,
          cleanSession: basic.cleanSession,
          qosLevel: basic.qosLevel,
          tlsEnabled: basic.tlsEnabled,
        },
        auth: {
          authType: auth.authType,
          username: auth.username,
          password: auth.password,
          caCert: auth.caCert,
          clientCert: auth.clientCert,
          clientKey: auth.clientKey,
        },
        advanced: {
          autoReconnect: advanced.autoReconnect !== false,
          reconnectInterval: advanced.reconnectInterval || 5,
          maxInflightMessages: advanced.maxInflightMessages || 20,
          topicPrefix: advanced.topicPrefix || '',
          networkInterface: advanced.networkInterface || '',
          bindAddress: advanced.bindAddress || '',
          dnsServers: advanced.dnsServers || '',
        },
      }
    },
    // 保存新建的连接
    async saveNewConnection() {
      if (this.isSaving) return

      try {
        this.isSaving = true

        // 1. 构建连接对象
        const connection = this.buildConnectionObject()

        // 2. 使用转换器验证数据
        const errors = mqttDataFormatter.validateConnectionForBackend(connection)
        if (errors.length > 0) {
          this.showError(`请检查以下问题：\n${errors.join('\n')}`)
          return
        }

        // 3. 转换为后端API格式
        const backendData = mqttDataFormatter.formatFrontendToDb(connection)
        if (!backendData) {
          this.showError('数据格式转换失败')
          return
        }

        // 4. 调用后端API创建broker
        console.log('创建broker请求数据:', backendData)
        const response = await this.$axios.post('/api/mqtt/broker/config', backendData)

        // 根据您的API响应格式调整
        const createdBroker = response.data?.data || response.data

        if (!createdBroker) {
          throw new Error('创建成功但未返回有效的broker数据')
        }

        const brokerId = createdBroker.id || createdBroker.broker_id
        if (!brokerId) {
          throw new Error('创建成功但未返回broker ID')
        }

        // 5. 批量创建topics（如果有配置）
        const topics = this.currentConfig.topics?.topics || []
        if (topics.length > 0) {
          await this.saveTopicsToBackend(brokerId, topics)
        }

        // 6. 重新加载连接数据
        await this.refreshConnections()

        // 7. 切换到新创建的连接
        this.isCreating = false
        this.isEditing = true
        this.activeConnectionId = brokerId

        // 8. 加载新连接的数据进行编辑
        await this.loadConnectionForEdit(brokerId)

        this.showSuccess('连接创建成功')
      } catch (error) {
        console.error('创建连接失败:', error)
        this.showError(`创建失败: ${error.message || '未知错误'}`)
      } finally {
        this.isSaving = false
      }
    },

    // 保存编辑的配置
    async saveConnectionConfig() {
      if (this.isSaving || !this.activeConnection) return

      try {
        this.isSaving = true

        // 1. 构建连接对象
        const connection = this.buildConnectionObject()
        connection.id = this.activeConnection.id

        // 2. 使用转换器验证数据
        const errors = mqttDataFormatter.validateConnectionForBackend(connection)
        if (errors.length > 0) {
          this.showError(`请检查以下问题：\n${errors.join('\n')}`)
          return
        }

        // 3. 转换为后端API格式
        const updateData = mqttDataFormatter.formatFrontendToUpdateDb(connection)
        if (!updateData) {
          this.showError('数据格式转换失败')
          return
        }

        // 4. 调用后端API更新连接
        console.log('更新broker请求数据:', updateData)
        const response = await this.$axios.put('/api/mqtt/broker/config', updateData)

        const updatedBroker = response.data?.data || response.data

        if (!updatedBroker) {
          throw new Error('更新成功但未返回有效的broker数据')
        }

        // 5. 更新topics（如果有配置）
        const topics = this.currentConfig.topics?.topics || []
        await this.updateTopicsForBroker(connection.id, topics)

        // 6. 重新加载连接数据
        await this.refreshConnections()

        // 7. 重新加载当前连接的数据
        await this.loadConnectionForEdit(connection.id)

        this.showSuccess('配置保存成功')
      } catch (error) {
        console.error('保存配置失败:', error)
        this.showError(`保存失败: ${error.message || '未知错误'}`)
      } finally {
        this.isSaving = false
      }
    },
    // 空的配置模板
    getEmptyBasicConfig() {
      return {
        enabled: true,
        brokerName: '',
        brokerHost: '',
        brokerPort: 1883,
        clientId: `gateway_${Date.now()}`,
        keepaliveInterval: 60,
        connectionTimeout: 30,
        cleanSession: true,
        qosLevel: '1',
        tlsEnabled: false,
      }
    },
    // 新增认证配置模板
    getEmptyAuthConfig() {
      return {
        authType: 'none',
        username: '',
        password: '',
        caCert: '',
        clientCert: '',
        clientKey: '',
      }
    },
    // 新增主题配置模板
    getEmptyTopicsConfig() {
      return {
        enablePublish: true,
        enableSubscribe: true,
        topics: [],
      }
    },
    // 新增高级配置模板
    getEmptyAdvancedConfig() {
      return {
        autoReconnect: true,
        reconnectInterval: 5,
        maxInflightMessages: 20,
        topicPrefix: '',
        networkInterface: '',
        bindAddress: '',
        dnsServers: '',
      }
    },

    onTopicsConfigChange(config) {
      this.currentConfig.topics = { ...config }
    },

    // 新增：高级配置变更事件
    onAdvancedConfigChange(config) {
      this.currentConfig.advanced = { ...config }
    },

    // 保存topics到后端
    async saveTopicsToBackend(brokerId, topics) {
      try {
        if (!topics || topics.length === 0) return

        // 批量创建API
        const response = await this.$axios.post('/api/mqtt/topic/config', {
          broker_id: brokerId,
          topics: topics.map((topic) => ({
            broker_id: brokerId,
            topic_name: topic.topic,
            direction: topic.type === 'publish' ? 0 : 1,
            qos: topic.qos || 1,
            enabled: topic.enabled ? 1 : 0,
            description: topic.description || '',
          })),
        })

        console.log(`批量创建 ${topics.length} 个topic完成`, response.data)
      } catch (error) {
        console.error('批量创建topics失败:', error)
        throw new Error(`批量创建主题失败: ${error.message}`)
      }
    },

    // 更新broker的topics
    async updateTopicsForBroker(brokerId, newTopics) {
      try {
        const mqttService = createMqttService(this.$axios)

        // 1. 获取该broker现有的topics
        const existingTopics = await mqttService.getTopicsByBrokerId(brokerId)

        // 2. 删除旧的topics
        const deletePromises = existingTopics.map((topic) => mqttService.deleteTopic(topic.id))
        await Promise.all(deletePromises)
        console.log(`删除 ${existingTopics.length} 个旧topic`)

        // 3. 创建新的topics
        if (newTopics && newTopics.length > 0) {
          await this.saveTopicsToBackend(brokerId, newTopics)
        }
      } catch (error) {
        console.error('更新topics失败:', error)
        throw new Error(`更新主题失败: ${error.message}`)
      }
    },

    // 刷新连接数据
    async refreshConnections() {
      try {
        if (this.$refs.connectionsManager) {
          await this.$refs.connectionsManager.loadConnections()
        }
      } catch (error) {
        console.error('刷新连接数据失败:', error)
        this.showError('刷新数据失败: ' + error.message)
      }
    },

    // 处理连接数据加载完成
    handleConnectionsLoaded(connections) {
      console.log('连接数据加载完成:', connections)
      this.mqttConnections = connections

      // ✅ 优化：只在确实需要时选中第一个连接
      // 不要触发 loadConnectionForEdit，等用户点击时再加载
      if (
        connections.length > 0 &&
        !this.activeConnectionId &&
        !this.isCreating &&
        !this.isEditing
      ) {
        this.activeConnectionId = connections[0].id
        // 不立即加载编辑数据，等用户点击时再加载
      }
    },

    // 处理连接数据加载错误
    handleConnectionsError(error) {
      console.error('加载连接数据失败:', error)
      this.showError('加载MQTT连接配置失败: ' + error.message)
    },
    // 消息提示
    showSuccess(message) {
      if (this.$message) {
        this.$message.success(message)
      } else {
        alert(message)
      }
    },

    showError(message) {
      if (this.$message) {
        this.$message.error(message)
      } else {
        alert('错误: ' + message)
      }
    },
  },
}
</script>

<style scoped>
/* 样式保持不变 */
.mqtt-config-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-area {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.config-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.config-header h4 i {
  color: #3498db;
}

.connection-name {
  color: #3498db;
  font-weight: 600;
  margin-left: 10px;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-cancel:hover {
  background: #7f8c8d;
}

.config-tabs {
  display: flex;
  flex-direction: column;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #e1e5e9;
  background: #f8fafc;
  padding: 0 20px;
}

.tab-btn {
  padding: 14px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: #3498db;
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
  font-weight: 600;
  background: #fff;
}

.tab-content {
  padding: 0;
  min-height: 400px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.config-actions {
  padding: 16px 20px;
  border-top: 1px solid #e1e5e9;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-save {
  padding: 10px 24px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #1f6396 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-connection-selected {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-state {
  max-width: 400px;
  margin: 0 auto;
}

.empty-state i {
  font-size: 48px;
  color: #bdc3c7;
  margin-bottom: 20px;
}

.empty-state h4 {
  color: #2c3e50;
  margin-bottom: 12px;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 24px;
  line-height: 1.5;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #1f6396 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

@media (max-width: 768px) {
  .config-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .config-header h4 {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .connection-name {
    margin-left: 0;
  }

  .tab-buttons {
    padding: 0 16px;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 12px 16px;
    font-size: 13px;
    white-space: nowrap;
  }

  .config-actions {
    padding: 16px;
    flex-direction: column;
  }

  .config-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .no-connection-selected {
    padding: 40px 16px;
  }

  .empty-state i {
    font-size: 40px;
  }
}

@media (max-width: 480px) {
  .mqtt-config-content {
    gap: 16px;
  }

  .tab-buttons {
    gap: 4px;
  }

  .tab-btn {
    padding: 10px 12px;
    font-size: 12px;
  }
}
</style>
