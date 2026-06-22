<template>
  <MainLayout
    active-nav="data-collection"
    active-sub-item="point-alias"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader
        title="点位别名管理"
        :breadcrumbs="[{ title: '数据采集' }, { title: '点位别名管理' }]"
      />

      <!-- 页面内容 -->
      <div class="alias-content">
        <!-- 表状态检查 -->
        <div v-if="checkingTable" class="checking-state">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>检查别名表状态...</p>
        </div>

        <!-- 表不存在，显示全量生成按钮 -->
        <div v-else-if="!tableExists" class="empty-state">
          <i class="fas fa-database fa-3x"></i>
          <p>别名表不存在，请先创建</p>
          <button
            class="btn btn-primary"
            style="padding: 12px 32px; font-size: 16px; margin-top: 20px"
            @click="handleRebuild"
          >
            <i class="fas fa-magic"></i> 全量生成别名表
          </button>
        </div>

        <!-- 表存在，显示正常内容 -->
        <template v-else>
          <!-- 筛选栏 -->
          <div class="card">
            <div class="filter-bar">
              <div class="filter-item">
                <label>选择设备：</label>
                <select v-model="selectedDeviceId" @change="loadAliases">
                  <option value="">全部设备</option>
                  <option v-for="device in devices" :key="device.id" :value="device.id">
                    {{ device.device_name }} ({{ device.device_code }})
                  </option>
                </select>
              </div>

              <div class="filter-item">
                <input
                  type="text"
                  v-model="searchKeyword"
                  placeholder="搜索点位代码/名称/别名..."
                  @input="handleSearch"
                />
              </div>

              <div class="filter-actions">
                <button class="btn btn-primary" @click="handleSync">
                  <i class="fas fa-sync"></i> 增量更新
                </button>
                <button class="btn btn-default" @click="resetFilter">
                  <i class="fas fa-redo"></i> 重置
                </button>
              </div>
            </div>
          </div>

          <!-- 数据表格 -->
          <div class="card">
            <div class="table-wrapper">
              <!-- 加载状态 -->
              <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>加载中...</p>
              </div>

              <!-- 空状态 -->
              <div v-else-if="!loading && filteredAliases.length === 0" class="empty-state">
                <i class="fas fa-inbox fa-3x"></i>
                <p>{{ searchKeyword ? '无匹配数据' : '暂无点位别名数据' }}</p>
              </div>

              <!-- 数据表格 -->
              <table v-else class="alias-table">
                <thead>
                  <tr>
                    <th style="width: 60px">序号</th>
                    <th>设备名称</th>
                    <th>设备代码</th>
                    <th>点位代码</th>
                    <th>点位名称</th>
                    <th>别名</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(alias, index) in displayAliases" :key="alias.id">
                    <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                    <td>{{ alias.device_name }}</td>
                    <td>{{ alias.device_code }}</td>
                    <td>{{ alias.point_code }}</td>
                    <td>{{ alias.point_name }}</td>
                    <td @click="startEdit(alias)">
                      <input
                        v-if="editingId === alias.id"
                        v-model="editForm.alias"
                        class="inline-edit-input"
                        @blur="saveEdit(alias)"
                        @keyup.enter="saveEdit(alias)"
                        @keyup.esc="cancelEdit"
                        ref="editInput"
                      />
                      <div v-else class="cell-editable">
                        {{ alias.alias || '点击设置别名' }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- 分页组件 -->
              <div v-if="total > pageSize" class="pagination-container">
                <div class="pagination-info">
                  <span>每页</span>
                  <select
                    v-model.number="pageSize"
                    @change="handlePageSizeChange"
                    class="page-size-select"
                  >
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                  <span>条，共 {{ total }} 条</span>
                </div>

                <div class="pagination">
                  <button class="page-btn" @click="goToPage(1)" :disabled="currentPage <= 1">
                    首页
                  </button>
                  <button class="page-btn" @click="prevPage" :disabled="currentPage <= 1">
                    上一页
                  </button>
                  <button
                    v-for="page in pageNumbers"
                    :key="page"
                    class="page-btn"
                    :class="{ active: page === currentPage }"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                  <button class="page-btn" @click="nextPage" :disabled="currentPage >= totalPages">
                    下一页
                  </button>
                  <button
                    class="page-btn"
                    @click="goToPage(totalPages)"
                    :disabled="currentPage >= totalPages"
                  >
                    尾页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import {
  getPointAliasList,
  batchGenerateAlias,
  updateAlias,
  rebuildAliasTable,
  syncAliasTable,
  checkAliasStatus,
} from '@/api/pointAlias'

export default {
  name: 'PointAliasConfig',
  components: {
    MainLayout,
    PageHeader,
  },
  data() {
    return {
      devices: [],
      selectedDeviceId: '',
      aliases: [],
      loading: false,
      searchKeyword: '',

      // 表状态
      tableExists: false,
      checkingTable: true,

      // 分页
      currentPage: 1,
      pageSize: 50,
      total: 0,

      // 编辑状态
      editingId: null,
      editForm: {
        alias: '',
      },
      originalAlias: '', // 保存原始别名值
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    pageNumbers() {
      const pages = []
      const maxPages = 5

      if (this.totalPages <= maxPages) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i)
        }
      } else {
        let start = Math.max(1, this.currentPage - 2)
        let end = Math.min(this.totalPages, start + maxPages - 1)

        if (end - start < maxPages - 1) {
          start = Math.max(1, end - maxPages + 1)
        }

        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
      }
      return pages
    },
    filteredAliases() {
      let result = this.aliases

      // 设备筛选
      if (this.selectedDeviceId) {
        result = result.filter((a) => a.device_id == this.selectedDeviceId)
      }

      // 搜索筛选
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(
          (a) =>
            a.point_code.toLowerCase().includes(keyword) ||
            a.point_name.toLowerCase().includes(keyword) ||
            (a.alias && a.alias.toLowerCase().includes(keyword)) ||
            a.device_code.toLowerCase().includes(keyword) ||
            a.device_name.toLowerCase().includes(keyword),
        )
      }

      return result
    },
    displayAliases() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredAliases.slice(start, end)
    },
  },
  watch: {
    selectedDeviceId() {
      this.currentPage = 1
      this.updateTotal()
    },
    searchKeyword() {
      this.currentPage = 1
      this.updateTotal()
    },
  },
  created() {
    this.loadDevices()
    this.checkTableStatus()
  },
  methods: {
    handleNavigation(nav) {
      this.$emit('nav-change', nav)
    },

    // 更新总数
    updateTotal() {
      this.total = this.filteredAliases.length
    },

    // 检查表状态
    async checkTableStatus() {
      this.checkingTable = true
      try {
        const res = await checkAliasStatus()

        // 处理嵌套的响应结构: { code: 200, data: { code: 200, data: {...} } }
        let statusData = null
        if (res && res.code === 200) {
          // 如果res.data还有code字段,说明是嵌套结构
          if (res.data && res.data.code === 200 && res.data.data) {
            statusData = res.data.data
          } else if (res.data) {
            // 否则直接使用res.data
            statusData = res.data
          }
        }

        if (statusData) {
          // 根据need_rebuild字段决定是否需要重建
          this.tableExists = !statusData.need_rebuild

          // 如果不需要重建，加载数据
          if (this.tableExists) {
            await this.loadAliases()
          }
        }
      } catch (e) {
        console.error('检查表状态失败:', e)
        this.$message && this.$message.error('检查表状态失败')
      } finally {
        this.checkingTable = false
      }
    },

    // 全量重建别名表
    async handleRebuild() {
      if (!confirm('确定要全量重建别名表吗？\n这将删除现有数据并重新生成所有点位别名。')) {
        return
      }

      try {
        const res = await rebuildAliasTable()

        // 处理嵌套响应
        let resultData = null
        if (res && res.code === 200) {
          if (res.data && res.data.code === 200 && res.data.data) {
            resultData = res.data.data
          } else if (res.data) {
            resultData = res.data
          }
        }

        if (resultData) {
          this.$message &&
            this.$message.success(`全量重建成功，共生成 ${resultData.record_count} 条记录`)
          this.tableExists = true
          await this.loadAliases()
        }
      } catch (e) {
        console.error('全量重建失败:', e)
        this.$message && this.$message.error('全量重建失败: ' + (e.message || '未知错误'))
      }
    },

    // 增量同步别名表
    async handleSync() {
      try {
        const res = await syncAliasTable()

        // 处理嵌套响应
        let resultData = null
        if (res && res.code === 200) {
          if (res.data && res.data.code === 200 && res.data.data) {
            resultData = res.data.data
          } else if (res.data) {
            resultData = res.data
          }
        }

        if (resultData) {
          this.$message && this.$message.success('增量同步完成')
          await this.loadAliases()
        }
      } catch (e) {
        console.error('增量同步失败:', e)
        this.$message && this.$message.error('增量同步失败: ' + (e.message || '未知错误'))
      }
    },

    // 加载设备列表
    async loadDevices() {
      try {
        const res = await this.$axios.get('/api/device/config')
        if (res && res.code === 200) {
          this.devices = res.data?.devices || []
        }
      } catch (e) {
        console.error('加载设备列表失败:', e)
      }
    },

    // 加载别名列表
    async loadAliases() {
      this.loading = true
      try {
        const params = {}
        if (this.selectedDeviceId) {
          params.device_id = this.selectedDeviceId
        }

        const res = await getPointAliasList(params)

        let aliases = []
        if (res && res.code === 200 && Array.isArray(res.data)) {
          aliases = res.data
        } else if (Array.isArray(res)) {
          aliases = res
        }

        this.aliases = aliases
        this.currentPage = 1
        this.updateTotal()
      } catch (e) {
        console.error('加载别名列表失败:', e)
        this.$message && this.$message.error('加载失败')
      } finally {
        this.loading = false
      }
    },

    // 搜索处理
    handleSearch() {
      this.currentPage = 1
    },

    // 重置筛选
    resetFilter() {
      this.selectedDeviceId = ''
      this.searchKeyword = ''
      this.currentPage = 1
      this.loadAliases()
    },

    // 批量生成别名
    async handleBatchGenerate() {
      if (!this.selectedDeviceId) {
        this.$message && this.$message.warning('请先选择设备')
        return
      }

      if (!confirm('确定要为该设备的所有点位自动生成别名吗？\n格式：device_code.point_code')) {
        return
      }

      try {
        const res = await batchGenerateAlias({
          device_id: Number(this.selectedDeviceId),
        })

        if (res && res.code === 200) {
          this.$message && this.$message.success(`成功生成 ${res.data.count || 0} 个别名`)
          await this.loadAliases()
        }
      } catch (e) {
        console.error('批量生成失败:', e)
        this.$message && this.$message.error('生成失败: ' + (e.message || '未知错误'))
      }
    },

    // 开始编辑
    startEdit(alias) {
      this.editingId = alias.id
      this.originalAlias = alias.alias || '' // 保存原始值
      this.editForm.alias = this.originalAlias
      this.$nextTick(() => {
        if (this.$refs.editInput && this.$refs.editInput[0]) {
          this.$refs.editInput[0].focus()
        }
      })
    },

    // 保存编辑
    async saveEdit(alias) {
      if (!this.editingId) return

      // 检查是否有变化，没有变化则直接取消编辑
      const newAlias = this.editForm.alias || ''
      if (newAlias === this.originalAlias) {
        this.cancelEdit()
        return
      }

      try {
        await updateAlias({
          id: alias.id,
          alias: newAlias,
        })

        this.$message && this.$message.success('保存成功')
        this.editingId = null
        this.originalAlias = ''
        await this.loadAliases()
      } catch (e) {
        console.error('保存失败:', e)
        this.$message && this.$message.error('保存失败')
        this.editingId = null
        this.originalAlias = ''
      }
    },

    // 取消编辑
    cancelEdit() {
      this.editingId = null
      this.editForm.alias = ''
      this.originalAlias = ''
    },

    // 切换启用/禁用状态
    async toggleActive(alias) {
      try {
        await updateAlias({
          id: alias.id,
          alias: alias.alias,
          is_active: alias.is_active ? 0 : 1,
        })

        this.$message && this.$message.success(alias.is_active ? '已停用' : '已启用')
        await this.loadAliases()
      } catch (e) {
        console.error('操作失败:', e)
        this.$message && this.$message.error('操作失败')
      }
    },

    // 分页变化
    handlePageChange(page) {
      this.currentPage = page
    },

    handlePageSizeChange() {
      this.totalPages = Math.max(1, Math.ceil(this.total / this.pageSize))
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return '-'
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.alias-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 检查状态 */
.checking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.checking-state i {
  margin-bottom: 16px;
  color: #3498db;
}

.checking-state p {
  margin: 0;
  font-size: 16px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: #34495e;
  font-weight: 500;
  white-space: nowrap;
}

.filter-item select,
.filter-item input {
  padding: 8px 12px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
  background: #fff;
  min-width: 200px;
}

.filter-item input {
  min-width: 250px;
}

.filter-item select:focus,
.filter-item input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background: #ecf0f1;
  color: #34495e;
  border: 1px solid #d1d9e6;
}

.btn-default:hover {
  background: #d5dbdb;
}

/* 表格容器 */
.table-container {
  /* 使用全局.card样式 */
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;
}

.loading-state i {
  font-size: 32px;
  color: #3498db;
  margin-bottom: 12px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #95a5a6;
}

.empty-state i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 16px;
}

/* 表格容器 */
.table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 表格样式 */
.alias-table {
  width: 100%;
  border-collapse: collapse;
}

.alias-table thead {
  background-color: #f8f9fa;
}

.alias-table th {
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 15;
  font-size: 14px;
}

.alias-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  font-size: 14px;
  color: #34495e;
}

.alias-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 类型标签 */
.type-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #f0f0f0;
  color: #333;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* 可编辑单元格 */
.cell-editable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid transparent;
  min-height: 20px;
}

.cell-editable:hover {
  border-color: #3498db;
  background-color: #f0f8ff;
}

/* 行内编辑输入框 */
.inline-edit-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #3498db;
  border-radius: 3px;
  font-size: 14px;
  color: #2c3e50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* 状态徽章 */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background-color: #f0f0f0;
  color: #333;
}

.toggle-badge {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
}

.toggle-badge:hover {
  opacity: 0.7;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.page-size-select {
  margin: 0 8px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.page-size-select:focus {
  border-color: #3498db;
}

/* 分页按钮 */
.pagination {
  display: flex;
  gap: 4px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #3498db;
  color: #3498db;
}

.page-btn.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item select,
  .filter-item input {
    width: 100%;
  }

  .filter-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
