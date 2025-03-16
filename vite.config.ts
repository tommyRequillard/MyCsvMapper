import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Regrouper les dépendances volumineuses dans un chunk séparé
          vendor: ['react', 'react-dom', 'papaparse', 'xlsx'],
        },
      },
    },
  },
  base: `/MyCsvMapper`,
})
