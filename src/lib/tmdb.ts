const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300'

export function getPosterUrl(path: string | null): string {
  if (!path) return 'https://via.placeholder.com/300x450?text=No+Poster'
  return IMAGE_BASE + path
}

export async function searchMedia(query: string, page = 1) {
  const params = new URLSearchParams({
    query,
    include_adult: 'false',
    language: 'ru-RU',
    page: String(page),
    api_key: API_KEY
  })
  const response = await fetch(`${BASE_URL}/search/multi?${params.toString()}`)
  if (!response.ok) throw new Error('TMDB API error')
  const data = await response.json()
  const filtered = data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
  return { results: filtered, total_pages: data.total_pages, page: data.page, total_results: data.total_results }
}