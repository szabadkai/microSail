import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/microSail/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
