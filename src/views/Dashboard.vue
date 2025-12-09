<template>
  <!-- 仪表盘页面 -->
  <MainLayout
    active-nav="dashboard"
    system-status="normal"
    :user-info="userInfo"
    @nav-change="handleNavigation"
  >
    <div class="dashboard-vertical">
      <!-- 系统信息概览卡片 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title"><i class="fas fa-desktop"></i> 系统信息概览</h2>
          <span class="status-badge" :class="systemStatusClass">
            {{ systemStatusText }}
          </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">主机名</div>
            <div class="info-value">{{ systemInfo.hostname }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">设备型号</div>
            <div class="info-value">{{ systemInfo.device_model }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">固件版本</div>
            <div class="info-value">{{ systemInfo.system_type }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">运行时间</div>
            <div class="info-value">{{ systemInfo.uptime }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">本地时间</div>
            <div class="info-value">{{ local_time }}</div>
          </div>
        </div>
      </div>

      <!-- 硬件资源监控卡片 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title"><i class="fas fa-microchip"></i> 硬件资源监控</h2>
          <span class="status-badge" :class="hardwareStatusClass">
            {{ hardwareStatusText }}
            <span v-if="hardwarePollingActive" class="polling-indicator">
              <i class="fas fa-sync-alt fa-spin"></i>
            </span>
          </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">CPU使用率</div>
            <div class="info-value">{{ hardwareInfo.cpuUsage }}</div>
            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: hardwareInfo.cpuUsage,
                    backgroundColor: getUsageColor(hardwareInfo.cpuUsageValue),
                  }"
                ></div>
              </div>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">内存使用率</div>
            <div class="info-value">{{ hardwareInfo.memoryUsage }}</div>
            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: hardwareInfo.memoryUsage,
                    backgroundColor: getUsageColor(hardwareInfo.memoryUsageValue),
                  }"
                ></div>
              </div>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">存储使用率</div>
            <div class="info-value">{{ hardwareInfo.storageUsage }}</div>
            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: hardwareInfo.storageUsage,
                    backgroundColor: getUsageColor(hardwareInfo.storageUsageValue),
                  }"
                ></div>
              </div>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">平均负载</div>
            <div class="info-value">{{ hardwareInfo.loadAverage }}</div>
            <div class="mini-chart">
              <svg viewBox="0 0 100 40" class="chart-line">
                <polyline :points="loadAveragePoints" />
              </svg>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <div class="last-update">
            <i class="fas fa-clock"></i>
            最后更新: {{ lastHardwareUpdate }}
          </div>
          <div class="polling-controls">
            <button
              class="btn btn-sm"
              :class="hardwarePollingActive ? 'btn-warning' : 'btn-success'"
              @click="toggleHardwarePolling"
            >
              <i class="fas" :class="hardwarePollingActive ? 'fa-pause' : 'fa-play'"></i>
              {{ hardwarePollingActive ? '暂停轮询' : '开始轮询' }}
            </button>
            <button class="btn btn-sm btn-info" @click="manualRefreshHardware">
              <i class="fas fa-sync-alt"></i> 立即刷新
            </button>
          </div>
        </div>
      </div>

      <!-- 网络状态监控卡片 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title"><i class="fas fa-network-wired"></i> 网络状态监控</h2>
          <span class="status-badge status-normal">网络正常</span>
        </div>

        <div class="network-grid">
          <div class="network-interface">
            <div class="info-label">LAN接口 (eth0)</div>
            <div class="info-value">192.168.1.1/24</div>
            <div class="info-label">
              状态: <span style="color: var(--success-color)">已连接</span>
            </div>
            <div class="bandwidth-meter">
              <div class="bandwidth-label">
                <span>上行: 12.5 Mbps</span>
                <span>下行: 45.2 Mbps</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style="width: 35%; background-color: var(--secondary-color)"
                ></div>
              </div>
            </div>
          </div>

          <div class="network-interface">
            <div class="info-label">WAN接口 (eth1)</div>
            <div class="info-value">10.10.15.23/16</div>
            <div class="info-label">
              状态: <span style="color: var(--success-color)">已连接</span>
            </div>
            <div class="bandwidth-meter">
              <div class="bandwidth-label">
                <span>上行: 8.2 Mbps</span>
                <span>下行: 32.7 Mbps</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style="width: 25%; background-color: var(--success-color)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="info-item" style="margin-top: 15px">
          <div class="info-label">网络连接质量</div>
          <div class="info-value">延迟: 28ms, 丢包率: 0.2%</div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import { getSystemInfo, getSystemStatus } from '@/api/system.js'

export default {
  name: 'Dashboard',
  components: {
    MainLayout,
  },
  data() {
    return {
      userInfo: {
        name: '管理员',
        avatar: '',
      },
      local_time: '',
      timer: null,
      loading: false,

      // 轮询控制
      hardwarePollingActive: true,
      hardwarePollingInterval: null,
      lastHardwareUpdate: '--:--:--',
      pollingInterval: 5000, // 5秒轮询

      // 系统信息 - 默认值设为"请求中"
      systemInfo: {
        hostname: '请求中...',
        device_model: '请求中...',
        system_type: '请求中...',
        uptime: '请求中...',
        systemStatus: 'loading',
      },

      // 硬件信息 - 默认值设为"请求中"
      hardwareInfo: {
        cpuUsage: '请求中...',
        cpuUsageValue: 0,
        memoryUsage: '请求中...',
        memoryUsageValue: 0,
        storageUsage: '请求中...',
        storageUsageValue: 0,
        storageDevice: '请求中...',
        totalStorage: '请求中...',
        loadAverage: '请求中...',
        loadAverageArray: [0, 0, 0],
        hardwareStatus: 'loading',
      },
    }
  },
  computed: {
    // 系统状态计算属性
    systemStatusClass() {
      return `status-${this.systemInfo.systemStatus}`
    },
    systemStatusText() {
      const statusMap = {
        normal: '运行正常',
        warning: '运行警告',
        error: '运行异常',
        loading: '数据加载中...',
      }
      return statusMap[this.systemInfo.systemStatus] || '未知状态'
    },

    // 硬件状态计算属性
    hardwareStatusClass() {
      return `status-${this.hardwareInfo.hardwareStatus}`
    },
    hardwareStatusText() {
      const statusMap = {
        normal: '资源正常',
        warning: '资源使用率较高',
        error: '资源异常',
        loading: '数据加载中...',
      }
      return statusMap[this.hardwareInfo.hardwareStatus] || '未知状态'
    },

    // 平均负载图表点
    loadAveragePoints() {
      if (!this.hardwareInfo.loadAverageArray || this.hardwareInfo.loadAverageArray.length !== 3) {
        return '0,35 20,30 40,20 60,25 80,15 100,10'
      }

      const points = this.hardwareInfo.loadAverageArray.map((value, index) => {
        const x = index * 20
        const y = 40 - value * 6
        return `${x},${y}`
      })
      return points.join(' ')
    },
  },
  mounted() {
    // 启动时间更新
    this.updateTime()
    this.timer = setInterval(this.updateTime, 1000)

    // 页面加载时自动请求系统信息
    this.fetchSystemInfo()

    // 启动硬件状态轮询
    this.startHardwarePolling()
  },
  beforeUnmount() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
    }
    if (this.hardwarePollingInterval) {
      clearInterval(this.hardwarePollingInterval)
    }
  },
  methods: {
    handleNavigation(navId) {
      console.log('导航到:', navId)
    },

    // 更新时间显示
    updateTime() {
      const now = new Date()
      this.local_time = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    },

    // 启动硬件状态轮询
    startHardwarePolling() {
      console.log('启动硬件状态轮询，间隔:', this.pollingInterval + 'ms')
      this.hardwarePollingActive = true

      // 立即执行一次
      this.fetchSystemStatus()

      // 设置轮询间隔
      this.hardwarePollingInterval = setInterval(() => {
        if (this.hardwarePollingActive) {
          this.fetchSystemStatus()
        }
      }, this.pollingInterval)
    },

    // 停止硬件状态轮询
    stopHardwarePolling() {
      console.log('停止硬件状态轮询')
      this.hardwarePollingActive = false
      if (this.hardwarePollingInterval) {
        clearInterval(this.hardwarePollingInterval)
        this.hardwarePollingInterval = null
      }
    },

    // 切换轮询状态
    toggleHardwarePolling() {
      if (this.hardwarePollingActive) {
        this.stopHardwarePolling()
      } else {
        this.startHardwarePolling()
      }
    },

    // 手动刷新硬件数据
    manualRefreshHardware() {
      console.log('手动刷新硬件数据')
      this.fetchSystemStatus()
    },

    // 更新最后更新时间
    updateLastUpdateTime() {
      const now = new Date()
      this.lastHardwareUpdate = now.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    },

    // 获取系统信息API
    async fetchSystemInfo() {
      this.loading = true

      try {
        console.log('开始请求系统信息...')
        const response = await getSystemInfo()
        console.log('系统信息API响应:', response)

        if (response.code === 200) {
          this.updateSystemData(response.data)
        } else {
          throw new Error(response.message || '获取系统信息失败')
        }
      } catch (error) {
        console.error('获取系统信息失败:', error)
        this.handleApiError(error, 'system')
      } finally {
        this.loading = false
      }
    },

    // 获取硬件状态API
    async fetchSystemStatus() {
      try {
        console.log('请求硬件状态...')
        const response = await getSystemStatus()
        console.log('硬件状态API响应:', response)

        if (response.code === 200) {
          this.updateHardwareData(response.data)
          this.updateLastUpdateTime() // 更新最后更新时间
        } else {
          throw new Error(response.message || '获取硬件状态失败')
        }
      } catch (error) {
        console.error('获取硬件状态失败:', error)
        this.handleApiError(error, 'hardware')
      }
    },

    // 更新系统数据
    updateSystemData(data) {
      console.log('更新系统数据:', data)
      this.systemInfo = {
        hostname: data.hostname || '未知',
        device_model: data.device_model || '未知',
        system_type: data.system_type || '未知',
        uptime: data.uptime || '未知',
        systemStatus: data.systemStatus || 'normal',
      }
    },

    // 更新硬件数据 - 修改这里，保留两位小数
    updateHardwareData(data) {
      console.log('更新硬件数据:', data)

      // 保留两位小数
      const cpuUsage = parseFloat(data.cpu_usage || 0).toFixed(2)
      const memoryUsage = parseFloat(data.memory_usage || 0).toFixed(2)
      const storageUsage = parseFloat(data.storage_usage || 0).toFixed(2)
      const loadAverage = data.load_average || [0, 0, 0]

      // 确定硬件状态（使用数值进行比较）
      const cpuUsageValue = parseFloat(cpuUsage)
      const memoryUsageValue = parseFloat(memoryUsage)
      const storageUsageValue = parseFloat(storageUsage)

      let hardwareStatus = 'normal'
      if (memoryUsageValue > 80 || cpuUsageValue > 80 || storageUsageValue > 80) {
        hardwareStatus = 'warning'
      } else if (memoryUsageValue > 90 || cpuUsageValue > 90 || storageUsageValue > 90) {
        hardwareStatus = 'error'
      }

      // 更新硬件信息
      this.hardwareInfo = {
        cpuUsage: `${cpuUsage}%`,
        cpuUsageValue: cpuUsageValue,
        memoryUsage: `${memoryUsage}%`,
        memoryUsageValue: memoryUsageValue,
        storageUsage: `${storageUsage}% (${data.total_storage || '未知'})`,
        storageUsageValue: storageUsageValue,
        storageDevice: data.storage_device || '未知',
        totalStorage: data.total_storage || '未知',
        loadAverage: loadAverage.map((v) => parseFloat(v).toFixed(2)).join(', '),
        loadAverageArray: loadAverage,
        hardwareStatus: hardwareStatus,
      }
    },

    // 处理API错误
    handleApiError(error, type = 'system') {
      console.error(`${type} API错误:`, error)

      if (type === 'hardware') {
        this.hardwareInfo = {
          cpuUsage: '请求失败',
          cpuUsageValue: 0,
          memoryUsage: '请求失败',
          memoryUsageValue: 0,
          storageUsage: '请求失败',
          storageUsageValue: 0,
          storageDevice: '请求失败',
          totalStorage: '请求失败',
          loadAverage: '请求失败',
          loadAverageArray: [0, 0, 0],
          hardwareStatus: 'error',
        }
      } else {
        this.systemInfo = {
          hostname: '请求失败',
          device_model: '请求失败',
          system_type: '请求失败',
          uptime: '请求失败',
          systemStatus: 'error',
        }
      }
    },

    // 根据使用率获取颜色
    getUsageColor(usage) {
      if (usage > 80) return 'var(--danger-color)'
      if (usage > 60) return 'var(--warning-color)'
      return 'var(--success-color)'
    },
  },
}
</script>

<style scoped>
/* 样式保持不变 */
.dashboard-vertical {
  display: flex;
  flex-direction: column;
  gap: 25px;
  max-width: 100%;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 25px;
  transition: transform 0.3s ease;
  width: 100%;
  position: relative;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
}

.card-title i {
  margin-right: 10px;
  color: var(--secondary-color);
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.polling-indicator {
  display: flex;
  align-items: center;
}

.fa-spin {
  animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.status-normal {
  background-color: rgba(46, 204, 113, 0.2);
  color: var(--success-color);
}

.status-warning {
  background-color: rgba(243, 156, 18, 0.2);
  color: var(--warning-color);
}

.status-error {
  background-color: rgba(231, 76, 60, 0.2);
  color: var(--danger-color);
}

.status-loading {
  background-color: rgba(149, 165, 166, 0.2);
  color: var(--gray-color);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: var(--gray-color);
}

.last-update {
  display: flex;
  align-items: center;
  gap: 5px;
}

.polling-controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-success {
  background-color: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.btn-warning {
  background-color: var(--warning-color);
  color: white;
  border-color: var(--warning-color);
}

.btn-info {
  background-color: var(--secondary-color);
  color: white;
  border-color: var(--secondary-color);
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.info-item {
  margin-bottom: 15px;
}

.info-label {
  font-size: 14px;
  color: var(--gray-color);
  margin-bottom: 5px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
}

.progress-container {
  margin-top: 8px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.mini-chart {
  height: 40px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 10px;
  position: relative;
  overflow: hidden;
}

.chart-line {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
  stroke: var(--secondary-color);
  stroke-width: 2;
  fill: none;
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.network-interface {
  padding: 15px;
  border-radius: 6px;
  background-color: #f8f9fa;
  border-left: 4px solid var(--success-color);
}

.bandwidth-meter {
  margin-top: 10px;
}

.bandwidth-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 5px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .network-grid {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .polling-controls {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    justify-content: center;
  }
}
</style>
