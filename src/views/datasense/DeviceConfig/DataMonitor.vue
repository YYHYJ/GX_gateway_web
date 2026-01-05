<template>
  <MainLayout active-nav="data" user-name="管理员" @nav-change="handleNavigation">
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader :title="pageTitle" :breadcrumbs="breadcrumbs" :actions="pageActions" />

      <!-- 监控页面内容 -->
      <div class="template-content">
        <!-- 设备信息栏（顶部） -->
        <div class="device-info-bar">
          <div class="device-header">
            <div class="device-title">
              <h2>
                <i class="fas fa-microchip"></i>
                {{ deviceInfo.name || '未知设备' }}
              </h2>
              <div class="device-subtitle">
                <span class="device-code">设备代码: {{ deviceInfo.code || '--' }}</span>
                <span class="device-protocol"
                  >设备协议: {{ deviceInfo.protocol || '未知协议' }}</span
                >
              </div>
            </div>
            <div class="device-actions">
              <div class="connection-status" :class="{ connected: isWebSocketConnected }">
                <i class="fas fa-circle"></i>
                {{ isWebSocketConnected ? '已连接' : '已断开' }}
              </div>
              <button
                class="btn btn-outline"
                @click="reconnectWebSocket"
                :disabled="isWebSocketConnected"
              >
                <i class="fas fa-plug"></i>
                {{ isWebSocketConnected ? '已连接' : '重新连接' }}
              </button>
              <button class="btn btn-outline" @click="goBack">
                <i class="fas fa-arrow-left"></i>
                返回列表
              </button>
            </div>
          </div>

          <div class="device-stats">
            <div class="stat-item">
              <span class="stat-label">数据点：</span>
              <span class="stat-value">{{ realtimeData.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最后更新：</span>
              <span class="stat-value">{{
                lastUpdateTime ? formatTime(lastUpdateTime) : '--'
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">连接状态：</span>
              <span class="stat-value" :class="deviceStatusClass">
                {{ deviceInfo.status === 'online' ? '在线' : '离线' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 实时数据区（底部） -->
        <div class="realtime-data-area">
          <!-- 加载状态 -->
          <div v-if="loadingData" class="loading-state">
            <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom: 10px"></i>
            <p>正在连接设备...</p>
          </div>

          <!-- 无数据状态 -->
          <div v-else-if="!isWebSocketConnected" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-wifi-slash"></i>
            </div>
            <h3>连接已断开</h3>
            <p>无法接收设备实时数据，请检查网络连接</p>
            <p class="hint-text">请点击顶部导航栏中的"重新连接"按钮</p>
          </div>

          <!-- 有数据 -->
          <div
            v-else-if="Array.isArray(realtimeData) && realtimeData.length > 0"
            class="data-container"
          >
            <div class="data-header">
              <h3>
                <i class="fas fa-table"></i>
                实时数据
              </h3>
            </div>

            <div class="table-container">
              <table class="instances-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>数据点名称</th>
                    <th>数据点代码</th>
                    <th>当前值</th>
                    <th>单位</th>
                    <th>原始值</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(point, index) in realtimeData" :key="point.point_code">
                    <td>{{ index + 1 }}</td>
                    <td class="data-cell name-cell">{{ getPointDisplayName(point.point_code) }}</td>
                    <td class="data-cell code-cell">
                      <code>{{ point.point_code }}</code>
                    </td>
                    <td class="data-cell value-cell">{{ point.value }}</td>
                    <td class="data-cell unit-cell">{{ point.unit || '--' }}</td>
                    <td class="data-cell raw-cell">
                      <code>{{ point.raw_value || '--' }}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 等待数据状态 -->
          <div v-else class="empty-state">
            <i class="fas fa-database fa-3x" style="margin-bottom: 20px; color: #ddd"></i>
            <h3>等待设备数据...</h3>
            <p>WebSocket已连接，正在等待设备数据</p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { wsService, eventBus, WSEvent } from '@/utils/websocket'
import { deviceService } from '@/views/datasense/DeviceConfig/services/deviceService.js'

export default {
  name: 'DataMonitor',
  components: {
    MainLayout,
    PageHeader,
  },
  data() {
    return {
      pageTitle: '数据监控',
      breadcrumbs: [
        { title: '数据采集', link: '/data' },
        { title: '设备实例', link: '/data/device/instance' },
        { title: '数据监控', link: '' },
      ],
      pageActions: [],

      deviceInfo: {
        id: null,
        name: '',
        code: '',
        protocol: '',
        status: 'offline',
      },

      isWebSocketConnected: false,
      wsUnsubscribe: null,

      realtimeData: [],
      loadingData: true,
      lastUpdateTime: null,
    }
  },

  mounted() {
    const deviceId = this.$route.query.instanceId
    if (deviceId) {
      this.initDevice(deviceId)
    } else {
      this.$message.error('未指定设备ID')
      this.goBack()
    }
  },

  beforeUnmount() {
    this.cleanupAll()
  },

  computed: {
    deviceStatusClass() {
      return {
        'status-online': this.deviceInfo.status === 'online',
        'status-offline': this.deviceInfo.status !== 'online',
      }
    },
  },

  methods: {
    async initDevice(deviceId) {
      this.loadingData = true

      try {
        // 1. 获取设备信息
        await this.loadDeviceInfo(deviceId)

        // 2. 初始化WebSocket
        this.initWebSocket()

        // 3. 发送订阅请求
        setTimeout(() => {
          this.sendSubscribe()
        }, 1000)

        // 4. 超时处理
        setTimeout(() => {
          if (this.loadingData) {
            this.loadingData = false
            this.$message.warning('加载超时，请检查设备订阅状态')
          }
        }, 10000)
      } catch (error) {
        this.$message.error('加载设备失败: ' + error.message)
        this.loadingData = false
      }
    },

    async loadDeviceInfo(deviceId) {
      const response = await deviceService.getDeviceInstances()

      if (response.code !== 200 || !response.data?.devices) {
        throw new Error('获取设备信息失败')
      }

      const device = response.data.devices.find((d) => String(d.id) === String(deviceId))

      if (!device) {
        throw new Error('设备不存在')
      }

      this.deviceInfo = {
        id: device.id,
        name: device.device_name || '未知设备',
        code: device.device_code,
        protocol: device.protocol_type?.name || '未知协议',
        status: 'online',
      }
      this.pageTitle = `数据监控 - ${this.deviceInfo.name}`
    },

    initWebSocket() {
      // 清理旧的监听器
      eventBus.off(WSEvent.CONNECTED, this.handleWebSocketConnected)
      eventBus.off(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      eventBus.off(WSEvent.MESSAGE, this.handleAllMessages)

      // 设置新的监听器
      eventBus.on(WSEvent.CONNECTED, this.handleWebSocketConnected)
      eventBus.on(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      eventBus.on(WSEvent.MESSAGE, this.handleAllMessages)

      this.isWebSocketConnected = wsService.isConnected

      // 如果未连接，尝试连接
      if (!this.isWebSocketConnected) {
        wsService.connect()
      }
    },

    sendSubscribe() {
      const message = {
        type: 'subscribe',
        device_id: Number(this.deviceInfo.id),
        device_code: this.deviceInfo.code,
      }
      wsService.send(message)
    },

    handleWebSocketConnected() {
      this.isWebSocketConnected = true
      this.deviceInfo.status = 'online'
      this.$message.success('WebSocket连接成功')

      // 连接成功后发送订阅
      setTimeout(() => {
        this.sendSubscribe()
      }, 500)
    },

    handleWebSocketDisconnected() {
      this.isWebSocketConnected = false
      this.deviceInfo.status = 'offline'
      this.$message.warning('WebSocket连接已断开')
      this.cleanupWebSocketSubscription()
    },

    handleAllMessages(data) {
      // 处理设备数据
      if (data.device_id || data.device_code) {
        this.handleDeviceData(data)
      }
    },

    handleDeviceData(data) {
      // 检查是否匹配当前设备
      const isMatch =
        String(data.device_id) === String(this.deviceInfo.id) ||
        String(data.device_code) === String(this.deviceInfo.code)

      if (isMatch) {
        this.lastUpdateTime = Date.now()
        this.deviceInfo.status = 'online'
        this.loadingData = false

        if (data.points && data.points.length > 0) {
          this.updateRealtimeData(data.points)
        }
      }
    },

    updateRealtimeData(points) {
      if (!points || !Array.isArray(points)) {
        this.realtimeData = []
        return
      }

      try {
        const newData = points.map((point, index) => ({
          point_code: String(point.point_code || point.code || `point_${index}`),
          value: point.value !== undefined ? String(point.value) : '--',
          raw_value: String(point.raw_value || point.raw || ''),
          unit: String(point.unit || ''),
          timestamp: point.timestamp || Date.now(),
        }))

        this.realtimeData = newData
      } catch (error) {
        this.realtimeData = []
      }
    },

    reconnectWebSocket() {
      this.loadingData = true

      this.cleanupWebSocketSubscription()

      if (wsService.isConnected) {
        wsService.disconnect()
      }

      setTimeout(() => {
        this.initWebSocket()
        wsService.connect()
      }, 1000)
    },

    cleanupWebSocketSubscription() {
      if (this.wsUnsubscribe) {
        this.wsUnsubscribe()
        this.wsUnsubscribe = null
      }
    },

    cleanupAll() {
      this.cleanupWebSocketSubscription()

      eventBus.off(WSEvent.CONNECTED, this.handleWebSocketConnected)
      eventBus.off(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      eventBus.off(WSEvent.MESSAGE, this.handleAllMessages)
    },

    getPointDisplayName(pointCode) {
      if (!pointCode) return '未知'
      const parts = pointCode.split('.')
      return parts.length >= 2 ? parts[parts.length - 1] : pointCode
    },

    formatTime(timestamp) {
      if (!timestamp) return '--'
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },

    goBack() {
      this.$router.push({ name: 'DeviceInstance' })
    },

    handleNavigation(navId) {
      // 导航处理
    },
  },
}
</script>

<style scoped>
.content-area {
  padding: 0;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.template-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.device-info-bar {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.device-title h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.device-subtitle {
  display: flex;
  gap: 16px;
  align-items: center;
}

.device-code,
.device-protocol {
  font-size: 14px;
  color: #6c757d;
}

.device-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6c757d;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.connection-status.connected {
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.connection-status i {
  font-size: 8px;
}

.btn-outline {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.device-stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-value.status-online {
  color: #28a745;
}

.stat-value.status-offline {
  color: #6c757d;
}

.realtime-data-area {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-state i {
  margin-bottom: 20px;
  opacity: 0.5;
  color: #007bff;
}

.empty-icon {
  font-size: 64px;
  color: #dc3545;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 600;
  color: #495057;
}

.empty-state p {
  margin: 0 0 8px 0;
  color: #6c757d;
  font-size: 14px;
  max-width: 400px;
  line-height: 1.5;
}

.hint-text {
  color: #28a745 !important;
  font-weight: 500;
  font-size: 13px !important;
  margin-top: 5px !important;
}

.data-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.data-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-container {
  overflow-x: auto;
  width: 100%;
  position: relative;
  flex: 1;
}

.instances-table {
  width: 100%;
  border-collapse: collapse;
}

.instances-table th {
  background-color: #f8f9fa;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
  font-size: 14px;
}

/* 表格单元格基础样式 */
.instances-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  font-size: 14px;
}

.instances-table tr:hover {
  background-color: #f8f9fa;
}

/* 序号列特殊样式 */
.instances-table td:first-child {
  color: #6c757d;
  font-weight: 400;
}

/* 统一样式类 */
.data-cell {
  font-weight: 600;
  color: #2c3e50;
}

/* 数据点名称单元格 */
.name-cell {
  /* 继承.data-cell样式 */
}

/* 数据点代码单元格 */
.code-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
}

/* 当前值单元格 */
.value-cell {
  font-size: 16px;
}

/* 单位单元格 */
.unit-cell {
  font-weight: 400;
  color: #6c757d;
}

/* 原始值单元格 */
.raw-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
}

/* 覆盖code标签的浏览器默认样式 */
.code-cell code,
.raw-cell code {
  font-family: inherit !important;
  font-weight: inherit !important;
  color: inherit !important;
  background: none !important;
  padding: 0 !important;
  border: none !important;
  font-size: inherit !important;
}

@media (max-width: 768px) {
  .device-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .device-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .device-stats {
    flex-direction: column;
    gap: 12px;
  }

  .data-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
