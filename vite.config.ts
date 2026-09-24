import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      // demo / dev-only files must not leak into the published type declarations
      exclude: ['src/App.vue', 'src/main.ts'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        BackendConfig: fileURLToPath(new URL('./src/BackendConfig.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        assetFileNames: (assetInfo) =>
          assetInfo.name === 'style.css' ? 'style.css' : (assetInfo.name as string) ?? 'asset',
      },
    },
  },
})
