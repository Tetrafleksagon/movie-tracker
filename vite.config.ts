import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// App version: major comes from package.json (bumped by hand for big features),
// minor is the deployed commit's short hash (Cloudflare Pages exposes it as
// CF_PAGES_COMMIT_SHA; local builds fall back to git).
function buildVersion(): string {
  const [major, minor] = JSON.parse(readFileSync('package.json', 'utf-8')).version.split('.')
  let sha = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7)
  if (!sha) {
    try { sha = execSync('git rev-parse --short HEAD').toString().trim() } catch { sha = 'dev' }
  }
  return `${major}.${minor}.${sha}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read TMDB_API_KEY (non-VITE_, so it is NOT bundled into the client).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      __APP_VERSION__: JSON.stringify(buildVersion()),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Movie Tracker',
          short_name: 'Movie Tracker',
          description: 'Track movies and TV shows: search, mark what you watched, share your library',
          lang: 'en',
          start_url: '/',
          display: 'standalone',
          theme_color: '#1f2937',
          background_color: '#111827',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png}'],
          // SPA fallback must not swallow API calls or the password-reset page.
          navigateFallbackDenylist: [/^\/api\//],
          // No runtimeCaching: /api/tmdb and Supabase must always hit the network
          // (the edge proxy and React Query already handle caching).
        },
      }),
    ],
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
