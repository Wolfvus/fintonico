/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loaded on every page
          vendor: ['react', 'react-dom'],
          // Spreadsheet handling - only needed for imports
          xlsx: ['xlsx'],
          // Authentication - needed after initial load
          supabase: ['@supabase/supabase-js'],
          // Form validation - needed for forms
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // State management
          zustand: ['zustand'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts', 'server/__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
