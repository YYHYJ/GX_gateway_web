<template>
  <div class="vpn-config">
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <i class="fas fa-shield-alt"></i>
          VPN 配置管理
        </div>
      </div>

      <div class="card-content">
        <!-- 协议类型选择器 -->
        <div class="protocol-selector">
          <div class="selector-label">选择 VPN 协议类型 <span class="required">*</span></div>
          <div class="selector-buttons">
            <button
              class="protocol-btn"
              :class="{ active: activeProtocol === 'wireguard' }"
              @click="activeProtocol = 'wireguard'"
            >
              <i class="fas fa-shield-alt"></i>
              WireGuard
            </button>
            <button
              class="protocol-btn"
              :class="{ active: activeProtocol === 'openvpn' }"
              @click="activeProtocol = 'openvpn'"
            >
              <i class="fas fa-lock"></i>
              OpenVPN
            </button>
          </div>
        </div>

        <!-- WireGuard 配置区域 -->
        <div v-if="activeProtocol === 'wireguard'" class="config-section">
          <div class="section-title">
            <i class="fas fa-shield-alt"></i>
            WireGuard 客户端配置
          </div>

          <!-- 连接信息（已连接时显示） -->
          <div v-if="wgRunning && wgStatusData.status === 'connected'" class="vpn-connection-info">
            <div class="info-grid cols-2">
              <div class="info-item">
                <div class="info-label">最新握手</div>
                <div class="info-value">{{ wgStatusData.latest_handshake || '无' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">数据传输</div>
                <div class="info-value">{{ wgStatusData.transfer || '无' }}</div>
              </div>
            </div>
            <div v-if="wgStatusData.detailed_output" class="detailed-status">
              <div class="info-label">详细信息</div>
              <pre class="status-details">{{ wgStatusData.detailed_output }}</pre>
            </div>
          </div>

          <!-- 本地公钥显示 -->
          <div class="form-group">
            <label>本地公钥 (Local Public Key)</label>
            <div class="public-key-display">
              <input
                type="text"
                class="form-control"
                :value="wgConfig.local_public_key"
                readonly
                placeholder="加载配置后显示"
              />
              <button
                class="btn btn-sm btn-outline"
                @click="copyPublicKey"
                :disabled="!wgConfig.local_public_key"
                title="复制公钥"
              >
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <div class="form-tip">请将此公钥提供给 VPN 服务端管理员以生成对等配置。</div>
          </div>

          <div class="info-grid cols-2">
            <div class="form-group">
              <label>服务端地址 (Endpoint) <span class="required">*</span></label>
              <input
                type="text"
                class="form-control"
                v-model="wgConfig.endpoint"
                placeholder="例如: vpn.example.com:51820"
              />
            </div>
            <div class="form-group">
              <label>服务端公钥 (Peer Public Key) <span class="required">*</span></label>
              <input
                type="text"
                class="form-control"
                v-model="wgConfig.peer_public_key"
                placeholder="Base64 编码的服务端公钥"
              />
            </div>
          </div>

          <div class="form-group">
            <label>允许的 IP (Allowed IPs) <span class="required">*</span></label>
            <input
              type="text"
              class="form-control"
              v-model="wgConfig.allowed_ips"
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
                v-model="wgConfig.local_address"
                placeholder="10.0.0.2/24"
              />
            </div>
            <div class="form-group">
              <label>监听端口 (Listen Port)</label>
              <input
                type="number"
                class="form-control"
                v-model.number="wgConfig.listen_port"
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
                v-model.number="wgConfig.mtu"
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
                v-model="wgConfig.dns"
                placeholder="8.8.8.8"
              />
            </div>
            <div class="form-group">
              <label>心跳间隔 (Persistent Keepalive)</label>
              <input
                type="number"
                class="form-control"
                v-model.number="wgConfig.persistent_keepalive"
                placeholder="25"
                min="0"
                max="65535"
              />
              <div class="form-tip">NAT 环境下建议设置为 25，0 表示禁用。</div>
            </div>
          </div>

          <!-- WireGuard 操作按钮组 -->
          <div class="action-buttons">
            <button class="btn btn-outline" @click="refreshWgStatus" :disabled="wgLoading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': wgLoading }"></i>
              刷新状态
            </button>
            <button
              class="btn btn-warning"
              @click="handleRestartWg"
              :disabled="wgRestarting || !wgRunning"
            >
              <i class="fas fa-redo-alt" :class="{ 'fa-spin': wgRestarting }"></i>
              {{ wgRestarting ? '重启中...' : '重启 VPN' }}
            </button>
            <button
              class="btn btn-success"
              @click="handleStartWg"
              :disabled="wgStarting || wgRunning"
            >
              <i class="fas fa-play" :class="{ 'fa-spin': wgStarting }"></i>
              {{ wgStarting ? '启动中...' : '启动 VPN' }}
            </button>
            <button class="btn btn-danger" @click="handleStopWg" :disabled="!wgRunning">
              <i class="fas fa-stop"></i>
              停止 VPN
            </button>
            <button
              class="btn btn-primary"
              @click="handleSaveWg"
              :disabled="wgSaving || !wgFormValid"
            >
              <i class="fas fa-save"></i>
              {{ wgSaving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </div>

        <!-- OpenVPN 配置区域（后端 API 集成） -->
        <div v-if="activeProtocol === 'openvpn'" class="config-section">
          <div class="section-title">
            <i class="fas fa-lock"></i>
            OpenVPN 客户端配置
          </div>

          <!-- 连接信息（已连接时显示） -->
          <div v-if="ovpnRunning && ovpnStatusData.status === 'connected'" class="vpn-connection-info">
            <div class="info-grid cols-2">
              <div class="info-item">
                <div class="info-label">网络接口</div>
                <div class="info-value">{{ ovpnStatusData.interface || 'tun0' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">运行时长</div>
                <div class="info-value">{{ formatUptime(ovpnStatusData.uptime_seconds) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">发送数据</div>
                <div class="info-value">{{ formatBytes(ovpnStatusData.bytes_sent) }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">接收数据</div>
                <div class="info-value">{{ formatBytes(ovpnStatusData.bytes_received) }}</div>
              </div>
            </div>
            <div class="info-grid cols-3" style="margin-top: 12px;">
              <div class="info-item">
                <div class="info-label">配置文件</div>
                <div class="info-value">
                  <i :class="ovpnStatusData.config_exists ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'"></i>
                  {{ ovpnStatusData.config_exists ? '存在' : '不存在' }}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">TUN 设备</div>
                <div class="info-value">
                  <i :class="ovpnStatusData.tun_interface ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'"></i>
                  {{ ovpnStatusData.tun_interface ? '正常' : '异常' }}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">VPN 路由</div>
                <div class="info-value">
                  <i :class="ovpnStatusData.vpn_routes ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'"></i>
                  {{ ovpnStatusData.vpn_routes ? '正常' : '异常' }}
                </div>
              </div>
            </div>
          </div>

          <div class="info-grid cols-2">
            <div class="form-group">
              <label>服务器地址 (Remote) <span class="required">*</span></label>
              <input
                type="text"
                class="form-control"
                v-model="ovpnConfig.remote"
                placeholder="例如: vpn.example.com 或 218.90.134.2"
              />
            </div>
            <div class="form-group">
              <label>服务器端口 (Port) <span class="required">*</span></label>
              <input
                type="number"
                class="form-control"
                v-model.number="ovpnConfig.port"
                placeholder="1194"
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div class="info-grid cols-2">
            <div class="form-group">
              <label>协议 (Proto)</label>
              <select class="form-control" v-model="ovpnConfig.proto">
                <option value="udp">UDP</option>
                <option value="tcp">TCP</option>
              </select>
            </div>
            <div class="form-group">
              <label>设备类型 (Dev)</label>
              <select class="form-control" v-model="ovpnConfig.dev">
                <option value="tun">TUN (Layer 3)</option>
                <option value="tap">TAP (Layer 2)</option>
              </select>
            </div>
          </div>

          <div class="section-subtitle">认证配置</div>
          <div class="form-group">
            <label>认证方式</label>
            <select
              class="form-control"
              v-model.number="ovpnConfig.auth_type"
              @change="handleOvpnAuthChange"
            >
              <option :value="0">证书认证（推荐）</option>
              <option :value="1">用户名/密码</option>
              <option :value="2">静态密钥</option>
            </select>
          </div>

          <!-- 证书认证 -->
          <div v-if="ovpnConfig.auth_type === 0">
            <div class="form-group">
              <label>CA 证书 (CA Certificate) <span class="required">*</span></label>
              <textarea
                class="form-control textarea-lg"
                v-model="ovpnConfig.ca_cert"
                rows="6"
                placeholder="-----BEGIN CERTIFICATE-----\n粘贴 CA 证书内容..."
              ></textarea>
            </div>
            <div class="form-group">
              <label>客户端证书 (Client Certificate) <span class="required">*</span></label>
              <textarea
                class="form-control textarea-lg"
                v-model="ovpnConfig.client_cert"
                rows="6"
                placeholder="-----BEGIN CERTIFICATE-----\n粘贴客户端证书内容..."
              ></textarea>
            </div>
            <div class="form-group">
              <label>客户端私钥 (Client Private Key) <span class="required">*</span></label>
              <textarea
                class="form-control textarea-lg"
                v-model="ovpnConfig.client_key"
                rows="6"
                placeholder="-----BEGIN PRIVATE KEY-----\n粘贴客户端私钥内容..."
              ></textarea>
            </div>
          </div>

          <!-- 用户名密码认证 -->
          <div v-if="ovpnConfig.auth_type === 1">
            <div class="info-grid cols-2">
              <div class="form-group">
                <label>用户名 <span class="required">*</span></label>
                <input type="text" class="form-control" v-model="ovpnConfig.username" />
              </div>
              <div class="form-group">
                <label>密码 <span class="required">*</span></label>
                <input type="password" class="form-control" v-model="ovpnConfig.password" />
              </div>
            </div>
            <div class="form-group">
              <label>CA 证书 (可选，建议提供)</label>
              <textarea
                class="form-control textarea-lg"
                v-model="ovpnConfig.ca_cert"
                rows="4"
                placeholder="-----BEGIN CERTIFICATE-----\n粘贴 CA 证书内容（用于 TLS 加密通道）..."
              ></textarea>
            </div>
          </div>

          <!-- 静态密钥认证 -->
          <div v-if="ovpnConfig.auth_type === 2">
            <div class="form-group">
              <label>共享密钥 (Static Key) <span class="required">*</span></label>
              <textarea
                class="form-control textarea-lg"
                v-model="ovpnConfig.tls_auth"
                rows="8"
                placeholder="-----BEGIN OpenVPN Static key V1-----\n粘贴 2048 位静态密钥..."
              ></textarea>
            </div>
            <div class="form-group">
              <label>密钥方向 (Key Direction)</label>
              <select class="form-control" v-model.number="ovpnConfig.key_direction">
                <option :value="-1">自动检测</option>
                <option :value="0">方向 0</option>
                <option :value="1">方向 1</option>
              </select>
              <div class="form-tip">如果不确定，请选择"自动检测"。</div>
            </div>
          </div>

          <div class="section-subtitle">高级配置（可选）</div>
          <div class="info-grid cols-2">
            <div class="form-group">
              <label>加密算法 (Cipher)</label>
              <select class="form-control" v-model="ovpnConfig.cipher">
                <option value="">默认 (AES-256-CBC)</option>
                <option value="AES-256-GCM">AES-256-GCM</option>
                <option value="AES-128-GCM">AES-128-GCM</option>
                <option value="AES-256-CBC">AES-256-CBC</option>
                <option value="AES-128-CBC">AES-128-CBC</option>
              </select>
            </div>
            <div class="form-group">
              <label>保活间隔 (Keepalive)</label>
              <input
                type="text"
                class="form-control"
                v-model="ovpnConfig.keepalive"
                placeholder="10 120"
              />
            </div>
          </div>
          <div class="form-group">
            <label>TLS 认证密钥 (TLS Auth, 可选)</label>
            <textarea
              class="form-control textarea-lg"
              v-model="ovpnConfig.tls_auth"
              rows="4"
              placeholder="-----BEGIN OpenVPN Static key V1-----\n可选：粘贴 TLS 认证密钥（增强安全性）..."
            ></textarea>
          </div>

          <!-- OpenVPN 操作按钮组 -->
          <div class="action-buttons">
            <button class="btn btn-outline" @click="refreshOvpnStatus" :disabled="ovpnLoading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': ovpnLoading }"></i>
              刷新状态
            </button>
            <button
              class="btn btn-warning"
              @click="handleRestartOvpn"
              :disabled="ovpnRestarting || !ovpnRunning"
            >
              <i class="fas fa-redo-alt" :class="{ 'fa-spin': ovpnRestarting }"></i>
              {{ ovpnRestarting ? '重启中...' : '重启 VPN' }}
            </button>
            <button
              class="btn btn-success"
              @click="handleStartOvpn"
              :disabled="ovpnStarting || ovpnRunning"
            >
              <i class="fas fa-play" :class="{ 'fa-spin': ovpnStarting }"></i>
              {{ ovpnStarting ? '启动中...' : '启动 VPN' }}
            </button>
            <button class="btn btn-danger" @click="handleStopOvpn" :disabled="!ovpnRunning">
              <i class="fas fa-stop"></i>
              停止 VPN
            </button>
            <button
              class="btn btn-primary"
              @click="handleSaveOvpn"
              :disabled="ovpnSaving || !ovpnFormValid"
            >
              <i class="fas fa-save"></i>
              {{ ovpnSaving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getVpnConfig,
  updateVpnConfig,
  getVpnStatus,
  startVpn,
  stopVpn,
  restartVpn,
  getOpenVpnConfig,
  updateOpenVpnConfig,
  getOpenVpnStatus,
  startOpenVpn,
  stopOpenVpn,
  restartOpenVpn,
} from '@/api/network'

export default {
  name: 'VpnConfig',
  data() {
    return {
      // 当前选中的协议
      activeProtocol: 'wireguard', // 'wireguard' | 'openvpn'

      // ---------- WireGuard 相关数据（与原 API 完全一致）----------
      wgLoading: false,
      wgSaving: false,
      wgStarting: false,
      wgRestarting: false,
      wgRunning: false, // 当前是否已连接/运行中
      wgConfig: {
        enabled: false, // 保留字段，但不再用于 UI 开关，仅用于内部状态同步
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
      wgStatusData: {
        status: '',
        interface: '',
        detailed_output: '',
        latest_handshake: '',
        transfer: '',
      },

      // ---------- OpenVPN 配置（后端 API 集成）----------
      ovpnLoading: false,
      ovpnSaving: false,
      ovpnStarting: false,
      ovpnRestarting: false,
      ovpnRunning: false,
      ovpnConfig: {
        is_initialized: true,
        is_configured: false,
        remote: '',
        port: 1194,
        proto: 'udp',
        dev: 'tun',
        cipher: 'AES-256-CBC',
        keepalive: '10 120',
        auth_type: 0, // 0=证书认证, 1=用户名密码, 2=静态密钥
        key_direction: -1,
        enabled: true,
        username: '',
        password: '',
        ca_cert: '',
        client_cert: '',
        client_key: '',
        tls_auth: '',
        extra_options: '',
        comp_lzo: 'no',
      },
      ovpnStatusData: {
        status: '',
        config_exists: false,
        process_running: false,
        tun_interface: false,
        data_transfer: false,
        vpn_routes: false,
        interface: '',
        uptime_seconds: 0,
        bytes_sent: 0,
        bytes_received: 0,
      },
    }
  },

  computed: {
    // WireGuard 表单是否有效
    wgFormValid() {
      return this.wgConfig.endpoint && this.wgConfig.peer_public_key && this.wgConfig.allowed_ips
    },

    // OpenVPN 表单是否有效（根据认证类型校验必填项）
    ovpnFormValid() {
      if (!this.ovpnConfig.remote || !this.ovpnConfig.port) return false
      
      if (this.ovpnConfig.auth_type === 0) {
        // 证书认证
        return (
          this.ovpnConfig.ca_cert &&
          this.ovpnConfig.client_cert &&
          this.ovpnConfig.client_key
        )
      } else if (this.ovpnConfig.auth_type === 1) {
        // 用户名密码认证
        return this.ovpnConfig.username && this.ovpnConfig.password
      } else if (this.ovpnConfig.auth_type === 2) {
        // 静态密钥认证
        return !!this.ovpnConfig.tls_auth
      }
      return false
    },
  },

  async mounted() {
    // 加载 WireGuard 配置（原逻辑）
    await this.loadWgConfig()
    // 加载 WireGuard 状态
    await this.refreshWgStatus()
    
    // 定期刷新 WireGuard 状态（可选）
    this.statusInterval = setInterval(() => {
      if (this.activeProtocol === 'wireguard') {
        this.refreshWgStatus()
      }
    }, 5000)

    // 加载 OpenVPN 配置和状态
    await this.loadOvpnConfig()
    await this.refreshOvpnStatus()
  },

  beforeUnmount() {
    if (this.statusInterval) clearInterval(this.statusInterval)
  },

  methods: {
    // ==================== WireGuard 原有逻辑（完全保留原接口） ====================
    async loadWgConfig() {
      this.wgLoading = true
      try {
        const res = await getVpnConfig()
        if (res.code === 200 && res.data) {
          const data = res.data
          let enabledVal = data.enabled
          if (typeof enabledVal === 'string') enabledVal = enabledVal.toLowerCase() === 'true'
          if (enabledVal === undefined) enabledVal = false
          this.wgConfig = {
            enabled: enabledVal,
            local_public_key: data.local_public_key || '',
            endpoint: data.endpoint || '',
            peer_public_key: data.peer_public_key || '',
            allowed_ips: data.allowed_ips || '0.0.0.0/0',
            persistent_keepalive: data.persistent_keepalive ?? 25,
            dns: data.dns || '8.8.8.8',
            local_address: data.local_address || '10.0.0.2/24',
            listen_port: data.listen_port || 51820,
            mtu: data.mtu || 1420,
          }
          // 根据 enabled 更新运行状态标识
          this.wgRunning = this.wgConfig.enabled
        } else {
          this.$message.error(res.message || '获取 WireGuard 配置失败')
        }
      } catch (error) {
        console.error('获取 WireGuard 配置失败:', error)
        this.$message.error('网络错误，无法获取配置')
      } finally {
        this.wgLoading = false
      }
    },

    async refreshWgStatus() {
      try {
        const res = await getVpnStatus()
        if (res.code === 200 && res.data) {
          this.wgStatusData = res.data
          const isConnected = res.data.status === 'connected' || res.data.status === 'connecting'
          this.wgRunning = isConnected
          // 注意：不再使用全局 enabled 开关，仅保持内部标志
        }
      } catch (error) {
        console.error('获取 VPN 状态失败:', error)
      }
    },

    async handleStartWg() {
      this.wgStarting = true
      try {
        const res = await startVpn()
        if (res.code === 200) {
          this.$message.success('WireGuard 启动成功')
          setTimeout(() => this.refreshWgStatus(), 2000)
        } else {
          this.$message.error(res.message || '启动失败')
        }
      } catch (error) {
        console.error('启动失败:', error)
        this.$message.error('启动失败')
      } finally {
        this.wgStarting = false
      }
    },

    async handleStopWg() {
      try {
        const res = await stopVpn()
        if (res.code === 200) {
          this.$message.success('WireGuard 已停止')
          setTimeout(() => this.refreshWgStatus(), 1500)
        } else {
          this.$message.error(res.message || '停止失败')
        }
      } catch (error) {
        console.error('停止失败:', error)
        this.$message.error('停止失败')
      }
    },

    async handleRestartWg() {
      this.wgRestarting = true
      try {
        const res = await restartVpn()
        if (res.code === 200) {
          this.$message.success('WireGuard 重启成功')
          setTimeout(() => this.refreshWgStatus(), 2000)
        } else {
          this.$message.error(res.message || '重启失败')
        }
      } catch (error) {
        console.error('重启失败:', error)
        this.$message.error('重启失败')
      } finally {
        this.wgRestarting = false
      }
    },

    async handleSaveWg() {
      if (!this.wgFormValid) {
        this.$message.warning('请填写必填项')
        return
      }
      this.wgSaving = true
      try {
        const payload = {
          endpoint: this.wgConfig.endpoint,
          peer_public_key: this.wgConfig.peer_public_key,
          allowed_ips: this.wgConfig.allowed_ips,
          persistent_keepalive: this.wgConfig.persistent_keepalive,
          dns: this.wgConfig.dns,
          local_address: this.wgConfig.local_address,
          listen_port: this.wgConfig.listen_port,
          mtu: this.wgConfig.mtu,
        }
        const res = await updateVpnConfig(payload)
        if (res.code === 200) {
          this.$message.success('WireGuard 配置已保存')
          // 重新加载配置以刷新公钥等
          await this.loadWgConfig()
        } else {
          this.$message.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败')
      } finally {
        this.wgSaving = false
      }
    },

    copyPublicKey() {
      if (!this.wgConfig.local_public_key) {
        this.$message.warning('暂无公钥数据')
        return
      }
      navigator.clipboard
        .writeText(this.wgConfig.local_public_key)
        .then(() => this.$message.success('公钥已复制'))
        .catch(() => {
          const input = document.createElement('input')
          input.value = this.wgConfig.local_public_key
          document.body.appendChild(input)
          input.select()
          document.execCommand('copy')
          document.body.removeChild(input)
          this.$message.success('公钥已复制')
        })
    },

    // ==================== OpenVPN 后端 API 集成逻辑 ====================
    
    /**
     * 加载 OpenVPN 配置
     */
    async loadOvpnConfig() {
      this.ovpnLoading = true
      try {
        const res = await getOpenVpnConfig()
        if (res.code === 200 && res.data) {
          const data = res.data
          this.ovpnConfig = {
            is_initialized: data.is_initialized ?? true,
            is_configured: data.is_configured ?? false,
            remote: data.remote || '',
            port: data.port || 1194,
            proto: data.proto || 'udp',
            dev: data.dev || 'tun',
            cipher: data.cipher || 'AES-256-CBC',
            keepalive: data.keepalive || '10 120',
            auth_type: data.auth_type ?? 0,
            key_direction: data.key_direction ?? -1,
            enabled: data.enabled ?? true,
            username: data.username || '',
            password: data.password || '',
            ca_cert: data.ca_cert || '',
            client_cert: data.client_cert || '',
            client_key: data.client_key || '',
            tls_auth: data.tls_auth || '',
            extra_options: '', // 额外选项不在后端返回，保留前端字段
            comp_lzo: 'no', // 压缩算法不在后端返回，保留前端字段
          }
          // 根据 enabled 更新运行状态标识
          this.ovpnRunning = this.ovpnConfig.enabled
        } else {
          this.$message.error(res.message || '获取 OpenVPN 配置失败')
        }
      } catch (error) {
        console.error('获取 OpenVPN 配置失败:', error)
        this.$message.error('网络错误，无法获取 OpenVPN 配置')
      } finally {
        this.ovpnLoading = false
      }
    },

    /**
     * 刷新 OpenVPN 状态
     */
    async refreshOvpnStatus() {
      try {
        const res = await getOpenVpnStatus()
        if (res.code === 200 && res.data) {
          this.ovpnStatusData = res.data
          const isConnected = res.data.status === 'connected' || res.data.status === 'connecting'
          this.ovpnRunning = isConnected
        }
      } catch (error) {
        console.error('获取 OpenVPN 状态失败:', error)
      }
    },

    /**
     * 处理认证方式变更
     */
    handleOvpnAuthChange() {
      // 切换认证类型时清空无关字段
      if (this.ovpnConfig.auth_type === 0) {
        // 证书认证
        this.ovpnConfig.username = ''
        this.ovpnConfig.password = ''
      } else if (this.ovpnConfig.auth_type === 1) {
        // 用户名密码认证
        this.ovpnConfig.client_cert = ''
        this.ovpnConfig.client_key = ''
      } else if (this.ovpnConfig.auth_type === 2) {
        // 静态密钥认证
        this.ovpnConfig.username = ''
        this.ovpnConfig.password = ''
        this.ovpnConfig.ca_cert = ''
        this.ovpnConfig.client_cert = ''
        this.ovpnConfig.client_key = ''
      }
    },

    /**
     * 保存 OpenVPN 配置
     */
    async handleSaveOvpn() {
      if (!this.ovpnFormValid) {
        this.$message.warning('请填写 OpenVPN 必填项')
        return
      }

      this.ovpnSaving = true
      try {
        const payload = {
          remote: this.ovpnConfig.remote,
          port: this.ovpnConfig.port,
          proto: this.ovpnConfig.proto,
          dev: this.ovpnConfig.dev,
          auth_type: this.ovpnConfig.auth_type,
          cipher: this.ovpnConfig.cipher,
          keepalive: this.ovpnConfig.keepalive,
        }

        // 根据认证类型添加对应字段
        if (this.ovpnConfig.auth_type === 0) {
          // 证书认证
          payload.ca_cert = this.ovpnConfig.ca_cert
          payload.client_cert = this.ovpnConfig.client_cert
          payload.client_key = this.ovpnConfig.client_key
        } else if (this.ovpnConfig.auth_type === 1) {
          // 用户名密码认证
          payload.username = this.ovpnConfig.username
          payload.password = this.ovpnConfig.password
          if (this.ovpnConfig.ca_cert) {
            payload.ca_cert = this.ovpnConfig.ca_cert
          }
        } else if (this.ovpnConfig.auth_type === 2) {
          // 静态密钥认证
          payload.tls_auth = this.ovpnConfig.tls_auth
          if (this.ovpnConfig.key_direction !== -1) {
            payload.key_direction = this.ovpnConfig.key_direction
          }
        }

        const res = await updateOpenVpnConfig(payload)
        if (res.code === 200) {
          this.$message.success('OpenVPN 配置已保存')
          // 重新加载配置
          await this.loadOvpnConfig()
        } else {
          this.$message.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('保存 OpenVPN 配置失败:', error)
        this.$message.error('保存失败')
      } finally {
        this.ovpnSaving = false
      }
    },

    /**
     * 启动 OpenVPN
     */
    async handleStartOvpn() {
      this.ovpnStarting = true
      try {
        const res = await startOpenVpn()
        if (res.code === 200) {
          this.$message.success('OpenVPN 启动成功')
          setTimeout(() => this.refreshOvpnStatus(), 2000)
        } else {
          this.$message.error(res.message || '启动失败')
        }
      } catch (error) {
        console.error('启动 OpenVPN 失败:', error)
        this.$message.error('启动失败')
      } finally {
        this.ovpnStarting = false
      }
    },

    /**
     * 停止 OpenVPN
     */
    async handleStopOvpn() {
      try {
        const res = await stopOpenVpn()
        if (res.code === 200) {
          this.$message.success('OpenVPN 已停止')
          setTimeout(() => this.refreshOvpnStatus(), 3000) // 停止需要更长时间
        } else {
          this.$message.error(res.message || '停止失败')
        }
      } catch (error) {
        console.error('停止 OpenVPN 失败:', error)
        this.$message.error('停止失败')
      }
    },

    /**
     * 重启 OpenVPN
     */
    async handleRestartOvpn() {
      this.ovpnRestarting = true
      try {
        const res = await restartOpenVpn()
        if (res.code === 200) {
          this.$message.success('OpenVPN 重启成功')
          setTimeout(() => this.refreshOvpnStatus(), 2000)
        } else {
          this.$message.error(res.message || '重启失败')
        }
      } catch (error) {
        console.error('重启 OpenVPN 失败:', error)
        this.$message.error('重启失败')
      } finally {
        this.ovpnRestarting = false
      }
    },

    /**
     * 格式化字节数为可读格式
     */
    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    /**
     * 格式化时间为可读格式
     */
    formatUptime(seconds) {
      if (!seconds || seconds === 0) return '0秒'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else if (minutes > 0) {
        return `${minutes}分钟${secs}秒`
      } else {
        return `${secs}秒`
      }
    },
  },
}
</script>

<style scoped>
/* 原样式 + 参考第二个文件的补充样式 */
.vpn-config {
  width: 100%;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-content {
  padding: 24px;
}
.protocol-selector {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
.selector-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}
.required {
  color: #ff4d4f;
}
.selector-buttons {
  display: flex;
  gap: 12px;
}
.protocol-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #d9d9d9;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.protocol-btn.active {
  border-color: #1890ff;
  background: #e6f7ff;
  color: #1890ff;
}
.config-section {
  margin-top: 10px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #1890ff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-subtitle {
  font-size: 14px;
  font-weight: 500;
  margin: 20px 0 12px 0;
  color: #595959;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
  font-weight: 500;
  color: #262626;
}
.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}
.form-control:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
.form-control[readonly] {
  background: #f5f5f5;
  cursor: not-allowed;
}
.textarea-lg {
  resize: vertical;
  min-height: 80px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}
.form-tip {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}
.info-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}
.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.public-key-display {
  display: flex;
  gap: 8px;
}
.public-key-display .form-control {
  flex: 1;
}
.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
.btn-primary {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}
.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}
.btn-success {
  background: #52c41a;
  color: white;
  border-color: #52c41a;
}
.btn-success:hover:not(:disabled) {
  background: #73d13d;
}
.btn-danger {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}
.btn-danger:hover:not(:disabled) {
  background: #ff7875;
}
.btn-warning {
  background: #faad14;
  color: white;
  border-color: #faad14;
}
.btn-warning:hover:not(:disabled) {
  background: #ffc53d;
}
.btn-outline {
  background: white;
  color: #595959;
  border-color: #d9d9d9;
}
.btn-outline:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
}
.action-buttons {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
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
.fa-spin {
  animation: fa-spin 1s infinite linear;
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.text-success {
  color: #52c41a;
}
.text-danger {
  color: #ff4d4f;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}
.info-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}
@media (max-width: 768px) {
  .cols-2,
  .cols-3 {
    grid-template-columns: 1fr;
  }
  .selector-buttons {
    flex-direction: column;
  }
  .action-buttons {
    flex-direction: column;
  }
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
