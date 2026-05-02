import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import fs from 'node:fs'

const pkg = JSON.parse(
  fs.readFileSync(resolve(__dirname, 'package.json'), 'utf8'),
) as { dependencies?: Record<string, string> }

const srcRoot = resolve(__dirname, 'src')
const dependencies = Object.keys(pkg.dependencies ?? {})

export default defineConfig({
  resolve: {
    alias: {
      '@': srcRoot,
    },
  },
  build: {
    /** 与 tsc 类似：不压缩、不混淆；保留模块结构由 Rollup `preserveModules` 负责 */
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/cli/index.ts'),
    },
    rollupOptions: {
      /** 不打包进 bundle 的依赖与 Node 内置模块 */
      external: [/^node:/, ...dependencies],
      output: [
        {
          format: 'es',
          dir: resolve(__dirname, 'dist/es'),
          preserveModules: true,
          preserveModulesRoot: srcRoot,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
        },
        {
          format: 'cjs',
          dir: resolve(__dirname, 'dist/cjs'),
          preserveModules: true,
          preserveModulesRoot: srcRoot,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
        },
      ],
    },
  },
})
