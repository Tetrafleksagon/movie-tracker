import { useState, useEffect } from 'react'
import { getPosterUrl } from '../lib/tmdb'
import { supabase } from '../lib/supabase'

export function MediaCard({ item }: { item: any }) {
  const [status, setStatus] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const title = item.title || item.name || 'Без названия'
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '—'
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '—'

  useEffect(() => { checkInLibrary() }, [item.id])

  const checkInLibrary = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const { data: response } = await supabase
      .from('user_media')
      .select('status, status_updated_at')
      .eq('user_id', data.user.id)
      .eq('tmdb_id', item.id)
      .maybeSingle()
    
    if (response) {
      setStatus(response.status)
      setUpdatedAt(response.status_updated_at || null)
    }
  }

  const addToLibrary = async (newStatus: string) => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) return alert('Войдите в аккаунт!')
    const user = data.user
    const now = new Date().toISOString()

    await supabase.from('media_cache').upsert({
      tmdb_id: item.id, media_type: item.media_type, title, poster_path: item.poster_path,
      vote_average: item.vote_average || 0, release_date: item.release_date || item.first_air_date
    }, { onConflict: 'tmdb_id' })

    await supabase.from('user_media').upsert({
      user_id: user.id,
      tmdb_id: item.id,
      status: newStatus,
      status_updated_at: now, // Сохраняем время изменения статуса
      updated_at: now
    }, { onConflict: 'user_id,tmdb_id' })

    setStatus(newStatus)
    setUpdatedAt(now)
    setLoading(false)
  }

  const getColor = (s: string) => {
    if (!s) return '#374151'
    if (s === 'watched') return '#16a34a'
    if (s === 'watching') return '#2563eb'
    if (s === 'dropped') return '#dc2626'
    return '#4b5563'
  }

  // Форматирование: чч:мм дд/мм.гг
  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)
    return `${hh}:${mm} ${dd}/${mo}.${yy}`
  }

  return (
    <div style={{ 
      display: 'flex', gap: '20px', backgroundColor: '#1f2937', padding: '20px', 
      borderRadius: '12px', border: '1px solid #374151', marginBottom: '20px', 
      width: '100%', position: 'relative' 
    }}>
      
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ 
          position: 'absolute', top: '12px', right: '12px', background: 'rgba(220,38,38,0.2)', 
          border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', 
          cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 10 
        }}>×</button>
      )}

      <div style={{ width: '160px', flexShrink: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <img src={getPosterUrl(item.poster_path)} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} alt={title} />
        <div style={{ 
          position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.85)', 
          padding: '4px 8px', borderRadius: '6px', fontSize: '13px', color: '#fbbf24', 
          fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' 
        }}>
          <span>⭐</span> {rating}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'white', lineHeight: '1.3' }}>{title}</h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>{year}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* ✅ Уменьшен шрифт и добавлен padding для корректного отображения эмодзи */}
          <select value={status || ''} onChange={(e) => addToLibrary(e.target.value)} disabled={loading}
            style={{ 
              padding: '5px 8px', borderRadius: '6px', border: 'none', 
              fontSize: '13px', lineHeight: '1.4',
              backgroundColor: status ? getColor(status) : '#374151', 
              color: 'white', cursor: 'pointer', fontWeight: '500', minWidth: '140px'
            }}>
            <option value="" disabled> Статус</option>
            <option value="planned">📋 В планах</option>
            <option value="watching"> Смотрю</option>
            <option value="watched">✅ Просмотрено</option>
            <option value="dropped">❌ Бросил</option>
          </select>
          
          {/* ✅ Дата и время изменения статуса */}
          {updatedAt && (
            <span style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', fontWeight: '500' }}>
              {formatShortDate(updatedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}