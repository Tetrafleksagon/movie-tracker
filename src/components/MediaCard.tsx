import { useState, useEffect } from 'react'
import { getPosterUrl } from '../lib/tmdb'
import { supabase } from '../lib/supabase'

export function MediaCard({ item }: { item: any }) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const title = item.title || item.name || 'Без названия'
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '—'
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '—'

  // Проверяем статус фильма в библиотеке при загрузке карточки
  useEffect(() => { 
    checkInLibrary() 
  }, [item.id])

  const checkInLibrary = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const {  response } = await supabase.from('user_media').select('status').eq('user_id', data.user.id).eq('tmdb_id', item.id).maybeSingle()
    if (response) setStatus(response.status)
  }

  // Сохраняем или обновляем статус
  const addToLibrary = async (newStatus: string) => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) return alert('Войдите в аккаунт!')
    const user = data.user

    // Сохраняем данные фильма в кэш
    await supabase.from('media_cache').upsert({
      tmdb_id: item.id, 
      media_type: item.media_type, 
      title, 
      poster_path: item.poster_path,
      vote_average: item.vote_average || 0, 
      release_date: item.release_date || item.first_air_date
    }, { onConflict: 'tmdb_id' })

    // Сохраняем выбор пользователя
    await supabase.from('user_media').upsert({
      user_id: user.id, 
      tmdb_id: item.id, 
      status: newStatus, 
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,tmdb_id' })

    setStatus(newStatus)
    setLoading(false)
  }

  // Функция для выбора цвета статуса (HEX цвета, чтобы не было ошибок в консоли)
  const getColor = (s: string) => {
    if (!s) return '#374151'        // Серый (по умолчанию)
    if (s === 'watched') return '#16a34a'   // Зелёный
    if (s === 'watching') return '#2563eb'  // Синий
    if (s === 'dropped') return '#dc2626'   // Красный
    return '#4b5563'                // Темно-серый
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      backgroundColor: '#1f2937', 
      padding: '20px', 
      borderRadius: '12px', 
      border: '1px solid #374151', 
      marginBottom: '20px', 
      width: '100%', 
      position: 'relative' 
    }}>
      
      {/* Кнопка удаления (видна только в Библиотеке) */}
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ 
          position: 'absolute', top: '12px', right: '12px', 
          background: 'rgba(220,38,38,0.2)', border: 'none', 
          color: '#ef4444', width: '28px', height: '28px', 
          borderRadius: '6px', cursor: 'pointer', fontSize: '18px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 
        }}>×</button>
      )}

      {/* Блок с постером и рейтингом */}
      <div style={{ width: '160px', flexShrink: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <img src={getPosterUrl(item.poster_path)} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} alt={title} />
        
        {/* Рейтинг поверх постера */}
        <div style={{ 
          position: 'absolute', bottom: '6px', right: '6px', 
          background: 'rgba(0,0,0,0.85)', padding: '4px 8px', 
          borderRadius: '6px', fontSize: '13px', color: '#fbbf24', 
          fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' 
        }}>
          <span>⭐</span> {rating}
        </div>
      </div>

      {/* Информация о фильме и кнопка статуса */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'white', lineHeight: '1.3' }}>{title}</h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>{year}</p>
        </div>
        
        <select value={status || ''} onChange={(e) => addToLibrary(e.target.value)} disabled={loading}
          style={{ 
            padding: '8px 12px', borderRadius: '6px', border: 'none', 
            fontSize: '14px', backgroundColor: status ? getColor(status) : '#374151', 
            color: 'white', cursor: 'pointer', fontWeight: '500', 
            alignSelf: 'flex-start', minWidth: '150px'
          }}>
          <option value="" disabled> Статус</option>
          <option value="planned"> В планах</option>
          <option value="watching"> Смотрю</option>
          <option value="watched">✅ Просмотрено</option>
          <option value="dropped">❌ Бросил</option>
        </select>
      </div>
    </div>
  )
}