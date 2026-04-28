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
          <!-- 统一的数据类型选项 -->
          <option v-for="type in dataTypeOptions" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
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
          <button class="btn btn-outline" @click="toggleGrouping">
            <i :class="showGrouping ? 'fas fa-compress-alt' : 'fas fa-expand-alt'"></i>
            {{ showGrouping ? '取消分组' : '分组展示' }}
          </button>
          <button class="btn btn-primary" @click="showAddPointDialog">
            <i class="fas fa-plus"></i> 新增点位
          </button>
          <button class="btn btn-success" @click="showAddPointGroupDialog">
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
        <div class="table-container" :style="{ maxHeight: tableMaxHeight + 'px' }">
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
              <template v-for="point in groupedPoints">
                <!-- 分组折叠行 -->
                <tr
                  v-if="point._isGroupHeader"
                  :key="'group-' + point._groupId"
                  class="group-header-row"
                  @click="toggleGroup(point._groupId)"
                >
                  <td>
                    <i
                      :class="
                        isGroupExpanded(point._groupId)
                          ? 'fas fa-chevron-down'
                          : 'fas fa-chevron-right'
                      "
                      class="group-toggle-icon"
                    ></i>
                  </td>
                  <td colspan="3">
                    <span class="group-badge">
                      <i class="fas fa-layer-group"></i>
                      组 {{ point._groupId.replace('group-', '') }}
                    </span>
                    <span class="group-info">
                      功能码 {{ point._groupInfo.functionCode }} |
                      {{ point._groupInfo.count }}个点位 | 地址
                      {{ point._groupInfo.startAddress }} ~ {{ point._groupInfo.endAddress }} |
                      寄存器数量={{ point._groupInfo.quantity }}
                    </span>
                  </td>
                  <td>{{ point.address }}</td>
                  <td colspan="19">
                    <span v-if="!isGroupExpanded(point._groupId)" class="collapsed-hint">
                      <i class="fas fa-plus"></i> 展开 {{ point._groupInfo.count }} 个点位
                    </span>
                  </td>
                </tr>
                <!-- 普通点位行 -->
                <tr
                  v-else
                  :key="point.id"
                  :class="{ 'group-child-row': point._groupId && !point._isGroupHeader }"
                >
                  <td>
                    <input type="checkbox" v-model="selectedPoints" :value="point.id" />
                  </td>

                  <!-- 点位代码：文本输入 -->
                  <td @click="startInlineEdit(point, 'pointCode')">
                    <input
                      v-if="isEditing(point, 'pointCode')"
                      v-model="inlineEditValue"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'pointCode')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.pointCode }}</div>
                  </td>

                  <!-- 点位名称：文本输入 -->
                  <td @click="startInlineEdit(point, 'pointName')">
                    <input
                      v-if="isEditing(point, 'pointName')"
                      v-model="inlineEditValue"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'pointName')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="point-name cell-editable">{{ point.pointName }}</div>
                  </td>

                  <!-- 状态：点击切换 -->
                  <td @click="toggleField(point, 'isActive')">
                    <span
                      class="status-badge toggle-badge"
                      :class="point.isActive === 1 ? 'status-active' : 'status-inactive'"
                    >
                      {{ point.isActive === 1 ? '启用' : '停用' }}
                    </span>
                  </td>

                  <!-- 地址：数字输入 -->
                  <td @click="startInlineEdit(point, 'address')">
                    <input
                      v-if="isEditing(point, 'address')"
                      v-model.number="inlineEditValue"
                      type="number"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'address')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.address }}</div>
                  </td>

                  <!-- 可控：点击切换 -->
                  <td @click="toggleField(point, 'isControl')">
                    <span
                      class="control-badge toggle-badge"
                      :class="point.isControl === 1 ? 'control-enabled' : 'control-disabled'"
                    >
                      {{ point.isControl === 1 ? '可控' : '不可控' }}
                    </span>
                  </td>

                  <!-- 功能码：下拉选择 -->
                  <td @click="startInlineEdit(point, 'functionCode')">
                    <select
                      v-if="isEditing(point, 'functionCode')"
                      v-model.number="inlineEditValue"
                      class="inline-edit-select"
                      @change="saveInlineEdit(point, 'functionCode')"
                      @blur="cancelInlineEdit"
                      ref="inlineInput"
                    >
                      <option :value="1">01 - 遥信</option>
                      <option :value="2">02 - 遥信</option>
                      <option :value="3">03 - 遥测</option>
                      <option :value="4">04 - 遥测</option>
                      <option :value="5">05 - 遥控</option>
                      <option :value="6">06 - 遥调</option>
                      <option :value="15">15 - 遥控</option>
                      <option :value="16">16 - 遥调</option>
                    </select>
                    <div v-else class="cell-editable">{{ point.functionCode }}</div>
                  </td>

                  <!-- 数据类型：下拉选择 -->
                  <td @click="startInlineEdit(point, 'dataType')">
                    <select
                      v-if="isEditing(point, 'dataType')"
                      v-model="inlineEditValue"
                      class="inline-edit-select"
                      @change="saveInlineEdit(point, 'dataType')"
                      @blur="cancelInlineEdit"
                      ref="inlineInput"
                    >
                      <option v-for="type in dataTypeOptions" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                    <div v-else class="cell-editable">{{ formatDataType(point.dataType) }}</div>
                  </td>

                  <!-- 缩放因子：数字输入 -->
                  <td @click="startInlineEdit(point, 'scaleFactor')">
                    <input
                      v-if="isEditing(point, 'scaleFactor')"
                      v-model.number="inlineEditValue"
                      type="number"
                      step="0.01"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'scaleFactor')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.scaleFactor }}</div>
                  </td>

                  <!-- 偏移量：数字输入 -->
                  <td @click="startInlineEdit(point, 'offset')">
                    <input
                      v-if="isEditing(point, 'offset')"
                      v-model.number="inlineEditValue"
                      type="number"
                      step="0.01"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'offset')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.offset }}</div>
                  </td>

                  <!-- 工程单位：文本输入 -->
                  <td @click="startInlineEdit(point, 'engineeringUnit')">
                    <input
                      v-if="isEditing(point, 'engineeringUnit')"
                      v-model="inlineEditValue"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'engineeringUnit')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.engineeringUnit || '--' }}</div>
                  </td>

                  <!-- 精度：上下按钮整数切换 -->
                  <td>
                    <div class="precision-stepper">
                      <button
                        class="stepper-btn"
                        @click="stepPrecision(point, -1)"
                        :disabled="point.precision <= 0"
                      >
                        −
                      </button>
                      <span class="stepper-value">{{ point.precision }}</span>
                      <button class="stepper-btn" @click="stepPrecision(point, 1)">+</button>
                    </div>
                  </td>

                  <!-- 字节序：下拉选择 -->
                  <td @click="startInlineEdit(point, 'byteOrder')">
                    <select
                      v-if="isEditing(point, 'byteOrder')"
                      v-model="inlineEditValue"
                      class="inline-edit-select"
                      @change="saveInlineEdit(point, 'byteOrder')"
                      @blur="cancelInlineEdit"
                      ref="inlineInput"
                    >
                      <option value="big_endian">大端模式</option>
                      <option value="little_endian">小端模式</option>
                    </select>
                    <div v-else class="cell-editable">{{ formatByteOrder(point.byteOrder) }}</div>
                  </td>

                  <!-- 最小值：数字输入 -->
                  <td @click="startInlineEdit(point, 'minValue')">
                    <input
                      v-if="isEditing(point, 'minValue')"
                      v-model.number="inlineEditValue"
                      type="number"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'minValue')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.minValue }}</div>
                  </td>

                  <!-- 最大值：数字输入 -->
                  <td @click="startInlineEdit(point, 'maxValue')">
                    <input
                      v-if="isEditing(point, 'maxValue')"
                      v-model.number="inlineEditValue"
                      type="number"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'maxValue')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.maxValue }}</div>
                  </td>

                  <!-- 报警点：点击切换 -->
                  <td @click="toggleField(point, 'isWarnPoint')">
                    <span
                      class="warn-badge toggle-badge"
                      :class="point.isWarnPoint === 1 ? 'warn-yes' : 'warn-no'"
                    >
                      {{ point.isWarnPoint === 1 ? '是' : '否' }}
                    </span>
                  </td>

                  <!-- 报警下限：数字输入 -->
                  <td @click="startInlineEdit(point, 'warningLow')">
                    <input
                      v-if="isEditing(point, 'warningLow')"
                      v-model.number="inlineEditValue"
                      type="number"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'warningLow')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.warningLow }}</div>
                  </td>

                  <!-- 报警上限：数字输入 -->
                  <td @click="startInlineEdit(point, 'warningHigh')">
                    <input
                      v-if="isEditing(point, 'warningHigh')"
                      v-model.number="inlineEditValue"
                      type="number"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'warningHigh')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.warningHigh }}</div>
                  </td>

                  <!-- 虚拟点位：点击切换 -->
                  <td @click="toggleField(point, 'isVirtual')">
                    <span
                      class="virtual-badge toggle-badge"
                      :class="point.isVirtual === 1 ? 'virtual-yes' : 'virtual-no'"
                    >
                      {{ point.isVirtual === 1 ? '是' : '否' }}
                    </span>
                  </td>

                  <!-- 源点值：文本输入 -->
                  <td class="point-source" @click="startInlineEdit(point, 'sourcePointCodes')">
                    <input
                      v-if="isEditing(point, 'sourcePointCodes')"
                      v-model="inlineEditValue"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'sourcePointCodes')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">{{ point.sourcePointCodes || '--' }}</div>
                  </td>

                  <!-- 计算表达式：文本输入 -->
                  <td
                    class="point-expression"
                    @click="startInlineEdit(point, 'calculationExpression')"
                  >
                    <input
                      v-if="isEditing(point, 'calculationExpression')"
                      v-model="inlineEditValue"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'calculationExpression')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable">
                      {{ point.calculationExpression || '--' }}
                    </div>
                  </td>

                  <!-- 描述：文本输入 -->
                  <td @click="startInlineEdit(point, 'description')">
                    <input
                      v-if="isEditing(point, 'description')"
                      v-model="inlineEditValue"
                      class="inline-edit-input"
                      @blur="saveInlineEdit(point, 'description')"
                      @keyup.enter="$event.target.blur()"
                      @keyup.escape="cancelInlineEdit"
                      ref="inlineInput"
                    />
                    <div v-else class="cell-editable point-desc" :title="point.description">
                      {{ point.description || '--' }}
                    </div>
                  </td>

                  <td>{{ formatDateTime(point.updatedTime) }}</td>
                  <td class="fixed-column-action">
                    <!-- 添加固定列类 -->
                    <div class="table-actions">
                      <a class="action-link" @click="editPoint(point)">编辑</a>
                      <a class="action-link delete" @click="deletePoint(point)">删除</a>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- 分页控制（固定底部） -->
        <div v-if="points.length > 0" class="pagination-controls pagination-fixed">
          <div class="page-info">
            <span>第</span>
            <input
              type="number"
              v-model.number="currentPage"
              class="page-input"
              @change="changePage"
              @keyup.enter="changePage"
              :min="1"
              :max="totalPages"
              style="width: 50px; text-align: center"
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

    <!-- 新增点位组对话框 -->
    <div v-if="showGroupDialog" class="dialog-overlay" @click.self="handleOverlayClick">
      <div class="dialog-content dialog-large">
        <div class="dialog-header">
          <h3>新增点位组</h3>
          <button class="dialog-close" @click="closeGroupDialog">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <form @submit.prevent="generatePreview">
            <!-- 点位组配置 -->
            <div class="form-section">
              <h4 class="form-section-title">点位组配置</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="required">组员数量</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.memberCount"
                    class="form-control"
                    min="1"
                    max="100"
                    required
                    placeholder="例如: 5"
                    @change="updateAddressInterval"
                  />
                </div>
                <div class="form-group">
                  <label class="required">基础点位代码</label>
                  <input
                    type="text"
                    v-model="pointGroupForm.basePointCode"
                    class="form-control"
                    required
                    placeholder="例如: TEMP"
                  />
                </div>
                <div class="form-group">
                  <label class="required">基础点位名称</label>
                  <input
                    type="text"
                    v-model="pointGroupForm.basePointName"
                    class="form-control"
                    required
                    placeholder="例如: 温度"
                  />
                </div>
                <div class="form-group">
                  <label class="required">起始地址</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.startAddress"
                    class="form-control"
                    min="1"
                    max="65535"
                    required
                    placeholder="例如: 10000"
                  />
                </div>
                <div class="form-group">
                  <label class="required">状态</label>
                  <select v-model="pointGroupForm.status" class="form-control" required>
                    <option :value="1">启用</option>
                    <option :value="0">停用</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="required">可控</label>
                  <select v-model="pointGroupForm.isControl" class="form-control" required>
                    <option :value="1">可控</option>
                    <option :value="0">不可控</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Modbus配置 -->
            <div class="form-section">
              <h4 class="form-section-title">Modbus配置</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="required">功能码</label>
                  <select
                    v-model="pointGroupForm.functionCode"
                    class="form-control"
                    required
                    @change="onFunctionCodeChange"
                  >
                    <option value="1">01 - 读线圈</option>
                    <option value="2">02 - 读离散输入</option>
                    <option value="3">03 - 读保持寄存器</option>
                    <option value="4" selected>04 - 读输入寄存器</option>
                    <option value="5">05 - 写单个线圈</option>
                    <option value="6">06 - 写单个寄存器</option>
                    <option value="15">15 - 写多个线圈</option>
                    <option value="16">16 - 写多个寄存器</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="required">数据类型</label>
                  <select
                    v-model="pointGroupForm.dataType"
                    class="form-control"
                    required
                    @change="onDataTypeChange"
                  >
                    <option v-for="type in dataTypeOptions" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                  <small class="hint-text" v-if="pointGroupForm.dataType.startsWith('bit')">
                    {{ getBitTypeHint() }}
                  </small>
                </div>
                <div class="form-group">
                  <label>地址间隔</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.addressInterval"
                    class="form-control"
                    min="0"
                    max="10"
                    placeholder="自动计算"
                    :disabled="pointGroupForm.dataType.startsWith('bit')"
                  />
                  <small v-if="pointGroupForm.dataType.startsWith('bit')" class="hint-text">
                    BIT类型地址间隔为0
                  </small>
                </div>
                <div class="form-group">
                  <label>缩放因子</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.scaleFactor"
                    class="form-control"
                    step="0.001"
                    placeholder="1.0"
                  />
                </div>
                <div class="form-group">
                  <label>偏移量</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.offset"
                    class="form-control"
                    step="0.001"
                    placeholder="0.0"
                  />
                </div>
                <div class="form-group">
                  <label>字节序</label>
                  <select v-model="pointGroupForm.byteOrder" class="form-control">
                    <option value="big_endian">大端模式</option>
                    <option value="little_endian">小端模式</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>工程单位</label>
                  <input
                    type="text"
                    v-model="pointGroupForm.engineeringUnit"
                    class="form-control"
                    placeholder="例如: °C"
                  />
                </div>
                <div class="form-group">
                  <label>精度</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.precision"
                    class="form-control"
                    min="0"
                    max="6"
                    placeholder="2"
                  />
                </div>
                <div class="form-group">
                  <label>最小值</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.minValue"
                    class="form-control"
                    step="0.001"
                    placeholder="最小值"
                  />
                </div>
                <div class="form-group">
                  <label>最大值</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.maxValue"
                    class="form-control"
                    step="0.001"
                    placeholder="最大值"
                  />
                </div>
                <div class="form-group">
                  <label>报警点</label>
                  <select v-model="pointGroupForm.isWarnPoint" class="form-control">
                    <option :value="0">否</option>
                    <option :value="1">是</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>报警下限</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.warningLow"
                    class="form-control"
                    step="0.001"
                    placeholder="报警下限"
                  />
                </div>
                <div class="form-group">
                  <label>报警上限</label>
                  <input
                    type="number"
                    v-model.number="pointGroupForm.warningHigh"
                    class="form-control"
                    step="0.001"
                    placeholder="报警上限"
                  />
                </div>
              </div>
            </div>

            <!-- 预览区域 -->
            <div v-if="previewPoints.length > 0" class="form-section preview-section">
              <h4 class="form-section-title">点位预览 (共 {{ previewPoints.length }} 个点位)</h4>
              <div class="preview-container">
                <div class="preview-table-container">
                  <table class="preview-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>点位代码</th>
                        <th>点位名称</th>
                        <th>地址</th>
                        <th>数据类型</th>
                        <th>状态</th>
                        <th>可控</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(point, index) in previewPoints.slice(0, maxPreviewRows)"
                        :key="index"
                      >
                        <td>{{ index + 1 }}</td>
                        <td>{{ point.point_code }}</td>
                        <td>{{ point.point_name }}</td>
                        <td>{{ point.address }}</td>
                        <td>{{ formatDataType(point.data_type) }}</td>
                        <td>{{ point.is_active === 1 ? '启用' : '停用' }}</td>
                        <td>{{ point.is_control === 1 ? '可控' : '不可控' }}</td>
                      </tr>
                      <tr v-if="previewPoints.length > maxPreviewRows">
                        <td colspan="7" class="preview-more">
                          已显示 {{ maxPreviewRows }} 个点位，还有
                          {{ previewPoints.length - maxPreviewRows }} 个点位未显示
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="previewPoints.length > 0" class="preview-summary">
                  <div class="summary-item">
                    <span class="label">起始地址:</span>
                    <span class="value">{{ previewPoints[0].address }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">结束地址:</span>
                    <span class="value">{{ previewPoints[previewPoints.length - 1].address }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">地址间隔:</span>
                    <span class="value">{{ pointGroupForm.addressInterval }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">数据类型范围:</span>
                    <span class="value">{{ getDataTypeRange() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn btn-outline" @click="closeGroupDialog">取消</button>
          <button type="button" class="btn btn-primary" @click="generatePreview">
            预览生成点位
          </button>
          <button
            type="button"
            class="btn btn-success"
            @click="savePointGroup"
            :disabled="previewPoints.length === 0"
          >
            确认生成点位
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { protocolMixin, dataTypeOptions, formatDataType } from './protocolMixin.js'

export default {
  name: 'ModbusProtocol',
  mixins: [protocolMixin],
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
      tableMaxHeight: 500,

      filters: {
        status: '',
        functionCode: '',
        dataType: '',
        isControl: '',
        isWarnPoint: '',
        isVirtual: '',
      },

      // 分页（从 mixin 继承）
      // currentPage, pageSize, totalItems, totalPages

      // 行内编辑
      inlineEditId: null,
      inlineEditField: null,
      inlineEditValue: '',

      // 点位对话框
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

      // 点位组对话框
      showGroupDialog: false,
      previewPoints: [],
      maxPreviewRows: 10,
      preventClose: false,
      pointGroupForm: {
        // 点位组配置
        memberCount: 5,
        basePointCode: '',
        basePointName: '',
        startAddress: 0,
        status: 1,
        isControl: 0,

        // Modbus配置
        functionCode: '4',
        dataType: 'uint16',
        addressInterval: 1, // 默认根据数据类型自动计算
        scaleFactor: 1.0,
        offset: 0.0,
        byteOrder: 'big_endian',
        engineeringUnit: '',
        precision: 2,
        minValue: null,
        maxValue: null,
        isWarnPoint: 0,
        warningLow: null,
        warningHigh: null,
      },

      // 分组折叠状态（默认全部折叠）
      collapsedGroups: {},
      showGrouping: true,
    }
  },
  computed: {
    dataTypeOptions() {
      return dataTypeOptions
    },

    // 获取数据类型族（用于分组判断）
    getDataTypeFamily() {
      return (dataType, functionCode) => {
        // boolean 类型（功能码 01/02）
        if (functionCode === 1 || functionCode === 2) {
          if (dataType === 'boolean') return 'boolean'
        }
        // bit 类型（功能码 03/04）
        if (functionCode === 3 || functionCode === 4) {
          if (dataType === 'bit' || dataType.startsWith('bit')) return 'bit'
        }
        // 普通类型
        return 'normal'
      }
    },

    // 获取点位长度（与后端 get_data_type_length 一致）
    getPointLength() {
      return (dataType, functionCode) => {
        // boolean 类型（功能码 01/02）：长度始终为 1
        if ((functionCode === 1 || functionCode === 2) && dataType === 'boolean') {
          return 1
        }
        // bit 类型（功能码 03/04）：长度视为 0（共享寄存器）
        if (
          (functionCode === 3 || functionCode === 4) &&
          (dataType === 'bit' || dataType.startsWith('bit'))
        ) {
          return 0
        }
        // 普通寄存器类型
        const intervalMap = {
          int16: 1,
          uint16: 1,
          int32: 2,
          uint32: 2,
          float: 2,
          double: 4,
        }
        return intervalMap[dataType] || 1
      }
    },

    // 判断是否可以为 boolean 类型（功能码 01/02）
    isBoolean01_02() {
      return (functionCode, dataType) => {
        return (functionCode === 1 || functionCode === 2) && dataType === 'boolean'
      }
    },

    // 判断是否为 bit 类型（功能码 03/04）
    isBitDataType() {
      return (functionCode, dataType) => {
        return (
          (functionCode === 3 || functionCode === 4) &&
          (dataType === 'bit' || dataType.startsWith('bit'))
        )
      }
    },

    // 分组后的点位列表（与后端 create_register_groups 逻辑一致）
    groupedPoints() {
      if (!this.showGrouping || !this.allPoints || this.allPoints.length === 0) {
        return this.allPoints.map((point, index) => ({
          ...point,
          _groupId: `single-${index}`,
          _isGroupHeader: false,
          _groupPoints: [point],
        }))
      }

      // 按地址升序排列
      const sortedPoints = [...this.allPoints].sort((a, b) => a.address - b.address)

      const groups = []
      let currentGroup = null

      // 批量上限（与后端一致）
      const limits = {
        boolean: 100, // 线圈最多 100 个
        bit: 100, // bit 类型最多 100 个
        normal: 60, // 普通寄存器最多 60 个
      }

      sortedPoints.forEach((point) => {
        const fc = point.functionCode
        const dt = point.dataType
        const isBoolean = this.isBoolean01_02(fc, dt)
        const isBit = this.isBitDataType(fc, dt)
        const dtFamily = isBoolean ? 'boolean' : isBit ? 'bit' : 'normal'
        const pointLength = this.getPointLength(dt, fc)

        // 检查是否可以加入现有组
        let canJoin = false
        if (currentGroup) {
          // 功能码相同
          const sameFunctionCode = currentGroup.functionCode === fc
          // 数据类型族相同
          const sameDataTypeFamily = currentGroup.dataTypeFamily === dtFamily

          let isContinuous = false
          let withinLimit = false

          if (isBoolean) {
            // boolean 类型：地址连续即可
            isContinuous = point.address === currentGroup.startAddress + currentGroup.quantity
            withinLimit = currentGroup.quantity < limits.boolean
          } else if (isBit) {
            // bit 类型：允许多个 bit 共享同一个寄存器
            // 新 bit 地址 <= start + quantity（表示在当前寄存器范围内）
            isContinuous = point.address <= currentGroup.startAddress + currentGroup.quantity
            // bit 类型 quantity 表示占用的寄存器数量
            withinLimit = currentGroup.quantity < limits.bit
          } else {
            // 普通寄存器类型：地址连续
            isContinuous = point.address === currentGroup.startAddress + currentGroup.quantity
            withinLimit = currentGroup.quantity < limits.normal
          }

          canJoin = sameFunctionCode && sameDataTypeFamily && isContinuous && withinLimit
        }

        if (!currentGroup || !canJoin) {
          // 创建新组
          if (currentGroup) {
            groups.push(currentGroup)
          }

          let initialQuantity
          if (isBoolean) {
            // boolean 类型（功能码 01/02）：quantity 表示线圈数量
            initialQuantity = pointLength // 通常是 1
          } else if (isBit) {
            // bit 类型（功能码 03/04）：即使只有一个 bit，也占用整个寄存器
            initialQuantity = 1
          } else {
            // 其他类型：根据数据类型长度
            initialQuantity = pointLength
          }

          currentGroup = {
            groupId: `group-${groups.length}`,
            functionCode: fc,
            dataTypeFamily: dtFamily,
            startAddress: point.address,
            quantity: initialQuantity,
            points: [point],
          }
        } else {
          // 加入现有组
          if (isBoolean) {
            // boolean 类型：增加线圈数量
            currentGroup.quantity += pointLength
          } else if (isBit) {
            // bit 类型：检查是否需要扩展 quantity
            if (point.address >= currentGroup.startAddress + currentGroup.quantity) {
              // 需要扩展到下一个寄存器
              currentGroup.quantity = point.address - currentGroup.startAddress + 1
            }
          } else {
            // 普通寄存器类型：增加寄存器数量
            currentGroup.quantity += pointLength
          }
          currentGroup.points.push(point)
        }
      })

      // 添加最后一组
      if (currentGroup) {
        groups.push(currentGroup)
      }

      // 转换为展示格式
      const result = []
      groups.forEach((group) => {
        if (group.points.length === 1) {
          // 单点位不需要折叠
          result.push({
            ...group.points[0],
            _groupId: group.groupId,
            _isGroupHeader: false,
            _groupPoints: group.points,
            _groupInfo: null,
          })
        } else {
          // 多点位需要折叠
          result.push({
            ...group.points[0],
            _groupId: group.groupId,
            _isGroupHeader: true,
            _groupPoints: group.points,
            _groupInfo: {
              functionCode: group.functionCode,
              dataTypeFamily: group.dataTypeFamily,
              startAddress: group.startAddress,
              quantity: group.quantity,
              endAddress: group.points[group.points.length - 1].address,
              count: group.points.length,
            },
          })
          // 添加折叠的行（仅在展开状态时显示）
          if (this.isGroupExpanded(group.groupId)) {
            group.points.slice(1).forEach((p) => {
              result.push({
                ...p,
                _groupId: group.groupId,
                _isGroupHeader: false,
                _groupPoints: group.points,
                _groupInfo: null,
              })
            })
          }
        }
      })

      return result
    },

    // 数据类型与地址间隔的映射关系
    dataTypeIntervalMap() {
      return {
        // BOOL类型：地址间隔为1（假设BOOL占用1个寄存器）
        boolean: 1,

        // BIT类型：地址间隔为0（同一个寄存器内）
        bit: 0,
        bit0: 0,
        bit1: 0,
        bit2: 0,
        bit3: 0,
        bit4: 0,
        bit5: 0,
        bit6: 0,
        bit7: 0,
        bit8: 0,
        bit9: 0,
        bit10: 0,
        bit11: 0,
        bit12: 0,
        bit13: 0,
        bit14: 0,
        bit15: 0,

        // 16位整数：地址间隔为1
        int16: 1,
        uint16: 1,

        // 32位整数：地址间隔为2
        int32: 2,
        uint32: 2,

        // 浮点数：地址间隔为2
        float: 2,

        // 双精度浮点数：地址间隔为4
        double: 4,
      }
    },

    // 功能码与数据类型约束
    functionCodeDataTypeConstraint() {
      return {
        1: [
          'boolean',
          'bit',
          'bit0',
          'bit1',
          'bit2',
          'bit3',
          'bit4',
          'bit5',
          'bit6',
          'bit7',
          'bit8',
          'bit9',
          'bit10',
          'bit11',
          'bit12',
          'bit13',
          'bit14',
          'bit15',
        ],
        2: [
          'boolean',
          'bit',
          'bit0',
          'bit1',
          'bit2',
          'bit3',
          'bit4',
          'bit5',
          'bit6',
          'bit7',
          'bit8',
          'bit9',
          'bit10',
          'bit11',
          'bit12',
          'bit13',
          'bit14',
          'bit15',
        ],
        5: [
          'boolean',
          'bit',
          'bit0',
          'bit1',
          'bit2',
          'bit3',
          'bit4',
          'bit5',
          'bit6',
          'bit7',
          'bit8',
          'bit9',
          'bit10',
          'bit11',
          'bit12',
          'bit13',
          'bit14',
          'bit15',
        ],
        15: [
          'boolean',
          'bit',
          'bit0',
          'bit1',
          'bit2',
          'bit3',
          'bit4',
          'bit5',
          'bit6',
          'bit7',
          'bit8',
          'bit9',
          'bit10',
          'bit11',
          'bit12',
          'bit13',
          'bit14',
          'bit15',
        ],

        3: [
          'int16',
          'uint16',
          'int32',
          'uint32',
          'float',
          'double',
          'boolean',
          'bit',
          'bit0',
          'bit1',
          'bit2',
          'bit3',
          'bit4',
          'bit5',
          'bit6',
          'bit7',
          'bit8',
          'bit9',
          'bit10',
          'bit11',
          'bit12',
          'bit13',
          'bit14',
          'bit15',
        ],
        4: ['int16', 'uint16', 'int32', 'uint32', 'float', 'double'],
        6: ['int16', 'uint16', 'int32', 'uint32', 'float', 'double'],
        16: ['int16', 'uint16', 'int32', 'uint32', 'float', 'double'],
      }
    },
  },

  watch: {
    filters: {
      handler() {
        this.applyFilters()
      },
      deep: true,
    },
  },
  created() {
    this.pointForm.modelId = Number(this.templateId)
    this.loadPoints()
    this.calcTableHeight()
    window.addEventListener('resize', this.calcTableHeight)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.calcTableHeight)
  },

  methods: {
    formatDataType,

    // 切换分组展开/折叠状态
    toggleGroup(groupId) {
      this.collapsedGroups = {
        ...this.collapsedGroups,
        [groupId]: !this.collapsedGroups[groupId],
      }
    },

    // 判断分组是否展开（默认折叠，未在 collapsedGroups 中或值为 false 表示折叠）
    isGroupExpanded(groupId) {
      return this.collapsedGroups[groupId] === true
    },

    // 切换分组展示功能
    toggleGrouping() {
      this.showGrouping = !this.showGrouping
      // 重置折叠状态
      this.collapsedGroups = {}
    },

    calcTableHeight() {
      this.tableMaxHeight = Math.max(300, window.innerHeight - 380)
    },

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
          // 统一处理400错误
          const errorMessage = this.extractApiErrorMessage(response.data, this.editingPoint)
          this.$message.error(errorMessage)
        }
      } catch (err) {
        console.error('保存点位失败:', err)

        // 统一处理异常
        const errorMessage = this.extractHttpErrorMessage(err, this.editingPoint)
        this.$message.error(errorMessage)
      }
    },

    // 新增点位组相关方法
    showAddPointGroupDialog() {
      this.showGroupDialog = true
      this.previewPoints = []
      this.preventClose = false
      this.resetPointGroupForm()
    },

    closeGroupDialog() {
      this.showGroupDialog = false
      this.previewPoints = []
      this.preventClose = false
      this.resetPointGroupForm()
    },

    // 处理点击模态框外部
    handleOverlayClick(e) {
      if (e.target === e.currentTarget && !this.preventClose) {
        this.closeGroupDialog()
      }
    },

    resetPointGroupForm() {
      this.pointGroupForm = {
        memberCount: 16,
        basePointCode: '',
        basePointName: '',
        startAddress: 0,
        status: 1,
        isControl: 0,
        functionCode: '4',
        dataType: 'uint16',
        addressInterval: 1,
        scaleFactor: 1.0,
        offset: 0.0,
        byteOrder: 'big_endian',
        engineeringUnit: '',
        precision: 2,
        minValue: null,
        maxValue: null,
        isWarnPoint: 0,
        warningLow: null,
        warningHigh: null,
      }
    },

    // 获取BIT类型提示
    getBitTypeHint() {
      const dataType = this.pointGroupForm.dataType
      if (dataType === 'bit') {
        return '将生成BIT0, BIT1, BIT2... (从BIT0开始)'
      } else if (dataType.startsWith('bit')) {
        const match = dataType.match(/bit(\d+)/)
        if (match) {
          const startBit = parseInt(match[1])
          const memberCount = this.pointGroupForm.memberCount
          const endBit = startBit + memberCount - 1

          if (endBit <= 15) {
            return `将生成${dataType}, bit${startBit + 1}, bit${startBit + 2}... 到bit${endBit}`
          } else {
            return `最多只能生成到bit15，当前配置将超出范围`
          }
        }
      }
      return ''
    },

    // 功能码变化时的处理
    onFunctionCodeChange() {
      const functionCode = this.pointGroupForm.functionCode
      const allowedDataTypes = this.functionCodeDataTypeConstraint[functionCode]

      if (allowedDataTypes && !allowedDataTypes.includes(this.pointGroupForm.dataType)) {
        this.pointGroupForm.dataType = allowedDataTypes[0]
      }

      this.updateAddressInterval()
    },

    // 数据类型变化时的处理
    onDataTypeChange() {
      this.updateAddressInterval()

      if (this.pointGroupForm.dataType.startsWith('bit')) {
        this.pointGroupForm.addressInterval = 0
      }
    },

    // 更新地址间隔
    updateAddressInterval() {
      const dataType = this.pointGroupForm.dataType
      const interval = this.dataTypeIntervalMap[dataType]

      if (interval !== undefined) {
        this.pointGroupForm.addressInterval = interval
      }
    },

    // 生成点位预览
    generatePreview() {
      // 验证表单
      const errors = this.validatePointGroupForm()
      if (errors.length > 0) {
        this.$message.error(errors.join('，'))
        return
      }

      // 检查功能码和数据类型的约束
      const functionCode = this.pointGroupForm.functionCode
      const dataType = this.pointGroupForm.dataType
      const allowedDataTypes = this.functionCodeDataTypeConstraint[functionCode]

      if (allowedDataTypes && !allowedDataTypes.includes(dataType)) {
        const functionCodeName = this.getFunctionCodeName(functionCode)
        this.$message.error(`功能码${functionCodeName}不支持数据类型${dataType}`)
        return
      }

      // 生成点位预览
      this.previewPoints = this.generatePoints()

      if (this.previewPoints.length > 0) {
        this.$message.success(`已生成 ${this.previewPoints.length} 个点位预览`)
      }
    },

    // 验证点位组表单
    validatePointGroupForm() {
      const errors = []

      if (!this.pointGroupForm.basePointCode?.trim()) {
        errors.push('基础点位代码不能为空')
      }

      if (!this.pointGroupForm.basePointName?.trim()) {
        errors.push('基础点位名称不能为空')
      }

      if (this.pointGroupForm.memberCount < 1 || this.pointGroupForm.memberCount > 100) {
        errors.push('组员数量必须在1-100之间')
      }

      if (this.pointGroupForm.startAddress < 1 || this.pointGroupForm.startAddress > 65535) {
        errors.push('起始地址必须在1-65535之间')
      }

      // 检查BIT类型的数据类型范围
      if (this.pointGroupForm.dataType.startsWith('bit')) {
        const match = this.pointGroupForm.dataType.match(/bit(\d+)/)
        if (match) {
          const startBit = parseInt(match[1])
          const memberCount = this.pointGroupForm.memberCount
          const endBit = startBit + memberCount - 1

          if (endBit > 15) {
            errors.push(
              `BIT类型最多只能到bit15，当前配置从${this.pointGroupForm.dataType}开始，生成${memberCount}个点位将超出范围`,
            )
          }
        } else if (this.pointGroupForm.dataType === 'bit') {
          // 对于普通的bit类型，从bit0开始
          const memberCount = this.pointGroupForm.memberCount
          const endBit = memberCount - 1

          if (endBit > 15) {
            errors.push(
              `BIT类型最多只能生成16个点位 (BIT0-BIT15)，当前尝试生成 ${memberCount} 个点位`,
            )
          }
        }
      }

      return errors
    },

    // 生成点位数据（修正BIT类型的生成逻辑）
    generatePoints() {
      const points = []
      const baseCode = this.pointGroupForm.basePointCode.trim()
      const baseName = this.pointGroupForm.basePointName.trim()
      const dataType = this.pointGroupForm.dataType

      // 处理BIT类型
      let bitStartIndex = 0
      if (dataType === 'bit') {
        // 从BIT0开始
        bitStartIndex = 0
      } else if (dataType.startsWith('bit')) {
        // 解析BIT后面的数字作为起始索引
        const match = dataType.match(/bit(\d+)/)
        if (match) {
          bitStartIndex = parseInt(match[1])
        }
      }

      for (let i = 0; i < this.pointGroupForm.memberCount; i++) {
        // 生成点位代码和名称
        const pointCode = `${baseCode}_${String(i).padStart(3, '0')}`
        const pointName = `${baseName}${i}`

        // 计算地址
        const address = this.pointGroupForm.startAddress + i * this.pointGroupForm.addressInterval

        // 处理数据类型
        let generatedDataType = dataType
        if (dataType.startsWith('bit')) {
          // 生成递增的BIT类型：bit1, bit2, bit3... 或 bit0, bit1, bit2...
          const bitIndex = bitStartIndex + i
          if (bitIndex > 15) {
            this.$message.warning(`BIT索引 ${bitIndex} 超出范围 (0-15)，点位生成将停止`)
            break
          }
          generatedDataType = `bit${bitIndex}`
        }

        const point = {
          id: null,
          model_id: Number(this.templateId),
          point_code: pointCode,
          point_name: pointName,
          is_active: this.pointGroupForm.status,
          description: `${baseName}第${i}个点位`,
          address: address,
          is_control: this.pointGroupForm.isControl,
          function_code: Number(this.pointGroupForm.functionCode),
          data_type: generatedDataType,
          scale_factor: this.pointGroupForm.scaleFactor || 1.0,
          offset: this.pointGroupForm.offset || 0.0,
          engineering_unit: this.pointGroupForm.engineeringUnit || '',
          precision: this.pointGroupForm.precision || 0,
          byte_order: this.pointGroupForm.byteOrder,
          min_value: this.pointGroupForm.minValue !== null ? this.pointGroupForm.minValue : 0,
          max_value: this.pointGroupForm.maxValue !== null ? this.pointGroupForm.maxValue : 0,
          is_warn_point: this.pointGroupForm.isWarnPoint,
          warning_low: this.pointGroupForm.warningLow,
          warning_high: this.pointGroupForm.warningHigh,
          is_virtual: 0,
          source_point_codes: '',
          calculation_expression: '',
          updated_time: null,
        }

        points.push(point)
      }

      return points
    },

    // 获取数据类型范围
    getDataTypeRange() {
      if (this.previewPoints.length === 0) return ''

      const firstDataType = this.previewPoints[0].data_type
      const lastDataType = this.previewPoints[this.previewPoints.length - 1].data_type

      if (firstDataType === lastDataType) {
        return firstDataType
      }

      return `${firstDataType} ~ ${lastDataType}`
    },

    // 获取功能码名称
    getFunctionCodeName(code) {
      const map = {
        1: '01 (读线圈)',
        2: '02 (读离散输入)',
        3: '03 (读保持寄存器)',
        4: '04 (读输入寄存器)',
        5: '05 (写单个线圈)',
        6: '06 (写单个寄存器)',
        15: '15 (写多个线圈)',
        16: '16 (写多个寄存器)',
      }
      return map[code] || code
    },

    // 保存点位组
    async savePointGroup() {
      try {
        if (this.previewPoints.length === 0) {
          this.$message.warning('请先预览生成点位')
          return
        }

        if (!confirm(`确定要创建 ${this.previewPoints.length} 个点位吗？`)) {
          return
        }

        // 准备请求数据
        const requestData = {
          points: this.previewPoints,
        }

        console.log('批量创建点位:', requestData)

        // 调用API批量创建点位
        const response = await axios.post('/api/device/model_detail_modbus', requestData)

        console.log('批量创建响应:', response.data)

        if (response.data && response.data.code === 200) {
          this.$message.success(`成功创建 ${this.previewPoints.length} 个点位`)
          this.closeGroupDialog()
          await this.loadPoints()
        } else {
          const resData = response.data?.data
          let msg = response.data?.message || '创建点位组失败'
          if (resData?.error) msg += `：${resData.error}`
          if (resData?.partial_success_count != null)
            msg += `（已成功 ${resData.partial_success_count} 个）`
          this.$message.error(msg)
        }
      } catch (err) {
        console.error('创建点位组失败:', err)
        const resData = err.response?.data?.data
        let msg = err.response?.data?.message || err.message || '未知错误'
        if (resData?.error) msg += `：${resData.error}`
        if (resData?.partial_success_count != null)
          msg += `（已成功 ${resData.partial_success_count} 个）`
        this.$message.error('创建失败: ' + msg)
      }
    },

    isEditing(point, field) {
      return this.inlineEditId === point.id && this.inlineEditField === field
    },

    startInlineEdit(point, field) {
      if (this.inlineEditId === point.id && this.inlineEditField === field) return
      this.inlineEditId = point.id
      this.inlineEditField = field
      this.inlineEditValue = point[field]
      this.$nextTick(() => {
        const el = this.$refs.inlineInput
        if (el) {
          const target = Array.isArray(el) ? el[0] : el
          target.focus()
          if (target.select) target.select()
        }
      })
    },

    cancelInlineEdit() {
      this.inlineEditId = null
      this.inlineEditField = null
      this.inlineEditValue = ''
    },

    buildPointPayload(point) {
      return {
        id: point.id,
        model_id: Number(this.templateId),
        point_code: point.pointCode,
        point_name: point.pointName,
        is_active: point.isActive,
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
      }
    },

    async saveInlineEdit(point, field) {
      const newVal =
        typeof this.inlineEditValue === 'string'
          ? this.inlineEditValue.trim()
          : this.inlineEditValue
      const oldVal = point[field]
      this.inlineEditId = null
      this.inlineEditField = null
      if (newVal === oldVal || (typeof newVal === 'string' && newVal === '' && !oldVal)) return

      point[field] = newVal
      try {
        const response = await axios.put('/api/device/model_detail_modbus', {
          points: [this.buildPointPayload(point)],
        })
        if (response.data && response.data.code === 200) {
          this.$message.success('已更新')
        } else {
          point[field] = oldVal
          this.$message.error(response.data?.message || '更新失败')
        }
      } catch (err) {
        point[field] = oldVal
        this.$message.error('更新失败: ' + (err.response?.data?.message || err.message))
      }
    },

    async toggleField(point, field) {
      const oldVal = point[field]
      point[field] = oldVal === 1 ? 0 : 1
      try {
        const response = await axios.put('/api/device/model_detail_modbus', {
          points: [this.buildPointPayload(point)],
        })
        if (response.data && response.data.code === 200) {
          this.$message.success('已更新')
        } else {
          point[field] = oldVal
          this.$message.error(response.data?.message || '更新失败')
        }
      } catch (err) {
        point[field] = oldVal
        this.$message.error('更新失败: ' + (err.response?.data?.message || err.message))
      }
    },

    async stepPrecision(point, delta) {
      const oldVal = point.precision
      const newVal = Math.max(0, oldVal + delta)
      if (newVal === oldVal) return
      point.precision = newVal
      try {
        const response = await axios.put('/api/device/model_detail_modbus', {
          points: [this.buildPointPayload(point)],
        })
        if (response.data && response.data.code === 200) {
          this.$message.success('已更新')
        } else {
          point.precision = oldVal
          this.$message.error(response.data?.message || '更新失败')
        }
      } catch (err) {
        point.precision = oldVal
        this.$message.error('更新失败: ' + (err.response?.data?.message || err.message))
      }
    },

    // 修改按钮点击事件
    addPointGroup() {
      this.showAddPointGroupDialog()
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

          try {
            const decoder = new TextDecoder('utf-8')
            const text = decoder.decode(arrayBuffer)
            resolve(text)
          } catch (error) {
            console.warn('UTF-8解码失败，尝试GBK编码...', error)

            const fallbackReader = new FileReader()
            fallbackReader.onload = (e) => {
              resolve(e.target.result)
            }
            fallbackReader.onerror = () => {
              reject(new Error('读取文件失败'))
            }
            fallbackReader.readAsText(file, 'GBK')
          }
        }

        reader.onerror = (error) => {
          reject(new Error('读取文件失败: ' + error))
        }

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
  },
}
</script>

<style scoped>
@import './protocolCommon.css';

/* 分组折叠样式 */
.group-header-row {
  background-color: #e8f4fc !important;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header-row:hover {
  background-color: #d4e9f7 !important;
}

.group-toggle-icon {
  color: #1890ff;
  font-size: 12px;
  transition: transform 0.2s;
}

.group-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #1890ff;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.group-info {
  margin-left: 10px;
  color: #666;
  font-size: 12px;
}

.collapsed-hint {
  color: #1890ff;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.group-child-row {
  background-color: #fafafa;
}

.group-child-row:hover {
  background-color: #f0f0f0;
}

/* Modbus 协议特有样式 */
.modbus-protocol-config {
  width: 100%;
}

.modbus-points-config {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.points-table {
  min-width: 1600px;
}

.dialog-content.dialog-large {
  max-width: 900px;
}

.point-source,
.point-expression {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.form-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-section-title {
  font-size: 16px;
  margin-bottom: 20px;
  color: #495057;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.form-section-title:before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background-color: #3498db;
  margin-right: 10px;
}

/* 预览表格样式 */
.preview-container {
  margin-top: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.preview-table-container {
  max-height: 300px;
  overflow-y: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th {
  background-color: #f8f9fa;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
}

.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-table tr:last-child td {
  border-bottom: none;
}

.preview-table tr:hover {
  background-color: #f8f9fa;
}

.preview-more {
  text-align: center;
  color: #95a5a6;
  font-style: italic;
  padding: 12px !important;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.hint-text {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #6c757d;
}

.preview-summary {
  padding: 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
}

.summary-item .label {
  font-weight: 500;
  color: #6c757d;
}

.summary-item .value {
  font-weight: 600;
  color: #2c3e50;
}

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

.toggle-badge {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
}

.toggle-badge:hover {
  opacity: 0.7;
}

.inline-edit-input,
.inline-edit-select {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #3498db;
  border-radius: 3px;
  font-size: 13px;
  color: #2c3e50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.precision-stepper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stepper-btn {
  width: 22px;
  height: 22px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #f8f9fa;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.stepper-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #3498db;
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-value {
  min-width: 20px;
  text-align: center;
  font-weight: 600;
}
</style>
