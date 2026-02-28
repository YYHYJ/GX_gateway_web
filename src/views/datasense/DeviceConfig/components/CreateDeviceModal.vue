<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3 class="modal-title">创建设备实例</h3>
        <button class="modal-close" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="modal-body">
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="modal-error">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="device-form">
          <!-- 设备名称 -->
          <div class="form-group">
            <label for="deviceName" class="form-label">
              设备名称 <span class="required">*</span>
            </label>
            <input
              id="deviceName"
              v-model="formData.device_name"
              type="text"
              class="form-input"
              :class="{ 'is-invalid': errors.device_name }"
              placeholder="请输入设备名称"
              :disabled="loading"
              @input="clearError('device_name')"
              required
            />
            <div v-if="errors.device_name" class="form-error">
              {{ errors.device_name }}
            </div>
          </div>

          <!-- 设备代码 -->
          <div class="form-group">
            <label for="deviceCode" class="form-label">
              设备代码 <span class="required">*</span>
            </label>
            <div class="input-with-hint">
              <input
                id="deviceCode"
                v-model="formData.device_code"
                type="text"
                class="form-input"
                :class="{ 'is-invalid': errors.device_code }"
                placeholder="请输入设备代码"
                :disabled="loading"
                @input="validateDeviceCode"
                @blur="validateDeviceCode"
                required
              />
              <div class="hint-icon" @click="showDeviceCodeRules" title="查看设备代码规则">
                <i class="fas fa-question-circle"></i>
              </div>
            </div>
            <div v-if="showValidationRules" class="validation-feedback">
              <div class="validation-rules">
                <div class="rule-item" :class="{ valid: ruleValid.length }">
                  <i
                    class="fas"
                    :class="ruleValid.length ? 'fa-check-circle' : 'fa-times-circle'"
                  ></i>
                  <span>仅包含英文字母、数字和下划线</span>
                </div>
                <div class="rule-item" :class="{ valid: ruleValid.startWithLetter }">
                  <i
                    class="fas"
                    :class="ruleValid.startWithLetter ? 'fa-check-circle' : 'fa-times-circle'"
                  ></i>
                  <span>必须以字母开头</span>
                </div>
                <div class="rule-item" :class="{ valid: ruleValid.noSpecialChars }">
                  <i
                    class="fas"
                    :class="ruleValid.noSpecialChars ? 'fa-check-circle' : 'fa-times-circle'"
                  ></i>
                  <span>不能包含特殊字符（空格、中文等）</span>
                </div>
                <div class="rule-item" :class="{ valid: ruleValid.maxLength }">
                  <i
                    class="fas"
                    :class="ruleValid.maxLength ? 'fa-check-circle' : 'fa-times-circle'"
                  ></i>
                  <span>长度不超过50个字符</span>
                </div>
              </div>
            </div>
            <div v-if="errors.device_code" class="form-error">
              {{ errors.device_code }}
            </div>
            <div class="form-hint">
              格式要求：字母开头，可包含字母、数字和下划线，例如：device_001、DT_2024_01
            </div>
          </div>

          <!-- 模板选择 -->
          <div class="form-group">
            <label for="template" class="form-label">
              设备模板 <span class="required">*</span>
            </label>
            <select
              id="template"
              v-model="selectedTemplateId"
              class="form-select"
              :class="{ 'is-invalid': errors.template }"
              :disabled="loading || loadingTemplates"
              @change="handleTemplateChange"
              @input="clearError('template')"
              required
            >
              <option value="">请选择模板</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.displayName }}
              </option>
            </select>
            <div v-if="loadingTemplates" class="form-loading">
              <i class="fas fa-spinner fa-spin"></i> 加载模板中...
            </div>
            <div v-if="errors.template" class="form-error">
              {{ errors.template }}
            </div>
          </div>

          <!-- 通信协议（只读显示） -->
          <div class="form-group">
            <label class="form-label">通信协议</label>
            <div class="readonly-field">
              <template v-if="formData.protocol_type.name">
                <span class="protocol-name">{{ formData.protocol_type.name }}</span>
                <span class="protocol-tag">从模板加载</span>
              </template>
              <template v-else>
                <span class="placeholder-text">请先选择模板</span>
              </template>
            </div>
            <div v-if="!selectedTemplateId" class="form-hint">协议类型将自动从模板加载</div>
          </div>

          <!-- 协议配置区域（动态显示） -->
          <div v-if="showProtocolConfig" class="protocol-config">
            <div class="config-section">
              <h4 class="config-title">{{ formData.protocol_type.name }} 配置</h4>
              <div class="config-content">
                <!-- Modbus TCP 配置 -->
                <div v-if="formData.protocol_type.name === 'ModbusTCP'" class="config-fields">
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">IP地址</label>
                      <input
                        v-model="formData.protocol_type.config.ip_address"
                        type="text"
                        class="form-input"
                        placeholder="192.168.1.100"
                        :disabled="loading"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">端口</label>
                      <input
                        v-model="formData.protocol_type.config.port"
                        type="number"
                        class="form-input"
                        placeholder="502"
                        :disabled="loading"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">从站ID</label>
                      <input
                        v-model="formData.protocol_type.config.slave_id"
                        type="number"
                        class="form-input"
                        placeholder="1"
                        :disabled="loading"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">超时(ms)</label>
                      <input
                        v-model="formData.protocol_type.config.timeout"
                        type="number"
                        class="form-input"
                        placeholder="1000"
                        :disabled="loading"
                      />
                    </div>
                  </div>
                </div>

                <!-- Modbus RTU 配置 -->
                <div v-if="formData.protocol_type.name === 'ModbusRTU'" class="config-fields">
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">串口</label>
                      <input
                        v-model="formData.protocol_type.config.serial_port"
                        type="text"
                        class="form-input"
                        placeholder="COM1"
                        :disabled="loading"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">波特率</label>
                      <input
                        v-model.number="formData.protocol_type.config.baud_rate"
                        type="number"
                        class="form-input"
                        placeholder="9600"
                        :disabled="loading"
                        min="1"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">数据位</label>
                      <input
                        v-model.number="formData.protocol_type.config.data_bits"
                        type="number"
                        class="form-input"
                        placeholder="8"
                        :disabled="loading"
                        min="5"
                        max="8"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">停止位</label>
                      <input
                        v-model.number="formData.protocol_type.config.stop_bits"
                        type="number"
                        class="form-input"
                        placeholder="1"
                        :disabled="loading"
                        min="1"
                        max="2"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">校验</label>
                      <select
                        v-model="formData.protocol_type.config.parity"
                        class="form-select"
                        :disabled="loading"
                      >
                        <option value="">请选择</option>
                        <option value="None">无</option>
                        <option value="Even">偶校验</option>
                        <option value="Odd">奇校验</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">从站ID</label>
                      <input
                        v-model.number="formData.protocol_type.config.slave_id"
                        type="number"
                        class="form-input"
                        placeholder="1"
                        :disabled="loading"
                        min="1"
                        max="247"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">超时(ms)</label>
                      <input
                        v-model.number="formData.protocol_type.config.timeout"
                        type="number"
                        class="form-input"
                        placeholder="1000"
                        :disabled="loading"
                        min="100"
                        max="10000"
                        step="100"
                      />
                    </div>
                  </div>
                </div>

                <!-- CAN 协议配置 -->
                <div v-if="formData.protocol_type.name === 'CAN'" class="config-fields">
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">接口名</label>
                      <input
                        v-model="formData.protocol_type.config.interface_name"
                        type="text"
                        class="form-input"
                        placeholder="can0"
                        :disabled="loading"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">网关自身</label>
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          v-model="formData.protocol_type.config.is_gateway_self"
                          :disabled="loading"
                        />
                        <span class="checkbox-text">是</span>
                      </label>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">节点类型</label>
                      <input
                        v-model.number="formData.protocol_type.config.node_category"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">CAN ID</label>
                      <input
                        v-model.number="formData.protocol_type.config.can_id"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                        max="536870911"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">ID 类型</label>
                      <select
                        v-model.number="formData.protocol_type.config.can_id_type"
                        class="form-select"
                        :disabled="loading"
                      >
                        <option :value="0">标准</option>
                        <option :value="1">扩展</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">过滤掩码</label>
                      <input
                        v-model.number="formData.protocol_type.config.filter_mask"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                        max="536870911"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">数据超时(ms)</label>
                      <input
                        v-model.number="formData.protocol_type.config.data_timeout_ms"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">发送间隔(ms)</label>
                      <input
                        v-model.number="formData.protocol_type.config.send_interval_ms"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                      />
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">轮询间隔(ms)</label>
                      <input
                        v-model.number="formData.protocol_type.config.poll_interval_ms"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <!-- 通用配置显示（用于其他协议） -->
                <div
                  v-if="!['ModbusTCP', 'ModbusRTU', 'CAN'].includes(formData.protocol_type.name)"
                  class="config-json"
                >
                  <div class="config-table">
                    <div class="table-header">
                      <div class="table-cell">配置项</div>
                      <div class="table-cell">值</div>
                    </div>
                    <div
                      v-for="(value, key) in formData.protocol_type.config"
                      :key="key"
                      class="table-row"
                    >
                      <div class="table-cell">{{ formatKey(key) }}</div>
                      <div class="table-cell">
                        <input
                          :value="value"
                          type="text"
                          class="form-input-sm"
                          :disabled="loading"
                          @input="updateConfigValue(key, $event.target.value)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="config-hint">
                  <i class="fas fa-info-circle"></i>
                  配置可在创建设备后，在设备详情页面进行修改
                </div>
              </div>
            </div>
          </div>

          <!-- 采集间隔 -->
          <div class="form-group">
            <label for="scanInterval" class="form-label">采集间隔(ms)</label>
            <input
              id="scanInterval"
              v-model.number="formData.scan_interval"
              type="number"
              class="form-input"
              placeholder="2000"
              :disabled="loading"
              min="100"
              step="100"
            />
            <div class="form-hint">建议值：1000-5000ms</div>
          </div>

          <!-- 设备状态 -->
          <div class="form-group">
            <label class="form-label">初始状态</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  v-model="formData.is_enabled"
                  type="radio"
                  :value="true"
                  :disabled="loading"
                />
                <span class="radio-text">启用</span>
              </label>
              <label class="radio-label">
                <input
                  v-model="formData.is_enabled"
                  type="radio"
                  :value="false"
                  :disabled="loading"
                />
                <span class="radio-text">禁用</span>
              </label>
            </div>
          </div>

          <!-- 是否可控 -->
          <div class="form-group">
            <label class="form-label">是否可控</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="formData.is_controlled" type="checkbox" :disabled="loading" />
                <span class="checkbox-text">设备支持远程控制</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button class="btn btn-outline" @click="handleClose" :disabled="loading">取消</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="loading || !isFormValid">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          {{ loading ? '创建中...' : '创建设备' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { deviceService } from '@/views/datasense/DeviceConfig/services/deviceService.js'

export default {
  name: 'CreateDeviceModal',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'created'],
  data() {
    return {
      loading: false,
      loadingTemplates: false,
      errorMessage: '',
      templates: [],
      selectedTemplateId: null,
      formData: this.getInitialFormData(),
      errors: {},
      deviceCodeValidation: {
        length: false,
        startWithLetter: false,
        noSpecialChars: false,
        maxLength: false,
      },
      deviceCodeValid: false,
      showValidationRules: false,
    }
  },
  computed: {
    // 表单验证
    isFormValid() {
      return (
        this.selectedTemplateId &&
        this.formData.device_name.trim() &&
        this.formData.device_code.trim() &&
        this.deviceCodeValid &&
        this.formData.protocol_type.name
      )
    },

    // 是否显示协议配置
    showProtocolConfig() {
      return (
        this.formData.protocol_type.name &&
        this.formData.protocol_type.config &&
        Object.keys(this.formData.protocol_type.config).length > 0
      )
    },

    // 设备代码验证规则状态
    ruleValid() {
      const code = this.formData.device_code
      return {
        length: code.length > 0,
        startWithLetter: /^[A-Za-z]/.test(code),
        noSpecialChars: /^[A-Za-z0-9_]+$/.test(code),
        maxLength: code.length <= 50,
      }
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initModal()
      } else {
        this.resetForm()
      }
    },
    // 监听设备代码变化
    'formData.device_code': function (newVal) {
      if (newVal) {
        this.showValidationRules = true
      }
      this.validateDeviceCode()
    },
  },
  methods: {
    // 初始化模态框
    async initModal() {
      this.resetForm()
      await this.loadTemplates()
    },

    // 获取初始表单数据
    getInitialFormData() {
      return {
        device_name: '',
        device_code: '',
        model_id: '',
        scan_interval: 1000,
        is_enabled: true,
        is_controlled: false,
        protocol_type: {
          name: '',
          config: {},
        },
      }
    },

    // 重置表单
    resetForm() {
      this.formData = this.getInitialFormData()
      this.selectedTemplateId = null
      this.errorMessage = ''
      this.errors = {}
      this.deviceCodeValid = false
      this.deviceCodeValidation = {
        length: false,
        startWithLetter: false,
        noSpecialChars: false,
        maxLength: false,
      }
      this.showValidationRules = false
    },

    // 清空错误信息
    clearError(field) {
      if (this.errors[field]) {
        this.errors = { ...this.errors, [field]: '' }
      }
    },

    // 设备代码验证
    validateDeviceCode() {
      const code = this.formData.device_code

      // 清除之前的错误信息
      this.clearError('device_code')

      // 空值检查
      if (!code.trim()) {
        this.deviceCodeValid = false
        this.showValidationRules = false
        return false
      }

      // 验证规则
      const rules = [
        {
          test: /^[A-Za-z0-9_]+$/,
          message: '设备代码只能包含英文字母、数字和下划线',
          field: 'noSpecialChars',
        },
        {
          test: /^[A-Za-z]/,
          message: '设备代码必须以字母开头',
          field: 'startWithLetter',
        },
        {
          test: (val) => val.length <= 50,
          message: '设备代码长度不能超过50个字符',
          field: 'maxLength',
        },
        {
          test: (val) => val.length > 0,
          message: '设备代码不能为空',
          field: 'length',
        },
      ]

      // 执行验证
      let isValid = true
      for (const rule of rules) {
        const ruleResult = typeof rule.test === 'function' ? rule.test(code) : rule.test.test(code)

        // 更新验证状态
        this.deviceCodeValidation[rule.field] = ruleResult

        if (!ruleResult && isValid) {
          this.errors.device_code = rule.message
          isValid = false
        }
      }

      this.deviceCodeValid = isValid
      return isValid
    },

    // 显示设备代码规则
    showDeviceCodeRules() {
      this.$notify({
        title: '设备代码格式要求',
        message: `
          1. 必须以英文字母开头<br>
          2. 只能包含：英文字母（A-Z a-z）、数字（0-9）、下划线（_）<br>
          3. 不能包含：空格、中文、特殊字符<br>
          4. 长度不超过50个字符<br>
          5. 示例：device_001、DT_2024_01、sensor_A
        `,
        type: 'info',
        duration: 5000,
        dangerouslyUseHTMLString: true,
      })
    },

    // 加载模板列表
    async loadTemplates() {
      this.loadingTemplates = true
      try {
        const data = await deviceService.getDeviceTemplates()

        if (data.code === 200 && data.data) {
          // 转换数据格式，处理协议类型
          this.templates = data.data.map((template) => {
            // 获取协议类型（可能是字符串或对象）
            let protocolType = template.protocol_type
            let protocolName = ''
            let protocolConfig = {}

            // 如果protocol_type是字符串
            if (typeof protocolType === 'string') {
              protocolName = protocolType
              // 为常见协议设置默认配置
              if (protocolType === 'ModbusTCP') {
                protocolConfig = {
                  ip_address: '192.168.1.100',
                  port: 502,
                  slave_id: 1,
                  timeout: 1000,
                }
              } else if (protocolType === 'OPCUA') {
                protocolConfig = {
                  endpoint_url: '',
                  security_mode: 'None',
                  security_policy: 'None',
                }
              } else if (protocolType === 'MQTT') {
                protocolConfig = {
                  broker_url: 'tcp://localhost:1883',
                  client_id: '',
                  username: '',
                  password: '',
                  topic: '',
                }
              }
            }
            // 如果protocol_type是对象
            else if (protocolType && typeof protocolType === 'object') {
              protocolName = protocolType.name || ''
              protocolConfig = protocolType.config || {}
            }

            return {
              id: template.id,
              name: template.model_name,
              // 显示名称包含协议信息
              displayName: `${template.model_name} (${protocolName || '未知协议'})`,
              protocol_type: {
                name: protocolName,
                config: protocolConfig,
              },
              originalData: template,
            }
          })

          console.log('加载的模板列表:', this.templates)
        } else {
          console.warn('获取模板失败:', data.message)
        }
      } catch (error) {
        console.error('加载模板失败:', error)
        this.errorMessage = '加载模板失败: ' + error.message
      } finally {
        this.loadingTemplates = false
      }
    },

    // 模板选择处理
    handleTemplateChange() {
      const template = this.templates.find((t) => t.id === this.selectedTemplateId)
      if (template) {
        // 深拷贝协议配置
        const protocolConfig = template.protocol_type.config
          ? JSON.parse(JSON.stringify(template.protocol_type.config))
          : {}

        // 为RTU及CAN协议提供默认字段
        const protocolName = template.protocol_type.name
        if (protocolName === 'ModbusRTU') {
          protocolConfig.serial_port = protocolConfig.serial_port || ''
          protocolConfig.baud_rate = protocolConfig.baud_rate || 9600
          protocolConfig.data_bits = protocolConfig.data_bits || 8
          protocolConfig.stop_bits = protocolConfig.stop_bits || 1
          protocolConfig.parity = protocolConfig.parity || 'None'
          protocolConfig.slave_id = protocolConfig.slave_id || 1
          protocolConfig.timeout = protocolConfig.timeout || 1000
        }
        if (protocolName === 'CAN') {
          protocolConfig.interface_name = protocolConfig.interface_name || 'can0'
          protocolConfig.is_gateway_self = protocolConfig.is_gateway_self || false
          protocolConfig.node_category = protocolConfig.node_category || 0
          protocolConfig.can_id = protocolConfig.can_id || 0
          protocolConfig.can_id_type = protocolConfig.can_id_type || 0
          protocolConfig.filter_mask = protocolConfig.filter_mask || 0x7ff
          protocolConfig.data_timeout_ms = protocolConfig.data_timeout_ms || 5000
          protocolConfig.send_interval_ms = protocolConfig.send_interval_ms || 0
          protocolConfig.poll_interval_ms = protocolConfig.poll_interval_ms || 1000
        }

        // 设置表单数据
        this.formData = {
          ...this.formData,
          model_id: template.id,
          device_name: template.name || '',
          // 使用模板的协议配置
          protocol_type: {
            name: template.protocol_type.name || '',
            config: protocolConfig,
          },
        }

        console.log('从模板加载的协议配置:', this.formData.protocol_type)
      } else {
        // 清空模板时重置协议相关数据
        this.formData = {
          ...this.formData,
          model_id: '',
          device_name: '',
          protocol_type: {
            name: '',
            config: {},
          },
        }
      }
    },

    // 格式化配置键名
    formatKey(key) {
      // 将 snake_case 或 camelCase 转换为可读文本
      return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
    },

    // 更新配置值
    updateConfigValue(key, value) {
      if (this.formData.protocol_type.config) {
        // 尝试转换数字
        const numValue = Number(value)
        this.formData.protocol_type.config[key] = isNaN(numValue) ? value : numValue
      }
    },

    // 表单验证
    validateForm() {
      this.errors = {}
      let isValid = true

      // 验证模板选择
      if (!this.selectedTemplateId) {
        this.errors.template = '请选择设备模板'
        isValid = false
      }

      if (!this.formData.device_name.trim()) {
        this.errors.device_name = '设备名称不能为空'
        isValid = false
      }

      // 验证设备代码
      if (!this.validateDeviceCode()) {
        isValid = false
      }

      // 验证协议是否有效
      if (!this.formData.protocol_type.name) {
        this.errors.protocol = '模板协议配置无效'
        isValid = false
      }

      return isValid
    },

    // 提交表单
    async handleSubmit() {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      this.errorMessage = ''

      try {
        const data = await deviceService.createDeviceInstance(this.formData)
        this.$emit('created', data.data)
        this.handleClose()
      } catch (error) {
        this.errorMessage = error.message
        console.error('创建设备失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 关闭模态框
    handleClose() {
      if (!this.loading) {
        this.$emit('close')
      }
    },
  },
}
</script>

<style scoped>
/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #95a5a6;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表单样式 */
.device-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
}

.form-label .required {
  color: #e74c3c;
  margin-left: 2px;
}

.form-input,
.form-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.form-input-sm {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
}

/* 带提示的输入框 */
.input-with-hint {
  position: relative;
}

.hint-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
  cursor: pointer;
  transition: color 0.2s;
}

.hint-icon:hover {
  color: #3498db;
}

/* 验证反馈 */
.validation-feedback {
  margin-top: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.validation-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6c757d;
}

.rule-item i {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rule-item.valid {
  color: #28a745;
}

.rule-item.valid i {
  color: #28a745;
}

.rule-item:not(.valid) i {
  color: #dc3545;
}

.form-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 2px;
}

.form-hint {
  color: #95a5a6;
  font-size: 12px;
  margin-top: 2px;
}

.form-loading {
  color: #3498db;
  font-size: 12px;
  margin-top: 4px;
}

/* 错误输入框样式 */
.is-invalid {
  border-color: #e74c3c !important;
}

.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
}

/* 只读字段样式 */
.readonly-field {
  padding: 10px 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
}

.protocol-name {
  font-weight: 500;
  color: #2c3e50;
}

.protocol-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.placeholder-text {
  color: #95a5a6;
  font-style: italic;
}

/* 错误提示 */
.modal-error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 协议配置 */
.protocol-config {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 8px;
  background-color: white;
  overflow: hidden;
}

.config-section {
  display: flex;
  flex-direction: column;
}

.config-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.config-content {
  padding: 16px;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.config-hint {
  background-color: #e8f4fd;
  color: #0d6efd;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* JSON配置样式 */
.config-json {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.json-header span {
  font-weight: 500;
  color: #495057;
}

.json-toggle {
  background: none;
  border: 1px solid #ced4da;
  color: #495057;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.json-toggle:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.json-view {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.json-view pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 表格视图 */
.table-view {
  overflow-x: auto;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header,
.table-row {
  display: flex;
  border-bottom: 1px solid #e9ecef;
}

.table-header {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  flex: 1;
  padding: 10px 12px;
  min-width: 150px;
}

.table-header .table-cell {
  padding: 8px 12px;
}

/* 单选框和复选框 */
.radio-group,
.checkbox-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #34495e;
}

.radio-text,
.checkbox-text {
  user-select: none;
}

input[type='radio'],
input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 80px;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #95a5a6;
  color: #34495e;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f8f9fa;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 10px;
  }

  .modal-body {
    padding: 16px;
  }

  .config-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .radio-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .config-table {
    display: block;
  }

  .table-header,
  .table-row {
    flex-direction: column;
  }

  .table-cell {
    width: 100%;
    min-width: 0;
  }

  .validation-rules {
    font-size: 11px;
  }
}
</style>
