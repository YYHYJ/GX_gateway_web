<template>
  <div class="can-protocol-config">
    <!-- CAN 点位配置 -->
    <div class="can-points-config">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <input
          type="text"
          v-model="searchText"
          class="search-input"
          placeholder="搜索点位代码、点位名称..."
          @keyup.enter="loadPoints"
        />
        <button class="search-btn" @click="loadPoints"><i class="fas fa-search"></i> 搜索</button>
        <button class="btn btn-outline reset-btn" @click="resetSearch">
          <i class="fas fa-redo"></i> 重置
        </button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <select v-model="filters.status" class="filter-select" @change="loadPoints">
          <option value="">所有状态</option>
          <option value="1">启用</option>
          <option value="0">停用</option>
        </select>

        <select v-model="filters.idType" class="filter-select" @change="loadPoints">
          <option value="">ID类型</option>
          <option value="0">标准帧</option>
          <option value="1">扩展帧</option>
        </select>

        <select v-model="filters.fragmentScheme" class="filter-select" @change="loadPoints">
          <option value="">分片类型</option>
          <option value="0">单包</option>
          <option value="1">多包</option>
        </select>

        <select v-model="filters.dataType" class="filter-select" @change="loadPoints">
          <option value="">所有数据类型</option>
          <option v-for="type in dataTypeOptions" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>

        <select v-model="filters.isControl" class="filter-select" @change="loadPoints">
          <option value="">是否可控</option>
          <option value="1">可控</option>
          <option value="0">不可控</option>
        </select>

        <select v-model="filters.isWarnPoint" class="filter-select" @change="loadPoints">
          <option value="">是否报警点</option>
          <option value="1">是</option>
          <option value="0">否</option>
        </select>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <div class="action-left"></div>
        <div class="action-right">
          <button class="btn btn-primary" @click="showAddPointDialog">
            <i class="fas fa-plus"></i> 新建点位
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载点位数据...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadPoints">
          <i class="fas fa-redo"></i> 重新加载
        </button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="points.length === 0 && !hasSearchFilter" class="empty-state">
        <i class="fas fa-database"></i>
        <h3>暂无点位数据</h3>
        <p>还没有配置任何点位，点击"新建点位"开始配置</p>
        <button class="btn btn-primary" @click="showAddPointDialog">
          <i class="fas fa-plus"></i> 新建点位
        </button>
      </div>

      <!-- 列表 -->
      <div v-else class="points-container">
        <div class="table-container">
          <table class="points-table">
            <thead>
              <tr>
                <th style="width: 40px">
                  <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
                </th>
                <th>点位代码</th>
                <th>点位名称</th>
                <th>状态</th>
                <th>CAN ID</th>
                <th>ID类型</th>
                <th>分片</th>
                <th>数据位置</th>
                <th>数据长度</th>
                <th>数据类型</th>
                <th>缩放因子</th>
                <th>偏移量</th>
                <th>工程单位</th>
                <th>精度</th>
                <th>字节序</th>
                <th>可控</th>
                <th>最小值</th>
                <th>最大值</th>
                <th>报警点</th>
                <th>报警下限</th>
                <th>报警上限</th>
                <th>描述</th>
                <th>创建时间</th>
                <th class="fixed-column-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="points.length === 0 && hasSearchFilter" class="no-match-row">
                <td colspan="24" class="no-match">
                  <i class="fas fa-search"></i>
                  <p>没有找到匹配的点位数据</p>
                  <button class="btn btn-outline" @click="resetSearch">重置搜索条件</button>
                </td>
              </tr>
              <tr v-for="point in sortedPoints" :key="point.id">
                <td><input type="checkbox" v-model="selectedPoints" :value="point.id" /></td>
                <td>{{ point.pointCode }}</td>
                <td>
                  <div class="point-name">{{ point.pointName }}</div>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="point.isActive === 1 ? 'status-active' : 'status-inactive'"
                  >
                    {{ point.isActive === 1 ? '启用' : '停用' }}
                  </span>
                </td>
                <td>{{ formatCanId(point.canId) }}</td>
                <td>{{ point.isExtended === 1 ? '扩展帧' : '标准帧' }}</td>
                <td>
                  <span v-if="point.fragmentScheme === 1" class="fragment-badge fragment-multi">
                    第 {{ point.fragmentType }} 片
                  </span>
                  <span v-else class="fragment-badge fragment-single">单包</span>
                </td>
                <td>{{ point.dataPosition }}</td>
                <td>{{ point.dataLength }}</td>
                <td>{{ point.dataType?.toUpperCase() }}</td>
                <td>{{ point.scaleFactor }}</td>
                <td>{{ point.offset }}</td>
                <td>{{ point.engineeringUnit }}</td>
                <td>{{ point.precision }}</td>
                <td>{{ point.byteOrder === 'big_endian' ? '大端' : '小端' }}</td>
                <td>
                  <span
                    class="control-badge"
                    :class="point.isControl === 1 ? 'control-enabled' : 'control-disabled'"
                  >
                    {{ point.isControl === 1 ? '可控' : '不可控' }}
                  </span>
                </td>
                <td>{{ point.minValue }}</td>
                <td>{{ point.maxValue }}</td>
                <td>
                  <span
                    class="warn-badge"
                    :class="point.isWarnPoint === 1 ? 'warn-yes' : 'warn-no'"
                  >
                    {{ point.isWarnPoint === 1 ? '是' : '否' }}
                  </span>
                </td>
                <td>{{ point.warningLow }}</td>
                <td>{{ point.warningHigh }}</td>
                <td class="point-desc" :title="point.description">
                  {{ point.description || '--' }}
                </td>
                <td>{{ point.createdAt || '--' }}</td>
                <td class="fixed-column-action">
                  <div class="table-actions">
                    <a class="action-link" @click="editPoint(point)">编辑</a>
                    <a class="action-link delete" @click="deletePoint(point)">删除</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控制 -->
        <div v-if="points.length > 0" class="pagination-controls">
          <div class="page-info">
            <span>第</span>
            <input
              type="number"
              v-model.number="currentPage"
              class="page-input"
              @change="changePage"
              :min="1"
              :max="totalPages"
            />
            <span>页，每页</span>
            <select v-model.number="pageSize" class="page-size-select" @change="changePageSize">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span>条，共 {{ totalItems }} 条</span>
          </div>
          <div class="pagination">
            <button class="page-btn" @click="prevPage" :disabled="currentPage <= 1">上一页</button>
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
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="selectedPoints.length > 0" class="batch-actions">
        <span>已选择 {{ selectedPoints.length }} 个点位</span>
        <div class="batch-buttons">
          <button class="btn btn-outline" @click="batchEnable">
            <i class="fas fa-check-circle"></i> 启用
          </button>
          <button class="btn btn-outline" @click="batchDisable">
            <i class="fas fa-times-circle"></i> 停用
          </button>
          <button class="btn btn-outline" @click="batchControlEnable">
            <i class="fas fa-hand-pointer"></i> 设为可控
          </button>
          <button class="btn btn-outline" @click="batchControlDisable">
            <i class="fas fa-hand-paper"></i> 设为不可控
          </button>
          <button class="btn btn-danger" @click="batchDelete">
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑点位对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>{{ editingPoint ? '编辑点位' : '新建点位' }}</h3>
          <button class="dialog-close" @click="closeDialog"><i class="fas fa-times"></i></button>
        </div>
        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label><span class="required">*</span>点位代码</label>
              <input type="text" v-model="pointForm.pointCode" placeholder="例如: TEMPERATURE" />
            </div>
            <div class="form-group">
              <label><span class="required">*</span>点位名称</label>
              <input type="text" v-model="pointForm.pointName" placeholder="例如: 温度" />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="pointForm.isActive">
                <option :value="1">启用</option>
                <option :value="0">停用</option>
              </select>
            </div>
            <div class="form-group">
              <label>CAN ID</label>
              <input
                type="text"
                v-model="pointForm.canIdDisplay"
                @blur="formatCanIdInput"
                placeholder="例如: 0x123"
              />
            </div>
            <div class="form-group">
              <label>ID类型</label>
              <select v-model="pointForm.isExtended">
                <option :value="0">标准帧</option>
                <option :value="1">扩展帧</option>
              </select>
            </div>
            <div class="form-group">
              <label>分片类型</label>
              <select v-model="pointForm.fragmentScheme" @change="onFragmentSchemeChange">
                <option :value="0">单包</option>
                <option :value="1">多包</option>
              </select>
            </div>
            <div class="form-group">
              <label>片序号</label>
              <input
                type="number"
                v-model.number="pointForm.fragmentType"
                :disabled="pointForm.fragmentScheme === 0"
                placeholder="例如: 1"
              />
            </div>
            <div class="form-group">
              <label>数据位置</label>
              <input type="number" v-model.number="pointForm.dataPosition" placeholder="0" />
            </div>
            <div class="form-group">
              <label>数据长度</label>
              <input type="number" v-model.number="pointForm.dataLength" placeholder="2" />
            </div>
            <div class="form-group">
              <label>数据类型</label>
              <select v-model="pointForm.dataType">
                <option v-for="type in dataTypeOptions" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>缩放因子</label>
              <input
                type="number"
                v-model.number="pointForm.scaleFactor"
                step="0.001"
                placeholder="1.0"
              />
            </div>
            <div class="form-group">
              <label>偏移量</label>
              <input
                type="number"
                v-model.number="pointForm.offset"
                step="0.001"
                placeholder="0.0"
              />
            </div>
            <div class="form-group">
              <label>工程单位</label>
              <input type="text" v-model="pointForm.engineeringUnit" placeholder="例如: °C" />
            </div>
            <div class="form-group">
              <label>精度</label>
              <input type="number" v-model.number="pointForm.precision" placeholder="1" />
            </div>
            <div class="form-group">
              <label>字节序</label>
              <select v-model="pointForm.byteOrder">
                <option value="big_endian">大端模式</option>
                <option value="little_endian">小端模式</option>
              </select>
            </div>
            <div class="form-group">
              <label>可控</label>
              <select v-model="pointForm.isControl">
                <option :value="0">不可控</option>
                <option :value="1">可控</option>
              </select>
            </div>
            <div class="form-group">
              <label>最小值</label>
              <input type="number" v-model.number="pointForm.minValue" placeholder="-999999" />
            </div>
            <div class="form-group">
              <label>最大值</label>
              <input type="number" v-model.number="pointForm.maxValue" placeholder="999999" />
            </div>
            <div class="form-group">
              <label>报警点</label>
              <select v-model="pointForm.isWarnPoint">
                <option :value="0">否</option>
                <option :value="1">是</option>
              </select>
            </div>
            <div class="form-group">
              <label>报警下限</label>
              <input type="number" v-model.number="pointForm.warningLow" placeholder="-999999" />
            </div>
            <div class="form-group">
              <label>报警上限</label>
              <input type="number" v-model.number="pointForm.warningHigh" placeholder="999999" />
            </div>
            <div class="form-group full-width">
              <label>描述</label>
              <textarea
                v-model="pointForm.description"
                rows="3"
                placeholder="点位描述信息"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-outline" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="savePoint">
            {{ editingPoint ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'CANProtocol',
  props: {
    templateId: { type: [String, Number], required: true },
    templateData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      loading: false,
      error: '',
      allPoints: [],
      filteredPoints: [],
      points: [],
      selectedPoints: [],
      selectAll: false,
      searchText: '',
      filters: {
        status: '',
        idType: '',
        fragmentScheme: '',
        dataType: '',
        isControl: '',
        isWarnPoint: '',
      },
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 1,
      showDialog: false,
      editingPoint: null,
      pointForm: {
        id: null,
        modelId: null,
        pointCode: '',
        pointName: '',
        isActive: 1,
        canId: 0,
        canIdDisplay: '0x0',
        isExtended: 0,
        fragmentScheme: 0,
        fragmentType: 0,
        dataPosition: 0,
        dataLength: 2,
        dataType: 'int16',
        scaleFactor: 1,
        offset: 0,
        engineeringUnit: '',
        precision: 1,
        byteOrder: 'big_endian',
        isControl: 0,
        minValue: 0,
        maxValue: 0,
        isWarnPoint: 0,
        warningLow: 0,
        warningHigh: 0,
        description: '',
      },
      dataTypeOptions: [
        { value: 'int8', label: 'INT8' },
        { value: 'uint8', label: 'UINT8' },
        { value: 'int16', label: 'INT16' },
        { value: 'uint16', label: 'UINT16' },
        { value: 'int32', label: 'INT32' },
        { value: 'uint32', label: 'UINT32' },
        { value: 'float', label: 'FLOAT' },
        { value: 'double', label: 'DOUBLE' },
        { value: 'boolean', label: 'BOOLEAN' },
      ],
    }
  },
  computed: {
    hasSearchFilter() {
      return this.searchText.trim() !== '' || Object.values(this.filters).some((v) => v !== '')
    },
    pageNumbers() {
      const pages = [],
        maxPages = 5
      if (this.totalPages <= maxPages) {
        for (let i = 1; i <= this.totalPages; i++) pages.push(i)
      } else {
        let start = Math.max(1, this.currentPage - 2)
        let end = Math.min(this.totalPages, start + maxPages - 1)
        if (end - start < maxPages - 1) start = Math.max(1, end - maxPages + 1)
        for (let i = start; i <= end; i++) pages.push(i)
      }
      return pages
    },
    sortedPoints() {
      return [...this.points].sort((a, b) => {
        if (a.canId !== b.canId) return a.canId - b.canId
        if (a.fragmentScheme !== b.fragmentScheme) return a.fragmentScheme - b.fragmentScheme
        return a.fragmentType - b.fragmentType
      })
    },
  },
  created() {
    this.pointForm.modelId = Number(this.templateId)
    this.loadPoints()
  },
  watch: {
    filters: { handler: 'applyFilters', deep: true },
    searchText: 'applyFilters',
  },
  methods: {
    formatCanId(value) {
      return value !== undefined && value !== null
        ? '0x' + Number(value).toString(16).toUpperCase()
        : '--'
    },
    formatCanIdInput() {
      if (this.pointForm.canIdDisplay) {
        let value = this.pointForm.canIdDisplay.toString()
        this.pointForm.canId =
          value.startsWith('0x') || value.startsWith('0X')
            ? parseInt(value, 16)
            : parseInt(value, 10)
        this.pointForm.canIdDisplay = '0x' + this.pointForm.canId.toString(16).toUpperCase()
      } else {
        this.pointForm.canId = 0
        this.pointForm.canIdDisplay = '0x0'
      }
    },
    onFragmentSchemeChange() {
      if (this.pointForm.fragmentScheme === 0) this.pointForm.fragmentType = 0
    },
    async loadPoints() {
      this.loading = true
      this.error = ''
      try {
        const response = await axios.post('/api/device/model_detail_can1', {
          model_id: Number(this.templateId),
          start_can_id: 18,
          size: 100,
          current: 1,
        })
        if (response.data?.code === 200) {
          const apiData = response.data.data
          if (apiData?.code === 0) {
            this.allPoints = (apiData.data.records || []).map((r) => ({
              id: r.id || '',
              modelId: r.model_id || '',
              pointCode: r.point_code || '',
              pointName: r.point_name || '',
              canId: r.can_id || 0,
              isExtended: r.is_extended || 0,
              fragmentScheme: r.fragment_scheme || 0,
              fragmentType: r.fragment_type || 0,
              dataPosition: r.data_position || 0,
              dataLength: r.data_length || 0,
              dataType: r.data_type || '',
              scaleFactor: r.scale_factor || 0,
              offset: r.offset || 0,
              engineeringUnit: r.engineering_unit || '',
              precision: r.precision || 0,
              byteOrder: r.byte_order || 'big_endian',
              isControl: r.is_control || 0,
              minValue: r.min_value || 0,
              maxValue: r.max_value || 0,
              isWarnPoint: r.is_warn_point || 0,
              warningLow: r.warning_low || 0,
              warningHigh: r.warning_high || 0,
              isActive: r.is_active || 0,
              description: r.description || '',
              createdAt: r.created_at || '',
            }))
            this.totalItems = apiData.data.total || 0
            this.applyFilters()
          } else this.error = apiData?.message || '数据格式不正确'
        } else this.error = response.data?.message || '请求失败'
      } catch (err) {
        console.error('加载点位数据失败:', err)
        this.error = err.message || '加载失败'
      } finally {
        this.loading = false
      }
    },
    applyFilters() {
      if (!this.allPoints.length) {
        this.filteredPoints = []
        this.updatePagination()
        return
      }
      let filtered = [...this.allPoints]
      if (this.searchText.trim()) {
        const txt = this.searchText.trim().toLowerCase()
        filtered = filtered.filter(
          (p) => p.pointCode.toLowerCase().includes(txt) || p.pointName.toLowerCase().includes(txt),
        )
      }
      if (this.filters.status)
        filtered = filtered.filter((p) => p.isActive === Number(this.filters.status))
      if (this.filters.idType)
        filtered = filtered.filter((p) => p.isExtended === Number(this.filters.idType))
      if (this.filters.fragmentScheme)
        filtered = filtered.filter((p) => p.fragmentScheme === Number(this.filters.fragmentScheme))
      if (this.filters.dataType)
        filtered = filtered.filter((p) => p.dataType === this.filters.dataType)
      if (this.filters.isControl)
        filtered = filtered.filter((p) => p.isControl === Number(this.filters.isControl))
      if (this.filters.isWarnPoint)
        filtered = filtered.filter((p) => p.isWarnPoint === Number(this.filters.isWarnPoint))
      this.filteredPoints = filtered
      this.updatePagination()
    },
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
    resetSearch() {
      this.searchText = ''
      this.filters = {
        status: '',
        idType: '',
        fragmentScheme: '',
        dataType: '',
        isControl: '',
        isWarnPoint: '',
      }
    },
    toggleSelectAll() {
      this.selectAll
        ? (this.selectedPoints = this.points.map((p) => p.id))
        : (this.selectedPoints = [])
    },
    showAddPointDialog() {
      this.editingPoint = null
      this.resetPointForm()
      this.showDialog = true
    },
    editPoint(point) {
      this.editingPoint = point
      this.pointForm = {
        ...point,
        modelId: Number(this.templateId),
        canIdDisplay: '0x' + point.canId.toString(16).toUpperCase(),
      }
      this.showDialog = true
    },
    closeDialog() {
      this.showDialog = false
      this.editingPoint = null
      this.resetPointForm()
    },
    resetPointForm() {
      this.pointForm = {
        id: null,
        modelId: Number(this.templateId),
        pointCode: '',
        pointName: '',
        isActive: 1,
        canId: 0,
        canIdDisplay: '0x0',
        isExtended: 0,
        fragmentScheme: 0,
        fragmentType: 0,
        dataPosition: 0,
        dataLength: 2,
        dataType: 'int16',
        scaleFactor: 1,
        offset: 0,
        engineeringUnit: '',
        precision: 1,
        byteOrder: 'big_endian',
        isControl: 0,
        minValue: 0,
        maxValue: 0,
        isWarnPoint: 0,
        warningLow: 0,
        warningHigh: 0,
        description: '',
      }
    },
    async savePoint() {
      const errors = []
      if (!this.pointForm.pointCode?.trim()) errors.push('点位代码不能为空')
      if (!this.pointForm.pointName?.trim()) errors.push('点位名称不能为空')
      if (errors.length) return this.$message.error(errors.join('，'))
      this.formatCanIdInput()
      try {
        const requestData = {
          points: [
            {
              id: this.editingPoint ? this.pointForm.id : null,
              model_id: Number(this.pointForm.modelId),
              point_code: this.pointForm.pointCode.trim(),
              point_name: this.pointForm.pointName.trim(),
              is_active: this.pointForm.isActive,
              can_id: Number(this.pointForm.canId),
              is_extended: Number(this.pointForm.isExtended),
              fragment_scheme: Number(this.pointForm.fragmentScheme),
              fragment_type: Number(this.pointForm.fragmentType),
              data_position: Number(this.pointForm.dataPosition),
              data_length: Number(this.pointForm.dataLength),
              data_type: this.pointForm.dataType,
              scale_factor: Number(this.pointForm.scaleFactor) || 1.0,
              offset: Number(this.pointForm.offset) || 0.0,
              engineering_unit: this.pointForm.engineeringUnit || '',
              precision: Number(this.pointForm.precision) || 0,
              byte_order: this.pointForm.byteOrder,
              is_control: Number(this.pointForm.isControl),
              min_value: this.pointForm.minValue || 0,
              max_value: this.pointForm.maxValue || 0,
              is_warn_point: Number(this.pointForm.isWarnPoint),
              warning_low: this.pointForm.warningLow || 0,
              warning_high: this.pointForm.warningHigh || 0,
              description: this.pointForm.description || '',
            },
          ],
        }
        const response = this.editingPoint
          ? await axios.put('/api/device/model_detail_can', requestData)
          : await axios.post('/api/device/model_detail_can', requestData)
        if (response.data?.code === 200) {
          this.$message.success(this.editingPoint ? '点位更新成功' : '点位创建成功')
          this.closeDialog()
          await this.loadPoints()
        } else this.$message.error(response.data?.message || '保存失败')
      } catch (err) {
        console.error('保存点位失败:', err)
        this.$message.error('保存失败: ' + (err.message || '未知错误'))
      }
    },
    async deletePoint(point) {
      if (!confirm(`确定要删除点位 "${point.pointName}" 吗？`)) return
      try {
        const response = await axios.delete('/api/device/model_detail_can', {
          data: { ids: [point.id] },
        })
        if (response.data?.code === 200) {
          this.$message.success('删除成功')
          await this.loadPoints()
        } else throw new Error(response.data?.message || '删除失败')
      } catch (err) {
        console.error('删除点位失败:', err)
        this.$message.error('删除失败: ' + (err.message || '未知错误'))
      }
    },
    async batchUpdateStatus(status) {
      if (!this.selectedPoints.length) return
      const action = status === 1 ? '启用' : '停用'
      if (!confirm(`确定要${action}选中的 ${this.selectedPoints.length} 个点位吗？`)) return
      try {
        const selectedData = this.allPoints.filter((p) => this.selectedPoints.includes(p.id))
        const response = await axios.put('/api/device/model_detail_can', {
          points: selectedData.map((p) => ({
            id: p.id,
            model_id: Number(this.templateId),
            point_code: p.pointCode,
            point_name: p.pointName,
            is_active: status,
            can_id: p.canId,
            is_extended: p.isExtended,
            fragment_scheme: p.fragmentScheme,
            fragment_type: p.fragmentType,
            data_position: p.dataPosition,
            data_length: p.dataLength,
            data_type: p.dataType,
            scale_factor: p.scaleFactor,
            offset: p.offset,
            engineering_unit: p.engineeringUnit,
            precision: p.precision,
            byte_order: p.byteOrder,
            is_control: p.isControl,
            min_value: p.minValue,
            max_value: p.maxValue,
            is_warn_point: p.isWarnPoint,
            warning_low: p.warningLow,
            warning_high: p.warningHigh,
            description: p.description,
          })),
        })
        if (response.data?.code === 200) {
          this.selectedPoints = []
          this.selectAll = false
          this.$message.success(`已${action} ${selectedData.length} 个点位`)
          await this.loadPoints()
        } else throw new Error(response.data?.message || `批量${action}失败`)
      } catch (err) {
        console.error('批量更新失败:', err)
        this.$message.error(`批量${action}失败: ` + (err.message || '未知错误'))
      }
    },
    async batchUpdateControlStatus(controlStatus) {
      if (!this.selectedPoints.length) return
      const action = controlStatus === 1 ? '设为可控' : '设为不可控'
      if (!confirm(`确定要将选中的 ${this.selectedPoints.length} 个点位${action}吗？`)) return
      try {
        const selectedData = this.allPoints.filter((p) => this.selectedPoints.includes(p.id))
        const response = await axios.put('/api/device/model_detail_can', {
          points: selectedData.map((p) => ({
            ...p,
            model_id: Number(this.templateId),
            is_control: controlStatus,
            point_code: p.pointCode,
            point_name: p.pointName,
          })),
        })
        if (response.data?.code === 200) {
          this.selectedPoints = []
          this.selectAll = false
          this.$message.success(`已${action} ${selectedData.length} 个点位`)
          await this.loadPoints()
        } else throw new Error(response.data?.message || `批量${action}失败`)
      } catch (err) {
        console.error('批量更新可控状态失败:', err)
        this.$message.error(`批量${action}失败: ` + (err.message || '未知错误'))
      }
    },
    batchEnable() {
      this.batchUpdateStatus(1)
    },
    batchDisable() {
      this.batchUpdateStatus(0)
    },
    batchControlEnable() {
      this.batchUpdateControlStatus(1)
    },
    batchControlDisable() {
      this.batchUpdateControlStatus(0)
    },
    async batchDelete() {
      if (!this.selectedPoints.length) return
      if (!confirm(`确定要删除选中的 ${this.selectedPoints.length} 个点位吗？`)) return
      try {
        const response = await axios.delete('/api/device/model_detail_can', {
          data: { ids: this.selectedPoints },
        })
        if (response.data?.code === 200) {
          await this.loadPoints()
          this.selectedPoints = []
          this.selectAll = false
          this.$message.success(`已删除 ${this.selectedPoints.length} 个点位`)
        } else throw new Error(response.data?.message || '批量删除失败')
      } catch (err) {
        console.error('批量删除失败:', err)
        this.$message.error('批量删除失败: ' + (err.message || '未知错误'))
      }
    },
  },
}
</script>

<style scoped>
.can-protocol-config {
  width: 100%;
}
.can-points-config {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.search-bar {
  display: flex;
  margin-bottom: 20px;
  padding: 20px 20px 0;
}
.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
  font-size: 16px;
}
.search-btn {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
}
.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 0 20px;
  flex-wrap: wrap;
}
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  min-width: 150px;
}
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}
.action-left,
.action-right {
  display: flex;
  gap: 10px;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary {
  background-color: #3498db;
  color: white;
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
.btn-success {
  background-color: #2ecc71;
  color: white;
}
.btn:hover {
  opacity: 0.9;
}
.points-container {
  padding: 0 20px;
}
.table-container {
  overflow-x: auto;
  width: 100%;
  position: relative;
}
.points-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1800px;
}
.points-table th {
  background-color: #f8f9fa;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}
.points-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}
.points-table tr:hover {
  background-color: #f8f9fa;
}
.point-name {
  font-weight: 600;
  color: #2c3e50;
}
.point-desc {
  color: #95a5a6;
  font-size: 14px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-actions {
  display: flex;
  gap: 10px;
}
.action-link {
  color: #3498db;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.action-link:hover {
  background-color: #f0f0f0;
  text-decoration: none;
}
.action-link.delete {
  color: #e74c3c;
}
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}
.status-active {
  background-color: #d4edda;
  color: #155724;
}
.status-inactive {
  background-color: #f8d7da;
  color: #721c24;
}
.control-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}
.control-enabled {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.control-disabled {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.warn-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}
.warn-yes {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}
.warn-no {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}
.fragment-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}
.fragment-single {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}
.fragment-multi {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #b8daff;
}
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}
.page-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}
.page-size-select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 5px;
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
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px;
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
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 40px;
}
.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
.error-state i {
  font-size: 48px;
  color: #e74c3c;
  margin-bottom: 15px;
}
.error-state h3 {
  margin-bottom: 10px;
  color: #e74c3c;
}
.empty-state i {
  font-size: 64px;
  color: #95a5a6;
  margin-bottom: 20px;
}
.empty-state h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}
.empty-state p {
  color: #7f8c8d;
  margin-bottom: 20px;
}
.no-match-row td {
  padding: 40px !important;
  text-align: center;
}
.no-match {
  text-align: center;
  padding: 40px !important;
  color: #95a5a6;
}
.no-match i {
  font-size: 48px;
  margin-bottom: 15px;
  display: block;
}
.no-match p {
  margin-bottom: 20px;
}
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.dialog-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}
.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}
.dialog-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #95a5a6;
  padding: 5px;
  border-radius: 4px;
}
.dialog-close:hover {
  background-color: #f8f9fa;
  color: #e74c3c;
}
.dialog-body {
  padding: 20px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group.full-width {
  grid-column: 1 / -1;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
}
.form-group .required {
  color: #e74c3c;
  margin-right: 4px;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #34495e;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}
.dialog-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.points-table th:first-child,
.points-table td:first-child {
  position: sticky;
  left: 0;
  background-color: #f8f9fa;
  z-index: 20;
  border-right: 1px solid #e0e0e0;
}
.fixed-column-action {
  position: sticky;
  right: 0;
  background-color: #f8f9fa;
  z-index: 10;
  border-left: 2px solid #e0e0e0;
}
.points-table td.fixed-column-action {
  background-color: white;
  z-index: 5;
}
.points-table tr:hover td.fixed-column-action {
  background-color: #f8f9fa;
}
.points-table tr:hover td:first-child {
  background-color: #f8f9fa;
}
.points-table th.fixed-column-action::before,
.points-table td.fixed-column-action::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  height: 100%;
  width: 2px;
  background-color: #e0e0e0;
  box-shadow: -2px 0 3px rgba(0, 0, 0, 0.1);
}
.table-container::-webkit-scrollbar {
  height: 8px;
}
.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.dialog-content::-webkit-scrollbar {
  width: 8px;
}
.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-select {
    width: 100%;
  }
  .action-bar {
    flex-direction: column;
    gap: 10px;
  }
  .action-left,
  .action-right {
    width: 100%;
    justify-content: center;
  }
  .pagination-controls {
    flex-direction: column;
    gap: 15px;
  }
  .page-info {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
