import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.spec.ts', 'tests/**/*.spec.ts'],
    pool: 'forks',
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api/v1',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
});
