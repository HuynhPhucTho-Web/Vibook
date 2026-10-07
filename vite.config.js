import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_REACT_APP_', 'VITE_'], // Cho phép cả tiền tố VITE_ và VITE_REACT_APP_
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          // Tách riêng dữ liệu ngân hàng đề & tài liệu học tập theo từng môn học
          if (normalizedId.includes('src/pages/source/data/')) {
            const match = normalizedId.match(/src\/pages\/source\/data\/([a-zA-Z0-9_-]+)/);
            if (match) {
              return `source-${match[1]}`;
            }
            return 'source-data';
          }
          if (normalizedId.includes('src/pages/source/sourceData')) {
            return 'source-data';
          }

          if (normalizedId.includes('node_modules')) {
            if (normalizedId.includes('firebase')) {
              return 'firebase';
            }
            if (normalizedId.includes('quill') || normalizedId.includes('react-quill')) {
              return 'quill';
            }
            if (normalizedId.includes('emoji-picker-react')) {
              return 'emoji-picker';
            }
            if (normalizedId.includes('lucide-react') || normalizedId.includes('react-icons')) {
              return 'icons';
            }
            if (normalizedId.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (
              normalizedId.includes('react') ||
              normalizedId.includes('react-dom') ||
              normalizedId.includes('react-router')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // tùy chọn: tăng ngưỡng cảnh báo
  },
});