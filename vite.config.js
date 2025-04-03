import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3002,  // Changed to port 3002 since 3000 and 3001 are in use
    open: true,  // Automatically open browser when starting
    strictPort: false // Allow Vite to find another port if 3002 is in use
  }
})