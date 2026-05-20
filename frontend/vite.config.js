import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    svgr({ svgrOptions: { icon: true } }),
    // basicSsl hanya untuk development (HTTPS lokal)
    ...(mode === 'development' ? [basicSsl()] : []),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react':    ['react', 'react-dom'],
          'vendor-router':   ['react-router-dom'],
          // Animation
          'vendor-motion':   ['framer-motion'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Tiptap — hanya dimuat di halaman CaseDetail & Admin
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-text-align',
            '@tiptap/extension-image',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-bubble-menu',
          ],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));
