<template>
  <MainLayout
    active-nav="ota-upgrade"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="OTA 升级" :breadcrumbs="breadcrumbs" />

      <div class="ota-content">
        <!-- 当前版本信息 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-microchip"></i>
              当前系统信息
            </div>
            <span class="status-badge status-normal">运行中</span>
          </div>
          <div class="card-content">
            <div class="info-grid cols-4">
              <div class="info-item">
                <div class="info-label">固件版本</div>
                <div class="info-value version-text">{{ currentVersion.firmware }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">应用版本</div>
                <div class="info-value version-text">{{ currentVersion.app }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">构建时间</div>
                <div class="info-value">{{ currentVersion.buildTime }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">运行时长</div>
                <div class="info-value">{{ currentVersion.uptime }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">硬件型号</div>
                <div class="info-value">{{ currentVersion.hardware }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">序列号</div>
                <div class="info-value mono">{{ currentVersion.serial }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">内核版本</div>
                <div class="info-value">{{ currentVersion.kernel }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">上次升级</div>
                <div class="info-value">{{ currentVersion.lastUpgrade }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ota-columns">
          <!-- 左：固件升级 -->
          <div class="col-main">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-cloud-upload-alt"></i>
                  固件升级
                </div>
              </div>
              <div class="card-content">
                <!-- 未在升级中 -->
                <template v-if="upgradeState === 'idle'">
                  <div
                    class="upload-zone"
                    :class="{ dragover: isDragover }"
                    @dragover.prevent="isDragover = true"
                    @dragleave="isDragover = false"
                    @drop.prevent="handleDrop"
                    @click="$refs.fileInput.click()"
                  >
                    <input ref="fileInput" type="file" accept=".bin,.img,.fw,.tar.gz,.tgz" hidden @change="handleFileSelect" />
                    <i class="fas fa-cloud-upload-alt upload-icon"></i>
                    <div class="upload-text">点击或拖拽固件包到此处</div>
                    <div class="upload-hint">支持 .bin / .img / .fw / .tar.gz 格式</div>
                  </div>

                  <!-- 已选文件 -->
                  <div class="firmware-file" v-if="firmwareFile">
                    <div class="firmware-file-info">
                      <i class="fas fa-file-archive"></i>
                      <div>
                        <div class="firmware-file-name">{{ firmwareFile.name }}</div>
                        <div class="firmware-file-size">{{ formatBytes(firmwareFile.size) }}</div>
                      </div>
                    </div>
                    <button class="btn btn-sm btn-outline" @click="firmwareFile = null">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>

                  <!-- 固件信息解析（mock） -->
                  <div class="firmware-meta" v-if="firmwareFile">
                    <div class="info-grid cols-2">
                      <div class="info-item">
                        <div class="info-label">目标版本</div>
                        <div class="info-value version-text">v2.1.0</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">包大小</div>
                        <div class="info-value">{{ formatBytes(firmwareFile.size) }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">适用硬件</div>
                        <div class="info-value">GX-3000</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">发布日期</div>
                        <div class="info-value">2025-01-20</div>
                      </div>
                    </div>
                  </div>

                  <div class="upgrade-warning" v-if="firmwareFile">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                      <strong>升级须知：</strong>
                      <ul>
                        <li>升级过程中请勿断电或重启设备</li>
                        <li>建议升级前先备份当前配置</li>
                        <li>升级完成后设备将自动重启</li>
                      </ul>
                    </div>
                  </div>

                  <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;" v-if="firmwareFile">
                    <button class="btn btn-outline" @click="firmwareFile = null">
                      <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="btn btn-primary" @click="startUpgrade">
                      <i class="fas fa-rocket"></i> 开始升级
                    </button>
                  </div>
                </template>

                <!-- 升级进行中 -->
                <template v-if="upgradeState !== 'idle'">
                  <div class="upgrade-progress">
                    <!-- 步骤条 -->
                    <div class="steps">
                      <div
                        v-for="(step, idx) in upgradeSteps"
                        :key="step.id"
                        class="step"
                        :class="{ done: step.status === 'done', active: step.status === 'active', error: step.status === 'error' }"
                      >
                        <div class="step-icon">
                          <i v-if="step.status === 'done'" class="fas fa-check"></i>
                          <i v-else-if="step.status === 'active'" class="fas fa-spinner fa-spin"></i>
                          <i v-else-if="step.status === 'error'" class="fas fa-times"></i>
                          <span v-else>{{ idx + 1 }}</span>
                        </div>
                        <div class="step-label">{{ step.label }}</div>
                      </div>
                    </div>

                    <!-- 进度条 -->
                    <div class="progress-section">
                      <div class="progress-bar-track">
                        <div
                          class="progress-bar-fill"
                          :class="{ error: upgradeState === 'error' }"
                          :style="{ width: progressPercent + '%' }"
                        ></div>
                      </div>
                      <div class="progress-text">
                        <span>{{ progressMessage }}</span>
                        <span>{{ progressPercent }}%</span>
                      </div>
                    </div>

                    <!-- 升级日志 -->
                    <div class="upgrade-log" ref="logBox">
                      <div v-for="(log, i) in upgradeLogs" :key="i" class="log-line" :class="log.type">
                        <span class="log-time">{{ log.time }}</span>
                        <span class="log-msg">{{ log.msg }}</span>
                      </div>
                    </div>

                    <!-- 升级失败操作 -->
                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;" v-if="upgradeState === 'error'">
                      <button class="btn btn-outline" @click="resetUpgrade">
                        <i class="fas fa-undo"></i> 返回
                      </button>
                      <button class="btn btn-primary" @click="startUpgrade">
                        <i class="fas fa-redo"></i> 重试
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 右：版本历史 -->
          <div class="col-side">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-history"></i>
                  版本历史
                </div>
              </div>
              <div class="card-content" style="padding: 0;">
                <div class="version-list">
                  <div
                    v-for="ver in versionHistory"
                    :key="ver.version"
                    class="version-item"
                    :class="{ current: ver.current }"
                  >
                    <div class="version-header">
                      <span class="version-tag">{{ ver.version }}</span>
                      <span class="version-badge" v-if="ver.current">当前</span>
                      <span class="version-date">{{ ver.date }}</span>
                    </div>
                    <div class="version-changes">
                      <div v-for="(change, i) in ver.changes" :key="i" class="change-item">
                        <i :class="['fas', changeIcon(change.type)]"></i>
                        {{ change.text }}
                      </div>
                    </div>
                    <button
                      v-if="!ver.current && ver.canRollback"
                      class="btn btn-sm btn-outline rollback-btn"
                      @click="handleRollback(ver)"
                    >
                      <i class="fas fa-undo"></i> 回滚到此版本
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
  name: 'OtaUpgrade',
  components: { MainLayout, PageHeader },
  data() {
    return {
      breadcrumbs: [{ title: 'OTA 升级' }],
      isDragover: false,
      firmwareFile: null,
      upgradeState: 'idle',
      progressPercent: 0,
      progressMessage: '',
      upgradeLogs: [],
      upgradeTimer: null,
      // TODO: 替换为真实API数据
      currentVersion: {
        firmware: 'v2.0.3',
        app: 'v2.0.3-build.128',
        buildTime: '2025-01-10 16:30',
        uptime: '15 天 8 小时',
        hardware: 'GX-3000',
        serial: 'GX3K-2024-00158',
        kernel: 'Linux 5.15.0-rt',
        lastUpgrade: '2025-01-10',
      },
      upgradeSteps: [
        { id: 'upload', label: '上传固件', status: 'pending' },
        { id: 'verify', label: '校验完整性', status: 'pending' },
        { id: 'install', label: '安装升级', status: 'pending' },
        { id: 'reboot', label: '重启生效', status: 'pending' },
      ],
      versionHistory: [
        {
          version: 'v2.0.3', date: '2025-01-10', current: true, canRollback: false,
          changes: [
            { type: 'fix', text: '修复 Modbus RTU 偶发超时问题' },
            { type: 'fix', text: '修复 MQTT 断线重连后 Topic 丢失' },
            { type: 'improve', text: '优化串口数据采集性能' },
          ],
        },
        {
          version: 'v2.0.2', date: '2024-12-20', current: false, canRollback: true,
          changes: [
            { type: 'feature', text: '新增 CAN 总线协议支持' },
            { type: 'feature', text: '新增 GPIO 数字量采集' },
            { type: 'improve', text: '升级 Web 管理界面' },
          ],
        },
        {
          version: 'v2.0.1', date: '2024-11-15', current: false, canRollback: true,
          changes: [
            { type: 'feature', text: '新增数据存储分层策略' },
            { type: 'fix', text: '修复 NTP 同步偏差过大问题' },
          ],
        },
        {
          version: 'v2.0.0', date: '2024-10-01', current: false, canRollback: false,
          changes: [
            { type: 'feature', text: '全新架构 2.0 发布' },
            { type: 'feature', text: '支持多协议数据采集' },
            { type: 'feature', text: '支持 MQTT / 北向 Modbus 转发' },
          ],
        },
      ],
    }
  },
  beforeUnmount() {
    if (this.upgradeTimer) clearInterval(this.upgradeTimer)
  },
  methods: {
    handleNavigation() {},

    formatBytes(bytes) {
      if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
      if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
      return bytes + ' B'
    },

    changeIcon(type) {
      const map = { feature: 'fa-plus-circle text-green', fix: 'fa-wrench text-orange', improve: 'fa-arrow-up text-blue' }
      return map[type] || 'fa-circle'
    },

    handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) this.firmwareFile = file
      e.target.value = ''
    },

    handleDrop(e) {
      this.isDragover = false
      const file = e.dataTransfer.files[0]
      if (file) this.firmwareFile = file
    },

    addLog(msg, type = 'info') {
      const now = new Date()
      const time = now.toLocaleTimeString('zh-CN', { hour12: false })
      this.upgradeLogs.push({ time, msg, type })
      this.$nextTick(() => {
        const box = this.$refs.logBox
        if (box) box.scrollTop = box.scrollHeight
      })
    },

    startUpgrade() {
      // TODO: 接入真实API — 上传固件文件，轮询升级状态
      this.upgradeState = 'uploading'
      this.progressPercent = 0
      this.progressMessage = '正在上传固件...'
      this.upgradeLogs = []
      this.upgradeSteps.forEach((s) => (s.status = 'pending'))
      this.upgradeSteps[0].status = 'active'

      this.addLog('开始上传固件包: ' + (this.firmwareFile?.name || 'firmware.bin'))

      let phase = 0
      this.upgradeTimer = setInterval(() => {
        phase++
        if (phase <= 10) {
          this.progressPercent = phase * 3
          this.progressMessage = '正在上传固件...'
          if (phase === 5) this.addLog('已上传 50%...')
          if (phase === 10) {
            this.addLog('固件上传完成')
            this.upgradeSteps[0].status = 'done'
            this.upgradeSteps[1].status = 'active'
            this.addLog('开始校验固件完整性...')
          }
        } else if (phase <= 15) {
          this.progressPercent = 30 + (phase - 10) * 3
          this.progressMessage = '正在校验固件...'
          if (phase === 13) this.addLog('MD5 校验通过')
          if (phase === 15) {
            this.addLog('固件签名验证通过')
            this.upgradeSteps[1].status = 'done'
            this.upgradeSteps[2].status = 'active'
            this.addLog('开始安装升级包...')
          }
        } else if (phase <= 30) {
          this.progressPercent = 45 + (phase - 15) * 3
          this.progressMessage = '正在安装升级...'
          if (phase === 20) this.addLog('正在备份当前固件...')
          if (phase === 23) this.addLog('正在写入新固件...')
          if (phase === 28) this.addLog('正在更新引导配置...')
          if (phase === 30) {
            this.addLog('升级安装完成')
            this.upgradeSteps[2].status = 'done'
            this.upgradeSteps[3].status = 'active'
            this.addLog('准备重启设备...')
          }
        } else if (phase <= 35) {
          this.progressPercent = 90 + (phase - 30) * 2
          this.progressMessage = '正在重启设备...'
          if (phase === 35) {
            this.progressPercent = 100
            this.progressMessage = '升级完成'
            this.upgradeSteps[3].status = 'done'
            this.upgradeState = 'done'
            this.addLog('设备重启完成，升级成功！', 'success')
            clearInterval(this.upgradeTimer)
          }
        }
      }, 400)
    },

    resetUpgrade() {
      if (this.upgradeTimer) clearInterval(this.upgradeTimer)
      this.upgradeState = 'idle'
      this.progressPercent = 0
      this.upgradeLogs = []
      this.upgradeSteps.forEach((s) => (s.status = 'pending'))
    },

    handleRollback(ver) {
      if (confirm(`确定要回滚到 ${ver.version} 吗？回滚后设备将重启。`)) {
        alert(`已发起回滚到 ${ver.version}（Mock）`)
      }
    },
  },
}
</script>

<style scoped>
.ota-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ota-columns {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.col-main { flex: 1; min-width: 0; }
.col-side { flex: 0 0 360px; }

.version-text {
  font-weight: 700;
  color: #3498db;
  font-size: 15px;
}

.mono { font-family: 'Courier New', monospace; }

/* 上传区域 */
.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafbfc;
}

.upload-zone:hover,
.upload-zone.dragover {
  border-color: #3498db;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 36px;
  color: #93c5fd;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 已选固件文件 */
.firmware-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-top: 16px;
}

.firmware-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.firmware-file-info > i {
  font-size: 22px;
  color: #3498db;
}

.firmware-file-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.firmware-file-size {
  font-size: 12px;
  color: #64748b;
}

.firmware-meta {
  margin-top: 16px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* 升级警告 */
.upgrade-warning {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.6;
}

.upgrade-warning > i {
  color: #f59e0b;
  margin-top: 2px;
  flex-shrink: 0;
}

.upgrade-warning ul {
  margin: 4px 0 0;
  padding-left: 18px;
}

.upgrade-warning li {
  margin-top: 2px;
}

/* 步骤条 */
.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 40px;
  right: 40px;
  height: 2px;
  background: #e5e7eb;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-icon {
  background: #3498db;
  color: white;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
}

.step.done .step-icon {
  background: #2ecc71;
  color: white;
}

.step.error .step-icon {
  background: #e74c3c;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.step.active .step-label,
.step.done .step-label {
  color: #334155;
}

/* 进度条 */
.progress-section {
  margin-bottom: 16px;
}

.progress-bar-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 4px;
  transition: width 0.4s;
}

.progress-bar-fill.error {
  background: #e74c3c;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

/* 升级日志 */
.upgrade-log {
  background: #1e293b;
  border-radius: 8px;
  padding: 14px;
  max-height: 220px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
}

.log-line { color: #cbd5e1; }
.log-line.success { color: #4ade80; }
.log-line.error { color: #f87171; }

.log-time {
  color: #64748b;
  margin-right: 10px;
}

/* 版本历史 */
.version-list {
  padding: 4px 0;
}

.version-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.version-item:last-child { border-bottom: none; }
.version-item.current { background: #f0f7ff; }

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.version-tag {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.version-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
  background: #3498db;
  color: white;
  font-weight: 600;
}

.version-date {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
}

.version-changes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-item {
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

.change-item i {
  font-size: 11px;
  width: 14px;
  text-align: center;
}

.text-green { color: #2ecc71; }
.text-orange { color: #e67e22; }
.text-blue { color: #3498db; }

.rollback-btn { margin-top: 10px; }

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .ota-columns {
    flex-direction: column;
  }

  .col-side {
    flex: none;
    width: 100%;
  }
}
</style>
