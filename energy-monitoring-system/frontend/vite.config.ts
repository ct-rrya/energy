import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React dependencies
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          
          // Large icon library
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }
          
          // Chart libraries (used in Analytics, Reports, Diagnostics, Energy pages)
          if (id.includes('node_modules/recharts') || 
              id.includes('node_modules/d3-')) {
            return 'charts';
          }
          
          // Form and validation libraries
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform') || 
              id.includes('node_modules/zod')) {
            return 'forms';
          }
          
          // Data fetching and state management
          if (id.includes('node_modules/@tanstack/react-query') || 
              id.includes('node_modules/axios')) {
            return 'data-fetching';
          }
          
          // Real-time communication
          if (id.includes('node_modules/socket.io-client') ||
              id.includes('node_modules/engine.io-client')) {
            return 'socket';
          }
          
          // Utility libraries
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/lodash-es')) {
            return 'utils';
          }
          
          // Split node_modules vendor code into smaller chunks
          if (id.includes('node_modules/')) {
            return 'vendor-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Keep the warning threshold at 500KB
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})