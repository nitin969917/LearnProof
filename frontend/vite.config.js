import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['localhost', 'linux-101'],
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'recharts/es6': 'recharts/es6/index.js',
      'recharts': 'recharts/es6/index.js'
    }
  }
})
