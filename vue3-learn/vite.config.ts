import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions:{
      input:{
        main: resolve(__dirname, 'index.html'),
        reactive: resolve(__dirname, 'reactive/index.html')
      }
    },
    lib: {
      entry: './lib/main.ts',
      name: 'Counter',
      fileName: 'counter'
    }
  }
})
