import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const repoName = 'project-pizza'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  base: `/${repoName}/`,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
