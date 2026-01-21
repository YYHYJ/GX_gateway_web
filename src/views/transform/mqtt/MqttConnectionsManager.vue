<!-- src/views/transform/mqtt/MqttConnectionsManager.vue -->
<template>
  <div class="mqtt-connections-manager">
    <!-- 头部 -->
    <div class="manager-header">
      <h3>MQTT连接管理</h3>
      <div class="header-right">
        <button class="btn btn-refresh" @click="loadConnections" :disabled="loading" title="刷新">
          <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
        </button>
        <button class="btn btn-add" @click="$emit('connection-add')">+ 添加连接</button>
      </div>
    </div>

    <!-- 处理中通知 -->
    <div v-if="processingOperations.size > 0" class="processing-notice">
      <i class="fas fa-spinner fa-spin"></i>
      <span>正在处理操作，请稍候...</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && processingOperations.size === 0" class="loading-state">
      <div class="loading-content">
        <i class="fas fa-spinner fa-spin"></i>
        <span>正在加载MQTT连接配置...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error && !loading" class="error-state">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="error-message">{{ error }}</div>
        <button class="btn btn-retry" @click="loadConnections">
          <i class="fas fa-redo"></i> 重试
        </button>
      </div>
    </div>

    <!-- 连接表格 -->
    <div v-else class="connections-container">
      <table class="connections-table">
        <thead>
          <tr>
            <th>状态</th>
            <th>连接名称</th>
            <th>Broker地址</th>
            <th>发布主题</th>
            <th class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 连接行：使用 props.connections 而不是 data.connections -->
          <tr
            v-for="connection in connections"
            :key="connection.id"
            :class="{
              active: connection.id === activeConnectionId,
              'processing-row': isProcessing(connection.id),
            }"
            @click="$emit('connection-select', connection.id)"
          >
            <!-- 状态列 -->
            <td>
              <span :class="['status-badge', `status-${getStatusClass(connection)}`]">
                {{ getStatusText(connection) }}
              </span>
            </td>

            <!-- 连接名称列 -->
            <td>
              <div class="connection-info">
                <div class="connection-name">{{ connection.brokerName || '未命名连接' }}</div>
                <div class="client-id">{{ getClientId(connection) }}</div>
              </div>
            </td>

            <!-- Broker地址列 -->
            <td>
              <div class="connection-host">
                <div class="host-address">{{ formatHost(connection) }}</div>
                <div v-if="hasTls(connection)" class="tls-badge">TLS</div>
              </div>
            </td>

            <!-- 发布主题列 -->
            <td>
              <div class="topics-list">
                <template v-if="hasPublishTopics(connection)">
                  <div
                    v-for="topic in getPublishTopics(connection)"
                    :key="topic.id"
                    class="topic-item"
                    :class="{
                      disabled: !topic.enabled,
                      'processing-topic': isProcessingTopic(topic.id),
                    }"
                  >
                    <span class="topic-path">{{ topic.topic }}</span>
                    <span class="topic-qos">QoS {{ topic.qos }}</span>
                    <button
                      class="topic-toggle"
                      @click.stop="toggleTopic(connection.id, topic.id)"
                      :title="topic.enabled ? '禁用主题' : '启用主题'"
                      :class="{ disabled: !topic.enabled }"
                      :disabled="!connection.enabled || isProcessingTopic(topic.id)"
                    >
                      {{ topic.enabled ? '禁用' : '启用' }}
                    </button>
                    <!-- 删除按钮 -->
                    <button
                      class="topic-delete"
                      @click.stop="deleteTopic(connection.id, topic.id)"
                      :title="'删除主题: ' + topic.topic"
                      :disabled="isProcessingTopic(topic.id)"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </template>
                <div v-else class="no-topics">无发布主题</div>
              </div>
            </td>

            <!-- 操作列 -->
            <td class="actions-column">
              <div class="table-actions">
                <a
                  class="action-link"
                  @click.stop="toggleConnection(connection.id, connection.enabled)"
                  :disabled="isProcessing(connection.id)"
                >
                  {{ connection.enabled ? '禁用' : '启用' }}
                </a>
                <a
                  class="action-link delete"
                  @click.stop="deleteConnection(connection.id)"
                  :disabled="isProcessing(connection.id)"
                >
                  删除
                </a>
              </div>
            </td>
          </tr>

          <!-- 空状态 -->
          <tr v-if="!loading && !error && connections.length === 0">
            <td colspan="5" class="empty-state">
              <div class="empty-content">
                <i class="fas fa-network-wired"></i>
                <div class="empty-message">暂无MQTT连接配置</div>
                <button class="btn btn-add-inline" @click="$emit('connection-add')">
                  + 添加连接
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { createMqttService } from './mqttService.js'

export default {
  name: 'MqttConnectionsManager',
  props: {
    connections: {
      // ✅ 添加 connections prop
      type: Array,
      required: true,
      default: () => [],
    },
    activeConnectionId: {
      type: [Number, String],
      default: null,
    },
  },
  emits: [
    // ✅ 添加 emits 声明
    'connection-select',
    'connection-add',
    'connection-delete',
    'connection-toggle',
    'connections-loaded',
    'connections-error',
    'operation-error',
    'topic-delete',
    'topic-toggle',
  ],
  data() {
    return {
      // ❌ 删除这行：connections: [], // 不再需要，使用props.connections
      loading: false,
      error: null,
      mqttService: null,
      processingOperations: new Set(),
    }
  },
  created() {
    this.initializeService()
    this.loadConnections()
  },
  methods: {
    // 初始化服务
    initializeService() {
      try {
        // 1. 从全局属性获取
        let axiosInstance = this.$axios

        // 2. 如果取不到，从app实例获取
        if (!axiosInstance && this.$root && this.$root.$axios) {
          axiosInstance = this.$root.$axios
        }

        // 3. 如果还是取不到，说明可能有问题
        if (!axiosInstance) {
          console.error('❌ 无法获取axios实例')
          this.error = 'HTTP客户端初始化失败'
          return
        }

        this.mqttService = createMqttService(axiosInstance)
        console.log('✅ MQTT服务初始化成功')
      } catch (error) {
        console.error('❌ 初始化MQTT服务失败:', error)
        this.error = '服务初始化失败: ' + error.message
      }
    },

    // 加载连接数据
    async loadConnections() {
      try {
        this.loading = true
        this.error = null

        if (!this.mqttService) {
          this.initializeService()
          if (!this.mqttService) {
            throw new Error('MQTT服务未初始化')
          }
        }

        const loadedConnections = await this.mqttService.getAllConnections()
        console.log('从API加载到的连接数据:', loadedConnections)

        // ✅ 发出事件，让父组件更新 connections
        this.$emit('connections-loaded', loadedConnections)

        // 如果有数据且父组件没有指定选中的连接，建议选中第一个
        if (loadedConnections.length > 0 && !this.activeConnectionId) {
          this.$emit('connection-select', loadedConnections[0].id)
        }
      } catch (error) {
        console.error('加载MQTT连接配置失败:', error)
        this.error = error.message || '加载数据失败'
        this.$emit('connections-error', error)
      } finally {
        this.loading = false
      }
    },

    // 检查是否正在处理
    isProcessing(connectionId) {
      return (
        this.processingOperations.has(`toggle-${connectionId}`) ||
        this.processingOperations.has(`delete-${connectionId}`)
      )
    },

    isProcessingTopic(topicId) {
      return (
        this.processingOperations.has(`toggle-topic-${topicId}`) ||
        this.processingOperations.has(`delete-topic-${topicId}`)
      )
    },

    // 切换连接启用状态
    async toggleConnection(connectionId, currentEnabled) {
      try {
        const connection = this.connections.find((c) => c.id === connectionId)
        if (!connection) return

        // 添加操作到处理中集合
        this.processingOperations.add(`toggle-${connectionId}`)

        // 确认提示
        const action = currentEnabled ? '禁用' : '启用'
        const confirmMessage = currentEnabled
          ? `确定要禁用连接 "${connection.brokerName}" 吗？\n\n注意：禁用此连接将同时禁用其下所有主题。`
          : `确定要启用连接 "${connection.brokerName}" 吗？\n\n注意：启用连接不会自动启用主题。`

        if (!confirm(confirmMessage)) {
          this.processingOperations.delete(`toggle-${connectionId}`)
          return
        }

        console.log(`开始${action}连接 ${connectionId}`)

        // 调用toggleBroker方法
        await this.mqttService.toggleBroker(connectionId, !currentEnabled)

        // ✅ 重新加载数据，而不是直接修改本地状态
        await this.loadConnections()

        // 显示操作结果
        const successMessage = currentEnabled
          ? '连接已禁用，其下所有主题也已自动禁用'
          : '连接已启用'

        this.$message &&
          this.$message.success({
            message: successMessage,
            duration: 3000,
          })

        this.$emit('connection-toggle', connectionId)
      } catch (error) {
        console.error('切换连接状态失败:', error)

        this.$message &&
          this.$message.error({
            message: `操作失败: ${error.message}`,
            duration: 3000,
          })

        this.$emit('operation-error', { action: 'toggle', error: error.message })
      } finally {
        this.processingOperations.delete(`toggle-${connectionId}`)
      }
    },

    // 删除连接
    async deleteConnection(connectionId) {
      const connection = this.connections.find((c) => c.id === connectionId)
      if (!connection) return

      const confirmMessage = `确定要删除连接 "${connection.brokerName || connectionId}" 吗？\n\n此操作将同时删除该连接下的所有主题。`

      if (!confirm(confirmMessage)) return

      try {
        this.processingOperations.add(`delete-${connectionId}`)

        // 直接删除broker，后端会自动级联删除关联的topics
        await this.mqttService.deleteBroker(connectionId)

        // ✅ 重新加载数据，而不是直接修改本地状态
        await this.loadConnections()

        this.$emit('connection-delete', connectionId)

        // 显示成功消息
        this.$message && this.$message.success('连接删除成功')
      } catch (error) {
        console.error('删除连接失败:', error)
        this.$emit('operation-error', { action: 'delete', error: error.message })

        // 显示错误消息
        this.$message && this.$message.error(`删除失败: ${error.message}`)
      } finally {
        this.processingOperations.delete(`delete-${connectionId}`)
      }
    },

    // 删除主题
    async deleteTopic(connectionId, topicId) {
      const connection = this.connections.find((c) => c.id === connectionId)
      if (!connection || !connection.topics?.topics) return

      const topic = connection.topics.topics.find((t) => t.id === topicId)
      if (!topic) return

      const confirmMessage = `确定要删除主题 "${topic.topic}" 吗？此操作不可撤销。`
      if (!confirm(confirmMessage)) return

      try {
        this.processingOperations.add(`delete-topic-${topicId}`)

        await this.mqttService.deleteTopic(topicId)

        // ✅ 重新加载数据，而不是直接修改本地状态
        await this.loadConnections()

        this.$emit('topic-delete', { connectionId, topicId })

        // 显示成功消息
        this.$message && this.$message.success('主题删除成功')
      } catch (error) {
        console.error('删除主题失败:', error)
        this.$emit('operation-error', { action: 'topic-delete', error: error.message })

        // 显示错误消息
        this.$message && this.$message.error(`删除主题失败: ${error.message}`)
      } finally {
        this.processingOperations.delete(`delete-topic-${topicId}`)
      }
    },

    // 切换topic启用状态
    async toggleTopic(connectionId, topicId) {
      try {
        const connection = this.connections.find((c) => c.id === connectionId)
        if (!connection || !connection.topics?.topics) return

        const topic = connection.topics.topics.find((t) => t.id === topicId)
        if (!topic) return

        // 检查broker是否启用
        if (!connection.enabled) {
          this.$message && this.$message.warning('请先启用连接再操作主题')
          return
        }

        this.processingOperations.add(`toggle-topic-${topicId}`)

        // 确认提示
        const action = topic.enabled ? '禁用' : '启用'
        if (!confirm(`确定要${action}主题 "${topic.topic}" 吗？`)) {
          this.processingOperations.delete(`toggle-topic-${topicId}`)
          return
        }

        await this.mqttService.toggleTopic(topicId, !topic.enabled)

        // ✅ 重新加载数据，而不是直接修改本地状态
        await this.loadConnections()

        this.$emit('topic-toggle', { connectionId, topicId, enabled: !topic.enabled })

        // 显示成功消息
        this.$message && this.$message.success(`主题已${action}`)
      } catch (error) {
        console.error('切换topic状态失败:', error)
        this.$message && this.$message.error(`操作失败: ${error.message}`)
        this.$emit('operation-error', { action: 'topic-toggle', error: error.message })
      } finally {
        this.processingOperations.delete(`toggle-topic-${topicId}`)
      }
    },

    // ============ 辅助方法 ============

    // 获取客户端ID
    getClientId(connection) {
      return connection.clientId || connection.basic?.clientId || '未设置'
    },

    // 格式化主机地址
    formatHost(connection) {
      const host = connection.brokerHost || connection.basic?.brokerHost || connection.basic?.host
      const port = connection.brokerPort || connection.basic?.brokerPort || connection.basic?.port

      if (!host) return '未配置'
      return `${host}:${port || 1883}`
    },

    // 检查是否有TLS
    hasTls(connection) {
      return connection.tlsEnabled || connection.basic?.tlsEnabled || false
    },

    // 获取状态类别
    getStatusClass(connection) {
      if (!connection.enabled) return 'disabled'

      const status = connection.status || '未连接'
      const statusMap = {
        已连接: 'online',
        连接中: 'connecting',
        未连接: 'offline',
        连接失败: 'fault',
        已禁用: 'disabled',
      }
      return statusMap[status] || 'offline'
    },

    // 获取状态文本
    getStatusText(connection) {
      if (!connection.enabled) return '已禁用'

      const status = connection.status || '未连接'
      const textMap = {
        已连接: '在线',
        连接中: '连接中',
        未连接: '离线',
        连接失败: '失败',
        已禁用: '已禁用',
      }
      return textMap[status] || status || '离线'
    },

    // 检查是否有发布主题
    hasPublishTopics(connection) {
      return this.getPublishTopics(connection).length > 0
    },

    // 获取发布主题
    getPublishTopics(connection) {
      if (!connection.topics?.topics) return []

      return connection.topics.topics.filter((t) => {
        return t.type === 'publish' || t.direction === 0
      })
    },
  },
}
</script>

<style scoped>
/* 样式保持不变，与之前相同 */
.mqtt-connections-manager {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
}

/* 头部样式 */
.manager-header {
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.manager-header h3 {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-refresh {
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #e9ecef;
  color: #212529;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #2980b9;
}

/* 处理中通知 */
.processing-notice {
  background-color: #fff3cd;
  color: #856404;
  padding: 10px 16px;
  border-bottom: 1px solid #ffeaa7;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.processing-notice i {
  color: #ffc107;
}

.processing-row {
  opacity: 0.7;
  background-color: #f8f9fa !important;
}

.processing-row:hover {
  background-color: #f1f3f4 !important;
}

.processing-topic {
  opacity: 0.6;
}

/* 加载状态 */
.loading-state {
  padding: 40px 20px;
  text-align: center;
  background-color: #fafafa;
}

.loading-content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-content i {
  font-size: 24px;
  color: #3498db;
}

.loading-content span {
  color: #6c757d;
  font-size: 14px;
}

/* 错误状态 */
.error-state {
  padding: 40px 20px;
  text-align: center;
  background-color: #fff5f5;
  border: 1px solid #f8d7da;
  border-radius: 4px;
  margin: 16px;
}

.error-content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-content i {
  font-size: 32px;
  color: #dc3545;
}

.error-message {
  color: #721c24;
  font-size: 14px;
  max-width: 500px;
  line-height: 1.5;
}

.btn-retry {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-retry:hover {
  background-color: #c82333;
}

/* 表格容器 */
.connections-container {
  padding: 0;
  overflow-x: auto;
}

.connections-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}

.connections-table th {
  background-color: #f8f9fa;
  padding: 18px 16px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
  font-size: 15px;
}

.connections-table td {
  padding: 18px 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
  color: #495057;
}

.connections-table tbody tr:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

.connections-table tbody tr.active {
  background-color: #f0f7ff;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.status-online {
  background-color: #d4edda;
  color: #155724;
}

.status-connecting {
  background-color: #fff3cd;
  color: #856404;
}

.status-offline {
  background-color: #f8d7da;
  color: #721c24;
}

.status-fault {
  background-color: #f8d7da;
  color: #721c24;
}

.status-disabled {
  background-color: #e9ecef;
  color: #495057;
}

/* 连接信息 */
.connection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.connection-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.client-id {
  font-size: 13px;
  color: #6c757d;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

/* Host信息 */
.connection-host {
  display: flex;
  align-items: center;
  gap: 10px;
}

.host-address {
  font-size: 15px;
  color: #495057;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.tls-badge {
  font-size: 12px;
  padding: 3px 8px;
  background-color: #f0f9eb;
  color: #67c23a;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
  font-weight: 500;
}

/* 发布主题 */
.topics-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 5px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.topic-item:last-child {
  border-bottom: none;
}

.topic-item.disabled .topic-path {
  opacity: 0.6;
  color: #6c757d;
}

.topic-path {
  font-size: 14px;
  color: #495057;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 150px;
}

.topic-qos {
  font-size: 12px;
  padding: 2px 8px;
  background-color: #e9ecef;
  color: #495057;
  border-radius: 3px;
  border: 1px solid #dee2e6;
  font-weight: 500;
  flex-shrink: 0;
}

/* Topic启用/禁用按钮 */
.topic-toggle {
  font-size: 12px;
  padding: 3px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 50px;
  background-color: #28a745;
  color: white;
}

.topic-toggle:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.topic-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.topic-toggle.disabled {
  background-color: #6c757d;
}

.topic-delete {
  font-size: 12px;
  padding: 3px 8px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  background-color: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dee2e6;
  transition: all 0.2s;
}

.topic-delete:hover:not(:disabled) {
  background-color: #dc3545;
  color: white;
}

.topic-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-topics {
  color: #6c757d;
  font-style: italic;
  font-size: 14px;
  text-align: center;
  padding: 10px 0;
}

/* 操作列 */
.actions-column {
  position: sticky;
  right: 0;
  background-color: inherit;
  border-left: 2px solid #e0e0e0;
  width: 150px;
  min-width: 150px;
}

.table-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.action-link {
  color: #495057;
  text-decoration: none;
  cursor: pointer;
  font-size: 15px;
  white-space: nowrap;
  transition: all 0.2s;
  padding: 4px 4px;
  border-radius: 4px;
  font-weight: 500;
}

.action-link:hover:not(:disabled) {
  color: #3498db;
  text-decoration: underline;
  background-color: rgba(52, 152, 219, 0.05);
}

.action-link:disabled {
  color: #adb5bd;
  cursor: not-allowed;
}

.action-link:disabled:hover {
  color: #adb5bd;
  text-decoration: none;
  background-color: transparent;
}

.action-link.delete {
  color: #dc3545;
}

.action-link.delete:hover:not(:disabled) {
  color: #c82333;
  background-color: rgba(220, 53, 69, 0.05);
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
  background-color: #fafafa;
}

.empty-content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-content i {
  font-size: 60px;
  color: #dee2e6;
  margin-bottom: 15px;
}

.empty-message {
  color: #6c757d;
  font-size: 16px;
  font-weight: 500;
}

.btn-add-inline {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-add-inline:hover {
  background-color: #2980b9;
}

/* 滚动条样式 */
.topics-list::-webkit-scrollbar {
  width: 5px;
}

.topics-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.topics-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.topics-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
