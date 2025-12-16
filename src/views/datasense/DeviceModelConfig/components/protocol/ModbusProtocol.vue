<template>
  <div class="modbus-protocol-config">
    <!-- Modbus TCP 点位配置 -->
    <div class="modbus-points-config">
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

        <select v-model="filters.functionCode" class="filter-select" @change="loadPoints">
          <option value="">所有功能码</option>
          <option value="1">01 - 遥信</option>
          <option value="2">02 - 遥信</option>
          <option value="3">03 - 遥测</option>
          <option value="4">04 - 遥测</option>
          <option value="5">05 - 遥控</option>
          <option value="6">06 - 遥调</option>
          <option value="15">15 - 遥控</option>
          <option value="16">16 - 遥调</option>
        </select>

        <select v-model="filters.dataType" class="filter-select" @change="loadPoints">
          <option value="">所有数据类型</option>
          <option value="bool">BOOL</option>
          <option value="bit0">BIT0</option>
          <option value="bit1">BIT1</option>
          <option value="int16">INT16</option>
          <option value="uint16">UINT16</option>
          <option value="int32">INT32</option>
          <option value="uint32">UINT32</option>
          <option value="float">FLOAT</option>
          <option value="double">DOUBLE</option>
        </select>

        <!-- 新增：可控字段筛选 -->
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
        <div class="action-left">
          <button class="btn btn-outline" @click="importPoints">
            <i class="fas fa-upload"></i> 导入点表
          </button>
          <button class="btn btn-outline" @click="exportPoints">
            <i class="fas fa-download"></i> 导出点表
          </button>
        </div>
        <div class="action-right">
          <button class="btn btn-primary" @click="showAddPointDialog">
            <i class="fas fa-plus"></i> 新增点位
          </button>
          <button class="btn btn-success" @click="addPointGroup">
            <i class="fas fa-layer-group"></i> 新增点位组
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
        <p>还没有配置任何点位，点击"新增点位"开始配置</p>
        <button class="btn btn-primary" @click="showAddPointDialog">
          <i class="fas fa-plus"></i> 新增点位
        </button>
      </div>

      <!-- 点位列表 -->
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
                <th>地址</th>
                <th>可控</th>
                <th>功能码</th>
                <th>数据类型</th>
                <th>缩放因子</th>
                <th>偏移量</th>
                <th>工程单位</th>
                <th>精度</th>
                <th>字节序</th>
                <th>最小值</th>
                <th>最大值</th>
                <th>报警点</th>
                <th>报警下限</th>
                <th>报警上限</th>
                <th>虚拟点位</th>
                <th>源点值</th>
                <th>计算表达式</th>
                <th>描述</th>
                <th>更新时间</th>
                <th class="fixed-column-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="points.length === 0 && hasSearchFilter">
                <td colspan="24" class="no-match">
                  <i class="fas fa-search"></i>
                  <p>没有找到匹配的点位数据</p>
                  <button class="btn btn-outline" @click="resetSearch">重置搜索条件</button>
                </td>
              </tr>
              <tr v-for="point in points" :key="point.id">
                <td>
                  <input type="checkbox" v-model="selectedPoints" :value="point.id" />
                </td>

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
                <td>{{ point.address }}</td>
                <td>
                  <span
                    class="control-badge"
                    :class="point.isControl === 1 ? 'control-enabled' : 'control-disabled'"
                  >
                    {{ point.isControl === 1 ? '可控' : '不可控' }}
                  </span>
                </td>
                <td>{{ point.functionCode }}</td>
                <td>{{ point.dataType }}</td>
                <td>{{ point.scaleFactor }}</td>
                <td>{{ point.offset }}</td>
                <td>{{ point.engineeringUnit }}</td>
                <td>{{ point.precision }}</td>
                <td>{{ formatByteOrder(point.byteOrder) }}</td>
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
                <td>
                  <span
                    class="virtual-badge"
                    :class="point.isVirtual === 1 ? 'virtual-yes' : 'virtual-no'"
                  >
                    {{ point.isVirtual === 1 ? '是' : '否' }}
                  </span>
                </td>
                <td class="point-source">{{ point.sourcePointCodes || '--' }}</td>
                <td class="point-expression">{{ point.calculationExpression || '--' }}</td>
                <td class="point-desc" :title="point.description">{{ point.description }}</td>
                <td>{{ formatDateTime(point.updatedTime) }}</td>
                <td class="fixed-column-action">
                  <!-- 添加固定列类 -->
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
            <input type="text" v-model="currentPage" class="page-input" @change="changePage" />
            <span>页，每页</span>
            <select v-model="pageSize" class="page-size-select" @change="changePageSize">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
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
          <h3>{{ editingPoint ? '编辑点位' : '新增点位' }}</h3>
          <button class="dialog-close" @click="closeDialog">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label><span class="required">*</span>点位代码</label>
              <input type="text" v-model="pointForm.pointCode" placeholder="例如: TEMP_001" />
            </div>
            <div class="form-group">
              <label><span class="required">*</span>点位名称</label>
              <input type="text" v-model="pointForm.pointName" placeholder="例如: 温度测量值" />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="pointForm.isActive">
                <option :value="1">启用</option>
                <option :value="0">停用</option>
              </select>
            </div>
            <div class="form-group">
              <label><span class="required">*</span>地址</label>
              <input type="number" v-model="pointForm.address" placeholder="例如: 100" />
            </div>
            <div class="form-group">
              <label>可控</label>
              <select v-model="pointForm.isControl">
                <option :value="0">不可控</option>
                <option :value="1">可控</option>
              </select>
            </div>
            <div class="form-group">
              <label><span class="required">*</span>功能码</label>
              <select v-model="pointForm.functionCode">
                <option :value="1">01 - 遥信</option>
                <option :value="2">02 - 遥信</option>
                <option :value="3">03 - 遥测</option>
                <option :value="4">04 - 遥测</option>
                <option :value="5">05 - 遥控</option>
                <option :value="6">06 - 遥调</option>
                <option :value="15">15 - 遥控</option>
                <option :value="16">16 - 遥调</option>
              </select>
            </div>
            <div class="form-group">
              <label><span class="required">*</span>数据类型</label>
              <select v-model="pointForm.dataType">
                <option value="bool">BOOL</option>
                <option value="bit0">BIT0</option>
                <option value="bit1">BIT1</option>
                <option value="int16">INT16</option>
                <option value="uint16">UINT16</option>
                <option value="int32">INT32</option>
                <option value="uint32">UINT32</option>
                <option value="float">FLOAT</option>
                <option value="double">DOUBLE</option>
              </select>
            </div>
            <div class="form-group">
              <label>缩放因子</label>
              <input
                type="number"
                v-model.number="pointForm.scaleFactor"
                step="0.01"
                placeholder="1"
              />
            </div>
            <div class="form-group">
              <label>偏移量</label>
              <input type="number" v-model.number="pointForm.offset" placeholder="0" />
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
            <div class="form-group">
              <label>虚拟点位</label>
              <select v-model="pointForm.isVirtual">
                <option :value="0">否</option>
                <option :value="1">是</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>源点值（多个用逗号分隔）</label>
              <input
                type="text"
                v-model="pointForm.sourcePointCodes"
                placeholder="例如: TEMP_001,TEMP_002"
              />
            </div>
            <div class="form-group full-width">
              <label>计算表达式</label>
              <input
                type="text"
                v-model="pointForm.calculationExpression"
                placeholder="例如: (TEMP_001+TEMP_002)/2"
              />
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
  name: 'ModbusProtocol',
  props: {
    templateId: {
      type: [String, Number],
      required: true,
    },
    templateData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      // 点位数据
      loading: false,
      error: '',
      allPoints: [],
      filteredPoints: [],
      points: [],
      selectedPoints: [],
      selectAll: false,
      totalItems: 0,
      totalPages: 1,

      // 搜索和筛选
      searchText: '',
      filters: {
        status: '',
        functionCode: '',
        dataType: '',
        isControl: '',
        isWarnPoint: '',
        isVirtual: '',
      },

      // 分页
      currentPage: 1,
      pageSize: 10,

      // 对话框
      showDialog: false,
      editingPoint: null,
      pointForm: {
        id: null,
        modelId: null,
        pointCode: '',
        pointName: '',
        isActive: 1,
        description: '',
        address: 0,
        isControl: 0,
        functionCode: 3,
        dataType: 'double',
        scaleFactor: 1,
        offset: 0,
        engineeringUnit: '',
        precision: 1,
        byteOrder: 'big_endian',
        minValue: 0,
        maxValue: 0,
        isWarnPoint: 0,
        warningLow: 0,
        warningHigh: 0,
        isVirtual: 0,
        sourcePointCodes: null,
        calculationExpression: null,
      },
    }
  },
  computed: {
    hasSearchFilter() {
      return (
        this.searchText.trim() !== '' ||
        this.filters.status !== '' ||
        this.filters.functionCode !== '' ||
        this.filters.dataType !== '' ||
        this.filters.isControl !== '' ||
        this.filters.isWarnPoint !== '' ||
        this.filters.isVirtual !== ''
      )
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
  created() {
    this.pointForm.modelId = Number(this.templateId)
    this.loadPoints()
  },
  watch: {
    filters: {
      handler() {
        this.applyFilters()
      },
      deep: true,
    },
    searchText() {
      this.applyFilters()
    },
  },
  methods: {
    async loadPoints() {
      this.loading = true
      this.error = ''
      this.allPoints = []
      this.filteredPoints = []
      this.points = []

      try {
        const requestData = {
          model_id: Number(this.templateId),
          size: 10000,
          current: 1,
          start_address: 0,
        }

        const response = await axios.post('/api/device/model_detail_modbus1', requestData)

        if (response.data && response.data.code === 200) {
          const apiData = response.data.data

          if (apiData && apiData.code === 0) {
            const data = apiData.data
            this.allPoints = this.transformPoints(data.records || [])
            this.applyFilters()
          } else {
            this.error = apiData?.message || '数据格式不正确'
          }
        } else {
          this.error = response.data?.message || '请求失败'
        }
      } catch (err) {
        console.error('加载点位数据失败:', err)
        this.handleApiError(err)
      } finally {
        this.loading = false
      }
    },

    applyFilters() {
      if (this.allPoints.length === 0) {
        this.filteredPoints = []
        this.updatePagination()
        return
      }

      let filtered = [...this.allPoints]

      // 搜索文本筛选
      if (this.searchText.trim() !== '') {
        const searchLower = this.searchText.trim().toLowerCase()
        filtered = filtered.filter((point) => {
          return (
            point.pointCode.toLowerCase().includes(searchLower) ||
            point.pointName.toLowerCase().includes(searchLower)
          )
        })
      }

      // 状态筛选
      if (this.filters.status !== '') {
        const statusValue = Number(this.filters.status)
        filtered = filtered.filter((point) => point.isActive === statusValue)
      }

      // 功能码筛选
      if (this.filters.functionCode !== '') {
        const functionCodeValue = Number(this.filters.functionCode)
        filtered = filtered.filter((point) => point.functionCode === functionCodeValue)
      }

      // 数据类型筛选
      if (this.filters.dataType !== '') {
        filtered = filtered.filter((point) => point.dataType === this.filters.dataType)
      }

      // 可控字段筛选（新增）
      if (this.filters.isControl !== '') {
        const isControlValue = Number(this.filters.isControl)
        filtered = filtered.filter((point) => point.isControl === isControlValue)
      }

      // 报警点筛选
      if (this.filters.isWarnPoint !== '') {
        const isWarnPointValue = Number(this.filters.isWarnPoint)
        filtered = filtered.filter((point) => point.isWarnPoint === isWarnPointValue)
      }

      // 虚拟点位筛选
      if (this.filters.isVirtual !== '') {
        const isVirtualValue = Number(this.filters.isVirtual)
        filtered = filtered.filter((point) => point.isVirtual === isVirtualValue)
      }

      this.filteredPoints = filtered
      this.updatePagination()
    },

    updatePagination() {
      this.currentPage = 1
      this.totalItems = this.filteredPoints.length
      this.totalPages = Math.ceil(this.totalItems / this.pageSize)
      this.updateCurrentPageData()
    },

    updateCurrentPageData() {
      const startIndex = (this.currentPage - 1) * this.pageSize
      const endIndex = startIndex + this.pageSize
      this.points = this.filteredPoints.slice(startIndex, endIndex)
    },

    transformPoints(records) {
      if (!records || !Array.isArray(records)) {
        return []
      }

      return records.map((record) => {
        return {
          id: record.id || '',
          pointCode: record.point_code || '',
          pointName: record.point_name || '',
          isActive: record.is_active || 0,
          description: record.description || '',
          address: record.address || 0,
          isControl: record.is_control || 0, // 确保这个字段正确映射
          functionCode: record.function_code || 0,
          dataType: record.data_type || '',
          scaleFactor: record.scale_factor || 0,
          offset: record.offset || 0,
          engineeringUnit: record.engineering_unit || '',
          precision: record.precision || 0,
          byteOrder: record.byte_order || '',
          minValue: record.min_value || 0,
          maxValue: record.max_value || 0,
          isWarnPoint: record.is_warn_point || 0,
          warningLow: record.warning_low || 0,
          warningHigh: record.warning_high || 0,
          isVirtual: record.is_virtual || 0,
          sourcePointCodes: record.source_point_codes || '',
          calculationExpression: record.calculation_expression || '',
          updatedTime: record.updated_time || '',
        }
      })
    },

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

    formatByteOrder(byteOrder) {
      const map = {
        big_endian: '大端模式',
        little_endian: '小端模式',
      }
      return map[byteOrder] || byteOrder || '--'
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '--'
      try {
        return dateTime
      } catch (e) {
        return '--'
      }
    },

    resetSearch() {
      this.searchText = ''
      this.filters = {
        status: '',
        functionCode: '',
        dataType: '',
        isControl: '',
        isWarnPoint: '',
        isVirtual: '',
      }
    },

    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedPoints = this.points.map((point) => point.id)
      } else {
        this.selectedPoints = []
      }
    },

    changePage() {
      if (this.currentPage < 1) this.currentPage = 1
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages
      this.updateCurrentPageData()
    },

    changePageSize() {
      this.currentPage = 1
      this.totalPages = Math.ceil(this.totalItems / this.pageSize)
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
      this.currentPage = page
      this.updateCurrentPageData()
    },

    showAddPointDialog() {
      this.editingPoint = null
      this.resetPointForm()
      this.showDialog = true
    },

    editPoint(point) {
      this.editingPoint = point
      this.pointForm = {
        id: point.id,
        modelId: Number(this.templateId),
        pointCode: point.pointCode || '',
        pointName: point.pointName || '',
        isActive: point.isActive || 1,
        description: point.description || '',
        address: point.address || 0,
        isControl: point.isControl || 0,
        functionCode: point.functionCode || 3,
        dataType: point.dataType || 'double',
        scaleFactor: point.scaleFactor || 1,
        offset: point.offset || 0,
        engineeringUnit: point.engineeringUnit || '',
        precision: point.precision || 1,
        byteOrder: point.byteOrder || 'big_endian',
        minValue: point.minValue || 0,
        maxValue: point.maxValue || 0,
        isWarnPoint: point.isWarnPoint || 0,
        warningLow: point.warningLow || 0,
        warningHigh: point.warningHigh || 0,
        isVirtual: point.isVirtual || 0,
        sourcePointCodes: point.sourcePointCodes || null,
        calculationExpression: point.calculationExpression || null,
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
        description: '',
        address: 0,
        isControl: 0,
        functionCode: 3,
        dataType: 'double',
        scaleFactor: 1,
        offset: 0,
        engineeringUnit: '',
        precision: 1,
        byteOrder: 'big_endian',
        minValue: 0,
        maxValue: 0,
        isWarnPoint: 0,
        warningLow: 0,
        warningHigh: 0,
        isVirtual: 0,
        sourcePointCodes: null,
        calculationExpression: null,
      }
    },

    async savePoint() {
      try {
        const errors = []

        if (!this.pointForm.pointCode?.trim()) {
          errors.push('点位代码不能为空')
        }

        if (!this.pointForm.pointName?.trim()) {
          errors.push('点位名称不能为空')
        }

        if (this.pointForm.address === '' || this.pointForm.address === null) {
          errors.push('地址不能为空')
        } else if (Number(this.pointForm.address) < 0) {
          errors.push('地址必须大于等于0')
        }

        if (errors.length > 0) {
          this.$message.error(errors.join('，'))
          return
        }

        const requestData = {
          points: [
            {
              id: this.editingPoint ? this.pointForm.id : null,
              model_id: this.pointForm.modelId,
              point_code: this.pointForm.pointCode.trim(),
              point_name: this.pointForm.pointName.trim(),
              is_active: this.pointForm.isActive,
              description: this.pointForm.description?.trim() || '',
              address: Number(this.pointForm.address),
              is_control: Number(this.pointForm.isControl),
              function_code: Number(this.pointForm.functionCode),
              data_type: this.pointForm.dataType,
              scale_factor: Number(this.pointForm.scaleFactor) || 1.0,
              offset: Number(this.pointForm.offset) || 0.0,
              engineering_unit: this.pointForm.engineeringUnit?.trim() || '',
              precision: Number(this.pointForm.precision) || 0,
              byte_order: this.pointForm.byteOrder,
              min_value: this.pointForm.minValue !== null ? Number(this.pointForm.minValue) : 0,
              max_value: this.pointForm.maxValue !== null ? Number(this.pointForm.maxValue) : 0,
              is_warn_point: this.pointForm.isWarnPoint,
              warning_low:
                this.pointForm.warningLow !== '' && this.pointForm.warningLow !== null
                  ? Number(this.pointForm.warningLow)
                  : null,
              warning_high:
                this.pointForm.warningHigh !== '' && this.pointForm.warningHigh !== null
                  ? Number(this.pointForm.warningHigh)
                  : null,
              is_virtual: this.pointForm.isVirtual,
              source_point_codes: this.pointForm.sourcePointCodes?.trim() || '',
              calculation_expression: this.pointForm.calculationExpression?.trim() || '',
              updated_time: null,
            },
          ],
        }

        let response
        if (this.editingPoint) {
          response = await axios.put('/api/device/model_detail_modbus', requestData)
        } else {
          response = await axios.post('/api/device/model_detail_modbus', requestData)
        }

        if (response.data && response.data.code === 200) {
          if (this.editingPoint) {
            this.$message.success('点位更新成功')
          } else {
            this.$message.success('点位创建成功')
          }

          this.closeDialog()
          await this.loadPoints()
        } else {
          throw new Error(response.data?.message || '保存失败')
        }
      } catch (err) {
        console.error('保存点位失败:', err)
        this.$message.error('保存失败: ' + (err.message || '未知错误'))
      }
    },

    async batchUpdateStatus(status) {
      if (this.selectedPoints.length === 0) return

      const updateCount = this.selectedPoints.length
      const action = status === 1 ? '启用' : '停用'

      if (!confirm(`确定要${action}选中的 ${updateCount} 个点位吗？`)) {
        return
      }

      try {
        const selectedPointsData = this.allPoints.filter((point) =>
          this.selectedPoints.includes(point.id),
        )

        const updateData = {
          points: selectedPointsData.map((point) => ({
            id: point.id,
            model_id: this.templateId,
            point_code: point.pointCode,
            point_name: point.pointName,
            is_active: status,
            description: point.description || '',
            address: point.address,
            is_control: point.isControl || 0,
            function_code: point.functionCode,
            data_type: point.dataType,
            scale_factor: point.scaleFactor || 1.0,
            offset: point.offset || 0.0,
            engineering_unit: point.engineeringUnit || '',
            precision: point.precision || 0,
            byte_order: point.byteOrder,
            min_value: point.minValue || 0,
            max_value: point.maxValue || 0,
            is_warn_point: point.isWarnPoint || 0,
            warning_low: point.warningLow || null,
            warning_high: point.warningHigh || null,
            is_virtual: point.isVirtual || 0,
            source_point_codes: point.sourcePointCodes || '',
            calculation_expression: point.calculationExpression || '',
            updated_time: null,
          })),
        }

        const response = await axios.put('/api/device/model_detail_modbus', updateData)

        if (response.data && response.data.code === 200) {
          this.selectedPoints = []
          this.selectAll = false
          this.$message.success(`已${action} ${updateCount} 个点位`)
          await this.loadPoints()
        } else {
          throw new Error(response.data?.message || `批量${action}失败`)
        }
      } catch (err) {
        console.error('批量更新失败:', err)
        this.$message.error(`批量${action}失败: ` + (err.message || '未知错误'))
      }
    },

    async batchUpdateControlStatus(controlStatus) {
      if (this.selectedPoints.length === 0) return

      const updateCount = this.selectedPoints.length
      const action = controlStatus === 1 ? '设为可控' : '设为不可控'

      if (!confirm(`确定要将选中的 ${updateCount} 个点位${action}吗？`)) {
        return
      }

      try {
        const selectedPointsData = this.allPoints.filter((point) =>
          this.selectedPoints.includes(point.id),
        )

        const updateData = {
          points: selectedPointsData.map((point) => ({
            id: point.id,
            model_id: this.templateId,
            point_code: point.pointCode,
            point_name: point.pointName,
            is_active: point.isActive,
            description: point.description || '',
            address: point.address,
            is_control: controlStatus, // 只更新可控状态
            function_code: point.functionCode,
            data_type: point.dataType,
            scale_factor: point.scaleFactor || 1.0,
            offset: point.offset || 0.0,
            engineering_unit: point.engineeringUnit || '',
            precision: point.precision || 0,
            byte_order: point.byteOrder,
            min_value: point.minValue || 0,
            max_value: point.maxValue || 0,
            is_warn_point: point.isWarnPoint || 0,
            warning_low: point.warningLow || null,
            warning_high: point.warningHigh || null,
            is_virtual: point.isVirtual || 0,
            source_point_codes: point.sourcePointCodes || '',
            calculation_expression: point.calculationExpression || '',
            updated_time: null,
          })),
        }

        const response = await axios.put('/api/device/model_detail_modbus', updateData)

        if (response.data && response.data.code === 200) {
          this.selectedPoints = []
          this.selectAll = false
          this.$message.success(`已${action} ${updateCount} 个点位`)
          await this.loadPoints()
        } else {
          throw new Error(response.data?.message || `批量${action}失败`)
        }
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
      if (this.selectedPoints.length === 0) return

      if (!confirm(`确定要删除选中的 ${this.selectedPoints.length} 个点位吗？`)) {
        return
      }

      try {
        const requestData = {
          ids: this.selectedPoints,
        }

        const response = await axios.delete('/api/device/model_detail_modbus', {
          data: requestData,
        })

        if (response.data && response.data.code === 200) {
          await this.loadPoints()
          this.selectedPoints = []
          this.selectAll = false
          this.$message.success(`已删除 ${this.selectedPoints.length} 个点位`)
        } else {
          throw new Error(response.data?.message || '批量删除失败')
        }
      } catch (err) {
        console.error('批量删除失败:', err)
        this.$message.error('批量删除失败: ' + (err.message || '未知错误'))
      }
    },

    async deletePoint(point) {
      if (!confirm(`确定要删除点位 "${point.pointName}" (${point.pointCode}) 吗？`)) {
        return
      }

      try {
        const requestData = {
          ids: [point.id],
        }

        const response = await axios.delete('/api/device/model_detail_modbus', {
          data: requestData,
        })

        if (response.data && response.data.code === 200) {
          await this.loadPoints()
          this.$message.success('点位删除成功')
        } else {
          throw new Error(response.data?.message || '删除失败')
        }
      } catch (err) {
        console.error('删除点位失败:', err)
        this.$message.error('删除失败: ' + (err.message || '未知错误'))
      }
    },

    // 导入点表
    async importPoints() {
      try {
        // 创建文件输入元素
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv,text/csv' // 只接受CSV文件

        // 处理文件选择
        input.onchange = async (event) => {
          const file = event.target.files[0]
          if (!file) {
            this.$message.warning('未选择文件')
            return
          }

          // 验证文件类型
          if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
            this.$message.error('请选择CSV文件')
            return
          }

          // 验证文件大小（可选，比如限制10MB）
          const maxSize = 10 * 1024 * 1024 // 10MB
          if (file.size > maxSize) {
            this.$message.error('文件太大，请选择小于10MB的文件')
            return
          }

          // 使用原生加载提示
          let loadingMessage = null

          try {
            // 第一步：上传文件到服务器
            loadingMessage = this.$message.info('正在上传文件...')

            // 读取文件内容
            const fileContent = await this.readFileContent(file)

            // 准备上传参数
            const filepath = '/home/ems/modbus_point_csv/' // 固定路径
            const filename = file.name
            const uploadUrl = `/api/file/upload?filepath=${encodeURIComponent(filepath)}&filename=${encodeURIComponent(filename)}`

            console.log('上传文件到:', uploadUrl)

            // 上传文件
            const uploadResponse = await axios.post(uploadUrl, fileContent, {
              headers: {
                'Content-Type': 'application/octet-stream',
              },
            })

            console.log('文件上传响应:', uploadResponse.data)

            if (uploadResponse.data && uploadResponse.data.code === 200) {
              // 关闭上传提示
              if (loadingMessage && loadingMessage.close) {
                loadingMessage.close()
              }

              this.$message.success('文件上传成功')

              // 第二步：导入数据到数据库
              loadingMessage = this.$message.info('正在导入数据到数据库...')

              const importUrl = `/api/device/modelConfig/import?filename=${encodeURIComponent(filename)}`

              console.log('导入数据URL:', importUrl)

              const importResponse = await axios.post(importUrl, {
                model_id: Number(this.templateId), // 可能需要传递模板ID
              })

              console.log('数据导入响应:', importResponse.data)

              if (importResponse.data && importResponse.data.code === 200) {
                // 关闭导入提示
                if (loadingMessage && loadingMessage.close) {
                  loadingMessage.close()
                }

                this.$message.success('点表导入成功！')

                // 重新加载点位数据
                await this.loadPoints()

                this.$message.success('点位数据已更新')
              } else {
                throw new Error(importResponse.data?.message || '数据导入失败')
              }
            } else {
              throw new Error(uploadResponse.data?.message || '文件上传失败')
            }
          } catch (err) {
            console.error('导入点表失败:', err)

            // 关闭加载提示
            if (loadingMessage && loadingMessage.close) {
              loadingMessage.close()
            }

            this.$message.error('导入失败: ' + (err.message || '未知错误'))
          }
        }

        // 触发文件选择
        input.click()
      } catch (err) {
        console.error('导入点表初始化失败:', err)
        this.$message.error('导入失败: ' + (err.message || '未知错误'))
      }
    },

    readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
          // 使用 ArrayBuffer 并转换为适当的格式
          const arrayBuffer = event.target.result

          // 方法1：使用 TextDecoder 指定UTF-8编码
          try {
            const decoder = new TextDecoder('utf-8')
            const text = decoder.decode(arrayBuffer)
            resolve(text)
          } catch (error) {
            // 方法2：如果UTF-8失败，尝试其他编码
            console.warn('UTF-8解码失败，尝试GBK编码...', error)

            // 如果你的文件可能是GBK编码，可以使用第三方库如iconv-lite
            // 这里先回退到使用 readAsText
            const fallbackReader = new FileReader()
            fallbackReader.onload = (e) => {
              resolve(e.target.result)
            }
            fallbackReader.onerror = (e) => {
              reject(new Error('读取文件失败'))
            }
            fallbackReader.readAsText(file, 'GBK')
          }
        }

        reader.onerror = (error) => {
          reject(new Error('读取文件失败: ' + error))
        }

        // 使用 ArrayBuffer 读取
        reader.readAsArrayBuffer(file)
      })
    },

    // 导出点表
    async exportPoints() {
      try {
        this.$message.info('正在生成CSV文件...')

        // 第一步：生成CSV文件
        const requestData = {
          model_id: Number(this.templateId),
        }

        console.log('请求生成CSV文件:', JSON.stringify(requestData, null, 2))

        const exportResponse = await axios.post('/api/device/modelConfig/export', requestData)

        console.log('生成CSV文件响应:', exportResponse.data)

        if (exportResponse.data && exportResponse.data.code === 200) {
          const fileData = exportResponse.data.data
          const fileName = fileData.file_name

          this.$message.success(`CSV文件生成成功，共${fileData.point_count}个点位`)

          // 第二步：下载文件
          console.log('开始下载文件:', fileName)

          // 创建下载链接
          const downloadUrl = `/api/file/download?filename=${encodeURIComponent(fileName)}&type=csv`

          // 创建隐藏的链接元素并触发点击下载
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = fileName // 设置下载的文件名
          link.style.display = 'none'

          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          this.$message.success('文件下载开始')
        } else {
          throw new Error(exportResponse.data?.message || '生成CSV文件失败')
        }
      } catch (err) {
        console.error('导出点表失败:', err)
        this.$message.error('导出失败: ' + (err.message || '未知错误'))
      }
    },

    // 新增点位组
    addPointGroup() {
      this.$message.info('新增点位组功能开发中...')
    },
  },
}
</script>

<style scoped>
.modbus-protocol-config {
  width: 100%;
}

/* Modbus点位配置区域 */
.modbus-points-config {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 搜索栏 */
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

/* 筛选栏 */
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

/* 操作栏 */
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

/* 点位列表样式 */
.points-container {
  padding: 0 20px;
}

.table-container {
  overflow-x: auto;
  width: 100%;
  position: relative;
}
/* 为固定列添加阴影效果，增强视觉层次 */
.points-table th:first-child::after,
.points-table td:first-child::after,
.points-table th.fixed-column-action::after,
.points-table td.fixed-column-action::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px;
  height: 100%;
  width: 2px;
  background-color: #e0e0e0;
  box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1);
}
.points-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1600px; /* 确保表格足够宽 */
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

.point-stats {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 13px;
  color: #95a5a6;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-value {
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

/* 状态标签 */
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

/* 可控字段样式 - 新增样式 */
.control-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  transition: all 0.3s;
}

.control-enabled {
  background-color: #d4edda; /* 绿色背景 */
  color: #155724; /* 深绿色文字 */
  border: 1px solid #c3e6cb;
}

.control-enabled:hover {
  background-color: #c3e6cb;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.control-disabled {
  background-color: #f8d7da; /* 红色背景 */
  color: #721c24; /* 深红色文字 */
  border: 1px solid #f5c6cb;
}

.control-disabled:hover {
  background-color: #f5c6cb;
  box-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);
}

/* 报警点样式 */
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

/* 虚拟点位样式 */
.virtual-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.virtual-yes {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.virtual-no {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

/* 分页控制样式 */
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

/* 分页样式 */
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

/* 批量操作 */
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

/* 加载状态 */
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

/* 对话框样式 */
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
  max-width: 800px;
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

/* 滚动条样式 */
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

/* 添加固定列的CSS样式 */
.points-table {
  position: relative;
  width: 100%;
  border-collapse: collapse;
  min-width: 1600px;
}

/* 操作列固定在右侧的样式 */
.fixed-column-action {
  position: sticky;
  right: 0; /* 固定在右侧 */
  background-color: #f8f9fa;
  z-index: 10;
  border-left: 2px solid #e0e0e0; /* 注意这里是左边框，因为固定在右侧 */
}

/* 复选框列固定在左侧的样式 */
.points-table th:first-child,
.points-table td:first-child {
  position: sticky;
  left: 0; /* 固定在左侧，不是right */
  background-color: #f8f9fa;
  z-index: 20;
  border-right: 1px solid #e0e0e0; /* 右边框 */
}

/* 操作列在表头中的样式 */
.points-table th.fixed-column-action {
  z-index: 15; /* 比第一列低，但比其他列高 */
}

/* 操作列在数据行中的样式 */
.points-table td.fixed-column-action {
  background-color: white;
  z-index: 5;
}

/* 鼠标悬停时保持背景色 */
.points-table tr:hover td.fixed-column-action {
  background-color: #f8f9fa;
}

/* 确保复选框列在鼠标悬停时也变色 */
.points-table tr:hover td:first-child {
  background-color: #f8f9fa;
}

/* 为固定列添加阴影效果（需要修正） */
.points-table th:first-child::after,
.points-table td:first-child::after {
  content: '';
  position: absolute;
  top: 0;
  right: -2px; /* 右边阴影 */
  height: 100%;
  width: 2px;
  background-color: #e0e0e0;
  box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1);
}

/* 操作列应该是左边阴影 */
.points-table th.fixed-column-action::before,
.points-table td.fixed-column-action::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px; /* 左边阴影 */
  height: 100%;
  width: 2px;
  background-color: #e0e0e0;
  box-shadow: -2px 0 3px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
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
}
</style>
