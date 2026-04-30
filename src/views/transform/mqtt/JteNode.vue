<!-- src/views/transform/mqtt/JteNode.vue -->
<template>
  <div class="jn">
    <!-- 节点行 -->
    <div
      class="jn-row"
      :class="{ selected: node._id === selectedId, 'drag-over': dragOver }"
      draggable="true"
      @click.stop="$emit('select', node._id)"
      @dragstart.stop="onDragStart"
      @dragend.stop="onDragEnd"
      @dragover.prevent.stop="dragOver = true"
      @dragleave.stop="dragOver = false"
      @drop.prevent.stop="onDrop"
    >
      <!-- 拖拽手柄 -->
      <span class="jn-drag" title="拖拽排序"><i class="fas fa-grip-vertical"></i></span>

      <!-- 展开/折叠 -->
      <button v-if="isContainer" class="jn-toggle" @click.stop="expanded = !expanded">
        <i class="fas" :class="expanded ? 'fa-caret-down' : 'fa-caret-right'"></i>
      </button>
      <span v-else class="jn-toggle-ph"></span>

      <!-- 图标 -->
      <span class="jn-icon">
        <i v-if="node.type === 'object'" class="fas fa-folder-open" style="color:#f39c12"></i>
        <i v-else-if="node.type === 'array'" class="fas fa-list" style="color:#9b59b6"></i>
        <i v-else-if="node.source === 'point'" class="fas fa-database" style="color:#3498db"></i>
        <i v-else-if="node.source === 'fixed'" class="fas fa-lock" style="color:#95a5a6"></i>
        <i v-else-if="node.source === 'system'" class="fas fa-cog" style="color:#2ecc71"></i>
        <i v-else class="fas fa-circle" style="color:#bdc3c7;font-size:7px"></i>
      </span>

      <!-- key -->
      <template v-if="parentType !== 'array'">
        <span class="jn-key">"{{ node.key || '未命名' }}"</span>
        <span class="jn-colon">:</span>
      </template>
      <span v-else class="jn-arr-idx">[{{ nodeIndex }}]</span>

      <!-- 值描述 -->
      <span v-if="node.type === 'object'" class="jn-badge jn-badge-obj">
        { {{ childCount }} 个字段 }<span v-if="node.auto_fill" class="jn-auto-tag">自动</span>
      </span>
      <span v-else-if="node.type === 'array'" class="jn-badge jn-badge-arr">
        [ {{ childCount }} 项 ]<span v-if="node.auto_fill" class="jn-auto-tag">自动</span>
      </span>
      <span v-else-if="node.source === 'point'" class="jn-val jn-v-point">← {{ pointLabel }}</span>
      <span v-else-if="node.source === 'fixed'" class="jn-val jn-v-fixed">= {{ node.value !== '' ? node.value : '空' }}</span>
      <span v-else-if="node.source === 'system'" class="jn-val jn-v-sys">${ {{ node.value || '?' }} }</span>
      <span v-else class="jn-val jn-v-none">未配置</span>

      <!-- 删除 -->
      <button class="jn-del" @click.stop="$emit('remove', node._id)" title="删除"><i class="fas fa-trash-alt"></i></button>
    </div>

    <!-- 子节点 -->
    <div v-if="isContainer && expanded" class="jn-children">
      <div class="jn-vline"></div>
      <div class="jn-children-inner">
        <jte-node
          v-for="(child, idx) in node.children"
          :key="child._id"
          :node="child"
          :node-index="idx"
          :selected-id="selectedId"
          :report-points="reportPoints"
          :parent-type="node.type"
          @select="(id) => $emit('select', id)"
          @remove="(id) => $emit('remove', id)"
          @add-child="(e) => $emit('add-child', e)"
          @move="(e) => $emit('move', e)"
        />
        <div class="jn-add-bar">
          <button class="jn-add-btn" @click.stop="$emit('add-child', { parent: node, type: 'leaf' })">
            <i class="fas fa-plus"></i> 字段
          </button>
          <button class="jn-add-btn jn-add-o" @click.stop="$emit('add-child', { parent: node, type: 'object' })">
            <i class="fas fa-folder-plus"></i> 对象
          </button>
          <button class="jn-add-btn jn-add-a" @click.stop="$emit('add-child', { parent: node, type: 'array' })">
            <i class="fas fa-list-ol"></i> 数组
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JteNode',
  props: {
    node: { type: Object, required: true },
    nodeIndex: { type: Number, default: 0 },
    selectedId: { type: [Number, null], default: null },
    reportPoints: { type: Array, default: () => [] },
    parentType: { type: String, default: 'object' },
  },
  emits: ['select', 'remove', 'add-child', 'move'],
  data() {
    return { expanded: true, dragOver: false }
  },
  computed: {
    isContainer() {
      return this.node.type === 'object' || this.node.type === 'array'
    },
    childCount() {
      return (this.node.children || []).length
    },
    pointLabel() {
      if (!this.node.point_id) return '未绑定'
      const rp = this.reportPoints.find((p) => p.id == this.node.point_id)
      if (!rp) return `#${this.node.point_id}`
      return rp.report_alias || rp.point_code
    },
  },
  methods: {
    onDragStart(e) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(this.node._id))
      e.target.classList.add('dragging')
    },
    onDragEnd(e) {
      e.target.classList.remove('dragging')
      this.dragOver = false
    },
    onDrop(e) {
      this.dragOver = false
      const fromId = Number(e.dataTransfer.getData('text/plain'))
      if (fromId && fromId !== this.node._id) {
        this.$emit('move', { fromId, toId: this.node._id })
      }
    },
  },
}
</script>

<style scoped>
.jn { margin-left: 2px; }

.jn-row {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 5px; cursor: pointer;
  transition: background 0.1s; margin: 2px 0;
  font-family: 'Menlo','Monaco','Consolas',monospace; font-size: 13px;
}
.jn-row:hover { background: #f0f7ff; }
.jn-row.selected { background: #e3f2fd; outline: 1.5px solid #3498db; }
.jn-row.drag-over { border-top: 2px solid #3498db; background: #e8f4fd; padding-top: 3px; margin-top: 0; }
.jn-row.dragging { opacity: 0.35; }

.jn-drag {
  cursor: grab; color: #ccc; font-size: 11px; flex-shrink: 0;
  padding: 0 2px; transition: color 0.15s;
}
.jn-drag:active { cursor: grabbing; }
.jn-row:hover .jn-drag { color: #7f8c8d; }

.jn-toggle {
  width: 20px; height: 20px; border: none; background: none;
  cursor: pointer; color: #7f8c8d; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 3px; flex-shrink: 0;
}
.jn-toggle:hover { background: #edf2f7; color: #2c3e50; }
.jn-toggle-ph { width: 20px; flex-shrink: 0; }

.jn-icon { width: 18px; text-align: center; flex-shrink: 0; font-size: 14px; }
.jn-key { color: #c0392b; font-weight: 600; white-space: nowrap; }
.jn-colon { color: #7f8c8d; }
.jn-arr-idx { color: #8e44ad; font-size: 11px; font-weight: 500; white-space: nowrap; }

.jn-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  display: flex; align-items: center; gap: 3px; white-space: nowrap;
}
.jn-badge-obj { color: #e67e22; background: #fef9e7; border: 1px solid #fdeaa8; }
.jn-badge-arr { color: #8e44ad; background: #f5eef8; border: 1px solid #e8daef; }

.jn-auto-tag {
  font-size: 10px; background: #27ae60; color: #fff;
  padding: 1px 5px; border-radius: 3px; margin-left: 4px;
}

.jn-val { font-size: 12px; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.jn-v-point { color: #3498db; }
.jn-v-fixed { color: #27ae60; }
.jn-v-sys { color: #8e44ad; font-style: italic; }
.jn-v-none { color: #bdc3c7; font-style: italic; }

.jn-del {
  opacity: 0; margin-left: auto; background: none; border: none;
  color: #e74c3c; cursor: pointer; padding: 3px 6px; font-size: 12px;
  border-radius: 3px; flex-shrink: 0; transition: opacity 0.12s;
}
.jn-row:hover .jn-del { opacity: 1; }
.jn-del:hover { background: #fdecea; }

.jn-children { display: flex; margin-left: 10px; }

.jn-vline {
  width: 2px; background: #e1e5e9; border-radius: 1px;
  margin: 0 8px; flex-shrink: 0;
}

.jn-children-inner { flex: 1; min-width: 0; padding: 2px 0; }

.jn-add-bar { display: flex; gap: 6px; padding: 4px 10px; margin-top: 2px; }

.jn-add-btn {
  padding: 3px 10px; border: 1px dashed #bdc3c7; border-radius: 4px;
  background: none; cursor: pointer; font-size: 11px; color: #7f8c8d;
  display: flex; align-items: center; gap: 4px; transition: all 0.15s;
}
.jn-add-btn:hover { border-color: #3498db; color: #3498db; background: #f0f7ff; }
.jn-add-o:hover { border-color: #f39c12; color: #e67e22; background: #fef9e7; }
.jn-add-a:hover { border-color: #9b59b6; color: #8e44ad; background: #f5eef8; }
</style>
