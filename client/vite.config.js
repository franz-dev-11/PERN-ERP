import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    // This tells Vite to forward any path starting with /api to the backend URL
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // <--- MUST MATCH YOUR SERVER PORT
        changeOrigin: true, // Needed for virtual hosting
        secure: false, 
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Optional, but ensures the /api prefix remains
      },
    },
    // CRITICAL: Ensure the client is running on the port your backend expects (5173)
    port: 5173, 
  },
})
