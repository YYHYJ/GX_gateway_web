<template>
  <div class="hello-world">
    <h1>{{ msg }}</h1>
    <p>这是一个示例组件</p>
  </div>
</template>

<script setup>
// Vue3的Composition API写法
import { defineProps } from 'vue'

const props = defineProps({
  msg: {
    type: String,
    default: 'Hello World!'
  }
})
</script>

<style scoped>
.hello-world {
  text-align: center;
  padding: 20px;
}

.hello-world h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}
</style>
