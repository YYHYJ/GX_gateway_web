<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <Sidebar :active-item="activeNav" @nav-change="handleNavChange" />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <TopHeader :title="pageTitle" :title-icon="pageIcon" :user-name="userName" />

      <!-- 内容区域 -->
      <div class="content-area">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue'
import TopHeader from './TopHeader.vue'

export default {
  name: 'MainLayout',
  components: {
    Sidebar,
    TopHeader,
  },
  props: {
    activeNav: {
      type: String,
      default: 'dashboard',
    },
    userName: {
      type: String,
      default: '管理员',
    },
  },
  computed: {
    pageTitle() {
      const titleMap = {
        dashboard: '系统仪表盘',
        data: '数据采集与转发',
        system: '系统管理',
        logs: '日志系统',
        ota: 'OTA升级',
      }
      return titleMap[this.activeNav] || '--'
    },
    pageIcon() {
      const iconMap = {
        dashboard: 'fas fa-tachometer-alt',
        data: 'fas fa-database',
        system: 'fas fa-cog',
        logs: 'fas fa-clipboard-list',
        ota: 'fas fa-upload',
      }
      return iconMap[this.activeNav] || 'fas fa-tachometer-alt'
    },
  },
  methods: {
    handleNavChange(navId) {
      this.$emit('nav-change', navId)
    },
  },
}
</script>

<style scoped>
/* 主布局容器 */
.main-layout {
  display: flex;
  min-height: 100vh;
  width: 100%; /* 关键：确保宽度为100% */
}

/* 侧边栏 */
.sidebar-container {
  width: var(--sidebar-width);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1000;
  background-color: #1e293b; /* 深色背景，类似图片 */
}

/* 主内容区 */
.main-content {
  margin-left: var(--sidebar-width); /* 左边距等于侧边栏宽度 */
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: calc(100% - var(--sidebar-width)); /* 关键：减去侧边栏宽度 */
}

/* 顶部导航 */
.top-header-container {
  position: sticky;
  top: 0;
  z-index: 999;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%; /* 关键：宽度100% */
}

/* 内容区 */
.content-area {
  flex: 1;
  padding: 20px 30px;
  background-color: #f3f4f6; /* 浅灰色背景 */
  overflow-y: auto;
  min-height: calc(100vh - 60px); /* 减去顶部导航高度 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-container {
    width: 70px;
  }

  .main-content {
    margin-left: 70px;
    width: calc(100% - 70px);
  }
}
</style>
