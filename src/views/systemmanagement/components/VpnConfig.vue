<template>
  <div class="vpn-config">
    <!-- VPN 状态概览 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <i class="fas fa-shield-alt"></i>
          WireGuard VPN 配置
        </div>
        <div class="vpn-header-actions">
          <span
            class="status-badge"
            :class="vpnStatusClass"
          >
            {{ vpnStatusText }}
          </span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="config.enabled" @change="handleEnabledChange" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card-content">
        <!-- 连接信息（已连接时显示） -->
        <div v-if="config.enabled && vpnStatusData.status === 'connected'" class="vpn-connection-info">
          <div class="info-grid cols-2">
            <div class="info-item">
              <div class="info-label">最新握手</div>
              <div class="info-value">{{ vpnStatusData.latest_handshake || '无' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">数据传输</div>
              <div class="info-value">{{ vpnStatusData.transfer || '无' }}</div>
            </div>
          </div>
          <div v-if="vpnStatusData.detailed_output" class="detailed-status">
            <div class="info-label">详细信息</div>
            <pre class="status-details">{{ vpnStatusData.detailed_output }}</pre>
          </div>
        </div>

        <!-- 本地公钥显示 -->
        <div class="form-group">
          <label>本地公钥 (Local Public Key)</label>
          <div class="public-key-display">
            <input 
              type="text" 
              class="form-control" 
              :value="config.local_public_key" 
              readonly 
              placeholder="加载配置后显示"
            />
            <button 
              class="btn btn-sm btn-outline" 
              @click="copyPublicKey"
              :disabled="!config.local_public_key"
              title="复制公钥"
            >
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="form-tip">请将此公钥提供给 VPN 服务端管理员以生成对等配置。</div>
        </div>

        <!-- WireGuard 配置 -->
        <div class="config-section">
          <div class="section-title">WireGuard 客户端配置</div>
          
          <div class="info-grid cols-2">
            <div class="form-group">
              <label>服务端地址 (Endpoint) <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-control" 
                v-model="config.endpoint" 
                placeholder="例如: vpn.example.com:51820" 
              />
            </div>
            <div class="form-group">
              <label>服务端公钥 (Peer Public Key) <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-control" 
                v-model="config.peer_public_key" 
                placeholder="Base64 编码的服务端公钥" 
              />
            </div>
          </div>

          <div class="form-group">
            <label>允许的 IP (Allowed IPs) <span class="required">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="config.allowed_ips" 
              placeholder="例如: 0.0.0.0/0 或 10.0.0.0/24" 
            />
            <div class="form-tip">决定哪些流量通过 VPN 隧道。0.0.0.0/0 表示所有流量。</div>
          </div>

          <div class="section-subtitle">高级配置（可选）</div>
          
          <div class="info-grid cols-3">
            <div class="form-group">
              <label>本地地址 (Local Address)</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="config.local_address" 
                placeholder="10.0.0.2/24" 
              />
            </div>
            <div class="form-group">
              <label>监听端口 (Listen Port)</label>
              <input 
                type="number" 
                class="form-control" 
                v-model.number="config.listen_port" 
                placeholder="51820" 
                min="1"
                max="65535"
              />
            </div>
            <div class="form-group">
              <label>MTU</label>
              <input 
                type="number" 
                class="form-control" 
                v-model.number="config.mtu" 
                placeholder="1420" 
                min="576"
                max="9000"
              />
            </div>
          </div>

          <div class="info-grid cols-2">
            <div class="form-group">
              <label>DNS 服务器</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="config.dns" 
                placeholder="8.8.8.8" 
              />
            </div>
            <div class="form-group">
              <label>心跳间隔 (Persistent Keepalive)</label>
              <input 
                type="number" 
                class="form-control" 
                v-model.number="config.persistent_keepalive" 
                placeholder="25" 
                min="0"
                max="65535"
              />
              <div class="form-tip">NAT 环境下建议设置为 25，0 表示禁用。</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="card-footer" style="justify-content: flex-end; gap: 12px">
        <button 
          class="btn btn-outline" 
          @click="refreshStatus"
          :disabled="loading"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          刷新状态
        </button>
        <button 
          class="btn btn-warning" 
          @click="handleRestartVpn"
          :disabled="restarting || !config.enabled"
          title="重启 VPN 服务"
        >
          <i class="fas fa-redo-alt" :class="{ 'fa-spin': restarting }"></i>
          {{ restarting ? '重启中...' : '重启 VPN' }}
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleSave" 
          :disabled="saving || !isFormValid"
        >
          <i class="fas fa-save"></i> 
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getVpnConfig, updateVpnConfig, getVpnStatus, startVpn, stopVpn, restartVpn } from '@/api/network'

export default {
  name: 'VpnConfig',
  data() {
    return {
      loading: false,
      saving: false,
      restarting: false,
      config: {
        enabled: false,
        local_public_key: '',
        endpoint: '',
        peer_public_key: '',
        allowed_ips: '0.0.0.0/0',
        persistent_keepalive: 25,
        dns: '8.8.8.8',
        local_address: '10.0.0.2/24',
        listen_port: 51820,
        mtu: 1420,
      },
      vpnStatusData: {
        status: '',
        interface: '',
        detailed_output: '',
        latest_handshake: '',
        transfer: '',
      },
    }
  },
  computed: {
    vpnStatusClass() {
      if (!this.config.enabled) return 'status-info'
      switch (this.vpnStatusData.status) {
        case 'connected':
          return 'status-normal'
        case 'connecting':
        case 'restarting':
          return 'status-warning'
        case 'disconnected':
        case 'error':
          return 'status-danger'
        default:
          return 'status-info'
      }
    },
    vpnStatusText() {
      if (!this.config.enabled) return '已禁用'
      const statusMap = {
        connected: '已连接',
        connecting: '连接中',
        restarting: '重启中',
        disconnected: '未连接',
        error: '错误',
      }
      return statusMap[this.vpnStatusData.status] || '未知'
    },
    isFormValid() {
      return (
        this.config.endpoint &&
        this.config.peer_public_key &&
        this.config.allowed_ips
      )
    },
  },
  async mounted() {
    // 先加载配置
    await this.loadConfig()
    // 再加载状态，并根据实际状态同步开关
    await this.loadStatus()
  },
  methods: {
    // 加载配置
    async loadConfig() {
      this.loading = true
      try {
        const res = await getVpnConfig()
        
        // 后端返回标准格式：{ code: 200, message: "success", data: {...} }
        if (res.code === 200 && res.data) {
          const vpnData = res.data
          
          // 处理 enabled 字段，确保转换为布尔值
          let enabledValue = vpnData.enabled
          
          // 如果 enabled 是字符串，转换为布尔值
          if (typeof enabledValue === 'string') {
            enabledValue = enabledValue.toLowerCase() === 'true'
          }
          
          // 如果 enabled 未定义或为 null，默认为 false
          if (enabledValue === undefined || enabledValue === null) {
            enabledValue = false
          }
          
          this.config = {
            enabled: enabledValue,
            local_public_key: vpnData.local_public_key || '',
            endpoint: vpnData.endpoint || '',
            peer_public_key: vpnData.peer_public_key || '',
            allowed_ips: vpnData.allowed_ips || '0.0.0.0/0',
            persistent_keepalive: vpnData.persistent_keepalive !== undefined ? vpnData.persistent_keepalive : 25,
            dns: vpnData.dns || '8.8.8.8',
            local_address: vpnData.local_address || '10.0.0.2/24',
            listen_port: vpnData.listen_port || 51820,
            mtu: vpnData.mtu || 1420,
          }
        } else {
          this.$message.error(res.message || '获取配置失败')
        }
      } catch (error) {
        console.error('获取 VPN 配置失败:', error)
        this.$message.error('网络错误，无法获取配置')
      } finally {
        this.loading = false
      }
    },

    // 加载状态
    async loadStatus() {
      try {
        const res = await getVpnStatus()
        
        // 后端返回标准格式：{ code: 200, message: "success", data: {...} }
        if (res.code === 200 && res.data) {
          this.vpnStatusData = res.data
          
          // 根据实际连接状态同步开关
          // 如果实际状态是 connected/connecting，则开关应该打开
          // 如果实际状态是 disconnected/error，则开关应该关闭
          const isConnected = res.data.status === 'connected' || res.data.status === 'connecting'
          
          // 只有当实际状态与配置的 enabled 不一致时，才同步更新
          if (this.config.enabled !== isConnected) {
            console.log('VPN 状态与配置不同步 - 实际状态:', res.data.status, 
                        '配置 enabled:', this.config.enabled, '同步为:', isConnected)
            this.config.enabled = isConnected
          }
        }
      } catch (error) {
        console.error('获取 VPN 状态失败:', error)
      }
    },

    // 刷新状态
    refreshStatus() {
      this.loadStatus()
    },

    // 处理启用/禁用开关变化
    async handleEnabledChange() {
      if (this.config.enabled) {
        // 启用 VPN：先保存配置，再启动
        await this.handleSave(true) // true 表示需要启动
      } else {
        // 禁用 VPN：直接停止
        await this.handleStopVpn()
      }
    },

    // 启动 VPN
    async handleStartVpn() {
      try {
        const res = await startVpn()
        
        // 后端返回标准格式：{ code: 200, message: "success", data: {...} }
        if (res.code === 200) {
          this.$message.success('VPN 启动成功')
          // 延迟刷新状态
          setTimeout(() => {
            this.loadStatus()
          }, 2000)
        } else {
          this.$message.error(res.message || '启动 VPN 失败')
          // 失败时恢复开关状态
          this.config.enabled = false
        }
      } catch (error) {
        console.error('启动 VPN 失败:', error)
        this.$message.error('启动 VPN 失败')
        // 失败时恢复开关状态
        this.config.enabled = false
      }
    },

    // 停止 VPN
    async handleStopVpn() {
      try {
        const res = await stopVpn()
        
        // 后端返回标准格式：{ code: 200, message: "success", data: {...} }
        if (res.code === 200) {
          this.$message.success('VPN 已停止')
          // 延迟刷新状态
          setTimeout(() => {
            this.loadStatus()
          }, 1500)
        } else {
          this.$message.error(res.message || '停止 VPN 失败')
          // 失败时恢复开关状态
          this.config.enabled = true
        }
      } catch (error) {
        console.error('停止 VPN 失败:', error)
        this.$message.error('停止 VPN 失败')
        // 失败时恢复开关状态
        this.config.enabled = true
      }
    },

    // 保存配置
    async handleSave(needStart = false) {
      if (!this.isFormValid) {
        this.$message.warning('请填写必填项')
        return
      }

      this.saving = true
      try {
        const payload = {
          endpoint: this.config.endpoint,
          peer_public_key: this.config.peer_public_key,
          allowed_ips: this.config.allowed_ips,
          persistent_keepalive: this.config.persistent_keepalive,
          dns: this.config.dns,
          local_address: this.config.local_address,
          listen_port: this.config.listen_port,
          mtu: this.config.mtu,
        }

        const res = await updateVpnConfig(payload)
        
        // 后端返回标准格式：{ code: 200, message: "success", data: {...} }
        if (res.code === 200) {
          this.$message.success('配置已保存')
          
          // 如果需要启动 VPN，调用启动接口
          if (needStart) {
            await this.handleStartVpn()
          } else {
            // 否则只刷新状态
            setTimeout(() => {
              this.loadStatus()
            }, 2000)
          }
        } else {
          this.$message.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('保存 VPN 配置失败:', error)
        this.$message.error('网络错误，保存失败')
      } finally {
        this.saving = false
      }
    },

    // 复制公钥
    copyPublicKey() {
      if (!this.config.local_public_key) {
        this.$message.warning('暂无公钥数据')
        return
      }
      
      navigator.clipboard.writeText(this.config.local_public_key).then(() => {
        this.$message.success('公钥已复制到剪贴板')
      }).catch(() => {
        // 降级方案
        const input = document.createElement('input')
        input.value = this.config.local_public_key
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$message.success('公钥已复制到剪贴板')
      })
    },

    // 重启 VPN
    async handleRestartVpn() {
      this.restarting = true
      try {
        const res = await restartVpn()
        
        // 后端返回标准格式：{ code: 200, message: "success", data: {...} }
        if (res.code === 200) {
          this.$message.success('VPN 重启成功')
          // 延迟刷新状态
          setTimeout(() => {
            this.loadStatus()
          }, 2000)
        } else {
          this.$message.error(res.message || '重启 VPN 失败')
        }
      } catch (error) {
        console.error('重启 VPN 失败:', error)
        this.$message.error('重启 VPN 失败')
      } finally {
        this.restarting = false
      }
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

.detailed-status {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #bbf7d0;
}

.status-details {
  margin: 0;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 公钥显示 */
.public-key-display {
  display: flex;
  gap: 8px;
  align-items: center;
}

.public-key-display .form-control {
  flex: 1;
  background-color: #f8f9fa;
  cursor: not-allowed;
}

/* 配置区域 */
.config-section {
  margin-top: 10px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin: 20px 0 12px 0;
}

.required {
  color: #ef4444;
}

.form-tip {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .info-grid.cols-2,
  .info-grid.cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>
