import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { searchMedia } from '../lib/tmdb'
import { MediaCard } from './MediaCard'

export function SearchBar() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query); setPage(1) }, 400)
    return () => clearTimeout(timer)
  }, [query])

  const { data } = useQuery({
    queryKey: ['search', debouncedQuery, page],
    queryFn: () => searchMedia(debouncedQuery, page),
    enabled: debouncedQuery.length >= 2,
  })

  return (
    <div className="space-y-6">
      <input 
        type="text" 
        placeholder={`🔍 ${t('search.placeholder')}`} 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-5 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" 
      />
      
      <div className="space-y-3">
        {data?.results.map((item: any) => <MediaCard key={item.id} item={item} />)}
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1} 
            className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
          >
            ← {t('search.back')}
          </button>
          <span className="py-1.5 text-gray-400 text-sm">{page} / {data.total_pages}</span>
          <button 
            onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} 
            disabled={page === data.total_pages} 
            className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
          >
            {t('search.forward')} →
          </button>
        </div>
      )}
    </div>
  )
}