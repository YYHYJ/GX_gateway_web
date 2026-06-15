<!-- src/views/transform/mqtt/ReportPointsConfig.vue -->
<template>
  <div class="rp">
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

    <!-- 穿梭框 -->
    <div class="rp-transfer">
      <!-- 左侧：可选点位 -->
      <div class="rp-panel rp-left">
        <div class="rp-panel-header">
          <span class="rp-panel-title">可选点位</span>
          <div class="rp-panel-actions">
            <button
              class="rp-btn-selall"
              @click="selectAllLeft"
              v-if="filteredAvailable.length > 0"
              title="全选"
            >
              全选
            </button>
            <span class="rp-panel-count" v-if="filteredAvailable.length > 0"
              >{{ leftSelected.length }}/{{ filteredAvailable.length }}</span
            >
          </div>
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
              :class="{
                selected: leftSelected.includes(p.point_code),
                added: isAlreadyAdded(p.point_code),
              }"
              @click="!isAlreadyAdded(p.point_code) && toggleLeftSelect(p.point_code)"
            >
              <input
                type="checkbox"
                :checked="leftSelected.includes(p.point_code)"
                :disabled="isAlreadyAdded(p.point_code)"
                @click.stop="!isAlreadyAdded(p.point_code) && toggleLeftSelect(p.point_code)"
              />
              <div class="rp-item-info">
                <span class="rp-item-code">{{ p.point_code }}</span>
                <span class="rp-item-name">{{ p.point_name }}</span>
                <span v-if="p.alias" class="rp-item-alias">{{ p.alias }}</span>
              </div>
              <span v-if="isAlreadyAdded(p.point_code)" class="rp-added-tag">已添加</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：操作按钮 -->
      <div class="rp-actions">
        <button
          class="rp-btn-transfer"
          @click="addToRight"
          :disabled="leftSelected.length === 0 || submitting"
          title="添加到右侧"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
        <button
          class="rp-btn-transfer"
          @click="removeFromRight"
          :disabled="rightSelected.length === 0 || submitting"
          title="从右侧移除"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>

      <!-- 右侧：已选上报点位 -->
      <div class="rp-panel rp-right">
        <div class="rp-panel-header">
          <span class="rp-panel-title">已选上报点位</span>
          <div class="rp-panel-actions">
            <button
              class="rp-btn-selall"
              @click="selectAllRight"
              v-if="filteredConfigured.length > 0"
              title="全选"
            >
              全选
            </button>
            <span class="rp-panel-count" v-if="configuredPoints.length > 0"
              >{{ rightSelected.length }}/{{ configuredPoints.length }}</span
            >
          </div>
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
              :class="{
                selected: rightSelected.includes(rp.id),
                disabled: selectedDeviceId && rp.device_id != selectedDeviceId,
              }"
              @click="
                selectedDeviceId && rp.device_id != selectedDeviceId
                  ? null
                  : toggleRightSelect(rp.id)
              "
            >
              <input
                type="checkbox"
                :checked="rightSelected.includes(rp.id)"
                @click.stop="
                  rp.device_id == selectedDeviceId || !selectedDeviceId
                    ? toggleRightSelect(rp.id)
                    : null
                "
              />
              <div class="rp-item-info rp-item-info-right">
                <span class="rp-item-code">{{ rp.point_code }}</span>
                <span class="rp-item-device">{{ getPointNameFallback(rp) }}</span>
                <span v-if="getAliasFallback(rp)" class="rp-item-alias">{{
                  getAliasFallback(rp)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReportPointsConfig',
  props: {
    schemeId: { type: [Number, String], required: true },
    schemeName: { type: String, default: '' },
  },
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
      selectedDeviceConfiguredCodesCache: null, // ✅ 性能优化：缓存当前选中设备已配置点位 code 的 Set
    }
  },
  computed: {
    // ✅ 性能优化：将 availablePoints 转换为 Map，提高查找效率
    pointsMap() {
      const map = new Map()
      this.availablePoints.forEach((p) => {
        const key = `${p.device_id}_${p.point_code}`
        map.set(key, p)
      })
      return map
    },

    filteredAvailable() {
      if (!this.searchLeft) return this.availablePoints
      const q = this.searchLeft.toLowerCase()
      return this.availablePoints.filter(
        (p) =>
          p.point_code.toLowerCase().includes(q) ||
          p.point_name.toLowerCase().includes(q) ||
          (p.alias && p.alias.toLowerCase().includes(q)),
      )
    },
    filteredConfigured() {
      const points = this.configuredPoints
      if (!this.searchRight) return points
      const q = this.searchRight.toLowerCase()
      return points.filter(
        (p) =>
          p.point_code.toLowerCase().includes(q) ||
          (this.getAliasFallback(p) || '').toLowerCase().includes(q) ||
          (this.getPointNameFallback(p) || '').toLowerCase().includes(q) ||
          this.getDeviceName(p.device_id).toLowerCase().includes(q),
      )
    },
    configuredDeviceCount() {
      return new Set(this.configuredPoints.map((p) => p.device_id)).size
    },
  },
  watch: {
    schemeId: {
      handler(newVal) {
        if (newVal) {
          this.loadConfiguredPoints()
        }
      },
      immediate: false,
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
        const res = await this.$axios.get('/api/point_alias/list', {
          params: { device_id: this.selectedDeviceId },
        })
        if (Array.isArray(res)) {
          this.availablePoints = res.map((item) => ({
            point_code: item.point_code,
            point_name: item.point_name,
            alias: item.alias,
            device_id: item.device_id,
          }))
        } else if (res && res.code === 200) {
          const data = res.data || res
          this.availablePoints = Array.isArray(data)
            ? data.map((item) => ({
                point_code: item.point_code,
                point_name: item.point_name,
                alias: item.alias,
                device_id: item.device_id,
              }))
            : []
        }

        // ✅ 性能优化：清除缓存的 Set，下次使用时重新构建
        this.configuredPointCodesCache = null

        // ✅ 性能优化：加载完 availablePoints 后，补充已配置点位的详细信息
        this.enrichConfiguredPointsDetails()
      } catch (e) {
        console.error('加载可选点位失败:', e)
      } finally {
        this.loadingPoints = false
      }
    },

    // ✅ 新增方法：补充已配置点位的详细信息
    enrichConfiguredPointsDetails() {
      if (!this.configuredPoints.length || !this.availablePoints.length) return

      this.configuredPoints.forEach((rp) => {
        // 只补充当前选中设备的点位信息
        if (rp.device_id != this.selectedDeviceId) return

        const key = `${rp.device_id}_${rp.point_code}`
        const pointDetail = this.pointsMap.get(key)

        if (pointDetail) {
          // 只有当后端未返回时才补充
          if (!rp.point_name) rp.point_name = pointDetail.point_name || ''
          if (!rp.report_alias) rp.report_alias = pointDetail.alias || ''
        }
      })
    },

    async loadConfiguredPoints() {
      this.loadingConfig = true
      try {
        const res = await this.$axios.get('/api/mqtt/report_points', {
          params: { scheme_id: this.schemeId },
        })
        let data = []
        if (Array.isArray(res)) {
          data = res
        } else if (res && res.code === 200 && Array.isArray(res.data)) {
          data = res.data
        }

        // ✅ 性能优化：直接使用后端返回的数据，详细信息在加载 availablePoints 后补充
        this.configuredPoints = data.map((p) => ({ ...p }))

        // ✅ 性能优化：清除缓存的 Set，下次使用时重新构建
        this.configuredPointCodesCache = null
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

    selectAllLeft() {
      // ✅ 性能优化：使用 Set 提高查找效率，避免重复遍历
      const configuredSet = new Set(
        this.configuredPoints
          .filter((p) => p.device_id == this.selectedDeviceId)
          .map((p) => p.point_code),
      )

      const selectable = this.filteredAvailable
        .filter((p) => !configuredSet.has(p.point_code))
        .map((p) => p.point_code)

      if (this.leftSelected.length === selectable.length) {
        this.leftSelected = []
      } else {
        this.leftSelected = selectable
      }
    },

    isAlreadyAdded(pointCode) {
      // ✅ 性能优化：使用 Set 替代数组 some() 遍历
      if (!this.configuredPointCodesCache) {
        this.configuredPointCodesCache = new Set(
          this.configuredPoints
            .filter((p) => p.device_id == this.selectedDeviceId)
            .map((p) => p.point_code),
        )
      }
      return this.configuredPointCodesCache.has(pointCode)
    },

    // ========== 右侧选择 ==========
    toggleRightSelect(id) {
      const idx = this.rightSelected.indexOf(id)
      idx === -1 ? this.rightSelected.push(id) : this.rightSelected.splice(idx, 1)
    },

    selectAllRight() {
      const selectable = this.filteredConfigured
        .filter((p) => !this.selectedDeviceId || p.device_id == this.selectedDeviceId)
        .map((p) => p.id)
      if (this.rightSelected.length === selectable.length) {
        this.rightSelected = []
      } else {
        this.rightSelected = selectable
      }
    },

    // ========== 穿梭操作 ==========
    async addToRight() {
      if (this.leftSelected.length === 0 || !this.selectedDeviceId) return
      this.submitting = true
      try {
        // ✅ 性能优化：使用 Map 快速查找点位信息，避免遍历数组
        const points = this.leftSelected.map((code) => {
          const key = `${this.selectedDeviceId}_${code}`
          const point = this.pointsMap.get(key)
          const alias = point?.alias || code // 优先使用alias，如果没有则使用point_code
          return {
            device_id: Number(this.selectedDeviceId),
            point_code: alias, // 使用alias作为point_code的值
            report_alias: alias, // 使用alias作为report_alias的值
          }
        })
        const res = await this.$axios.post('/api/mqtt/report_points', {
          scheme_id: Number(this.schemeId),
          points,
        })
        if (res && res.code === 200) {
          this.$message &&
            this.$message.success(`已添加 ${res.data?.success_count || points.length} 个点位`)
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
          this.$message &&
            this.$message.success(`已移除 ${res.data?.deleted || this.rightSelected.length} 个点位`)
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

    getAliasFallback(rp) {
      // ✅ 性能优化：直接返回预计算的字段，无需查找
      return rp.report_alias || ''
    },

    getPointNameFallback(rp) {
      // ✅ 性能优化：直接返回预计算的字段，无需查找
      return rp.point_name || ''
    },

    getDeviceName(deviceId) {
      const d = this.devices.find((d) => d.id == deviceId)
      return d ? d.device_name : `设备${deviceId}`
    },
  },
}
</script>

<style scoped>
.rp {
  width: 100%;
}

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

.rp-device-bar select:focus {
  outline: none;
  border-color: #3498db;
}

/* 穿梭框 */
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

.rp-panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rp-btn-selall {
  padding: 2px 8px;
  border: 1px solid #3498db;
  border-radius: 3px;
  background: #fff;
  color: #3498db;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
}

.rp-btn-selall:hover {
  background: #3498db;
  color: #fff;
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

.rp-search input:focus {
  outline: none;
  border-color: #3498db;
}

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

.rp-placeholder i {
  font-size: 28px;
  color: #bdc3c7;
}

/* 列表项 */
.rp-list {
  padding: 4px 0;
}

.rp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f8f9fa;
}

.rp-item:hover {
  background: #f0f7ff;
}
.rp-item.selected {
  background: #e8f4fd;
}
.rp-item.added {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.rp-item.added:hover {
  background-color: #f5f5f5;
}

.rp-item.added .rp-item-code,
.rp-item.added .rp-item-name,
.rp-item.added .rp-item-alias {
  color: #999;
}

.rp-item.added input[type='checkbox'] {
  cursor: not-allowed;
}

.rp-item.disabled {
  opacity: 0.45;
  cursor: default;
}

.rp-item input[type='checkbox'] {
  flex-shrink: 0;
  cursor: pointer;
}

.rp-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rp-item-info-right {
  justify-content: space-between;
}

.rp-item-code {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  font-family: 'Menlo', 'Monaco', monospace;
}

.rp-item-name,
.rp-item-device,
.rp-item-alias {
  font-size: 12px;
  color: #7f8c8d;
}

.rp-item-alias {
  color: #5d6d7e;
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
.rp-item-right {
  gap: 6px;
}

.rp-alias-input {
  width: 80px;
  padding: 3px 6px;
  border: 1px solid #e1e5e9;
  border-radius: 3px;
  font-size: 12px;
  color: #2c3e50;
  flex-shrink: 0;
}

.rp-alias-input:focus {
  outline: none;
  border-color: #3498db;
}

.rp-status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}

.rp-status-tag.on {
  background: #d4edda;
  color: #155724;
}
.rp-status-tag.off {
  background: #f8d7da;
  color: #721c24;
}
.rp-status-tag:hover {
  opacity: 0.7;
}

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

.rp-btn-transfer:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 滚动条 */
.rp-panel-body::-webkit-scrollbar {
  width: 5px;
}
.rp-panel-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.rp-panel-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

/* 响应式 */
@media (max-width: 768px) {
  .rp-dialog {
    width: 98%;
    max-height: 95vh;
  }
  .rp-transfer {
    flex-direction: column;
  }
  .rp-actions {
    flex-direction: row;
    justify-content: center;
  }
  .rp-alias-input {
    width: 60px;
  }
}
</style>
