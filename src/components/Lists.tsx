import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPosterUrl, localizeMediaItems } from '../lib/tmdb'
import { MovieModal } from './MovieModal'
import {
  fetchLists, createList, deleteList, fetchListItems, removeFromList,
} from '../lib/lists'

export function Lists() {
  const { t, i18n } = useTranslation()
  const tmdbLang = i18n.language === 'ru' ? 'ru-RU' : 'en-US'
  const queryClient = useQueryClient()
  const [openId, setOpenId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const { data: lists, isLoading } = useQuery({ queryKey: ['lists'], queryFn: fetchLists })

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const { error } = await createList(name)
    if (error) { console.error('createList error:', error); return }
    setNewName('')
    queryClient.invalidateQueries({ queryKey: ['lists'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('lists.delete_confirm'))) return
    const { error } = await deleteList(id)
    if (error) { console.error('deleteList error:', error); return }
    if (openId === id) setOpenId(null)
    queryClient.invalidateQueries({ queryKey: ['lists'] })
  }

  if (isLoading) {
    return <p className="text-center text-gray-400 py-16 animate-pulse">{t('common.loading')}</p>
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-100">{t('lists.title')}</h1>

      {/* Create */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          placeholder={t('lists.create_placeholder')}
          className="flex-1 py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="px-4 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition"
        >
          {t('lists.create')}
        </button>
      </div>

      {(lists || []).length === 0 ? (
        <p className="text-center text-gray-500 py-12">{t('lists.empty')}</p>
      ) : (
        <div className="space-y-3">
          {(lists || []).map(l => (
            <ListBlock
              key={l.id}
              id={l.id}
              name={l.name}
              open={openId === l.id}
              onToggle={() => setOpenId(openId === l.id ? null : l.id)}
              onDelete={() => handleDelete(l.id)}
              tmdbLang={tmdbLang}
              onSelectItem={setSelectedItem}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <MovieModal
          item={selectedItem}
          status=""
          lang={tmdbLang}
          onStatus={() => {}}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </main>
  )
}

type ListBlockProps = {
  id: string
  name: string
  open: boolean
  onToggle: () => void
  onDelete: () => void
  tmdbLang: string
  onSelectItem: (item: any) => void
}

function ListBlock({ id, name, open, onToggle, onDelete, tmdbLang, onSelectItem }: ListBlockProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Localize posters/titles to the current language (cached), like the library.
  const { data: items } = useQuery({
    queryKey: ['list-items', id, tmdbLang],
    queryFn: () => fetchListItems(id).then(rows => localizeMediaItems(rows, tmdbLang)),
    enabled: open,
  })
  // Count is loaded once a list is opened; collapsed lists just show a chevron.
  const { data: count } = useQuery({
    queryKey: ['list-counts', id],
    queryFn: () => fetchListItems(id).then(r => r.length),
  })

  const remove = async (tmdbId: number) => {
    const { error } = await removeFromList(id, tmdbId)
    if (error) { console.error('removeFromList error:', error); return }
    queryClient.invalidateQueries({ queryKey: ['list-items', id] })
    queryClient.invalidateQueries({ queryKey: ['list-counts', id] })
    queryClient.invalidateQueries({ queryKey: ['item-lists', tmdbId] })
  }

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <span className={`text-gray-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
          <span className="font-semibold text-gray-100 truncate">{name}</span>
          {count != null && <span className="text-xs text-gray-500 flex-shrink-0">{count}</span>}
        </button>
        <button
          onClick={onDelete}
          title={t('lists.delete')}
          className="flex-shrink-0 w-7 h-7 rounded-md bg-red-900/30 hover:bg-red-900/60 text-red-400 transition flex items-center justify-center"
        >
          ×
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          {items && items.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">{t('lists.list_empty')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {(items || []).map(it => (
                <div key={it.tmdb_id} className="relative group">
                  <div
                    className="relative rounded-lg overflow-hidden cursor-pointer"
                    style={{ aspectRatio: '2/3' }}
                    onClick={() => onSelectItem({ ...it, id: it.tmdb_id })}
                  >
                    <img
                      src={getPosterUrl(it.poster_path)}
                      alt={it.title}
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:brightness-75 transition"
                      loading="lazy"
                    />
                  </div>
                  <button
                    onClick={() => remove(it.tmdb_id)}
                    title={t('lists.remove')}
                    className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/70 hover:bg-red-600 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                  <p className="text-xs text-gray-300 mt-1 truncate" title={it.title}>{it.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
