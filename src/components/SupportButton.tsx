import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Monobank jar — the project's donation link.
const JAR_URL = 'https://send.monobank.ua/jar/72UmV4dP8n'
const beat = { animation: 'heartbeat 1.3s ease-in-out infinite' }

// Floating "support the project" heart pinned to the right edge (like a
// buy-me-a-coffee widget). Click opens a small modal with a short ask, an
// animated logo and a link to the Monobank jar.
export function SupportButton() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  // Close on Escape + lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Round FAB stacked just above the scroll-to-top arrow (bottom-right),
          so it never covers content/controls on small screens. */}
      <button
        onClick={() => setOpen(true)}
        title={t('support.button')}
        aria-label={t('support.button')}
        style={{ position: 'fixed', right: '24px', bottom: '88px', zIndex: 9998 }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white bg-gradient-to-br from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 shadow-lg shadow-rose-900/40 transition-colors"
      >
        <span className="leading-none" style={beat}>❤️</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label={t('support.close')}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white text-xl leading-none flex items-center justify-center transition"
            >
              ×
            </button>

            {/* Site logo, same shimmer treatment as the header. */}
            <div className="mb-3 flex items-center justify-center gap-1.5">
              <span className="text-3xl leading-none" style={beat}>🎬</span>
              <span
                className="text-2xl font-bold"
                style={{
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(90deg, #3b82f6, #1e3a8a, #1e1b4b, #3b82f6)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 4s linear infinite',
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
                }}
              >
                Movie Tracker
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{t('support.title')}</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">{t('support.text')}</p>

            <a
              href={JAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <span style={beat}>❤️</span> {t('support.cta')}
            </a>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
            >
              {t('support.close')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
