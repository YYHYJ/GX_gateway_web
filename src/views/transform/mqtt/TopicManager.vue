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
              <button
                class="btn-help-inline"
                @click="showHelpModal('publish')"
                title="查看发布主题规则"
              >
                <i class="fas fa-question-circle"></i>
              </button>
            </div>
            <div class="input-with-variables">
              <input
                type="text"
                v-model="newPublish.topic"
                placeholder="energy/data/${device_id}/metrics"
                :disabled="!enabled"
              />
              <div class="variable-buttons" v-if="enabled">
                <button
                  class="btn-variable"
                  @click="insertVariable('publish', '${device_id}')"
                  title="插入设备ID变量"
                >
                  ${device_id}
                </button>
                <button
                  class="btn-variable"
                  @click="insertVariable('publish', '${timestamp}')"
                  title="插入时间戳变量"
                >
                  ${timestamp}
                </button>
                <button
                  class="btn-variable"
                  @click="insertVariable('publish', '${site_id}')"
                  title="插入站点ID变量"
                >
                  ${site_id}
                </button>
                <button
                  class="btn-variable"
                  @click="insertVariable('publish', '${data.*}')"
                  title="插入数据通配符"
                >
                  ${data.*}
                </button>
              </div>
            </div>
            <div class="hint">💡 点击上方变量按钮可快速插入，也可手动输入</div>
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
        </div>

        <div class="section-actions">
          <button
            class="btn-add"
            @click="addPublishTopic"
            :disabled="!enabled || !newPublish.topic.trim()"
          >
            <i class="fas" :class="editingId ? 'fa-check' : 'fa-plus'"></i>
            {{ editingId ? '保存修改' : '添加发布主题' }}
          </button>
          <button v-if="editingId" class="btn-cancel-edit" @click="cancelEdit">取消</button>
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
              <button
                class="btn-help-inline"
                @click="showHelpModal('subscribe')"
                title="查看订阅主题规则"
              >
                <i class="fas fa-question-circle"></i>
              </button>
            </div>
            <div class="input-with-variables">
              <input
                type="text"
                v-model="newSubscribe.topic"
                placeholder="energy/control/+/command"
                :disabled="!enabled"
              />
              <div class="variable-buttons" v-if="enabled">
                <button
                  class="btn-variable"
                  @click="insertVariable('subscribe', '+')"
                  title="插入单层通配符"
                >
                  +
                </button>
                <button
                  class="btn-variable"
                  @click="insertVariable('subscribe', '#')"
                  title="插入多层通配符"
                >
                  #
                </button>
                <button
                  class="btn-variable"
                  @click="insertVariable('subscribe', '${device_id}')"
                  title="插入设备ID变量"
                >
                  ${device_id}
                </button>
              </div>
            </div>
            <div class="hint">💡 支持MQTT通配符和系统变量，点击按钮快速插入</div>
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
        </div>

        <div class="section-actions">
          <button
            class="btn-add"
            @click="addSubscribeTopic"
            :disabled="!enabled || !newSubscribe.topic.trim()"
          >
            <i class="fas" :class="editingId ? 'fa-check' : 'fa-plus'"></i>
            {{ editingId ? '保存修改' : '添加订阅主题' }}
          </button>
          <button v-if="editingId" class="btn-cancel-edit" @click="cancelEdit">取消</button>
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

    <!-- 帮助模态框 -->
    <div v-if="showHelp" class="help-modal-overlay" @click.self="closeHelpModal">
      <div class="help-modal">
        <div class="help-header">
          <h4>
            <i class="fas" :class="helpType === 'publish' ? 'fa-upload' : 'fa-download'"></i>
            {{ helpType === 'publish' ? '发布主题规则' : '订阅主题规则' }}
          </h4>
          <button class="btn-close" @click="closeHelpModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="help-content">
          <!-- 通用规则 -->
          <div class="help-section">
            <h5><i class="fas fa-info-circle"></i> 主题基本规则</h5>
            <ul>
              <li>主题由多个层级组成，使用 <code>/</code> 分隔</li>
              <li>例如：<code>energy/data/device001/metrics</code></li>
              <li>可以使用系统变量自动替换，如 <code>${device_id}</code></li>
              <li>建议层级不超过5层，保持简洁易读</li>
            </ul>
          </div>

          <!-- 发布主题特有规则 -->
          <div v-if="helpType === 'publish'" class="help-section">
            <h5><i class="fas fa-upload"></i> 发布主题说明</h5>
            <ul>
              <li>
                <strong>系统变量：</strong>运行时自动替换为实际值
                <ul>
                  <li><code>${device_id}</code> - 设备唯一标识</li>
                  <li><code>${timestamp}</code> - 当前时间戳(毫秒)</li>
                  <li><code>${site_id}</code> - 站点ID</li>
                  <li><code>${data.*}</code> - 数据通配符</li>
                </ul>
              </li>
              <li><strong>消息保留(Retain)：</strong>新订阅者会收到最后一条保留消息</li>
              <li><strong>QoS等级：</strong>决定消息传递的可靠性(0/1/2)</li>
              <li>
                <strong>注意：</strong>发布主题不能使用通配符 <code>+</code> 或 <code>#</code>
              </li>
            </ul>
          </div>

          <!-- 订阅主题特有规则 -->
          <div v-if="helpType === 'subscribe'" class="help-section">
            <h5><i class="fas fa-download"></i> MQTT 通配符详解</h5>
            <p class="help-intro">
              MQTT 的 Topic 支持两种通配符：<code>+</code> 和
              <code>#</code>，用于一次性订阅多个主题。
            </p>

            <h6>一、通配符类型</h6>
            <table class="help-table">
              <thead>
                <tr>
                  <th>通配符</th>
                  <th>名称</th>
                  <th>作用</th>
                  <th>匹配级别</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>+</code></td>
                  <td>单层通配符</td>
                  <td>匹配一层任意内容</td>
                  <td>1 级</td>
                </tr>
                <tr>
                  <td><code>#</code></td>
                  <td>多层通配符</td>
                  <td>匹配多层任意内容</td>
                  <td>多级</td>
                </tr>
              </tbody>
            </table>

            <h6>二、单层通配符 +</h6>
            <p>
              <strong>基本用法：</strong
              ><code>+</code> 匹配当前层级的任意内容，只能匹配一层，不能跨层。
            </p>
            <div class="example-box">
              <div class="example-title">示例：订阅 <code>sensor/+/temperature</code></div>
              <div class="example-match">
                <strong>✅ 匹配：</strong>
                <ul>
                  <li><code>sensor/kitchen/temperature</code></li>
                  <li><code>sensor/livingroom/temperature</code></li>
                  <li><code>sensor/bedroom/temperature</code></li>
                </ul>
              </div>
              <div class="example-no-match">
                <strong>❌ 不匹配：</strong>
                <ul>
                  <li>
                    <code>sensor/kitchen/humidity</code> (最后一级是 humidity，不是 temperature)
                  </li>
                  <li><code>sensor/kitchen/floor/temperature</code> (多了一层)</li>
                  <li><code>sensor/temperature</code> (少了一层)</li>
                </ul>
              </div>
            </div>

            <p><strong>多个 + 可以同时使用：</strong></p>
            <div class="example-box">
              <div class="example-title">示例：订阅 <code>+/+/status</code></div>
              <div class="example-match">
                <strong>✅ 匹配：</strong>
                <ul>
                  <li><code>device/kitchen/status</code></li>
                  <li><code>device/bedroom/status</code></li>
                  <li><code>sensor/temp/status</code></li>
                </ul>
              </div>
              <div class="example-no-match">
                <strong>❌ 不匹配：</strong>
                <ul>
                  <li><code>device/kitchen/floor/status</code> (多了一层)</li>
                  <li><code>device/status</code> (少了一层)</li>
                </ul>
              </div>
            </div>

            <h6>三、多层通配符 #</h6>
            <p>
              <strong>基本用法：</strong><code>#</code> 匹配剩余所有层级，必须放在 Topic 的最后。
            </p>
            <div class="example-box">
              <div class="example-title">示例：订阅 <code>sensor/#</code></div>
              <div class="example-match">
                <strong>✅ 匹配：</strong>
                <ul>
                  <li><code>sensor/</code></li>
                  <li><code>sensor/kitchen</code></li>
                  <li><code>sensor/kitchen/temperature</code></li>
                  <li><code>sensor/kitchen/floor/status</code></li>
                  <li><code>sensor/livingroom/humidity/sensor1</code></li>
                </ul>
              </div>
              <div class="example-no-match">
                <strong>❌ 不匹配：</strong>
                <ul>
                  <li><code>device/kitchen</code> (第一级不是 sensor)</li>
                  <li><code>#/sensor</code> (# 不能在中间)</li>
                </ul>
              </div>
            </div>

            <p><strong># 单独使用：</strong></p>
            <div class="example-box">
              <div class="example-title">示例：订阅 <code>#</code></div>
              <div class="example-match">
                <strong>✅ 匹配：所有主题（相当于全局订阅）</strong>
                <p>任何主题都会被收到</p>
              </div>
            </div>

            <h6>四、通配符对比</h6>
            <table class="help-table">
              <thead>
                <tr>
                  <th>订阅</th>
                  <th>匹配</th>
                  <th>不匹配</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>sensor/+</code></td>
                  <td><code>sensor/a</code>, <code>sensor/b</code></td>
                  <td><code>sensor/a/b</code>, <code>sensor</code></td>
                </tr>
                <tr>
                  <td><code>sensor/+/+</code></td>
                  <td><code>sensor/a/b</code></td>
                  <td><code>sensor/a</code>, <code>sensor/a/b/c</code></td>
                </tr>
                <tr>
                  <td><code>sensor/#</code></td>
                  <td><code>sensor</code>, <code>sensor/a</code>, <code>sensor/a/b</code></td>
                  <td><code>device/a</code></td>
                </tr>
                <tr>
                  <td><code>#</code></td>
                  <td>所有主题</td>
                  <td>无</td>
                </tr>
              </tbody>
            </table>

            <h6>五、注意事项</h6>
            <ol>
              <li>
                <strong><code>#</code> 必须放在最后</strong>
                <ul>
                  <li>✅ <code>house/room/#</code></li>
                  <li>✅ <code>#</code></li>
                  <li>❌ <code>house/#/temperature</code></li>
                  <li>❌ <code>#/status</code></li>
                </ul>
              </li>
              <li>
                <strong><code>+</code> 不能为空</strong>
                <ul>
                  <li>订阅：<code>sensor/+/temperature</code></li>
                  <li>发布：<code>sensor//temperature</code> ❌ 不能匹配（空字符串）</li>
                </ul>
              </li>
              <li>
                <strong><code>+</code> 和 <code>#</code> 只能用于订阅，不能用于发布</strong>
                <ul>
                  <li>发布：<code>device/+/status</code> ❌ 不允许</li>
                  <li>发布：<code>device/#</code> ❌ 不允许</li>
                  <li>正确做法：发布具体的 Topic，如 <code>device/kitchen/status</code> ✅</li>
                </ul>
              </li>
              <li>
                <strong>通配符是层级分隔符 <code>/</code> 敏感</strong>
                <ul>
                  <li>订阅：<code>sensor/+/temp</code></li>
                  <li>发布：<code>sensor/kitchen/temp</code> ✅</li>
                  <li>发布：<code>sensor/kitchen/temp/extra</code> ❌</li>
                </ul>
              </li>
            </ol>

            <h6>六、实际应用示例</h6>
            <div class="example-scenario">
              <strong>场景1：智能家居</strong>
              <p>主题结构：<code>home/房间类型/房间名/设备类型/传感器</code></p>
              <p>订阅 <code>home/+/livingroom/+/temperature</code></p>
              <ul>
                <li>✅ 匹配：<code>home/floor1/livingroom/aircond/temperature</code></li>
              </ul>
            </div>

            <div class="example-scenario">
              <strong>场景2：工业物联网</strong>
              <p>设备主题：<code>factory/生产线/设备/传感器</code></p>
              <p>订阅 <code>factory/+/press/temperature</code></p>
              <ul>
                <li>✅ 匹配：<code>factory/line1/press/temperature</code></li>
                <li>✅ 匹配：<code>factory/line2/press/temperature</code></li>
              </ul>
            </div>

            <div class="example-scenario">
              <strong>场景3：批量订阅</strong>
              <p>订阅：<code>device/#</code></p>
              <ul>
                <li>收到：<code>device/online</code></li>
                <li>收到：<code>device/001/data</code></li>
                <li>收到：<code>device/001/status</code></li>
                <li>收到：<code>device/002/error</code></li>
              </ul>
            </div>

            <h6>七、通配符 vs 多订阅</h6>
            <table class="help-table">
              <thead>
                <tr>
                  <th>方案</th>
                  <th>示例</th>
                  <th>优点</th>
                  <th>缺点</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>通配符</td>
                  <td>订阅 <code>device/+/status</code></td>
                  <td>一条订阅，自动匹配新设备</td>
                  <td>灵活性稍低</td>
                </tr>
                <tr>
                  <td>多订阅</td>
                  <td>订阅 <code>device/a/status</code>, <code>device/b/status</code></td>
                  <td>精确控制</td>
                  <td>新增设备需要修改代码</td>
                </tr>
              </tbody>
            </table>

            <div class="help-summary">
              <strong>总结：</strong><code>+</code> 匹配一层，<code>#</code> 匹配剩余所有层。<code
                >+</code
              >
              可多个，<code>#</code> 只能一个且必须在最后。通配符只能用于订阅，不能用于发布。
            </div>
          </div>

          <!-- 最佳实践 -->
          <div class="help-section">
            <h5><i class="fas fa-lightbulb"></i> 最佳实践</h5>
            <ul>
              <li>使用有意义的层级结构，便于管理和理解</li>
              <li>避免使用特殊字符（空格、#、+、$）作为普通字符</li>
              <li>保持主题简洁，不要过深嵌套（建议不超过5层）</li>
              <li>发布和订阅主题要匹配，确保消息能正确传递</li>
              <li>合理使用通配符，减少订阅数量</li>
            </ul>
          </div>
        </div>

        <div class="help-footer">
          <button class="btn-ok" @click="closeHelpModal">
            <i class="fas fa-check"></i> 知道了
          </button>
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
      showHelp: false, // 是否显示帮助模态框
      helpType: 'publish', // 帮助类型：'publish' 或 'subscribe'
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

    // 取消编辑
    cancelEdit() {
      this.editingId = null
      this.newPublish = { topic: '', qos: '1', retain: false }
      this.newSubscribe = { topic: '', qos: '1' }
    },

    // 编辑主题
    editTopic(topic) {
      this.editingId = topic.id

      if (topic.type === 'publish') {
        this.config.enablePublish = true
        this.newPublish = {
          topic: topic.topic,
          qos: String(topic.qos),
          retain: topic.retain || false,
        }
      } else {
        this.config.enableSubscribe = true
        this.newSubscribe = {
          topic: topic.topic,
          qos: String(topic.qos),
        }
      }

      this.$nextTick(() => {
        const section = this.$el.querySelector(
          topic.type === 'publish' ? '.publish-section' : '.subscribe-section',
        )
        if (section) section.scrollIntoView({ behavior: 'smooth' })
      })
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

    // 插入变量到输入框
    insertVariable(type, variable) {
      const inputField = type === 'publish' ? 'newPublish' : 'newSubscribe'
      const currentValue = this[inputField].topic || ''

      // 如果当前值为空，直接设置变量
      if (!currentValue) {
        this[inputField].topic = variable
      } else {
        // 在末尾添加斜杠和变量（如果末尾没有斜杠）
        const separator = currentValue.endsWith('/') ? '' : '/'
        this[inputField].topic = currentValue + separator + variable
      }

      // 聚焦到输入框
      this.$nextTick(() => {
        const input = this.$el.querySelector(
          type === 'publish' ? '.publish-section input' : '.subscribe-section input',
        )
        if (input) {
          input.focus()
        }
      })
    },

    // 显示帮助模态框
    showHelpModal(type) {
      this.helpType = type
      this.showHelp = true
    },

    // 关闭帮助模态框
    closeHelpModal() {
      this.showHelp = false
      this.helpType = 'publish'
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
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
}

.section-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e1e5e9;
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

/* 内联帮助按钮 */
.btn-help-inline {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 50%;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.btn-help-inline:hover {
  background-color: rgba(52, 152, 219, 0.1);
  transform: scale(1.15);
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

/* 输入框与变量按钮容器 */
.input-with-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 变量按钮组 */
.variable-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-variable {
  background: linear-gradient(135deg, #e8f4fd 0%, #d1ecf1 100%);
  border: 1px solid #bee5eb;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  color: #0c5460;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-variable:hover {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  border-color: #17a2b8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(23, 162, 184, 0.2);
}

.btn-variable:active {
  transform: translateY(0);
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

.btn-cancel-edit {
  background: none;
  border: 1px solid #95a5a6;
  color: #7f8c8d;
  border-radius: 6px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 14px;
  height: 40px;
  transition: all 0.2s;
}

.btn-cancel-edit:hover {
  background: #f8f9fa;
  color: #2c3e50;
  border-color: #7f8c8d;
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

/* 帮助模态框 */
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.help-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.help-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.help-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.help-header h4 i {
  color: #3498db;
}

.btn-close {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.help-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.help-section {
  margin-bottom: 20px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h5 {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.help-section h5 i {
  color: #3498db;
}

.help-section ul {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

.help-section li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #34495e;
  font-size: 14px;
}

.help-section li:last-child {
  margin-bottom: 0;
}

.help-section ul ul {
  margin-top: 8px;
  padding-left: 20px;
}

.help-section code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #e74c3c;
  border: 1px solid #e1e5e9;
}

.help-intro {
  margin: 0 0 16px 0;
  line-height: 1.6;
  color: #34495e;
  font-size: 14px;
}

.help-section h6 {
  margin: 16px 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.help-section p {
  margin: 8px 0;
  line-height: 1.6;
  color: #34495e;
  font-size: 14px;
}

/* 帮助表格 */
.help-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.help-table thead {
  background: #f8fafc;
}

.help-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #34495e;
  border-bottom: 2px solid #e1e5e9;
}

.help-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: top;
}

.help-table tbody tr:hover {
  background-color: #f8fafc;
}

/* 示例框 */
.example-box {
  background: #f8fafc;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
}

.example-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 13px;
}

.example-match,
.example-no-match {
  margin-top: 8px;
}

.example-match strong,
.example-no-match strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}

.example-match ul,
.example-no-match ul {
  margin: 4px 0 0 0;
  padding-left: 20px;
}

.example-match li,
.example-no-match li {
  margin-bottom: 4px;
  font-size: 13px;
}

/* 应用场景 */
.example-scenario {
  background: #fff;
  border-left: 3px solid #3498db;
  padding: 12px;
  margin: 12px 0;
}

.example-scenario strong {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 14px;
}

.example-scenario p {
  margin: 4px 0;
  font-size: 13px;
}

.example-scenario ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.example-scenario li {
  margin-bottom: 4px;
  font-size: 13px;
}

/* 总结框 */
.help-summary {
  background: linear-gradient(135deg, #e8f4fd 0%, #d1ecf1 100%);
  border: 1px solid #bee5eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
  color: #0c5460;
  font-size: 14px;
  line-height: 1.6;
}

.help-footer {
  padding: 16px 24px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

.btn-ok {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-ok:hover {
  background: linear-gradient(135deg, #2980b9 0%, #1f6396 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
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
