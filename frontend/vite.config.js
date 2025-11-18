// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true  // 브라우저 자동 실행
    //  proxy: { ... } 설정 전체 삭제
  }
})