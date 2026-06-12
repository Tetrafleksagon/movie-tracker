import './i18n/config'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { APP_VERSION } from './lib/version'
import { initSentry } from './lib/sentry'
import { ErrorBoundary } from './components/ErrorBoundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

console.info(`Movie Tracker v${APP_VERSION}`)
initSentry()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // data is "fresh" for 5 min — no refetch on remount
      gcTime: 30 * 60 * 1000,        // keep unused cache for 30 min
      retry: 2,                      // auto-retry failed requests twice
      refetchOnWindowFocus: false,   // don't refetch just because the tab regained focus
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)