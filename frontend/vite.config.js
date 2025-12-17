// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                 // 0.0.0.0 바인딩 (외부 접속 허용)
    port: 5173,
    allowedHosts: ['guidie.duckdns.org'],
  },
})
