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
  const mediaType = item.media_type || 'movie'

  useEffect(() => { checkInLibrary() }, [item.id])

  const checkInLibrary = async () => {
    try {
      // ✅ ПРОСТОЙ И НАДЁЖНЫЙ СПОСОБ: без сложной деструктуризации
      const response = await supabase.auth.getUser()
      const user = response.data?.user
      if (!user) return

      const { data, error } = await supabase
        .from('user_media')
        .select('status, updated_at')
        .eq('user_id', user.id)
        .eq('tmdb_id', item.id)
        .maybeSingle()

      if (error) {
        console.error('Ошибка загрузки статуса:', error)
        return
      }

      if (data) {
        setStatus(data.status)
        setUpdatedAt(data.updated_at)
      }
    } catch (err) {
      console.error('checkInLibrary error:', err)
    }
  }

  const addToLibrary = async (newStatus: string) => {
    try {
      setLoading(true)
      // ✅ ПРОСТОЙ И НАДЁЖНЫЙ СПОСОБ
      const response = await supabase.auth.getUser()
      const user = response.data?.user
      if (!user) {
        alert('Войдите в аккаунт!')
        setLoading(false)
        return
      }

      const now = new Date().toISOString()

      const { error: cacheError } = await supabase
        .from('media_cache')
        .upsert({
          tmdb_id: item.id,
          media_type: item.media_type,
          title,
          poster_path: item.poster_path,
          vote_average: item.vote_average || 0,
          release_date: item.release_date || item.first_air_date
        }, { onConflict: 'tmdb_id' })

      if (cacheError) console.error('Cache error:', cacheError)

      const { error: statusError } = await supabase
        .from('user_media')
        .upsert({
          user_id: user.id,
          tmdb_id: item.id,
          status: newStatus,
          updated_at: now
        }, { onConflict: 'user_id,tmdb_id' })

      if (statusError) {
        console.error('Status save error:', statusError)
        alert('Не удалось сохранить статус.')
      } else {
        setStatus(newStatus)
        setUpdatedAt(now)
      }
      setLoading(false)
    } catch (err) {
      console.error('addToLibrary error:', err)
      alert('Ошибка при сохранении.')
      setLoading(false)
    }
  }

  const getColor = (s: string) => {
    if (!s) return '#374151'
    if (s === 'watched') return '#16a34a'
    if (s === 'watching') return '#2563eb'
    if (s === 'dropped') return '#dc2626'
    return '#4b5563'
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}.${mm}.${yy} ${hh}:${min}`
  }

  // ✅ 1-3 звёзды в зависимости от рейтинга
  const getStars = (val: number) => {
    if (!val) return ''
    if (val >= 8) return '⭐⭐⭐'
    if (val >= 6) return '⭐⭐'
    return '⭐'
  }

  const getTypeIcon = () => (mediaType === 'tv' ? '📺' : '🎬')
  const getTypeLabel = () => (mediaType === 'tv' ? 'сериал' : 'фильм')

  return (
    <div style={{ display: 'flex', gap: '20px', backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151', marginBottom: '20px', width: '100%', position: 'relative' }}>
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(220,38,38,0.2)', border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
      )}
      <div style={{ width: '160px', flexShrink: 0, position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
        <img src={getPosterUrl(item.poster_path)} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} alt={title} />
        
        {/* ✅ Компактный бейдж с динамическими звёздами */}
        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.85)', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{getStars(item.vote_average)}</span>
          <span style={{ fontSize: '10px', color: '#fff' }}>{rating}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'white', lineHeight: '1.3' }}>{title}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{year}</span>
            <span style={{ color: '#6b7280' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{getTypeIcon()} {getTypeLabel()}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select value={status || ''} onChange={(e) => addToLibrary(e.target.value)} disabled={loading} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '14px', backgroundColor: status ? getColor(status) : '#374151', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', minWidth: '140px', opacity: loading ? 0.7 : 1 }}>
            <option value="" disabled> Статус</option>
            <option value="planned"> В планах</option>
            <option value="watching">👀 Смотрю</option>
            <option value="watched">✅ Просмотрено</option>
            <option value="dropped">❌ Бросил</option>
          </select>
          {updatedAt && <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 'auto' }}>{formatDate(updatedAt)}</span>}
        </div>
        {loading && <span style={{ fontSize: '11px', color: '#6b7280' }}>Сохранение...</span>}
      </div>
    </div>
  )
}