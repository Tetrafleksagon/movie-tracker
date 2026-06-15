import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export function Auth() {
  const { t } = useTranslation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [showEarly, setShowEarly] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage(t('auth.check_email'))
        setShowEarly(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      setMessage('❌ ' + (err.message || t('auth.error')))
    } finally { 
      setLoading(false) 
    }
  }

  const handleForgotPassword = async () => {
    const emailInput = prompt(t('auth.enter_email_reset') || 'Enter your email:')
    if (!emailInput) return

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
      redirectTo: 'https://filmtrack.pp.ua/reset-password.html',
    })

    setLoading(false)

    if (error) {
      alert('❌ ' + error.message)
    } else {
      alert(t('auth.reset_sent'))
    }
  }

    return (
    <div className="flex items-center justify-center p-4 py-16">
      <div className="w-full max-w-md">
        <form onSubmit={handleAuth} className="bg-gray-800 p-6 rounded-xl w-full space-y-4 shadow-xl">
          <h2 className="text-2xl font-bold text-white text-center">🎬 Movie Tracker</h2>
          
          <input 
            type="email" 
            placeholder={t('auth.email')} 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          
          <input 
            type="password" 
            placeholder={t('auth.password')} 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-blue-400 hover:text-blue-300 underline cursor-pointer bg-transparent border-none p-0 font-inherit disabled:opacity-50"
            >
              {t('auth.forgot_password')}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white p-3 rounded font-medium transition"
          >
            {loading ? t('auth.loading') : (isSignUp ? t('auth.sign_up') : t('auth.sign_in'))}
          </button>
          
          <p 
            className="text-center text-sm text-gray-400 cursor-pointer hover:text-white transition" 
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
          >
            {isSignUp ? t('auth.has_account') : t('auth.no_account')}
          </p>
          
          {message && (
            <p className={`text-center text-sm ${message.startsWith('❌') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </form>

      </div>

      {showEarly && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowEarly(false)}
        >
          <div
            className="relative w-full max-w-sm bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-3">🎁</div>
            <h2 className="text-lg font-bold text-white mb-2">{t('early.title')}</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">{t('early.text')}</p>
            <button
              onClick={() => setShowEarly(false)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              {t('early.got_it')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
