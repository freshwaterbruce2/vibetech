/**
 * Vite Production Optimization Config
 * Reduces bundle size and improves performance
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Generate bundle analysis
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Compress assets with gzip and brotli
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],

  build: {
    // Target modern browsers for smaller output
    target: 'es2020',

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Work around Safari 10 bugs
      },
      format: {
        comments: false, // Remove all comments
      },
    },

    // Optimize rollup output
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': [
            'styled-components',
            'framer-motion',
            'lucide-react',
          ],

          // Monaco editor (largest dependency)
          'monaco': ['monaco-editor', '@monaco-editor/react'],

          // AI services
          'ai-vendor': ['openai', '@anthropic-ai/sdk'],

          // Utilities
          'utils': ['axios', 'immer', 'zustand', 'js-yaml', 'marked'],
        },

        // Optimize chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',

        // Optimize entry file names
        entryFileNames: 'assets/js/[name]-[hash].js',

        // Optimize asset file names
        assetFileNames: 'assets/[name]-[hash][extname]',
      },

      // External dependencies (for Electron, these are provided by Node)
      external: [
        'electron',
        'fs',
        'path',
        'os',
        'crypto',
        'child_process',
        'util',
        'events',
        'stream',
        'buffer',
        'better-sqlite3', // Native module, don't bundle
      ],
    },

    // Enable source maps for debugging (can be disabled for smaller size)
    sourcemap: false,

    // Report compressed size
    reportCompressedSize: true,

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'monaco-editor',
      '@monaco-editor/react',
    ],
    exclude: [
      'electron',
      'better-sqlite3',
    ],
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // Production-specific settings
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});