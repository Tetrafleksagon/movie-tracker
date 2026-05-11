import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react() // ✅ Без опции jsx — она берётся из tsconfig.json
  ],
  // Если используете Cloudflare/Workers, могут понадобиться дополнительные настройки:
  // resolve: {
  //   conditions: ['worker', 'browser'],
  // },
})