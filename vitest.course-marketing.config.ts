import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Marketing delivery tests exercise server code without browser globals.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/lib/course-marketing/**/*.test.ts',
      'src/test/course-marketing*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(
        __dirname,
        'node_modules/next/dist/compiled/server-only/empty.js',
      ),
    },
  },
})
