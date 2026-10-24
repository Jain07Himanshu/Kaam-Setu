import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hyperlocal/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@hyperlocal/design-tokens': path.resolve(__dirname, '../../packages/design-tokens/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
