import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_REACT_APP_', // Explicitly set the prefix for environment variables
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('quill') || id.includes('react-quill')) {
              return 'quill';
            }
            if (id.includes('emoji-picker-react')) {
              return 'emoji-picker';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // tùy chọn: tăng ngưỡng cảnh báo
  },
});