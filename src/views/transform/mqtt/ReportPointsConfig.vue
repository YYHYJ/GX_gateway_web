<!-- src/views/transform/mqtt/ReportPointsConfig.vue -->
<template>
  <div class="rp-overlay" @click.self="$emit('close')">
    <div class="rp-dialog">
      <!-- 头部 -->
      <div class="rp-header">
        <div class="rp-header-left">
          <i class="fas fa-filter"></i>
          <h3>上报点位配置</h3>
          <code class="rp-topic-code">{{ topicName }}</code>
        </div>
        <button class="rp-close" @click="$emit('close')"><i class="fas fa-times"></i></button>
      </div>

      <!-- 设备选择 -->
      <div class="rp-device-bar">
        <label>选择设备：</label>
        <select v-model="selectedDeviceId" @change="loadAvailablePoints">
          <option value="">请选择设备</option>
          <option v-for="d in devices" :key="d.id" :value="d.id">
            {{ d.device_name }} ({{ d.device_code }})
          </option>
        </select>
      </div>

      <!-- 穿梭框主体 -->
      <div class="rp-transfer">
        <!-- 左侧：可选点位 -->
        <div class="rp-panel rp-left">
          <div class="rp-panel-header">
            <span class="rp-panel-title">可选点位</span>
            <span class="rp-panel-count" v-if="filteredAvailable.length > 0">{{ filteredAvailable.length }} 个</span>
          </div>
          <div class="rp-search">
            <input type="text" v-model="searchLeft" placeholder="搜索点位代码/名称..." />
          </div>
          <div class="rp-panel-body">
            <div v-if="!selectedDeviceId" class="rp-placeholder">
              <i class="fas fa-hand-pointer"></i>
              <span>请先选择设备</span>
            </div>
            <div v-else-if="loadingPoints" class="rp-placeholder">
              <i class="fas fa-spinner fa-spin"></i>
              <span>加载中...</span>
            </div>
            <div v-else-if="filteredAvailable.length === 0" class="rp-placeholder">
              <i class="fas fa-inbox"></i>
              <span>{{ searchLeft ? '无匹配点位' : '该设备无可选点位' }}</span>
            </div>
            <div v-else class="rp-list">
              <div
                v-for="p in filteredAvailable"
                :key="p.point_code"
                class="rp-item"
                :class="{ selected: leftSelected.includes(p.point_code), added: isAlreadyAdded(p.point_code) }"
                @click="!isAlreadyAdded(p.point_code) && toggleLeftSelect(p.point_code)"
              >
                <input type="checkbox" :checked="leftSelected.includes(p.point_code)" :disabled="isAlreadyAdded(p.point_code)" @click.stop />
                <div class="rp-item-info">
                  <span class="rp-item-code">{{ p.point_code }}</span>
                  <span class="rp-item-name">{{ p.point_name }}</span>
                </div>
                <span v-if="isAlreadyAdded(p.point_code)" class="rp-added-tag">已添加</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：操作按钮 -->
        <div class="rp-actions">
          <button class="rp-btn-transfer" @click="addToRight" :disabled="leftSelected.length === 0 || submitting" title="添加到右侧">
            <i class="fas fa-chevron-right"></i>
          </button>
          <button class="rp-btn-transfer" @click="removeFromRight" :disabled="rightSelected.length === 0 || submitting" title="从右侧移除">
            <i class="fas fa-chevron-left"></i>
          </button>
        </div>

        <!-- 右侧：已选上报点位 -->
        <div class="rp-panel rp-right">
          <div class="rp-panel-header">
            <span class="rp-panel-title">已选上报点位</span>
            <span class="rp-panel-count" v-if="configuredPoints.length > 0">{{ configuredPoints.length }} 个 / {{ configuredDeviceCount }} 设备</span>
          </div>
          <div class="rp-search">
            <input type="text" v-model="searchRight" placeholder="搜索已选点位..." />
          </div>
          <div class="rp-panel-body">
            <div v-if="loadingConfig" class="rp-placeholder">
              <i class="fas fa-spinner fa-spin"></i>
              <span>加载中...</span>
            </div>
            <div v-else-if="filteredConfigured.length === 0" class="rp-placeholder">
              <i class="fas fa-inbox"></i>
              <span>{{ searchRight ? '无匹配' : '未配置，将全量上报' }}</span>
            </div>
            <div v-else class="rp-list">
              <div
                v-for="rp in filteredConfigured"
                :key="rp.id"
                class="rp-item rp-item-right"
                :class="{ selected: rightSelected.includes(rp.id) }"
                @click="toggleRightSelect(rp.id)"
              >
                <input type="checkbox" :checked="rightSelected.includes(rp.id)" @click.stop />
                <div class="rp-item-info">
                  <span class="rp-item-code">{{ rp.point_code }}</span>
                  <span class="rp-item-device">{{ getDeviceName(rp.device_id) }}</span>
                </div>
                <input
                  type="text"
                  class="rp-alias-input"
                  v-model="rp._editAlias"
                  placeholder="别名"
                  @click.stop
                  @blur="updateAlias(rp)"
                  @keyup.enter="$event.target.blur()"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="rp-footer">
        <div class="rp-footer-hint">
          <i class="fas fa-info-circle"></i>
          未配置任何上报点位时，该topic将上报全量数据
        </div>
        <button class="rp-btn-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReportPointsConfig',
  props: {
    topicId: { type: [Number, String], required: true },
    topicName: { type: String, default: '' },
  },
  emits: ['close'],
  data() {
    return {
      devices: [],
      selectedDeviceId: '',
      availablePoints: [],
      configuredPoints: [],
      leftSelected: [],
      rightSelected: [],
      searchLeft: '',
      searchRight: '',
      loadingPoints: false,
      loadingConfig: false,
      submitting: false,
    }
  },
  computed: {
    filteredAvailable() {
      if (!this.searchLeft) return this.availablePoints
      const q = this.searchLeft.toLowerCase()
      return this.availablePoints.filter(
        (p) => p.point_code.toLowerCase().includes(q) || p.point_name.toLowerCase().includes(q),
      )
    },
    filteredConfigured() {
      if (!this.searchRight) return this.configuredPoints
      const q = this.searchRight.toLowerCase()
      return this.configuredPoints.filter(
        (p) =>
          p.point_code.toLowerCase().includes(q) ||
          (p._editAlias || '').toLowerCase().includes(q) ||
          this.getDeviceName(p.device_id).toLowerCase().includes(q),
      )
    },
    configuredDeviceCount() {
      return new Set(this.configuredPoints.map((p) => p.device_id)).size
    },
  },
  created() {
    this.loadDevices()
    this.loadConfiguredPoints()
  },
  methods: {
    // ========== 数据加载 ==========
    async loadDevices() {
      try {
        const res = await this.$axios.get('/api/device/config')
        if (res && res.code === 200) this.devices = res.data?.devices || []
      } catch (e) {
        console.error('加载设备列表失败:', e)
      }
    },

    async loadAvailablePoints() {
      this.availablePoints = []
      this.leftSelected = []
      this.searchLeft = ''
      if (!this.selectedDeviceId) return
      this.loadingPoints = true
      try {
        const res = await this.$axios.get('/api/mqtt/available_points', {
          params: { device_id: this.selectedDeviceId },
        })
        if (res && res.code === 200) this.availablePoints = res.data?.points || []
      } catch (e) {
        console.error('加载可选点位失败:', e)
      } finally {
        this.loadingPoints = false
      }
    },

    async loadConfiguredPoints() {
      this.loadingConfig = true
      try {
        const res = await this.$axios.get('/api/mqtt/report_points', {
          params: { topic_id: this.topicId },
        })
        if (res && res.code === 200 && Array.isArray(res.data)) {
          this.configuredPoints = res.data.map((p) => ({ ...p, _editAlias: p.report_alias || '' }))
        }
      } catch (e) {
        console.error('加载已配置点位失败:', e)
      } finally {
        this.loadingConfig = false
      }
    },

    // ========== 左侧选择 ==========
    toggleLeftSelect(code) {
      const idx = this.leftSelected.indexOf(code)
      idx === -1 ? this.leftSelected.push(code) : this.leftSelected.splice(idx, 1)
    },

    isAlreadyAdded(pointCode) {
      return this.configuredPoints.some(
        (p) => p.device_id == this.selectedDeviceId && p.point_code === pointCode,
      )
    },

    // ========== 右侧选择 ==========
    toggleRightSelect(id) {
      const idx = this.rightSelected.indexOf(id)
      idx === -1 ? this.rightSelected.push(id) : this.rightSelected.splice(idx, 1)
    },

    // ========== 穿梭操作 ==========
    async addToRight() {
      if (this.leftSelected.length === 0 || !this.selectedDeviceId) return
      this.submitting = true
      try {
        const points = this.leftSelected.map((code) => ({
          device_id: Number(this.selectedDeviceId),
          point_code: code,
          report_alias: '',
        }))
        const res = await this.$axios.post('/api/mqtt/report_points', {
          topic_id: Number(this.topicId),
          points,
        })
        if (res && res.code === 200) {
          this.$message && this.$message.success(`已添加 ${res.data?.success_count || points.length} 个点位`)
          this.leftSelected = []
          await this.loadConfiguredPoints()
        }
      } catch (e) {
        this.$message && this.$message.error('添加失败: ' + (e.message || '未知错误'))
      } finally {
        this.submitting = false
      }
    },

    async removeFromRight() {
      if (this.rightSelected.length === 0) return
      if (!confirm(`确定移除选中的 ${this.rightSelected.length} 个上报点位吗？`)) return
      this.submitting = true
      try {
        const res = await this.$axios.delete('/api/mqtt/report_points', {
          data: { ids: this.rightSelected },
        })
        if (res && res.code === 200) {
          this.$message && this.$message.success(`已移除 ${res.data?.deleted || this.rightSelected.length} 个点位`)
          this.rightSelected = []
          await this.loadConfiguredPoints()
        }
      } catch (e) {
        this.$message && this.$message.error('移除失败')
      } finally {
        this.submitting = false
      }
    },

    // ========== 右侧行内操作 ==========
    async toggleEnabled(rp) {
      const newVal = rp.enabled ? 0 : 1
      try {
        await this.$axios.put('/api/mqtt/report_points', { id: rp.id, enabled: newVal })
        rp.enabled = !!newVal
      } catch (e) {
        this.$message && this.$message.error('操作失败')
      }
    },

    async updateAlias(rp) {
      if (rp._editAlias === (rp.report_alias || '')) return
      try {
        await this.$axios.put('/api/mqtt/report_points', { id: rp.id, report_alias: rp._editAlias })
        rp.report_alias = rp._editAlias
      } catch (e) {
        rp._editAlias = rp.report_alias || ''
        this.$message && this.$message.error('更新别名失败')
      }
    },

    getDeviceName(deviceId) {
      const d = this.devices.find((d) => d.id == deviceId)
      return d ? d.device_name : `设备${deviceId}`
    },
  },
}
</script>

<style scoped>
.rp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.rp-dialog {
  background: #fff;
  border-radius: 10px;
  width: 92%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}

/* 头部 */
.rp-header {
  padding: 14px 20px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 10px 10px 0 0;
}

.rp-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.rp-header-left i { color: #8e44ad; font-size: 16px; }

.rp-header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.rp-topic-code {
  background: #edf2f7;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.rp-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #95a5a6;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.rp-close:hover { color: #e74c3c; background: #f8f9fa; }

/* 设备选择栏 */
.rp-device-bar {
  padding: 12px 20px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafbfc;
}

.rp-device-bar label {
  font-size: 14px;
  font-weight: 500;
  color: #34495e;
  white-space: nowrap;
}

.rp-device-bar select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
  background: #fff;
}

.rp-device-bar select:focus { outline: none; border-color: #3498db; }

/* 穿梭框主体 */
.rp-transfer {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 16px 20px;
  gap: 12px;
}

/* 面板 */
.rp-panel {
  flex: 1;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
}

.rp-panel-header {
  padding: 10px 14px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
}

.rp-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.rp-panel-count {
  font-size: 12px;
  color: #7f8c8d;
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 10px;
}

.rp-search {
  padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.rp-search input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  font-size: 13px;
  color: #2c3e50;
}

.rp-search input:focus { outline: none; border-color: #3498db; }

.rp-panel-body {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 380px;
}

/* 占位 */
.rp-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 160px;
  color: #95a5a6;
  gap: 8px;
  font-size: 13px;
}

.rp-placeholder i { font-size: 28px; color: #bdc3c7; }

/* 列表项 */
.rp-list { padding: 4px 0; }

.rp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f8f9fa;
}

.rp-item:hover { background: #f0f7ff; }
.rp-item.selected { background: #e8f4fd; }
.rp-item.added { opacity: 0.4; cursor: default; }

.rp-item input[type="checkbox"] { flex-shrink: 0; cursor: pointer; }

.rp-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rp-item-code {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  font-family: 'Menlo', 'Monaco', monospace;
}

.rp-item-name, .rp-item-device {
  font-size: 11px;
  color: #7f8c8d;
}

.rp-added-tag {
  font-size: 11px;
  color: #95a5a6;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* 右侧项额外样式 */
.rp-item-right { gap: 6px; }

.rp-alias-input {
  width: 80px;
  padding: 3px 6px;
  border: 1px solid #e1e5e9;
  border-radius: 3px;
  font-size: 12px;
  color: #2c3e50;
  flex-shrink: 0;
}

.rp-alias-input:focus { outline: none; border-color: #3498db; }

.rp-status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}

.rp-status-tag.on { background: #d4edda; color: #155724; }
.rp-status-tag.off { background: #f8d7da; color: #721c24; }
.rp-status-tag:hover { opacity: 0.7; }

/* 中间操作按钮 */
.rp-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;
}

.rp-btn-transfer {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3498db;
  font-size: 14px;
  transition: all 0.2s;
}

.rp-btn-transfer:hover:not(:disabled) {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}

.rp-btn-transfer:disabled { opacity: 0.35; cursor: not-allowed; }

/* 底部 */
.rp-footer {
  padding: 12px 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
  border-radius: 0 0 10px 10px;
}

.rp-footer-hint {
  font-size: 13px;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rp-footer-hint i { color: #f39c12; }

.rp-btn-close {
  padding: 8px 20px;
  background: #95a5a6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.rp-btn-close:hover { background: #7f8c8d; }

/* 滚动条 */
.rp-panel-body::-webkit-scrollbar { width: 5px; }
.rp-panel-body::-webkit-scrollbar-track { background: #f1f1f1; }
.rp-panel-body::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }

/* 响应式 */
@media (max-width: 768px) {
  .rp-dialog { width: 98%; max-height: 95vh; }
  .rp-transfer { flex-direction: column; }
  .rp-actions { flex-direction: row; justify-content: center; }
  .rp-alias-input { width: 60px; }
}
</style>
