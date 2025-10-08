import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    
    
    viteCompression({
      algorithm: 'gzip',
      threshold: 10240
    }),
    
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 10240,
      ext: '.br'
    }),
    
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
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'styled-components',
      'zustand',
      'framer-motion'
    ],
    
    exclude: [
      'monaco-editor',
      '@monaco-editor/react'
    ]
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    
    chunkSizeWarningLimit: 1000,
    
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
        
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-error-boundary'
          ],
          
          'ui-vendor': [
            'styled-components',
            'framer-motion',
            'lucide-react'
          ],
          
          'state': [
            'zustand',
            'immer'
          ],
          
          'monaco': [
            'monaco-editor'
          ],
          
          'ai-utils': [
            'eventsource-parser',
            'isomorphic-dompurify'
          ]
        }
      },
      
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    cssCodeSplit: true,
    
    assetsInlineLimit: 4096,
    
    target: ['es2022', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    reportCompressedSize: true
  },
  
  server: {
    port: 3001,
    strictPort: true,
    
    cors: true,
    
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/components/Editor.tsx',
        './src/stores/useEditorStore.ts'
      ]
    }
  },
  
  esbuild: {
    treeShaking: true,
    
    target: 'es2022',
    
    keepNames: process.env.NODE_ENV === 'development',
    
    legalComments: 'none'
  },
  
  preview: {
    port: 3002,
    strictPort: true
  }
});