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
                选择设备实例
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
                <div class="device-actions">
                  <button class="btn btn-outline" @click="refreshDeviceList" :disabled="loading">
                    <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
                    刷新
                  </button>
                  <button
                    class="btn btn-outline debug-btn"
                    :class="{ active: isDebugMode }"
                    @click="toggleDebugMode"
                    :disabled="!selectedDevice || loading || settingDebugFlag"
                  >
                    <i class="fas fa-bug"></i>
                    <template v-if="settingDebugFlag">
                      <i class="fas fa-spinner fa-spin"></i>
                      设置中...
                    </template>
                    <template v-else>
                      {{ isDebugMode ? '关闭调试' : '调试模式' }}
                    </template>
                  </button>
                </div>
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
                :disabled="isWebSocketConnected || !selectedDevice || loadingData"
              >
                <i class="fas fa-plug"></i>
                {{ isWebSocketConnected ? '已连接' : '重新连接' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 主内容区域：调试日志 + 实时监控 -->
        <div class="main-content-area" v-if="selectedDevice">
          <!-- 调试日志区域（左侧1/3） -->
          <div class="debug-log-area">
            <div class="debug-log-header">
              <div class="log-title">
                <i class="fas fa-terminal"></i>
                <span>调试日志</span>
                <span class="debug-badge" v-if="isDebugMode">ON</span>
              </div>
              <div class="log-controls">
                <span class="log-count" v-if="debugLogs.length > 0">
                  {{ debugLogs.length }} 条
                  <span v-if="totalDebugLogs > debugLogs.length" class="log-limit-hint">
                    (显示最近 {{ maxLogsToShow }} 条)
                  </span>
                </span>
                <button
                  class="btn-outline"
                  @click="toggleAutoRefreshDebug"
                  :class="{ 'btn-auto-refresh-active': autoRefreshEnabled }"
                  :disabled="!isDebugMode"
                >
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': autoRefreshEnabled }"></i>
                  {{ autoRefreshEnabled ? '自动刷新中' : '自动刷新' }}
                </button>
                <button
                  class="btn-clear-log"
                  @click="clearDebugLog"
                  title="清空日志"
                  :disabled="debugLogs.length === 0"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="debug-log-content" ref="debugLogContainer" @scroll="handleDebugLogScroll">
              <!-- 日志项 -->
              <div
                v-for="(log, index) in debugLogs"
                :key="`${log.timestamp}-${index}`"
                class="log-item"
                :class="getDebugLogLevelClass(log)"
              >
                <div class="log-header">
                  <span class="log-time">{{ log.timestamp }}</span>
                  <span class="log-level">{{ log.level }}</span>
                  <span class="log-module" v-if="log.module"> [{{ log.module }}] </span>
                </div>
                <div class="log-content">{{ log.message }}</div>
              </div>

              <!-- 空状态 -->
              <div v-if="debugLogs.length === 0 && !isLoadingDebugLogs" class="no-logs">
                <i class="fas fa-info-circle"></i>
                <p v-if="!isDebugMode">调试模式关闭</p>
                <p v-else>暂无调试日志</p>
              </div>

              <!-- 加载中 -->
              <div v-if="isLoadingDebugLogs" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> 正在加载调试日志...
              </div>

              <!-- 日志过多提示 -->
              <div v-if="totalDebugLogs > debugLogs.length" class="log-limit-notice">
                <i class="fas fa-info-circle"></i>
                仅显示最近 {{ maxLogsToShow }} 条日志，共 {{ totalDebugLogs }} 条
              </div>
            </div>
            <div class="debug-log-footer">
              <span class="log-update-time">
                最后更新: {{ formatTime(lastDebugLogUpdate || Date.now()) }}
              </span>
              <div class="debug-log-controls" v-if="isDebugMode">
                <button class="btn btn-sm btn-primary" @click="scrollToBottomDebugLog">
                  <i class="fas fa-arrow-down"></i> 最新
                </button>
                <button class="btn btn-sm btn-secondary" @click="exportDebugLogs">
                  <i class="fas fa-download"></i> 导出
                </button>
              </div>
            </div>
          </div>

          <!-- 实时监控区域（右侧2/3） -->
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
            </div>

            <!-- 有数据 -->
            <div
              v-else-if="Array.isArray(realtimeData) && realtimeData.length > 0"
              class="data-container"
            >
              <div class="data-header">
                <div class="data-title">
                  <i class="fas fa-table"></i>
                  <h3>实时监控</h3>
                  <span class="data-count">{{ realtimeData.length }} 个数据点</span>
                  <span class="writable-count" v-if="writablePointsCount > 0">
                    ({{ writablePointsCount }} 个可写)
                  </span>
                </div>
                <div class="data-controls">
                  <div class="data-update" v-if="lastUpdateTime">
                    更新: {{ formatTime(lastUpdateTime) }}
                  </div>
                  <button
                    class="btn btn-sm btn-refresh-data"
                    @click="refreshData"
                    :disabled="loadingData"
                  >
                    <i class="fas fa-redo" :class="{ 'fa-spin': loadingData }"></i>
                  </button>
                </div>
              </div>

              <div class="table-container">
                <table class="instances-table">
                  <thead>
                    <tr>
                      <th width="40">序号</th>
                      <th width="200">数据点代码</th>
                      <th width="120">当前值</th>
                      <th width="80">单位</th>
                      <th width="140">原始值</th>
                      <th width="120" v-if="hasWritablePoints">写入操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(point, index) in realtimeData" :key="point.point_code">
                      <td class="index-cell">{{ index + 1 }}</td>
                      <td class="code-cell">
                        <span class="code-text">{{ point.point_code }}</span>
                      </td>
                      <td class="value-cell">
                        <span :class="{ 'readonly-value': !point.writable }">
                          {{ point.value }}
                        </span>
                      </td>
                      <td class="unit-cell">{{ point.unit || '--' }}</td>
                      <td class="raw-cell">
                        <span class="raw-text">{{ point.raw_value || '--' }}</span>
                      </td>
                      <td class="write-cell" v-if="point.writable">
                        <div class="write-operation">
                          <input
                            v-model="writeValues[point.point_code]"
                            type="text"
                            class="write-input"
                            placeholder="新值"
                            @keyup.enter="writeValue(point.point_code)"
                            size="6"
                            :disabled="writing[point.point_code]"
                          />
                          <button
                            class="btn-write"
                            @click="writeValue(point.point_code)"
                            :disabled="!writeValues[point.point_code] || writing[point.point_code]"
                            :title="'写入 ' + point.point_code"
                          >
                            <i
                              class="fas fa-paper-plane"
                              :class="{ 'fa-spin': writing[point.point_code] }"
                            ></i>
                          </button>
                        </div>
                      </td>
                      <td v-else class="readonly-cell">
                        <span class="readonly-text" title="该点位只读">只读</span>
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

        <!-- 未选择设备状态 -->
        <div v-else class="empty-state full-height">
          <i class="fas fa-desktop fa-3x" style="margin-bottom: 20px; color: #ddd"></i>
          <h3>请选择设备</h3>
          <p>请从顶部下拉列表中选择一个设备实例进行监控</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { wsService } from '@/utils/websocket' // 只导入 wsService
import { WSEvent } from '@/utils/websocket' // 从同一模块导入
import { deviceService } from '@/views/datasense/DeviceConfig/services/deviceService.js'
import axios from 'axios'

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
        { title: '实时监控', link: '' },
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
      currentSubscription: null,

      // 数据相关
      realtimeData: [],
      loadingData: false,
      lastUpdateTime: null,

      // 调试模式相关
      isDebugMode: false,
      settingDebugFlag: false,

      // 调试日志数据
      debugLogs: [],
      totalDebugLogs: 0,
      maxLogsToShow: 500,
      debugLogPosition: 0,
      hasMoreDebugLogs: true,

      // 状态控制
      isLoadingDebugLogs: false,
      autoRefreshEnabled: false,
      autoRefreshTimer: null,
      lastDebugLogUpdate: null,

      // UI控制
      isDebugLogAtBottom: false,

      // 写入操作相关
      writeValues: {},
      writing: {},
    }
  },

  mounted() {
    this.loadDeviceList()
    const deviceId = this.$route.query.instanceId
    if (deviceId) {
      this.selectedDeviceId = deviceId
      setTimeout(() => {
        this.handleDeviceChange()
      }, 100)
    }

    // 添加调试功能到控制台
    window.debugWS = this.debugWebSocketStatus
    console.log('调试命令已注册: debugWS()')
  },

  beforeUnmount() {
    this.cleanupAll()
    this.stopAutoRefreshDebug()
  },

  computed: {
    writablePointsCount() {
      if (!this.realtimeData || !Array.isArray(this.realtimeData)) return 0
      return this.realtimeData.filter((point) => point.writable).length
    },

    hasWritablePoints() {
      return this.writablePointsCount > 0
    },
  },

  watch: {
    isDebugMode(newVal) {
      if (newVal) {
        this.initializeDebugLogs()
      } else {
        this.stopAutoRefreshDebug()
        this.debugLogs = []
        this.totalDebugLogs = 0
      }
    },
  },

  methods: {
    // 加载设备列表
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

    // 设备选择变化处理
    handleDeviceChange() {
      if (!this.selectedDeviceId) {
        this.unsubscribeCurrentDevice()
        this.selectedDevice = null
        this.realtimeData = []
        this.writeValues = {}
        this.isDebugMode = false
        this.settingDebugFlag = false
        return
      }

      const device = this.devices.find((d) => String(d.id) === String(this.selectedDeviceId))
      if (device) {
        if (this.currentSubscription) {
          this.unsubscribeCurrentDevice()
        }

        this.selectedDevice = {
          id: device.id,
          device_name: device.device_name || '未知设备',
          device_code: device.device_code || device.id,
        }

        this.currentSubscription = {
          id: this.selectedDevice.id,
          code: this.selectedDevice.device_code,
        }

        this.realtimeData = []
        this.writeValues = {}
        this.loadingData = true
        this.isDebugMode = false
        this.stopAutoRefreshDebug()
        this.debugLogs = []
        this.totalDebugLogs = 0

        console.log('[组件] 开始初始化WebSocket，当前连接状态:', wsService.isConnected)

        // 直接初始化
        this.initWebSocket()

        // 如果已连接，发送订阅
        if (wsService.isConnected) {
          setTimeout(() => {
            this.sendSubscribe()
          }, 100)
        }
      }
    },

    // 取消当前设备的订阅
    unsubscribeCurrentDevice() {
      if (this.currentSubscription && wsService.isConnected) {
        const unsubscribeMessage = {
          type: 'unsubscribe',
          device_id: Number(this.currentSubscription.id),
          device_code: this.currentSubscription.code,
          timestamp: Date.now(),
        }
        wsService.send(unsubscribeMessage)
      }

      this.currentSubscription = null
      this.cleanupWebSocketSubscription()
      this.isWebSocketConnected = false
    },

    // 初始化WebSocket
    initWebSocket() {
      if (!this.selectedDevice) return

      console.log('[组件] 初始化WebSocket监听器')

      // 清理旧的监听器 - 使用 wsService
      wsService.off(WSEvent.CONNECTED, this.handleWebSocketConnected)
      wsService.off(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      wsService.off(WSEvent.MESSAGE, this.handleAllMessages)

      // 设置新的监听器 - 使用 wsService
      wsService.on(WSEvent.CONNECTED, this.handleWebSocketConnected)
      wsService.on(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      wsService.on(WSEvent.MESSAGE, this.handleAllMessages)

      this.isWebSocketConnected = wsService.isConnected

      console.log('[组件] WebSocket监听器已设置，当前连接状态:', this.isWebSocketConnected)

      if (!this.isWebSocketConnected) {
        console.log('[组件] 未连接，开始连接...')
        wsService.connect()
      } else {
        console.log('[组件] 已连接，准备发送订阅...')
        this.sendSubscribe()
      }
    },

    // 发送订阅消息
    sendSubscribe() {
      if (!this.selectedDevice) {
        console.log('[组件] 没有选择设备，不发送订阅')
        return
      }

      console.log(
        '[组件] 发送订阅消息，设备ID:',
        this.selectedDevice.id,
        '设备代码:',
        this.selectedDevice.device_code,
      )

      const message = {
        type: 'subscribe',
        device_id: Number(this.selectedDevice.id),
        device_code: this.selectedDevice.device_code,
        timestamp: Date.now(),
      }

      const success = wsService.send(message)
      console.log('[组件] 订阅消息发送结果:', success ? '✅ 成功' : '❌ 失败')

      // 如果发送失败，尝试通过subscribe方法订阅
      if (!success) {
        console.log('[组件] 订阅消息发送失败，尝试通过wsService.subscribe')
        if (this.wsUnsubscribe) {
          this.wsUnsubscribe()
        }
        this.wsUnsubscribe = wsService.subscribe(
          String(this.selectedDevice.id),
          this.handleDeviceData,
        )
      }
    },

    // WebSocket连接成功
    handleWebSocketConnected() {
      console.log('[组件] WebSocket连接成功')
      this.isWebSocketConnected = true
      this.$message.success('WebSocket连接成功')

      setTimeout(() => {
        this.sendSubscribe()
      }, 500)
    },

    // WebSocket断开连接
    handleWebSocketDisconnected() {
      console.log('[组件] WebSocket连接断开')
      this.isWebSocketConnected = false
      this.$message.warning('WebSocket连接已断开')

      this.cleanupWebSocketSubscription()
      this.currentSubscription = null
    },

    // 处理所有WebSocket消息
    handleAllMessages(data) {
      console.log('[组件] 收到WebSocket消息:', data)

      if (data.type === 'subscribe_response') {
        console.log('[组件] 收到订阅响应:', data)
        if (data.success) {
          this.$message.success('订阅成功')
          this.loadingData = false
        } else {
          this.$message.warning(`订阅失败: ${data.message}`)
          this.loadingData = false
        }
        return
      }

      if (data.device_id || data.device_code) {
        console.log('[组件] 收到设备数据，开始处理')
        this.handleDeviceData(data)
      } else {
        console.log('[组件] 收到非设备数据消息:', data)
      }
    },

    // 处理设备数据
    handleDeviceData(data) {
      if (!this.selectedDevice) {
        console.log('[组件] 没有选择设备，忽略数据')
        return
      }

      console.log('[组件] 处理设备数据，当前设备:', {
        选择设备ID: this.selectedDevice.id,
        选择设备代码: this.selectedDevice.device_code,
        收到设备ID: data.device_id,
        收到设备代码: data.device_code,
      })

      const isMatch =
        String(data.device_id) === String(this.selectedDevice.id) ||
        String(data.device_code) === String(this.selectedDevice.device_code)

      console.log('[组件] 设备匹配结果:', isMatch ? '✅ 匹配' : '❌ 不匹配')

      if (isMatch) {
        console.log('[组件] 数据匹配成功，更新界面')
        this.lastUpdateTime = Date.now()
        this.loadingData = false

        if (data.points && data.points.length > 0) {
          console.log('[组件] 有数据点，数量:', data.points.length)
          this.updateRealtimeData(data.points)
        } else {
          console.log('[组件] 没有数据点')
          this.realtimeData = []
        }
      } else {
        console.log('[组件] 设备不匹配，忽略数据')
      }
    },

    // 更新实时数据
    updateRealtimeData(points) {
      if (!points || !Array.isArray(points)) {
        this.realtimeData = []
        return
      }

      try {
        this.realtimeData = points.map((point, index) => ({
          point_code: String(point.point_code || point.code || `point_${index}`),
          value: point.value !== undefined ? String(point.value) : '--',
          raw_value: String(point.raw_value || point.raw || ''),
          unit: String(point.unit || ''),
          writable: Boolean(point.writable),
          timestamp: point.timestamp || Date.now(),
        }))
      } catch (error) {
        console.error('更新实时数据失败:', error)
        this.realtimeData = []
      }
    },

    // 清理WebSocket订阅
    cleanupWebSocketSubscription() {
      console.log('[组件] 清理WebSocket订阅')

      if (this.wsUnsubscribe) {
        this.wsUnsubscribe()
        this.wsUnsubscribe = null
      }

      // 使用 wsService 取消监听
      wsService.off(WSEvent.CONNECTED, this.handleWebSocketConnected)
      wsService.off(WSEvent.DISCONNECTED, this.handleWebSocketDisconnected)
      wsService.off(WSEvent.MESSAGE, this.handleAllMessages)
    },

    // 重新连接WebSocket
    reconnectWebSocket() {
      if (!this.selectedDevice) return

      this.loadingData = true
      this.cleanupWebSocketSubscription()

      if (wsService.isConnected) {
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

    // 刷新设备列表
    refreshDeviceList() {
      this.loadDeviceList()
      this.$message.info('正在刷新设备列表...')
    },

    // 刷新数据
    refreshData() {
      if (!this.selectedDevice || !this.isWebSocketConnected) return

      this.loadingData = true
      this.sendSubscribe()
      this.$message.info('正在刷新设备数据...')
    },

    // ============== 调试模式相关方法 ==============

    // 调试模式切换
    async toggleDebugMode() {
      if (!this.selectedDevice || this.settingDebugFlag) return

      const newDebugMode = !this.isDebugMode
      this.settingDebugFlag = true

      try {
        const response = await axios.post('/api/change_flag', {
          debug_enabled: newDebugMode,
          device_codes: [this.selectedDevice.device_code],
        })

        if (response.data.code === 200) {
          this.isDebugMode = newDebugMode

          if (newDebugMode) {
            this.$message.success('调试模式已开启')
            this.initializeDebugLogs()
          } else {
            this.$message.success('调试模式已关闭')
            this.stopAutoRefreshDebug()
            this.debugLogs = []
            this.totalDebugLogs = 0
          }
        } else {
          this.$message.error(`设置调试模式失败: ${response.data.message}`)
        }
      } catch (error) {
        console.error('设置调试模式失败:', error)
        let errorMessage = '设置调试模式失败'
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = `设置调试模式失败: ${error.response.data.message}`
        } else if (error.message) {
          errorMessage = `设置调试模式失败: ${error.message}`
        }
        this.$message.error(errorMessage)
      } finally {
        this.settingDebugFlag = false
      }
    },

    // ============== 调试日志相关方法 ==============

    // 初始化调试日志
    async initializeDebugLogs() {
      if (!this.isDebugMode) return

      this.stopAutoRefreshDebug()
      this.isLoadingDebugLogs = true

      try {
        this.debugLogPosition = 0
        this.debugLogs = []
        this.totalDebugLogs = 0
        this.hasMoreDebugLogs = true

        await this.fetchDebugLogs(0, 1000)

        this.$nextTick(() => {
          this.scrollToBottomDebugLog()
        })
      } catch (error) {
        console.error('初始化调试日志失败:', error)
        this.$message.error('加载调试日志失败')
      } finally {
        this.isLoadingDebugLogs = false
      }
    },

    // 获取调试日志
    async fetchDebugLogs(startPosition, maxLines = 1000) {
      try {
        const params = {
          filename: 'mddebug.log',
          lastPosition: startPosition,
          maxLines: maxLines,
        }

        const response = await axios.get('/api/logs/realtime', { params })

        if (response.data && response.data.logs) {
          const newLogs = response.data.logs
          const parsedLogs = this.parseLogs(newLogs)

          this.totalDebugLogs += parsedLogs.length

          if (startPosition === 0) {
            this.debugLogs = this.limitLogs(parsedLogs)
          } else {
            const allLogs = [...this.debugLogs, ...parsedLogs]
            this.debugLogs = this.limitLogs(allLogs)
          }

          this.debugLogPosition = response.data.newPosition
          this.hasMoreDebugLogs = newLogs.length >= maxLines
        }

        this.lastDebugLogUpdate = Date.now()
        return response.data
      } catch (error) {
        console.error('获取调试日志失败:', error)
        throw error
      }
    },

    // 限制日志显示数量
    limitLogs(logs) {
      if (logs.length <= this.maxLogsToShow) {
        return logs
      }
      return logs.slice(-this.maxLogsToShow)
    },

    // 解析日志
    parseLogs(logs) {
      return logs.map((rawLog) => {
        const components = this.parseLogComponents(rawLog)
        return {
          raw: rawLog,
          timestamp: components.time,
          level: components.level,
          module: components.module,
          message: components.message,
        }
      })
    },

    // 解析日志组件
    parseLogComponents(log) {
      const timeMatch = log.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
      if (!timeMatch) {
        return {
          time: '',
          level: 'INFO',
          module: '',
          message: log,
        }
      }

      const time = timeMatch[1]
      const afterTime = log.substring(timeMatch[0].length).trim()

      let level = 'INFO'
      let position = 0

      if (afterTime.startsWith('[')) {
        const levelEnd = afterTime.indexOf(']')
        if (levelEnd !== -1) {
          const levelContent = afterTime.substring(1, levelEnd)
          const normalizedLevel = levelContent.toUpperCase()
          if (['INFO', 'WARN', 'ERROR', 'DEBUG'].includes(normalizedLevel)) {
            level = normalizedLevel
          }
          position = levelEnd + 1
        }
      }

      let remaining = afterTime.substring(position).trim()

      let module = ''
      if (remaining.startsWith('[')) {
        const moduleEnd = remaining.indexOf(']')
        if (moduleEnd !== -1) {
          const moduleContent = remaining.substring(1, moduleEnd)
          if (moduleContent.length <= 50 && /^[A-Za-z0-9_\-\.]+$/.test(moduleContent)) {
            module = moduleContent
            remaining = remaining.substring(moduleEnd + 1).trim()
          }
        }
      }

      const message = remaining.trim()

      return {
        time,
        level,
        module,
        message,
      }
    },

    // 切换自动刷新
    toggleAutoRefreshDebug() {
      this.autoRefreshEnabled = !this.autoRefreshEnabled

      if (this.autoRefreshEnabled) {
        this.startAutoRefreshDebug()
      } else {
        this.stopAutoRefreshDebug()
      }
    },

    // 开始自动刷新调试日志
    startAutoRefreshDebug() {
      this.stopAutoRefreshDebug()

      this.autoRefreshTimer = setInterval(async () => {
        if (this.isLoadingDebugLogs || !this.isDebugMode) return

        try {
          await this.fetchDebugLogs(this.debugLogPosition, 1000)

          if (this.isDebugLogAtBottom) {
            this.$nextTick(() => {
              this.scrollToBottomDebugLog()
            })
          }
        } catch (error) {
          console.error('自动刷新调试日志失败:', error)
        }
      }, 3000)
    },

    // 停止自动刷新调试日志
    stopAutoRefreshDebug() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer)
        this.autoRefreshTimer = null
      }
    },

    // 清空调试日志
    clearDebugLog() {
      this.debugLogs = []
      this.totalDebugLogs = 0
      this.$message.info('调试日志已清空')
    },

    // 处理调试日志滚动
    handleDebugLogScroll() {
      const container = this.$refs.debugLogContainer
      if (!container) return

      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      this.isDebugLogAtBottom = scrollHeight - scrollTop - clientHeight < 50
    },

    // 滚动到底部
    scrollToBottomDebugLog() {
      const container = this.$refs.debugLogContainer
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    },

    // 获取日志级别样式类
    getDebugLogLevelClass(log) {
      const level = log.level
      switch (level) {
        case 'INFO':
          return 'level-info'
        case 'WARN':
          return 'level-warning'
        case 'ERROR':
          return 'level-error'
        case 'DEBUG':
          return 'level-debug'
        default:
          return 'level-info'
      }
    },

    // 导出调试日志
    async exportDebugLogs() {
      try {
        const response = await axios({
          url: '/api/file/download',
          method: 'GET',
          params: {
            filename: 'mddebug.log',
            type: 'log',
          },
          responseType: 'blob',
        })

        const blob = response.data
        const contentDisposition = response.headers['content-disposition']
        let filename = 'debug_logs.zip'

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+?)"?$/i)
          if (match && match[1]) {
            filename = decodeURIComponent(match[1])
          }
        }

        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)

        this.$message.success('调试日志导出成功')
      } catch (error) {
        console.error('导出调试日志失败:', error)
        this.$message.error('导出调试日志失败')
      }
    },

    // ============== 写入操作相关 ==============

    // 写入数据
    async writeValue(pointCode) {
      const value = this.writeValues[pointCode]
      if (!value || !this.selectedDevice) return

      if (value.trim() === '') {
        this.$message.warning('请输入要写入的值')
        return
      }

      // 修复：使用正确的方式设置写入状态
      this.writing = {
        ...this.writing,
        [pointCode]: true,
      }

      try {
        const requestData = {
          device_code: this.selectedDevice.device_code,
          point_code: pointCode,
          point_value: value.trim(),
        }

        const response = await axios.post('/api/device/write_point_value', requestData)

        if (response.data.code === 200) {
          this.$message.success(response.data.message || '写入请求已提交')

          // 修复：清空输入框
          this.writeValues = {
            ...this.writeValues,
            [pointCode]: '',
          }

          // 写入成功后，刷新数据以获取最新值
          setTimeout(() => {
            this.refreshData()
          }, 500)
        } else {
          throw new Error(response.data.message || '写入请求失败')
        }
      } catch (error) {
        console.error('写入数据失败:', error)
        let errorMessage = '写入失败'
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = `写入失败: ${error.response.data.message}`
        } else if (error.message) {
          errorMessage = `写入失败: ${error.message}`
        }

        this.$message.error(errorMessage)
      } finally {
        // 修复：恢复写入状态
        this.writing = {
          ...this.writing,
          [pointCode]: false,
        }
      }
    },

    // ============== 工具方法 ==============

    // 清理所有资源
    cleanupAll() {
      this.unsubscribeCurrentDevice()
      this.cleanupWebSocketSubscription()
      this.stopAutoRefreshDebug()

      if (wsService.isConnected) {
        wsService.disconnect()
      }
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '--'
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },

    // 调试函数：检查WebSocket状态
    debugWebSocketStatus() {
      console.group('[组件] WebSocket状态调试')
      console.log('wsService:', wsService)
      console.log('连接状态:', {
        isConnected: wsService.isConnected,
        isConnecting: wsService.isConnecting,
        readyState: wsService.ws?.readyState,
      })
      console.log('当前订阅:', wsService.subscribers)
      console.log('当前设备ID:', this.selectedDevice?.id)
      console.log('当前设备代码:', this.selectedDevice?.device_code)
      console.log('当前订阅列表:', Array.from(wsService.subscribers.keys()))
      console.log('wsService.getStatus():', wsService.getStatus())
      console.groupEnd()
    },

    // 导航处理
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
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
}

.device-select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-left h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-left h3 i {
  color: #007bff;
}

.device-select-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-wrapper {
  position: relative;
  min-width: 280px;
}

.device-select {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
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
  font-size: 12px;
}

.device-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.select-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 4px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.connection-status.connected {
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  border-color: rgba(40, 167, 69, 0.2);
}

.connection-status i {
  font-size: 8px;
}

.btn-outline {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.debug-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.debug-btn.active:hover {
  background: #0056b3;
  border-color: #0056b3;
}

/* 主内容区域：左右分布 */
.main-content-area {
  display: flex;
  flex: 1;
  min-height: 500px;
  background: #f8f9fa;
}

/* 调试日志区域（左侧1/3） */
.debug-log-area {
  width: 33.333%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e0e0e0;
}

.debug-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.debug-badge {
  background: #28a745;
  color: white;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-count {
  font-size: 12px;
  color: #6c757d;
  background: rgba(108, 117, 125, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.log-limit-hint {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.btn-clear-log {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.btn-clear-log:hover:not(:disabled) {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.btn-clear-log:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.debug-log-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: white;
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 600px; /* 限制高度 */
}

.no-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
  padding: 40px 20px;
}

.no-logs i {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-logs p {
  margin: 0;
  font-size: 14px;
}

.loading-indicator {
  text-align: center;
  padding: 16px;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-indicator i {
  font-size: 16px;
}

.log-limit-notice {
  text-align: center;
  padding: 12px;
  color: #6c757d;
  font-size: 12px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.log-limit-notice i {
  font-size: 14px;
}

/* 日志项样式 */
.log-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  border-left: 3px solid transparent;
  transition: background-color 0.3s;
}

.log-item:hover {
  background-color: #f8f9fa;
}

.log-item.level-info {
  border-left-color: #28a745;
}

.log-item.level-warning {
  border-left-color: #ffc107;
}

.log-item.level-error {
  border-left-color: #dc3545;
}

.log-item.level-debug {
  border-left-color: #6c757d;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.log-time {
  color: #333;
  font-size: 11px;
  font-weight: 600;
  min-width: 140px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.log-level {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.level-info .log-level {
  background-color: #d4edda;
  color: #155724;
}

.level-warning .log-level {
  background-color: #fff3cd;
  color: #856404;
}

.level-error .log-level {
  background-color: #f8d7da;
  color: #721c24;
}

.level-debug .log-level {
  background-color: #e2e3e5;
  color: #383d41;
}

.log-module {
  color: #555;
  font-size: 10px;
  font-weight: 500;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.log-content {
  color: #222;
  word-break: break-all;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.4;
}

/* 调试日志底部控制 */
.debug-log-footer {
  padding: 6px 16px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-update-time {
  font-size: 11px;
  color: #6c757d;
}

.debug-log-controls {
  display: flex;
  gap: 8px;
}

.debug-log-controls .btn {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-auto-refresh-active {
  background: #17a2b8;
  color: white;
  border-color: #17a2b8;
}

.debug-log-content::-webkit-scrollbar {
  width: 6px;
}

.debug-log-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.debug-log-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.debug-log-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 实时监控区域（右侧2/3） */
.realtime-data-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: white;
}

/* 数据表格区域 */
.data-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.data-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.data-title i {
  color: #007bff;
}

.data-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.data-count {
  font-size: 13px;
  font-weight: normal;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 可写计数 */
.writable-count {
  font-size: 13px;
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.data-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.data-update {
  font-size: 13px;
  color: #6c757d;
}

.btn-refresh-data {
  padding: 4px 8px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
}

.btn-refresh-data:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.btn-refresh-data:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}

.instances-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
}

.instances-table th {
  background-color: #f8f9fa;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
  font-size: 13px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.instances-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  font-size: 13px;
  vertical-align: middle;
}

.instances-table tr:hover {
  background-color: #f8fafc;
}

.instances-table tr:last-child td {
  border-bottom: none;
}

.index-cell {
  color: #6c757d;
  text-align: center;
  font-size: 12px;
}

.code-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.code-text {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #2c3e50;
  font-weight: 600;
}

.value-cell {
  font-weight: 600;
  color: #2c3e50;
}

.readonly-value {
  color: #6c757d;
  font-style: italic;
}

.unit-cell {
  color: #6c757d;
  text-align: center;
}

.raw-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.raw-text {
  display: inline-block;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.write-cell {
  width: 160px;
}

.write-operation {
  display: flex;
  align-items: center;
  gap: 6px;
}

.write-input {
  width: 70px;
  padding: 5px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.write-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.write-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.btn-write {
  padding: 5px 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-write:hover:not(:disabled) {
  background: #218838;
}

.btn-write:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.readonly-cell {
  width: 160px;
  text-align: center;
}

.readonly-text {
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px dashed #dee2e6;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 状态样式 */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  color: #dc3545;
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
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

.full-height {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content-area {
    flex-direction: column;
  }

  .debug-log-area {
    width: 100%;
    min-width: auto;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    max-height: 300px;
  }

  .debug-log-content {
    max-height: 250px;
  }

  .realtime-data-area {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .device-select-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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
    margin-bottom: 8px;
  }

  .device-actions {
    width: 100%;
    justify-content: stretch;
  }

  .device-actions button {
    flex: 1;
  }

  .select-right {
    justify-content: space-between;
  }

  .data-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .data-controls {
    width: 100%;
    justify-content: space-between;
  }

  .code-text {
    max-width: 120px;
  }

  .write-cell {
    width: 140px;
  }

  .write-input {
    width: 60px;
  }

  .readonly-cell {
    width: 140px;
  }
}
</style>
