<template>
  <!-- 侧边导航栏 -->
  <div class="sidebar">
    <div class="logo">
      <i class="fas fa-network-wired"></i>
      <h1>数据采集网关</h1>
    </div>

    <div class="nav-menu">
      <!-- 遍历菜单项 -->
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="nav-item"
        :class="{
          active: activeItem === item.id,
          expanded: item.expanded,
          'has-children': item.children && item.children.length,
        }"
      >
        <!-- 主菜单项 -->
        <div class="nav-main" @click="handleNavClick(item)">
          <i :class="item.icon"></i>
          <span class="nav-text">{{ item.name }}</span>
          <i
            v-if="item.children && item.children.length"
            class="fas fa-chevron-right nav-arrow"
          ></i>
        </div>

        <!-- 子菜单 -->
        <div v-if="item.children && item.children.length" class="submenu">
          <router-link
            v-for="child in item.children"
            :key="child.id"
            :to="child.path"
            class="submenu-item"
            :class="{ active: activeSubItem === child.id }"
            @click="handleSubNavClick(child, item)"
          >
            {{ child.name }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    activeItem: {
      type: String,
      default: 'dashboard',
    },
    activeSubItem: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      menuItems: [
        {
          id: 'dashboard',
          name: '仪表盘',
          icon: 'fas fa-tachometer-alt', // 仪表盘图标
          path: '/dashboard',
          expanded: true,
          children: [],
        },
        {
          id: 'data-collection',
          name: '数据采集与转发',
          icon: 'fas fa-database', // 数据库图标
          path: '',
          expanded: true,
          children: [
            {
              id: 'protocol-overview',
              name: '协议总览',
              path: '/data/protocol-overview',
              active: true,
            },
            {
              id: 'communication-interface',
              name: '通信接口',
              path: '/data/communication-interface',
            },
            {
              id: 'DeviceTemplate',
              name: '设备模板',
              path: '/data/device/modelConfig', // 修改为与API一致的路径
            },
            {
              id: 'device-instance',
              name: '设备实例',
              path: '/data/device-instance',
            },
            {
              id: 'collection-debug',
              name: '采集调试',
              path: '/data/collection-debug',
            },
          ],
        },
        {
          id: 'system-management',
          name: '系统管理',
          icon: 'fas fa-cogs', // 齿轮组图标，比单个齿轮更合适
          path: '',
          expanded: false,
          children: [
            {
              id: 'system-settings',
              name: '系统设置',
              path: '/system/settings',
            },
            {
              id: 'network-config',
              name: '网络配置',
              path: '/system/network',
            },
            {
              id: 'user-management',
              name: '用户管理',
              path: '/system/users',
            },
            {
              id: 'data-backup',
              name: '数据备份',
              path: '/system/backup',
            },
          ],
        },
        {
          id: 'log-system',
          name: '日志系统',
          icon: 'fas fa-clipboard-list', // 列表图标
          path: '',
          expanded: false,
          children: [
            {
              id: 'system-logs',
              name: '系统日志',
              path: '/logs/system',
            },
            {
              id: 'operation-logs',
              name: '操作日志',
              path: '/logs/operation',
            },
            {
              id: 'communication-logs',
              name: '通信日志',
              path: '/logs/communication',
            },
          ],
        },
        {
          id: 'ota-upgrade',
          name: 'OTA升级',
          icon: 'fas fa-cloud-upload-alt', // 云上传图标
          path: '/ota',
          expanded: false,
          children: [],
        },
      ],
    }
  },
  methods: {
    // 处理主菜单点击
    handleNavClick(item) {
      if (item.children && item.children.length) {
        this.toggleSubmenu(item)
      } else {
        this.$emit('nav-change', item.id)
        if (item.path) {
          this.$router.push(item.path)
        }
      }
    },

    // 处理子菜单点击
    handleSubNavClick(childItem, parentItem) {
      this.$emit('sub-nav-change', {
        parent: parentItem.id,
        child: childItem.id,
      })
      this.$emit('nav-change', childItem.id)

      // 跳转到子菜单路由
      if (childItem.path) {
        this.$router.push(childItem.path)
      }
    },

    // 切换子菜单展开状态
    toggleSubmenu(item) {
      // 创建新的数组确保响应性
      this.menuItems = this.menuItems.map((menuItem) => {
        if (menuItem.id === item.id) {
          // 切换当前菜单的展开状态
          return {
            ...menuItem,
            expanded: !menuItem.expanded,
          }
        } else {
          // 关闭其他菜单
          return {
            ...menuItem,
            expanded: false,
          }
        }
      })
    },

    // 点击页面其他区域关闭菜单
    closeAllSubmenus(event) {
      if (!this.$el.contains(event.target)) {
        this.menuItems = this.menuItems.map((item) => ({
          ...item,
          expanded: false,
        }))
      }
    },
  },
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: linear-gradient(180deg, var(--primary-color), var(--dark-color));
  color: white;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo i {
  font-size: 32px;
  margin-bottom: 10px;
  color: var(--secondary-color);
}

.logo h1 {
  font-size: 18px;
  font-weight: 600;
}

.nav-menu {
  padding: 0;
}

.nav-item {
  position: relative;
}

.nav-main {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.nav-main:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item.active .nav-main {
  background-color: rgba(52, 152, 219, 0.2);
  border-left-color: var(--secondary-color);
}

.nav-main i:first-child {
  margin-right: 12px;
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.nav-text {
  font-size: 16px;
  flex: 1;
  font-weight: 600;
}

.nav-arrow {
  transition: transform 0.3s;
  font-size: 12px;
}

.nav-item.expanded .nav-arrow {
  transform: rotate(90deg);
}

/* 子菜单样式 */
.submenu {
  background-color: rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  max-height: 0;
}

.nav-item.expanded .submenu {
  max-height: 300px;
}

.submenu-item {
  padding: 12px 20px 12px 50px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  border-left: 4px solid transparent;
  display: block;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
}

.submenu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.submenu-item.active {
  background-color: rgba(52, 152, 219, 0.3);
  border-left-color: var(--secondary-color);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .sidebar .logo h1,
  .sidebar .nav-text,
  .nav-arrow,
  .submenu-item span {
    display: none;
  }

  .sidebar .nav-main {
    justify-content: center;
    padding: 15px;
  }

  .sidebar .nav-main i:first-child {
    margin-right: 0;
    font-size: 20px;
  }

  .submenu-item {
    padding: 12px 15px;
    justify-content: center;
  }
}
</style>
