import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': '/src' } },
  server: { port: 5173, watch: { ignored: ['**/three.js-master/**'] }, proxy: { '/api': 'http://localhost:8787' } },
  optimizeDeps: { entries: ['src/main.tsx'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'clerk-vendor': ['@clerk/clerk-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
