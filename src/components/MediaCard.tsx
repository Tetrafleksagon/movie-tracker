import { useState, useEffect } from 'react'
import { getPosterUrl } from '../lib/tmdb'
import { supabase } from '../lib/supabase'

export function MediaCard({ item }: { item: any }) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const title = item.title || item.name || 'Без названия'
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '—'
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '—'

  // Проверяем, есть ли фильм в библиотеке
  useEffect(() => { checkInLibrary() }, [item.id])

  const checkInLibrary = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const {  response } = await supabase.from('user_media').select('status').eq('user_id', data.user.id).eq('tmdb_id', item.id).maybeSingle()
    if (response) setStatus(response.status)
  }

  // Сохраняем статус в базу
  const addToLibrary = async (newStatus: string) => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) return alert('Войдите в аккаунт!')
    const user = data.user

    // Кэшируем данные фильма
    await supabase.from('media_cache').upsert({
      tmdb_id: item.id, media_type: item.media_type, title, poster_path: item.poster_path,
      vote_average: item.vote_average || 0, release_date: item.release_date || item.first_air_date
    }, { onConflict: 'tmdb_id' })

    // Сохраняем связь с пользователем
    await supabase.from('user_media').upsert({
      user_id: user.id, tmdb_id: item.id, status: newStatus, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,tmdb_id' })

    setStatus(newStatus)
    setLoading(false)
  }

  // ✅ ИСПРАВЛЕНО: Возвращаем реальные HEX-цвета (убираем предупреждения)
  const getColor = (s: string) => {
    if (!s) return '#374151'
    if (s === 'watched') return '#16a34a'   // Зелёный
    if (s === 'watching') return '#2563eb'  // Синий
    if (s === 'dropped') return '#dc2626'   // Красный
    return '#4b5563'                        // Серый
  }

  return (
    <div style={{ display: 'flex', gap: '16px', backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px', border: '1px solid #374151', marginBottom: '16px', width: '100%', position: 'relative' }}>
      
      {/* Кнопка удаления (для библиотеки) */}
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(220,38,38,0.2)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      )}

      {/* Постер + Рейтинг */}
      <div style={{ width: '80px', flexShrink: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
        <img src={getPosterUrl(item.poster_path)} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} alt={title} />
        
        {/* ✅ Звёздочка и рейтинг (возвращено) */}
        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span>⭐</span> {rating}
        </div>
      </div>

      {/* Информация и кнопка статуса */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'white', lineHeight: '1.2' }}>{title}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>{year}</p>
        </div>
        
        {/* Кнопка статуса */}
        <select value={status || ''} onChange={(e) => addToLibrary(e.target.value)} disabled={loading}
          style={{ 
            padding: '6px 10px', 
            borderRadius: '6px', 
            border: 'none', 
            fontSize: '13px', 
            backgroundColor: status ? getColor(status) : '#374151', 
            color: 'white', 
            cursor: 'pointer',
            fontWeight: '500'
          }}>
          <option value="" disabled> Статус</option>
          <option value="planned">📋 В планах</option>
          <option value="watching"> Смотрю</option>
          <option value="watched">✅ Просмотрено</option>
          <option value="dropped">❌ Бросил</option>
        </select>
      </div>
    </div>
  )
}