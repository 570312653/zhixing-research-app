import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const e2eEnabled = command === 'serve' && mode === 'e2e'
  return {
    define: {
      __ZHIXING_E2E__: JSON.stringify(e2eEnabled),
    },
    plugins: [react()],
    resolve: {
      alias: e2eEnabled
        ? [{
            find: './test-fixtures/e2eState',
            replacement: fileURLToPath(new URL('./src/test-fixtures/e2eState.enabled.ts', import.meta.url)),
          }]
        : [],
    },
    test: {
      css: true,
      environment: 'jsdom',
      include: ['./src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
