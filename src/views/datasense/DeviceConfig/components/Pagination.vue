<template>
  <div class="pagination">
    <div class="pagination-info" v-if="showInfo">
      共 {{ totalItems }} 条记录，第 {{ currentPage }}/{{ totalPages }} 页
    </div>
    <div class="pagination-controls">
      <button class="page-btn" @click="goToPage(1)" :disabled="currentPage <= 1">首页</button>
      <button class="page-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1">
        上一页
      </button>

      <template v-for="page in visiblePages" :key="page">
        <button class="page-btn" :class="{ active: page === currentPage }" @click="goToPage(page)">
          {{ page }}
        </button>
      </template>

      <button
        class="page-btn"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages"
      >
        下一页
      </button>
      <button class="page-btn" @click="goToPage(totalPages)" :disabled="currentPage >= totalPages">
        末页
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
    showInfo: {
      type: Boolean,
      default: true,
    },
    maxVisiblePages: {
      type: Number,
      default: 5,
    },
  },
  emits: ['page-change'],
  computed: {
    totalPages() {
      return Math.ceil(this.totalItems / this.pageSize) || 1
    },

    visiblePages() {
      const half = Math.floor(this.maxVisiblePages / 2)
      let start = Math.max(1, this.currentPage - half)
      let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1)

      if (end - start + 1 < this.maxVisiblePages) {
        start = Math.max(1, end - this.maxVisiblePages + 1)
      }

      const pages = []
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    },
  },
  methods: {
    goToPage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      this.$emit('page-change', page)
    },
  },
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0px;
  padding: 15px;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 5px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  min-width: 40px;
}

.page-btn:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.page-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
