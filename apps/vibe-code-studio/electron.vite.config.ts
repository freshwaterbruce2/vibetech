import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { builtinModules } from 'module'
import { resolve } from 'path'

export default defineConfig({
  /**
   * Main Process Configuration
   * Builds electron/main.cjs (Electron main process)
   */
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['better-sqlite3'] })],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main.ts')
        },
        external: ['better-sqlite3']
      }
    }
  },

  /**
   * Preload Process Configuration
   * Builds electron/preload.ts (Electron preload script)
   * Force CommonJS format for better compatibility with electron-builder
   */
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload.ts')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs'
        }
      }
    }
  },

  /**
   * Renderer Process Configuration
   * Builds src/ (React app with Monaco Editor)
   * Uses existing vite.config.ts settings
   */
  renderer: {
    root: '.',
    base: './',

    plugins: [react()],

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      // Force single React instance (fixes "Cannot read properties of null" error)
      dedupe: ['react', 'react-dom'],
    },

    define: {
      'process.env': '{}',
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'styled-components',
        'zustand',
        'framer-motion',
        // Ensure deps required by workspace libs are pre-bundled for the renderer
        'zod',
        'uuid',
      ],
      exclude: [
        'monaco-editor',
        '@monaco-editor/react',
        'sql.js',
        'better-sqlite3',
        'chromium-bidi',
        'pac-proxy-agent',
        'get-uri',
        'puppeteer',
        'puppeteer-core',
        '@puppeteer/browsers',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ],
    },

    worker: {
      format: 'es',
      plugins: () => [react()],
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
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
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },

      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },

        external: [
          'electron',
          'sql.js',
          'better-sqlite3',
          ...builtinModules,
          ...builtinModules.map(m => `node:${m}`)
        ],

        output: {
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? []
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]'
            } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },

          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',

          manualChunks: {
            'react-vendor': [
              'react',
              'react-dom',
              'react-router-dom',
              'react-error-boundary',
            ],
            'ui-vendor': [
              'styled-components',
              'framer-motion',
              'lucide-react',
            ],
            'state': ['zustand', 'immer'],
            'monaco': ['monaco-editor'],
            'ai-utils': ['eventsource-parser', 'isomorphic-dompurify'],
          },
        },

        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },

      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      target: ['es2022', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      reportCompressedSize: true,
    },

    server: {
      // Allow overriding the dev server port via environment variable.
      // If the chosen port is taken, automatically choose the next available one.
      port: Number(process.env.VITE_PORT || 5174),
      strictPort: false,
      cors: true,
      fs: {
        // Allow serving files from node_modules (required for Monaco Editor CSS)
        allow: [
          '.',
          '../../../../node_modules',
          '../../../../node_modules/.pnpm'
        ]
      },
      warmup: {
        clientFiles: [
          './src/App.tsx',
          './src/components/Editor.tsx',
          './src/stores/useEditorStore.ts',
        ],
      },
    },

    esbuild: {
      treeShaking: true,
      target: 'es2022',
      keepNames: process.env.NODE_ENV === 'development',
      legalComments: 'none',
    },

    preview: {
      port: 3002,
      strictPort: true,
    },
  },
})
