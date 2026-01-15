import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 关键配置：允许前端请求后端接口（解决跨域和路径问题）
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
