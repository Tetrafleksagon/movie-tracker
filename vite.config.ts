import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
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
    test: {
      environment: 'node',
      // Dummy values so the Supabase client (created at import time) doesn't
      // throw during tests, independent of any local .env file.
      env: {
        VITE_SUPABASE_URL: 'http://localhost',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    },
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
          cleanupOutdatedCaches: true,
          // Do NOT let the SW serve navigations from the precached index.html.
          // With skipWaiting+clientsClaim (autoUpdate), a cache-first index would
          // hand an old document referencing deleted hashed bundles after a deploy
          // → white screen. Cloudflare's `_redirects` (/* → /index.html 200) already
          // does the SPA fallback, so navigations should always fetch a fresh index.
          navigateFallback: null,
          runtimeCaching: [
            // TMDB poster/backdrop images are immutable and off-origin — cache them
            // so a hard refresh (Ctrl-F5) doesn't re-download every poster. Does NOT
            // touch /api/tmdb or Supabase (those still always hit the network).
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images',
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
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
