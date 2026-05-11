import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import { SearchBar } from './components/SearchBar'
import { Library } from './pages/Library'
import { ScrollToTop } from './components/ScrollToTop'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('search')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
  }, [])

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">Загрузка...</div>
  if (!user) return <Auth />

  const containerStyle = { maxWidth: '450px', margin: '0 auto', padding: '0 16px' }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-50">
        <div style={containerStyle} className="py-4 flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">🎬 Movie Tracker</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 truncate max-w-[150px]">{user.email}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-red-400 hover:text-red-300 bg-red-600/10 px-2 py-1 rounded">Выйти</button>
          </div>
        </div>
      </header>

      <div style={containerStyle} className="py-6">
        <div className="flex justify-center gap-6 border-b border-gray-800 pb-3 mb-6">
          <button onClick={() => setTab('search')} className={`pb-2 text-lg font-medium transition ${tab === 'search' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>🔍 Поиск</button>
          <button onClick={() => setTab('library')} className={`pb-2 text-lg font-medium transition ${tab === 'library' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>📚 Библиотека</button>
        </div>
        {tab === 'search' ? <SearchBar /> : <Library />}
      </div>
      <ScrollToTop />
    </div>
  )
}
export default App