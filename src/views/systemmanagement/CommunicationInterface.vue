<template>
  <MainLayout
    active-nav="system-management"
    active-sub-item="communication-interface"
    user-name="管理员"
    @nav-change="handleNavigation"
  >
    <div class="content-area">
      <PageHeader title="通信接口" :breadcrumbs="breadcrumbs" />

      <div class="comm-content">
        <!-- 接口总览卡片 -->
        <div class="port-cards">
          <div
            v-for="port in ports"
            :key="port.id"
            class="port-card"
            :class="{ active: activePortId === port.id }"
            @click="activePortId = port.id"
          >
            <div class="port-card-icon" :style="{ background: iconBg(port.category) }">
              <i :class="iconClass(port.category)"></i>
            </div>
            <div class="port-card-info">
              <div class="port-card-name">{{ port.name }}</div>
              <div class="port-card-type">{{ port.type }}</div>
            </div>
            <div class="port-card-status">
              <span class="status-dot" :class="port.enabled ? 'dot-on' : 'dot-off'"></span>
              {{ port.enabled ? '已启用' : '未启用' }}
            </div>
          </div>
        </div>

        <!-- 选中接口的详细配置 -->
        <div class="config-columns" v-if="activePort">
          <!-- 左：基本信息 -->
          <div class="col-left">
            <div class="card">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-info-circle"></i>
                  接口信息
                </div>
                <span class="status-badge" :class="activePort.enabled ? 'status-normal' : 'status-disabled'">
                  {{ activePort.enabled ? '已启用' : '未启用' }}
                </span>
              </div>
              <div class="card-content">
                <div class="info-grid cols-2">
                  <div class="info-item">
                    <div class="info-label">接口名称</div>
                    <div class="info-value">{{ activePort.name }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">接口类型</div>
                    <div class="info-value">{{ activePort.type }}</div>
                  </div>
                  <div class="info-item" v-if="activePort.category === 'gpio'">
                    <div class="info-label">引脚数量</div>
                    <div class="info-value">{{ activePort.pins.length }} 路</div>
                  </div>
                </div>

                <div class="port-toggle" v-if="!activePort.readonly && activePort.category !== 'gpio'">
                  <label class="toggle-label">
                    <span>启用接口</span>
                    <div class="toggle-switch" :class="{ on: editForm.enabled }" @click="editForm.enabled = !editForm.enabled">
                      <div class="toggle-knob"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 右：根据类别显示不同配置 -->
          <div class="col-right">

            <!-- ========== 串口配置 ========== -->
            <div class="card" v-if="activePort.category === 'serial'">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-sliders-h"></i>
                  串口参数
                </div>
                <span v-if="activePort.readonly" class="status-badge status-disabled">只读</span>
              </div>
              <div class="card-content">
                <!-- 只读接口：纯展示 -->
                <div v-if="activePort.readonly" class="info-grid cols-2">
                  <div class="info-item">
                    <div class="info-label">工作模式</div>
                    <div class="info-value">{{ activePort.type }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">波特率</div>
                    <div class="info-value">{{ activePort.baudRate }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">数据位</div>
                    <div class="info-value">{{ activePort.dataBits }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">停止位</div>
                    <div class="info-value">{{ activePort.stopBits }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">校验位</div>
                    <div class="info-value">{{ parityLabel(activePort.parity) }}</div>
                  </div>
                </div>
                <!-- 可编辑接口 -->
                <template v-else>
                  <div class="info-grid cols-2">
                    <div class="form-group">
                      <label>波特率</label>
                      <select class="form-control" v-model.number="editForm.baudRate">
                        <option v-for="b in baudRateOptions" :key="b" :value="b">{{ b }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>数据位</label>
                      <select class="form-control" v-model.number="editForm.dataBits">
                        <option :value="7">7</option>
                        <option :value="8">8</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>停止位</label>
                      <select class="form-control" v-model.number="editForm.stopBits">
                        <option :value="1">1</option>
                        <option :value="1.5">1.5</option>
                        <option :value="2">2</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>校验位</label>
                      <select class="form-control" v-model="editForm.parity">
                        <option value="none">无校验 (None)</option>
                        <option value="odd">奇校验 (Odd)</option>
                        <option value="even">偶校验 (Even)</option>
                      </select>
                    </div>
                  </div>

                  <!-- RS485 专属参数 -->
                  <template v-if="activePort.type === 'RS485'">
                    <div class="section-divider">RS485 参数</div>
                    <div class="info-grid cols-2">
                      <div class="form-group">
                        <label>RTS 方向控制</label>
                        <select class="form-control" v-model="editForm.rs485RtsControl">
                          <option value="auto">自动</option>
                          <option value="high">高电平</option>
                          <option value="low">低电平</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>终端电阻</label>
                        <select class="form-control" v-model="editForm.rs485Termination">
                          <option :value="true">启用</option>
                          <option :value="false">禁用</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>发送前延迟 (ms)</label>
                        <input type="number" class="form-control" v-model.number="editForm.rs485DelayBefore" min="0" step="1" />
                      </div>
                      <div class="form-group">
                        <label>发送后延迟 (ms)</label>
                        <input type="number" class="form-control" v-model.number="editForm.rs485DelayAfter" min="0" step="1" />
                      </div>
                    </div>
                  </template>

                  <div class="card-footer" style="justify-content: flex-end; gap: 12px; border-top: none; padding: 16px 0 0;">
                    <button class="btn btn-outline" @click="resetForm"><i class="fas fa-undo"></i> 重置</button>
                    <button class="btn btn-primary" @click="handleSave" :disabled="saving">
                      <i class="fas fa-save"></i> {{ saving ? '保存中...' : '保存配置' }}
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- ========== CAN 总线配置 ========== -->
            <div class="card" v-if="activePort.category === 'can'">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-sliders-h"></i>
                  CAN 总线参数
                </div>
              </div>
              <div class="card-content">
                <div class="info-grid cols-2">
                  <div class="form-group">
                    <label>波特率</label>
                    <select class="form-control" v-model.number="editForm.bitrate">
                      <option v-for="b in canBitrateOptions" :key="b" :value="b">{{ b / 1000 }} kbps</option>
                    </select>
                  </div>
                  <div class="info-item">
                    <div class="info-label">运行状态</div>
                    <div class="info-value">
                      <span class="status-dot" :class="activePort.runtimeState === 'up' ? 'dot-on' : 'dot-off'" style="display:inline-block;vertical-align:middle;margin-right:6px;"></span>
                      {{ activePort.runtimeState === 'up' ? 'UP' : 'DOWN' }}
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">实际波特率</div>
                    <div class="info-value">{{ activePort.runtimeBitrate ? (activePort.runtimeBitrate / 1000) + ' kbps' : '--' }}</div>
                  </div>
                </div>

                <div class="card-footer" style="justify-content: flex-end; gap: 12px; border-top: none; padding: 16px 0 0;">
                  <button class="btn btn-outline" @click="resetForm"><i class="fas fa-undo"></i> 重置</button>
                  <button class="btn btn-primary" @click="handleSave" :disabled="saving">
                    <i class="fas fa-save"></i> {{ saving ? '保存中...' : '保存配置' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- ========== GPIO 配置 ========== -->
            <div class="card" v-if="activePort.category === 'gpio'">
              <div class="card-header">
                <div class="card-title">
                  <i class="fas fa-sliders-h"></i>
                  GPIO 引脚配置
                </div>
              </div>
              <div class="card-content">
                <table class="gpio-table">
                  <thead>
                    <tr>
                      <th>引脚</th>
                      <th>别名</th>
                      <th>方向</th>
                      <th>电平</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pin in editForm.pins" :key="pin.id">
                      <td class="mono">{{ pin.id }}</td>
                      <td>
                        <input type="text" class="form-control form-control-sm" v-model="pin.alias" placeholder="未命名" />
                      </td>
                      <td>
                        <span>{{ pin.direction === 'input' ? '输入 (DI)' : '输出 (DO)' }}</span>
                      </td>
                      <td>
                        <span class="level-badge" :class="pin.level ? 'level-high' : 'level-low'">
                          {{ pin.level ? 'HIGH' : 'LOW' }}
                        </span>
                      </td>
                      <td>
                        <button
                          class="btn btn-sm"
                          :class="pin.direction === 'output' ? 'btn-outline' : 'btn-disabled'"
                          :disabled="pin.direction !== 'output'"
                          @click="togglePin(pin)"
                        >
                          {{ pin.level ? '置低' : '置高' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div class="card-footer" style="justify-content: flex-end; gap: 12px; border-top: none; padding: 16px 0 0;">
                  <button class="btn btn-outline" @click="gpioPolling ? stopGpioPolling() : startGpioPolling()">
                    <i :class="gpioPolling ? 'fas fa-pause' : 'fas fa-play'"></i>
                    {{ gpioPolling ? '暂停轮询' : '恢复轮询' }}
                  </button>
                  <button class="btn btn-outline" @click="resetForm"><i class="fas fa-undo"></i> 重置</button>
                  <button class="btn btn-primary" @click="handleSave" :disabled="saving">
                    <i class="fas fa-save"></i> {{ saving ? '保存中...' : '保存别名' }}
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
import { getSerialInterfaces, updateSerialInterface, getCanInterfaces, updateCanInterface, getGpioStatus, updateGpioLevel, updateGpioAlias } from '@/api/commInterface'

export default {
  name: 'CommunicationInterface',
  components: { MainLayout, PageHeader },
  data() {
    return {
      breadcrumbs: [{ title: '系统管理' }, { title: '通信接口' }],
      saving: false,
      activePortId: null,
      baudRateOptions: [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200],
      canBitrateOptions: [10000, 20000, 50000, 100000, 125000, 250000, 500000, 1000000],
      ports: [],
      editForm: {},
      gpioTimer: null,
      gpioPolling: false,
    }
  },
  computed: {
    activePort() {
      return this.ports.find((p) => p.id === this.activePortId) || null
    },
  },
  watch: {
    activePortId: {
      immediate: true,
      handler() { this.resetForm() },
    },
  },
  created() {
    this.loadSerialInterfaces()
    this.loadCanInterfaces()
    this.loadGpioStatus()
  },
  beforeUnmount() {
    this.stopGpioPolling()
  },
  methods: {
    async loadSerialInterfaces() {
      try {
        const res = await getSerialInterfaces()
        if (res.code === 200 && Array.isArray(res.data)) {
          this.ports = this.ports.filter(p => p.category !== 'serial')
          const serialPorts = res.data.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            category: 'serial',
            enabled: item.enabled,
            readonly: item.readonly,
            baudRate: item.baud_rate,
            dataBits: item.data_bits,
            stopBits: item.stop_bits,
            parity: item.parity,
            rs485: item.rs485,
          }))
          this.ports.unshift(...serialPorts)
          if (!this.activePort) {
            this.activePortId = this.ports[0]?.id
          }
        }
      } catch (err) {
        console.error('加载串口接口失败:', err)
      }
    },

    async loadCanInterfaces() {
      try {
        const res = await getCanInterfaces()
        if (res.code === 200 && Array.isArray(res.data)) {
          this.ports = this.ports.filter(p => p.category !== 'can')
          const canPorts = res.data.map(item => ({
            id: item.id,
            name: item.interface.toUpperCase(),
            type: 'CAN',
            category: 'can',
            enabled: item.enabled,
            bitrate: item.configured_bitrate,
            runtimeState: item.runtime_state,
            runtimeBitrate: item.runtime_bitrate,
          }))
          const gpioIdx = this.ports.findIndex(p => p.category === 'gpio')
          if (gpioIdx >= 0) {
            this.ports.splice(gpioIdx, 0, ...canPorts)
          } else {
            this.ports.push(...canPorts)
          }
        }
      } catch (err) {
        console.error('加载CAN接口失败:', err)
      }
    },

    async loadGpioStatus() {
      try {
        const res = await getGpioStatus()
        if (res.code === 200 && res.data) {
          this.ports = this.ports.filter(p => p.category !== 'gpio')
          this.ports.push({
            id: 'GPIO0',
            name: 'GPIO',
            type: 'GPIO',
            category: 'gpio',
            enabled: res.data.enabled,
            pins: res.data.pins,
          })
          if (!this.activePortId) {
            this.activePortId = this.ports[0]?.id
          }
          if (!this.gpioTimer) {
            // 首次加载自动开启轮询
            this.startGpioPolling()
          } else if (this.gpioPolling) {
            this.startGpioPolling()
          }
        }
      } catch (err) {
        console.error('加载GPIO状态失败:', err)
      }
    },

    startGpioPolling() {
      this.stopGpioPolling()
      this.gpioPolling = true
      this.gpioTimer = setInterval(() => this.pollGpioStatus(), 2000)
    },

    stopGpioPolling() {
      if (this.gpioTimer) {
        clearInterval(this.gpioTimer)
        this.gpioTimer = null
      }
      this.gpioPolling = false
    },

    async pollGpioStatus() {
      try {
        const res = await getGpioStatus()
        if (res.code === 200 && res.data) {
          const gpioPort = this.ports.find(p => p.id === 'GPIO0')
          if (gpioPort) gpioPort.pins = res.data.pins
          // 只更新电平，不触碰用户正在编辑的别名
          if (this.activePortId === 'GPIO0' && this.editForm.pins) {
            res.data.pins.forEach(pin => {
              const ep = this.editForm.pins.find(p => p.id === pin.id)
              if (ep) ep.level = pin.level
            })
          }
        }
      } catch (_) {}
    },

    handleNavigation() {},

    iconClass(category) {
      const map = { serial: 'fas fa-plug', can: 'fas fa-project-diagram', gpio: 'fas fa-microchip' }
      return map[category] || 'fas fa-plug'
    },

    iconBg(category) {
      const map = {
        serial: 'linear-gradient(135deg, #3498db, #2980b9)',
        can: 'linear-gradient(135deg, #e67e22, #d35400)',
        gpio: 'linear-gradient(135deg, #2ecc71, #27ae60)',
      }
      return map[category] || map.serial
    },

    parityLabel(val) {
      const map = { none: '无校验', odd: '奇校验', even: '偶校验' }
      return map[val] || val
    },

    resetForm() {
      if (!this.activePort) return
      const p = this.activePort
      if (p.category === 'serial') {
        this.editForm = {
          enabled: p.enabled,
          baudRate: p.baudRate,
          dataBits: p.dataBits,
          stopBits: p.stopBits,
          parity: p.parity,
          rs485RtsControl: p.rs485?.rts_control || 'auto',
          rs485Termination: p.rs485?.termination || false,
          rs485DelayBefore: p.rs485?.rts_delay_before_send || 0,
          rs485DelayAfter: p.rs485?.rts_delay_after_send || 0,
        }
      } else if (p.category === 'can') {
        this.editForm = {
          enabled: p.enabled, bitrate: p.bitrate,
        }
      } else if (p.category === 'gpio') {
        this.editForm = {
          enabled: p.enabled,
          pins: p.pins.map((pin) => ({ ...pin })),
        }
      }
    },

    togglePin(pin) {
      if (pin.direction !== 'output') return
      const newLevel = pin.level ? 0 : 1
      updateGpioLevel({ id: pin.id, level: newLevel }).then(res => {
        if (res.code === 200) {
          pin.level = newLevel
        } else {
          alert(res.message || '操作失败')
        }
      }).catch(err => {
        alert('操作失败: ' + (err.message || err))
      })
    },

    async handleSave() {
      const p = this.activePort
      if (!p) return

      if (p.category === 'serial') {
        await this.saveSerialConfig(p)
        return
      }
      if (p.category === 'can') {
        await this.saveCanConfig(p)
        return
      }
      if (p.category === 'gpio') {
        await this.saveGpioAliases(p)
        return
      }
    },

    async saveGpioAliases(port) {
      this.saving = true
      try {
        for (const pin of this.editForm.pins) {
          const orig = port.pins.find(p => p.id === pin.id)
          if (orig && orig.alias !== pin.alias) {
            const res = await updateGpioAlias({ id: pin.id, alias: pin.alias })
            if (res.code !== 200) {
              alert(`${pin.id} 别名保存失败: ${res.message || ''}`)
              return
            }
          }
        }
        alert('GPIO 别名保存成功')
        await this.loadGpioStatus()
      } catch (err) {
        alert('保存失败: ' + (err.message || err))
      } finally {
        this.saving = false
      }
    },

    async saveSerialConfig(port) {
      if (port.readonly) return
      this.saving = true
      try {
        const payload = {
          id: port.id,
          enabled: this.editForm.enabled,
          baud_rate: this.editForm.baudRate,
          data_bits: this.editForm.dataBits,
          stop_bits: this.editForm.stopBits,
          parity: this.editForm.parity,
        }
        if (port.type === 'RS485') {
          payload.rs485 = {
            enabled: true,
            rts_delay_before_send: this.editForm.rs485DelayBefore,
            rts_delay_after_send: this.editForm.rs485DelayAfter,
            rts_control: this.editForm.rs485RtsControl,
            termination: this.editForm.rs485Termination,
          }
        }
        const res = await updateSerialInterface(payload)
        if (res.code === 200) {
          alert(`${port.name} 配置保存成功`)
          await this.loadSerialInterfaces()
        } else {
          alert(res.message || '保存失败')
        }
      } catch (err) {
        console.error('保存串口配置失败:', err)
        alert('保存失败: ' + (err.response?.data?.message || err.message))
      } finally {
        this.saving = false
      }
    },

    async saveCanConfig(port) {
      this.saving = true
      try {
        const res = await updateCanInterface({
          interface: port.id,
          bitrate: this.editForm.bitrate,
          up: this.editForm.enabled,
        })
        if (res.code === 200) {
          port.enabled = this.editForm.enabled
          port.bitrate = this.editForm.bitrate
          alert(`${port.name} 配置保存成功`)
          await this.loadCanInterfaces()
        } else {
          alert(res.message || '保存失败')
        }
      } catch (err) {
        console.error('保存CAN配置失败:', err)
        alert('保存失败: ' + (err.response?.data?.message || err.message))
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.comm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 接口卡片列表 */
.port-cards {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.port-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.port-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.port-card.active {
  border-color: #3498db;
  background: #f0f7ff;
  box-shadow: 0 2px 12px rgba(52, 152, 219, 0.15);
}

.port-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.port-card-info {
  flex: 1;
  min-width: 0;
}

.port-card-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.port-card-type {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.port-card-status {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-on { background: #2ecc71; }
.dot-off { background: #cbd5e1; }

/* 左右布局 */
.config-columns {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.col-left { flex: 0 0 360px; }
.col-right { flex: 1; min-width: 0; }

/* 启用开关 */
.port-toggle {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #cbd5e1;
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
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

.mono { font-family: 'Courier New', monospace; }

.section-divider {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin: 16px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.status-disabled {
  background: #f1f5f9;
  color: #94a3b8;
}

/* GPIO 表格 */
.gpio-table {
  width: 100%;
  border-collapse: collapse;
}

.gpio-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 10px 12px;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.gpio-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #334155;
  vertical-align: middle;
}

.gpio-table tr:last-child td {
  border-bottom: none;
}

.form-control-sm {
  padding: 5px 10px;
  font-size: 13px;
  height: auto;
}

.level-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.level-high {
  background: #dcfce7;
  color: #16a34a;
}

.level-low {
  background: #f1f5f9;
  color: #94a3b8;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e5e7eb;
}

/* info-grid cols-3 */
.info-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 900px) {
  .config-columns {
    flex-direction: column;
  }

  .col-left {
    flex: none;
    width: 100%;
  }

  .port-cards {
    flex-direction: column;
  }

  .port-card {
    min-width: auto;
  }

  .info-grid.cols-3 {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
