import { Component, type ReactNode } from 'react'
import i18n from '../i18n/config'
import { captureError } from '../lib/sentry'
import { APP_VERSION } from '../lib/version'

type Props = { children: ReactNode }
type State = { hasError: boolean }

// Catches render-time crashes anywhere below it and shows a recoverable screen
// instead of a blank page. Class component because only class lifecycles
// (getDerivedStateFromError / componentDidCatch) can catch render errors.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    captureError(error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    // i18n instance (not the hook — unavailable in a class).
    const t = i18n.t.bind(i18n)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">🎬 Movie Tracker</h1>
          <p className="text-gray-300 mb-1">{t('errors.title')}</p>
          <p className="text-sm text-gray-500 mb-5">{t('errors.message')}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition"
          >
            {t('errors.reload')}
          </button>
          <p className="mt-4 text-[10px] text-gray-600 select-all">v{APP_VERSION}</p>
        </div>
      </div>
    )
  }
}
