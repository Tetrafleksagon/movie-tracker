import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ✅ УБЕРИТЕ или закомментируйте строку base:
  // base: '/movie-tracker/',  ← ЭТО ЛОМАЕТ CLOUDFLARE!
  base: '/',  // ← Или просто оставьте '/'
})