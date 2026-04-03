<template>
  <div class="interface-detail">
    <!-- IP 配置 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <i class="fas fa-network-wired"></i>
          IP 配置 — {{ iface.name }}
        </div>
        <span
          class="status-badge"
          :class="iface.status === 'connected' ? 'status-normal' : 'status-warning'"
        >
          {{ iface.status === 'connected' ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="card-content">
        <div class="form-group">
          <label>IP 获取方式</label>
          <div class="ip-mode-selector">
            <label class="mode-option disabled" :class="{ active: form.mode === 'dhcp' }">
              <input type="radio" v-model="form.mode" value="dhcp" disabled />
              <div class="mode-content">
                <i class="fas fa-magic"></i>
                <div>
                  <strong>DHCP 自动获取</strong>
                  <p>暂不支持，敬请期待</p>
                </div>
              </div>
            </label>
            <label class="mode-option" :class="{ active: form.mode === 'static' }" @click="form.mode = 'static'">
              <input type="radio" v-model="form.mode" value="static" />
              <div class="mode-content">
                <i class="fas fa-pen"></i>
                <div>
                  <strong>静态 IP</strong>
                  <p>手动配置固定IP地址</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- 静态IP表单 -->
        <div v-if="form.mode === 'static'" class="config-section">
          <div class="info-grid cols-2">
            <div class="form-group">
              <label>IP 地址</label>
              <input type="text" class="form-control" v-model="form.ipAddress" placeholder="例如: 192.168.1.100" />
            </div>
            <div class="form-group">
              <label>子网掩码</label>
              <input type="text" class="form-control" v-model="form.subnetMask" placeholder="例如: 255.255.255.0" />
            </div>
            <div class="form-group">
              <label>默认网关</label>
              <input type="text" class="form-control" v-model="form.gateway" placeholder="例如: 192.168.1.1" />
            </div>
            <div class="form-group">
              <label>首选 DNS</label>
              <input type="text" class="form-control disabled" :value="form.dns1" disabled />
            </div>
            <div class="form-group">
              <label>备用 DNS</label>
              <input type="text" class="form-control disabled" :value="form.dns2" disabled />
            </div>
          </div>
        </div>

        <!-- DHCP 当前信息 -->
        <div v-else class="config-section">
          <div class="info-grid cols-2">
            <div class="info-item">
              <div class="info-label">当前 IP 地址</div>
              <div class="info-value">{{ iface.current_ip || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">子网掩码</div>
              <div class="info-value">{{ iface.current_mask || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">默认网关</div>
              <div class="info-value">{{ iface.current_gateway || '--' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DNS 服务器</div>
              <div class="info-value">{{ iface.current_dns || '--' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer" style="justify-content: flex-end; gap: 12px">
        <button class="btn btn-outline" @click="$emit('refresh')" :disabled="saving">
          <i class="fas fa-redo"></i> 刷新
        </button>
        <button class="btn btn-primary" @click="handleSave" :disabled="saving">
          <i class="fas fa-save"></i> {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InterfaceDetail',
  props: {
    iface: { type: Object, required: true },
    saving: { type: Boolean, default: false },
  },
  emits: ['save', 'refresh'],
  data() {
    return {
      form: {
        mode: 'dhcp',
        ipAddress: '',
        subnetMask: '255.255.255.0',
        gateway: '',
        dns1: '',
        dns2: '',
      },
    }
  },
  watch: {
    iface: {
      immediate: true,
      handler(val) {
        if (!val || !val.name) return
        this.form.mode = 'static'
        this.form.ipAddress = val.ip_address || ''
        this.form.subnetMask = val.subnet_mask || '255.255.255.0'
        this.form.gateway = val.gateway || ''
        this.form.dns1 = val.dns1 || ''
        this.form.dns2 = val.dns2 || ''
      },
    },
  },
  methods: {
    validateIp(ip) {
      if (!ip) return false
      const parts = ip.split('.')
      if (parts.length !== 4) return false
      return parts.every((p) => {
        const n = Number(p)
        return Number.isInteger(n) && n >= 0 && n <= 255
      })
    },
    handleSave() {
      if (this.form.mode === 'static') {
        if (!this.validateIp(this.form.ipAddress)) return alert('请输入有效的IP地址')
        if (!this.validateIp(this.form.subnetMask)) return alert('请输入有效的子网掩码')
        if (this.form.gateway && !this.validateIp(this.form.gateway)) return alert('请输入有效的网关地址')
      }
      this.$emit('save', { ...this.form })
    },
  },
}
</script>

<style scoped>
.interface-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ip-mode-selector {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbfc;
}

.mode-option:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

.mode-option.active {
  border-color: #3498db;
  background: #eef6ff;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.mode-option input[type='radio'] { display: none; }

.mode-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mode-content i { font-size: 24px; color: #3498db; }

.mode-content strong {
  display: block;
  font-size: 15px;
  color: #2c3e50;
  margin-bottom: 2px;
}

.mode-content p {
  margin: 0;
  font-size: 13px;
  color: #7f8c8d;
}

.config-section {
  margin-top: 10px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.mode-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.form-control.disabled {
  background: #f0f2f5;
  color: #999;
  cursor: not-allowed;
  border-color: #e1e5e9;
}

@media (max-width: 768px) {
  .ip-mode-selector { flex-direction: column; }
  .info-grid.cols-2, .info-grid.cols-4 { grid-template-columns: 1fr; }
}
</style>
