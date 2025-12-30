<template>
  <MainLayout active-nav="data" user-name="管理员" @nav-change="handleNavigation">
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader :title="pageTitle" :breadcrumbs="breadcrumbs" :actions="pageActions" />

      <!-- 监控页面内容 -->
      <div class="template-content">
        <!-- 设备选择区（顶部） -->
        <div class="device-select-bar">
          <div class="device-select-header">
            <div class="select-left">
              <h3>
                <i class="fas fa-microchip"></i>
                选择监控设备
              </h3>
              <div class="device-select-box">
                <div class="select-wrapper">
                  <select
                    v-model="selectedDeviceId"
                    @change="handleDeviceChange"
                    class="device-select"
                  >
                    <option value="">请选择设备...</option>
                    <option v-for="device in devices" :key="device.id" :value="device.id">
                      {{ device.device_name || '未知设备' }} ({{ device.device_code || device.id }})
                    </option>
                  </select>
                  <i class="fas fa-chevron-down select-arrow"></i>
                </div>
                <button class="btn btn-outline" @click="refreshDeviceList" :disabled="loading">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
                  刷新
                </button>
              </div>
            </div>
            <div class="select-right">
              <div class="connection-status" :class="{ connected: isWebSocketConnected }">
                <i class="fas fa-circle"></i>
                {{ isWebSocketConnected ? '已连接' : '已断开' }}
              </div>
              <button
                class="btn btn-outline"
                @click="reconnectWebSocket"
                :disabled="isWebSocketConnected || !selectedDevice"
              >
                <i class="fas fa-plug"></i>
                {{ isWebSocketConnected ? '已连接' : '重新连接' }}
              </button>
            </div>
          </div>

          <!-- 选中的设备信息 -->
          <div v-if="selectedDevice" class="selected-device-info">
            <div class="device-info-row">
              <div class="info-item">
                <span class="info-label">设备名称:</span>
                <span class="info-value">{{ selectedDevice.device_name || '未知设备' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">设备代码:</span>
                <span class="info-value code-value">{{
                  selectedDevice.device_code || selectedDevice.id
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">协议类型:</span>
                <span class="info-value">{{
                  selectedDevice.protocol_name || selectedDevice.protocol_type?.name || '未知协议'
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">设备ID:</span>
                <span class="info-value">{{ selectedDevice.id }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 实时数据区（底部） -->
        <div class="realtime-data-area">
          <!-- 未选择设备状态 -->
          <div v-if="!selectedDevice" class="empty-state">
            <i class="fas fa-desktop fa-3x" style="margin-bottom: 20px; color: #ddd"></i>
            <h3>请选择设备</h3>
            <p>请从顶部下拉列表中选择一个设备实例进行监控</p>
          </div>

          <!-- 加载状态 -->
          <div v-else-if="loadingData" class="loading-state">
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
                <span class="data-count">({{ realtimeData.length }} 个数据点)</span>
              </h3>
              <div class="data-update" v-if="lastUpdateTime">
                最后更新: {{ formatTime(lastUpdateTime) }}
              </div>
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
  name: 'DatasMonitor',
  components: {
    MainLayout,
    PageHeader,
  },
  data() {
    return {
      pageTitle: '设备实时监控',
      breadcrumbs: [
        { title: '数据采集', link: '/data' },
        { title: '设备监控', link: '' },
      ],
      pageActions: [],

      // 设备选择相关
      devices: [],
      selectedDeviceId: '',
      selectedDevice: null,
      loading: false,

      // WebSocket相关
      isWebSocketConnected: false,
      wsUnsubscribe: null,
      currentSubscription: null, // 当前订阅的设备信息

      // 数据相关
      realtimeData: [],
      loadingData: false,
      lastUpdateTime: null,
    }
  },

  mounted() {
    this.loadDeviceList()
    // 如果有URL参数，自动选择设备
    const deviceId = this.$route.query.instanceId
    if (deviceId) {
      this.selectedDeviceId = deviceId
      // 等待设备列表加载完成后自动选择
      setTimeout(() => {
        this.handleDeviceChange()
      }, 100)
    }
  },

  beforeUnmount() {
    this.cleanupAll()
  },

  methods: {
    async loadDeviceList() {
      this.loading = true
      try {
        const response = await deviceService.getDeviceInstances()
        if (response.code === 200 && response.data?.devices) {
          this.devices = response.data.devices
        } else {
          this.$message.error('加载设备列表失败')
          this.devices = []
        }
      } catch (error) {
        console.error('加载设备列表失败:', error)
        this.$message.error('加载设备列表失败: ' + error.message)
        this.devices = []
      } finally {
        this.loading = false
      }
    },

    handleDeviceChange() {
      if (!this.selectedDeviceId) {
        // 清除选择时，先取消当前订阅
        this.unsubscribeCurrentDevice()
        this.selectedDevice = null
        this.realtimeData = []
        return
      }

      const device = this.devices.find((d) => String(d.id) === String(this.selectedDeviceId))
      if (device) {
        // 如果有当前订阅的设备，先取消订阅
        if (this.currentSubscription) {
          this.unsubscribeCurrentDevice()
        }

        // 提取设备信息
        this.selectedDevice = {
          id: device.id,
          device_name: device.device_name || '未知设备',
          device_code: device.device_code || device.id,
          protocol_name:
            device.protocol_type?.name ||
            device.protocol?.name ||
            device.protocol_name ||
            '未知协议',
          protocol_type: device.protocol_type || device.protocol,
        }

        // 设置当前订阅
        this.currentSubscription = {
          id: this.selectedDevice.id,
          code: this.selectedDevice.device_code,
        }

        this.realtimeData = []
        this.loadingData = true

        // 初始化WebSocket并订阅
        setTimeout(() => {
          this.initWebSocket()
        }, 100)
      }
    },

    // 取消当前设备的订阅
    unsubscribeCurrentDevice() {
      if (this.currentSubscription && this.isWebSocketConnected) {
        const unsubscribeMessage = {
          type: 'unsubscribe',
          device_id: Number(this.currentSubscription.id),
          device_code: this.currentSubscription.code,
          timestamp: Date.now(),
        }
        console.log('发送取消订阅消息:', unsubscribeMessage)
        wsService.send(unsubscribeMessage)
      }

      // 清理当前订阅
      this.currentSubscription = null

      // 清理WebSocket订阅
      this.cleanupWebSocketSubscription()

      // 重置WebSocket状态
      this.isWebSocketConnected = false
    },

    refreshDeviceList() {
      this.loadDeviceList()
      this.$message.info('正在刷新设备列表...')
    },

    initWebSocket() {
      if (!this.selectedDevice) return

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
      } else {
        // 如果已连接，直接发送订阅
        this.sendSubscribe()
      }
    },

    sendSubscribe() {
      if (!this.selectedDevice) return

      const message = {
        type: 'subscribe',
        device_id: Number(this.selectedDevice.id),
        device_code: this.selectedDevice.device_code,
        timestamp: Date.now(),
      }
      console.log('发送订阅消息:', message)
      wsService.send(message)
    },

    handleWebSocketConnected() {
      this.isWebSocketConnected = true
      this.$message.success('WebSocket连接成功')

      // 连接成功后发送订阅
      setTimeout(() => {
        this.sendSubscribe()
      }, 500)
    },

    handleWebSocketDisconnected() {
      this.isWebSocketConnected = false
      this.$message.warning('WebSocket连接已断开')
      this.cleanupWebSocketSubscription()
      // 断开连接时清除当前订阅
      this.currentSubscription = null
    },

    handleAllMessages(data) {
      console.log('收到WebSocket消息:', data)

      // 处理订阅响应
      if (data.type === 'subscribe_response') {
        console.log('订阅响应:', data)
        if (data.success) {
          this.$message.success('订阅成功')
        } else {
          this.$message.warning(`订阅失败: ${data.message}`)
        }
        return
      }

      // 处理取消订阅响应
      if (data.type === 'unsubscribe_response') {
        console.log('取消订阅响应:', data)
        return
      }

      // 处理设备数据
      if (data.device_id || data.device_code) {
        this.handleDeviceData(data)
      }
    },

    handleDeviceData(data) {
      if (!this.selectedDevice) return

      // 检查是否匹配当前设备
      const isMatch =
        String(data.device_id) === String(this.selectedDevice.id) ||
        String(data.device_code) === String(this.selectedDevice.device_code) ||
        String(data.device_code) === String(this.selectedDevice.id)

      if (isMatch) {
        this.lastUpdateTime = Date.now()
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
        console.error('更新实时数据失败:', error)
        this.realtimeData = []
      }
    },

    reconnectWebSocket() {
      if (!this.selectedDevice) return

      this.loadingData = true
      this.cleanupWebSocketSubscription()

      if (wsService.isConnected) {
        // 先取消当前订阅
        if (this.currentSubscription) {
          this.unsubscribeCurrentDevice()
        }
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

      // 清理事件监听
      eventBus.off(WSEvent.CONNECTED, this.handleWebSocketConnected)
      eventBus.off(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      eventBus.off(WSEvent.MESSAGE, this.handleAllMessages)
    },

    cleanupAll() {
      // 取消当前订阅
      this.unsubscribeCurrentDevice()

      // 清理WebSocket订阅
      this.cleanupWebSocketSubscription()

      // 断开WebSocket连接
      if (wsService.isConnected) {
        wsService.disconnect()
      }
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

/* 设备选择栏样式 */
.device-select-bar {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
}

.device-select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.select-left h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-select-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.select-wrapper {
  position: relative;
  min-width: 300px;
}

.device-select {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
  background: white;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
}

.select-right {
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

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 选中的设备信息 */
.selected-device-info {
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.device-info-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  color: #6c757d;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.info-value.code-value {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: white;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

/* 实时数据区域 - 复用之前的样式 */
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

.data-count {
  font-size: 14px;
  font-weight: normal;
  color: #6c757d;
}

.data-update {
  font-size: 14px;
  color: #6c757d;
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

.instances-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  font-size: 14px;
}

.instances-table tr:hover {
  background-color: #f8f9fa;
}

.instances-table td:first-child {
  color: #6c757d;
  font-weight: 400;
}

/* 统一样式类 */
.data-cell {
  font-weight: 600;
  color: #2c3e50;
}

.name-cell {
  /* 继承.data-cell样式 */
}

.code-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
}

.value-cell {
  font-size: 16px;
}

.unit-cell {
  font-weight: 400;
  color: #6c757d;
}

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
  .device-select-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .select-left,
  .select-right {
    width: 100%;
  }

  .device-select-box {
    flex-direction: column;
    align-items: stretch;
  }

  .select-wrapper {
    min-width: 100%;
  }

  .device-info-row {
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
