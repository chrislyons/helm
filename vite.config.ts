import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          'react-vendor': ['react', 'react-dom'],
          'reactflow': ['reactflow', 'dagre'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
