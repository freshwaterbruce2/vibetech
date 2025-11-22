import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

/**
 * Optimized Vite Configuration - 2025 Best Practices
 * 
 * Features:
 * - Smart code splitting
 * - Vendor chunk optimization
 * - Manual chunks for better caching
 * - Bundle analysis
 * - Compression (gzip/brotli)
 * - Tree shaking
 * - Dynamic imports optimization
 */

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster builds
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    
    // Split vendor chunks
    splitVendorChunkPlugin(),
    
    // Compression
    viteCompression({
      algorithm: 'gzip',
      threshold: 10240 // 10KB
    }),
    
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 10240,
      ext: '.br'
    }),
    
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  define: {
    global: 'globalThis',
  },
  
  optimizeDeps: {
    // Pre-bundle heavy deps
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'styled-components',
      'zustand',
      'framer-motion'
    ],
    
    // Exclude deps that should be lazy loaded
    exclude: [
      'monaco-editor',
      '@monaco-editor/react'
    ]
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      
      output: {
        // Asset naming patterns
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        
        // Manual chunks for optimal caching
        manualChunks: {
          // React ecosystem
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-error-boundary'
          ],
          
          // UI libraries
          'ui-vendor': [
            'styled-components',
            'framer-motion',
            'lucide-react'
          ],
          
          // State management
          'state': [
            'zustand',
            'immer'
          ],
          
          // Monaco editor (lazy loaded)
          'monaco': [
            'monaco-editor'
          ],
          
          // AI/API related
          'ai-utils': [
            'eventsource-parser',
            'isomorphic-dompurify'
          ]
        }
      },
      
      // Tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4KB
    
    // Target modern browsers
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    // Report compressed size
    reportCompressedSize: true
  },
  
  server: {
    port: 3001,
    strictPort: true,
    
    // Enable CORS for development
    cors: true,
    
    // Optimize deps on server start
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/components/Editor.tsx',
        './src/stores/useEditorStore.ts'
      ]
    }
  },
  
  // Performance optimizations
  esbuild: {
    // Remove unused code
    treeShaking: true,
    
    // Target modern syntax
    target: 'es2020',
    
    // Keep names for better debugging
    keepNames: process.env.NODE_ENV === 'development',
    
    // Legal comments
    legalComments: 'none'
  },
  
  // Preview server
  preview: {
    port: 3002,
    strictPort: true
  }
})

// Helper to analyze bundle
// Run: ANALYZE=true npm run build