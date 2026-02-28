<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3 class="modal-title">编辑设备实例</h3>
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

        <!-- 设备未找到提示 -->
        <div v-if="deviceNotFound" class="device-not-found">
          <i class="fas fa-exclamation-triangle"></i>
          <p>未找到指定的设备信息</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loadingDevice && !deviceData" class="loading-state">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>加载设备信息中...</p>
        </div>

        <!-- 表单 -->
        <form v-else-if="deviceData" @submit.prevent="handleSubmit" class="device-form">
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

          <!-- 通信协议（只读显示） -->
          <div class="form-group">
            <label class="form-label">通信协议</label>
            <div class="readonly-field">
              <template v-if="formData.protocol_type && formData.protocol_type.name">
                <span class="protocol-name">{{ formData.protocol_type.name }}</span>
                <span class="protocol-tag">已配置</span>
              </template>
              <template v-else>
                <span class="placeholder-text">未知协议</span>
              </template>
            </div>
          </div>

          <!-- 协议配置区域 -->
          <div
            v-if="formData.protocol_type && formData.protocol_type.config"
            class="protocol-config"
          >
            <div class="config-section">
              <h4 class="config-title">{{ formData.protocol_type.name }} 配置</h4>
              <div class="config-content">
                <!-- Modbus TCP 配置 -->
                <div v-if="formData.protocol_type.name === 'ModbusTCP'" class="config-fields" key="modbus-tcp">
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">IP地址 <span class="required">*</span></label>
                      <input
                        v-model="formData.protocol_type.config.ip_address"
                        type="text"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.ip_address }"
                        placeholder="192.168.1.100"
                        :disabled="loading"
                        @input="clearProtocolError('ip_address')"
                        required
                      />
                      <div v-if="protocolErrors.ip_address" class="form-error">
                        {{ protocolErrors.ip_address }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">端口 <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.port"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.port }"
                        placeholder="502"
                        :disabled="loading"
                        min="1"
                        max="65535"
                        @input="clearProtocolError('port')"
                        required
                      />
                      <div v-if="protocolErrors.port" class="form-error">
                        {{ protocolErrors.port }}
                      </div>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">从站ID <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.slave_id"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.slave_id }"
                        placeholder="1"
                        :disabled="loading"
                        min="1"
                        max="247"
                        @input="clearProtocolError('slave_id')"
                        required
                      />
                      <div v-if="protocolErrors.slave_id" class="form-error">
                        {{ protocolErrors.slave_id }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">超时(ms) <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.timeout"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.timeout }"
                        placeholder="1000"
                        :disabled="loading"
                        min="100"
                        max="10000"
                        step="100"
                        @input="clearProtocolError('timeout')"
                        required
                      />
                      <div v-if="protocolErrors.timeout" class="form-error">
                        {{ protocolErrors.timeout }}
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Modbus RTU 配置 -->
                <div v-else-if="formData.protocol_type.name === 'ModbusRTU'" class="config-fields" key="modbus-rtu">
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">串口 <span class="required">*</span></label>
                      <input
                        v-model="formData.protocol_type.config.serial_port"
                        type="text"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.serial_port }"
                        placeholder="COM1"
                        :disabled="loading"
                        @input="clearProtocolError('serial_port')"
                        required
                      />
                      <div v-if="protocolErrors.serial_port" class="form-error">
                        {{ protocolErrors.serial_port }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">波特率 <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.baud_rate"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.baud_rate }"
                        placeholder="9600"
                        :disabled="loading"
                        min="1"
                        @input="clearProtocolError('baud_rate')"
                        required
                      />
                      <div v-if="protocolErrors.baud_rate" class="form-error">
                        {{ protocolErrors.baud_rate }}
                      </div>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">数据位 <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.data_bits"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.data_bits }"
                        placeholder="8"
                        :disabled="loading"
                        min="5"
                        max="8"
                        @input="clearProtocolError('data_bits')"
                        required
                      />
                      <div v-if="protocolErrors.data_bits" class="form-error">
                        {{ protocolErrors.data_bits }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">停止位 <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.stop_bits"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.stop_bits }"
                        placeholder="1"
                        :disabled="loading"
                        min="1"
                        max="2"
                        @input="clearProtocolError('stop_bits')"
                        required
                      />
                      <div v-if="protocolErrors.stop_bits" class="form-error">
                        {{ protocolErrors.stop_bits }}
                      </div>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">校验 <span class="required">*</span></label>
                      <select
                        v-model="formData.protocol_type.config.parity"
                        class="form-select"
                        :class="{ 'is-invalid': protocolErrors.parity }"
                        :disabled="loading"
                        @change="clearProtocolError('parity')"
                        required
                      >
                        <option value="">请选择</option>
                        <option value="None">无</option>
                        <option value="Even">偶校验</option>
                        <option value="Odd">奇校验</option>
                      </select>
                      <div v-if="protocolErrors.parity" class="form-error">
                        {{ protocolErrors.parity }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">从站ID <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.slave_id"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.slave_id }"
                        placeholder="1"
                        :disabled="loading"
                        min="1"
                        max="247"
                        @input="clearProtocolError('slave_id')"
                        required
                      />
                      <div v-if="protocolErrors.slave_id" class="form-error">
                        {{ protocolErrors.slave_id }}
                      </div>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">超时(ms) <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.timeout"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.timeout }"
                        placeholder="1000"
                        :disabled="loading"
                        min="100"
                        max="10000"
                        step="100"
                        @input="clearProtocolError('timeout')"
                        required
                      />
                      <div v-if="protocolErrors.timeout" class="form-error">
                        {{ protocolErrors.timeout }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- CAN 协议配置 -->
                <div v-else-if="formData.protocol_type.name === 'CAN'" class="config-fields" key="can">
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">接口名 <span class="required">*</span></label>
                      <input
                        v-model="formData.protocol_type.config.interface_name"
                        type="text"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.interface_name }"
                        placeholder="can0"
                        :disabled="loading"
                        @input="clearProtocolError('interface_name')"
                        required
                      />
                      <div v-if="protocolErrors.interface_name" class="form-error">
                        {{ protocolErrors.interface_name }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">网关自身 <span class="required">*</span></label>
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
                        @input="clearProtocolError('node_category')"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">CAN ID <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.can_id"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.can_id }"
                        :disabled="loading"
                        min="0"
                        max="536870911"
                        @input="clearProtocolError('can_id')"
                        required
                      />
                      <div v-if="protocolErrors.can_id" class="form-error">
                        {{ protocolErrors.can_id }}
                      </div>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">ID 类型 <span class="required">*</span></label>
                      <select
                        v-model.number="formData.protocol_type.config.can_id_type"
                        class="form-select"
                        :class="{ 'is-invalid': protocolErrors.can_id_type }"
                        :disabled="loading"
                        @change="clearProtocolError('can_id_type')"
                        required
                      >
                        <option :value="0">标准</option>
                        <option :value="1">扩展</option>
                      </select>
                      <div v-if="protocolErrors.can_id_type" class="form-error">
                        {{ protocolErrors.can_id_type }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">过滤掩码</label>
                      <input
                        v-model.number="formData.protocol_type.config.filter_mask"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.filter_mask }"
                        :disabled="loading"
                        min="0"
                        max="536870911"
                        @input="clearProtocolError('filter_mask')"
                      />
                      <div v-if="protocolErrors.filter_mask" class="form-error">
                        {{ protocolErrors.filter_mask }}
                      </div>
                    </div>
                  </div>
                  <div class="config-row">
                    <div class="form-group">
                      <label class="form-label">数据超时(ms) <span class="required">*</span></label>
                      <input
                        v-model.number="formData.protocol_type.config.data_timeout_ms"
                        type="number"
                        class="form-input"
                        :class="{ 'is-invalid': protocolErrors.data_timeout_ms }"
                        :disabled="loading"
                        min="0"
                        @input="clearProtocolError('data_timeout_ms')"
                        required
                      />
                      <div v-if="protocolErrors.data_timeout_ms" class="form-error">
                        {{ protocolErrors.data_timeout_ms }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">发送间隔(ms)</label>
                      <input
                        v-model.number="formData.protocol_type.config.send_interval_ms"
                        type="number"
                        class="form-input"
                        :disabled="loading"
                        min="0"
                        @input="clearProtocolError('send_interval_ms')"
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
                        @input="clearProtocolError('poll_interval_ms')"
                      />
                    </div>
                  </div>
                </div>

                <!-- 其他协议配置：仅表格视图（仅当非 ModbusTCP/ModbusRTU/CAN 时显示，避免配置项显示两遍） -->
                <div v-else class="other-protocol-config" key="other">
                  <div class="config-detail-title">配置详情</div>
                  <div class="table-view">
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
                </div>
              </div>
            </div>
          </div>

          <!-- 采集间隔 -->
          <div class="form-group">
            <label for="scanInterval" class="form-label">
              采集间隔(ms) <span class="required">*</span>
            </label>
            <input
              id="scanInterval"
              v-model.number="formData.scan_interval"
              type="number"
              class="form-input"
              :class="{ 'is-invalid': errors.scan_interval }"
              placeholder="1000"
              :disabled="loading"
              min="100"
              max="60000"
              step="100"
              @input="clearError('scan_interval')"
              required
            />
            <div v-if="errors.scan_interval" class="form-error">
              {{ errors.scan_interval }}
            </div>
            <div class="form-hint">建议值：1000-5000ms</div>
          </div>

          <!-- 设备状态 -->
          <div class="form-group">
            <label class="form-label"> 设备状态 <span class="required">*</span> </label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  v-model="formData.is_enabled"
                  type="radio"
                  :value="true"
                  :disabled="loading"
                />
                <span class="radio-text enabled">启用</span>
              </label>
              <label class="radio-label">
                <input
                  v-model="formData.is_enabled"
                  type="radio"
                  :value="false"
                  :disabled="loading"
                />
                <span class="radio-text disabled">禁用</span>
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
              <div class="form-hint">启用后设备支持远程控制命令</div>
            </div>
          </div>
        </form>
      </div>

      <!-- 模态框底部 -->
      <div class="modal-footer">
        <button class="btn btn-outline" @click="handleClose" :disabled="loading || loadingDevice">
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="loading || loadingDevice || !isFormValid"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { deviceService } from '@/views/datasense/DeviceConfig/services/deviceService.js'

export default {
  name: 'EditDeviceModal',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    deviceId: {
      type: [Number, String],
      required: true,
    },
    // 新增：接收设备列表数据
    deviceList: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['close', 'updated'],
  data() {
    return {
      loading: false,
      loadingDevice: false,
      errorMessage: '',
      deviceData: null,
      deviceNotFound: false,
      formData: this.getInitialFormData(),
      errors: {},
      protocolErrors: {},
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
        this.formData.device_name.trim() &&
        this.formData.device_code.trim() &&
        this.deviceCodeValid &&
        this.validateProtocolConfig() &&
        this.formData.scan_interval >= 100 &&
        this.formData.scan_interval <= 60000
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
      this.loadDeviceInfo()
    },

    // 获取初始表单数据
    getInitialFormData() {
      return {
        id: '',
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
      this.deviceData = null
      this.deviceNotFound = false
      this.errorMessage = ''
      this.errors = {}
      this.protocolErrors = {}
      this.deviceCodeValid = false
      this.deviceCodeValidation = {
        length: false,
        startWithLetter: false,
        noSpecialChars: false,
        maxLength: false,
      }
      this.showValidationRules = false
    },

    // 加载设备信息：优先用列表中的 rawData（含数据库中的 protocol_type.config），无则请求详情接口
    async loadDeviceInfo() {
      this.loadingDevice = true
      this.deviceNotFound = false

      try {
        const device = this.deviceList.find(
          (item) => item.id == this.deviceId || item.id.toString() === this.deviceId.toString(),
        )

        if (!device) {
          this.deviceNotFound = true
          this.errorMessage = '未找到指定的设备'
          return
        }

        // 优先使用接口返回的完整数据：rawData 为 getDeviceInstances 接口的原始设备对象，含 protocol_type.config
        let source = device.rawData || device
        const hasConfigFromList =
          source.protocol_type && source.protocol_type.config && Object.keys(source.protocol_type.config).length > 0

        // 若列表中无完整配置（例如旧数据或接口未返回 config），则请求详情接口从数据库拉取
        if (!hasConfigFromList) {
          const res = await deviceService.getDeviceDetail(this.deviceId)
          if (res && res.code === 200 && res.data) {
            source = deviceService.processDeviceData(res.data)
          }
        }

        this.deviceData = { ...source }

        // 基于数据库中的原始数据设置表单，避免配置项变成默认值
        const pt = source.protocol_type || {}
        const config = pt.config && typeof pt.config === 'object' ? { ...pt.config } : {}

        this.formData = {
          id: source.id,
          device_name: source.device_name || device.name || '',
          device_code: source.device_code || device.code || '',
          model_id: Number(source.model_id || device.model_id) || 0,
          scan_interval: source.scan_interval ?? device.interval ?? 1000,
          is_enabled: source.is_enabled !== false,
          is_controlled: !!source.is_controlled,
          protocol_type: {
            name: pt.name || device.protocolDisplay || device.protocol || '',
            config,
          },
        }

        if (!this.formData.protocol_type.config || typeof this.formData.protocol_type.config !== 'object') {
          this.formData.protocol_type.config = {}
        }
        const cfg = this.formData.protocol_type.config

        // 仅对缺失字段补默认值，保留从数据库取到的值
        if (this.formData.protocol_type.name === 'ModbusRTU') {
          cfg.serial_port = cfg.serial_port ?? ''
          cfg.baud_rate = cfg.baud_rate ?? 9600
          cfg.data_bits = cfg.data_bits ?? 8
          cfg.stop_bits = cfg.stop_bits ?? 1
          cfg.parity = cfg.parity ?? 'None'
          cfg.slave_id = cfg.slave_id ?? 1
          cfg.timeout = cfg.timeout ?? 1000
        }
        if (this.formData.protocol_type.name === 'CAN') {
          cfg.interface_name = cfg.interface_name ?? 'can0'
          cfg.is_gateway_self = cfg.is_gateway_self ?? false
          cfg.node_category = cfg.node_category ?? 0
          cfg.can_id = cfg.can_id ?? 0
          cfg.can_id_type = cfg.can_id_type ?? 0
          cfg.filter_mask = cfg.filter_mask ?? 0x7ff
          cfg.data_timeout_ms = cfg.data_timeout_ms ?? 5000
          cfg.send_interval_ms = cfg.send_interval_ms ?? 0
          cfg.poll_interval_ms = cfg.poll_interval_ms ?? 1000
        }

        this.validateDeviceCode()
      } catch (error) {
        console.error('加载设备信息失败:', error)
        this.errorMessage = '加载设备信息失败: ' + error.message
        this.deviceNotFound = true
      } finally {
        this.loadingDevice = false
      }
    },

    // 清空错误信息
    clearError(field) {
      if (this.errors[field]) {
        this.errors = { ...this.errors, [field]: '' }
      }
    },

    clearProtocolError(field) {
      if (this.protocolErrors[field]) {
        this.protocolErrors = { ...this.protocolErrors, [field]: '' }
      }
    },

    // 设备代码验证（从CreateDeviceModal复制）
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

    // 验证协议配置
    validateProtocolConfig() {
      if (!this.formData.protocol_type || !this.formData.protocol_type.config) {
        return false
      }

      const config = this.formData.protocol_type.config
      const protocolName = this.formData.protocol_type.name
      let isValid = true
      this.protocolErrors = {}

      // ModbusTCP 验证
      if (protocolName === 'ModbusTCP') {
        // IP地址验证
        if (!config.ip_address || !config.ip_address.trim()) {
          this.protocolErrors.ip_address = 'IP地址不能为空'
          isValid = false
        } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(config.ip_address)) {
          this.protocolErrors.ip_address = 'IP地址格式不正确'
          isValid = false
        }

        // 端口验证
        if (!config.port || config.port < 1 || config.port > 65535) {
          this.protocolErrors.port = '端口必须在1-65535之间'
          isValid = false
        }

        // 从站ID验证
        if (!config.slave_id || config.slave_id < 1 || config.slave_id > 247) {
          this.protocolErrors.slave_id = '从站ID必须在1-247之间'
          isValid = false
        }

        // 超时验证
        if (!config.timeout || config.timeout < 100 || config.timeout > 10000) {
          this.protocolErrors.timeout = '超时时间必须在100-10000ms之间'
          isValid = false
        }
      }

      // ModbusRTU 验证
      if (protocolName === 'ModbusRTU') {
        if (!config.serial_port || !config.serial_port.trim()) {
          this.protocolErrors.serial_port = '串口不能为空'
          isValid = false
        }

        if (!config.baud_rate || config.baud_rate <= 0) {
          this.protocolErrors.baud_rate = '波特率必须为正数'
          isValid = false
        }

        if (!config.data_bits || config.data_bits < 5 || config.data_bits > 8) {
          this.protocolErrors.data_bits = '数据位必须在5-8之间'
          isValid = false
        }

        if (!config.stop_bits || config.stop_bits < 1 || config.stop_bits > 2) {
          this.protocolErrors.stop_bits = '停止位必须为1或2'
          isValid = false
        }

        if (!config.parity) {
          this.protocolErrors.parity = '请选择校验方式'
          isValid = false
        }

        if (!config.slave_id || config.slave_id < 1 || config.slave_id > 247) {
          this.protocolErrors.slave_id = '从站ID必须在1-247之间'
          isValid = false
        }

        if (!config.timeout || config.timeout < 100 || config.timeout > 10000) {
          this.protocolErrors.timeout = '超时时间必须在100-10000ms之间'
          isValid = false
        }
      }

      // CAN 验证
      if (protocolName === 'CAN') {
        if (!config.interface_name || !config.interface_name.trim()) {
          this.protocolErrors.interface_name = '接口名不能为空'
          isValid = false
        }
        if (config.can_id === undefined || config.can_id === null || config.can_id < 0 || config.can_id > 0x1fffffff) {
          this.protocolErrors.can_id = 'CAN ID 必须在0到0x1FFFFFFF之间'
          isValid = false
        }
        if (config.can_id_type !== 0 && config.can_id_type !== 1) {
          this.protocolErrors.can_id_type = '请选择有效的ID类型'
          isValid = false
        }
        if (config.filter_mask < 0 || config.filter_mask > 0x1fffffff) {
          this.protocolErrors.filter_mask = '过滤掩码必须在0到0x1FFFFFFF之间'
          isValid = false
        }
        if (config.data_timeout_ms === undefined || config.data_timeout_ms === null || config.data_timeout_ms < 0) {
          this.protocolErrors.data_timeout_ms = '数据超时不能为空且不能为负'
          isValid = false
        }
        if (config.send_interval_ms < 0) {
          this.protocolErrors.send_interval_ms = '发送间隔不能为负'
          isValid = false
        }
        if (config.poll_interval_ms < 0) {
          this.protocolErrors.poll_interval_ms = '轮询间隔不能为负'
          isValid = false
        }
        // node_category、is_gateway_self 无需严格校验
      }

      return isValid
    },

    // 格式化配置键名
    formatKey(key) {
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

      // 验证设备名称
      if (!this.formData.device_name.trim()) {
        this.errors.device_name = '设备名称不能为空'
        isValid = false
      }

      // 验证设备代码
      if (!this.validateDeviceCode()) {
        isValid = false
      }

      // 验证采集间隔
      if (
        !this.formData.scan_interval ||
        this.formData.scan_interval < 100 ||
        this.formData.scan_interval > 60000
      ) {
        this.errors.scan_interval = '采集间隔必须在100-60000ms之间'
        isValid = false
      }

      // 验证协议配置
      if (!this.validateProtocolConfig()) {
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
        // 准备提交数据
        const submitData = {
          id: this.formData.id,
          model_id: this.formData.model_id,
          device_name: this.formData.device_name,
          device_code: this.formData.device_code,
          scan_interval: this.formData.scan_interval,
          is_enabled: this.formData.is_enabled,
          is_controlled: this.formData.is_controlled,
          protocol_type: this.formData.protocol_type,
        }

        // 若是特定协议需要确保配置项存在
        if (this.formData.protocol_type.name === 'ModbusTCP') {
          submitData.protocol_type.config = {
            ip_address: this.formData.protocol_type.config.ip_address || '',
            port: this.formData.protocol_type.config.port || 502,
            slave_id: this.formData.protocol_type.config.slave_id || 1,
            timeout: this.formData.protocol_type.config.timeout || 1000,
          }
        }
        if (this.formData.protocol_type.name === 'ModbusRTU') {
          submitData.protocol_type.config = {
            serial_port: this.formData.protocol_type.config.serial_port || '',
            baud_rate: this.formData.protocol_type.config.baud_rate || 9600,
            data_bits: this.formData.protocol_type.config.data_bits || 8,
            stop_bits: this.formData.protocol_type.config.stop_bits || 1,
            parity: this.formData.protocol_type.config.parity || 'None',
            slave_id: this.formData.protocol_type.config.slave_id || 1,
            timeout: this.formData.protocol_type.config.timeout || 1000,
          }
        }
        if (this.formData.protocol_type.name === 'CAN') {
          submitData.protocol_type.config = {
            interface_name: this.formData.protocol_type.config.interface_name || 'can0',
            is_gateway_self: !!this.formData.protocol_type.config.is_gateway_self,
            node_category: this.formData.protocol_type.config.node_category || 0,
            can_id: this.formData.protocol_type.config.can_id || 0,
            can_id_type: this.formData.protocol_type.config.can_id_type || 0,
            filter_mask: this.formData.protocol_type.config.filter_mask || 0x7ff,
            data_timeout_ms: this.formData.protocol_type.config.data_timeout_ms || 5000,
            send_interval_ms: this.formData.protocol_type.config.send_interval_ms || 0,
            poll_interval_ms: this.formData.protocol_type.config.poll_interval_ms || 1000,
          }
        }

        console.log('提交的数据:', submitData)

        const response = await deviceService.updateDeviceInstance(submitData)

        if (response.code === 200) {
          this.$emit('updated', response.data)
          this.loading = false
          this.handleClose()
        } else {
          throw new Error(response.message || '更新设备失败')
        }
      } catch (error) {
        console.error('更新设备失败:', error)
        this.errorMessage = '更新设备失败: ' + error.message
        this.$message.error('更新设备失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // 关闭模态框
    handleClose() {
      if (!this.loading && !this.loadingDevice) {
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

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-state i {
  margin-bottom: 15px;
  color: #3498db;
}

.loading-state p {
  margin: 0;
  font-size: 14px;
}

/* 设备未找到提示 */
.device-not-found {
  text-align: center;
  padding: 40px 20px;
  color: #e74c3c;
  background-color: #fdf2f2;
  border-radius: 6px;
  border: 1px solid #f8d7da;
}

.device-not-found i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #f39c12;
}

.device-not-found p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
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

/* 错误输入框样式 */
.is-invalid {
  border-color: #e74c3c !important;
}

.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
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

.device-code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
  color: #2c3e50;
}

.code-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.protocol-name {
  font-weight: 500;
  color: #2c3e50;
}

.protocol-tag {
  background-color: #e8f5e9;
  color: #2e7d32;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.placeholder-text {
  color: #95a5a6;
  font-style: italic;
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

.other-protocol-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

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

/* 单选框和复选框 */
.radio-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #34495e;
}

.radio-text {
  user-select: none;
}

.radio-text.enabled {
  color: #27ae60;
}

.radio-text.disabled {
  color: #e74c3c;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #34495e;
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
