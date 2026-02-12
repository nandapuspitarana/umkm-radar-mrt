import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8083,
    strictPort: true,
    allowedHosts: true, // Allow all domains
    proxy: {
      '/api': {
        // Use environment variable or fallback to localhost
        // For network access, set VITE_BACKEND_URL=http://192.168.1.x:3000
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
})
