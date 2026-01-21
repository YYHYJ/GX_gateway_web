<!-- src/views/transform/mqtt/DataFormatConfig.vue -->
<template>
  <div class="data-format-config">
    <div class="section-header" @click="toggleExpanded">
      <h4><i class="fas fa-code"></i> 数据格式配置</h4>
      <i class="fas fa-chevron-down" :class="{ 'rotate-180': !expanded }"></i>
    </div>

    <div class="section-content" v-if="expanded">
      <!-- 消息模板 -->
      <div class="config-item full-width">
        <label class="config-label">
          消息模板
          <span class="label-hint">(支持JSON格式，使用${variable}作为变量)</span>
        </label>
        <div class="code-editor">
          <pre v-if="!config.messageTemplate" class="placeholder">
{
  "timestamp": "${timestamp}",
  "device_id": "${device_id}",
  "device_type": "${device_type}",
  "data": {
    "power": ${power},
    "voltage": ${voltage},
    "current": ${current},
    "soc": ${soc}
  }
}</pre
          >
          <textarea
            v-else
            v-model="config.messageTemplate"
            @input="formatJson"
            :disabled="!enabled"
          ></textarea>
        </div>
        <div class="variables-hint">
          <strong>可用变量:</strong>
          <div class="variables-list">
            <span class="variable" v-for="varName in availableVariables" :key="varName">
              ${varName}
            </span>
          </div>
        </div>
      </div>

      <!-- 字段映射规则 -->
      <div class="field-mapping">
        <h5>字段映射规则</h5>
        <div class="mapping-table">
          <div class="mapping-header">
            <div class="mapping-col">设备原始字段</div>
            <div class="mapping-col">→</div>
            <div class="mapping-col">MQTT字段名</div>
            <div class="mapping-col">转换函数</div>
            <div class="mapping-col">操作</div>
          </div>
          <div class="mapping-row" v-for="(mapping, index) in config.fieldMappings" :key="index">
            <div>
              <input
                type="text"
                v-model="mapping.source"
                placeholder="BMS.Voltage"
                :disabled="!enabled"
              />
            </div>
            <div class="arrow">→</div>
            <div>
              <input
                type="text"
                v-model="mapping.target"
                placeholder="voltage"
                :disabled="!enabled"
              />
            </div>
            <div>
              <select v-model="mapping.transform" :disabled="!enabled">
                <option value="">无转换</option>
                <option value="round">四舍五入</option>
                <option value="ceil">向上取整</option>
                <option value="floor">向下取整</option>
                <option value="toFixed2">保留2位小数</option>
                <option value="scale100">×100</option>
                <option value="scale0_01">×0.01</option>
              </select>
            </div>
            <div class="actions">
              <button
                class="btn-icon"
                @click="removeMapping(index)"
                :disabled="!enabled"
                title="删除"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="mapping-footer">
            <button class="btn btn-sm" @click="addMapping" :disabled="!enabled">
              <i class="fas fa-plus"></i> 添加映射规则
            </button>
          </div>
        </div>
      </div>

      <!-- 转发过滤条件 -->
      <div class="filter-conditions">
        <h5>转发过滤条件</h5>
        <div class="filter-group">
          <label class="filter-label">
            <input type="checkbox" v-model="config.filter.changeOnly" :disabled="!enabled" />
            仅转发变化的数据
          </label>
          <div v-if="config.filter.changeOnly" class="filter-sub-options">
            <label class="filter-sub-label">
              变化阈值：
              <input
                type="number"
                v-model="config.filter.changeThreshold"
                step="0.1"
                :disabled="!enabled"
              />
              %
            </label>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">
            <input type="checkbox" v-model="config.filter.timeInterval" :disabled="!enabled" />
            按时间间隔转发
          </label>
          <div v-if="config.filter.timeInterval" class="filter-sub-options">
            <label class="filter-sub-label">
              间隔时间：
              <input type="number" v-model="config.filter.interval" :disabled="!enabled" />
              秒
            </label>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">
            <input type="checkbox" v-model="config.filter.specificDevices" :disabled="!enabled" />
            仅转发指定设备
          </label>
          <div v-if="config.filter.specificDevices" class="filter-sub-options">
            <select v-model="config.filter.selectedDevices" multiple :disabled="!enabled">
              <option value="BMS001">BMS001</option>
              <option value="PCS001">PCS001</option>
              <option value="EMS001">EMS001</option>
              <option value="BMS002">BMS002</option>
              <option value="PCS002">PCS002</option>
            </select>
            <div class="hint">按住Ctrl键可多选</div>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">
            <input type="checkbox" v-model="config.filter.valueRange" :disabled="!enabled" />
            按数值范围过滤
          </label>
          <div v-if="config.filter.valueRange" class="filter-sub-options">
            <label class="filter-sub-label">
              字段名：
              <input
                type="text"
                v-model="config.filter.valueField"
                placeholder="voltage"
                :disabled="!enabled"
              />
            </label>
            <label class="filter-sub-label">
              最小值：
              <input type="number" v-model="config.filter.minValue" :disabled="!enabled" />
            </label>
            <label class="filter-sub-label">
              最大值：
              <input type="number" v-model="config.filter.maxValue" :disabled="!enabled" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataFormatConfig',
  props: {
    configData: {
      type: Object,
      required: true,
      default: () => ({
        messageTemplate: '',
        fieldMappings: [],
        filter: {
          changeOnly: false,
          changeThreshold: 0.5,
          timeInterval: false,
          interval: 5,
          specificDevices: false,
          selectedDevices: [],
          valueRange: false,
          valueField: '',
          minValue: 0,
          maxValue: 100,
        },
      }),
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      expanded: true,
      config: { ...this.configData },
      availableVariables: [
        'timestamp',
        'device_id',
        'device_type',
        'device_code',
        'power',
        'voltage',
        'current',
        'soc',
        'soh',
        'temperature',
        'energy',
        'status',
        'fault_code',
        'running_mode',
      ],
    }
  },
  watch: {
    configData: {
      handler(newVal) {
        this.config = { ...newVal }
      },
      deep: true,
    },
    config: {
      handler(newVal) {
        this.$emit('update:config', newVal)
      },
      deep: true,
    },
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded
    },

    addMapping() {
      this.config.fieldMappings.push({
        source: '',
        target: '',
        transform: '',
      })
    },

    removeMapping(index) {
      this.config.fieldMappings.splice(index, 1)
    },

    formatJson() {
      try {
        const obj = JSON.parse(this.config.messageTemplate)
        this.config.messageTemplate = JSON.stringify(obj, null, 2)
      } catch (e) {
        // 无效JSON，保持原样
      }
    },

    validate() {
      const errors = []

      // 验证消息模板是否为有效JSON
      if (this.config.messageTemplate) {
        try {
          JSON.parse(this.config.messageTemplate)
        } catch (e) {
          errors.push('消息模板不是有效的JSON格式')
        }
      }

      // 验证字段映射
      this.config.fieldMappings.forEach((mapping, index) => {
        if (!mapping.source || !mapping.target) {
          errors.push(`第${index + 1}个字段映射的源字段和目标字段都不能为空`)
        }
      })

      // 验证过滤条件
      if (this.config.filter.changeOnly && this.config.filter.changeThreshold <= 0) {
        errors.push('变化阈值必须大于0')
      }

      if (this.config.filter.timeInterval && this.config.filter.interval <= 0) {
        errors.push('时间间隔必须大于0')
      }

      if (this.config.filter.valueRange) {
        if (!this.config.filter.valueField) {
          errors.push('数值范围过滤需要指定字段名')
        }
        if (this.config.filter.minValue >= this.config.filter.maxValue) {
          errors.push('最小值必须小于最大值')
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },
  },
}
</script>

<style scoped>
.data-format-config {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-header {
  background: #f8f9fa;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s;
}

.section-content {
  padding: 16px;
}

.config-item {
  margin-bottom: 24px;
}

.config-item.full-width {
  width: 100%;
}

.config-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.label-hint {
  font-size: 12px;
  color: #6c757d;
  font-weight: normal;
  margin-left: 8px;
}

.code-editor {
  position: relative;
  border: 1px solid #ced4da;
  border-radius: 4px;
  overflow: hidden;
}

.code-editor textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: none;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  white-space: pre;
  overflow: auto;
}

.code-editor textarea:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.code-editor .placeholder {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #6c757d;
  background-color: #f8f9fa;
  white-space: pre;
  overflow: auto;
}

.variables-hint {
  margin-top: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.variables-hint strong {
  display: block;
  margin-bottom: 8px;
  color: #495057;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.variable {
  display: inline-block;
  padding: 2px 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #495057;
}

.field-mapping {
  margin: 24px 0;
}

.field-mapping h5 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #495057;
}

.mapping-table {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.mapping-header,
.mapping-row {
  display: flex;
  align-items: center;
  padding: 12px;
}

.mapping-header {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.mapping-col {
  flex: 1;
  text-align: center;
}

.mapping-row {
  border-top: 1px solid #dee2e6;
}

.mapping-row div {
  flex: 1;
  padding: 0 4px;
}

.mapping-row input,
.mapping-row select {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
}

.mapping-row input:disabled,
.mapping-row select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.arrow {
  text-align: center;
  color: #6c757d;
  font-weight: 500;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-icon {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
}

.btn-icon:hover:not(:disabled) {
  color: #495057;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mapping-footer {
  padding: 12px;
  border-top: 1px solid #dee2e6;
  text-align: center;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.filter-conditions {
  margin-top: 24px;
}

.filter-conditions h5 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #495057;
}

.filter-group {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.filter-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #495057;
}

.filter-label input[type='checkbox'] {
  margin-right: 8px;
}

.filter-sub-options {
  margin-left: 24px;
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px solid #dee2e6;
}

.filter-sub-label {
  display: block;
  margin-bottom: 8px;
  color: #6c757d;
  font-size: 14px;
}

.filter-sub-label input[type='text'],
.filter-sub-label input[type='number'],
.filter-sub-label select {
  margin-left: 8px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 3px;
}

.filter-sub-label select {
  min-width: 150px;
}

.filter-sub-label input:disabled,
.filter-sub-label select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.hint {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  font-style: italic;
}

@media (max-width: 768px) {
  .mapping-header,
  .mapping-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .mapping-col {
    text-align: left;
  }

  .filter-sub-options {
    margin-left: 16px;
    padding-left: 12px;
  }
}
</style>
