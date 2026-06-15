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
      <button
        onClick={() => setOpen(true)}
        title={t('support.button')}
        aria-label={t('support.button')}
        style={{ position: 'fixed', top: '50%', right: 0, transform: 'translateY(-50%)', zIndex: 40 }}
        className="group flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white py-2.5 pl-3 pr-3 rounded-l-2xl shadow-lg shadow-rose-900/40 transition-colors"
      >
        <span className="text-xl leading-none" style={beat}>❤️</span>
        <span className="hidden sm:inline max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100">
          {t('support.button')}
        </span>
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

            <div className="text-5xl mb-3 inline-block" style={beat}>🎬</div>
            <h2 className="text-lg font-bold text-white mb-2">{t('support.title')}</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">{t('support.text')}</p>

            <a
              href={JAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 shadow-lg shadow-rose-900/40 transition-colors"
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
