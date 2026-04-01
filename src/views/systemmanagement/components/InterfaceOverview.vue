<template>
  <div class="interfaces-overview">
    <div
      v-for="iface in interfaces"
      :key="iface.name"
      class="iface-card"
      :class="{ active: activeName === iface.name }"
      @click="$emit('select', iface)"
    >
      <div class="iface-icon">
        <i class="fas fa-ethernet"></i>
        <span
          class="iface-status-dot"
          :class="iface.status === 'connected' ? 'dot-online' : 'dot-offline'"
        ></span>
      </div>
      <div class="iface-info">
        <div class="iface-name">{{ iface.name }}</div>
        <div class="iface-ip">{{ iface.current_ip || '未分配' }}</div>
        <div class="iface-meta">
          <span
            class="iface-status-text"
            :class="iface.status === 'connected' ? 'text-success' : 'text-gray'"
          >
            {{ iface.status === 'connected' ? '已连接' : '未连接' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InterfaceOverview',
  props: {
    interfaces: { type: Array, default: () => [] },
    activeName: { type: String, default: null },
  },
  emits: ['select'],
}
</script>

<style scoped>
.interfaces-overview {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.iface-card {
  flex: 1;
  min-width: 200px;
  max-width: 280px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.iface-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
}

.iface-card.active {
  border-color: #3498db;
  background: #eef6ff;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.12);
}

.iface-icon {
  position: relative;
  width: 44px;
  height: 44px;
  background: #f0f4f8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.iface-card.active .iface-icon {
  background: #dbeafe;
}

.iface-icon i {
  font-size: 20px;
  color: #3498db;
}

.iface-status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.dot-online { background: #2ecc71; }
.dot-offline { background: #bdc3c7; }

.iface-info { overflow: hidden; }

.iface-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.iface-ip {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.iface-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.iface-status-text { font-weight: 500; }

@media (max-width: 768px) {
  .interfaces-overview { flex-direction: column; }
  .iface-card { max-width: none; }
}
</style>
