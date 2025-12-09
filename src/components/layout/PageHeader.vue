<template>
  <div class="page-header">
    <div class="header-left">
      <div class="breadcrumb">
        <span
          v-for="(item, index) in breadcrumbs"
          :key="index"
          :class="['breadcrumb-item', { clickable: isClickable(item, index) }]"
          @click="isClickable(item, index) ? handleBreadcrumbClick(item) : null"
        >
          <span v-if="item.link && isClickable(item, index)" class="breadcrumb-link">
            {{ item.title }}
          </span>
          <span v-else class="breadcrumb-text">
            {{ item.title }}
          </span>
          <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator"> &gt; </span>
        </span>
      </div>
      <h1 class="page-title">{{ title }}</h1>
    </div>

    <div class="header-actions">
      <button
        v-for="(action, index) in actions"
        :key="index"
        :class="['btn', action.type ? `btn-${action.type}` : 'btn-outline']"
        @click="action.handler"
      >
        <i :class="action.icon"></i> {{ action.text }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      required: true,
    },
    breadcrumbs: {
      type: Array,
      default: () => [],
      validator: (value) => {
        // 验证面包屑数据格式
        return value.every(
          (item) =>
            item &&
            typeof item.title === 'string' &&
            (item.link === undefined || typeof item.link === 'string'),
        )
      },
    },
    actions: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    // 判断是否显示三级面包屑
    hasThreeLevels() {
      return this.breadcrumbs.length >= 3
    },
  },
  methods: {
    // 判断面包屑项是否可点击
    isClickable(item, index) {
      // 第一级永远不可点击
      if (index === 0) return false

      // 只有存在三级时，第二级才可点击
      if (index === 1) {
        return this.hasThreeLevels
      }

      // 第三级及以后永远不可点击（当前页）
      return false
    },

    handleBreadcrumbClick(item) {
      if (item.clickHandler) {
        item.clickHandler()
      } else if (item.link) {
        this.$router.push(item.link)
      }
    },
  },
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.header-left {
  flex: 1;
}

.breadcrumb {
  font-size: 14px;
  color: var(--gray-color, #95a5a6);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item.clickable {
  cursor: pointer;
}

.breadcrumb-item:not(.clickable) {
  cursor: default;
}

.breadcrumb-link {
  color: var(--secondary-color, #3498db);
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.breadcrumb-link:hover {
  color: var(--primary-color, #2c3e50);
  text-decoration: underline;
}

.breadcrumb-text {
  color: var(--primary-color, #2c3e50);
  font-weight: 500;
  cursor: default;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: var(--gray-color, #95a5a6);
}

/* 当前页面（最后一级）特殊样式 */
.breadcrumb-item:last-child .breadcrumb-text {
  color: var(--dark-color, #34495e);
  font-weight: 600;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color, #2c3e50);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  outline: none;
  font-family: inherit;
}

.btn:focus {
  outline: 2px solid var(--secondary-color, #3498db);
  outline-offset: 2px;
}

.btn-primary {
  background-color: var(--secondary-color, #3498db);
  border-color: var(--secondary-color, #3498db);
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
  border-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

.btn-outline {
  background-color: transparent;
  border-color: var(--gray-color, #95a5a6);
  color: var(--dark-color, #34495e);
}

.btn-outline:hover {
  background-color: #f8f9fa;
  border-color: var(--secondary-color, #3498db);
  color: var(--secondary-color, #3498db);
  transform: translateY(-1px);
}

.btn-success {
  background-color: var(--success-color, #2ecc71);
  border-color: var(--success-color, #2ecc71);
  color: white;
}

.btn-success:hover {
  background-color: #27ae60;
  border-color: #27ae60;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(46, 204, 113, 0.3);
}

.btn-warning {
  background-color: var(--warning-color, #f39c12);
  border-color: var(--warning-color, #f39c12);
  color: white;
}

.btn-warning:hover {
  background-color: #e67e22;
  border-color: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(243, 156, 18, 0.3);
}

.btn-danger {
  background-color: var(--danger-color, #e74c3c);
  border-color: var(--danger-color, #e74c3c);
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
  border-color: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
}

.btn i {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0 15px 15px;
  }

  .breadcrumb {
    font-size: 13px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .btn-text {
    display: none;
  }

  .btn i {
    margin-right: 0;
  }
}

/* 动画效果 */
.page-header {
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
