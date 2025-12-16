<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" :class="modalClass">
      <div class="modal-header" :class="headerClass">
        <h3><i :class="headerIcon"></i>{{ modalTitle }}</h3>
        <button class="modal-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- 模板名称 -->
          <div class="form-group">
            <label for="modelName"> 模板名称<span class="text-danger">*</span> </label>
            <input
              id="modelName"
              v-model="formData.model_name"
              type="text"
              placeholder="请输入模板名称"
              required
              class="form-control"
            />
          </div>

          <!-- 制造商 -->
          <div class="form-group">
            <label for="manufacturer">制造商</label>
            <input
              id="manufacturer"
              v-model="formData.manufacturer"
              type="text"
              placeholder="请输入制造商"
              class="form-control"
            />
          </div>

          <!-- 协议类型 -->
          <div class="form-group">
            <label for="protocolType"> 协议类型<span class="text-danger">*</span> </label>
            <select
              id="protocolType"
              v-model="formData.protocol_type"
              required
              class="form-control"
            >
              <option value="">请选择协议类型</option>
              <option v-for="protocol in protocolTypes" :key="protocol" :value="protocol">
                {{ getProtocolDisplayName(protocol) }}
              </option>
            </select>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label for="description">描述</label>
            <textarea
              id="description"
              v-model="formData.description"
              placeholder="请输入模板描述"
              rows="3"
              class="form-control"
            ></textarea>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">
          <i class="fas fa-times"></i> 取消
        </button>

        <button
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else :class="submitIcon"></i>
          {{ isSubmitting ? submitLoadingText : submitButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getProtocolDisplayName } from '../../services/protocolService.js'
import deviceTemplateService from '../../services/deviceTemplateService'

export default {
  name: 'TemplateFormModal',
  props: {
    mode: {
      type: String,
      required: true,
      validator: (value) => ['create', 'edit'].includes(value),
    },
    initialData: {
      type: Object,
      default: () => ({
        id: null,
        model_name: '',
        manufacturer: '',
        protocol_type: '', // 注意：创建时后端需要数组，这里是字符串
        description: '',
      }),
    },
    protocolTypes: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      formData: { ...this.initialData },
      isSubmitting: false,
    }
  },
  computed: {
    modalTitle() {
      return this.mode === 'create' ? '创建模板' : '编辑模板'
    },
    modalClass() {
      return this.mode === 'create' ? 'create-modal' : 'edit-modal'
    },
    headerClass() {
      return this.mode === 'create' ? 'create-header' : 'edit-header'
    },
    headerIcon() {
      return this.mode === 'create' ? 'fas fa-plus' : 'fas fa-edit'
    },
    submitButtonText() {
      return this.mode === 'create' ? '创建' : '保存'
    },
    submitLoadingText() {
      return this.mode === 'create' ? '创建中...' : '保存中...'
    },
    submitIcon() {
      return this.mode === 'create' ? 'fas fa-check' : 'fas fa-save'
    },
    isFormValid() {
      return this.formData.model_name.trim() !== '' && this.formData.protocol_type !== ''
    },
  },
  methods: {
    getProtocolDisplayName,

    async handleSubmit() {
      if (!this.isFormValid) return

      this.isSubmitting = true

      try {
        const payload = this.buildPayload()
        console.log('正在提交表单，模式:', this.mode, '数据:', payload)

        if (this.mode === 'create') {
          await this.handleCreate(payload)
        } else {
          await this.handleEdit(payload)
        }
      } catch (error) {
        console.error('表单提交失败:', error)
        this.$emit('form-error', {
          mode: this.mode,
          error: error.message,
          formData: this.formData,
        })
      } finally {
        this.isSubmitting = false
      }
    },

    // 新增：处理创建
    async handleCreate(payload) {
      const { mode, ...createData } = payload

      const response = await deviceTemplateService.createDeviceTemplate(createData)
      console.log('创建响应:', response)

      if (response.code === 200) {
        this.$emit('form-success', {
          mode: 'create',
          message: '模板创建成功',
          data: response.data,
        })
        this.$emit('close')
      } else {
        throw new Error(response.message || '创建失败')
      }
    },

    // 新增：处理编辑
    async handleEdit(payload) {
      if (payload.mode === 'edit' && payload.updates && payload.updates[0]) {
        const updateItem = payload.updates[0]

        const response = await deviceTemplateService.updateDeviceTemplate(updateItem.id, {
          model_name: updateItem.model_name,
          manufacturer: updateItem.manufacturer,
          protocol_type: updateItem.protocol_type,
          description: updateItem.description,
        })

        console.log('更新响应:', response)

        if (response.code === 200) {
          this.$emit('form-success', {
            mode: 'edit',
            message: '模板更新成功',
            data: response.data,
          })
          this.$emit('close')
        } else {
          throw new Error(response.message || '更新失败')
        }
      } else {
        throw new Error('无效的更新数据格式')
      }
    },

    // 构建不同模式的payload
    buildPayload() {
      if (this.mode === 'create') {
        // 创建模式：直接发送表单数据，但协议类型需要转为数组
        return {
          model_name: this.formData.model_name,
          manufacturer: this.formData.manufacturer,
          protocol_type: [this.formData.protocol_type], // 转为数组
          description: this.formData.description,
          mode: this.mode,
        }
      } else {
        // 编辑模式：包装成 updates 数组
        return {
          updates: [
            {
              id: this.formData.id,
              model_name: this.formData.model_name,
              manufacturer: this.formData.manufacturer,
              protocol_type: this.formData.protocol_type, // 保持字符串
              description: this.formData.description,
            },
          ],
          mode: this.mode,
        }
      }
    },
  },
  watch: {
    initialData(newData) {
      this.formData = { ...newData }
    },
  },
}
</script>

<style scoped>
/* 只定义组件特有的样式，其他全部复用全局样式 */

/* 1. 模态框顶部颜色区分 */
.create-modal {
  border-top: 4px solid var(--light-color);
}

.edit-modal {
  border-top: 4px solid var(--light-color);
}

/* 2. 模态框头部颜色区分 */
.create-header {
  background-color: var(--light-color);
  color: white;
}

.edit-header {
  background-color: var(--light-color);
  color: white;
}

/* 3. 按钮禁用状态样式 */
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 4. 必填字段标记微调 */
.text-danger {
  margin-left: 2px;
}

/* 5. 响应式微调（如果需要的话） */
@media (max-width: 768px) {
  .modal {
    margin: 10px;
  }
}
</style>
