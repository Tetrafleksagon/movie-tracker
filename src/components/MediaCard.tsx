import { useState, useEffect } from 'react'
import { getPosterUrl } from '../lib/tmdb'
import { supabase } from '../lib/supabase'

export function MediaCard({ item }: { item: any }) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const title = item.title || item.name || 'Без названия'
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '—'

  useEffect(() => { checkInLibrary() }, [item.id])

  const checkInLibrary = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const { data: response } = await supabase.from('user_media').select('status').eq('user_id', data.user.id).eq('tmdb_id', item.id).maybeSingle()
    if (response) setStatus(response.status)
  }

  const addToLibrary = async (newStatus: string) => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) return alert('Войдите в аккаунт!')
    const user = data.user

    await supabase.from('media_cache').upsert({
      tmdb_id: item.id, media_type: item.media_type, title, poster_path: item.poster_path,
      vote_average: item.vote_average || 0, release_date: item.release_date || item.first_air_date
    }, { onConflict: 'tmdb_id' })

    await supabase.from('user_media').upsert({
      user_id: user.id, tmdb_id: item.id, status: newStatus, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,tmdb_id' })

    setStatus(newStatus)
    setLoading(false)
  }

  const getColor = (s: string) => s === 'watched' ? 'bg-green-600' : s === 'watching' ? 'bg-blue-600' : s === 'dropped' ? 'bg-red-600' : 'bg-gray-600'

  return (
    <div style={{ display: 'flex', gap: '12px', backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: '1px solid #374151', marginBottom: '12px', width: '100%', position: 'relative' }}>
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(220,38,38,0.2)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>×</button>
      )}
      <div style={{ width: '60px', flexShrink: 0 }}>
        <img src={getPosterUrl(item.poster_path)} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '4px' }} alt={title} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{title}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>{year}</p>
        </div>
        <select value={status || ''} onChange={(e) => addToLibrary(e.target.value)} disabled={loading}
          style={{ padding: '4px', borderRadius: '4px', border: 'none', fontSize: '12px', backgroundColor: status ? getColor(status) : '#374151', color: 'white', cursor: 'pointer' }}>
          <option value="" disabled>Статус</option>
          <option value="planned">📋 В планах</option>
          <option value="watching">👀 Смотрю</option>
          <option value="watched">✅ Просмотрено</option>
          <option value="dropped">❌ Бросил</option>
        </select>
      </div>
    </div>
  )
}