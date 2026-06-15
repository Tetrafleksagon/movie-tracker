# 🎬 Movie Tracker

Track movies and TV shows: search, a personal library with statuses, ratings, episode progress, curated rows, and stats. Web app + installable PWA, in **English / Русский / Українська**.

**▶️ Live: [filmtrack.pp.ua](https://filmtrack.pp.ua)**

## Stack

React · TypeScript · Vite · Tailwind · React Query · i18next · Supabase (auth + data) · TMDB (via a Cloudflare Pages Function proxy) · Sentry. Deployed on Cloudflare Pages from `main`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
npm test         # vitest
```

Create `.env.local`:

```
TMDB_API_KEY=...            # server-side only (Vite dev proxy + CF Function)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Notes

- `/api/tmdb/*` is proxied to TMDB with the key injected server-side, so it never reaches the client.
- Supabase SQL (tables, RLS, premium gates) lives in [`supabase/`](supabase/); email templates in [`supabase/email-templates/`](supabase/email-templates/) — both applied manually in the Supabase dashboard.
