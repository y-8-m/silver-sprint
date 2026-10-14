import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  base: '/silver-sprint/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    css: {
      include: [/\.module\.css$/],
    },
  },
});
