<template>
  <MainLayout
    active-nav="system-management"
    active-sub-item="sysvars-config"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="系统变量管理" :breadcrumbs="breadcrumbs" />

      <div class="sysvars-content">
        <!-- 操作栏 -->
        <div class="card">
          <div class="action-bar">
            <button class="btn btn-primary" @click="showCreateDialog">
              <i class="fas fa-plus"></i> 新建变量
            </button>

            <div class="filter-actions">
              <input
                type="text"
                v-model="searchKeyword"
                placeholder="搜索变量名/描述..."
                class="search-input"
              />
            </div>
          </div>

          <!-- 数据表格 -->
          <div class="table-wrapper">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-state">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
              <p>加载中...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!loading && filteredSysVars.length === 0" class="empty-state">
              <i class="fas fa-inbox fa-3x"></i>
              <p>{{ searchKeyword ? '无匹配数据' : '暂无系统变量数据' }}</p>
            </div>

            <!-- 数据表格 -->
            <table v-else class="sysvars-table">
              <thead>
                <tr>
                  <th>变量名</th>
                  <th>变量值</th>
                  <th style="width: 100px">类型</th>
                  <th>描述</th>
                  <th style="width: 100px">系统变量</th>
                  <th style="width: 180px">创建时间</th>
                  <th style="width: 150px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sysVar in filteredSysVars" :key="sysVar.id">
                  <td>
                    <span class="var-name">{{ sysVar.var_name }}</span>
                  </td>
                  <td>
                    <span
                      v-if="editingId !== sysVar.id"
                      class="cell-editable"
                      @click="startEdit(sysVar)"
                    >
                      {{ sysVar.var_value }}
                    </span>
                    <input
                      v-else
                      v-model="editForm.var_value"
                      class="inline-edit-input"
                      @blur="saveEdit(sysVar)"
                      @keyup.enter="saveEdit(sysVar)"
                      @keyup.esc="cancelEdit"
                      ref="editInput"
                    />
                  </td>
                  <td>
                    <span class="type-badge">
                      {{ getTypeLabel(sysVar.var_type) }}
                    </span>
                  </td>
                  <td>
                    <span class="description-text" :title="sysVar.description">
                      {{ sysVar.description || '-' }}
                    </span>
                  </td>
                  <td>
                    <span class="system-badge">
                      {{ sysVar.is_system === 1 ? '是' : '否' }}
                    </span>
                  </td>
                  <td>{{ sysVar.created_at }}</td>
                  <td>
                    <div class="table-actions">
                      <a class="action-link" @click="showEditDialog(sysVar)" title="编辑">编辑</a>
                      <a
                        class="action-link delete"
                        @click="handleDelete(sysVar)"
                        :class="{ disabled: sysVar.is_system === 1 }"
                        :title="sysVar.is_system === 1 ? '系统变量不可删除' : '删除'"
                        >删除</a
                      >
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑对话框 -->
    <div v-if="dialogVisible" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑变量' : '新建变量' }}</h3>
          <button class="modal-close" @click="closeDialog">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- 变量名（仅新建时显示） -->
            <div class="form-field" v-if="!isEdit">
              <label><span class="required">*</span>变量名</label>
              <input type="text" v-model="formData.var_name" placeholder="请输入变量名" required />
              <small class="field-hint">变量名唯一，创建后不可修改</small>
            </div>

            <!-- 变量值 -->
            <div class="form-field">
              <label><span class="required">*</span>变量值</label>
              <input type="text" v-model="formData.var_value" placeholder="请输入变量值" required />
            </div>

            <!-- 类型（仅新建时显示） -->
            <div class="form-field" v-if="!isEdit">
              <label><span class="required">*</span>类型</label>
              <select v-model="formData.var_type" required>
                <option value="string">文本 (string)</option>
                <option value="int">整数 (int)</option>
              </select>
              <small class="field-hint">类型创建后不可修改</small>
            </div>

            <!-- 描述 -->
            <div class="form-field">
              <label>描述</label>
              <textarea
                v-model="formData.description"
                placeholder="请输入变量描述（可选）"
                rows="3"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">确定</button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="deleteDialogVisible" class="modal-overlay">
      <div class="modal-container modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="modal-close" @click="closeDeleteDialog">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>
            确定要删除变量 <strong>{{ deleteTarget?.var_name }}</strong> 吗？
          </p>
          <p class="warning-text">此操作不可恢复！</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDeleteDialog">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">确定删除</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { getSysVars, createSysVar, updateSysVar, deleteSysVar } from '@/api/sysvars'

export default {
  name: 'SysVarsConfig',
  components: {
    MainLayout,
    PageHeader,
  },
  computed: {
    breadcrumbs() {
      return [{ title: '系统管理' }, { title: '系统变量管理' }]
    },

    // 过滤后的变量列表
    filteredSysVars() {
      let result = this.sysVars

      // 搜索过滤
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(
          (varItem) =>
            varItem.var_name.toLowerCase().includes(keyword) ||
            (varItem.description && varItem.description.toLowerCase().includes(keyword)),
        )
      }

      // 排序：系统变量靠前
      return result.sort((a, b) => {
        // 系统变量(is_system=1)排在前面
        if (a.is_system === 1 && b.is_system !== 1) return -1
        if (a.is_system !== 1 && b.is_system === 1) return 1
        return 0
      })
    },
  },
  data() {
    return {
      loading: false,
      searchKeyword: '',
      sysVars: [],

      // 对话框
      dialogVisible: false,
      isEdit: false,
      formData: {
        id: null,
        var_name: '',
        var_value: '',
        var_type: 'string',
        description: '',
      },

      // 删除对话框
      deleteDialogVisible: false,
      deleteTarget: null,

      // 行内编辑
      editingId: null,
      editForm: {
        var_value: '',
      },
    }
  },
  mounted() {
    this.loadSysVars()
  },
  methods: {
    handleNavigation(nav) {
      console.log('Navigation:', nav)
    },

    // 加载系统变量列表
    async loadSysVars() {
      this.loading = true
      try {
        const response = await getSysVars()

        if (response.code === 200) {
          this.sysVars = response.data || []
        } else {
          console.error('获取系统变量失败:', response.message)
          this.$message?.error?.(response.message || '获取系统变量失败')
          this.sysVars = []
        }
      } catch (error) {
        console.error('加载系统变量异常:', error)
        this.$message?.error?.('加载系统变量失败，请稍后重试')
        this.sysVars = []
      } finally {
        this.loading = false
      }
    },

    // 开始行内编辑
    startEdit(row) {
      this.editingId = row.id
      this.editForm.var_value = row.var_value

      // 聚焦输入框
      this.$nextTick(() => {
        const input = this.$refs.editInput
        if (input && input.focus) {
          input.focus()
        }
      })
    },

    // 保存行内编辑
    async saveEdit(row) {
      if (!this.editingId) return

      try {
        const updateData = {
          id: row.id,
          var_value: this.editForm.var_value,
        }

        const response = await updateSysVar(updateData)

        if (response.code === 200) {
          // 更新本地数据
          row.var_value = this.editForm.var_value
          this.$message?.success?.(response.message || '修改成功')
        } else {
          this.$message?.error?.(response.message || '修改失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        this.$message?.error?.(error.response?.data?.message || '保存失败')
      } finally {
        this.cancelEdit()
      }
    },

    // 取消编辑
    cancelEdit() {
      this.editingId = null
      this.editForm.var_value = ''
    },

    // 显示新建对话框
    showCreateDialog() {
      this.isEdit = false
      this.formData = {
        id: null,
        var_name: '',
        var_value: '',
        var_type: 'string',
        description: '',
      }
      this.dialogVisible = true
    },

    // 显示编辑对话框
    showEditDialog(row) {
      this.isEdit = true
      this.formData = {
        id: row.id,
        var_name: row.var_name,
        var_value: row.var_value,
        var_type: row.var_type,
        description: row.description,
      }
      this.dialogVisible = true
    },

    // 关闭对话框
    closeDialog() {
      this.dialogVisible = false
    },

    // 提交表单
    async handleSubmit() {
      try {
        if (this.isEdit) {
          // 查找原始数据
          const originalVar = this.sysVars.find((v) => v.id === this.formData.id)

          // 系统变量只能修改变量值和描述
          const updateData = {
            id: this.formData.id,
            var_value: this.formData.var_value,
            description: this.formData.description,
          }

          const response = await updateSysVar(updateData)

          if (response.code === 200) {
            // 更新本地数据
            if (originalVar) {
              originalVar.var_value = this.formData.var_value
              originalVar.description = this.formData.description
            }

            this.$message?.success?.(response.message || '更新成功')
            this.closeDialog()
            this.loadSysVars()
          } else {
            this.$message?.error?.(response.message || '更新失败')
          }
        } else {
          // 创建新变量
          const createData = {
            var_name: this.formData.var_name,
            var_value: this.formData.var_value,
            var_type: this.formData.var_type,
            description: this.formData.description,
          }

          const response = await createSysVar(createData)

          if (response.code === 200) {
            this.$message?.success?.(response.message || '创建成功')
            this.closeDialog()
            this.loadSysVars()
          } else {
            this.$message?.error?.(response.message || '创建失败')
          }
        }
      } catch (error) {
        console.error('操作失败:', error)
        this.$message?.error?.(error.response?.data?.message || '操作失败')
      }
    },

    // 显示删除确认对话框
    showDeleteDialog(row) {
      if (row.is_system === 1) {
        this.$message?.warning?.('系统变量不可删除')
        return
      }

      this.deleteTarget = row
      this.deleteDialogVisible = true
    },

    // 处理删除按钮点击
    handleDelete(row) {
      this.showDeleteDialog(row)
    },

    // 关闭删除对话框
    closeDeleteDialog() {
      this.deleteDialogVisible = false
      this.deleteTarget = null
    },

    // 确认删除
    async confirmDelete() {
      if (!this.deleteTarget) return

      // 检查是否为系统变量
      if (this.deleteTarget.is_system === 1) {
        this.$message?.warning?.('系统变量不可删除')
        this.closeDeleteDialog()
        return
      }

      try {
        const response = await deleteSysVar(this.deleteTarget.id)

        if (response.code === 200) {
          this.$message?.success?.(response.message || '删除成功')
          this.closeDeleteDialog()
          this.loadSysVars()
        } else {
          this.$message?.error?.(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除失败:', error)

        // 处理403错误
        if (error.response?.status === 403) {
          this.$message?.warning?.('系统变量不可删除')
        } else {
          this.$message?.error?.(error.response?.data?.message || '删除失败')
        }
      }
    },

    // 格式化显示值
    formatValue(value, type) {
      if (value === null || value === undefined) return '-'

      switch (type) {
        case 'int':
          return parseInt(value).toLocaleString()
        default:
          return value
      }
    },

    // 获取类型标签
    getTypeLabel(type) {
      const labels = {
        string: '文本',
        int: '整数',
      }
      return labels[type] || type
    },
  },
}
</script>

<style scoped>
/* 模态框样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-container {
  background: #fff;
  border-radius: 10px;
  width: 500px;
  max-width: 92%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  animation: slideIn 0.3s ease-out;
}

.modal-container.modal-sm {
  width: 400px;
}

.modal-header {
  padding: 14px 20px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #95a5a6;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  color: #e74c3c;
  background-color: #f5f5f5;
}

.modal-body {
  padding: 20px;
}

/* 表单字段 */
.form-field {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #34495e;
}

.form-field .required {
  color: #e74c3c;
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 8px 12px;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
  background: #fff;
  transition: all 0.2s;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.form-field textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-hint {
  font-size: 11px;
  color: #95a5a6;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-default {
  background: #fff;
  color: #7f8c8d;
  border: 1px solid #d1d9e6;
}

.btn-default:hover {
  background: #f8f9fa;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   页面特有样式
   ============================================ */

.sysvars-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  width: 280px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* 数据表格 */
.sysvars-table {
  width: 100%;
  border-collapse: collapse;
}

.sysvars-table thead {
  background-color: #f8f9fa;
}

.sysvars-table th {
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.sysvars-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  color: #34495e;
  font-size: 14px;
}

.sysvars-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 变量名 */
.var-name {
  font-weight: 600;
  color: #2c3e50;
}

/* 可编辑单元格 */
.cell-editable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid transparent;
  min-height: 20px;
  display: inline-block;
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

/* 类型徽章 */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #f0f0f0;
  color: #333;
}

/* 描述文本 */
.description-text {
  display: block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 系统变量徽章 */
.system-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #f0f0f0;
  color: #333;
}

/* 操作按钮 */
.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-link {
  color: #3498db;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-link:hover:not(.disabled) {
  text-decoration: underline;
  background-color: rgba(52, 152, 219, 0.1);
}

.action-link.delete {
  color: #e74c3c;
}

.action-link.delete:hover:not(.disabled) {
  background-color: rgba(231, 76, 60, 0.1);
}

.action-link.disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
</style>
