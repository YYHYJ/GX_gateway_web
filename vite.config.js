/**
 * Vite配置文件
 * 原理：Vite是现代化的前端构建工具，比Webpack更快
 * 通过server.proxy配置解决开发环境的跨域问题
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 重要：添加这行
  plugins: [vue()],

  // 开发服务器配置
  server: {
    port: 3000, // 前端开发服务器端口
    open: true, // 启动后自动打开浏览器
    cors: true, // 允许跨域

    // 代理配置 - 解决开发环境跨域
    proxy: {
      // 原理：Vite开发服务器会将匹配的请求转发到目标服务器
      // 这样浏览器看到的是同源请求，实际上被代理了
      '/api': {
        target: 'http://172.27.135.60:8080', // 你的WSL后端地址
        changeOrigin: true, // 修改请求头中的Origin
        secure: false, // 如果是https，需要设置为false
        //rewrite: (path) => path.replace(/^\/api/, '/api'), // 路径重写
      },

      // WebSocket代理 - 必须单独配置
      '/ws': {
        target: 'ws://172.27.135.60:8080',
        changeOrigin: true,
        secure: false,
        ws: true, // 启用WebSocket代理
        rewrite: (path) => path.replace(/^\/ws/, '/ws'),
      },
    },
  },

  build: {
    outDir: 'dist',
    // 确保 assetsDir 配置正确
    assetsDir: 'assets',
  },

  // 路径别名配置
  resolve: {
    alias: {
      '@': '/src', // 配置@指向src目录
    },
  },
})
