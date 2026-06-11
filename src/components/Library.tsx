import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { localizeMediaItems } from '../lib/tmdb'
import { MediaCard } from '../components/MediaCard'
import { ShareModal } from '../components/ShareModal'

const PAGE_SIZES = [5, 10, 15] as const

export function Library() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const tmdbLang = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title' | 'user_rating'>('date')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const filters = ['all', 'planned', 'watching', 'watched', 'dropped'] as const

  // Library rows, cached per language; localization cache keeps switches fast.
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['library', tmdbLang],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('user_media')
        .select(`*, user_rating, media_cache:media_cache (tmdb_id, title, poster_path, vote_average, release_date, media_type)`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const mapped = (data || []).map(item => ({
        ...item,
        title: item.media_cache?.title || item.title || 'Без названия',
        poster_path: item.media_cache?.poster_path || item.poster_path,
        vote_average: item.media_cache?.vote_average || item.vote_average,
        media_type: item.media_cache?.media_type || item.media_type || 'movie',
        release_date: item.media_cache?.release_date || item.release_date,
        id: item.tmdb_id,
      }))

      return localizeMediaItems(mapped, tmdbLang)
    },
  })

  const totalPages = Math.ceil(filteredItems.length / pageSize)
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    let base = activeFilter === 'all' ? items : items.filter(i => i.status === activeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      base = base.filter(i => (i.title || '').toLowerCase().includes(q))
    }
    const sorted = [...base]
    if (sortBy === 'title') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    else if (sortBy === 'rating') sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    else if (sortBy === 'user_rating') sorted.sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0))
    setFilteredItems(sorted)
  }, [activeFilter, items, searchQuery, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, pageSize, searchQuery, sortBy])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setCurrentIndex(1)
  }, [currentPage])

  useEffect(() => {
    setCurrentIndex(1)
    cardRefs.current = cardRefs.current.slice(0, paginatedItems.length)

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
  }, [paginatedItems])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }

  const deleteItem = async (tmdbId: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_media')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId)

    if (error) {
      console.error('Error deleting item:', error)
    } else {
      // Drop the item from every cached language variant; refresh stats.
      queryClient.setQueriesData({ queryKey: ['library'] }, (old: any[] | undefined) =>
        old?.filter(i => i.tmdb_id !== tmdbId)
      )
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 pt-0 pb-6">

      {/* Sticky: фильтры + размер страницы + счётчик */}
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

          {/* Выбор количества на странице */}
          {!loading && filteredItems.length > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {PAGE_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    pageSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-500 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {!loading && paginatedItems.length > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
              {currentIndex}/{paginatedItems.length}
            </span>
          )}
          {userId && (
            <button
              onClick={() => setShowShare(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition"
              title={t('share.title')}
            >
              🔗 {t('share.button')}
            </button>
          )}
        </div>
        {/* Search + Sort */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('library.search_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full py-1.5 pl-3 pr-7 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none"
              >×</button>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {(['date', 'rating', 'title', 'user_rating'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  sortBy === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t(`library.sort_${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showShare && userId && (
        <ShareModal userId={userId} onClose={() => setShowShare(false)} />
      )}

      {/* Контент */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">{t('common.loading')}</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">
            {items.length === 0 ? t('library.empty') : t('library.no_matches')}
          </p>
          {items.length === 0 && (
            <p className="text-sm text-gray-500">{t('library.start_searching')}</p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedItems.map((item, index) => (
              <div key={item.tmdb_id} ref={(el: HTMLDivElement | null) => { cardRefs.current[index] = el }}>
                <MediaCard item={{ ...item, onDelete: () => deleteItem(item.tmdb_id) }} />
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-1.5 rounded bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded text-sm font-medium transition ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-1.5 rounded bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
