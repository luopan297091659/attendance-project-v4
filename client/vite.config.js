import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  server: {
    host: process.env.VITE_DEV_HOST || '0.0.0.0', // 允许外部访问
    port: parseInt(process.env.VITE_DEV_PORT) || 5173, // 开发服务器端口
    strictPort: false, // 端口被占用时自动尝试下一个可用端口
    open: false,      // 启动时不自动打开浏览器
    cors: true,       // 允许跨域
    
    // 代理配置（开发环境下可选，用于避免CORS问题）
    // 注意：只在开发时使用，生产环境直接调用API
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // 保持路径不变
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 消除打包大小超过500kb警告
    chunkSizeWarningLimit: 2000,
  },
  
  // 预览服务器配置（用于预览生产构建）
  preview: {
    host: process.env.VITE_PREVIEW_HOST || '0.0.0.0',
    port: parseInt(process.env.VITE_PREVIEW_PORT) || 4173,
    strictPort: false,
    open: false,
  }
})
