import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { MediaCard } from '../components/MediaCard'

export function Library() {
  const { t } = useTranslation()
  const [items, setItems] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [currentIndex, setCurrentIndex] = useState(1)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const filters = ['all', 'planned', 'watching', 'watched', 'dropped'] as const

  useEffect(() => {
    fetchLibrary()
  }, [])

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter(item => item.status === activeFilter))
    }
  }, [activeFilter, items])

  useEffect(() => {
    setCurrentIndex(1)
    cardRefs.current = cardRefs.current.slice(0, filteredItems.length)

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 10) {
        setCurrentIndex(cardRefs.current.length)
        return
      }
      let current = 1
      for (let i = cardRefs.current.length - 1; i >= 0; i--) {
        const el = cardRefs.current[i]
        if (el && el.getBoundingClientRect().top <= 120) {
          current = i + 1
          break
        }
      }
      setCurrentIndex(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [filteredItems])

  const fetchLibrary = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('user_media')
      .select(`
        *,
        media_cache:media_cache (
          tmdb_id,
          title,
          poster_path,
          vote_average,
          release_date,
          media_type
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching library:', error)
    } else {
      const mergedData = (data || []).map(item => ({
        ...item,
        title: item.media_cache?.title || item.title || 'Без названия',
        poster_path: item.media_cache?.poster_path || item.poster_path,
        vote_average: item.media_cache?.vote_average || item.vote_average,
        media_type: item.media_cache?.media_type || item.media_type || 'movie',
        release_date: item.media_cache?.release_date || item.release_date,
        id: item.tmdb_id,
      }))
      setItems(mergedData)
    }
    setLoading(false)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pt-0 pb-6">
      {/* Sticky: фильтры + счётчик */}
      <div className="sticky top-14 sm:top-[73px] z-40 bg-gray-900 py-4 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex-shrink-0 ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {filter === 'all' ? t('filters.all') : t(`filters.${filter}`)}
              </button>
            ))}
          </div>
          {!loading && filteredItems.length > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
              {currentIndex}/{filteredItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Контент */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">{t('common.loading')}</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">
            {items.length === 0
              ? t('library.empty')
              : t('library.no_matches')}
          </p>
          {items.length === 0 && (
            <p className="text-sm text-gray-500">{t('library.start_searching')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <div key={item.tmdb_id} ref={(el: HTMLDivElement | null) => { cardRefs.current[index] = el }}>
              <MediaCard item={item} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
