import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { getPosterUrl } from '../lib/tmdb'
import { supabase } from '../lib/supabase'
import { MovieModal } from './MovieModal'
import { StatusSelect } from './StatusSelect'
import { RATING_COLORS, getStatusIcon, type StatusHistory } from '../lib/status'

export function MediaCard({ item }: { item: any }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const tmdbLang = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  const [showModal, setShowModal] = useState(false)
  // Seeded from props: Library already loaded these in its single query, so we
  // avoid an extra per-card request to Supabase. Local state still tracks the
  // user's edits (status / rating) optimistically.
  const [status, setStatus] = useState<string | null>(item.status ?? null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(item.updated_at ?? null)
  const [history, setHistory] = useState<StatusHistory>(item.status_history || [])
  const [loading, setLoading] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(item.user_rating ?? null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const title = item.title || item.name || t('common.no_title')
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '—'
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '—'
  const mediaType = item.media_type || 'movie'

  const addToLibrary = async (newStatus: string) => {
    try {
      setLoading(true)
      const user = (await supabase.auth.getUser()).data?.user
      if (!user) { alert(t('auth.please_login')); setLoading(false); return }

      const now = new Date().toISOString()
      const updatedHistory = [{ status: newStatus, time: now }, ...history].slice(0, 3)

      const { error: cacheError } = await supabase.from('media_cache').upsert({
        tmdb_id: item.id, media_type: item.media_type, title, poster_path: item.poster_path,
        vote_average: item.vote_average || 0, release_date: item.release_date || item.first_air_date
      }, { onConflict: 'tmdb_id' })
      if (cacheError) console.error('Cache error:', cacheError)

      const { error } = await supabase.from('user_media').upsert({
        user_id: user.id, tmdb_id: item.id, status: newStatus, updated_at: now,
        status_history: updatedHistory
      }, { onConflict: 'user_id,tmdb_id' })

      if (error) { console.error('Status save error:', error); alert(t('common.error_save')) }
      else {
        setStatus(newStatus); setUpdatedAt(now); setHistory(updatedHistory)
        // Library/Stats caches now hold stale rows — refetch them next time.
        queryClient.invalidateQueries({ queryKey: ['library'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
      setLoading(false)
    } catch (err) {
      console.error('addToLibrary error:', err)
      alert(t('common.error'))
      setLoading(false)
    }
  }

  const saveRating = async (n: number) => {
    const user = (await supabase.auth.getUser()).data?.user
    if (!user) return
    const newRating = userRating === n ? null : n
    const { error } = await supabase
      .from('user_media')
      .update({ user_rating: newRating })
      .eq('user_id', user.id)
      .eq('tmdb_id', item.id)
    if (error) console.error('Rating save error:', error)
    else {
      setUserRating(newRating)
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const getStars = (val: number) => {
    if (!val) return ''
    if (val >= 8) return '⭐⭐⭐'
    if (val >= 6) return '⭐⭐'
    return '⭐'
  }

  const getTypeIcon = () => (mediaType === 'tv' ? '📺' : '🎬')
  const getTypeLabel = () => t(mediaType === 'tv' ? 'media.tv_show' : 'media.movie')
  const getStatusLabel = (s: string) => t(`status.${s}`) || s

  const activeRating = hoverRating ?? userRating ?? 0

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 bg-gray-800 p-4 rounded-xl border border-gray-700 mb-5 w-full relative">
      {item.onDelete && (
        <button onClick={item.onDelete} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(220,38,38,0.2)', border: 'none', color: '#ef4444', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
      )}

      {/* Постер */}
      <div
        className="relative rounded-lg overflow-hidden flex-shrink-0 w-full sm:w-40 sm:h-60 cursor-pointer group"
        style={{ aspectRatio: '2/3' }}
        onClick={() => setShowModal(true)}
      >
        <img src={getPosterUrl(item.poster_path)} className="absolute inset-0 w-full h-full object-cover object-top group-hover:brightness-75 transition-all duration-200" alt={title} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-4xl drop-shadow-lg">🔍</span>
        </div>
        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.85)', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{getStars(item.vote_average)}</span>
          <span style={{ fontSize: '10px', color: '#fff' }}>{rating}</span>
        </div>
      </div>

      {/* Контент */}
      <div className="flex flex-col gap-2 justify-center min-w-0 flex-1">
        <div>
          <h3 className="m-0 text-lg font-bold text-white leading-snug break-words cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setShowModal(true)}>{title}</h3>
          <p className="mt-1 text-sm text-gray-400 flex items-center gap-2 flex-wrap">
            <span>{year}</span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1">{getTypeIcon()} {getTypeLabel()}</span>
          </p>
        </div>

        <StatusSelect
          value={status || ''}
          onStatus={addToLibrary}
          disabled={loading}
          placeholder={`— ${t('status.select')} —`}
          className="w-full sm:w-auto rounded-md text-sm text-white font-medium py-1.5 px-2.5 border-none cursor-pointer"
          style={{ opacity: loading ? 0.7 : 1 }}
        />

        {/* Личный рейтинг */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
            const isActive = n <= activeRating
            const color = isActive ? RATING_COLORS[n] : '#374151'
            return (
              <button
                key={n}
                onClick={() => saveRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(null)}
                title={String(n)}
                style={{ backgroundColor: color, width: '24px', height: '24px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: isActive ? '#fff' : '#6b7280', transition: 'background-color 0.1s' }}
              >
                {n}
              </button>
            )
          })}
          {userRating && (
            <span className="text-xs text-gray-400 ml-1">
              {userRating}/10
            </span>
          )}
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

      {showModal && (
        <MovieModal
          item={{ ...item, id: item.id ?? item.tmdb_id }}
          status={status || ''}
          lang={tmdbLang}
          onStatus={addToLibrary}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
