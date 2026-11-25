import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'petra-source-html',
      transformIndexHtml: {
        order: 'pre',
        handler: () => readFileSync(new URL('./vite-entry.html', import.meta.url), 'utf8'),
      },
    },
    react(), tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@workspace/api-client-react': fileURLToPath(new URL('./api-client/index.ts', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: { '/api': 'http://127.0.0.1:5173' },
  },
});
