<template>
  <div class="vpn-config">
    <!-- VPN 状态概览 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <i class="fas fa-shield-alt"></i>
          VPN 配置
        </div>
        <div class="vpn-header-actions">
          <span
            class="status-badge"
            :class="vpnStatusClass"
          >
            {{ vpnStatusText }}
          </span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card-content">
        <!-- 连接信息（已连接时显示） -->
        <div v-if="form.enabled && connectionInfo.status === 'connected'" class="vpn-connection-info">
          <div class="info-grid cols-4">
            <div class="info-item">
              <div class="info-label">VPN IP</div>
              <div class="info-value">{{ connectionInfo.vpnIp }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">远端地址</div>
              <div class="info-value">{{ connectionInfo.remoteAddr }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">已连接时长</div>
              <div class="info-value">{{ connectionInfo.uptime }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">收/发流量</div>
              <div class="info-value">{{ connectionInfo.traffic }}</div>
            </div>
          </div>
        </div>

        <!-- 协议选择 -->
        <div class="form-group">
          <label>VPN 协议</label>
          <div class="protocol-selector">
            <label
              class="protocol-option"
              :class="{ active: form.protocol === 'pptp' }"
              @click="form.protocol = 'pptp'"
            >
              <input type="radio" v-model="form.protocol" value="pptp" />
              <div class="protocol-content">
                <i class="fas fa-lock"></i>
                <div>
                  <strong>PPTP</strong>
                  <p>配置简单，兼容性好</p>
                </div>
              </div>
            </label>
            <label class="protocol-option disabled">
              <input type="radio" value="wireguard" disabled />
              <div class="protocol-content">
                <i class="fas fa-bolt"></i>
                <div>
                  <strong>WireGuard</strong>
                  <p>暂不支持，敬请期待</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- PPTP 配置 -->
        <div v-if="form.protocol === 'pptp'" class="config-section">
          <div class="section-title">PPTP 客户端配置</div>
          <div class="info-grid cols-2">
            <div class="form-group">
              <label>服务器地址</label>
              <input type="text" class="form-control" v-model="form.pptp.serverAddr" placeholder="例如: vpn.example.com" />
            </div>
            <div class="form-group">
              <label>用户名</label>
              <input type="text" class="form-control" v-model="form.pptp.username" placeholder="VPN 账号" />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input type="password" class="form-control" v-model="form.pptp.password" placeholder="VPN 密码" />
            </div>
            <div class="form-group">
              <label>加密方式</label>
              <select class="form-control" v-model="form.pptp.encryption">
                <option value="auto">自动</option>
                <option value="mppe128">MPPE 128位</option>
                <option value="mppe40">MPPE 40位</option>
                <option value="none">不加密</option>
              </select>
            </div>
          </div>
        </div>

        <!-- WireGuard 配置（禁用保留） -->
        <div v-if="form.protocol === 'wireguard'" class="config-section">
          <div class="section-title">WireGuard 客户端配置</div>
          <div class="info-grid cols-2">
            <div class="form-group">
              <label>对端地址 (Endpoint)</label>
              <input type="text" class="form-control" v-model="form.wireguard.endpoint" placeholder="例如: vpn.example.com:51820" />
            </div>
            <div class="form-group">
              <label>本机隧道 IP (Address)</label>
              <input type="text" class="form-control" v-model="form.wireguard.address" placeholder="例如: 10.0.0.2/24" />
            </div>
          </div>
          <div class="form-group">
            <label>本机私钥 (Private Key)</label>
            <input type="password" class="form-control" v-model="form.wireguard.privateKey" placeholder="Base64 编码的私钥" />
          </div>
          <div class="form-group">
            <label>对端公钥 (Peer Public Key)</label>
            <input type="text" class="form-control" v-model="form.wireguard.peerPublicKey" placeholder="Base64 编码的对端公钥" />
          </div>
          <div class="form-group">
            <label>预共享密钥 (Preshared Key)（可选）</label>
            <input type="password" class="form-control" v-model="form.wireguard.presharedKey" placeholder="可选，增强安全性" />
          </div>
          <div class="info-grid cols-2">
            <div class="form-group">
              <label>允许的 IP (Allowed IPs)</label>
              <input type="text" class="form-control" v-model="form.wireguard.allowedIps" placeholder="例如: 0.0.0.0/0 或 10.0.0.0/24" />
            </div>
            <div class="form-group">
              <label>DNS 服务器</label>
              <input type="text" class="form-control" v-model="form.wireguard.dns" placeholder="例如: 8.8.8.8" />
            </div>
            <div class="form-group">
              <label>保活间隔 (Keepalive)</label>
              <input type="number" class="form-control" v-model.number="form.wireguard.keepalive" placeholder="25" />
              <span class="form-text">秒，建议 25，设为 0 则禁用</span>
            </div>
            <div class="form-group">
              <label>MTU</label>
              <input type="number" class="form-control" v-model.number="form.wireguard.mtu" placeholder="1420" />
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="card-footer" style="justify-content: flex-end; gap: 12px">
        <button
          v-if="form.enabled"
          class="btn"
          :class="connectionInfo.status === 'connected' ? 'btn-danger' : 'btn-success'"
          @click="toggleConnection"
          :disabled="connecting"
        >
          <i class="fas" :class="connectionInfo.status === 'connected' ? 'fa-unlink' : 'fa-link'"></i>
          {{ connectBtnText }}
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
  name: 'VpnConfig',
  data() {
    return {
      saving: false,
      connecting: false,
      form: {
        enabled: true,
        protocol: 'pptp',
        pptp: {
          serverAddr: '',
          username: '',
          password: '',
          encryption: 'auto',
        },
        wireguard: {
          endpoint: '',
          address: '',
          privateKey: '',
          peerPublicKey: '',
          presharedKey: '',
          allowedIps: '0.0.0.0/0',
          dns: '8.8.8.8',
          keepalive: 25,
          mtu: 1420,
        },
      },
      connectionInfo: {
        status: 'disconnected',
        vpnIp: '',
        remoteAddr: '',
        uptime: '2天 5小时 32分',
        traffic: '↓ 1.2 GB / ↑ 356 MB',
      },
    }
  },
  computed: {
    vpnStatusClass() {
      if (!this.form.enabled) return 'status-info'
      return this.connectionInfo.status === 'connected' ? 'status-normal' : 'status-warning'
    },
    vpnStatusText() {
      if (!this.form.enabled) return '已禁用'
      return this.connectionInfo.status === 'connected' ? '已连接' : '未连接'
    },
    connectBtnText() {
      if (this.connecting) return '操作中...'
      return this.connectionInfo.status === 'connected' ? '断开连接' : '连接'
    },
  },
  methods: {
    toggleConnection() {
      this.connecting = true
      // TODO: 接入真实API后替换
      setTimeout(() => {
        if (this.connectionInfo.status === 'connected') {
          this.connectionInfo.status = 'disconnected'
        } else {
          this.connectionInfo = {
            status: 'connected',
            vpnIp: '10.8.0.6',
            remoteAddr: '203.0.113.50:51820',
            uptime: '刚刚连接',
            traffic: '↓ 0 B / ↑ 0 B',
          }
        }
        this.connecting = false
      }, 1000)
    },
    handleSave() {
      this.saving = true
      // TODO: 接入真实API后替换
      setTimeout(() => {
        this.saving = false
        alert('VPN 配置保存成功（Mock）')
      }, 500)
    },
  },
}
</script>

<style scoped>
.vpn-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 开关 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  transition: 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: #2ecc71;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* 连接信息 */
.vpn-connection-info {
  padding: 14px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  margin-bottom: 16px;
}

/* 配置区域 */
.config-section {
  margin-top: 10px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

/* 协议选择器 */
.protocol-selector {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.protocol-option {
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

.protocol-option:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

.protocol-option.active {
  border-color: #3498db;
  background: #eef6ff;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.protocol-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.protocol-option input[type='radio'] {
  display: none;
}

.protocol-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.protocol-content i {
  font-size: 24px;
  color: #3498db;
}

.protocol-content strong {
  display: block;
  font-size: 15px;
  color: #2c3e50;
  margin-bottom: 2px;
}

.protocol-content p {
  margin: 0;
  font-size: 13px;
  color: #7f8c8d;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .protocol-selector {
    flex-direction: column;
  }

  .info-grid.cols-2,
  .info-grid.cols-4 {
    grid-template-columns: 1fr;
  }
}
</style>
