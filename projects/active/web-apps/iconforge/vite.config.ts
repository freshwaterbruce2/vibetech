import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'fabric': ['fabric'],
          'ui-primitives': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'state': ['zustand', '@tanstack/react-query'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
