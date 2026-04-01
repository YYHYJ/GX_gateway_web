<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <i class="fas fa-route"></i>
        静态路由表
      </div>
      <button class="btn btn-primary btn-sm" @click="$emit('add')">
        <i class="fas fa-plus"></i> 添加路由
      </button>
    </div>
    <div class="card-content">
      <!-- 默认路由提示 -->
      <div class="default-route-banner">
        <i class="fas fa-info-circle"></i>
        <span>
          默认路由：所有未匹配流量经由
          <strong>{{ defaultRoute.gateway }}</strong>
          从 <strong>{{ getIfaceName(defaultRoute.iface) }}</strong> 出站
          <a href="javascript:;" class="edit-default" @click="$emit('edit-default')">修改</a>
        </span>
      </div>

      <!-- 路由表 -->
      <table class="route-table" v-if="routes.length > 0">
        <thead>
          <tr>
            <th>目标网段</th>
            <th>子网掩码</th>
            <th>下一跳网关</th>
            <th>出接口</th>
            <th>优先级 (Metric)</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="route in routes" :key="route.destination + route.netmask">
            <td><code>{{ route.destination }}</code></td>
            <td><code>{{ route.netmask }}</code></td>
            <td><code>{{ route.gateway }}</code></td>
            <td><span class="iface-tag">{{ getIfaceName(route.iface) }}</span></td>
            <td>{{ route.metric }}</td>
            <td class="route-remark">{{ route.remark || '--' }}</td>
            <td>
              <div class="table-actions">
                <button class="btn-icon" title="编辑" @click="$emit('edit', route)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-icon-danger" title="删除" @click="$emit('delete', route)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-else class="empty-state" style="padding: 40px 20px">
        <i class="fas fa-route"></i>
        <h3>暂无静态路由</h3>
        <p>点击上方"添加路由"按钮配置静态路由规则</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RouteTable',
  props: {
    routes: { type: Array, default: () => [] },
    defaultRoute: { type: Object, required: true },
    interfaces: { type: Array, default: () => [] },
  },
  emits: ['add', 'edit', 'edit-default', 'delete'],
  methods: {
    getIfaceName(ifaceName) {
      const iface = this.interfaces.find((i) => i.name === ifaceName)
      return iface ? iface.name : ifaceName
    },
  },
}
</script>

<style scoped>
.default-route-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #eef6ff;
  border: 1px solid #bee3f8;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #2c5282;
}

.default-route-banner i {
  color: #3498db;
  font-size: 16px;
  flex-shrink: 0;
}

.edit-default {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  margin-left: 8px;
}

.edit-default:hover {
  text-decoration: underline;
}

.route-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.route-table thead {
  background: #f8fafc;
}

.route-table th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  font-size: 13px;
  white-space: nowrap;
}

.route-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.route-table tbody tr:hover {
  background: #f8fafc;
}

.route-table code {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #1e293b;
  font-family: 'Courier New', monospace;
}

.iface-tag {
  display: inline-block;
  padding: 3px 10px;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.route-remark {
  color: #94a3b8;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-actions {
  display: flex;
  gap: 6px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: #f1f5f9;
  color: #3498db;
}

.btn-icon-danger:hover {
  background: #fef2f2;
  color: #e74c3c;
}

@media (max-width: 768px) {
  .route-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
