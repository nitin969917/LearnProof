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
    // Increase the chunk size warning limit (we're intentionally splitting)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting — browser loads only what each page needs.
        // Without this, everything ships in one 4-6 MB JS file.
        manualChunks: (id) => {
          // LiveKit — only used in video/audio rooms
          if (id.includes('livekit-client') || id.includes('@livekit/')) {
            return 'livekit';
          }
          // Firebase — only used for push notifications / auth
          if (id.includes('node_modules/firebase/') ||
              id.includes('node_modules/@firebase/')) {
            return 'firebase';
          }
          // Jitsi — only used in a specific room type
          if (id.includes('@jitsi/')) {
            return 'jitsi';
          }
          // Charts — only used on analytics pages
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          // Rich text editor — only used in post creation
          if (id.includes('react-quill') || id.includes('quill')) {
            return 'editor';
          }
          // Markdown renderer + math
          if (id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('rehype-') ||
              id.includes('katex') ||
              id.includes('hast') ||
              id.includes('mdast') ||
              id.includes('micromark') ||
              id.includes('unified')) {
            return 'markdown';
          }
          // Framer Motion — animations
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          // Socket.io client
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
            return 'socket';
          }
          // Zustand state management
          if (id.includes('zustand')) {
            return 'state';
          }
          // All other node_modules go in vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
