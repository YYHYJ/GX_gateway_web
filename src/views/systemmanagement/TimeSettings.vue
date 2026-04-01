<template>
  <MainLayout
    active-nav="system-management"
    active-sub-item="time-settings"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="时间设置" :breadcrumbs="breadcrumbs" />

      <div class="time-settings-content">
        <!-- 当前时间展示 -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-clock"></i>
              系统时间
            </div>
            <span class="status-badge" :class="form.syncMode === 'ntp' ? 'status-normal' : 'status-info'">
              {{ form.syncMode === 'ntp' ? 'NTP 模式' : '手动模式' }}
            </span>
          </div>
          <div class="card-content">
            <div class="current-time-display">
              <div class="time-main">{{ currentTime }}</div>
              <div class="time-date">{{ currentDate }}</div>
              <div class="time-zone">时区：{{ form.timezone }}</div>
            </div>
          </div>
        </div>

        <!-- 时区 + 同步配置 左右布局 -->
        <div class="time-columns">
          <!-- 左：时区与同步方式 -->
          <div class="col-left">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-globe"></i>
                  时区与同步方式
                </div>
              </div>
              <div class="card-content">
                <div class="form-group">
                  <label>系统时区</label>
                  <select class="form-control" v-model="form.timezone">
                    <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                      {{ tz.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>同步方式</label>
                  <div class="mode-selector">
                    <label
                      class="mode-option"
                      :class="{ active: form.syncMode === 'ntp' }"
                      @click="form.syncMode = 'ntp'"
                    >
                      <input type="radio" v-model="form.syncMode" value="ntp" />
                      <div class="mode-content">
                        <i class="fas fa-sync-alt"></i>
                        <div>
                          <strong>NTP 自动同步</strong>
                          <p>从NTP服务器自动校时</p>
                        </div>
                      </div>
                    </label>
                    <label
                      class="mode-option"
                      :class="{ active: form.syncMode === 'manual' }"
                      @click="form.syncMode = 'manual'"
                    >
                      <input type="radio" v-model="form.syncMode" value="manual" />
                      <div class="mode-content">
                        <i class="fas fa-hand-pointer"></i>
                        <div>
                          <strong>手动设置</strong>
                          <p>手动指定系统时间</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右：具体配置 -->
          <div class="col-right">
            <!-- NTP 配置 -->
            <div class="card" v-if="form.syncMode === 'ntp'">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-server"></i>
                  NTP 服务器配置
                </div>
              </div>
              <div class="card-content">
                <div class="form-group">
                  <label>首选 NTP 服务器</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.ntp.server1"
                    placeholder="例如: ntp.aliyun.com"
                  />
                </div>
                <div class="form-group">
                  <label>备用 NTP 服务器</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.ntp.server2"
                    placeholder="例如: ntp.tencent.com"
                  />
                </div>
                <div class="form-group">
                  <label>同步间隔（分钟）</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="form.ntp.interval"
                    min="1"
                    placeholder="默认 60"
                  />
                </div>

                <div class="card-footer" style="justify-content: flex-end; gap: 12px; border-top: none; padding: 12px 0 0;">
                  <button class="btn btn-primary" @click="handleSave" :disabled="saving">
                    <i class="fas fa-save"></i> {{ saving ? '保存中...' : '保存配置' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 手动设置 -->
            <div class="card" v-else>
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-calendar-alt"></i>
                  手动设置时间
                </div>
              </div>
              <div class="card-content">
                <div class="info-grid cols-2">
                  <div class="form-group">
                    <label>日期</label>
                    <input type="date" class="form-control" v-model="form.manual.date" />
                  </div>
                  <div class="form-group">
                    <label>时间</label>
                    <input type="time" class="form-control" v-model="form.manual.time" step="1" />
                  </div>
                </div>
                <div class="manual-hint">
                  <i class="fas fa-info-circle"></i>
                  设置后系统时间将立即更新，建议在无法连接NTP服务器时使用手动模式。
                </div>

                <div class="card-footer" style="justify-content: flex-end; gap: 12px; border-top: none; padding: 12px 0 0;">
                  <button class="btn btn-outline" @click="fillCurrentTime">
                    <i class="fas fa-clock"></i> 填入当前时间
                  </button>
                  <button class="btn btn-primary" @click="handleSave" :disabled="saving">
                    <i class="fas fa-save"></i> {{ saving ? '保存中...' : '应用时间' }}
                  </button>
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
import { getTimeInfo, getNtpConfig, saveNtpConfig } from '@/api/time.js'

export default {
  name: 'TimeSettings',
  components: { MainLayout, PageHeader },
  data() {
    return {
      breadcrumbs: [{ title: '系统管理' }, { title: '时间设置' }],
      saving: false,
      currentTime: '',
      currentDate: '',
      serverTime: null,
      timer: null,
      form: {
        timezone: 'UTC+8',
        syncMode: 'ntp',
        ntp: {
          server1: 'ntp.aliyun.com',
          server2: 'ntp.tencent.com',
          interval: 60,
        },
        manual: {
          date: '',
          time: '',
        },
      },
      timezones: [
        { value: 'UTC-12', label: 'UTC-12' },
        { value: 'UTC-11', label: 'UTC-11' },
        { value: 'UTC-10', label: 'UTC-10' },
        { value: 'UTC-9', label: 'UTC-9' },
        { value: 'UTC-8', label: 'UTC-8' },
        { value: 'UTC-7', label: 'UTC-7' },
        { value: 'UTC-6', label: 'UTC-6' },
        { value: 'UTC-5', label: 'UTC-5' },
        { value: 'UTC-4', label: 'UTC-4' },
        { value: 'UTC-3', label: 'UTC-3' },
        { value: 'UTC-2', label: 'UTC-2' },
        { value: 'UTC-1', label: 'UTC-1' },
        { value: 'UTC+0', label: 'UTC+0' },
        { value: 'UTC+1', label: 'UTC+1' },
        { value: 'UTC+2', label: 'UTC+2' },
        { value: 'UTC+3', label: 'UTC+3' },
        { value: 'UTC+4', label: 'UTC+4' },
        { value: 'UTC+5', label: 'UTC+5' },
        { value: 'UTC+5:30', label: 'UTC+5:30' },
        { value: 'UTC+6', label: 'UTC+6' },
        { value: 'UTC+7', label: 'UTC+7' },
        { value: 'UTC+8', label: 'UTC+8' },
        { value: 'UTC+9', label: 'UTC+9' },
        { value: 'UTC+10', label: 'UTC+10' },
        { value: 'UTC+11', label: 'UTC+11' },
        { value: 'UTC+12', label: 'UTC+12' },
      ],
    }
  },

  mounted() {
    this.fetchTime()
    this.fetchNtpConfig()
    this.fillCurrentTime()
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    handleNavigation() {},

    async fetchTime() {
      if (this.timer) clearInterval(this.timer)
      try {
        const res = await getTimeInfo()
        if (res.code === 200) {
          this.serverTime = new Date(res.data.datetime)
        } else {
          this.serverTime = new Date()
        }
      } catch {
        this.serverTime = new Date()
      }
      this.updateClock()
      this.timer = setInterval(this.updateClock, 1000)
    },

    updateClock() {
      if (this.serverTime) {
        this.serverTime = new Date(this.serverTime.getTime() + 1000)
      } else {
        this.serverTime = new Date()
      }
      this.currentTime = this.serverTime.toLocaleTimeString('zh-CN', { hour12: false })
      this.currentDate = this.serverTime.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    },

    fillCurrentTime() {
      const now = new Date()
      this.form.manual.date = now.toISOString().split('T')[0]
      this.form.manual.time = now.toTimeString().split(' ')[0]
    },

    async fetchNtpConfig() {
      try {
        const res = await getNtpConfig()
        if (res.code === 200) {
          const d = res.data
          this.form.syncMode = d.syncMode || 'ntp'
          this.form.ntp.server1 = d.server1 || ''
          this.form.ntp.server2 = d.server2 || ''
          this.form.ntp.interval = d.interval || 60
          if (d.timezone) {
            const exists = this.timezones.some(t => t.value === d.timezone)
            if (exists) this.form.timezone = d.timezone
          }
        }
      } catch (e) {
        console.error('获取NTP配置失败:', e)
      }
    },

    async handleSave() {
      this.saving = true
      try {
        const payload = { syncMode: this.form.syncMode, timezone: this.form.timezone }

        if (this.form.syncMode === 'ntp') {
          payload.server1 = this.form.ntp.server1
          payload.server2 = this.form.ntp.server2
          payload.interval = this.form.ntp.interval
        } else {
          payload.datetime = `${this.form.manual.date}T${this.form.manual.time}`
        }

        const res = await saveNtpConfig(payload)
        if (res.code === 200) {
          alert(this.form.syncMode === 'ntp' ? '时间配置保存成功' : '系统时间已更新')
          this.fetchTime()
        } else {
          alert('保存失败: ' + (res.message || '未知错误'))
        }
      } catch (e) {
        alert('操作失败: ' + (e.message || '网络错误'))
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.time-settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 当前时间展示 */
.current-time-display {
  text-align: center;
  padding: 20px 0;
}

.time-main {
  font-size: 48px;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
  letter-spacing: 4px;
  line-height: 1.2;
}

.time-date {
  font-size: 16px;
  color: #7f8c8d;
  margin-top: 6px;
}

.time-zone {
  font-size: 13px;
  color: #95a5a6;
  margin-top: 4px;
}

/* 左右布局 */
.time-columns {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.col-left {
  flex: 0 0 400px;
}

.col-right {
  flex: 1;
  min-width: 0;
}

/* 同步方式选择器 */
.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.mode-option {
  display: flex;
  align-items: center;
  padding: 14px 16px;
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

.mode-option input[type='radio'] {
  display: none;
}

.mode-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-content i {
  font-size: 20px;
  color: #3498db;
}

.mode-content strong {
  display: block;
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 1px;
}

.mode-content p {
  margin: 0;
  font-size: 12px;
  color: #7f8c8d;
}

/* 手动设置提示 */
.manual-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
  margin-top: 8px;
}

.manual-hint i {
  color: #f59e0b;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .time-columns {
    flex-direction: column;
  }

  .col-left {
    flex: none;
    width: 100%;
  }

  .time-main {
    font-size: 36px;
  }
}
</style>
