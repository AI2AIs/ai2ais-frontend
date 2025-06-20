import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  // Path resolution (no src/)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/services': path.resolve(__dirname, './services'),
      '@/stores': path.resolve(__dirname, './stores'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/types': path.resolve(__dirname, './types')
    }
  },

  // Three.js optimization
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls',
      'three/examples/jsm/loaders/GLTFLoader',
      'three/examples/jsm/objects/Water',
      'three/examples/jsm/objects/Sky',
      'three/examples/jsm/libs/stats.module',
      'three/examples/jsm/libs/lil-gui.module.min'
    ]
  },

  // Asset handling
  assetsInclude: [
    '**/*.glb',
    '**/*.gltf', 
    '**/*.ktx2',
    '**/*.wav',
    '**/*.mp3'
  ],

  // Server config
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/audio': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/models': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },

  // Build optimization
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'three-addons': [
            'three/examples/jsm/controls/OrbitControls',
            'three/examples/jsm/loaders/GLTFLoader'
          ]
        }
      }
    }
  }
})