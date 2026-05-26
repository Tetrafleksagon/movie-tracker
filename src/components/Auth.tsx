import { useState } from 'react'
import { supabase } from '../lib/supabase'

// ✅ Именованный экспорт (как ожидает App.tsx)
export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('✅ Проверьте почту для подтверждения!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      setMessage('❌ ' + err.message)
    } finally { 
      setLoading(false) 
    }
  }

  // 🔐 Обработчик сброса пароля
const handleForgotPassword = async () => {
  const emailInput = prompt('Введите email для сброса пароля:')
  if (!emailInput) return
  
  const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
    redirectTo: 'https://filmtrack.pp.ua/reset-password.html',
  })
  
  if (error) alert('❌ Ошибка: ' + error.message)
  else alert('✅ Письмо отправлено на: ' + emailInput)
}
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <form onSubmit={handleAuth} className="bg-gray-800 p-6 rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-white text-center">🎬 Movie Tracker</h2>
        
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" 
        />
        
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" 
        />
        
        {/* 🔐 Ссылка "Забыли пароль?" */}
        <div className="text-right">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-400 hover:text-blue-300 underline cursor-pointer bg-transparent border-none p-0 font-inherit"
          >
            Забыли пароль?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium transition"
        >
          {loading ? 'Загрузка...' : (isSignUp ? 'Регистрация' : 'Войти')}
        </button>
        
        <p 
          className="text-center text-sm text-gray-400 cursor-pointer hover:text-white" 
          onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
        >
          {isSignUp ? 'Есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </p>
        
        {message && <p className="text-center text-sm text-green-400">{message}</p>}
      </form>
    </div>
  )
}