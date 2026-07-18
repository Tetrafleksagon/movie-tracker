import { useState, useEffect, lazy, Suspense, type ReactNode, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Auth } from './components/Auth'
import { Search } from './components/Search'
import { Library } from './components/Library'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ScrollToTop } from './components/ScrollToTop'
import { SupportButton } from './components/SupportButton'
import { FeedbackModal } from './components/FeedbackModal'
import { Avatar } from './components/Avatar'
import { supabase } from './lib/supabase'
import { useMyProfile, displayNameOf } from './lib/profile'
import { useSubscription } from './lib/subscription'
import { APP_VERSION } from './lib/version'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'

// A new deploy renames every hashed chunk, so a tab opened before the deploy
// points at files that no longer exist — importing one throws. Recover by
// reloading once (fresh index.html → new chunk names); a sessionStorage flag
// stops an infinite reload loop if the failure is something else.
function lazyWithReload<T extends { default: ComponentType<any> }>(
  factory: () => Promise<T>
) {
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem('chunk-reload')
      return mod
    } catch (err) {
      if (!sessionStorage.getItem('chunk-reload')) {
        sessionStorage.setItem('chunk-reload', '1')
        window.location.reload()
        return new Promise<T>(() => {}) // never resolves — the reload takes over
      }
      throw err
    }
  })
}

// Secondary routes are code-split: they load on demand instead of inflating
// the initial bundle (Search/Library/Auth stay eager as the primary paths).
const Stats = lazyWithReload(() => import('./components/Stats').then(m => ({ default: m.Stats })))
const Calendar = lazyWithReload(() => import('./components/Calendar').then(m => ({ default: m.Calendar })))
const Lists = lazyWithReload(() => import('./components/Lists').then(m => ({ default: m.Lists })))
const Profile = lazyWithReload(() => import('./components/Profile').then(m => ({ default: m.Profile })))
const About = lazyWithReload(() => import('./components/About').then(m => ({ default: m.About })))
const Privacy = lazyWithReload(() => import('./components/Privacy').then(m => ({ default: m.Privacy })))
const SharedLibrary = lazyWithReload(() => import('./components/SharedLibrary').then(m => ({ default: m.SharedLibrary })))

const RouteFallback = () => <p className="text-center text-gray-400 py-16 animate-pulse">...</p>

function Navigation({ user, authLoading }: { user: any; authLoading: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { profile } = useMyProfile()
  const { isPremium } = useSubscription()
  const isActive = (path: string) => location.pathname === path
  const shownName = displayNameOf(profile, user?.email)

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
            to="/calendar"
            title={t('header.calendar')}
            className={`text-sm font-medium transition ${
              isActive('/calendar') ? 'text-blue-400' : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="sm:hidden">📅</span>
            <span className="hidden sm:inline">{t('header.calendar')}</span>
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
              <>
                <Link
                  to="/profile"
                  title={shownName}
                  className={`flex items-center gap-2 transition ${isActive('/profile') ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                >
                  <Avatar name={shownName} size={28} premium={isPremium} url={profile?.avatar_url} />
                  <span className="hidden sm:inline text-sm font-medium text-gray-300 max-w-[120px] truncate">{shownName}</span>
                </Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm text-gray-300 hover:text-white transition"
                >
                  {t('header.logout')}
                </button>
              </>
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

// Guards the authenticated routes: a pulse while auth resolves, then the page
// for signed-in users or the sign-in screen otherwise.
function AuthRoute({ element, user, authLoading }: { element: ReactNode; user: any; authLoading: boolean }) {
  if (authLoading) return <p className="text-center text-gray-400 py-16 animate-pulse">...</p>
  return user ? <>{element}</> : <Auth />
}

function AppContent({ user, authLoading }: { user: any; authLoading: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  // Reset scroll on route change — otherwise clicking a footer link (About,
  // Privacy) leaves the new page scrolled to the bottom.
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation user={user} authLoading={authLoading} />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/library" element={<AuthRoute user={user} authLoading={authLoading} element={<Library />} />} />
          <Route path="/calendar" element={<AuthRoute user={user} authLoading={authLoading} element={<Calendar />} />} />
          <Route path="/stats" element={<AuthRoute user={user} authLoading={authLoading} element={<Stats />} />} />
          <Route path="/lists" element={<AuthRoute user={user} authLoading={authLoading} element={<Lists />} />} />
          <Route path="/profile" element={<AuthRoute user={user} authLoading={authLoading} element={<Profile />} />} />
        </Routes>
      </Suspense>
      <footer className="text-center text-xs text-gray-600 py-6">
        <Link to="/about" className="text-gray-400 hover:text-white transition">{t('about.nav')}</Link>
        <span className="mx-2 text-gray-600">·</span>
        <Link to="/privacy" className="text-gray-400 hover:text-white transition">{t('privacy.nav')}</Link>
        <span className="mx-2 text-gray-600">·</span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('support:open'))}
          className="text-gray-400 hover:text-white transition bg-transparent border-none p-0 cursor-pointer text-xs"
        >
          ❤️ {t('support.button')}
        </button>
        <span className="mx-2 text-gray-600">·</span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('feedback:open'))}
          className="text-gray-400 hover:text-white transition bg-transparent border-none p-0 cursor-pointer text-xs"
        >
          💬 {t('feedback.footer_link')}
        </button>
        <span className="block mt-1">{t('footer.copyright')} {new Date().getFullYear()}</span>
        <span className="block mt-0.5 text-[10px] text-gray-500 select-all">v{APP_VERSION}</span>
      </footer>
      <ScrollToTop />
      <SupportButton />
      <FeedbackModal />
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
          queryClient.removeQueries({ queryKey: ['calendar-sources'] })
          queryClient.removeQueries({ queryKey: ['episodes'] })
          queryClient.removeQueries({ queryKey: ['subscription'] })
          queryClient.removeQueries({ queryKey: ['profile'] })
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
        <Route
          path="/share/:userId"
          element={<Suspense fallback={<RouteFallback />}><SharedLibrary /></Suspense>}
        />
        <Route path="*" element={<AppContent user={user} authLoading={authLoading} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
