<template>
  <MainLayout active-nav="logs" user-name="管理员" @nav-change="handleNavigation">
    <div class="content-area">
      <!-- 面包屑导航 -->
      <PageHeader title="操作日志" :breadcrumbs="breadcrumbs" :actions="pageActions" />
      <div class="operationlog-content"></div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
export default {
  name: 'OperationLogs',
  components: {
    MainLayout,
    PageHeader,
  },
  methods: {
    handleNavigation(nav) {
      // 处理导航变化的逻辑
      console.log('当前导航:', nav)
    },
  },
  data() {
    return {
      breadcrumbs: [
        { title: '日志系统', link: '/system' },
        { title: '操作日志', link: '/system/operation-logs' },
      ],
      pageActions: [
        {
          text: '导出操作日志',
          type: 'primary',
          icon: 'fas fa-download',
          handler: () => {
            // 导出操作日志的处理逻辑
            console.log('导出操作日志')
          },
        },
        {
          text: '刷新',
          type: 'default',
          icon: 'fas fa-sync-alt',
          handler: () => {
            // 刷新页面的处理逻辑
            console.log('刷新页面')
          },
        },
      ],
    }
  },
}
</script>

<style scoped>
/* 基础布局样式 - 保持与设备实例页面一致 */
.content-area {
  padding: 0;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.operationlog-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-top: 20px;
}
</style>
