import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.d.ts', 'src/main.ts', 'quasar.config.ts']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Stub quasar for unit tests
      quasar: resolve(__dirname, './test/__mocks__/quasar.ts')
    }
  }
})
