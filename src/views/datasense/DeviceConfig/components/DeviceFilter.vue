<template>
  <div class="filter-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        type="text"
        class="search-input"
        :placeholder="placeholder"
        v-model="searchKeyword"
        @input="handleSearchInput"
      />
      <button class="search-btn" @click="handleSearch"><i class="fas fa-search"></i> 搜索</button>
      <button class="btn btn-outline reset-btn" @click="resetSearch">
        <i class="fas fa-redo"></i> 重置
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select class="filter-select" v-model="statusFilter" @change="handleFilterChange">
        <option value="">所有状态</option>
        <option value="online">在线</option>
        <option value="offline">离线</option>
        <option value="fault">故障</option>
      </select>

      <select class="filter-select" v-model="protocolFilter" @change="handleFilterChange">
        <option value="">所有通信协议</option>
        <option value="modbus">Modbus TCP</option>
        <option value="opcua">OPC UA</option>
        <option value="mqtt">MQTT</option>
        <option value="bacnet">BACnet</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeviceFilter',
  props: {
    placeholder: {
      type: String,
      default: '搜索实例代码、实例名称、通信协议...',
    },
  },
  emits: ['search', 'filter-change', 'reset'],
  data() {
    return {
      searchKeyword: '',
      statusFilter: '',
      protocolFilter: '',
    }
  },
  methods: {
    handleSearchInput() {
      // 可以添加防抖处理
      this.$emit('search', {
        searchKeyword: this.searchKeyword,
        statusFilter: this.statusFilter,
        protocolFilter: this.protocolFilter,
      })
    },

    handleSearch() {
      this.$emit('search', {
        searchKeyword: this.searchKeyword,
        statusFilter: this.statusFilter,
        protocolFilter: this.protocolFilter,
      })
    },

    handleFilterChange() {
      this.$emit('filter-change', {
        searchKeyword: this.searchKeyword,
        statusFilter: this.statusFilter,
        protocolFilter: this.protocolFilter,
      })
    },

    resetSearch() {
      this.searchKeyword = ''
      this.statusFilter = ''
      this.protocolFilter = ''
      this.$emit('reset')
    },
  },
}
</script>

<style scoped>
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

.btn-outline {
  background-color: transparent;
  border: 1px solid #95a5a6;
  color: #34495e;
}

.reset-btn {
  margin-left: 10px;
  border-radius: 5px;
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
</style>
