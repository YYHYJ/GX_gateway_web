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
            <div style="display: flex; align-items: center; gap: 12px">
              <strong>当前协议：</strong>
              <span>{{ activeProtocol || '未配置' }}</span>
            </div>
          </div>
          <div v-if="!activeProtocol" class="protocol-hint">
            <i class="fas fa-info-circle"></i>
            请先选择一个 VPN 协议类型以继续配置
          </div>
          <!-- 前端显示控制（纯前端，与后端无关） -->
          <div
            class="ui-display-controls"
            style="margin-top: 12px; display: flex; gap: 12px; align-items: center"
          >
            <label style="display: flex; align-items: center; gap: 8px">
              <input type="checkbox" v-model="uiShowProtocolPanel" />
              在前端显示协议配置
            </label>
            <div style="display: flex; align-items: center; gap: 8px">
              <div>显示协议：</div>
              <select class="form-control" v-model="uiDisplayedProtocol" style="width: 160px">
                <option value="">跟随已选协议</option>
                <option value="wireguard">WireGuard</option>
                <option value="openvpn">OpenVPN</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 配置表单区域（受前端显示开关控制） -->
        <div v-if="uiShowProtocolPanel && displayedProtocol" class="config-form-container">
          <!-- WireGuard 配置 -->
          <div v-if="displayedProtocol === 'wireguard'" class="config-section">
            <div class="section-title">
              <i class="fas fa-shield-alt"></i>
              WireGuard 客户端配置
            </div>

            <!-- 本地公钥显示 -->
            <div class="form-group">
              <label>本地公钥 (Local Public Key)</label>
              <div class="public-key-display">
                <input
                  type="text"
                  class="form-control"
                  :value="modules.wireguard.local_public_key"
                  readonly
                  placeholder="加载配置后显示"
                />
                <button
                  class="btn btn-sm btn-outline"
                  @click="copyPublicKey"
                  :disabled="!modules.wireguard.local_public_key"
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
                  v-model="modules.wireguard.endpoint"
                  placeholder="例如: vpn.example.com:51820"
                />
              </div>
              <div class="form-group">
                <label>服务端公钥 (Peer Public Key) <span class="required">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  v-model="modules.wireguard.peer_public_key"
                  placeholder="Base64 编码的服务端公钥"
                />
              </div>
            </div>

            <div class="form-group">
              <label>允许的 IP (Allowed IPs) <span class="required">*</span></label>
              <input
                type="text"
                class="form-control"
                v-model="modules.wireguard.allowed_ips"
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
                  v-model="modules.wireguard.local_address"
                  placeholder="10.0.0.2/24"
                />
              </div>
              <div class="form-group">
                <label>监听端口 (Listen Port)</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="modules.wireguard.listen_port"
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
                  v-model.number="modules.wireguard.mtu"
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
                  v-model="modules.wireguard.dns"
                  placeholder="8.8.8.8"
                />
              </div>
              <div class="form-group">
                <label>心跳间隔 (Persistent Keepalive)</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="modules.wireguard.persistent_keepalive"
                  placeholder="25"
                  min="0"
                  max="65535"
                />
                <div class="form-tip">NAT 环境下建议设置为 25，0 表示禁用。</div>
              </div>
            </div>
          </div>

          <!-- OpenVPN 配置 -->
          <div v-if="displayedProtocol === 'openvpn'" class="config-section">
            <div class="section-title">
              <i class="fas fa-lock"></i>
              OpenVPN 客户端配置
            </div>

            <div class="info-grid cols-2">
              <div class="form-group">
                <label>服务器地址 (Remote) <span class="required">*</span></label>
                <input
                  type="text"
                  class="form-control"
                  v-model="modules.openvpn.remote"
                  placeholder="例如: 218.90.134.2"
                />
              </div>
              <div class="form-group">
                <label>服务器端口 (Port) <span class="required">*</span></label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="modules.openvpn.port"
                  placeholder="11940"
                  min="1"
                  max="65535"
                />
              </div>
            </div>

            <div class="info-grid cols-2">
              <div class="form-group">
                <label>协议 (Proto)</label>
                <select class="form-control" v-model="modules.openvpn.proto">
                  <option value="udp">UDP</option>
                  <option value="tcp">TCP</option>
                </select>
              </div>
              <div class="form-group">
                <label>设备类型 (Dev)</label>
                <select class="form-control" v-model="modules.openvpn.dev">
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
                v-model="modules.openvpn.auth_type"
                @change="handleAuthTypeChange"
              >
                <option value="cert">证书认证（推荐）</option>
                <option value="userpass">用户名/密码</option>
                <option value="static">静态密钥</option>
              </select>
            </div>

            <!-- 证书认证 -->
            <div v-if="modules.openvpn.auth_type === 'cert'">
              <div class="form-group">
                <label>CA 证书 (CA Certificate) <span class="required">*</span></label>
                <textarea
                  class="form-control textarea-lg"
                  v-model="modules.openvpn.ca_cert"
                  rows="6"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;粘贴 CA 证书内容..."
                ></textarea>
                <div class="form-tip">用于验证服务器证书的根证书。</div>
              </div>

              <div class="form-group">
                <label>客户端证书 (Client Certificate) <span class="required">*</span></label>
                <textarea
                  class="form-control textarea-lg"
                  v-model="modules.openvpn.client_cert"
                  rows="6"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;粘贴客户端证书内容..."
                ></textarea>
              </div>

              <div class="form-group">
                <label>客户端私钥 (Client Private Key) <span class="required">*</span></label>
                <textarea
                  class="form-control textarea-lg"
                  v-model="modules.openvpn.client_key"
                  rows="6"
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;粘贴客户端私钥内容..."
                ></textarea>
                <div class="form-tip">请妥善保管私钥，不要泄露。</div>
              </div>
            </div>

            <!-- 用户名密码认证 -->
            <div v-if="modules.openvpn.auth_type === 'userpass'">
              <div class="info-grid cols-2">
                <div class="form-group">
                  <label>用户名 (Username) <span class="required">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="modules.openvpn.username"
                    placeholder="输入用户名"
                  />
                </div>
                <div class="form-group">
                  <label>密码 (Password) <span class="required">*</span></label>
                  <input
                    type="password"
                    class="form-control"
                    v-model="modules.openvpn.password"
                    placeholder="输入密码"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>CA 证书 (可选，推荐提供)</label>
                <textarea
                  class="form-control textarea-lg"
                  v-model="modules.openvpn.ca_cert"
                  rows="4"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;粘贴 CA 证书内容（用于 TLS 加密通道）..."
                ></textarea>
                <div class="form-tip">虽然不是必需，但建议提供 CA 证书以启用 TLS 加密通道。</div>
              </div>
            </div>

            <!-- 静态密钥认证 -->
            <div v-if="modules.openvpn.auth_type === 'static'">
              <div class="form-group">
                <label>共享密钥 (Static Key) <span class="required">*</span></label>
                <textarea
                  class="form-control textarea-lg"
                  v-model="modules.openvpn.tls_auth"
                  rows="8"
                  placeholder="-----BEGIN OpenVPN Static key V1-----&#10;粘贴 2048 位静态密钥..."
                ></textarea>
                <div class="form-tip">请粘贴完整的 2048 位 OpenVPN 静态密钥。</div>
              </div>
            </div>

            <div class="section-subtitle">高级配置（可选）</div>

            <div class="info-grid cols-2">
              <div class="form-group">
                <label>加密算法 (Cipher)</label>
                <select class="form-control" v-model="modules.openvpn.cipher">
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
                  v-model="modules.openvpn.keepalive"
                  placeholder="10 120"
                />
                <div class="form-tip">格式: "ping间隔 ping超时"，默认: 10 120</div>
              </div>
            </div>

            <div class="info-grid cols-2">
              <div class="form-group">
                <label>TLS 认证密钥 (TLS Auth)</label>
                <textarea
                  class="form-control textarea-lg"
                  v-model="modules.openvpn.tls_auth"
                  rows="4"
                  placeholder="-----BEGIN OpenVPN Static key V1-----&#10;可选：粘贴 TLS 认证密钥（增强安全性）..."
                ></textarea>
                <div class="form-tip">
                  增强安全性，防止 DoS 攻击（证书认证和用户名密码认证时可额外添加）。
                </div>
              </div>
              <div class="form-group">
                <label>压缩算法 (Comp-LZO)</label>
                <select class="form-control" v-model="modules.openvpn.comp_lzo">
                  <option value="no">禁用</option>
                  <option value="yes">启用 LZO</option>
                  <option value="adaptive">自适应</option>
                </select>
              </div>
            </div>

            <div class="info-grid cols-2">
              <div class="form-group">
                <label>MTU</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="modules.openvpn.mtu"
                  placeholder="1500"
                  min="576"
                  max="9000"
                />
              </div>
            </div>

            <div class="form-group">
              <label>额外配置选项 (Extra Options)</label>
              <textarea
                class="form-control textarea-lg"
                v-model="modules.openvpn.extra_options"
                rows="3"
                placeholder="每行一个配置项，例如:&#10;persist-tun&#10;persist-key&#10;verb 3"
              ></textarea>
              <div class="form-tip">可添加其他 OpenVPN 配置项，每行一个。</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="card-footer">
        <button
          class="btn btn-primary"
          @click="handleSaveConfig"
          :disabled="saving || !activeProtocol || !isFormValid"
        >
          <i class="fas fa-save"></i>
          {{ saving ? '保存中...' : '保存配置' }}
        </button>

        <button
          class="btn btn-success"
          @click="handleStartVpn"
          :disabled="!configSaved || starting"
          :title="!configSaved ? '请先保存配置' : ''"
        >
          <i class="fas fa-play" :class="{ 'fa-spin': starting }"></i>
          {{ starting ? '启动中...' : '启动 VPN' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getVpnConfig, updateVpnConfig, startVpn } from '@/api/network'

export default {
  name: 'VpnConfig',
  data() {
    return {
      loading: false,
      saving: false,
      starting: false,
      switchingProtocol: false,
      // 仅用于前端显示控制（与后端无关）
      uiShowProtocolPanel: true, // 前端是否显示协议配置区域
      uiDisplayedProtocol: '', // 前端选择显示哪个协议（空=跟随已选协议）

      // 协议选择状态
      activeProtocol: '', // 当前选择的协议: '' | 'wireguard' | 'openvpn'
      configSaved: false, // 配置是否已保存

      // 协议模块配置 (完全独立)
      modules: {
        wireguard: {
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
        openvpn: {
          remote: '',
          port: 1194,
          proto: 'udp',
          dev: 'tun',
          auth_type: 'cert',
          ca_cert: '',
          client_cert: '',
          client_key: '',
          username: '',
          password: '',
          cipher: '',
          auth: '',
          tls_auth: '',
          keepalive: '10 120',
          comp_lzo: 'no',
          mtu: 1500,
          extra_options: '',
        },
      },
    }
  },
  computed: {
    isFormValid() {
      if (!this.activeProtocol) return false

      if (this.activeProtocol === 'wireguard') {
        return (
          this.modules.wireguard.endpoint &&
          this.modules.wireguard.peer_public_key &&
          this.modules.wireguard.allowed_ips
        )
      } else if (this.activeProtocol === 'openvpn') {
        // OpenVPN 验证
        const basicValid = this.modules.openvpn.remote && this.modules.openvpn.port

        if (!basicValid) return false

        // 根据认证方式验证
        if (this.modules.openvpn.auth_type === 'cert') {
          return (
            this.modules.openvpn.ca_cert &&
            this.modules.openvpn.client_cert &&
            this.modules.openvpn.client_key
          )
        } else if (this.modules.openvpn.auth_type === 'userpass') {
          return this.modules.openvpn.username && this.modules.openvpn.password
        } else if (this.modules.openvpn.auth_type === 'static') {
          return this.modules.openvpn.tls_auth
        }

        return true
      }

      return false
    },
    // 前端用于显示的协议：优先使用 uiDisplayedProtocol，否则回退到 activeProtocol
    displayedProtocol() {
      return this.uiDisplayedProtocol || this.activeProtocol
    },
  },
  async mounted() {
    // 页面加载时获取配置
    await this.loadConfig()
  },
  methods: {
    // ========== 配置管理方法 ==========

    /**
     * 加载配置 - 从后端获取完整配置数据
     */
    async loadConfig() {
      this.loading = true
      try {
        const res = await getVpnConfig()

        if (res.code === 200 && res.data) {
          const vpnData = res.data

          // 设置当前协议类型
          this.activeProtocol = vpnData.protocol_type || ''

          // 加载 WireGuard 模块配置
          if (vpnData.wireguard) {
            this.modules.wireguard = {
              local_public_key: vpnData.wireguard.local_public_key || '',
              endpoint: vpnData.wireguard.endpoint || '',
              peer_public_key: vpnData.wireguard.peer_public_key || '',
              allowed_ips: vpnData.wireguard.allowed_ips || '0.0.0.0/0',
              persistent_keepalive:
                vpnData.wireguard.persistent_keepalive !== undefined
                  ? vpnData.wireguard.persistent_keepalive
                  : 25,
              dns: vpnData.wireguard.dns || '8.8.8.8',
              local_address: vpnData.wireguard.local_address || '10.0.0.2/24',
              listen_port: vpnData.wireguard.listen_port || 51820,
              mtu: vpnData.wireguard.mtu || 1420,
            }
          }

          // 加载 OpenVPN 模块配置
          if (vpnData.openvpn) {
            this.modules.openvpn = {
              remote: vpnData.openvpn.remote || '',
              port: vpnData.openvpn.port || 1194,
              proto: vpnData.openvpn.proto || 'udp',
              dev: vpnData.openvpn.dev || 'tun',
              auth_type: vpnData.openvpn.auth_type || 'cert',
              ca_cert: vpnData.openvpn.ca_cert || '',
              client_cert: vpnData.openvpn.client_cert || '',
              client_key: vpnData.openvpn.client_key || '',
              username: vpnData.openvpn.username || '',
              password: vpnData.openvpn.password || '',
              cipher: vpnData.openvpn.cipher || '',
              auth: vpnData.openvpn.auth || '',
              tls_auth: vpnData.openvpn.tls_auth || '',
              keepalive: vpnData.openvpn.keepalive || '10 120',
              comp_lzo: vpnData.openvpn.comp_lzo || 'no',
              mtu: vpnData.openvpn.mtu || 1500,
              extra_options: vpnData.openvpn.extra_options || '',
            }
          }

          // 如果已有协议选择，标记配置已加载（但不代表已保存）
          if (this.activeProtocol) {
            this.configSaved = false // 需要用户手动保存
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

    /**
     * 处理协议选择
     */
    async handleProtocolSelect(protocol) {
      // 如果点击的是当前已选中的协议，不做任何操作
      if (this.activeProtocol === protocol) {
        return
      }

      // 如果当前有未保存的配置，提示用户
      if (this.activeProtocol && !this.configSaved) {
        const confirmed = confirm('当前配置尚未保存，切换协议将丢失未保存的更改，是否继续？')
        if (!confirmed) {
          return
        }
      }

      this.switchingProtocol = true
      try {
        // 先获取当前完整配置
        const configRes = await getVpnConfig()

        if (configRes.code !== 200 || !configRes.data) {
          this.$message.error('获取配置失败，无法切换协议')
          return
        }

        // 构建新的配置对象（保留所有现有配置，只修改 protocol_type）
        const newConfig = {
          protocol_type: protocol,
          enabled: false, // 默认不启用
        }

        // 根据目标协议，添加对应的配置对象
        if (protocol === 'wireguard') {
          newConfig.wireguard = configRes.data.wireguard || { ...this.modules.wireguard }
        } else if (protocol === 'openvpn') {
          newConfig.openvpn = configRes.data.openvpn || { ...this.modules.openvpn }
        }

        // 提交完整配置
        const res = await updateVpnConfig(newConfig)

        if (res.code === 200) {
          // 更新本地状态
          this.activeProtocol = protocol
          this.configSaved = true // 切换协议后视为已保存

          this.$message.success(
            `已切换到 ${protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'} 协议`,
          )

          // 重新加载配置
          await this.loadConfig()
        } else {
          this.$message.error(res.message || '切换协议失败')
        }
      } catch (error) {
        console.error('切换协议失败:', error)
        this.$message.error(`切换协议失败: ${error.message}`)
      } finally {
        this.switchingProtocol = false
      }
    },

    /**
     * 处理认证方式变化
     */
    handleAuthTypeChange() {
      if (this.modules.openvpn.auth_type === 'cert') {
        this.modules.openvpn.username = ''
        this.modules.openvpn.password = ''
      } else if (this.modules.openvpn.auth_type === 'userpass') {
        this.modules.openvpn.client_cert = ''
        this.modules.openvpn.client_key = ''
      } else if (this.modules.openvpn.auth_type === 'static') {
        this.modules.openvpn.username = ''
        this.modules.openvpn.password = ''
        this.modules.openvpn.ca_cert = ''
        this.modules.openvpn.client_cert = ''
        this.modules.openvpn.client_key = ''
      }
    },

    /**
     * 保存配置
     */
    async handleSaveConfig() {
      if (!this.activeProtocol) {
        this.$message.warning('请先选择 VPN 协议类型')
        return
      }

      if (!this.isFormValid) {
        this.$message.warning('请填写必填项')
        return
      }

      this.saving = true
      try {
        // 构建配置载荷
        const payload = this.buildConfigPayload()

        const res = await updateVpnConfig(payload)

        if (res.code === 200) {
          this.$message.success(res.message || '配置已保存')
          this.configSaved = true // 标记配置已保存

          // 重新加载配置以获取最新数据（如 local_public_key）
          await this.loadConfig()
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

    /**
     * 构建配置载荷
     */
    buildConfigPayload() {
      if (this.activeProtocol === 'wireguard') {
        return {
          protocol_type: 'wireguard',
          enabled: false, // 保存配置时不启用
          wireguard: { ...this.modules.wireguard },
        }
      } else if (this.activeProtocol === 'openvpn') {
        const openvpnConfig = {
          remote: this.modules.openvpn.remote,
          port: this.modules.openvpn.port,
          proto: this.modules.openvpn.proto,
          dev: this.modules.openvpn.dev,
          auth_type: this.modules.openvpn.auth_type,
        }

        if (this.modules.openvpn.auth_type === 'cert') {
          openvpnConfig.ca_cert = this.modules.openvpn.ca_cert
          openvpnConfig.client_cert = this.modules.openvpn.client_cert
          openvpnConfig.client_key = this.modules.openvpn.client_key
        } else if (this.modules.openvpn.auth_type === 'userpass') {
          openvpnConfig.username = this.modules.openvpn.username
          openvpnConfig.password = this.modules.openvpn.password
          if (this.modules.openvpn.ca_cert) {
            openvpnConfig.ca_cert = this.modules.openvpn.ca_cert
          }
        } else if (this.modules.openvpn.auth_type === 'static') {
          openvpnConfig.tls_auth = this.modules.openvpn.tls_auth
        }

        if (this.modules.openvpn.cipher) openvpnConfig.cipher = this.modules.openvpn.cipher
        if (this.modules.openvpn.keepalive) openvpnConfig.keepalive = this.modules.openvpn.keepalive
        if (this.modules.openvpn.tls_auth && this.modules.openvpn.auth_type !== 'static') {
          openvpnConfig.tls_auth = this.modules.openvpn.tls_auth
        }
        if (this.modules.openvpn.comp_lzo) openvpnConfig.comp_lzo = this.modules.openvpn.comp_lzo
        if (this.modules.openvpn.mtu) openvpnConfig.mtu = this.modules.openvpn.mtu
        if (this.modules.openvpn.extra_options)
          openvpnConfig.extra_options = this.modules.openvpn.extra_options

        return {
          protocol_type: 'openvpn',
          enabled: false, // 保存配置时不启用
          openvpn: openvpnConfig,
        }
      }
    },

    /**
     * 启动 VPN
     */
    async handleStartVpn() {
      if (!this.configSaved) {
        this.$message.warning('请先保存配置')
        return
      }

      this.starting = true
      try {
        const res = await startVpn()

        if (res.code === 200) {
          this.$message.success(res.message || 'VPN 启动成功')
        } else {
          this.$message.error(res.message || 'VPN 启动失败，请查看日志获取详细信息')
        }
      } catch (error) {
        console.error('启动 VPN 失败:', error)
        this.$message.error('VPN 启动失败，请查看日志获取详细信息')
      } finally {
        this.starting = false
      }
    },

    /**
     * 复制公钥
     */
    copyPublicKey() {
      if (!this.modules.wireguard.local_public_key) {
        this.$message.warning('暂无公钥数据')
        return
      }

      navigator.clipboard
        .writeText(this.modules.wireguard.local_public_key)
        .then(() => {
          this.$message.success('公钥已复制到剪贴板')
        })
        .catch(() => {
          const input = document.createElement('input')
          input.value = this.modules.wireguard.local_public_key
          document.body.appendChild(input)
          input.select()
          document.execCommand('copy')
          document.body.removeChild(input)
          this.$message.success('公钥已复制到剪贴板')
        })
    },
  },
}
</script>

<style scoped>
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

/* 协议类型选择器 */
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
  color: #262626;
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

.protocol-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.protocol-btn.active {
  border-color: #1890ff;
  background: #e6f7ff;
  color: #1890ff;
}

.protocol-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.protocol-btn i {
  font-size: 16px;
}

.protocol-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  font-size: 13px;
  color: #096dd9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.protocol-hint i {
  font-size: 14px;
}

/* 配置表单容器 */
.config-form-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-section {
  margin-top: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
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
  color: #595959;
  margin: 20px 0 12px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #595959;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #262626;
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

select.form-control {
  cursor: pointer;
  appearance: auto;
}

.form-tip {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.4;
}

.info-grid {
  display: grid;
  gap: 16px;
}

.info-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.info-grid.cols-3 {
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
  border-color: #40a9ff;
}

.btn-success {
  background: #52c41a;
  color: white;
  border-color: #52c41a;
}

.btn-success:hover:not(:disabled) {
  background: #73d13d;
  border-color: #73d13d;
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

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

@media (max-width: 768px) {
  .info-grid.cols-2,
  .info-grid.cols-3 {
    grid-template-columns: 1fr;
  }

  .selector-buttons {
    flex-direction: column;
  }

  .card-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
