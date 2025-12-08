<template>
  <div class="dashboard">
    <h1>欢迎来到GX Gateway</h1>
    <p>登录成功！</p>
    <p>用户名：{{ username }}</p>
    <button @click="handleLogout" class="logout-btn">退出登录</button>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      username: '',
    }
  },
  created() {
    // 检查是否已登录
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      this.$router.push('/')
      return
    }

    this.username = localStorage.getItem('username') || '用户'
  },
  methods: {
    handleLogout() {
      // 清除登录状态
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('username')

      // 跳转到登录页
      this.$router.push('/')
    },
  },
}
</script>

<style scoped>
.dashboard {
  padding: 40px;
  text-align: center;
  font-family: Arial, sans-serif;
}

.dashboard h1 {
  color: #333;
  margin-bottom: 20px;
}

.dashboard p {
  color: #666;
  margin: 10px 0;
}

.logout-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.logout-btn:hover {
  background: #e53e3e;
}
</style>
