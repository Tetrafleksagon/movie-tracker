import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MediaCard } from '../components/MediaCard'

export function Library() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const perPage = 5

  useEffect(() => { fetchLibrary() }, [filter])

  const fetchLibrary = async () => {
    setLoading(true)
    setPage(1)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    let q = supabase.from('user_media').select(`id, status, media:media_cache(*)`).eq('user_id', auth.user.id).order('updated_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setItems(data || [])
    setLoading(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить из библиотеки?')) return
    await supabase.from('user_media').delete().eq('id', id)
    fetchLibrary()
  }

  if (loading) return <div className="text-center text-gray-400 py-8">Загрузка...</div>
  
  const totalPages = Math.ceil(items.length / perPage)
  const currentItems = items.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2 flex-wrap">
        {['all', 'planned', 'watching', 'watched', 'dropped'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }} className={`px-3 py-1.5 rounded text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {f === 'all' ? 'Все' : f === 'planned' ? '📋 В планах' : f === 'watching' ? ' Смотрю' : f === 'watched' ? '✅ Просмотрено' : '❌ Бросил'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {currentItems.map((item: any) => (
          <MediaCard key={item.id} item={{ ...item.media, id: item.media.tmdb_id, onDelete: () => deleteItem(item.id) }} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50">← Назад</button>
          <span className="py-1.5 text-gray-400 text-sm">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50">Вперёд →</button>
        </div>
      )}
      <p className="text-center text-sm text-gray-500">Всего: {items.length}</p>
    </div>
  )
}