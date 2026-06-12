import * as Sentry from '@sentry/react'
import { APP_VERSION } from './version'

// Error monitoring. Active only in a production build AND only when a DSN is
// configured (VITE_SENTRY_DSN in Cloudflare Pages env vars). The DSN is a
// public client value by design, so the VITE_ prefix is fine here.
// In dev it stays off so the console isn't polluted with our own test errors.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || !import.meta.env.PROD) return

  Sentry.init({
    dsn,
    release: APP_VERSION,
    environment: 'production',
    // Light sampling — enough to spot trends without heavy traffic/cost.
    tracesSampleRate: 0.1,
    // Don't capture noise we can't act on.
    ignoreErrors: ['ResizeObserver loop limit exceeded'],
  })
}

// Re-exported so other modules report without importing the SDK directly.
export const captureError = (error: unknown) => Sentry.captureException(error)
