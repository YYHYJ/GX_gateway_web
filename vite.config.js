/**
 * Vite配置文件
 * 原理：Vite是现代化的前端构建工具，比Webpack更快
 * 通过server.proxy配置解决开发环境的跨域问题
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
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
        rewrite: (path) => path.replace(/^\/api/, ''), // 路径重写
      },
    },
  },

  // 生产环境打包配置
  build: {
    outDir: 'dist', // 打包输出目录
    assetsDir: 'assets', // 静态资源目录
    sourcemap: false, // 不生成sourceMap（减小体积）
    minify: false, // 代码压缩

    // 资源大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 打包优化配置
    rollupOptions: {
      output: {
        // 分割chunk
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

        // 手动分割chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) {
              return 'vue'
            }
            if (id.includes('axios')) {
              return 'axios'
            }
            return 'vendor' // 其他依赖
          }
        },
      },
    },

    // 代码压缩配置
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true, // 移除debugger
      },
    },
  },

  // 路径别名配置
  resolve: {
    alias: {
      '@': '/src', // 配置@指向src目录
    },
  },
})
