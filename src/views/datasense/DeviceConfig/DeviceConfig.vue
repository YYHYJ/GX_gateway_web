<template>
  <!-- 页面 -->
  <MainLayout active-nav="data" user-name="管理员" @nav-change="handleNavigation">
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader title="设备实例" :breadcrumbs="breadcrumbs" :actions="pageActions" />

      <!-- 页面具体内容 -->
      <div class="template-content">
        <!-- 搜索筛选组件 -->
        <DeviceFilter @search="handleSearch" @filter-change="handleFilter" @reset="resetSearch" />

        <!-- 实例列表 -->
        <div class="instances-container">
          <!-- 加载状态 -->
          <div
            v-if="loading"
            class="loading-state"
            style="text-align: center; padding: 40px; color: #666"
          >
            <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom: 10px"></i>
            <p>加载中...</p>
          </div>

          <!-- 空状态 -->
          <div
            v-else-if="!loading && instances.length === 0"
            class="empty-state"
            style="text-align: center; padding: 40px; color: #999"
          >
            <i class="fas fa-inbox fa-3x" style="margin-bottom: 20px; color: #ddd"></i>
            <p>暂无设备实例</p>
            <button
              class="btn btn-primary"
              @click="handleAddDeviceInstance"
              style="margin-top: 10px"
            >
              <i class="fas fa-plus"></i> 添加设备实例
            </button>
          </div>

          <!-- 数据表格 -->
          <div v-else class="table-container">
            <table class="instances-table">
              <thead>
                <tr>
                  <th>实例名称</th>
                  <th>模板名称</th>
                  <th>实例代码</th>
                  <th>通信协议</th>
                  <th>通信状态</th>
                  <th>采集间隔</th>
                  <th>创建时间</th>
                  <th class="fixed-column-action" style="width: 200px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="instance in displayInstances" :key="instance.id">
                  <td>
                    <div class="instance-name">{{ instance.name }}</div>
                  </td>
                  <td>
                    <div>{{ instance.template }}</div>
                  </td>
                  <td>{{ instance.code }}</td>
                  <td>{{ instance.protocolDisplay }}</td>
                  <td>
                    <span :class="['status-badge', `status-${instance.status}`]">
                      {{ getStatusDisplayText(instance.status) }}
                    </span>
                  </td>
                  <td>{{ instance.interval }}ms</td>
                  <td>{{ instance.createTime }}</td>
                  <td class="fixed-column-action">
                    <div class="table-actions">
                      <a class="action-link" @click="handleMonitor(instance.id)">监控</a>
                      <a class="action-link" @click="handleEdit(instance.id)">编辑</a>
                      <a
                        class="action-link delete"
                        @click="handleDelete(instance.id, instance.name)"
                        >删除</a
                      >
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页组件 -->
          <Pagination
            v-if="!loading && instances.length > 0"
            :current-page="currentPage"
            :total-items="totalItems"
            :page-size="pageSize"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </MainLayout>

  <!-- 创建设备模态框 -->
  <CreateDeviceModal
    v-model:visible="showCreateModal"
    @created="handleDeviceCreated"
    @close="handleModalClose"
  />

  <EditDeviceModal
    v-model:visible="showEditModal"
    :device-id="editingDeviceId"
    :device-list="instances"
    @updated="handleDeviceUpdated"
    @close="handleEditModalClose"
  />
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import CreateDeviceModal from '@/views/datasense/DeviceConfig/components/CreateDeviceModal.vue'
import EditDeviceModal from '@/views/datasense/DeviceConfig/components/EditDeviceModal.vue' // 新增导入
import DeviceFilter from '@/views/datasense/DeviceConfig/components/DeviceFilter.vue'
import Pagination from '@/views/datasense/DeviceConfig/components/Pagination.vue'
import { deviceService } from '@/views/datasense/DeviceConfig/services/deviceService.js'
import {
  deviceStatus,
  searchUtils,
  dataTransform,
} from '@/views/datasense/DeviceConfig/utils/deviceUtils'

export default {
  name: 'DeviceConfig',
  components: {
    MainLayout,
    PageHeader,
    DeviceFilter,
    Pagination,
    CreateDeviceModal,
    EditDeviceModal,
  },
  data() {
    return {
      breadcrumbs: [
        { title: '数据采集', link: '/data' },
        { title: '设备实例', link: '/data/device' },
      ],
      pageActions: [
        {
          text: '新增设备实例',
          type: 'primary',
          icon: 'fas fa-plus',
          handler: () => {
            this.showCreateModal = true
          },
        },
        {
          text: '应用编辑',
          type: 'warning',
          icon: 'fas fa-sync-alt',
          handler: this.handleApplyEdit,
        },
      ],
      searchKeyword: '',
      statusFilter: '',
      protocolFilter: '',
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      instances: [],
      filteredInstances: [],
      loading: false,
      errorMessage: null,
      showCreateModal: false,
      showEditModal: false,
      editingDeviceId: null,
      applyingEdit: false,
    }
  },
  created() {
    this.fetchDeviceInstances()
    this.showRestartSuccessMessage()
  },
  computed: {
    displayInstances() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredInstances.slice(start, end)
    },
  },
  methods: {
    // 新增：应用编辑方法
    async handleApplyEdit() {
      if (
        !confirm(
          '确定要应用编辑并重启网关程序吗？\n\n系统将在10秒内重启，重启完成后页面会自动刷新。',
        )
      ) {
        return
      }

      try {
        const response = await fetch('/api/system/restart')
        const result = await response.json()

        if (response.ok && result.code === 200) {
          // 在 sessionStorage 中设置标志（刷新后有效）
          sessionStorage.setItem('restart_success', 'true')

          // 立即显示即将刷新的提示
          alert('✅ 重启指令已发送！页面将在10秒后自动刷新...')

          // 10秒后刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 10000)
        } else {
          alert(`❌ 重启失败: ${result.message || '未知错误'}`)
        }
      } catch (error) {
        alert(`❌ 重启失败: ${error.message || '网络错误'}`)
      }
    },

    // 显示重启成功消息
    showRestartSuccessMessage() {
      // 检查是否有重启成功的标志
      const restartSuccess = sessionStorage.getItem('restart_success')

      if (restartSuccess === 'true') {
        // 等待页面加载完成后显示提示
        setTimeout(() => {
          alert('🎉 网关重启成功！系统已恢复正常运行。')

          // 清除标志，避免下次刷新还显示
          sessionStorage.removeItem('restart_success')
        }, 800) // 延迟一点，确保页面完全加载
      }
    },

    // 数据获取
    async fetchDeviceInstances() {
      this.startLoading()
      try {
        const data = await deviceService.getDeviceInstances()
        this.handleApiResponse(data)
      } catch (error) {
        this.errorMessage = error.message
        console.error('获取设备实例失败:', error)
      } finally {
        this.finishLoading()
      }
    },

    // 添加设备实例函数
    handleAddDeviceInstance() {
      this.showCreateModal = true
    },

    // 处理设备创建成功
    handleDeviceCreated() {
      this.fetchDeviceInstances()
      this.$message.success('设备实例创建成功')
    },

    // 处理模态框关闭
    handleModalClose() {
      this.showCreateModal = false
    },

    // 处理设备编辑成功
    handleDeviceUpdated() {
      this.fetchDeviceInstances()
    },

    // 处理编辑模态框关闭
    handleEditModalClose() {
      this.showEditModal = false
      this.editingDeviceId = null
    },

    // 编辑设备实例
    handleEdit(deviceId) {
      this.editingDeviceId = deviceId
      this.showEditModal = true
    },

    // 删除单个实例
    async handleDelete(instanceId, instanceName) {
      if (confirm(`确定要删除实例 ${instanceName} 吗？`)) {
        this.startLoading()
        try {
          await deviceService.deleteDevice(instanceId)
          this.fetchDeviceInstances()
          this.$message.success('删除成功')
        } catch (error) {
          this.errorMessage = error.message
          this.$message.error('删除失败: ' + error.message)
        } finally {
          this.finishLoading()
        }
      }
    },

    handleApiResponse(data) {
      if (data.code === 200 && data.data?.devices) {
        this.instances = data.data.devices.map((device) => dataTransform.formatDeviceItem(device))
        this.filteredInstances = [...this.instances]
        this.updateTotalItems()
      } else {
        this.$message.error(data.message || '获取设备实例失败')
      }
    },

    // 搜索筛选
    handleSearch(filters) {
      this.searchKeyword = filters.searchKeyword
      this.statusFilter = filters.statusFilter
      this.protocolFilter = filters.protocolFilter
      this.currentPage = 1
      this.applyFilters()
    },

    handleFilter(filters) {
      this.statusFilter = filters.statusFilter
      this.protocolFilter = filters.protocolFilter
      this.currentPage = 1
      this.applyFilters()
    },

    resetSearch() {
      this.searchKeyword = ''
      this.statusFilter = ''
      this.protocolFilter = ''
      this.currentPage = 1
      this.applyFilters()
    },

    applyFilters() {
      this.filteredInstances = searchUtils.applyFilters(this.instances, {
        searchKeyword: this.searchKeyword,
        statusFilter: this.statusFilter,
        protocolFilter: this.protocolFilter,
      })
      this.updateTotalItems()
    },

    // 分页
    handlePageChange(page) {
      this.currentPage = page
    },

    updateTotalItems() {
      this.totalItems = this.filteredInstances.length
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1
      }
    },

    get totalPages() {
      return Math.ceil(this.totalItems / this.pageSize) || 1
    },

    // 状态管理
    startLoading() {
      this.loading = true
      this.errorMessage = null
    },

    finishLoading() {
      this.loading = false
    },

    // 工具方法
    getStatusDisplayText(status) {
      return deviceStatus.getStatusDisplayText(status)
    },

    handleNavigation(navId) {
      console.log('导航切换:', navId)
    },

    handleMonitor(instanceId) {
      // 使用 query 参数传递实例ID
      this.$router.push({
        name: 'Datamonitor',
        query: {
          instanceId: instanceId,
        },
      })
    },
  },
}
</script>

<style scoped>
/* 基础布局样式 */
.content-area {
  padding: 0;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.template-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-top: 20px;
}

/* 实例列表容器 */
.instances-container {
  padding: 0 20px;
}

.table-container {
  overflow-x: auto;
  width: 100%;
  position: relative;
}

/* 表格基础样式 */
.instances-table {
  width: 100%;
  border-collapse: collapse;
}

.instances-table th {
  background-color: #f8f9fa;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.instances-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.instances-table tr:hover {
  background-color: #f8f9fa;
}

/* 实例名称样式 */
.instance-name {
  font-weight: 600;
  color: #2c3e50;
}

/* 状态标签样式 */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-online {
  background-color: #d4edda;
  color: #155724;
}

.status-offline {
  background-color: #f8d7da;
  color: #721c24;
}

.status-fault {
  background-color: #fff3cd;
  color: #856404;
}

/* 表格操作区域样式 */
.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

/* 操作链接样式 */
.action-link {
  color: #3498db;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s;
  padding: 4px 4px;
  border-radius: 4px;
}

.action-link:hover {
  text-decoration: underline;
  background-color: rgba(52, 152, 219, 0.1);
}

.action-link.delete {
  color: #e74c3c;
}

.action-link.delete:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

/* 固定操作列样式 */
.fixed-column-action {
  position: sticky;
  right: 0;
  background-color: #f8f9fa;
  z-index: 10;
  border-left: 2px solid #e0e0e0;
  width: 150px;
  min-width: 150px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fixed-column-action {
    width: 120px;
    min-width: 120px;
  }

  .table-actions {
    flex-direction: column;
    gap: 4px;
  }

  .action-link {
    padding: 2px 4px;
  }
}
</style>
