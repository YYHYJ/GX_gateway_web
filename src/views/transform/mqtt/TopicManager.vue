<!-- src/views/transform/mqtt/TopicManager.vue -->
<template>
  <div class="topic-manager">
    <div class="section-header">
      <h4><i class="fas fa-list"></i> 主题管理配置</h4>
    </div>

    <div class="section-content">
      <!-- 功能开关 -->
      <div class="config-row first-row">
        <div class="config-item full-width">
          <div class="toggle-group">
            <label class="toggle-label">
              <input type="checkbox" v-model="config.enablePublish" :disabled="!enabled" />
              <span class="toggle-text">启用发布功能</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="config.enableSubscribe" :disabled="!enabled" />
              <span class="toggle-text">启用订阅功能</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 发布主题配置 -->
      <div v-if="config.enablePublish" class="topic-section publish-section">
        <div class="section-title">
          <h5><i class="fas fa-upload"></i> 发布主题配置</h5>
          <div class="topic-count">已配置：{{ publishTopicsCount }}个</div>
        </div>

        <div class="config-row">
          <div class="config-item full-width">
            <div class="label-group">
              <span class="config-label">主题</span>
              <span class="required">*</span>
            </div>
            <input
              type="text"
              v-model="newPublish.topic"
              placeholder="energy/data/${device_id}/metrics"
              :disabled="!enabled"
            />
            <div class="hint">可用变量: ${device_id}, ${timestamp}, ${site_id}, ${data.*}</div>
          </div>
        </div>

        <div class="config-row">
          <div class="config-item">
            <div class="label-group">
              <span class="config-label">QoS等级</span>
            </div>
            <select v-model="newPublish.qos" :disabled="!enabled" class="qos-select">
              <option value="0">QoS 0 - 至多一次</option>
              <option value="1">QoS 1 - 至少一次</option>
              <option value="2">QoS 2 - 恰好一次</option>
            </select>
          </div>

          <div class="config-item">
            <div class="label-group">
              <span class="config-label">消息保留</span>
            </div>
            <select v-model="newPublish.retain" :disabled="!enabled" class="retain-select">
              <option :value="false">不保留</option>
              <option :value="true">保留</option>
            </select>
          </div>

          <div class="config-item action-item">
            <button
              class="btn-add"
              @click="addPublishTopic"
              :disabled="!enabled || !newPublish.topic.trim()"
            >
              <i class="fas fa-plus"></i> 添加发布主题
            </button>
          </div>
        </div>
      </div>

      <!-- 订阅主题配置 -->
      <div v-if="config.enableSubscribe" class="topic-section subscribe-section">
        <div class="section-title">
          <h5><i class="fas fa-download"></i> 订阅主题配置</h5>
          <div class="topic-count">已配置：{{ subscribeTopicsCount }}个</div>
        </div>

        <div class="config-row">
          <div class="config-item full-width">
            <div class="label-group">
              <span class="config-label">主题</span>
              <span class="required">*</span>
            </div>
            <input
              type="text"
              v-model="newSubscribe.topic"
              placeholder="energy/control/+/command"
              :disabled="!enabled"
            />
            <div class="hint">支持通配符: + (单层), # (多层)</div>
          </div>
        </div>

        <div class="config-row">
          <div class="config-item">
            <div class="label-group">
              <span class="config-label">QoS等级</span>
            </div>
            <select v-model="newSubscribe.qos" :disabled="!enabled" class="qos-select">
              <option value="0">QoS 0 - 至多一次</option>
              <option value="1">QoS 1 - 至少一次</option>
              <option value="2">QoS 2 - 恰好一次</option>
            </select>
          </div>

          <div class="config-item action-item">
            <button
              class="btn-add"
              @click="addSubscribeTopic"
              :disabled="!enabled || !newSubscribe.topic.trim()"
            >
              <i class="fas fa-plus"></i> 添加订阅主题
            </button>
          </div>
        </div>
      </div>

      <!-- 主题列表表格 -->
      <div v-if="allTopicsCount > 0" class="topics-table">
        <div class="table-header">
          <h5><i class="fas fa-table"></i> 主题列表</h5>
          <div class="table-summary">共 {{ allTopicsCount }} 个主题</div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th width="80">类型</th>
                <th>主题</th>
                <th width="70">QoS</th>
                <th width="70">保留</th>
                <th width="80">状态</th>
                <th width="140">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="topic in config.topics" :key="topic.id">
                <td>
                  <span class="topic-type" :class="topic.type">
                    {{ topic.type === 'publish' ? '发布' : '订阅' }}
                  </span>
                </td>
                <td>
                  <div class="topic-path">
                    <code>{{ topic.topic }}</code>
                    <button
                      v-if="topic.type === 'publish'"
                      class="btn-copy"
                      @click="copyToClipboard(topic.topic)"
                      title="复制主题"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </td>
                <td>
                  <span class="qos-badge" :class="`qos-${topic.qos}`">
                    {{ topic.qos }}
                  </span>
                </td>
                <td>
                  <span v-if="topic.type === 'publish'">
                    {{ topic.retain ? '是' : '否' }}
                  </span>
                  <span v-else class="na">-</span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="{ 'status-active': topic.enabled, 'status-inactive': !topic.enabled }"
                  >
                    {{ topic.enabled ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="btn-action btn-edit"
                      @click="editTopic(topic)"
                      :disabled="!enabled"
                      title="编辑"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn-action btn-delete"
                      @click="deleteTopic(topic.id)"
                      :disabled="!enabled"
                      title="删除"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                    <button
                      class="btn-action btn-toggle"
                      @click="toggleTopic(topic.id)"
                      :disabled="!enabled"
                      :title="topic.enabled ? '禁用' : '启用'"
                    >
                      <i :class="topic.enabled ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <i class="fas fa-inbox"></i>
          <h5>暂无主题配置</h5>
          <p>请添加发布或订阅主题来开始配置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopicManager',
  props: {
    configData: {
      type: Object,
      required: true,
      default: () => ({
        enablePublish: true,
        enableSubscribe: true,
        topics: [],
      }),
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['config-change'],
  data() {
    return {
      config: { ...this.configData },
      newPublish: {
        topic: '',
        qos: '1',
        retain: false,
      },
      newSubscribe: {
        topic: '',
        qos: '1',
      },
      editingId: null,
    }
  },
  computed: {
    publishTopicsCount() {
      return this.config.topics.filter((t) => t.type === 'publish').length
    },
    subscribeTopicsCount() {
      return this.config.topics.filter((t) => t.type === 'subscribe').length
    },
    allTopicsCount() {
      return this.config.topics.length
    },
  },
  watch: {
    config: {
      handler(newVal) {
        this.$emit('config-change', { ...newVal })
      },
      deep: true,
      immediate: true,
    },
    configData: {
      handler(newVal) {
        if (JSON.stringify(this.config) !== JSON.stringify(newVal)) {
          this.config = { ...newVal }
        }
      },
      deep: true,
    },
  },
  methods: {
    // 添加发布主题
    addPublishTopic() {
      if (!this.newPublish.topic.trim()) return

      if (this.editingId) {
        // 编辑模式
        const index = this.config.topics.findIndex((t) => t.id === this.editingId)
        if (index > -1) {
          this.config.topics[index] = {
            ...this.config.topics[index],
            topic: this.newPublish.topic,
            qos: this.newPublish.qos,
            retain: this.newPublish.retain,
          }
        }
        this.editingId = null
      } else {
        // 新增模式
        const newTopic = {
          id: Date.now() + Math.random(),
          type: 'publish',
          topic: this.newPublish.topic,
          qos: this.newPublish.qos,
          retain: this.newPublish.retain,
          enabled: true,
        }
        this.config.topics.push(newTopic)
      }

      // 重置表单
      this.newPublish = {
        topic: '',
        qos: '1',
        retain: false,
      }
    },

    // 添加订阅主题
    addSubscribeTopic() {
      if (!this.newSubscribe.topic.trim()) return

      if (this.editingId) {
        // 编辑模式
        const index = this.config.topics.findIndex((t) => t.id === this.editingId)
        if (index > -1) {
          this.config.topics[index] = {
            ...this.config.topics[index],
            topic: this.newSubscribe.topic,
            qos: this.newSubscribe.qos,
          }
        }
        this.editingId = null
      } else {
        // 新增模式
        const newTopic = {
          id: Date.now() + Math.random(),
          type: 'subscribe',
          topic: this.newSubscribe.topic,
          qos: this.newSubscribe.qos,
          enabled: true,
        }
        this.config.topics.push(newTopic)
      }

      // 重置表单
      this.newSubscribe = {
        topic: '',
        qos: '1',
      }
    },

    // 编辑主题
    editTopic(topic) {
      this.editingId = topic.id

      if (topic.type === 'publish') {
        this.newPublish = {
          topic: topic.topic,
          qos: topic.qos,
          retain: topic.retain || false,
        }
      } else {
        this.newSubscribe = {
          topic: topic.topic,
          qos: topic.qos,
        }
      }

      // 滚动到顶部
      this.$el.querySelector('.topic-section')?.scrollIntoView({ behavior: 'smooth' })
    },

    // 删除主题
    deleteTopic(id) {
      this.config.topics = this.config.topics.filter((t) => t.id !== id)
    },

    // 切换主题启用状态
    toggleTopic(id) {
      const topic = this.config.topics.find((t) => t.id === id)
      if (topic) {
        topic.enabled = !topic.enabled
      }
    },

    // 复制到剪贴板
    copyToClipboard(text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          // 可以添加提示消息
          console.log('已复制到剪贴板:', text)
        })
        .catch((err) => {
          console.error('复制失败:', err)
        })
    },

    // 获取当前配置
    getConfig() {
      return { ...this.config }
    },

    // 验证配置
    validate() {
      const errors = []

      if (this.config.enablePublish && this.publishTopicsCount === 0) {
        errors.push('已启用发布功能，但未配置发布主题')
      }

      if (this.config.enableSubscribe && this.subscribeTopicsCount === 0) {
        errors.push('已启用订阅功能，但未配置订阅主题')
      }

      // 验证主题格式
      this.config.topics.forEach((topic, index) => {
        if (!topic.topic.trim()) {
          errors.push(`第${index + 1}个主题路径不能为空`)
        }

        // 验证通配符使用（订阅主题）
        if (topic.type === 'subscribe') {
          const topicStr = topic.topic
          // 检查通配符使用是否正确
          if (topicStr.includes('#') && topicStr.indexOf('#') !== topicStr.length - 1) {
            errors.push(`订阅主题"${topicStr}"：多层通配符#只能出现在最后`)
          }
        }
      })

      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
}
</script>

<style scoped>
.topic-manager {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e1e5e9;
}

.section-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.section-header h4 i {
  color: #3498db;
}

.section-content {
  padding: 20px;
}

/* 栅格布局系统 */
.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
  align-items: start;
  min-height: 60px;
}

.config-row.first-row {
  margin-bottom: 8px;
  min-height: auto;
}

.config-item {
  display: flex;
  flex-direction: column;
  min-height: 60px;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

.config-item.action-item {
  display: flex;
  align-items: flex-end;
}

/* 功能开关 */
.toggle-group {
  display: flex;
  gap: 40px;
  padding: 8px 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  font-weight: 500;
  color: #34495e;
}

.toggle-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
}

.toggle-text {
  font-size: 14px;
}

/* 主题配置区域 */
.topic-section {
  background: #f8fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.topic-section.publish-section {
  border-left: 4px solid #3498db;
}

.topic-section.subscribe-section {
  border-left: 4px solid #2ecc71;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title h5 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.section-title h5 i {
  color: #7f8c8d;
}

.topic-count {
  font-size: 13px;
  color: #7f8c8d;
  background: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
}

/* 标签组样式 */
.label-group {
  margin-bottom: 8px;
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-label {
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
  line-height: 1.4;
}

.required {
  color: #e74c3c;
  font-size: 14px;
}

/* 输入框样式 */
input[type='text'],
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
  background: #fff;
  transition: all 0.2s;
  height: 40px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

input:disabled,
select:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
  color: #95a5a6;
  border-color: #ecf0f1;
}

.hint {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
  line-height: 1.4;
}

/* 添加按钮 */
.btn-add {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  height: 40px;
}

.btn-add:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #1f6396 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #95a5a6;
}

/* 下拉选择框 */
.qos-select,
.retain-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237f8c8d' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 32px;
}

/* 主题列表表格 */
.topics-table {
  margin-top: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-header h5 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.table-header h5 i {
  color: #7f8c8d;
}

.table-summary {
  font-size: 13px;
  color: #7f8c8d;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

thead {
  background: #f8fafc;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #34495e;
  border-bottom: 2px solid #e1e5e9;
  white-space: nowrap;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: middle;
}

tbody tr:hover {
  background-color: #f8fafc;
}

/* 主题类型标签 */
.topic-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 50px;
}

.topic-type.publish {
  background-color: #d1ecf1;
  color: #0c5460;
}

.topic-type.subscribe {
  background-color: #d4edda;
  color: #155724;
}

/* 主题路径 */
.topic-path {
  display: flex;
  align-items: center;
  gap: 8px;
}

code {
  background-color: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #2c3e50;
  word-break: break-all;
  flex: 1;
}

.btn-copy {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  transition: color 0.2s;
}

.btn-copy:hover {
  color: #3498db;
}

/* QoS徽章 */
.qos-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 24px;
}

.qos-0 {
  background-color: #d1ecf1;
  color: #0c5460;
}

.qos-1 {
  background-color: #d4edda;
  color: #155724;
}

.qos-2 {
  background-color: #f8d7da;
  color: #721c24;
}

/* 状态徽章 */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 40px;
}

.status-active {
  background-color: #d4edda;
  color: #155724;
}

.status-inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.na {
  color: #95a5a6;
  font-style: italic;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
}

.btn-action {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  color: #3498db;
  border: 1px solid #3498db;
}

.btn-edit:hover:not(:disabled) {
  background-color: #3498db;
  color: white;
}

.btn-delete {
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.btn-delete:hover:not(:disabled) {
  background-color: #e74c3c;
  color: white;
}

.btn-toggle {
  color: #f39c12;
  border: 1px solid #f39c12;
}

.btn-toggle:hover:not(:disabled) {
  background-color: #f39c12;
  color: white;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #ecf0f1;
  color: #95a5a6;
  border-color: #ecf0f1;
}

/* 空状态 */
.empty-state {
  background: #f8fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 40px 20px;
  text-align: center;
}

.empty-content i {
  font-size: 48px;
  color: #bdc3c7;
  margin-bottom: 16px;
}

.empty-content h5 {
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.empty-content p {
  color: #7f8c8d;
  margin: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .config-row {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .config-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .toggle-group {
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-buttons {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .topic-section {
    padding: 12px 16px;
  }

  .section-content {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
