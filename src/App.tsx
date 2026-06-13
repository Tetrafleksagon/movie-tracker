import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Auth } from './components/Auth'
import { Search } from './components/Search'
import { Library } from './components/Library'
import { Stats } from './components/Stats'
import { Lists } from './components/Lists'
import { SharedLibrary } from './components/SharedLibrary'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ScrollToTop } from './components/ScrollToTop'
import { supabase } from './lib/supabase'
import { APP_VERSION } from './lib/version'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'

function Navigation({ user, authLoading }: { user: any; authLoading: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-3 sm:p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-2">
        <h1 className="text-2xl sm:text-4xl font-bold whitespace-nowrap text-center">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              letterSpacing: '-0.5px',
              background: 'linear-gradient(90deg, #3b82f6, #1e3a8a, #1e1b4b, #3b82f6)',
              backgroundSize: '300% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 4s linear infinite',
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
            }}
          >
            🎬 Movie Tracker
          </Link>
        </h1>
        <nav className="flex items-center justify-center flex-wrap gap-4 sm:gap-6">
          <Link
            to="/"
            onClick={() => {
              // Wait a tick so the route renders first when coming from another page.
              setTimeout(() => {
                const el = document.getElementById('search-input')
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el?.focus({ preventScroll: true })
              }, 50)
            }}
            className={`text-sm font-medium transition ${
              isActive('/') ? 'text-blue-400' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('header.search')}
          </Link>
          <Link
            to="/library"
            className={`text-sm font-medium transition ${
              isActive('/library') ? 'text-blue-400' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('header.library')}
          </Link>
          <Link
            to="/stats"
            title={t('header.stats')}
            className={`text-sm font-medium transition ${
              isActive('/stats') ? 'text-blue-400' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="sm:hidden">📊</span>
            <span className="hidden sm:inline">{t('header.stats')}</span>
          </Link>
          <Link
            to="/lists"
            title={t('header.lists')}
            className={`text-sm font-medium transition ${
              isActive('/lists') ? 'text-blue-400' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="sm:hidden">📑</span>
            <span className="hidden sm:inline">{t('header.lists')}</span>
          </Link>
          <LanguageSwitcher />
          {!authLoading && (
            user ? (
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-gray-300 hover:text-white transition"
              >
                {t('header.logout')}
              </button>
            ) : (
              <Link
                to="/library"
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                {t('header.sign_in')}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  )
}

function AppContent({ user, authLoading }: { user: any; authLoading: boolean }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation user={user} authLoading={authLoading} />
      <Routes>
        <Route path="/" element={<Search />} />
        <Route
          path="/library"
          element={
            authLoading
              ? <p className="text-center text-gray-400 py-16 animate-pulse">...</p>
              : user
                ? <Library />
                : <Auth />
          }
        />
        <Route
          path="/stats"
          element={
            authLoading
              ? <p className="text-center text-gray-400 py-16 animate-pulse">...</p>
              : user
                ? <Stats />
                : <Auth />
          }
        />
        <Route
          path="/lists"
          element={
            authLoading
              ? <p className="text-center text-gray-400 py-16 animate-pulse">...</p>
              : user
                ? <Lists />
                : <Auth />
          }
        />
      </Routes>
      <footer className="text-center text-xs text-gray-600 py-6">
        Copyright Fleksagon {new Date().getFullYear()}
        <span className="block mt-0.5 text-[10px] text-gray-500 select-all">v{APP_VERSION}</span>
      </footer>
      <ScrollToTop />
    </div>
  )
}

function App() {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(prev => {
        const next = session?.user ?? null
        // User changed (login/logout) — drop per-user caches so the next
        // account never sees the previous one's library/stats.
        if (prev?.id !== next?.id) {
          queryClient.removeQueries({ queryKey: ['library'] })
          queryClient.removeQueries({ queryKey: ['library-ids'] })
          queryClient.removeQueries({ queryKey: ['stats'] })
          queryClient.removeQueries({ queryKey: ['episodes'] })
          queryClient.removeQueries({ queryKey: ['subscription'] })
          queryClient.removeQueries({ queryKey: ['lists'] })
          queryClient.removeQueries({ queryKey: ['list-items'] })
          queryClient.removeQueries({ queryKey: ['list-counts'] })
          queryClient.removeQueries({ queryKey: ['item-lists'] })
        }
        return next
      })
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/:userId" element={<SharedLibrary />} />
        <Route path="*" element={<AppContent user={user} authLoading={authLoading} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
