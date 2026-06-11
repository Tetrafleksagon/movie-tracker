import './i18n/config'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)