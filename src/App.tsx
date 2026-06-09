import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Auth } from './components/Auth'
import { Search } from './components/Search'
import { Library } from './components/Library'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ScrollToTop } from './components/ScrollToTop'
import { supabase } from './lib/supabase'
import { useTranslation } from 'react-i18next'

function Navigation() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-3 sm:p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:justify-between items-center gap-2">
        <h1
          className="text-2xl sm:text-4xl font-bold whitespace-nowrap"
          style={{
            letterSpacing: '-0.5px',
            background: 'linear-gradient(90deg, #3b82f6, #1e3a8a, #1e1b4b, #3b82f6)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 2s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
          }}
        >
          🎬 Movie Tracker
        </h1>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
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
          <LanguageSwitcher />
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-300 hover:text-white transition"
          >
            {t('header.logout')}
          </button>
        </nav>
      </div>
    </header>
  )
}

function AppContent() {
  const { t } = useTranslation()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/library" element={<Library />} />
      </Routes>
      <ScrollToTop />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App