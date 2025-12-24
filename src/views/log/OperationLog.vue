<template>
  <MainLayout
    active-nav="logs"
    user-name="管理员"
    active-sub-nav="operation-logs"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader title="操作日志" :breadcrumbs="breadcrumbs" :actions="pageActions" />

      <div class="systemlog-content">
        <div class="filter-bar">
          <div class="filter-item">
            <span class="filter-label">开始时间</span>
            <div class="time-input-group">
              <input
                type="text"
                class="time-input"
                v-model="startTime"
                placeholder="YYYY-MM-DD HH:mm"
                @blur="validateTime('start')"
              />
              <span class="time-hint">格式：2025-12-24 14:40</span>
            </div>
          </div>
          <div class="filter-item">
            <span class="filter-label">结束时间</span>
            <div class="time-input-group">
              <input
                type="text"
                class="time-input"
                v-model="endTime"
                placeholder="YYYY-MM-DD HH:mm"
                @blur="validateTime('end')"
              />
              <span class="time-hint">格式：2025-12-24 14:40</span>
            </div>
          </div>
          <div class="filter-item">
            <span class="filter-label">级别</span>
            <select class="filter-select" v-model="selectedLevel">
              <option value="all">全部</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>
          <div class="filter-item" style="margin-left: auto">
            <span class="filter-label">搜索</span>
            <div class="search-input-group">
              <input
                type="text"
                class="search-input"
                v-model="searchKeyword"
                placeholder="输入关键字搜索"
              />
              <i class="search-icon fas fa-search"></i>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="control-bar">
          <button class="btn btn-primary" @click="refreshLogs" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
            {{ isLoading ? '刷新中...' : '刷新' }}
          </button>
          <button
            class="btn btn-secondary"
            @click="toggleAutoRefresh"
            :class="{ 'btn-auto-refresh-active': autoRefreshEnabled }"
          >
            <i class="fas fa-sync-alt"></i>
            自动刷新
          </button>
          <button class="btn btn-info" @click="jumpToLatest">
            <i class="fas fa-arrow-down"></i> 最新
          </button>
          <button class="btn btn-warning" @click="clearTimeFilter" :disabled="!hasTimeFilter">
            <i class="fas fa-times"></i> 清除时间
          </button>
          <div class="time-range-info" v-if="hasTimeFilter">
            时间范围: {{ startTime || '无限制' }} - {{ endTime || '无限制' }}
          </div>
        </div>
      </div>

      <!-- 添加一个隐藏的下载链接 -->
      <a ref="downloadLink" style="display: none"></a>

      <!-- 实时日志显示区域 -->
      <div class="log-viewer-container">
        <div class="log-list" ref="logContainer" @scroll="handleScroll">
          <!-- 日志项模板 -->
          <div
            v-for="(log, index) in filteredLogs"
            :key="`${log}-${index}`"
            class="log-item"
            :class="getLogLevelClass(log)"
          >
            <div class="log-header">
              <span class="log-time">{{ extractTime(log) }}</span>
              <span class="log-level">{{ extractLevel(log) }}</span>
              <span class="log-module" v-if="extractModule(log)"> [{{ extractModule(log) }}] </span>
              <span class="log-source" v-if="extractSource(log)">
                {{ extractSource(log) }}
              </span>
            </div>
            <div class="log-content">{{ extractMessage(log) }}</div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredLogs.length === 0 && !isLoading" class="no-logs">
            <i class="fas fa-info-circle"></i>
            {{ allLogs.length === 0 ? '暂无操作日志数据' : '没有匹配的操作日志' }}
          </div>

          <!-- 加载中 -->
          <div v-if="isLoading" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> 正在加载操作日志...
          </div>

          <!-- 滚动到底部加载提示 -->
          <div v-if="isLoadingMore" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> 正在加载更多...
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import axios from 'axios'

export default {
  name: 'OperationLogs', // 修改组件名
  components: {
    MainLayout,
    PageHeader,
  },

  data() {
    return {
      breadcrumbs: [
        { title: '日志系统', link: '/system' },
        { title: '操作日志', link: '/system/operation-logs' }, // 修改面包屑
      ],
      pageActions: [
        {
          text: '导出操作日志', // 修改按钮文字
          type: 'primary',
          icon: 'fas fa-download',
          handler: this.exportOperationLogsWithAxios, // 修改方法名
        },
      ],

      // 日志数据
      allLogs: [],
      lastPosition: 0,
      hasMoreLogs: true,

      // 状态控制
      isLoading: false,
      isLoadingMore: false,
      autoRefreshEnabled: false,
      autoRefreshTimer: null,

      // 过滤条件
      selectedLevel: 'all',
      searchKeyword: '',
      startTime: '',
      endTime: '',

      // UI控制
      isAtBottom: false,
    }
  },

  computed: {
    hasTimeFilter() {
      return this.startTime || this.endTime
    },

    filteredLogs() {
      return this.allLogs.filter((log) => {
        const logTime = this.extractTime(log)
        if (!logTime) return true

        if (this.startTime) {
          const startDateTime = this.startTime + ':00'
          if (logTime < startDateTime) {
            return false
          }
        }
        if (this.endTime) {
          const endDateTime = this.endTime + ':59'
          if (logTime > endDateTime) {
            return false
          }
        }

        if (this.selectedLevel !== 'all') {
          const level = this.extractRawLevel(log)
          if (level !== this.selectedLevel) {
            return false
          }
        }

        if (this.searchKeyword.trim()) {
          const keyword = this.searchKeyword.toLowerCase()
          const logContent = log.toLowerCase()
          return logContent.includes(keyword)
        }

        return true
      })
    },
  },

  mounted() {
    this.initializeLogs()
  },

  beforeUnmount() {
    this.stopAutoRefresh()
  },

  methods: {
    handleNavigation(nav) {
      console.log('当前导航:', nav)
    },

    async refreshLogs() {
      if (this.isLoading) return

      this.stopAutoRefresh()
      this.isLoading = true

      try {
        this.lastPosition = 0
        this.allLogs = []
        this.hasMoreLogs = true

        await this.fetchLogs(0, 1000)

        this.$nextTick(() => {
          this.scrollToBottom()
        })
      } catch (error) {
        console.error('刷新操作日志失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    async initializeLogs() {
      await this.refreshLogs()
    },

    async fetchLogs(startPosition, maxLines = 1000) {
      try {
        const params = {
          filename: 'operation.log', // 修改为 operation.log
          lastPosition: startPosition,
          maxLines: maxLines,
        }

        const response = await axios.get('/api/logs/realtime', { params })

        if (response.data && response.data.logs) {
          const newLogs = response.data.logs

          if (startPosition === 0) {
            this.allLogs = newLogs
          } else {
            this.allLogs.push(...newLogs)
          }

          this.lastPosition = response.data.newPosition

          if (newLogs.length < maxLines) {
            this.hasMoreLogs = false
          } else {
            this.hasMoreLogs = true
          }
        }

        return response.data
      } catch (error) {
        console.error('获取操作日志失败:', error)
        throw error
      }
    },

    async loadMoreLogs() {
      if (this.isLoadingMore || !this.hasMoreLogs) return

      this.isLoadingMore = true
      try {
        await this.fetchLogs(this.lastPosition, 1000)
      } catch (error) {
        console.error('加载更多操作日志失败:', error)
      } finally {
        this.isLoadingMore = false
      }
    },

    toggleAutoRefresh() {
      this.autoRefreshEnabled = !this.autoRefreshEnabled

      if (this.autoRefreshEnabled) {
        this.startAutoRefresh()
      } else {
        this.stopAutoRefresh()
      }
    },

    startAutoRefresh() {
      this.stopAutoRefresh()

      this.autoRefreshTimer = setInterval(async () => {
        if (this.isLoading || this.isLoadingMore) return

        try {
          const data = await this.fetchLogs(this.lastPosition, 1000)

          if (data.logs && data.logs.length > 0 && this.isAtBottom) {
            this.$nextTick(() => {
              this.scrollToBottom()
            })
          }
        } catch (error) {
          console.error('自动刷新操作日志失败:', error)
        }
      }, 3000)
    },

    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer)
        this.autoRefreshTimer = null
      }
    },

    jumpToLatest() {
      this.scrollToBottom()
    },

    clearTimeFilter() {
      this.startTime = ''
      this.endTime = ''
    },

    validateTime(type) {
      const time = type === 'start' ? this.startTime : this.endTime
      if (!time) return true

      const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
      if (!regex.test(time)) {
        console.warn(`时间格式不正确：${time}，请使用 YYYY-MM-DD HH:mm 格式`)
        return false
      }

      const date = new Date(time.replace(' ', 'T'))
      if (isNaN(date.getTime())) {
        console.warn(`无效的日期：${time}`)
        return false
      }

      return true
    },

    handleScroll() {
      const container = this.$refs.logContainer
      if (!container) return

      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      this.isAtBottom = scrollHeight - scrollTop - clientHeight < 50

      if (this.isAtBottom && this.hasMoreLogs && !this.isLoading && !this.isLoadingMore) {
        this.loadMoreLogs()
      }
    },

    scrollToBottom() {
      const container = this.$refs.logContainer
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    },

    extractRawLevel(log) {
      const match = log.match(/\[(INFO|ERROR|WARN|DEBUG)\]/i)
      return match ? match[1].toUpperCase() : 'INFO'
    },

    extractLevel(log) {
      const rawLevel = this.extractRawLevel(log)
      return rawLevel === 'WARN' ? 'WARNING' : rawLevel
    },

    extractTime(log) {
      const match = log.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
      return match ? match[1] : ''
    },

    extractModule(log) {
      const matches = log.match(/\[([^\]]+)\]/g)
      if (matches && matches.length >= 2) {
        return matches[1]
      }
      return ''
    },

    extractSource(log) {
      const matches = log.match(/\[([^\]]+)\]/g)
      if (matches && matches.length >= 3) {
        return matches[2]
      }
      return ''
    },

    extractMessage(log) {
      const matches = log.match(/\[([^\]]+)\]/g)
      if (matches && matches.length >= 3) {
        const lastBracketIndex = log.lastIndexOf(']')
        return log.substring(lastBracketIndex + 1).trim()
      }

      const timeMatch = log.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} /)
      if (timeMatch) {
        const afterTime = log.substring(timeMatch[0].length)
        const levelMatch = afterTime.match(/^\[(INFO|ERROR|WARN|DEBUG)\]/i)
        if (levelMatch) {
          const afterLevel = afterTime.substring(levelMatch[0].length)
          const cleanMessage = afterLevel.replace(/\[[^\]]+\]/g, '').trim()
          return cleanMessage
        }
      }

      return log
    },

    getLogLevelClass(log) {
      const level = this.extractRawLevel(log)
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

    // 修改为导出操作日志
    async exportOperationLogsWithAxios() {
      try {
        console.log('正在导出操作日志...')

        const response = await axios({
          url: '/api/file/download',
          method: 'GET',
          params: {
            filename: 'operation.log', // 修改为 operation.log
            type: 'log',
          },
          responseType: 'blob',
        })

        const blob = response.data
        const contentDisposition = response.headers['content-disposition']
        let filename = 'operation_logs.zip' // 修改文件名

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+?)"?$/i)
          if (match && match[1]) {
            filename = decodeURIComponent(match[1])
          }
        }

        const downloadUrl = window.URL.createObjectURL(blob)
        const link = this.$refs.downloadLink

        link.href = downloadUrl
        link.download = filename
        link.click()

        window.URL.revokeObjectURL(downloadUrl)

        console.log('操作日志导出成功')
      } catch (error) {
        console.error('导出操作日志失败:', error)
      }
    },
  },
}
</script>

<style scoped>
/* 样式与SystemLog.vue完全相同，只修改部分文字颜色等 */
.content-area {
  padding: 0;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.systemlog-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-top: 20px;
}

.filter-bar {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 0px;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.filter-label {
  font-size: 13px;
  color: #495057;
  font-weight: 500;
  white-space: nowrap;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
  width: 180px;
  box-sizing: border-box;
  transition: all 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.time-input::placeholder {
  color: #adb5bd;
  font-size: 13px;
}

.time-hint {
  font-size: 11px;
  color: #6c757d;
  font-style: italic;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  width: 120px;
  box-sizing: border-box;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.search-input-group {
  position: relative;
  width: 200px;
}

.search-input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.search-input::placeholder {
  color: #adb5bd;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 14px;
}

.control-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 16px 20px;
  background: #f0f2f5;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background: #6c757d;
  color: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary {
  background: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0069d9;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-auto-refresh-active {
  background: #17a2b8;
}

.btn-auto-refresh-active:hover:not(:disabled) {
  background: #138496;
}

.btn-info {
  background: #17a2b8;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-warning:disabled {
  background: #e0e0e0;
  color: #999;
}

.time-range-info {
  margin-left: auto;
  font-size: 13px;
  color: #495057;
  background: #e9ecef;
  padding: 8px 12px;
  border-radius: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
}

.log-viewer-container {
  position: relative;
  height: 600px;
  overflow: hidden;
}

.log-list {
  height: 100%;
  overflow-y: auto;
  border: none;
  background-color: #fafafa;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 0;
}

.log-item {
  margin: 0;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  border-left: 4px solid transparent;
  background: white;
  transition: all 0.3s;
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
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.log-time {
  color: #666;
  font-size: 12px;
  font-weight: 500;
  min-width: 160px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.log-level {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
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
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 4px;
}

.log-source {
  color: #17a2b8;
  font-size: 12px;
  background: #e8f4f8;
  padding: 3px 8px;
  border-radius: 4px;
}

.log-content {
  color: #333;
  word-break: break-all;
  white-space: pre-wrap;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.6;
}

.no-logs {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
}

.no-logs i {
  display: block;
  font-size: 32px;
  margin-bottom: 16px;
  color: #ced4da;
}

.loading-indicator {
  text-align: center;
  padding: 24px;
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

.log-list::-webkit-scrollbar {
  width: 8px;
}

.log-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.log-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.log-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
