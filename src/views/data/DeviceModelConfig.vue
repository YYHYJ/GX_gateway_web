<template>
  <div class="device-template-page">
    <!-- 侧边栏 -->
    <Sidebar
      active-nav="data-collection"
      active-sub-nav="device-template"
      @nav-change="handleNavigation"
      @sub-nav-change="handleSubNavigation"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <TopHeader
        title="数据采集与转发"
        title-icon="fas fa-database"
        user-name="管理员"
        @logout="handleLogout"
      />

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 面包屑导航 -->
        <PageHeader title="设备模板管理" :breadcrumbs="breadcrumbs" :actions="pageActions" />

        <!-- 消息提示 -->
        <div v-if="showMessage" :class="['message-toast', messageType]">
          <i :class="messageIcon"></i>
          <span>{{ messageText }}</span>
          <button class="message-close" @click="hideMessage">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 删除确认模态框 -->
        <div
          v-if="showDeleteConfirmModal"
          class="modal-overlay"
          @click.self="closeDeleteConfirmModal"
        >
          <div class="modal delete-confirm-modal">
            <div class="modal-header danger">
              <h3><i class="fas fa-exclamation-triangle"></i> 确认删除设备模板</h3>
              <button class="modal-close" @click="closeDeleteConfirmModal">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="modal-body">
              <div class="delete-warning">
                <div class="warning-icon">
                  <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="warning-content">
                  <h4>⚠️ 警告：此操作无法撤销！</h4>
                  <p>
                    您正在删除模板：<strong class="template-name">{{
                      deleteTemplateInfo.name
                    }}</strong>
                  </p>

                  <div class="delete-details">
                    <div class="detail-item">
                      <i class="fas fa-id-card"></i>
                      <span>模板ID：</span>
                      <strong>{{ deleteTemplateInfo.id }}</strong>
                    </div>
                    <div class="detail-item">
                      <i class="fas fa-industry"></i>
                      <span>制造商：</span>
                      <strong>{{ deleteTemplateInfo.manufacturer || '未设置' }}</strong>
                    </div>
                    <div class="detail-item">
                      <i class="fas fa-plug"></i>
                      <span>协议类型：</span>
                      <strong>{{
                        getProtocolDisplayName(deleteTemplateInfo.protocol_type)
                      }}</strong>
                    </div>
                  </div>

                  <div class="delete-impacts">
                    <h5><i class="fas fa-exclamation-triangle"></i> 删除将导致以下影响：</h5>
                    <ul>
                      <li><i class="fas fa-times-circle"></i> 删除所有使用此模板的设备</li>
                      <li><i class="fas fa-times-circle"></i> 删除此模板的所有Modbus数据点配置</li>
                      <li><i class="fas fa-times-circle"></i> 删除所有相关的历史数据记录</li>
                      <li><i class="fas fa-times-circle"></i> 此操作无法恢复，请谨慎操作</li>
                    </ul>
                  </div>

                  <div class="delete-tip">
                    <i class="fas fa-lightbulb"></i>
                    提示：如果您只想临时禁用此模板，建议修改状态而非删除。
                  </div>
                </div>
              </div>

              <div class="final-confirm">
                <label class="form-check">
                  <input type="checkbox" v-model="confirmChecked" class="form-check-input" />
                  <span class="form-check-label">我已了解上述风险，确认删除此模板</span>
                </label>

                <div class="confirm-input" v-if="confirmChecked">
                  <p>
                    请在下方输入模板名称 "<strong>{{ deleteTemplateInfo.name }}</strong
                    >" 以确认删除：
                  </p>
                  <input
                    type="text"
                    v-model="confirmInput"
                    :placeholder="`请输入 ${deleteTemplateInfo.name}`"
                    class="form-control confirm-input-field"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline" @click="closeDeleteConfirmModal">
                <i class="fas fa-times"></i> 取消
              </button>
              <button
                class="btn btn-danger"
                @click="confirmDeleteTemplate"
                :disabled="!isDeleteConfirmed"
                :class="{ 'animate-shake': isDeleteConfirmed }"
              >
                <i v-if="isDeleting" class="fas fa-spinner fa-spin animate-spin"></i>
                <i v-else class="fas fa-trash"></i>
                {{ isDeleting ? '删除中...' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 页面具体内容 -->
        <div class="template-content">
          <!-- 搜索和筛选栏 -->
          <div class="search-filter-bar">
            <div class="search-bar">
              <input
                type="text"
                class="form-control"
                placeholder="搜索模板名称、制造商..."
                v-model="searchKeyword"
                @input="handleSearch"
              />
              <button class="btn btn-primary" @click="handleSearch">
                <i class="fas fa-search"></i> 搜索
              </button>
            </div>

            <!-- 动态生成的筛选选项 -->
            <div class="filter-bar" v-if="templates.length > 0">
              <select class="form-control" v-model="protocolFilter" @change="handleFilter">
                <option value="">所有协议类型</option>
                <option v-for="protocol in availableProtocols" :key="protocol" :value="protocol">
                  {{ getProtocolDisplayName(protocol) }}
                </option>
              </select>

              <select class="form-control" v-model="manufacturerFilter" @change="handleFilter">
                <option value="">所有制造商</option>
                <option
                  v-for="manufacturer in availableManufacturers"
                  :key="manufacturer"
                  :value="manufacturer"
                >
                  {{ manufacturer }}
                </option>
              </select>
            </div>
          </div>

          <!-- 新建模板模态框 -->
          <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
            <div class="modal create-modal">
              <div class="modal-header">
                <h3>新建设备模板</h3>
                <button class="modal-close" @click="closeCreateModal">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div class="modal-body">
                <form @submit.prevent="submitCreateForm">
                  <div class="form-group">
                    <label for="modelName">模板名称 *</label>
                    <input
                      id="modelName"
                      v-model="createForm.model_name"
                      type="text"
                      placeholder="请输入模板名称"
                      required
                      class="form-control"
                    />
                  </div>

                  <div class="form-group">
                    <label for="manufacturer">制造商</label>
                    <input
                      id="manufacturer"
                      v-model="createForm.manufacturer"
                      type="text"
                      placeholder="请输入制造商"
                      class="form-control"
                    />
                  </div>

                  <div class="form-group">
                    <label>协议类型 *</label>
                    <select v-model="createForm.protocol_type" class="form-control" required>
                      <option value="">请选择协议类型</option>
                      <option v-for="protocol in protocolTypes" :key="protocol" :value="protocol">
                        {{ getProtocolDisplayName(protocol) }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="description">描述</label>
                    <textarea
                      id="description"
                      v-model="createForm.description"
                      placeholder="请输入模板描述"
                      rows="3"
                      class="form-control"
                    ></textarea>
                  </div>
                </form>
              </div>

              <div class="modal-footer">
                <button class="btn btn-outline" @click="closeCreateModal">取消</button>
                <button class="btn btn-primary" @click="submitCreateForm" :disabled="isSubmitting">
                  <i v-if="isSubmitting" class="fas fa-spinner fa-spin animate-spin"></i>
                  {{ isSubmitting ? '创建中...' : '创建模板' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 编辑模板模态框 -->
          <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
            <div class="modal edit-modal">
              <div class="modal-header">
                <h3>编辑设备模板</h3>
                <button class="modal-close" @click="closeEditModal">
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <div class="modal-body">
                <form @submit.prevent="submitEditForm">
                  <div class="form-group">
                    <label for="editModelName">模板名称 *</label>
                    <input
                      id="editModelName"
                      v-model="editForm.model_name"
                      type="text"
                      placeholder="请输入模板名称"
                      required
                      class="form-control"
                    />
                  </div>

                  <div class="form-group">
                    <label for="editManufacturer">制造商 *</label>
                    <input
                      id="editManufacturer"
                      v-model="editForm.manufacturer"
                      type="text"
                      placeholder="请输入制造商"
                      required
                      class="form-control"
                    />
                  </div>

                  <div class="form-group">
                    <label>协议类型 *</label>
                    <select v-model="editForm.protocol_type" class="form-control" required>
                      <option value="">请选择协议类型</option>
                      <option v-for="protocol in protocolTypes" :key="protocol" :value="protocol">
                        {{ getProtocolDisplayName(protocol) }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="editDescription">描述 *</label>
                    <textarea
                      id="editDescription"
                      v-model="editForm.description"
                      placeholder="请输入模板描述"
                      rows="3"
                      required
                      class="form-control"
                    ></textarea>
                  </div>
                </form>
              </div>

              <div class="modal-footer">
                <button class="btn btn-outline" @click="closeEditModal">取消</button>
                <button class="btn btn-primary" @click="submitEditForm" :disabled="isEditing">
                  <i v-if="isEditing" class="fas fa-spinner fa-spin animate-spin"></i>
                  {{ isEditing ? '更新中...' : '更新模板' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 模板卡片容器 -->
          <div class="cards-container">
            <!-- 加载状态 -->
            <div v-if="loadingProtocols || loadingTemplates" class="loading-state">
              <div class="spinner mb-3"></div>
              <p>{{ loadingProtocols ? '加载协议类型...' : '加载模板数据...' }}</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="templates.length === 0" class="empty-state">
              <i class="fas fa-inbox mb-3"></i>
              <h3>暂无设备模板</h3>
              <p>点击"新建模板"按钮创建第一个设备模板</p>
            </div>

            <!-- 模板卡片列表 -->
            <div v-else class="cards-grid">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                class="card template-card"
                :class="`protocol-${template.protocol_type?.toLowerCase()}`"
              >
                <div class="card-header">
                  <div>
                    <!-- 使用 model_name 作为主标题 -->
                    <div class="card-title">
                      <i :class="getProtocolIcon(template.protocol_type)"></i>
                      {{ template.model_name || '--' }}
                    </div>
                    <div class="template-manufacturer">{{ template.manufacturer || '--' }}</div>
                    <span class="status-badge protocol-badge">{{
                      getProtocolDisplayName(template.protocol_type)
                    }}</span>
                  </div>
                </div>

                <div class="card-content">
                  <div class="template-desc">{{ template.description || '--' }}</div>

                  <div class="info-grid cols-2 template-stats">
                    <div class="info-item">
                      <div class="info-label">模板ID:</div>
                      <div class="info-value">{{ template.id || '--' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">制造商:</div>
                      <div class="info-value">{{ template.manufacturer || '--' }}</div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">协议类型:</div>
                      <div class="info-value">
                        {{ getProtocolDisplayName(template.protocol_type) }}
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">创建时间:</div>
                      <div class="info-value">{{ formatDate(template.created_at) || '--' }}</div>
                    </div>
                  </div>
                </div>

                <div class="card-footer">
                  <div class="create-time">
                    最后修改:
                    {{ formatDate(template.last_modified || template.created_at) || '--' }}
                  </div>
                  <div class="d-flex gap-2">
                    <button
                      class="action-btn btn btn-outline btn-sm"
                      @click="showCommunicationSpec(template.protocol_type)"
                    >
                      <i class="fas fa-cog"></i> 通信规约
                    </button>
                    <button
                      class="action-btn btn btn-outline btn-sm"
                      @click="editTemplate(template.id)"
                    >
                      <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button
                      class="action-btn btn btn-outline btn-sm"
                      @click="showDeleteConfirm(template)"
                    >
                      <i class="fas fa-trash"></i> 删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from '@/components/layout/Sidebar.vue'
import TopHeader from '@/components/layout/TopHeader.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

// 直接调用后端API
const apiCall = {
  // 获取协议类型列表
  getProtocolTypes: () => {
    return fetch('/api/device/protocols')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (data.code === 200) {
          return data.data
        } else {
          throw new Error(data.message || '获取协议类型失败')
        }
      })
  },

  getDeviceTemplates: () => {
    return fetch('/api/device/modelConfig').then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  },

  // 删除模板
  deleteDeviceTemplate: (id) => {
    const deleteData = {
      ids: [Number(id)],
    }

    return fetch('/api/device/modelConfig', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  },

  // 创建模板
  createDeviceTemplate: (data) => {
    return fetch('/api/device/modelConfig', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  },

  // 编辑模板
  updateDeviceTemplate: (id, data) => {
    const updateData = {
      updates: [
        {
          id: Number(id),
          model_name: data.model_name,
          manufacturer: data.manufacturer,
          protocol_type: data.protocol_type,
          description: data.description,
        },
      ],
    }

    return fetch('/api/device/modelConfig', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  },
}

export default {
  name: 'DeviceModelConfig',
  components: {
    Sidebar,
    TopHeader,
    PageHeader,
  },
  data() {
    return {
      breadcrumbs: [{ title: '数据采集', link: '/data-collection' }, { title: '设备模板' }],
      pageActions: [
        {
          text: '导入模板',
          icon: 'fas fa-upload',
          type: 'outline',
          handler: this.handleImport,
        },
        {
          text: '导出模板',
          icon: 'fas fa-download',
          type: 'outline',
          handler: this.handleExport,
        },
        {
          text: '新建模板',
          icon: 'fas fa-plus',
          type: 'primary',
          handler: this.openCreateModal,
        },
      ],
      searchKeyword: '',
      protocolFilter: '',
      manufacturerFilter: '',
      loadingTemplates: false,
      loadingProtocols: false,
      templates: [],
      protocolTypes: [], // 从后端获取的协议类型列表

      // 新增：模态框相关数据
      showCreateModal: false,
      isSubmitting: false,
      createForm: {
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      },

      // 编辑模态框相关数据
      showEditModal: false,
      isEditing: false,
      editForm: {
        id: null,
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      },

      // 删除确认模态框相关数据
      showDeleteConfirmModal: false,
      isDeleting: false,
      deleteTemplateInfo: {
        id: null,
        name: '',
        manufacturer: '',
        protocol_type: '',
      },
      confirmChecked: false,
      confirmInput: '',

      // 消息提示相关数据
      showMessage: false,
      messageText: '',
      messageType: 'success',
      messageTimeout: null,
    }
  },
  computed: {
    // 从实际数据中提取可用的协议类型
    availableProtocols() {
      const protocols = [
        ...new Set(this.templates.map((template) => template.protocol_type).filter(Boolean)),
      ]
      return protocols.sort()
    },

    // 从实际数据中提取可用的制造商
    availableManufacturers() {
      const manufacturers = [
        ...new Set(this.templates.map((template) => template.manufacturer).filter(Boolean)),
      ]
      return manufacturers.sort()
    },

    // 检查删除是否确认
    isDeleteConfirmed() {
      return this.confirmChecked && this.confirmInput.trim() === this.deleteTemplateInfo.name
    },

    // 过滤后的模板列表
    filteredTemplates() {
      return this.templates.filter((template) => {
        const matchesSearch =
          !this.searchKeyword ||
          (template.model_name &&
            template.model_name.toLowerCase().includes(this.searchKeyword.toLowerCase())) ||
          (template.manufacturer &&
            template.manufacturer.toLowerCase().includes(this.searchKeyword.toLowerCase())) ||
          (template.description &&
            template.description.toLowerCase().includes(this.searchKeyword.toLowerCase()))

        const matchesProtocol =
          !this.protocolFilter || template.protocol_type === this.protocolFilter
        const matchesManufacturer =
          !this.manufacturerFilter || template.manufacturer === this.manufacturerFilter

        return matchesSearch && matchesProtocol && matchesManufacturer
      })
    },

    // 计算消息图标
    messageIcon() {
      const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
      }
      return iconMap[this.messageType] || 'fas fa-info-circle'
    },
  },
  methods: {
    // 消息提示方法
    showMessageToast(text, type = 'success') {
      this.messageText = text
      this.messageType = type
      this.showMessage = true

      // 清除之前的定时器
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout)
      }

      // 3秒后自动隐藏
      this.messageTimeout = setTimeout(() => {
        this.hideMessage()
      }, 3000)
    },

    hideMessage() {
      this.showMessage = false
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout)
        this.messageTimeout = null
      }
    },

    // 加载协议类型
    async loadProtocolTypes() {
      this.loadingProtocols = true
      try {
        console.log('正在加载协议类型...')
        const protocols = await apiCall.getProtocolTypes()
        console.log('获取到的协议类型:', protocols)
        this.protocolTypes = protocols || []
      } catch (error) {
        console.error('加载协议类型失败:', error)
        // 如果后端API失败，使用默认的协议类型列表
        this.protocolTypes = [
          'CAN',
          'IEC-61850',
          'MQTT',
          'Modbus',
          'ModbusRTU',
          'ModbusTCP',
          'OPCUA',
          'RS232',
          'RS485',
        ]
        this.showMessageToast('使用默认协议类型', 'warning')
      } finally {
        this.loadingProtocols = false
      }
    },

    // 协议类型显示名称映射
    getProtocolDisplayName(protocolType) {
      const displayNameMap = {
        CAN: 'CAN总线',
        'IEC-61850': 'IEC 61850',
        MQTT: 'MQTT',
        Modbus: 'Modbus',
        ModbusRTU: 'Modbus RTU',
        ModbusTCP: 'Modbus TCP',
        OPCUA: 'OPC UA',
        RS232: 'RS232',
        RS485: 'RS485',
        HTTP: 'HTTP',
        CoAP: 'CoAP',
        WebSocket: 'WebSocket',
      }

      return displayNameMap[protocolType] || protocolType || '--'
    },

    // 根据协议类型获取图标
    getProtocolIcon(protocolType) {
      const iconMap = {
        ModbusTCP: 'fas fa-network-wired',
        ModbusRTU: 'fas fa-plug',
        Modbus: 'fas fa-cogs',
        MQTT: 'fas fa-satellite-dish',
        CAN: 'fas fa-bus',
        OPCUA: 'fas fa-industry',
        HTTP: 'fas fa-globe',
        CoAP: 'fas fa-wifi',
        WebSocket: 'fas fa-bolt',
        'IEC-61850': 'fas fa-bolt',
        RS232: 'fas fa-exchange-alt',
        RS485: 'fas fa-project-diagram',
      }
      return iconMap[protocolType] || 'fas fa-question-circle'
    },

    // 显示删除确认模态框
    showDeleteConfirm(template) {
      this.deleteTemplateInfo = {
        id: template.id,
        name: template.model_name || '未命名模板',
        manufacturer: template.manufacturer || '',
        protocol_type: template.protocol_type || '',
      }

      // 重置确认状态
      this.confirmChecked = false
      this.confirmInput = ''
      this.isDeleting = false

      this.showDeleteConfirmModal = true
    },

    // 关闭删除确认模态框
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false
      this.isDeleting = false
    },

    // 确认删除模板
    async confirmDeleteTemplate() {
      if (!this.isDeleteConfirmed) return

      this.isDeleting = true

      try {
        console.log('正在删除模板，ID:', this.deleteTemplateInfo.id)

        const response = await apiCall.deleteDeviceTemplate(this.deleteTemplateInfo.id)
        console.log('删除响应:', response)

        if (response && response.code === 200) {
          // 删除成功
          this.showMessageToast(`模板 "${this.deleteTemplateInfo.name}" 删除成功`, 'success')
          this.closeDeleteConfirmModal()

          // 重新加载数据
          await this.loadDeviceTemplates()
        } else {
          throw new Error(response?.message || `删除失败，错误码: ${response?.code || '未知'}`)
        }
      } catch (error) {
        console.error('删除模板失败:', error)

        // 根据错误类型显示不同的提示信息
        let errorMessage = '删除失败'

        if (error.message.includes('405')) {
          errorMessage = '删除方法不被允许，请检查API配置'
        } else if (error.message.includes('404')) {
          errorMessage = '模板不存在或已被删除'
          // 前端删除
          this.templates = this.templates.filter((t) => t.id !== this.deleteTemplateInfo.id)
          this.showMessageToast('模板删除成功', 'success')
          this.closeDeleteConfirmModal()
          return
        } else if (error.message.includes('403')) {
          errorMessage = '没有权限删除此模板'
        } else if (error.message.includes('500')) {
          errorMessage = '服务器错误，请稍后重试'
        } else if (error.message.includes('Network Error')) {
          errorMessage = '网络连接失败，请检查网络设置'
        } else {
          errorMessage = `删除失败: ${error.message}`
        }

        this.showMessageToast(errorMessage, 'error')
        this.isDeleting = false
      }
    },

    // 模态框相关方法
    openCreateModal() {
      // 确保协议类型已加载
      if (this.protocolTypes.length === 0) {
        this.showMessageToast('正在加载协议类型，请稍后...', 'info')
        return
      }

      this.showCreateModal = true
      // 重置表单
      this.createForm = {
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      }
    },

    closeCreateModal() {
      this.showCreateModal = false
      this.isSubmitting = false
    },

    // 编辑模态框方法
    openEditModal(templateId) {
      const template = this.templates.find((t) => t.id === templateId)
      if (!template) {
        this.showMessageToast('模板不存在', 'error')
        return
      }

      this.editForm = {
        id: template.id,
        model_name: template.model_name || '',
        manufacturer: template.manufacturer || '',
        protocol_type: template.protocol_type || '',
        description: template.description || '',
      }

      this.showEditModal = true
    },

    closeEditModal() {
      this.showEditModal = false
      this.isEditing = false
      this.editForm = {
        id: null,
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      }
    },

    async submitCreateForm() {
      // 表单验证
      if (!this.createForm.model_name.trim()) {
        this.showMessageToast('请输入模板名称', 'error')
        return
      }

      if (!this.createForm.protocol_type) {
        this.showMessageToast('请选择协议类型', 'error')
        return
      }

      this.isSubmitting = true

      try {
        console.log('正在创建设备模板:', this.createForm)

        const response = await apiCall.createDeviceTemplate(this.createForm)
        console.log('创建结果:', response)

        if (response.code === 200) {
          // 创建成功
          this.showMessageToast('模板创建成功', 'success')
          this.closeCreateModal()

          // 重新加载模板列表
          await this.loadDeviceTemplates()
        } else {
          throw new Error(response.message || '创建失败')
        }
      } catch (error) {
        console.error('创建模板失败:', error)
        this.showMessageToast(`创建失败: ${error.message}`, 'error')
      } finally {
        this.isSubmitting = false
      }
    },

    // 提交编辑表单
    async submitEditForm() {
      // 表单验证
      if (!this.editForm.model_name.trim()) {
        this.showMessageToast('请输入模板名称', 'error')
        return
      }

      if (!this.editForm.manufacturer.trim()) {
        this.showMessageToast('请输入制造商', 'error')
        return
      }

      if (!this.editForm.protocol_type.trim()) {
        this.showMessageToast('请选择协议类型', 'error')
        return
      }

      if (!this.editForm.description.trim()) {
        this.showMessageToast('请输入描述', 'error')
        return
      }

      this.isEditing = true

      try {
        console.log('正在更新设备模板:', this.editForm)

        const response = await apiCall.updateDeviceTemplate(this.editForm.id, this.editForm)
        console.log('更新结果:', response)

        if (response.code === 200) {
          // 更新成功
          this.showMessageToast('模板更新成功', 'success')
          this.closeEditModal()

          // 重新加载模板列表
          await this.loadDeviceTemplates()
        } else {
          throw new Error(response.message || '更新失败')
        }
      } catch (error) {
        console.error('更新模板失败:', error)
        this.showMessageToast(`更新失败: ${error.message}`, 'error')
      } finally {
        this.isEditing = false
      }
    },

    async loadDeviceTemplates() {
      this.loadingTemplates = true
      try {
        console.log('正在调用后端API: /api/device/modelConfig')
        const response = await apiCall.getDeviceTemplates()
        console.log('API响应:', response)

        if (response.code === 200) {
          // 直接使用后端返回的数据
          this.templates = response.data || []
          console.log('加载到的模板数量:', this.templates.length)
        } else {
          console.warn('API返回错误码:', response.code)
          this.showMessageToast(`加载失败: ${response.message || '未知错误'}`, 'error')
          this.templates = []
        }
      } catch (error) {
        console.error('API调用失败:', error)
        this.showMessageToast('加载模板数据失败，请检查网络连接', 'error')
        this.templates = []
      } finally {
        this.loadingTemplates = false
      }
    },

    // 编辑模板方法
    editTemplate(templateId) {
      this.openEditModal(templateId)
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '--'
      try {
        const date = new Date(dateString)
        return (
          date.toLocaleDateString('zh-CN') +
          ' ' +
          date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        )
      } catch (error) {
        return dateString
      }
    },

    // 搜索和筛选
    handleSearch() {
      console.log('搜索关键词:', this.searchKeyword)
    },

    handleFilter() {
      console.log('筛选条件:', {
        protocol: this.protocolFilter,
        manufacturer: this.manufacturerFilter,
      })
    },

    // 页面操作
    handleImport() {
      this.showMessageToast('导入模板功能开发中...', 'info')
    },

    handleExport() {
      this.showMessageToast('导出模板功能开发中...', 'info')
    },

    showCommunicationSpec(protocol) {
      this.showMessageToast(
        `查看 ${this.getProtocolDisplayName(protocol)} 通信规约功能开发中...`,
        'info',
      )
    },

    // 导航处理
    handleNavigation(navId) {
      console.log('导航到:', navId)
    },

    handleSubNavigation({ parent, child }) {
      console.log('子菜单导航:', parent, '->', child)
    },

    handleLogout() {
      console.log('用户退出登录')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('token')
      this.$router.push('/')
    },
  },
  mounted() {
    // 并行加载协议类型和模板数据
    Promise.all([this.loadProtocolTypes(), this.loadDeviceTemplates()])
      .then(() => {
        console.log('所有数据加载完成')
      })
      .catch((error) => {
        console.error('数据加载失败:', error)
      })
  },
}
</script>

<style scoped>
/* 只保留特定于设备模板页面的样式 */
.device-template-page {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
  min-height: 100vh;
}

.content-area {
  padding: 30px;
}

.template-content {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 25px;
  box-shadow: var(--shadow-sm);
}

/* 搜索和筛选栏样式 */
.search-filter-bar {
  margin-bottom: 25px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.filter-bar {
  display: flex;
  gap: 15px;
}

/* 删除确认模态框特有样式 */
.delete-confirm-modal {
  border-top: 4px solid var(--danger-color);
}

.modal-header.danger {
  background-color: #fff5f5;
  border-bottom: 2px solid var(--danger-color);
}

.modal-header.danger h3 {
  color: var(--danger-color);
}

.delete-warning {
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #fffaf0;
  border-radius: var(--border-radius);
  margin-bottom: 20px;
  border-left: 4px solid var(--warning-color);
}

.warning-icon {
  font-size: 48px;
  color: var(--warning-color);
}

.warning-content h4 {
  color: var(--danger-color);
  margin-bottom: 10px;
  font-size: 16px;
}

.template-name {
  color: var(--danger-color);
  font-size: 18px;
  font-weight: bold;
}

.delete-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: var(--border-radius-sm);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item i {
  color: var(--secondary-color);
}

.detail-item span {
  color: var(--gray-color);
  font-size: 14px;
}

.detail-item strong {
  color: var(--dark-color);
  font-size: 14px;
}

.delete-impacts {
  background-color: #fff5f5;
  border-radius: var(--border-radius-sm);
  padding: 15px;
  margin: 15px 0;
  border: 1px solid #ffcdd2;
}

.delete-impacts h5 {
  color: var(--danger-color);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-impacts ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.delete-impacts li {
  padding: 8px 0;
  border-bottom: 1px solid #ffebee;
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-impacts li:last-child {
  border-bottom: none;
}

.delete-impacts li i {
  color: var(--danger-color);
}

.delete-tip {
  background-color: #e8f4fd;
  border-radius: var(--border-radius-sm);
  padding: 12px 15px;
  margin-top: 15px;
  color: var(--secondary-color);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.delete-tip i {
  color: var(--secondary-color);
}

.final-confirm {
  background-color: #f8f9fa;
  border-radius: var(--border-radius-sm);
  padding: 20px;
  margin-top: 20px;
}

.confirm-input {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.confirm-input p {
  margin-bottom: 10px;
  color: var(--gray-color);
  font-size: 14px;
}

.confirm-input strong {
  color: var(--danger-color);
}

.confirm-input-field:focus {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

/* 模板卡片特有样式 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.template-card {
  border-left: 4px solid var(--secondary-color);
  position: relative;
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.card-header {
  margin-bottom: 15px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.template-manufacturer {
  color: var(--gray-color);
  font-size: 14px;
  margin-bottom: 10px;
  margin-top: 5px;
}

.protocol-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  background-color: var(--secondary-color);
}

.template-desc {
  color: var(--gray-color);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
  min-height: 40px;
}

.template-stats {
  margin-top: 15px;
}

.create-time {
  font-size: 12px;
  color: var(--gray-color);
}

.action-btn.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  min-height: 32px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 协议类型特定样式 */
.protocol-modbus .protocol-badge {
  background-color: var(--secondary-color);
}

.protocol-mqtt .protocol-badge {
  background-color: var(--success-color);
}

.protocol-can .protocol-badge {
  background-color: var(--warning-color);
}

.protocol-opcua .protocol-badge {
  background-color: var(--danger-color);
}

.protocol-http .protocol-badge {
  background-color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .filter-bar {
    flex-direction: column;
  }

  .delete-warning {
    flex-direction: column;
    text-align: center;
  }

  .warning-icon {
    font-size: 36px;
  }

  .delete-details {
    grid-template-columns: 1fr;
  }
}
</style>
