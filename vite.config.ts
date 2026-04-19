import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Rutas relativas para compatibilidad total con despliegues en subcarpetas o GitHub Pages
  base: './', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          // CAMBIO CLAVE: Se actualizó de '@google/genai' a '@google/generative-ai'
          'vendor-utils': ['lucide-react', 'date-fns']
        }
      }
    }
  }
});