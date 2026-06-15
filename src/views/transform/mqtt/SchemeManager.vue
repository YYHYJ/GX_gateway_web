<!-- src/views/transform/mqtt/SchemeManager.vue -->
<template>
  <div class="sm">
    <!-- 头部 -->
    <div class="sm-header">
      <h3><i class="fas fa-layer-group"></i> 上报方案管理</h3>
      <button class="sm-btn-add" @click="showCreate"><i class="fas fa-plus"></i> 新建方案</button>
    </div>

    <!-- 方案列表 -->
    <div class="sm-body">
      <div v-if="loading" class="sm-loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>

      <div v-else-if="schemes.length === 0" class="sm-empty">
        <i class="fas fa-inbox"></i>
        <span>暂无上报方案，点击右上角新建</span>
      </div>

      <div v-else class="sm-list">
        <div
          v-for="s in schemes"
          :key="s.id"
          class="sm-card"
          :class="{ active: activeSchemeId === s.id }"
          @click="selectScheme(s)"
        >
          <div class="sm-card-top">
            <span class="sm-card-name">{{ s.scheme_name }}</span>
            <span class="sm-card-interval">{{ s.publish_interval }}ms</span>
          </div>
          <div class="sm-card-desc">{{ s.description || '无描述' }}</div>
          <div class="sm-card-actions">
            <button class="sm-act-btn" @click.stop="showEdit(s)" title="编辑">
              <i class="fas fa-edit"></i>
            </button>
            <button class="sm-act-btn sm-act-del" @click.stop="deleteScheme(s)" title="删除">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中方案后：点位配置 + JSON结构 -->
    <div v-if="activeScheme" class="sm-points-section">
      <div class="sm-points-header">
        <h4>
          <i class="fas fa-database"></i>
          {{ activeScheme.scheme_name }}
        </h4>
        <div class="sm-tabs">
          <button :class="{ active: activeTab === 'points' }" @click="activeTab = 'points'">
            <i class="fas fa-list"></i> 点位配置
          </button>
          <button :class="{ active: activeTab === 'json' }" @click="activeTab = 'json'">
            <i class="fas fa-code"></i> JSON结构
          </button>
        </div>
      </div>
      <div v-show="activeTab === 'points'">
        <ReportPointsConfig :scheme-id="activeScheme.id" :scheme-name="activeScheme.scheme_name" />
      </div>
      <div v-show="activeTab === 'json'" class="sm-json-section">
        <JsonTemplateEditor
          ref="jsonEditor"
          :scheme-id="activeScheme.id"
          :scheme-name="activeScheme.scheme_name"
        />
        <div class="sm-json-actions">
          <button class="sm-btn-save-json" @click="saveJsonTemplate">
            <i class="fas fa-save"></i> 保存JSON结构
          </button>
          <button class="sm-btn-reset-json" @click="resetJsonTemplate">
            <i class="fas fa-undo"></i> 重置
          </button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div v-if="showDialog" class="sm-overlay" @click.self="showDialog = false">
      <div class="sm-dialog">
        <div class="sm-dialog-header">
          <h4>{{ editingScheme ? '编辑方案' : '新建方案' }}</h4>
          <button class="sm-dialog-close" @click="showDialog = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="sm-dialog-body">
          <div class="sm-field">
            <label>方案名称 <span class="required">*</span></label>
            <input type="text" v-model="form.scheme_name" placeholder="如：关键指标上报" />
          </div>
          <div class="sm-field">
            <label>发布频率 (毫秒)</label>
            <input
              type="number"
              v-model.number="form.publish_interval"
              min="100"
              step="1000"
              placeholder="5000"
            />
            <span class="sm-hint">默认 5000ms，最小 100ms</span>
          </div>
          <div class="sm-field">
            <label>描述</label>
            <input type="text" v-model="form.description" placeholder="可选" />
          </div>
        </div>
        <div class="sm-dialog-footer">
          <button class="sm-btn-cancel" @click="showDialog = false">取消</button>
          <button class="sm-btn-save" @click="saveScheme" :disabled="!form.scheme_name.trim()">
            {{ editingScheme ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ReportPointsConfig from './ReportPointsConfig.vue'
import JsonTemplateEditor from './JsonTemplateEditor.vue'

export default {
  name: 'SchemeManager',
  components: { ReportPointsConfig, JsonTemplateEditor },
  emits: ['schemes-changed'],
  data() {
    return {
      schemes: [],
      loading: false,
      activeSchemeId: null,
      activeTab: 'points',
      showDialog: false,
      editingScheme: null,
      form: {
        scheme_name: '',
        publish_interval: 5000,
        description: '',
        template_json: null,
      },
      useMockMode: false,
      mockSchemes: [
        {
          id: 101,
          scheme_name: '默认上报方案',
          publish_interval: 5000,
          description: '这是本地模拟方案，仅用于展示页面',
        },
        {
          id: 102,
          scheme_name: '温度/湿度上报',
          publish_interval: 3000,
          description: '模拟多点位上报方案',
        },
      ],
    }
  },
  watch: {
    activeTab(val) {
      if (val === 'json' && this.$refs.jsonEditor) {
        this.$refs.jsonEditor.refreshReportPoints()
      }
    },
  },
  computed: {
    activeScheme() {
      return this.schemes.find((s) => s.id === this.activeSchemeId) || null
    },
  },
  created() {
    this.loadSchemes()
  },
  methods: {
    async loadSchemes() {
      this.loading = true
      try {
        const res = await this.$axios.get('/api/mqtt/scheme')
        const payload = res && res.data !== undefined ? res.data : res
        if (Array.isArray(payload)) {
          this.schemes = payload
        } else if (payload && Array.isArray(payload.data)) {
          this.schemes = payload.data
        }
      } catch (e) {
        console.error('加载方案失败:', e)
        if (this.useMockMode) {
          console.warn('启用本地模拟数据')
          this.schemes = this.mockSchemes.slice()
        }
      } finally {
        if (this.useMockMode && (!Array.isArray(this.schemes) || this.schemes.length === 0)) {
          this.schemes = this.mockSchemes.slice()
        }
        this.loading = false
      }
    },

    selectScheme(s) {
      if (this.activeSchemeId === s.id) {
        this.activeSchemeId = null
      } else {
        this.activeSchemeId = s.id
        this.activeTab = 'points'
      }
    },

    showCreate() {
      this.editingScheme = null
      this.form = {
        scheme_name: '',
        publish_interval: 5000,
        description: '',
        template_json: null,
      }
      this.showDialog = true
    },

    showEdit(s) {
      this.editingScheme = s
      this.form = {
        scheme_name: s.scheme_name,
        publish_interval: s.publish_interval,
        description: s.description || '',
        template_json: s.template_json ?? null,
      }
      this.showDialog = true
    },

    getNextSchemeId() {
      const maxId = this.schemes.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
      return maxId + 1
    },

    async saveScheme() {
      if (!this.form.scheme_name.trim()) return

      // 构建后端期望的请求体
      const payload = {
        scheme_name: String(this.form.scheme_name).trim(),
        publish_interval: Number(this.form.publish_interval) || 5000,
        description: this.form.description || '',
        template_json: this.form.template_json ?? null,
      }

      try {
        if (this.editingScheme) {
          await this.$axios.put('/api/mqtt/scheme', { id: this.editingScheme.id, ...payload })
          this.$message && this.$message.success('方案已更新')
        } else {
          await this.$axios.post('/api/mqtt/scheme', payload)
          this.$message && this.$message.success('方案已创建')
        }

        this.showDialog = false
        await this.loadSchemes()
        this.$emit('schemes-changed')
      } catch (e) {
        if (this.useMockMode) {
          console.warn('保存方案失败，使用本地模拟数据:', e)
          if (this.editingScheme) {
            const index = this.schemes.findIndex((item) => item.id === this.editingScheme.id)
            if (index !== -1) {
              this.schemes.splice(index, 1, { id: this.editingScheme.id, ...this.form })
            }
          } else {
            this.schemes.push({ id: this.getNextSchemeId(), ...this.form })
          }
          this.showDialog = false
          this.$message && this.$message.success('已进入本地模拟模式，保存成功')
          this.$emit('schemes-changed')
        } else {
          this.$message && this.$message.error('操作失败: ' + (e.message || '未知错误'))
        }
      }
    },

    async deleteScheme(s) {
      if (
        !confirm(
          `确定删除方案「${s.scheme_name}」吗？\n\n将同时删除该方案下的所有点位配置，并解绑引用此方案的 topic。`,
        )
      )
        return
      try {
        await this.$axios.delete('/api/mqtt/scheme', { data: { id: s.id } })
        if (this.activeSchemeId === s.id) this.activeSchemeId = null
        this.$message && this.$message.success('方案已删除')
        await this.loadSchemes()
        this.$emit('schemes-changed')
      } catch (e) {
        if (this.useMockMode) {
          console.warn('删除方案失败，使用本地模拟数据:', e)
          this.schemes = this.schemes.filter((item) => item.id !== s.id)
          if (this.activeSchemeId === s.id) this.activeSchemeId = null
          this.$message && this.$message.success('已进入本地模拟模式，删除成功')
          this.$emit('schemes-changed')
        } else {
          this.$message && this.$message.error('删除失败: ' + (e.message || '未知错误'))
        }
      }
    },

    saveJsonTemplate() {
      this.$refs.jsonEditor && this.$refs.jsonEditor.saveTemplate()
    },

    resetJsonTemplate() {
      this.$refs.jsonEditor && this.$refs.jsonEditor.resetTemplate()
    },
  },
}
</script>

<style scoped>
.sm {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
}

.sm-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sm-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sm-header h3 i {
  color: #8e44ad;
}

.sm-btn-add {
  padding: 8px 16px;
  background: #8e44ad;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sm-btn-add:hover {
  background: #7d3c98;
}

.sm-body {
  padding: 16px 20px;
}

.sm-loading,
.sm-empty {
  padding: 30px;
  text-align: center;
  color: #95a5a6;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.sm-empty i,
.sm-loading i {
  font-size: 28px;
  color: #bdc3c7;
}

/* 方案卡片列表 */
.sm-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sm-card {
  flex: 0 0 calc(33.33% - 8px);
  min-width: 220px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.sm-card:hover {
  border-color: #8e44ad;
  box-shadow: 0 2px 8px rgba(142, 68, 173, 0.1);
}
.sm-card.active {
  border-color: #8e44ad;
  background: #faf5ff;
  box-shadow: 0 2px 8px rgba(142, 68, 173, 0.15);
}

.sm-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.sm-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}
.sm-card-interval {
  font-size: 11px;
  background: #f0e6f6;
  color: #8e44ad;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.sm-card-desc {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.sm-card-actions {
  display: flex;
  gap: 6px;
}
.sm-act-btn {
  background: none;
  border: 1px solid #d1d9e6;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  color: #7f8c8d;
}
.sm-act-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
  border-color: #95a5a6;
}
.sm-act-del:hover {
  color: #e74c3c;
  border-color: #e74c3c;
  background: #fdecea;
}

/* 点位配置区域 */
.sm-points-section {
  border-top: 1px solid #e1e5e9;
  padding: 16px 20px;
}
.sm-points-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sm-points-header h4 i {
  color: #3498db;
}

/* Tab 切换 */
.sm-points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sm-tabs {
  display: flex;
  gap: 4px;
}

.sm-tabs button {
  padding: 6px 14px;
  border: 1px solid #d1d9e6;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.sm-tabs button:hover {
  border-color: #8e44ad;
  color: #8e44ad;
}
.sm-tabs button.active {
  background: #8e44ad;
  color: #fff;
  border-color: #8e44ad;
}

/* JSON结构区域 */
.sm-json-section {
  padding-top: 12px;
}

.sm-json-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e1e5e9;
}

.sm-btn-save-json {
  padding: 8px 16px;
  background: #8e44ad;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}
.sm-btn-save-json:hover {
  background: #7d3c98;
}

.sm-btn-reset-json {
  padding: 8px 16px;
  background: #fff;
  color: #7f8c8d;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.sm-btn-reset-json:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

/* 弹窗 */
.sm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.sm-dialog {
  background: #fff;
  border-radius: 10px;
  width: 440px;
  max-width: 92%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}
.sm-dialog-header {
  padding: 14px 20px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sm-dialog-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}
.sm-dialog-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #95a5a6;
  cursor: pointer;
}
.sm-dialog-close:hover {
  color: #e74c3c;
}

.sm-dialog-body {
  padding: 20px;
}

.sm-field {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sm-field label {
  font-size: 13px;
  font-weight: 500;
  color: #34495e;
}
.sm-field .required {
  color: #e74c3c;
}
.sm-field input {
  padding: 8px 12px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
}
.sm-field input:focus {
  outline: none;
  border-color: #8e44ad;
  box-shadow: 0 0 0 2px rgba(142, 68, 173, 0.1);
}
.sm-hint {
  font-size: 11px;
  color: #95a5a6;
}

.sm-dialog-footer {
  padding: 14px 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.sm-btn-cancel {
  padding: 8px 16px;
  background: #fff;
  color: #7f8c8d;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.sm-btn-cancel:hover {
  background: #f8f9fa;
}
.sm-btn-save {
  padding: 8px 16px;
  background: #8e44ad;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.sm-btn-save:hover {
  background: #7d3c98;
}
.sm-btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .sm-card {
    flex: 0 0 100%;
  }
}
</style>
