<template>
  <GlobalMessageContainer />
  <!-- 动态组件插槽 -->
  <router-view />
</template>

<script>
import GlobalMessageContainer from '@/components/common/GlobalMessageContainer.vue'
export default {
  name: 'App',
  components: {
    GlobalMessageContainer,
  },
}
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f5f5;
}
</style>
