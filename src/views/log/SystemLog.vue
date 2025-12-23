<template>
  <MainLayout active-nav="logs" user-name="管理员" @nav-change="handleNavigation">
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader title="系统日志" :breadcrumbs="breadcrumbs" :actions="pageActions" />
      <div class="systemlog-content">
        <div class="filter-bar">
          <div class="form-group" style="margin-bottom: 0">
            <label class="form-label">日志级别</label>
            <select class="form-control" style="width: 150px">
              <option>全部级别</option>
              <option>INFO</option>
              <option>WARNING</option>
              <option>ERROR</option>
              <option>DEBUG</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0">
            <label class="form-label">时间范围</label>
            <select class="form-control" style="width: 150px">
              <option>最近1小时</option>
              <option>最近24小时</option>
              <option>最近7天</option>
              <option>自定义范围</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0">
            <label class="form-label">模块</label>
            <select class="form-control" style="width: 150px">
              <option>全部模块</option>
              <option>系统核心</option>
              <option>数据采集</option>
              <option>网络通信</option>
              <option>设备管理</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0; margin-left: auto">
            <label class="form-label">搜索</label>
            <input
              type="text"
              class="form-control"
              style="width: 200px"
              placeholder="输入关键字搜索"
            />
          </div>
        </div>
      </div>
      <div class="log-list">
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:30:25</span>
            <span class="log-level level-info">INFO</span>
            <span style="margin-left: 10px; color: #666">[系统核心]</span>
          </div>
          <div class="log-content">系统启动完成，当前运行时间：15天8小时32分</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:28:10</span>
            <span class="log-level level-info">INFO</span>
            <span style="margin-left: 10px; color: #666">[数据采集]</span>
          </div>
          <div class="log-content">设备实例 INST_001 连接成功，开始数据采集</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:25:45</span>
            <span class="log-level level-warning">WARNING</span>
            <span style="margin-left: 10px; color: #666">[设备管理]</span>
          </div>
          <div class="log-content">设备实例 INST_003 连接超时，已触发重连机制</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:20:30</span>
            <span class="log-level level-error">ERROR</span>
            <span style="margin-left: 10px; color: #666">[网络通信]</span>
          </div>
          <div class="log-content">MQTT客户端连接断开，错误代码：CONNECTION_REFUSED</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:18:15</span>
            <span class="log-level level-debug">DEBUG</span>
            <span style="margin-left: 10px; color: #666">[系统核心]</span>
          </div>
          <div class="log-content">内存使用率：45%，CPU使用率：12%，磁盘使用率：68%</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:15:20</span>
            <span class="log-level level-info">INFO</span>
            <span style="margin-left: 10px; color: #666">[数据采集]</span>
          </div>
          <div class="log-content">采集任务调度完成，本次采集数据点：1250个</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:10:05</span>
            <span class="log-level level-warning">WARNING</span>
            <span style="margin-left: 10px; color: #666">[系统核心]</span>
          </div>
          <div class="log-content">磁盘空间使用率超过80%，建议清理历史数据</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:05:30</span>
            <span class="log-level level-info">INFO</span>
            <span style="margin-left: 10px; color: #666">[网络通信]</span>
          </div>
          <div class="log-content">MQTT客户端重新连接成功</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 14:00:15</span>
            <span class="log-level level-debug">DEBUG</span>
            <span style="margin-left: 10px; color: #666">[设备管理]</span>
          </div>
          <div class="log-content">设备实例 INST_002 数据解析完成，处理时间：15ms</div>
        </div>
        <div class="log-item">
          <div>
            <span class="log-time">2024-06-15 13:55:40</span>
            <span class="log-level level-info">INFO</span>
            <span style="margin-left: 10px; color: #666">[系统核心]</span>
          </div>
          <div class="log-content">定时数据备份任务执行完成</div>
        </div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">1,245</div>
        <div class="stat-label">今日日志总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1,158</div>
        <div class="stat-label">INFO级别</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">65</div>
        <div class="stat-label">WARNING级别</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">22</div>
        <div class="stat-label">ERROR级别</div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
export default {
  name: 'SystemLogs',
  components: {
    MainLayout,
    PageHeader,
  },
  methods: {
    handleNavigation(nav) {
      // 处理导航变化的逻辑
      console.log('当前导航:', nav)
    },
  },
  data() {
    return {
      breadcrumbs: [
        { title: '日志系统', link: '/system' },
        { title: '系统日志', link: '/system/logs' },
      ],
      pageActions: [
        {
          text: '导出系统日志',
          type: 'primary',
          icon: 'fas fa-download',
          handler: () => {
            // 导出系统日志的处理逻辑
            console.log('导出系统日志')
          },
        },
        {
          text: '刷新',
          type: 'default',
          icon: 'fas fa-sync-alt',
          handler: () => {
            // 刷新页面的处理逻辑
            console.log('刷新页面')
          },
        },
      ],
    }
  },
}
</script>

<style scoped>
/* 基础布局样式 - 保持与设备实例页面一致 */
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

/* 过滤器 */
.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 0px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

/* 日志列表 */
.log-list {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  background-color: #fafafa;
  font-family: monospace;
  font-size: 13px;
}

.log-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.log-time {
  color: var(--gray-color);
  font-size: 11px;
  margin-right: 10px;
}

.log-content {
  margin-top: 3px;
  word-break: break-all;
}

/* 日志级别标签 */
.log-level {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.level-info {
  background-color: #d4edda;
  color: #155724;
}

.level-warning {
  background-color: #fff3cd;
  color: #856404;
}

.level-error {
  background-color: #f8d7da;
  color: #721c24;
}

.level-debug {
  background-color: #e2e3e5;
  color: #383d41;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--gray-color);
  margin-top: 5px;
}
</style>
