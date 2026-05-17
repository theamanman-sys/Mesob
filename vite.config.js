import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Copy api/ to dist/ so Vercel's Vite preset can see function files in dist/api/
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const dstPath = join(dst, entry)
    if (statSync(srcPath).isDirectory()) copyDir(srcPath, dstPath)
    else copyFileSync(srcPath, dstPath)
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-api-functions',
      closeBundle() {
        const src = resolve('api')
        const dst = resolve('dist', 'api')
        if (statSync(src).isDirectory()) copyDir(src, dst)
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 600,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor'
          if (id.includes('node_modules/@mui/') || id.includes('node_modules/@emotion/')) return 'mui'
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/three/')) return 'animation'
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/swiper')) return 'ui'
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
