import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function ForgotPassword({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback#`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        border: '1px solid #334155'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#f1f5f9', textAlign: 'center' }}>
          🔑 Сброс пароля
        </h2>

        {!success ? (
          <>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
              Введите ваш email, и мы отправим ссылку для сброса пароля.
            </p>

            <form onSubmit={handleReset}>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid #dc2626',
                  color: '#fca5a5',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '15px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#475569',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>
              ✅
            </div>
            <p style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#f1f5f9' }}>
              Письмо отправлено!
            </p>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94a3b8' }}>
              Проверьте почту {email} и перейдите по ссылке для сброса пароля.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  )
}