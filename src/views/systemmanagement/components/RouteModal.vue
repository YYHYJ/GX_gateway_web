<template>
  <div class="modal-overlay" v-if="visible" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ isEdit ? '编辑路由' : '添加路由' }}</h3>
        <button class="modal-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>目标网段</label>
          <input
            type="text"
            class="form-control"
            v-model="form.destination"
            placeholder="例如: 10.10.0.0"
            :disabled="isDefault"
          />
          <span class="form-text" v-if="isDefault">默认路由目标网段不可修改</span>
        </div>
        <div class="form-group">
          <label>子网掩码</label>
          <input
            type="text"
            class="form-control"
            v-model="form.netmask"
            placeholder="例如: 255.255.0.0"
            :disabled="isDefault"
          />
        </div>
        <div class="form-group">
          <label>下一跳网关</label>
          <input
            type="text"
            class="form-control"
            v-model="form.gateway"
            placeholder="例如: 192.168.1.1"
          />
        </div>
        <div class="form-group">
          <label>出接口</label>
          <select class="form-control" v-model="form.iface">
            <option v-for="iface in interfaces" :key="iface.name" :value="iface.name">
              {{ iface.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>优先级 (Metric)</label>
          <input
            type="number"
            class="form-control"
            v-model.number="form.metric"
            placeholder="默认 100，数值越小优先级越高"
            min="0"
          />
        </div>
        <div class="form-group">
          <label>备注（可选）</label>
          <input
            type="text"
            class="form-control"
            v-model="form.remark"
            placeholder="例如: 采集设备网段"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RouteModal',
  props: {
    visible: { type: Boolean, default: false },
    route: { type: Object, default: null },
    interfaces: { type: Array, default: () => [] },
    defaultIfaceName: { type: String, default: 'eth0' },
  },
  emits: ['close', 'save'],
  data() {
    return {
      form: this.getEmptyForm(),
    }
  },
  computed: {
    isEdit() {
      return this.route !== null
    },
    isDefault() {
      return this.route && this.route.isDefault
    },
  },
  watch: {
    visible(val) {
      if (!val) return
      if (this.route) {
        this.form = {
          destination: this.route.destination,
          netmask: this.route.netmask,
          gateway: this.route.gateway,
          iface: this.route.iface,
          metric: this.route.metric,
          remark: this.route.remark || '',
        }
      } else {
        this.form = this.getEmptyForm()
      }
    },
  },
  methods: {
    getEmptyForm() {
      return {
        destination: '',
        netmask: '255.255.255.0',
        gateway: '',
        iface: this.defaultIfaceName,
        metric: 100,
        remark: '',
      }
    },
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
      if (!this.validateIp(this.form.gateway)) return alert('请输入有效的下一跳网关')
      if (!this.isDefault) {
        if (!this.validateIp(this.form.destination)) return alert('请输入有效的目标网段')
        if (!this.validateIp(this.form.netmask)) return alert('请输入有效的子网掩码')
      }
      this.$emit('save', {
        ...this.form,
        isDefault: this.isDefault,
        _editKey: this.isEdit && !this.isDefault,
      })
    },
  },
}
</script>
