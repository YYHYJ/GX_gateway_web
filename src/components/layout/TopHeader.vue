<template>
  <div class="top-header">
    <div class="header-content">
      <div class="page-title"><i :class="titleIcon"></i> {{ title }}</div>
      <div class="user-info">
        <div class="user-profile">
          <i class="fas fa-user-circle"></i>
          <span>{{ userName }}</span>
        </div>

        <!-- 重启程序按钮-->
        <button
          class="restart-btn"
          @click="handleApplyEdit"
          :disabled="applyingEdit"
          title="重启网关程序"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': applyingEdit }"></i>
          <span class="restart-text">{{ applyingEdit ? '重启中...' : '重启程序' }}</span>
        </button>

        <!-- 退出登录按钮-->
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
  data() {
    return {
      applyingEdit: false,
    }
  },
  created() {
    this.showRestartSuccessMessage()
  },
  methods: {
    // 重启程序方法
    async handleApplyEdit() {
      const confirmText = '确定要重启网关程序吗？\n\n系统将在10秒内重启，重启完成后页面会自动刷新。'

      if (!confirm(confirmText)) {
        return
      }

      this.applyingEdit = true

      try {
        const response = await fetch('/api/system/restart')
        const result = await response.json()

        if (response.ok && result.code === 200) {
          // 在 sessionStorage 中设置标志（刷新后有效）
          sessionStorage.setItem('restart_success', 'true')

          // 立即显示即将刷新的提示
          alert('✅ 重启指令已发送！页面将在10秒后自动刷新...')

          // 10秒后刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 10000)
        } else {
          alert(`❌ 重启失败: ${result.message || '未知错误'}`)
          this.applyingEdit = false
        }
      } catch (error) {
        alert(`❌ 重启失败: ${error.message || '网络错误'}`)
        this.applyingEdit = false
      }
    },

    // 显示重启成功消息
    showRestartSuccessMessage() {
      const restartSuccess = sessionStorage.getItem('restart_success')

      if (restartSuccess === 'true') {
        setTimeout(() => {
          alert('🎉 网关重启成功！系统已恢复正常运行。')
          sessionStorage.removeItem('restart_success')
        }, 800)
      }
    },

    // 退出登录处理（保持原样不变）
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

    // 清除登录状态（保持原样不变）
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

/* 用户信息样式 */
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

/* 重启程序按钮样式 */
.restart-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: transparent;
  border: 1px solid #3498db; /* 蓝色边框 */
  border-radius: 4px;
  color: #3498db; /* 蓝色文字 */
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.restart-btn:hover:not(:disabled) {
  background-color: #3498db; /* 蓝色背景 */
  color: white;
}

.restart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5;
  border-color: #ddd;
  color: #999;
}

.restart-btn i {
  font-size: 13px;
  color: inherit;
}

.restart-text {
  white-space: nowrap;
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

/* 旋转动画 */
.fa-spin {
  animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-header {
    padding: 10px 15px;
  }

  .page-title {
    font-size: 18px;
  }

  .user-profile span {
    display: none;
  }

  .restart-text {
    display: none;
  }

  .restart-btn {
    padding: 6px 8px;
  }

  .logout-text {
    display: none;
  }

  .logout-btn {
    padding: 6px 8px;
  }
}
</style>
