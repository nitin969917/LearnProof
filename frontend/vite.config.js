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
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mermaid')) {
            return 'mermaid';
          }
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          if (id.includes('node_modules/livekit') || id.includes('node_modules/@livekit')) {
            return 'livekit';
          }
          if (id.includes('node_modules/katex') || id.includes('node_modules/rehype-katex')) {
            return 'katex';
          }
          if (id.includes('node_modules/react-quill-new')) {
            return 'quill';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
        }
      }
    }
  }
})
