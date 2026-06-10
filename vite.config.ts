import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read TMDB_API_KEY (non-VITE_, so it is NOT bundled into the client).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // Mirror the Cloudflare Pages Function locally so `npm run dev` works:
      // /api/tmdb/* is forwarded to TMDB with the key injected server-side.
      proxy: {
        '/api/tmdb': {
          target: 'https://api.themoviedb.org',
          changeOrigin: true,
          rewrite: (p: string) => {
            const u = new URL(p, 'http://local')
            u.pathname = u.pathname.replace(/^\/api\/tmdb\//, '/3/')
            u.searchParams.set('api_key', env.TMDB_API_KEY)
            return u.pathname + u.search
          },
        },
      },
    },
  }
})
