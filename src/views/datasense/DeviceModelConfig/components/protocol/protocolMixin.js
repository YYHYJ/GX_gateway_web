// 协议配置页面公共逻辑混入
export const protocolMixin = {
  data() {
    return {
      loading: false,
      error: '',
      allPoints: [],
      filteredPoints: [],
      points: [],
      selectedPoints: [],
      selectAll: false,
      totalItems: 0,
      totalPages: 1,
      searchText: '',
      currentPage: 1,
      pageSize: 10,
      showDialog: false,
      editingPoint: null,
    }
  },

  computed: {
    hasSearchFilter() {
      return this.searchText.trim() !== '' || Object.values(this.filters || {}).some(v => v !== '')
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
  },

  watch: {
    searchText() {
      this.applyFilters()
    },
  },

  methods: {
    // 分页相关
    updatePagination() {
      this.currentPage = 1
      this.totalItems = this.filteredPoints.length
      this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize))
      this.updateCurrentPageData()
    },

    updateCurrentPageData() {
      if (!this.filteredPoints.length) {
        this.points = []
        return
      }
      const start = (this.currentPage - 1) * this.pageSize
      this.points = this.filteredPoints.slice(start, start + this.pageSize)
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages
        this.updateCurrentPageData()
      }
    },

    changePage() {
      this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages))
      this.updateCurrentPageData()
    },

    changePageSize() {
      this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize))
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages
      this.updateCurrentPageData()
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.updateCurrentPageData()
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.updateCurrentPageData()
      }
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.updateCurrentPageData()
      }
    },

    // 选择相关
    toggleSelectAll() {
      this.selectAll
        ? (this.selectedPoints = this.points.map((p) => p.id))
        : (this.selectedPoints = [])
    },

    // 对话框相关
    closeDialog() {
      this.showDialog = false
      this.editingPoint = null
      this.resetPointForm()
    },

    // 格式化相关
    formatByteOrder(byteOrder) {
      const map = {
        big_endian: '大端模式',
        little_endian: '小端模式',
      }
      return map[byteOrder] || byteOrder || '--'
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '--'
      return dateTime
    },

    // 错误处理
    handleApiError(err) {
      if (err.response) {
        const status = err.response.status
        if (status === 404) {
          this.error = '请求的资源不存在'
        } else if (status === 401) {
          this.error = '未授权，请重新登录'
        } else if (status === 500) {
          this.error = '服务器内部错误'
        } else {
          this.error = `请求失败 (${status}): ${err.response.data?.message || err.message}`
        }
      } else if (err.request) {
        this.error = '网络错误，请检查网络连接'
      } else {
        this.error = err.message || '加载点位数据失败，请稍后重试'
      }
    },

    extractApiErrorMessage(errorData, isEdit = false) {
      const action = isEdit ? '更新' : '创建'
      if (errorData && errorData.code === 400) {
        const errorMsg = errorData.data?.error || errorData.message || `${action}失败`
        return `${action}失败: ${errorMsg}`
      }
      return `${action}失败: ${errorData?.message || '未知错误'}`
    },

    extractHttpErrorMessage(err, isEdit = false) {
      const action = isEdit ? '更新' : '创建'
      if (err.response) {
        const status = err.response.status
        const errorData = err.response.data
        if (status === 400) {
          const errorMsg = errorData?.data?.error || errorData?.message || `${action}失败`
          return `${action}失败: ${errorMsg}`
        }
        if (status === 500) {
          return `${action}失败: 服务器内部错误，请稍后重试`
        }
        const statusMessages = {
          401: '未授权，请重新登录',
          403: '权限不足',
          404: '资源不存在',
          409: '资源冲突',
        }
        const statusMessage = statusMessages[status] || `HTTP错误 (${status})`
        return `${action}失败: ${errorData?.message || statusMessage}`
      }
      if (err.request) {
        return `${action}失败: 网络错误，请检查网络连接`
      }
      return `${action}失败: ${err.message || '未知错误'}`
    },
  },
}

// 数据类型选项
export const dataTypeOptions = [
  { value: 'boolean', label: 'BOOL' },
  { value: 'bit', label: 'BIT (自动生成BIT0-BIT15)' },
  { value: 'bit0', label: 'BIT0' },
  { value: 'bit1', label: 'BIT1' },
  { value: 'bit2', label: 'BIT2' },
  { value: 'bit3', label: 'BIT3' },
  { value: 'bit4', label: 'BIT4' },
  { value: 'bit5', label: 'BIT5' },
  { value: 'bit6', label: 'BIT6' },
  { value: 'bit7', label: 'BIT7' },
  { value: 'bit8', label: 'BIT8' },
  { value: 'bit9', label: 'BIT9' },
  { value: 'bit10', label: 'BIT10' },
  { value: 'bit11', label: 'BIT11' },
  { value: 'bit12', label: 'BIT12' },
  { value: 'bit13', label: 'BIT13' },
  { value: 'bit14', label: 'BIT14' },
  { value: 'bit15', label: 'BIT15' },
  { value: 'int16', label: 'INT16' },
  { value: 'uint16', label: 'UINT16' },
  { value: 'int32', label: 'INT32' },
  { value: 'uint32', label: 'UINT32' },
  { value: 'float', label: 'FLOAT' },
  { value: 'double', label: 'DOUBLE' },
]

// 格式化数据类型显示
export function formatDataType(dataType) {
  if (!dataType) return '--'
  const option = dataTypeOptions.find((opt) => opt.value === dataType)
  if (option) {
    return option.label.split('(')[0].trim()
  }
  return dataType.toUpperCase()
}
