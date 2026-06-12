import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchLists, createList, fetchItemListIds, addToList, removeFromList,
  type ListMedia,
} from '../lib/lists'

// Compact "add to list" control shown in the movie modal: a toggle that opens
// a panel with one checkbox per list plus inline "create list".
export function AddToListMenu({ item }: { item: ListMedia }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: lists } = useQuery({ queryKey: ['lists'], queryFn: fetchLists })
  const { data: memberIds } = useQuery({
    queryKey: ['item-lists', item.id],
    queryFn: () => fetchItemListIds(item.id),
  })

  // null = signed out → hide entirely.
  if (lists === null || lists === undefined) return null

  const member = new Set(memberIds || [])

  const refresh = (listId: string) => {
    queryClient.invalidateQueries({ queryKey: ['item-lists', item.id] })
    queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    queryClient.invalidateQueries({ queryKey: ['list-counts'] })
  }

  const toggle = async (listId: string, isMember: boolean) => {
    if (isMember) {
      const { error } = await removeFromList(listId, item.id)
      if (error) { console.error('removeFromList error:', error); return }
    } else {
      const { error } = await addToList(listId, item)
      if (error) { console.error('addToList error:', error); return }
    }
    refresh(listId)
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const { data, error } = await createList(name)
    if (error || !data) { console.error('createList error:', error); return }
    setNewName('')
    queryClient.invalidateQueries({ queryKey: ['lists'] })
    await addToList(data.id, item)
    refresh(data.id)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full py-2.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition flex items-center justify-center gap-2"
      >
        📑 {t('lists.add_to_list')}
        {member.size > 0 && (
          <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5">{member.size}</span>
        )}
      </button>

      {open && (
        <div className="mt-2 bg-gray-900/60 border border-gray-700 rounded-lg p-2 space-y-1">
          {lists.length === 0 && (
            <p className="text-xs text-gray-500 px-1 py-1">{t('lists.empty_hint')}</p>
          )}
          {lists.map(l => {
            const isMember = member.has(l.id)
            return (
              <button
                key={l.id}
                onClick={() => toggle(l.id, isMember)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-700/50 transition text-left"
              >
                <span
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold border transition-colors ${
                    isMember ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-500 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="text-sm text-gray-200 truncate">{l.name}</span>
              </button>
            )
          })}

          <div className="flex gap-1.5 pt-1">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              placeholder={t('lists.new_list')}
              className="flex-1 py-1.5 px-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-3 rounded text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
