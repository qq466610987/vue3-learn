import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        reactive: resolve(__dirname, 'reactive/index.html'),
        render: resolve(__dirname, 'render/index.html'),
        components: resolve(__dirname, 'components/index.html')
      }
    },
    lib: {
      entry: './lib/main.ts',
      name: 'Counter',
      fileName: 'counter'
    },
    test: {
      environment: 'jsdom'
    }
  }
})
