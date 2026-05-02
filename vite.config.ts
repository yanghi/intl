import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cli/index.ts'),
      name: 'intl',
      formats: ['es', 'cjs'],
      fileName: (format) => `intl.${format}.js`,
    },
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:process'],
    },
  },
})
