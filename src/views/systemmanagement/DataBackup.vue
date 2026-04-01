<template>
  <MainLayout
    active-nav="system-management"
    active-sub-item="data-backup"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="数据备份" :breadcrumbs="breadcrumbs" />

      <div class="backup-content">
        <!-- 上次备份信息 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-history"></i>
              备份概览
            </div>
          </div>
          <div class="card-content">
            <div class="info-grid cols-4">
              <div class="info-item">
                <div class="info-label">上次备份时间</div>
                <div class="info-value">{{ lastBackup.time || '从未备份' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">备份文件大小</div>
                <div class="info-value">{{ lastBackup.size || '--' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">包含项目数</div>
                <div class="info-value">{{ lastBackup.itemCount || '--' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">备份状态</div>
                <div class="info-value">
                  <span class="status-dot" :class="lastBackup.time ? 'dot-on' : 'dot-off'"></span>
                  {{ lastBackup.time ? '正常' : '未备份' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 备份与恢复 左右布局 -->
        <div class="backup-columns">
          <!-- 左：文件浏览与选择 -->
          <div class="col-main">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-folder-open"></i>
                  备份内容选择
                </div>
                <div class="header-actions">
                  <button class="btn btn-sm btn-outline" @click="selectAll">全选</button>
                  <button class="btn btn-sm btn-outline" @click="deselectAll">取消全选</button>
                </div>
              </div>
              <div class="card-content" style="padding: 0;">
                <div class="file-tree">
                  <div
                    v-for="group in fileGroups"
                    :key="group.id"
                    class="tree-group"
                  >
                    <!-- 分组头 -->
                    <div class="tree-group-header" @click="toggleGroup(group)">
                      <label class="tree-checkbox" @click.stop>
                        <input
                          type="checkbox"
                          :checked="isGroupChecked(group)"
                          :indeterminate.prop="isGroupIndeterminate(group)"
                          @change="toggleGroupCheck(group, $event.target.checked)"
                        />
                      </label>
                      <i class="fas fa-chevron-right tree-arrow" :class="{ expanded: group.expanded }"></i>
                      <i :class="group.icon" class="tree-icon" :style="{ color: group.color }"></i>
                      <span class="tree-group-name">{{ group.name }}</span>
                      <span class="tree-group-desc">{{ group.desc }}</span>
                    </div>

                    <!-- 分组下的文件/目录 -->
                    <div class="tree-children" v-show="group.expanded">
                      <div
                        v-for="item in group.items"
                        :key="item.path"
                        class="tree-item"
                      >
                        <label class="tree-checkbox">
                          <input type="checkbox" v-model="item.checked" />
                        </label>
                        <i :class="[item.isDir ? 'fas fa-folder' : 'fas fa-file', 'tree-item-icon', { 'is-dir': item.isDir }]"></i>
                        <span class="tree-item-path mono">{{ item.path }}</span>
                        <span class="tree-item-size">{{ item.size }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-footer">
                <div class="selected-summary">
                  已选择 <strong>{{ selectedCount }}</strong> 项，预估大小 <strong>{{ estimatedSize }}</strong>
                </div>
                <button
                  class="btn btn-primary"
                  @click="handleExport"
                  :disabled="selectedCount === 0 || exporting"
                >
                  <i class="fas" :class="exporting ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                  {{ exporting ? '打包中...' : '一键打包下载' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 右：恢复 -->
          <div class="col-side">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-upload"></i>
                  导入恢复
                </div>
              </div>
              <div class="card-content">
                <div
                  class="upload-zone"
                  :class="{ dragover: isDragover }"
                  @dragover.prevent="isDragover = true"
                  @dragleave="isDragover = false"
                  @drop.prevent="handleDrop"
                  @click="$refs.fileInput.click()"
                >
                  <input ref="fileInput" type="file" accept=".tar.gz,.tgz,.zip" hidden @change="handleFileSelect" />
                  <i class="fas fa-cloud-upload-alt upload-icon"></i>
                  <div class="upload-text">点击或拖拽备份文件到此处</div>
                  <div class="upload-hint">支持 .tar.gz / .zip 格式</div>
                </div>

                <!-- 已选择的文件 -->
                <div class="restore-file" v-if="restoreFile">
                  <div class="restore-file-info">
                    <i class="fas fa-file-archive"></i>
                    <div>
                      <div class="restore-file-name">{{ restoreFile.name }}</div>
                      <div class="restore-file-size">{{ formatBytes(restoreFile.size) }}</div>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-outline" @click="restoreFile = null">
                    <i class="fas fa-times"></i>
                  </button>
                </div>

                <div class="restore-warning" v-if="restoreFile">
                  <i class="fas fa-exclamation-triangle"></i>
                  <div>
                    <strong>注意：</strong>恢复操作将覆盖当前配置，建议先导出当前配置作为备份。恢复完成后服务将自动重启。
                  </div>
                </div>

                <button
                  class="btn btn-primary"
                  style="width: 100%; margin-top: 12px;"
                  @click="handleRestore"
                  :disabled="!restoreFile || restoring"
                  v-if="restoreFile"
                >
                  <i class="fas" :class="restoring ? 'fa-spinner fa-spin' : 'fa-redo'"></i>
                  {{ restoring ? '恢复中...' : '开始恢复' }}
                </button>
              </div>
            </div>

            <!-- 备份历史 -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-list"></i>
                  最近备份记录
                </div>
              </div>
              <div class="card-content" style="padding: 0;">
                <div class="history-list">
                  <div v-for="record in backupHistory" :key="record.id" class="history-item">
                    <div class="history-info">
                      <div class="history-time">{{ record.time }}</div>
                      <div class="history-meta">{{ record.itemCount }} 项 · {{ record.size }}</div>
                    </div>
                    <button class="btn btn-sm btn-outline" @click="downloadHistory(record)" title="重新下载">
                      <i class="fas fa-download"></i>
                    </button>
                  </div>
                  <div class="history-empty" v-if="backupHistory.length === 0">
                    暂无备份记录
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
  name: 'DataBackup',
  components: { MainLayout, PageHeader },
  data() {
    return {
      breadcrumbs: [{ title: '系统管理' }, { title: '数据备份' }],
      exporting: false,
      restoring: false,
      isDragover: false,
      restoreFile: null,
      // TODO: 替换为真实API数据
      lastBackup: {
        time: '2025-01-14 18:30:22',
        size: '2.3 MB',
        itemCount: 12,
      },
      backupHistory: [
        { id: 1, time: '2025-01-14 18:30', itemCount: 12, size: '2.3 MB' },
        { id: 2, time: '2025-01-10 09:15', itemCount: 10, size: '1.8 MB' },
        { id: 3, time: '2025-01-03 14:42', itemCount: 11, size: '2.1 MB' },
      ],
      fileGroups: [
        {
          id: 'db',
          name: '数据库文件',
          desc: '采集配置、转发规则等核心数据',
          icon: 'fas fa-database',
          color: '#3498db',
          expanded: true,
          items: [
            { path: '/opt/gateway/data/gateway.db', size: '1.2 MB', isDir: false, checked: true },
            { path: '/opt/gateway/data/datastore.db', size: '856 KB', isDir: false, checked: true },
          ],
        },
        {
          id: 'sys-config',
          name: '系统配置',
          desc: '网络、串口、时间等系统级配置',
          icon: 'fas fa-cogs',
          color: '#e67e22',
          expanded: true,
          items: [
            { path: '/opt/gateway/config/network/', size: '12 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/serial/', size: '4 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/can/', size: '2 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/gpio.json', size: '1 KB', isDir: false, checked: true },
            { path: '/opt/gateway/config/ntp.conf', size: '0.5 KB', isDir: false, checked: true },
          ],
        },
        {
          id: 'biz-config',
          name: '业务配置',
          desc: '设备模板、设备实例、转发规则',
          icon: 'fas fa-project-diagram',
          color: '#2ecc71',
          expanded: true,
          items: [
            { path: '/opt/gateway/config/templates/', size: '86 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/devices/', size: '45 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/mqtt/', size: '8 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/modbus_north/', size: '6 KB', isDir: true, checked: true },
            { path: '/opt/gateway/config/datastore.json', size: '3 KB', isDir: false, checked: true },
          ],
        },
        {
          id: 'user',
          name: '用户与安全',
          desc: '账户信息、证书文件',
          icon: 'fas fa-shield-alt',
          color: '#9b59b6',
          expanded: false,
          items: [
            { path: '/opt/gateway/config/users.json', size: '1 KB', isDir: false, checked: true },
            { path: '/opt/gateway/config/certs/', size: '15 KB', isDir: true, checked: true },
          ],
        },
        {
          id: 'logs',
          name: '日志文件（可选）',
          desc: '系统日志、操作日志，通常较大',
          icon: 'fas fa-clipboard-list',
          color: '#95a5a6',
          expanded: false,
          items: [
            { path: '/opt/gateway/logs/system.log', size: '5.2 MB', isDir: false, checked: false },
            { path: '/opt/gateway/logs/operation.log', size: '3.1 MB', isDir: false, checked: false },
            { path: '/opt/gateway/logs/communication.log', size: '12.6 MB', isDir: false, checked: false },
          ],
        },
      ],
    }
  },
  computed: {
    selectedCount() {
      return this.fileGroups.reduce((sum, g) => sum + g.items.filter((i) => i.checked).length, 0)
    },
    estimatedSize() {
      let totalKB = 0
      for (const g of this.fileGroups) {
        for (const item of g.items) {
          if (!item.checked) continue
          totalKB += this.parseSize(item.size)
        }
      }
      return this.formatKB(totalKB)
    },
  },
  methods: {
    handleNavigation() {},

    toggleGroup(group) {
      group.expanded = !group.expanded
    },

    isGroupChecked(group) {
      return group.items.length > 0 && group.items.every((i) => i.checked)
    },

    isGroupIndeterminate(group) {
      const checked = group.items.filter((i) => i.checked).length
      return checked > 0 && checked < group.items.length
    },

    toggleGroupCheck(group, val) {
      group.items.forEach((i) => (i.checked = val))
    },

    selectAll() {
      this.fileGroups.forEach((g) => g.items.forEach((i) => (i.checked = true)))
    },

    deselectAll() {
      this.fileGroups.forEach((g) => g.items.forEach((i) => (i.checked = false)))
    },

    parseSize(str) {
      const num = parseFloat(str)
      if (str.includes('MB')) return num * 1024
      if (str.includes('KB')) return num
      return num
    },

    formatKB(kb) {
      if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB'
      return kb.toFixed(0) + ' KB'
    },

    formatBytes(bytes) {
      if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
      if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
      return bytes + ' B'
    },

    handleExport() {
      this.exporting = true
      // TODO: 接入真实API — POST 选中的路径列表，后端打包返回文件流
      const selectedPaths = []
      this.fileGroups.forEach((g) => {
        g.items.forEach((i) => { if (i.checked) selectedPaths.push(i.path) })
      })
      console.log('导出路径:', selectedPaths)
      setTimeout(() => {
        this.exporting = false
        alert('备份文件已生成（Mock），实际应触发浏览器下载 .tar.gz')
      }, 2000)
    },

    handleFileSelect(e) {
      const file = e.target.files[0]
      if (file) this.restoreFile = file
      e.target.value = ''
    },

    handleDrop(e) {
      this.isDragover = false
      const file = e.dataTransfer.files[0]
      if (file) this.restoreFile = file
    },

    handleRestore() {
      if (!this.restoreFile) return
      this.restoring = true
      // TODO: 接入真实API — 上传文件，后端解压覆盖，重启服务
      setTimeout(() => {
        this.restoring = false
        this.restoreFile = null
        alert('配置恢复成功，服务即将重启（Mock）')
      }, 3000)
    },

    downloadHistory(record) {
      // TODO: 接入真实API — 根据 record.id 下载历史备份
      alert(`下载备份 ${record.time}（Mock）`)
    },
  },
}
</script>

<style scoped>
.backup-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 左右布局 */
.backup-columns {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.col-main { flex: 1; min-width: 0; }

.col-side {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 头部操作按钮 */
.header-actions {
  display: flex;
  gap: 8px;
}

/* 文件树 */
.file-tree {
  padding: 8px 0;
}

.tree-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.tree-group-header:hover {
  background: #f8fafc;
}

.tree-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3498db;
}

.tree-arrow {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.2s;
  width: 12px;
  text-align: center;
}

.tree-arrow.expanded {
  transform: rotate(90deg);
}

.tree-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.tree-group-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.tree-group-desc {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 4px;
}

.tree-children {
  background: #fafbfc;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px 9px 56px;
  transition: background 0.15s;
}

.tree-item:hover {
  background: #f0f4f8;
}

.tree-item-icon {
  font-size: 13px;
  color: #94a3b8;
  width: 16px;
  text-align: center;
}

.tree-item-icon.is-dir {
  color: #f59e0b;
}

.tree-item-path {
  flex: 1;
  font-size: 13px;
  color: #475569;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-item-size {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

/* 底部汇总 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-summary {
  font-size: 13px;
  color: #64748b;
}

.selected-summary strong {
  color: #3498db;
}

/* 上传区域 */
.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 32px 20px;
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
  font-size: 32px;
  color: #93c5fd;
  margin-bottom: 10px;
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

/* 已选文件 */
.restore-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-top: 12px;
}

.restore-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.restore-file-info > i {
  font-size: 20px;
  color: #3498db;
}

.restore-file-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-all;
}

.restore-file-size {
  font-size: 12px;
  color: #64748b;
}

/* 恢复警告 */
.restore-warning {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
}

.restore-warning > i {
  color: #f59e0b;
  margin-top: 1px;
  flex-shrink: 0;
}

/* 备份历史 */
.history-list {
  padding: 4px 0;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.history-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.history-empty {
  padding: 24px 20px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

/* 状态点 */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.dot-on { background: #2ecc71; }
.dot-off { background: #cbd5e1; }

.mono { font-family: 'Courier New', monospace; }

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .backup-columns {
    flex-direction: column;
  }

  .col-side {
    flex: none;
    width: 100%;
  }
}
</style>
