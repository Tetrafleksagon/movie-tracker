import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getPosterUrl } from '../lib/tmdb'
import { supabase } from '../lib/supabase'

type StatusHistory = { status: string; time: string }[]

export function MediaCard({ item }: { item: any }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [history, setHistory] = useState<StatusHistory>([])
  const [loading, setLoading] = useState(false)

  const title = item.title || item.name || t('common.no_title')
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '—'
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '—'
  const mediaType = item.media_type || 'movie'

  useEffect(() => { checkInLibrary() }, [item.id])

  const checkInLibrary = async () => {
    try {
      const response = await supabase.auth.getUser()
      const user = response.data?.user
      if (!user) return

      const { data, error } = await supabase
        .from('user_media')
        .select('status, updated_at, status_history')
        .eq('user_id', user.id)
        .eq('tmdb_id', item.id)
        .maybeSingle()

      if (error) { console.error('Ошибка загрузки статуса:', error); return }

      if (data) {
        setStatus(data.status)
        setUpdatedAt(data.updated_at)
        setHistory(data.status_history || [])
      }
    } catch (err) { console.error('checkInLibrary error:', err) }
  }

  const addToLibrary = async (newStatus: string) => {
    try {
      setLoading(true)
      const response = await supabase.auth.getUser()
      const user = response.data?.user
      if (!user) { alert(t('auth.please_login')); setLoading(false); return }

      const now = new Date().toISOString()
      const newEntry = { status: newStatus, time: now }
      const updatedHistory = [newEntry, ...history].slice(0, 3)

      const { error: cacheError } = await supabase.from('media_cache').upsert({
        tmdb_id: item.id, media_type: item.media_type, title, poster_path: item.poster_path,
        vote_average: item.vote_average || 0, release_date: item.release_date || item.first_air_date
      }, { onConflict: 'tmdb_id' })
      if (cacheError) console.error('Cache error:', cacheError)

      const { error: statusError } = await supabase.from('user_media').upsert({
        user_id: user.id, tmdb_id: item.id, status: newStatus, updated_at: now,
        status_history: updatedHistory
      }, { onConflict: 'user_id,tmdb_id' })

      if (statusError) {
        console.error('Status save error:', statusError)
        alert(t('common.error_save'))
      } else {
        setStatus(newStatus)
        setUpdatedAt(now)
        setHistory(updatedHistory)
      }
      setLoading(false)
    } catch (err) {
      console.error('addToLibrary error:', err)
      alert(t('common.error'))
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

  const getStars = (val: number) => {
    if (!val) return ''
    if (val >= 8) return '⭐⭐⭐'
    if (val >= 6) return '⭐⭐'
    return '⭐'
  }

  const getTypeIcon = () => (mediaType === 'tv' ? '📺' : '🎬')
  
  // ✅ Локализованный тип медиа
  const getTypeLabel = () => t(mediaType === 'tv' ? 'media.tv_show' : 'media.movie')

  const getStatusIcon = (s: string) => {
    if (s === 'planned') return '📋'
    if (s === 'watching') return '👀'
    if (s === 'watched') return '✅'
    if (s === 'dropped') return '❌'
    return ''
  }

  // ✅ Локализованная метка статуса
  const getStatusLabel = (s: string) => {
    const key = `status.${s}`
    return t(key) || s
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 bg-gray-800 p-4 rounded-xl border border-gray-700 mb-5 w-full relative">
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(220,38,38,0.2)', border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
      )}

      {/* Постер */}
      <div className="relative rounded-lg overflow-hidden flex-shrink-0 w-full sm:w-40 sm:h-60" style={{ aspectRatio: '2/3' }}>
        <img
          src={getPosterUrl(item.poster_path)}
          className="absolute inset-0 w-full h-full object-cover object-top"
          alt={title}
        />
        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.85)', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{getStars(item.vote_average)}</span>
          <span style={{ fontSize: '10px', color: '#fff' }}>{rating}</span>
        </div>
      </div>

      {/* Контент */}
      <div className="flex flex-col gap-2 justify-center min-w-0 flex-1">
        <div>
          <h3 className="m-0 text-lg font-bold text-white leading-snug break-words">{title}</h3>
          <p className="mt-1 text-sm text-gray-400 flex items-center gap-2 flex-wrap">
            <span>{year}</span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1">{getTypeIcon()} {getTypeLabel()}</span>
          </p>
        </div>

        <div>
          <select
            value={status || ''}
            onChange={(e) => addToLibrary(e.target.value)}
            disabled={loading}
            className="w-full sm:w-auto rounded-md text-sm text-white font-medium py-1.5 px-2.5 border-none cursor-pointer"
            style={{
              backgroundColor: status ? getColor(status) : '#374151',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="" disabled>— {t('status.select')} —</option>
            <option value="planned">📋 {t('status.planned')}</option>
            <option value="watching">👀 {t('status.watching')}</option>
            <option value="watched">✅ {t('status.watched')}</option>
            <option value="dropped">❌ {t('status.dropped')}</option>
          </select>
        </div>

        {/* История статусов */}
        <div className="flex flex-col gap-0.5 mt-1 border-t border-gray-700 pt-2">
          <div className="flex gap-x-4 text-xs text-gray-200 font-medium">
            <span>{status ? `${getStatusIcon(status)} ${getStatusLabel(status)}` : t('status.not_selected')}</span>
            <span className="text-gray-400 whitespace-nowrap">{formatDate(updatedAt)}</span>
          </div>
          {history.slice(1).map((h, i) => (
            <div key={i} className="flex gap-x-4 text-xs text-gray-500">
              <span>{getStatusIcon(h.status)} {getStatusLabel(h.status)}</span>
              <span className="whitespace-nowrap">{formatDate(h.time)}</span>
            </div>
          ))}
        </div>

        {loading && <span className="text-xs text-gray-500">{t('common.saving')}...</span>}
      </div>
    </div>
  )
}