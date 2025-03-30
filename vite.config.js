import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Output folder
    emptyOutDir: true, // Clean previous build
    chunkSizeWarningLimit: 2000, // ✅ Increase chunk size limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // ✅ Separate vendor files (third-party libraries)
          }
        },
      },
    },
  },
});
