# 协议配置公共组件使用说明

## 文件说明

- `protocolMixin.js` - 公共逻辑混入
- `protocolCommon.css` - 公共样式

## 使用方法

### 1. 在组件中引入混入

```javascript
import { protocolMixin, dataTypeOptions, formatDataType } from './protocolMixin.js'

export default {
  name: 'ModbusProtocol',
  mixins: [protocolMixin],
  // ... 其他配置
}
```

### 2. 引入公共样式

```vue
<style scoped>
@import './protocolCommon.css';

/* 协议特有样式 */
</style>
```

## 提供的公共功能

### 数据属性
- `loading` - 加载状态
- `error` - 错误信息
- `allPoints` - 所有点位数据
- `filteredPoints` - 过滤后的点位
- `points` - 当前页点位
- `selectedPoints` - 选中的点位ID数组
- `selectAll` - 全选状态
- `searchText` - 搜索文本
- `currentPage` - 当前页码
- `pageSize` - 每页条数
- `totalItems` - 总条数
- `totalPages` - 总页数
- `showDialog` - 对话框显示状态
- `editingPoint` - 正在编辑的点位

### 计算属性
- `hasSearchFilter` - 是否有搜索/筛选条件
- `pageNumbers` - 分页按钮数组

### 方法

#### 分页相关
- `updatePagination()` - 更新分页信息
- `updateCurrentPageData()` - 更新当前页数据
- `changePage()` - 页码变更
- `changePageSize()` - 页大小变更
- `prevPage()` - 上一页
- `nextPage()` - 下一页
- `goToPage(page)` - 跳转到指定页

#### 选择相关
- `toggleSelectAll()` - 切换全选

#### 对话框相关
- `closeDialog()` - 关闭对话框

#### 格式化相关
- `formatByteOrder(byteOrder)` - 格式化字节序
- `formatDateTime(dateTime)` - 格式化日期时间
- `formatDataType(dataType)` - 格式化数据类型（导出函数）

#### 错误处理
- `handleApiError(err)` - 处理API错误
- `extractApiErrorMessage(errorData, isEdit)` - 提取API错误信息
- `extractHttpErrorMessage(err, isEdit)` - 提取HTTP错误信息

### 导出的常量
- `dataTypeOptions` - 数据类型选项数组

## 需要自行实现的方法

每个协议组件需要实现以下方法：

- `loadPoints()` - 加载点位数据
- `applyFilters()` - 应用筛选条件
- `resetSearch()` - 重置搜索
- `resetPointForm()` - 重置表单
- `savePoint()` - 保存点位
- `deletePoint(point)` - 删除点位
- `editPoint(point)` - 编辑点位
- `showAddPointDialog()` - 显示新增对话框

## 示例：简化后的组件结构

```vue
<script>
import { protocolMixin, dataTypeOptions, formatDataType } from './protocolMixin.js'
import axios from 'axios'

export default {
  name: 'ModbusProtocol',
  mixins: [protocolMixin],
  
  props: {
    templateId: {
      type: [String, Number],
      required: true,
    },
  },
  
  data() {
    return {
      filters: {
        status: '',
        functionCode: '',
        dataType: '',
      },
      pointForm: {
        // 表单字段
      },
    }
  },
  
  computed: {
    dataTypeOptions() {
      return dataTypeOptions
    },
  },
  
  created() {
    this.loadPoints()
  },
  
  watch: {
    filters: {
      handler() {
        this.applyFilters()
      },
      deep: true,
    },
  },
  
  methods: {
    formatDataType,
    
    async loadPoints() {
      // 协议特定的加载逻辑
    },
    
    applyFilters() {
      // 协议特定的筛选逻辑
    },
    
    // ... 其他协议特定方法
  },
}
</script>

<style scoped>
@import './protocolCommon.css';

/* 协议特有样式 */
</style>
```

## 优势

1. **减少重复代码** - 分页、选择、错误处理等逻辑只需维护一份
2. **统一样式** - 所有协议配置页面保持一致的UI风格
3. **易于维护** - 公共功能的修改只需改一处
4. **灵活扩展** - 各协议可以覆盖混入的方法实现特定逻辑
