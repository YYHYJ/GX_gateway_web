<template>
  <div class="top-header">
    <div class="header-content">
      <div class="page-title"><i :class="titleIcon"></i> {{ title }}</div>
      <div class="user-info">
        <i class="fas fa-bell"></i>
        <i class="fas fa-cog"></i>
        <div class="user-profile">
          <i class="fas fa-user-circle"></i>
          <span>{{ userName }}</span>
        </div>
        <!-- 新增退出登录按钮 -->
        <button class="logout-btn" @click="handleLogout" title="退出登录">
          <i class="fas fa-sign-out-alt"></i>
          <span class="logout-text">退出</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopHeader',
  props: {
    title: {
      type: String,
      default: '系统仪表盘',
    },
    titleIcon: {
      type: String,
      default: 'fas fa-tachometer-alt',
    },
    userName: {
      type: String,
      default: '管理员',
    },
  },
  methods: {
    // 退出登录处理
    handleLogout() {
      // 确认对话框
      if (confirm('确定要退出登录吗？')) {
        console.log('用户退出登录')

        // 触发退出登录事件
        this.$emit('logout')

        // 清除登录状态
        this.clearLoginStatus()

        // 跳转到登录页
        this.$router.push('/')
      }
    },

    // 清除登录状态
    clearLoginStatus() {
      // 清除本地存储的登录状态
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')

      // 可以添加其他清理逻辑
      console.log('登录状态已清除')
    },
  },
}
</script>

<style scoped>
.top-header {
  background-color: white;
  padding: 15px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title i {
  color: #2c3e50;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info i {
  font-size: 20px;
  color: #95a5a6;
  cursor: pointer;
  transition: color 0.2s;
}

.user-info i:hover {
  color: #3498db;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-profile i {
  font-size: 20px;
  color: #95a5a6;
}

.user-profile span {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

/* 退出登录按钮样式 */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: transparent;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  color: #e74c3c;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #e74c3c;
  color: white;
}

.logout-btn i {
  font-size: 13px;
  color: inherit;
}

.logout-text {
  white-space: nowrap;
}
</style>
