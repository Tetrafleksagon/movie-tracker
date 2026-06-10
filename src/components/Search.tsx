import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export function Search() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToLibrary = async (item: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const title = item.title || item.name
    const now = new Date().toISOString()

    const { error: cacheError } = await supabase.from('media_cache').upsert({
      tmdb_id: item.id,
      media_type: item.media_type,
      title,
      poster_path: item.poster_path,
      vote_average: item.vote_average || 0,
      release_date: item.release_date || item.first_air_date,
    }, { onConflict: 'tmdb_id' })

    if (cacheError) console.error('Cache error:', cacheError)

    const { error } = await supabase.from('user_media').upsert({
      user_id: user.id,
      tmdb_id: item.id,
      status: 'planned',
      updated_at: now,
      status_history: [{ status: 'planned', time: now }],
    }, { onConflict: 'user_id,tmdb_id' })

    if (error) {
      console.error('Error adding to library:', error)
      alert('Error adding to library')
    } else {
      alert(t('common.add'))
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">{t('header.search')}</h2>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded font-medium transition"
          >
            {loading ? t('common.loading') : t('header.search')}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {results.map(item => (
          <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition">
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                alt={item.title || item.name}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-sm mb-2 truncate">
                {item.title || item.name}
              </h3>
              <button
                onClick={() => addToLibrary(item)}
                className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition"
              >
                + {t('common.add')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-center text-gray-400 mt-8">
          {t('search.start_typing')}
        </p>
      )}
    </main>
  )
} // <-- Эта закрывающая скобка была пропущена!