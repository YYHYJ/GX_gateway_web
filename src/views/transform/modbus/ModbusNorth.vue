<template>
  <MainLayout
    active-nav="data-forwarding"
    active-sub-item="modbus-transform"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="北向 Modbus" :breadcrumbs="breadcrumbs" />

      <div class="modbus-content">
        <!-- 服务状态 + 配置 -->
        <div class="top-row">
          <!-- 服务配置 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-server"></i>
                Modbus TCP Slave 服务
              </div>
              <span class="status-badge" :class="service.running ? 'status-normal' : 'status-disabled'">
                {{ service.running ? '运行中' : '已停止' }}
              </span>
            </div>
            <div class="card-content">
              <div class="service-row">
                <div class="service-fields">
                  <div class="form-group">
                    <label>启用服务</label>
                    <div class="toggle-switch" :class="{ on: serviceForm.enabled }" @click="serviceForm.enabled = !serviceForm.enabled">
                      <div class="toggle-knob"></div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>监听端口</label>
                    <input type="number" class="form-control" v-model.number="serviceForm.port" min="1" max="65535" />
                  </div>
                  <div class="form-group">
                    <label>从站地址</label>
                    <input type="number" class="form-control" v-model.number="serviceForm.slaveId" min="1" max="247" />
                  </div>
                  <div class="form-group">
                    <label>最大连接数</label>
                    <input type="number" class="form-control" v-model.number="serviceForm.maxConn" min="1" max="32" />
                  </div>
                  <div class="form-group">
                    <label>字节序</label>
                    <select class="form-control" v-model="serviceForm.byteOrder">
                      <option value="big">Big-Endian (AB CD)</option>
                      <option value="little">Little-Endian (CD AB)</option>
                      <option value="big_swap">Big-Endian Swap (BA DC)</option>
                      <option value="little_swap">Little-Endian Swap (DC BA)</option>
                    </select>
                  </div>
                </div>
                <div class="service-actions">
                  <button class="btn btn-primary" @click="saveService" :disabled="savingService">
                    <i class="fas fa-save"></i> {{ savingService ? '保存中...' : '保存配置' }}
                  </button>
                  <button
                    class="btn"
                    :class="service.running ? 'btn-danger' : 'btn-outline'"
                    @click="toggleService"
                  >
                    <i class="fas" :class="service.running ? 'fa-stop' : 'fa-play'"></i>
                    {{ service.running ? '停止服务' : '启动服务' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 寄存器映射表 + 客户端连接 -->
        <div class="main-columns">
          <!-- 左：寄存器映射表 -->
          <div class="col-main">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-th-list"></i>
                  寄存器映射表
                </div>
                <div class="header-actions">
                  <button class="btn btn-sm btn-primary" @click="openAddMapping">
                    <i class="fas fa-plus"></i> 添加映射
                  </button>
                </div>
              </div>
              <div class="card-content" style="padding: 0;">
                <table class="mapping-table">
                  <thead>
                    <tr>
                      <th>寄存器地址</th>
                      <th>功能码</th>
                      <th>数据类型</th>
                      <th>来源设备</th>
                      <th>来源点位</th>
                      <th>缩放系数</th>
                      <th>备注</th>
                      <th style="width: 90px;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in mappings" :key="item.id">
                      <td class="mono">{{ item.address }}</td>
                      <td>
                        <span class="fc-badge" :class="'fc-' + item.funcCode">{{ funcCodeLabel(item.funcCode) }}</span>
                      </td>
                      <td>{{ item.dataType }}</td>
                      <td>{{ item.sourceDevice }}</td>
                      <td class="mono">{{ item.sourcePoint }}</td>
                      <td class="mono">{{ item.scale }}</td>
                      <td class="remark-cell">{{ item.remark }}</td>
                      <td>
                        <div class="row-actions">
                          <button class="btn-icon" title="编辑" @click="openEditMapping(item)">
                            <i class="fas fa-pen"></i>
                          </button>
                          <button class="btn-icon btn-icon-danger" title="删除" @click="deleteMapping(item)">
                            <i class="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="mappings.length === 0">
                      <td colspan="8" class="empty-row">暂无映射，点击"添加映射"开始配置</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 右：客户端连接 -->
          <div class="col-side">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-link"></i>
                  客户端连接
                </div>
                <span class="conn-count">{{ clients.length }} / {{ serviceForm.maxConn }}</span>
              </div>
              <div class="card-content" style="padding: 0;">
                <div class="client-list">
                  <div v-for="client in clients" :key="client.id" class="client-item">
                    <div class="client-info">
                      <div class="client-ip mono">{{ client.ip }}:{{ client.port }}</div>
                      <div class="client-meta">
                        连接时间 {{ client.connectedAt }} · 请求 {{ client.requests }} 次
                      </div>
                    </div>
                    <div class="client-status">
                      <span class="status-dot dot-on"></span>
                    </div>
                  </div>
                  <div class="client-empty" v-if="clients.length === 0">
                    暂无客户端连接
                  </div>
                </div>
              </div>
            </div>

            <!-- 统计 -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-chart-bar"></i>
                  通信统计
                </div>
              </div>
              <div class="card-content">
                <div class="stat-grid">
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.totalRequests }}</div>
                    <div class="stat-label">总请求数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.totalErrors }}</div>
                    <div class="stat-label">错误响应</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.avgResponse }}</div>
                    <div class="stat-label">平均响应</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.uptime }}</div>
                    <div class="stat-label">运行时长</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑映射弹窗 -->
      <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ editingMapping ? '编辑映射' : '添加映射' }}</h3>
            <button class="modal-close" @click="showModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="info-grid cols-2">
              <div class="form-group">
                <label>寄存器起始地址</label>
                <input type="number" class="form-control mono" v-model.number="mappingForm.address" min="0" max="65535" placeholder="例如: 40001" />
              </div>
              <div class="form-group">
                <label>功能码</label>
                <select class="form-control" v-model="mappingForm.funcCode">
                  <option value="03">03 - 保持寄存器 (Holding)</option>
                  <option value="04">04 - 输入寄存器 (Input)</option>
                  <option value="01">01 - 线圈 (Coil)</option>
                  <option value="02">02 - 离散输入 (Discrete)</option>
                </select>
              </div>
              <div class="form-group">
                <label>数据类型</label>
                <select class="form-control" v-model="mappingForm.dataType">
                  <option value="INT16">INT16</option>
                  <option value="UINT16">UINT16</option>
                  <option value="INT32">INT32</option>
                  <option value="UINT32">UINT32</option>
                  <option value="FLOAT32">FLOAT32</option>
                  <option value="FLOAT64">FLOAT64</option>
                  <option value="BOOL">BOOL</option>
                </select>
              </div>
              <div class="form-group">
                <label>缩放系数</label>
                <input type="text" class="form-control mono" v-model="mappingForm.scale" placeholder="例如: 1.0 或 0.1" />
              </div>
              <div class="form-group">
                <label>来源设备</label>
                <select class="form-control" v-model="mappingForm.sourceDevice">
                  <option v-for="d in deviceList" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>来源点位</label>
                <select class="form-control" v-model="mappingForm.sourcePoint">
                  <option v-for="p in pointList" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>备注</label>
              <input type="text" class="form-control" v-model="mappingForm.remark" placeholder="可选" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showModal = false">取消</button>
            <button class="btn btn-primary" @click="saveMapping">
              <i class="fas fa-check"></i> 确定
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

export default {
  name: 'ModbusNorth',
  components: { MainLayout, PageHeader },
  data() {
    return {
      breadcrumbs: [{ title: '数据转发' }, { title: '北向 Modbus' }],
      savingService: false,
      showModal: false,
      editingMapping: null,
      // TODO: 替换为真实API数据
      service: { running: true },
      serviceForm: {
        enabled: true,
        port: 502,
        slaveId: 1,
        maxConn: 5,
        byteOrder: 'big',
      },
      stats: {
        totalRequests: '128,450',
        totalErrors: '23',
        avgResponse: '2.3ms',
        uptime: '15天8时',
      },
      clients: [
        { id: 1, ip: '192.168.1.50', port: 49832, connectedAt: '08:15:30', requests: 45230 },
        { id: 2, ip: '192.168.1.51', port: 51204, connectedAt: '09:42:18', requests: 12680 },
      ],
      // Mock 设备和点位列表（实际从采集配置获取）
      deviceList: ['电表-01', '电表-02', '温湿度-01', '温湿度-02', '水泵-01'],
      pointList: ['Ua', 'Ub', 'Uc', 'Ia', 'Ib', 'Ic', 'P', 'Q', 'PF', 'Freq', 'Temp', 'Humidity', 'RunStatus', 'Speed'],
      mappings: [
        { id: 1, address: 40001, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'Ua', scale: '0.1', remark: 'A相电压' },
        { id: 2, address: 40003, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'Ub', scale: '0.1', remark: 'B相电压' },
        { id: 3, address: 40005, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'Uc', scale: '0.1', remark: 'C相电压' },
        { id: 4, address: 40007, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'Ia', scale: '0.01', remark: 'A相电流' },
        { id: 5, address: 40009, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'Ib', scale: '0.01', remark: 'B相电流' },
        { id: 6, address: 40011, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'Ic', scale: '0.01', remark: 'C相电流' },
        { id: 7, address: 40013, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '电表-01', sourcePoint: 'P', scale: '1.0', remark: '有功功率' },
        { id: 8, address: 40015, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '温湿度-01', sourcePoint: 'Temp', scale: '0.1', remark: '环境温度' },
        { id: 9, address: 40017, funcCode: '03', dataType: 'FLOAT32', sourceDevice: '温湿度-01', sourcePoint: 'Humidity', scale: '0.1', remark: '环境湿度' },
        { id: 10, address: 10001, funcCode: '01', dataType: 'BOOL', sourceDevice: '水泵-01', sourcePoint: 'RunStatus', scale: '1', remark: '水泵运行状态' },
      ],
      mappingForm: {
        address: null,
        funcCode: '03',
        dataType: 'FLOAT32',
        sourceDevice: '',
        sourcePoint: '',
        scale: '1.0',
        remark: '',
      },
    }
  },
  methods: {
    handleNavigation() {},

    funcCodeLabel(fc) {
      const map = { '01': '01 线圈', '02': '02 离散', '03': '03 保持', '04': '04 输入' }
      return map[fc] || fc
    },

    saveService() {
      this.savingService = true
      // TODO: 接入真实API
      setTimeout(() => {
        this.savingService = false
        alert('服务配置保存成功（Mock）')
      }, 500)
    },

    toggleService() {
      // TODO: 接入真实API
      this.service.running = !this.service.running
      alert(this.service.running ? '服务已启动（Mock）' : '服务已停止（Mock）')
    },

    openAddMapping() {
      this.editingMapping = null
      this.mappingForm = {
        address: null, funcCode: '03', dataType: 'FLOAT32',
        sourceDevice: '', sourcePoint: '', scale: '1.0', remark: '',
      }
      this.showModal = true
    },

    openEditMapping(item) {
      this.editingMapping = item
      this.mappingForm = { ...item }
      this.showModal = true
    },

    saveMapping() {
      if (this.editingMapping) {
        Object.assign(this.editingMapping, this.mappingForm)
      } else {
        this.mappings.push({
          id: Date.now(),
          ...this.mappingForm,
        })
      }
      this.showModal = false
    },

    deleteMapping(item) {
      if (confirm(`确定删除寄存器 ${item.address} 的映射？`)) {
        this.mappings = this.mappings.filter((m) => m.id !== item.id)
      }
    },
  },
}
</script>

<style scoped>
.modbus-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 服务配置行 */
.service-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.service-fields {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;
  align-items: flex-end;
}

.service-fields .form-group {
  min-width: 140px;
  flex: 1;
  margin-bottom: 0;
}

.service-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  padding-bottom: 2px;
}

/* 开关 */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #cbd5e1;
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
  margin-top: 6px;
}

.toggle-switch.on { background: #3498db; }

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-knob { transform: translateX(20px); }

/* 左右布局 */
.main-columns {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.col-main { flex: 1; min-width: 0; }

.col-side {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 映射表 */
.mapping-table {
  width: 100%;
  border-collapse: collapse;
}

.mapping-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 12px 14px;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.mapping-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #334155;
  vertical-align: middle;
}

.mapping-table tr:hover td {
  background: #f8fafc;
}

.mono { font-family: 'Courier New', monospace; }

.remark-cell {
  color: #94a3b8;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 32px 14px !important;
}

/* 功能码徽章 */
.fc-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.fc-03 { background: #dbeafe; color: #1d4ed8; }
.fc-04 { background: #dcfce7; color: #16a34a; }
.fc-01 { background: #fef3c7; color: #b45309; }
.fc-02 { background: #f3e8ff; color: #7c3aed; }

/* 行操作 */
.row-actions {
  display: flex;
  gap: 6px;
}

.btn-icon {
  width: 30px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s;
}

.btn-icon:hover { border-color: #3498db; color: #3498db; }
.btn-icon-danger:hover { border-color: #e74c3c; color: #e74c3c; }

/* 客户端列表 */
.conn-count {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.client-list { padding: 4px 0; }

.client-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.client-item:last-child { border-bottom: none; }

.client-ip {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.client-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.client-empty {
  padding: 24px 20px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-on { background: #2ecc71; }

/* 统计 */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item { text-align: center; }

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 危险按钮 */
.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-danger:hover { background: #c0392b; }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-close:hover { color: #475569; }

.modal-body {
  padding: 20px 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.status-disabled {
  background: #f1f5f9;
  color: #94a3b8;
}

@media (max-width: 1000px) {
  .main-columns {
    flex-direction: column;
  }

  .col-side {
    flex: none;
    width: 100%;
  }

  .service-row {
    flex-direction: column;
    align-items: stretch;
  }

  .service-actions {
    justify-content: flex-end;
  }
}
</style>
