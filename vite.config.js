import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting: separa vendors pesados en chunks independientes
    // El navegador solo descarga lo que necesita y cachea cada chunk por separado
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom'],
          'supabase':        ['@supabase/supabase-js'],
          'pdf-libs':        ['jspdf', 'html2canvas'],
          'icons':           ['lucide-react'],
        },
      },
    },
    // Comprimir assets — reduce tamaño de descarga inicial
    chunkSizeWarningLimit: 600,
  },
})
