import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { APP_VERSION } from '../lib/version'

type SendState = 'idle' | 'sending' | 'sent' | 'error'

// Feedback form: modal with a textarea, optional email for replies and a
// hidden honeypot. Opens via the `feedback:open` window event so the footer
// (or any other place) can trigger it without prop drilling.
export function FeedbackModal() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SendState>('idle')
  const [errorDetail, setErrorDetail] = useState('')
  const honeypotRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('feedback:open', onOpen)
    return () => window.removeEventListener('feedback:open', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    setTimeout(() => textareaRef.current?.focus(), 50)
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => {
    setOpen(false)
    // Reset shortly after the close animation so the user doesn't see the form
    // clear before it disappears; also lets them re-open after a successful send.
    setTimeout(() => {
      setMessage('')
      setEmail('')
      setState('idle')
      setErrorDetail('')
    }, 200)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return
    const trimmed = message.trim()
    if (trimmed.length < 10) return

    setState('sending')
    setErrorDetail('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          email: email.trim() || undefined,
          website: honeypotRef.current?.value || '',
          context: {
            userId: user?.id || '',
            lang: i18n.language,
            version: APP_VERSION,
            path: window.location.pathname,
          },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorDetail(String(body?.error || res.status))
        setState('error')
        return
      }
      setState('sent')
    } catch (err: any) {
      setErrorDetail(err?.message || 'network')
      setState('error')
    }
  }

  if (!open) return null

  const canSubmit = message.trim().length >= 10 && state !== 'sending'
  const charCount = message.length

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-700/90 hover:bg-gray-600 border border-gray-400/70 text-white text-lg leading-none flex items-center justify-center transition"
        >
          ×
        </button>

        <h2 className="text-lg font-bold text-white mb-1">💬 {t('feedback.title')}</h2>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{t('feedback.subtitle')}</p>

        {state === 'sent' ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-gray-200 font-medium mb-1">{t('feedback.sent_title')}</p>
            <p className="text-sm text-gray-400 mb-5">{t('feedback.sent_text')}</p>
            <button
              onClick={close}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('feedback.message_placeholder')}
                rows={5}
                maxLength={5000}
                required
                className="w-full py-2 px-3 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-[11px] text-gray-500 mt-1 text-right tabular-nums">{charCount}/5000</p>
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('feedback.email_placeholder')}
                maxLength={320}
                className="w-full py-2 px-3 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">{t('feedback.email_hint')}</p>
            </div>

            {/* Honeypot: real users won't see or fill this; bots fill everything. */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0 }}
            />

            {state === 'error' && (
              <p className="text-xs text-red-400">
                {t('feedback.error')}{errorDetail ? ` (${errorDetail})` : ''}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white transition"
            >
              {state === 'sending' ? t('feedback.sending') : t('feedback.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
