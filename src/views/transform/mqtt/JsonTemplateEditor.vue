<!-- src/views/transform/mqtt/JsonTemplateEditor.vue -->
<template>
  <div class="jte">
    <div class="jte-main">
      <!-- 左侧：树 -->
      <div class="jte-tree-panel">
        <div class="jte-panel-header">
          <span><i class="fas fa-sitemap"></i> JSON结构</span>
        </div>
        <div class="jte-tree-body">
          <div class="jte-root-brace">{ root</div>
          <div class="jte-tree-content">
            <JteNode
              v-for="(node, idx) in template.children"
              :key="node._id"
              :node="node"
              :node-index="idx"
              :selected-id="selectedId"
              :report-points="reportPoints"
              @select="selectNode"
              @remove="handleRemove"
              @add-child="handleAddChild"
              @move="handleMove"
            />
            <div class="jte-root-add">
              <button class="jte-add-btn" @click="addChild(template, 'leaf')">
                <i class="fas fa-plus"></i> 字段
              </button>
              <button class="jte-add-btn jte-add-obj" @click="addChild(template, 'object')">
                <i class="fas fa-folder-plus"></i> 对象
              </button>
              <button class="jte-add-btn jte-add-arr" @click="addChild(template, 'array')">
                <i class="fas fa-list-ol"></i> 数组
              </button>
            </div>
          </div>
          <div class="jte-root-brace">}</div>
          <div v-if="template.children.length === 0" class="jte-empty">
            <i class="fas fa-code"></i>
            <span>点击上方按钮开始构建JSON结构</span>
          </div>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="jte-preview-panel">
        <div class="jte-panel-header">
          <span><i class="fas fa-eye"></i> 实时预览</span>
          <button class="jte-copy-btn" @click="copyPreview" title="复制">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="jte-preview-body">
          <pre class="jte-json">{{ previewJson }}</pre>
        </div>
      </div>
    </div>

    <!-- 编辑面板 -->
    <div v-if="selectedNode" class="jte-editor">
      <div class="jte-editor-header">
        <span
          ><i class="fas fa-edit"></i> 编辑：<code>"{{ selectedNode.key || '未命名' }}"</code></span
        >
        <button class="jte-close-btn" @click="selectedId = null">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="jte-editor-body">
        <!-- 字段名（数组内的元素不需要key） -->
        <div v-if="!isSelectedInArray" class="jte-field">
          <label>字段名 (key)</label>
          <input type="text" v-model="selectedNode.key" placeholder="如 temperature" />
        </div>
        <div v-else class="jte-field">
          <label>数组元素</label>
          <span class="jte-hint">数组内的元素不需要字段名</span>
        </div>

        <!-- 对象节点 -->
        <div v-if="selectedNode.type === 'object'" class="jte-container-hint">
          <i class="fas fa-folder-open" style="color: #f39c12"></i>
          对象节点 — 可手动添加子字段，或开启自动填充
        </div>

        <!-- 数组节点 -->
        <div v-else-if="selectedNode.type === 'array'" class="jte-container-hint">
          <i class="fas fa-list" style="color: #9b59b6"></i>
          数组节点 — 可手动添加元素，或开启自动填充
        </div>

        <!-- 自动填充开关（对象和数组节点都有） -->
        <div
          v-if="selectedNode.type === 'object' || selectedNode.type === 'array'"
          class="jte-autofill"
        >
          <label class="jte-autofill-toggle">
            <input type="checkbox" v-model="selectedNode.auto_fill" />
            <span>自动填充方案内所有点位</span>
          </label>

          <div v-if="selectedNode.auto_fill" class="jte-autofill-options">
            <div class="jte-field">
              <label>填充模式</label>
              <select v-model="selectedNode.fill_mode">
                <template v-if="selectedNode.type === 'object'">
                  <option value="flat_kv">
                    平铺键值对 — {"TEMP_001": 25.6, "PRESS_001": 101.3}
                  </option>
                </template>
                <template v-if="selectedNode.type === 'array'">
                  <option value="array_simple">简单值 — [25.6, 101.3, 1]</option>
                  <option value="array_kv">点位键值 — [{"TEMP_001": 25.6}, ...]</option>
                  <option value="array_id_value">
                    ID+值 — [{"id": "TEMP_001", "value": 25.6}, ...]
                  </option>
                  <option value="array_full">
                    完整对象 — [{"point_code": "...", "name": "...", "value": ...}]
                  </option>
                </template>
              </select>
            </div>
            <div
              v-if="selectedNode.fill_mode === 'flat_kv' || selectedNode.fill_mode === 'array_kv'"
              class="jte-field"
            >
              <label>key 来源</label>
              <select v-model="selectedNode.key_field">
                <option value="point_code">点位代码 (point_code)</option>
                <option value="report_alias">上报别名 (report_alias，无别名时用point_code)</option>
              </select>
            </div>
            <div class="jte-autofill-preview">
              <i class="fas fa-info-circle"></i>
              运行时将自动填充方案内所有点位（当前
              {{ reportPoints.length }} 个），手动添加的子节点仍会保留
            </div>
          </div>
        </div>

        <!-- 叶子节点：值来源 -->
        <template v-if="selectedNode.type === 'leaf'">
          <div class="jte-field">
            <label>值来源</label>
            <div class="jte-source-tabs">
              <button
                :class="{ active: selectedNode.source === 'point' }"
                @click="setSource('point')"
              >
                <i class="fas fa-database"></i> 上报点位
              </button>
              <button
                :class="{ active: selectedNode.source === 'fixed' }"
                @click="setSource('fixed')"
              >
                <i class="fas fa-lock"></i> 固定值
              </button>
              <button
                :class="{ active: selectedNode.source === 'system' }"
                @click="setSource('system')"
              >
                <i class="fas fa-cog"></i> 系统变量
              </button>
            </div>
          </div>

          <!-- 上报点位：从已配置的 report_points 中选 -->
          <div v-if="selectedNode.source === 'point'" class="jte-field">
            <label>选择上报点位</label>
            <select v-model="selectedNode.point_id">
              <option value="">请选择</option>
              <option v-for="rp in reportPoints" :key="rp.id" :value="rp.id">
                {{ rp.point_code }}{{ rp.report_alias ? ' → ' + rp.report_alias : '' }} ({{
                  getDeviceName(rp.device_id)
                }})
              </option>
            </select>
            <span v-if="reportPoints.length === 0" class="jte-hint">
              <i class="fas fa-exclamation-triangle"></i>
              请先在「上报点位」tab中配置需要上报的点位
            </span>
          </div>

          <!-- 固定值 -->
          <div v-if="selectedNode.source === 'fixed'" class="jte-field">
            <label>固定值</label>
            <input type="text" v-model="selectedNode.value" placeholder="如 1.0、running、true" />
            <span class="jte-hint">数字/布尔值自动识别，其余作为字符串</span>
          </div>

          <!-- 系统变量 -->
          <div v-if="selectedNode.source === 'system'" class="jte-field">
            <label>系统变量</label>
            <select v-model="selectedNode.value">
              <option value="">请选择</option>
              <option value="timestamp">timestamp — 当前时间戳（毫秒）</option>
              <option value="timestamp_s">timestamp_s — 当前时间戳（秒）</option>
              <option value="datetime">datetime — 格式化时间</option>
              <option value="topic_name">topic_name — 当前topic名称</option>
              <option value="broker_name">broker_name — 当前broker名称</option>
              <option value="scheme_name">scheme_name — 当前方案名称</option>
              <option value="point_count">point_count — 方案内点位总数</option>
            </select>
          </div>
        </template>
      </div>
    </div>

    <div v-else class="jte-editor jte-editor-empty">
      <i class="fas fa-mouse-pointer"></i>
      <span>点击左侧节点进行编辑</span>
    </div>
  </div>
</template>

<script>
import JteNode from './JteNode.vue'

let _nid = 0
function gid() {
  return ++_nid
}

function mkNode(type, extra = {}) {
  return {
    _id: gid(),
    key: '',
    type, // 'object' | 'array' | 'leaf'
    source: type === 'leaf' ? 'point' : '',
    value: '',
    point_id: '',
    auto_fill: false,
    fill_mode: type === 'object' ? 'flat_kv' : 'array_kv',
    key_field: 'point_code',
    children: type === 'object' || type === 'array' ? [] : undefined,
    ...extra,
  }
}

export default {
  name: 'JsonTemplateEditor',
  components: { JteNode },
  props: {
    schemeId: { type: [Number, String], required: true },
    schemeName: { type: String, default: '' },
  },
  data() {
    return {
      template: { type: 'object', children: [] },
      selectedId: null,
      reportPoints: [],
      devices: [],
    }
  },
  computed: {
    selectedNode() {
      return this.selectedId ? this.findNode(this.template.children, this.selectedId) : null
    },
    isSelectedInArray() {
      if (!this.selectedId) return false
      return this.isNodeInArray(this.template, this.selectedId)
    },
    previewJson() {
      try {
        return JSON.stringify(this.buildPreview(this.template), null, 2)
      } catch (e) {
        return '{ }'
      }
    },
  },
  watch: {
    schemeId: {
      handler(newVal) {
        if (newVal) {
          this.loadReportPoints()
          this.loadTemplate()
        }
      },
      immediate: false,
    },
  },
  created() {
    this.loadReportPoints()
    this.loadDevices()
    this.loadTemplate()
  },
  methods: {
    // ========== 加载 ==========
    async loadReportPoints() {
      try {
        const res = await this.$axios.get('/api/mqtt/report_points', {
          params: { scheme_id: this.schemeId },
        })
        if (res && res.code === 200 && Array.isArray(res.data)) {
          const points = res.data

          // 收集所有唯一的device_id
          const deviceIds = [...new Set(points.map((p) => p.device_id))]

          // 批量获取所有设备的别名数据
          const aliasMap = {} // { device_id: [alias_data] }
          for (const deviceId of deviceIds) {
            try {
              const aliasRes = await this.$axios.get('/api/point_alias/list', {
                params: { device_id: deviceId },
              })
              let aliasData = []
              if (Array.isArray(aliasRes)) {
                aliasData = aliasRes
              } else if (aliasRes && aliasRes.code === 200) {
                aliasData = aliasRes.data || aliasRes
              }
              aliasMap[deviceId] = aliasData
            } catch (e) {
              console.error(`加载设备${deviceId}的alias失败:`, e)
            }
          }

          // 为每个点位匹配alias
          points.forEach((point) => {
            const aliasData = aliasMap[point.device_id] || []
            const match = aliasData.find((a) => a.point_code === point.point_code)
            if (match) {
              point.alias = match.alias
            }
          })

          this.reportPoints = points
        }
      } catch (e) {
        console.error('加载上报点位失败:', e)
      }
    },

    async loadDevices() {
      try {
        const res = await this.$axios.get('/api/device/config')
        if (res && res.code === 200) this.devices = res.data?.devices || []
      } catch (e) {}
    },

    async loadTemplate() {
      try {
        const res = await this.$axios.get('/api/mqtt/report_template', {
          params: { scheme_id: this.schemeId },
        })
        if (res && res.code === 200 && res.data?.template) {
          this.template = this.hydrateIds(res.data.template)
        }
      } catch (e) {}
    },

    async saveTemplate() {
      try {
        await this.$axios.put('/api/mqtt/report_template', {
          scheme_id: Number(this.schemeId),
          template: this.stripIds(this.template),
        })
        this.$message && this.$message.success('JSON结构已保存')
      } catch (e) {
        this.$message && this.$message.error('保存失败: ' + (e.message || '未知错误'))
      }
    },

    // ========== 树操作 ==========
    addChild(parent, type) {
      if (!parent.children) parent.children = []
      const node = mkNode(type)
      parent.children.push(node)
      this.selectedId = node._id
    },

    handleAddChild(ev) {
      if (ev && ev.parent) this.addChild(ev.parent, ev.type || 'leaf')
    },

    removeChild(parent, idx) {
      if (this.selectedId === parent.children[idx]._id) this.selectedId = null
      parent.children.splice(idx, 1)
    },

    selectNode(id) {
      this.selectedId = id
    },

    // 删除：通过 id 递归查找并删除
    handleRemove(id) {
      if (this.selectedId === id) this.selectedId = null
      this.removeById(this.template.children, id)
    },

    removeById(children, id) {
      const idx = children.findIndex((c) => c._id === id)
      if (idx !== -1) {
        children.splice(idx, 1)
        return true
      }
      for (const c of children) {
        if (c.children && this.removeById(c.children, id)) return true
      }
      return false
    },

    // 拖拽排序：同级节点移动
    handleMove({ fromId, toId }) {
      const reorder = (children) => {
        const fi = children.findIndex((c) => c._id === fromId)
        const ti = children.findIndex((c) => c._id === toId)
        if (fi !== -1 && ti !== -1) {
          const item = children.splice(fi, 1)[0]
          const newTi = children.findIndex((c) => c._id === toId)
          children.splice(newTi, 0, item)
          return true
        }
        for (const c of children) {
          if (c.children && reorder(c.children)) return true
        }
        return false
      }
      reorder(this.template.children)
    },

    setSource(s) {
      if (!this.selectedNode) return
      this.selectedNode.source = s
      this.selectedNode.value = ''
      this.selectedNode.point_id = ''
    },

    findNode(children, id) {
      for (const c of children) {
        if (c._id === id) return c
        if (c.children) {
          const f = this.findNode(c.children, id)
          if (f) return f
        }
      }
      return null
    },

    isNodeInArray(parent, id) {
      for (const c of parent.children || []) {
        if (c._id === id) return parent.type === 'array'
        if (c.children) {
          const found = this.isNodeInArray(c, id)
          if (found) return true
        }
      }
      return false
    },

    getDeviceName(deviceId) {
      const d = this.devices.find((d) => d.id == deviceId)
      return d ? d.device_name : `设备${deviceId}`
    },

    // ========== 预览 ==========
    buildPreview(node) {
      if (node.type === 'object') {
        const obj = {}
        // 手动添加的子节点
        for (const c of node.children || []) {
          obj[c.key || '未命名'] = this.nodePreviewValue(c)
        }
        // 自动填充
        if (node.auto_fill && node.fill_mode === 'flat_kv') {
          for (const rp of this.reportPoints) {
            const k = rp.alias || rp.report_alias || rp.point_code
            obj[k] = `<${rp.point_code}>`
          }
        }
        return obj
      }
      if (node.type === 'array') {
        const arr = []
        // 手动添加的子节点
        for (const c of node.children || []) {
          arr.push(this.nodePreviewValue(c))
        }
        // 自动填充
        if (node.auto_fill) {
          const sample = this.reportPoints.slice(0, 3)
          for (const rp of sample) {
            const k = rp.alias || rp.report_alias || rp.point_code
            if (node.fill_mode === 'array_simple') {
              arr.push(`<${rp.point_code}>`)
            } else if (node.fill_mode === 'array_kv') {
              const o = {}
              o[k] = `<${rp.point_code}>`
              arr.push(o)
            } else if (node.fill_mode === 'array_id_value') {
              arr.push({ id: k, value: `<${rp.point_code}>` })
            } else if (node.fill_mode === 'array_full') {
              arr.push({
                point_code: rp.point_code,
                name: rp.alias || rp.report_alias || rp.point_code,
                device: this.getDeviceName(rp.device_id),
                value: `<${rp.point_code}>`,
              })
            }
          }
          if (this.reportPoints.length > 3)
            arr.push('...' + (this.reportPoints.length - 3) + ' more')
        }
        return arr
      }
      return {}
    },

    nodePreviewValue(c) {
      if (c.type === 'object') return this.buildPreview(c)
      if (c.type === 'array') return this.buildPreview(c)
      if (c.source === 'point') {
        const rp = this.reportPoints.find((p) => p.id == c.point_id)
        return rp ? `<${rp.report_alias || rp.point_code}>` : null
      }
      if (c.source === 'fixed') {
        const v = c.value
        if (v === '') return null
        if (v === 'true') return true
        if (v === 'false') return false
        return isNaN(v) ? v : Number(v)
      }
      if (c.source === 'system') return c.value ? `\${${c.value}}` : null
      return null
    },

    // ========== 序列化 ==========
    hydrateIds(t) {
      const h = (n) => {
        n._id = gid()
        if (n.children) n.children.forEach(h)
        return n
      }
      return h(JSON.parse(JSON.stringify(t || { type: 'object', children: [] })))
    },
    stripIds(t) {
      const s = (n) => {
        const { _id, _rp_id, ...r } = n
        if (r.children) r.children = r.children.map(s)
        return r
      }
      return s(JSON.parse(JSON.stringify(t)))
    },

    copyPreview() {
      navigator.clipboard
        .writeText(this.previewJson)
        .then(() => {
          this.$message && this.$message.success('已复制')
        })
        .catch(() => {})
    },

    resetTemplate() {
      if (confirm('确定重置？所有JSON结构配置将清空。')) {
        this.template = { type: 'object', children: [] }
        this.selectedId = null
      }
    },

    // 供父组件刷新点位列表（切换tab时）
    refreshReportPoints() {
      this.loadReportPoints()
    },
  },
}
</script>

<style scoped>
.jte {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.jte-main {
  display: flex;
  gap: 12px;
}

.jte-tree-panel,
.jte-preview-panel {
  flex: 1;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-width: 0;
}
.jte-tree-panel {
  flex: 1.3;
}
.jte-preview-panel {
  flex: 0.7;
}

.jte-panel-header {
  padding: 10px 14px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}
.jte-panel-header i {
  margin-right: 6px;
  color: #7f8c8d;
}

.jte-copy-btn {
  background: none;
  border: 1px solid #d1d9e6;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  color: #7f8c8d;
  font-size: 12px;
}
.jte-copy-btn:hover {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}

.jte-tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  min-height: 240px;
  max-height: 400px;
}

.jte-root-brace {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #2c3e50;
  padding: 2px 4px;
}
.jte-tree-content {
  padding: 4px 0 4px 8px;
}

.jte-root-add {
  display: flex;
  gap: 8px;
  padding: 8px 4px;
  margin-top: 4px;
  border-top: 1px dashed #e1e5e9;
}
.jte-add-btn {
  padding: 5px 14px;
  border: 1px dashed #bdc3c7;
  border-radius: 5px;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.jte-add-btn:hover {
  border-color: #3498db;
  color: #3498db;
  background: #f0f7ff;
}
.jte-add-obj:hover {
  border-color: #f39c12;
  color: #e67e22;
  background: #fef9e7;
}
.jte-add-arr:hover {
  border-color: #9b59b6;
  color: #8e44ad;
  background: #f5eef8;
}

.jte-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #95a5a6;
  gap: 8px;
  font-size: 13px;
}
.jte-empty i {
  font-size: 32px;
  color: #bdc3c7;
}

.jte-preview-body {
  flex: 1;
  overflow: auto;
  padding: 14px;
  min-height: 240px;
  max-height: 400px;
  background: #1e1e1e;
  border-radius: 0 0 8px 8px;
}
.jte-json {
  margin: 0;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 编辑面板 */
.jte-editor {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.jte-editor-header {
  padding: 10px 14px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}
.jte-editor-header code {
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 13px;
  color: #c0392b;
}

.jte-close-btn {
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}
.jte-close-btn:hover {
  color: #e74c3c;
}

.jte-editor-body {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.jte-editor-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #95a5a6;
  font-size: 13px;
}

.jte-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  flex: 1;
}
.jte-field-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

.jte-field label {
  font-size: 13px;
  font-weight: 500;
  color: #34495e;
}
.jte-field input,
.jte-field select {
  padding: 8px 10px;
  border: 1px solid #d1d9e6;
  border-radius: 5px;
  font-size: 13px;
  color: #2c3e50;
  background: #fff;
}
.jte-field input:focus,
.jte-field select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.jte-hint {
  font-size: 11px;
  color: #95a5a6;
  display: flex;
  align-items: center;
  gap: 4px;
}
.jte-hint i {
  color: #f39c12;
}

.jte-source-tabs {
  display: flex;
  gap: 6px;
}
.jte-source-tabs button {
  padding: 7px 14px;
  border: 1px solid #d1d9e6;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.jte-source-tabs button:hover {
  border-color: #3498db;
  color: #3498db;
}
.jte-source-tabs button.active {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
}

.jte-container-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
  width: 100%;
  background: #fef9e7;
  border: 1px solid #fdeaa8;
  color: #856404;
}

/* 自动填充 */
.jte-autofill {
  width: 100%;
}

.jte-autofill-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  padding: 8px 0;
}
.jte-autofill-toggle input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.jte-autofill-options {
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.jte-autofill-preview {
  font-size: 12px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 4px;
  border: 1px solid #c8e6c9;
  color: #2e7d32;
}
.jte-autofill-preview i {
  color: #43a047;
}

.jte-tree-body::-webkit-scrollbar,
.jte-preview-body::-webkit-scrollbar {
  width: 5px;
}
.jte-tree-body::-webkit-scrollbar-thumb,
.jte-preview-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

@media (max-width: 768px) {
  .jte-main {
    flex-direction: column;
  }
  .jte-source-tabs {
    flex-wrap: wrap;
  }
}
</style>
