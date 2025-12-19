<template>
  <div v-if="selectedInstances.length > 0" class="batch-actions">
    <span>已选择 {{ selectedInstances.length }} 个实例</span>
    <div class="batch-buttons">
      <button class="btn btn-outline" @click="handleBatchEnable" :disabled="loading">
        <i class="fas fa-check-circle"></i> 启用
      </button>
      <button class="btn btn-outline" @click="handleBatchDisable" :disabled="loading">
        <i class="fas fa-times-circle"></i> 停用
      </button>
      <button class="btn btn-danger" @click="handleBatchDelete" :disabled="loading">
        <i class="fas fa-trash"></i> 删除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchActions',
  props: {
    selectedInstances: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['batch-enable', 'batch-disable', 'batch-delete'],
  methods: {
    handleBatchEnable() {
      if (this.selectedInstances.length === 0) return
      if (confirm(`确定要启用选中的 ${this.selectedInstances.length} 个实例吗？`)) {
        this.$emit('batch-enable', this.selectedInstances)
      }
    },

    handleBatchDisable() {
      if (this.selectedInstances.length === 0) return
      if (confirm(`确定要停用选中的 ${this.selectedInstances.length} 个实例吗？`)) {
        this.$emit('batch-disable', this.selectedInstances)
      }
    },

    handleBatchDelete() {
      if (this.selectedInstances.length === 0) return
      if (confirm(`确定要删除选中的 ${this.selectedInstances.length} 个实例吗？`)) {
        this.$emit('batch-delete', this.selectedInstances)
      }
    },
  },
}
</script>

<style scoped>
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 6px;
}

.batch-actions span {
  font-weight: 500;
  color: #1976d2;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #95a5a6;
  color: #34495e;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}
</style>
