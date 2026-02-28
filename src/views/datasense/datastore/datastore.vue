<!-- src/views/data/datastore/DataStoreConfig.vue -->
<template>
  <MainLayout
    active-nav="data"
    active-sub-nav="device-data-store"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader title="数据存储配置" :breadcrumbs="breadcrumbs" />

      <div class="data-store-content">
        <!-- 1. InfluxDB配置概览 -->
        <div class="config-overview">
          <div class="overview-header">
            <div class="header-left">
              <i class="fas fa-database"></i>
              <h3>InfluxDB配置</h3>
            </div>
          </div>

          <div class="config-grid">
            <div class="config-item">
              <div class="item-header">
                <i class="fas fa-server"></i>
                <h4>服务器配置</h4>
              </div>
              <div class="item-body">
                <div class="config-detail">
                  <span class="detail-label">主机地址</span>
                  <span class="detail-value">{{ influxdbConfig.host || '加载中...' }}</span>
                </div>
                <div class="config-detail">
                  <span class="detail-label">端口</span>
                  <span class="detail-value">{{ influxdbConfig.port || '...' }}</span>
                </div>
                <div class="config-detail">
                  <span class="detail-label">组织</span>
                  <span class="detail-value">{{ influxdbConfig.org || '加载中...' }}</span>
                </div>
                <div class="config-detail">
                  <span class="detail-label">数据桶</span>
                  <span class="detail-value">{{ influxdbConfig.bucket || '加载中...' }}</span>
                </div>
              </div>
            </div>

            <div class="config-item">
              <div class="item-header">
                <i class="fas fa-cogs"></i>
                <h4>采集配置</h4>
              </div>
              <div class="item-body">
                <div class="config-detail">
                  <span class="detail-label">超时时间</span>
                  <span class="detail-value">{{ networkConfig.timeout || 10 }}秒</span>
                </div>
                <div class="config-detail">
                  <span class="detail-label">重试次数</span>
                  <span class="detail-value">{{ networkConfig.retry_count || 3 }}次</span>
                </div>
                <div class="config-detail">
                  <span class="detail-label">时间精度</span>
                  <span class="detail-value">{{ influxdbConfig.precision || 'ms' }}</span>
                </div>
                <div class="config-detail">
                  <span class="detail-label">日志级别</span>
                  <span class="detail-value">{{ loggingConfig.level || 'INFO' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载状态显示 -->
          <div v-if="isLoading" class="loading-overlay">
            <i class="fas fa-spinner fa-spin"></i>
            <span>正在加载配置...</span>
          </div>

          <div v-if="loadError" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>加载失败: {{ loadError }}</span>
          </div>
        </div>

        <!-- 2. 历史数据查询 -->
        <div class="config-section">
          <div class="section-header">
            <i class="fas fa-history"></i>
            <h3>历史数据查询</h3>
            <div class="section-subtitle">访问InfluxDB内置管理界面</div>
          </div>

          <div class="data-query-container">
            <div class="query-action">
              <button
                class="btn-query-data"
                @click="openInfluxDBUI"
                :disabled="!influxdbConfig.host || !influxdbConfig.port"
              >
                <div class="btn-content">
                  <i class="fas fa-external-link-alt btn-icon"></i>
                  <div class="btn-text">
                    <span class="btn-title">打开数据查询界面</span>
                    <span class="btn-subtitle">在新窗口打开InfluxDB管理界面</span>
                  </div>
                </div>
                <i class="fas fa-chevron-right btn-arrow"></i>
              </button>

              <div class="query-tips">
                <i class="fas fa-info-circle"></i>
                <p>提示：InfluxDB管理界面提供完整的数据查询、分析和可视化功能</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 分层存储策略配置 -->
        <div class="config-section">
          <div class="section-header">
            <i class="fas fa-sliders-h"></i>
            <h3>分层存储策略</h3>
            <div class="config-note">{{ strategyConfig.note || '超过30天的数据自动删除' }}</div>
          </div>

          <div class="tiered-storage-container">
            <!-- 分层配置卡片 -->
            <div class="tier-config-cards">
              <!-- Tier 1: 1-3天 (原始数据) -->
              <div class="tier-card tier-active">
                <div class="tier-header">
                  <div class="tier-badge tier-1">
                    <i class="fas fa-fire"></i>
                    1-3天
                  </div>
                  <div class="tier-title">
                    <h4>{{ strategyConfig.tier1.name || '原始数据' }}</h4>
                  </div>
                </div>

                <div class="tier-body">
                  <div class="tier-time-range">
                    <span class="time-label">时间范围</span>
                    <span class="time-value">{{
                      strategyConfig.tier1.time_range || '第1天 - 第3天'
                    }}</span>
                  </div>

                  <div class="tier-form-group">
                    <label>
                      <i class="fas fa-wave-square"></i>
                      存储策略
                    </label>
                    <div class="sampling-options">
                      <div
                        v-for="option in storageOptions.tier1"
                        :key="option.value"
                        class="sampling-option"
                        :class="{ active: strategyConfig.tier1.strategy === option.value }"
                        @click="strategyConfig.tier1.strategy = option.value"
                      >
                        <span class="option-value">{{ option.label }}</span>
                        <span class="option-desc">{{ option.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="tier-footer">
                  <div class="toggle-switch">
                    <input
                      type="checkbox"
                      id="tier1-enabled"
                      v-model="strategyConfig.tier1.enabled"
                    />
                    <label for="tier1-enabled" class="toggle-label">
                      <span class="toggle-handle"></span>
                      <span class="toggle-text">
                        {{ strategyConfig.tier1.enabled ? '已启用' : '已禁用' }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Tier 2: 1-7天 (降采样数据) -->
              <div class="tier-card">
                <div class="tier-header">
                  <div class="tier-badge tier-2">
                    <i class="fas fa-temperature-high"></i>
                    1-7天
                  </div>
                  <div class="tier-title">
                    <h4>{{ strategyConfig.tier2.name || '降采样数据' }}</h4>
                  </div>
                </div>

                <div class="tier-body">
                  <div class="tier-time-range">
                    <span class="time-label">时间范围</span>
                    <span class="time-value">{{
                      strategyConfig.tier2.time_range || '第1天 - 第7天'
                    }}</span>
                  </div>

                  <div class="tier-form-group">
                    <label>
                      <i class="fas fa-filter"></i>
                      降采样策略
                    </label>
                    <div class="sampling-options">
                      <div
                        v-for="option in storageOptions.tier2"
                        :key="option.value"
                        class="sampling-option"
                        :class="{ active: strategyConfig.tier2.strategy === option.value }"
                        @click="strategyConfig.tier2.strategy = option.value"
                      >
                        <span class="option-value">{{ option.label }}</span>
                        <span class="option-desc">{{ option.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="tier-footer">
                  <div class="toggle-switch">
                    <input
                      type="checkbox"
                      id="tier2-enabled"
                      v-model="strategyConfig.tier2.enabled"
                    />
                    <label for="tier2-enabled" class="toggle-label">
                      <span class="toggle-handle"></span>
                      <span class="toggle-text">
                        {{ strategyConfig.tier2.enabled ? '已启用' : '已禁用' }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Tier 3: 1-30天 (聚合数据) -->
              <div class="tier-card">
                <div class="tier-header">
                  <div class="tier-badge tier-3">
                    <i class="fas fa-temperature-low"></i>
                    1-30天
                  </div>
                  <div class="tier-title">
                    <h4>{{ strategyConfig.tier3.name || '聚合数据' }}</h4>
                  </div>
                </div>

                <div class="tier-body">
                  <div class="tier-time-range">
                    <span class="time-label">时间范围</span>
                    <span class="time-value">{{
                      strategyConfig.tier3.time_range || '第1天 - 第30天'
                    }}</span>
                  </div>

                  <div class="tier-form-group">
                    <label>
                      <i class="fas fa-chart-bar"></i>
                      聚合策略
                    </label>
                    <div class="sampling-options">
                      <div
                        v-for="option in storageOptions.tier3"
                        :key="option.value"
                        class="sampling-option"
                        :class="{ active: strategyConfig.tier3.strategy === option.value }"
                        @click="strategyConfig.tier3.strategy = option.value"
                      >
                        <span class="option-value">{{ option.label }}</span>
                        <span class="option-desc">{{ option.desc }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="tier-footer">
                  <div class="toggle-switch">
                    <input
                      type="checkbox"
                      id="tier3-enabled"
                      v-model="strategyConfig.tier3.enabled"
                    />
                    <label for="tier3-enabled" class="toggle-label">
                      <span class="toggle-handle"></span>
                      <span class="toggle-text">
                        {{ strategyConfig.tier3.enabled ? '已启用' : '已禁用' }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="resetToDefaults">
                <i class="fas fa-undo"></i>
                恢复默认
              </button>
              <button class="btn btn-primary" @click="saveConfig" :disabled="isSaving || isLoading">
                <i class="fas" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ isSaving ? '保存中...' : '保存配置' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import request from '@/utils/request'

// 响应式数据
const breadcrumbs = [
  { title: '数据采集', link: '/data' },
  { title: '数据存储', link: '/data/datastore' },
]

// 配置数据
const influxdbConfig = reactive({
  host: '',
  port: 8086,
  org: '',
  bucket: '',
  precision: 'ms',
  has_token: false,
})

const networkConfig = reactive({
  timeout: 10,
  retry_count: 3,
})

const loggingConfig = reactive({
  level: 'INFO',
  file: '',
})

const strategyConfig = reactive({
  tier1: {
    enabled: false,
    strategy: '1s_raw',
    name: '原始数据',
    time_range: '第1天 - 第3天',
  },
  tier2: {
    enabled: false,
    strategy: '5s_avg',
    name: '降采样数据',
    time_range: '第1天 - 第7天',
  },
  tier3: {
    enabled: false,
    strategy: '1m_avg',
    name: '聚合数据',
    time_range: '第1天 - 第30天',
  },
  note: '超过30天的数据自动删除',
})

// 状态数据
const isLoading = ref(true)
const loadError = ref(null)
const isSaving = ref(false)

// 存储策略选项（前端固定）
const storageOptions = {
  tier1: [
    {
      value: '1s_raw',
      label: '1秒原始数据',
      desc: '存储所有原始数据点',
    },
    {
      value: '2s_raw',
      label: '2秒原始数据',
      desc: '原始数据，降低采样频率',
    },
  ],
  tier2: [
    {
      value: '5s_avg',
      label: '5秒平均值',
      desc: '5秒间隔自动计算平均值',
    },
    {
      value: '10s_avg',
      label: '10秒平均值',
      desc: '10秒间隔自动计算平均值',
    },
    {
      value: '30s_avg',
      label: '30秒平均值',
      desc: '30秒间隔自动计算平均值',
    },
  ],
  tier3: [
    {
      value: '1m_avg',
      label: '1分钟平均值',
      desc: '1分钟间隔自动计算平均值',
    },
    {
      value: '5m_avg',
      label: '5分钟平均值',
      desc: '5分钟间隔自动计算平均值',
    },
    {
      value: '15m_avg',
      label: '15分钟平均值',
      desc: '15分钟间隔自动计算平均值',
    },
  ],
}

// 计算属性
const influxDBUIUrl = computed(() => {
  if (!influxdbConfig.host || !influxdbConfig.port) {
    return ''
  }
  return `http://${influxdbConfig.host}:${influxdbConfig.port}`
})

// 方法
const handleNavigation = (nav) => {
  console.log('导航变化:', nav)
}

const loadConfigFromBackend = async () => {
  isLoading.value = true
  loadError.value = null

  try {
    const response = await request({
      url: '/api/influxdb/config',
      method: 'GET',
    })

    const result = response.data

    if (result.influxdb) {
      Object.assign(influxdbConfig, {
        host: result.influxdb.host || '',
        port: result.influxdb.port || 8086,
        org: result.influxdb.org || '',
        bucket: result.influxdb.bucket || '',
        precision: result.influxdb.precision || 'ms',
        has_token: result.influxdb.has_token || false,
      })
    }

    if (result.network) {
      Object.assign(networkConfig, {
        timeout: result.network.timeout || 10,
        retry_count: result.network.retry_count || 3,
      })
    }

    if (result.logging) {
      Object.assign(loggingConfig, {
        level: result.logging.level || 'INFO',
        file: result.logging.file || '',
      })
    }

    if (result.strategy) {
      if (result.strategy.tier1) {
        Object.assign(strategyConfig.tier1, {
          enabled: Boolean(result.strategy.tier1.enabled),
          strategy: result.strategy.tier1.strategy || '',
          name: result.strategy.tier1.name || '原始数据',
          time_range: result.strategy.tier1.time_range || '第1天 - 第3天',
        })
      }

      if (result.strategy.tier2) {
        Object.assign(strategyConfig.tier2, {
          enabled: Boolean(result.strategy.tier2.enabled),
          strategy: result.strategy.tier2.strategy || '',
          name: result.strategy.tier2.name || '降采样数据',
          time_range: result.strategy.tier2.time_range || '第1天 - 第7天',
        })
      }

      if (result.strategy.tier3) {
        Object.assign(strategyConfig.tier3, {
          enabled: Boolean(result.strategy.tier3.enabled),
          strategy: result.strategy.tier3.strategy || '',
          name: result.strategy.tier3.name || '聚合数据',
          time_range: result.strategy.tier3.time_range || '第1天 - 第30天',
        })
      }

      if (result.strategy.note) {
        strategyConfig.note = result.strategy.note
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    loadError.value = error.message || '加载配置失败'

    if (!error.message.includes('网络连接失败')) {
      alert('加载配置失败: ' + error.message)
    }
  } finally {
    isLoading.value = false
  }
}

const openInfluxDBUI = () => {
  if (!influxdbConfig.host || !influxdbConfig.port) {
    alert('InfluxDB地址未配置，无法跳转')
    return
  }

  const url = influxDBUIUrl.value
  window.open(url, '_blank', 'noopener,noreferrer')
}

const saveConfig = async () => {
  isSaving.value = true
  try {
    const requestData = {
      strategy: {
        tier1: {
          enabled: strategyConfig.tier1.enabled,
          strategy: strategyConfig.tier1.strategy,
        },
        tier2: {
          enabled: strategyConfig.tier2.enabled,
          strategy: strategyConfig.tier2.strategy,
        },
        tier3: {
          enabled: strategyConfig.tier3.enabled,
          strategy: strategyConfig.tier3.strategy,
        },
      },
    }

    await request({
      url: '/api/influxdb/config',
      method: 'PUT',
      data: requestData,
    })

    await loadConfigFromBackend()
    alert('策略配置保存成功！')
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('保存配置失败: ' + (error.message || '请检查网络连接'))
  } finally {
    isSaving.value = false
  }
}

const resetToDefaults = () => {
  if (confirm('确定要恢复到默认配置吗？')) {
    loadConfigFromBackend()
  }
}

// 生命周期钩子
onMounted(() => {
  loadConfigFromBackend()
})
</script>

<style scoped>
.data-store-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* InfluxDB配置概览 */
.config-overview {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.overview-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left i {
  color: #3498db;
  font-size: 20px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-healthy {
  background: #d5f4e6;
  color: #27ae60;
}

.status-error {
  background: #fdecea;
  color: #e74c3c;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  padding: 20px;
}

.config-item {
  background: #f8fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  overflow: hidden;
}

.item-header {
  padding: 12px 16px;
  background: #edf2f7;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-header i {
  color: #3498db;
}

.item-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.item-body {
  padding: 16px;
}

.config-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.config-detail:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #7f8c8d;
  font-size: 13px;
}

.detail-value {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

/* 配置区域 */
.config-section {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.section-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
}

.config-note {
  font-size: 14px;
  color: #e74c3c;
  font-weight: 500;
}

/* 历史数据查询区域 */
.data-query-container {
  padding: 32px;
  background: #f8fafc;
  border-radius: 0 0 8px 8px;
}

.query-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.btn-query-data {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 24px 32px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
}

.btn-query-data:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}

.btn-query-data:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
}

.btn-text {
  display: flex;
  flex-direction: column;
}

.btn-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.btn-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.btn-arrow {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.query-tips {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 20px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  width: 100%;
}

.query-tips i {
  color: #3498db;
  margin-top: 2px;
}

.query-tips p {
  margin: 0;
  font-size: 14px;
  color: #2c3e50;
  line-height: 1.5;
}

/* 分层存储容器 */
.tiered-storage-container {
  padding: 20px;
}

/* 分层配置卡片 */
.tier-config-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.tier-card {
  background: #fff;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.tier-card:hover {
  border-color: #bdc3c7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.tier-card.tier-active {
  border-color: #3498db;
  background: #f8fafc;
}

.tier-header {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.tier-badge.tier-1 {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.tier-badge.tier-2 {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.tier-badge.tier-3 {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.tier-title {
  flex: 1;
}

.tier-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.tier-body {
  padding: 16px;
  flex: 1;
}

.tier-time-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #edf2f7;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #e1e5e9;
}

.time-label {
  font-size: 13px;
  color: #7f8c8d;
}

.time-value {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
}

.tier-form-group {
  margin-bottom: 16px;
}

.tier-form-group:last-child {
  margin-bottom: 0;
}

.tier-form-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.sampling-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sampling-option {
  padding: 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sampling-option:hover {
  border-color: #3498db;
  background: #f8fafc;
}

.sampling-option.active {
  border-color: #3498db;
  background: #e3f2fd;
}

.option-value {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
}

.sampling-option.active .option-value {
  color: #3498db;
}

.option-desc {
  font-size: 12px;
  color: #7f8c8d;
}

.sampling-option.active .option-desc {
  color: #3498db;
}

.tier-footer {
  padding: 12px 16px;
  border-top: 1px solid #e1e5e9;
  background: #f8fafc;
}

.toggle-switch {
  display: inline-block;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.toggle-handle {
  width: 46px;
  height: 26px;
  background: #dce1e5;
  border-radius: 13px;
  position: relative;
  transition: background 0.2s;
}

.toggle-handle::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

input:checked + .toggle-label .toggle-handle {
  background: #3498db;
}

input:checked + .toggle-label .toggle-handle::after {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 14px;
  color: #2c3e50;
}

/* 操作按钮 */
.action-buttons {
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载状态样式 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #3498db;
  font-size: 14px;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #e74c3c;
  font-size: 14px;
  background: #fdecea;
  border-radius: 6px;
  margin: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-store-content {
    gap: 16px;
  }

  .config-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .data-query-container {
    padding: 24px;
  }

  .btn-query-data {
    padding: 20px 24px;
  }

  .btn-content {
    gap: 16px;
  }

  .btn-icon {
    font-size: 28px;
  }

  .btn-title {
    font-size: 18px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .tier-config-cards {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tier-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .tier-badge {
    align-self: flex-start;
  }

  .data-query-container {
    padding: 20px;
  }

  .btn-query-data {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .btn-content {
    flex-direction: column;
    gap: 12px;
  }

  .btn-arrow {
    display: none;
  }
}
</style>
