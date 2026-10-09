import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Common env: load variables from the repo-root .env (single source of
  // truth for frontend + backend). Only VITE_ vars are exposed to the browser.
  envDir: '../',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
