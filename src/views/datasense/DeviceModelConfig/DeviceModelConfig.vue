<template>
  <div class="device-template-page">
    <!-- 侧边栏 -->
    <Sidebar active-nav="data-collection" active-sub-nav="device-template" />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <TopHeader title="数据采集与转发" title-icon="fas fa-database" user-name="管理员" />

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 面包屑导航 -->
        <PageHeader title="设备模板管理" :breadcrumbs="breadcrumbs" :actions="pageActions" />

        <!-- 删除确认模态框 - 替换为组件 -->
        <DeleteConfirmModal
          v-if="showDeleteConfirmModal"
          :template="deleteTemplateInfo"
          @delete-success="handleDeleteSuccess"
          @delete-error="handleDeleteError"
          @close="closeDeleteConfirmModal"
        />

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
          <TemplateFormModal
            v-if="showCreateModal"
            :mode="'create'"
            :initial-data="createForm"
            :protocol-types="protocolTypes"
            @form-success="handleFormSuccess"
            @form-error="handleFormError"
            @close="closeCreateModal"
          />

          <!-- 编辑模板模态框 -->
          <TemplateFormModal
            v-if="showEditModal"
            :mode="'edit'"
            :initial-data="editForm"
            :protocol-types="protocolTypes"
            @form-success="handleFormSuccess"
            @form-error="handleFormError"
            @close="closeEditModal"
          />

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
                      @click="goToCommunicationSpec(template)"
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
import deviceTemplateService from './services/deviceTemplateService'
import DeleteConfirmModal from './components/modals/DeleteConfirmModal.vue'
import TemplateFormModal from './components/modals/TemplateFormModal.vue'
import { getProtocolDisplayName, getProtocolIcon } from './services/protocolService'

export default {
  name: 'DeviceModelConfig',
  components: {
    Sidebar,
    TopHeader,
    PageHeader,
    DeleteConfirmModal,
    TemplateFormModal,
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
      createForm: {
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      },

      // 编辑模态框相关数据
      showEditModal: false,
      editForm: {
        id: null,
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      },

      // 删除确认模态框相关数据
      showDeleteConfirmModal: false,
      deleteTemplateInfo: {
        id: null,
        name: '',
        manufacturer: '',
        protocol_type: '',
      },
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
  },
  methods: {
    // 加载协议类型
    async loadProtocolTypes() {
      this.loadingProtocols = true
      try {
        console.log('正在加载协议类型...')
        const protocols = await deviceTemplateService.getProtocolTypes()
        console.log('获取到的协议类型:', protocols)
        this.protocolTypes = protocols || []
      } catch (error) {
        console.error('加载协议类型失败:', error)
        // 如果后端API失败，使用默认的协议类型列表
        this.protocolTypes = [
          'CAN',
          'IEC-61850',
          'MQTT',
          'Modbus RTU',
          'Modbus TCP',
          'OPCUA',
          'RS232',
          'RS485',
        ]
        this.$message.warning('使用默认协议类型')
      } finally {
        this.loadingProtocols = false
      }
    },

    getProtocolDisplayName(protocolType) {
      return getProtocolDisplayName(protocolType)
    },
    getProtocolIcon(protocolType) {
      return getProtocolIcon(protocolType)
    },

    // 显示删除确认模态框
    showDeleteConfirm(template) {
      this.deleteTemplateInfo = {
        id: template.id,
        name: template.model_name || '未命名模板',
        manufacturer: template.manufacturer || '',
        protocol_type: template.protocol_type || '',
      }
      this.showDeleteConfirmModal = true
    },

    // 关闭删除确认模态框
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false
    },

    // 打开创建模态框
    openCreateModal() {
      if (this.protocolTypes.length === 0) {
        this.$message.info('正在加载协议类型，请稍后...')
        return
      }
      this.showCreateModal = true
      this.createForm = {
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      }
    },

    closeCreateModal() {
      this.showCreateModal = false
    },

    // 新增：处理删除成功事件
    handleDeleteSuccess({ template: _template, message }) {
      this.$message.success(message)
      this.closeDeleteConfirmModal()
      // 重新加载数据
      this.loadDeviceTemplates()
    },

    // 新增：处理删除错误事件
    handleDeleteError({ template: _template, error }) {
      this.$message.error(error)
    },

    // 打开编辑模态框
    openEditModal(templateId) {
      const template = this.templates.find((t) => t.id === templateId)
      if (!template) {
        this.$message.error('模板不存在')
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
      // 如果需要在关闭时重置表单，可以保留这个逻辑，但删除 isEditing
      this.editForm = {
        id: null,
        model_name: '',
        manufacturer: '',
        protocol_type: '',
        description: '',
      }
    },

    // 新增：处理表单成功事件
    handleFormSuccess({ mode, message, data }) {
      this.$message.success(message)
      if (mode === 'create') {
        this.closeCreateModal()
      } else {
        this.closeEditModal()
      }
      // 重新加载数据
      this.loadDeviceTemplates()
    },

    // 新增：处理表单错误事件
    handleFormError({ mode, error, formData }) {
      this.$message.error(`${mode === 'create' ? '创建' : '更新'}失败: ${error}`)
    },

    async loadDeviceTemplates() {
      this.loadingTemplates = true
      try {
        console.log('正在调用后端API: /api/device/modelConfig')
        const response = await deviceTemplateService.getDeviceTemplates()
        console.log('API响应:', response)

        if (response.code === 200) {
          // 直接使用后端返回的数据
          this.templates = response.data || []
          console.log('加载到的模板数量:', this.templates.length)
        } else {
          console.warn('API返回错误码:', response.code)
          this.$message.error(`加载失败: ${response.message || '未知错误'}`)
          this.templates = []
        }
      } catch (error) {
        console.error('API调用失败:', error)
        this.$message.error('API调用失败，请稍后重试')
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
      this.$message.info('导入模板功能开发中...')
    },

    handleExport() {
      this.$message.info('导出模板功能开发中...')
    },

    // 新增：跳转到通信规约页面
    goToCommunicationSpec(template) {
      // 根据协议类型决定显示哪个页面
      const protocolType = template.protocol_type

      // 可以将协议类型作为查询参数传递
      this.$router.push({
        path: `/data/device/modelConfig/${template.id}/communication`,
        query: {
          protocol: protocolType,
        },
      })
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
/* 只保留页面特有的样式，删除重复的全局样式 */
/* 页面布局样式 */
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

/* 让输入框自适应，按钮固定宽度 */
.search-bar input {
  flex: 1; /* 输入框占据剩余空间 */
  min-width: 0; /* 防止输入框溢出 */
}

.search-bar button {
  min-width: 100px; /* 给按钮一个最小宽度 */
  white-space: nowrap; /* 防止文字换行 */
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.filter-bar {
  display: flex;
  gap: 15px;
}

/* 模板卡片特有样式 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.template-card {
  border-left: 4px solid var(--secondary-color);
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
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
}
</style>
