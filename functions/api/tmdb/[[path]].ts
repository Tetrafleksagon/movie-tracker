// Cloudflare Pages Function — TMDB proxy.
// Maps  /api/tmdb/<path>?<query>  ->  https://api.themoviedb.org/3/<path>?<query>&api_key=SECRET
// The API key lives in the server-side env var TMDB_API_KEY and never reaches
// the browser. GET responses are edge-cached to cut TMDB calls and speed up
// repeat requests. (Typed loosely: this dir is built by Cloudflare, not by our tsc.)

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env, waitUntil } = context

  const incoming = new URL(request.url)
  const path = incoming.pathname.replace(/^\/api\/tmdb\//, '')
  if (!path) return new Response('Not found', { status: 404 })

  if (!env.TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: 'TMDB_API_KEY is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build the upstream URL, forwarding all query params and adding the key.
  const target = new URL(`https://api.themoviedb.org/3/${path}`)
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value))
  target.searchParams.set('api_key', env.TMDB_API_KEY)

  // Cache key is the public incoming URL (no secret stored in cache).
  const cache = (caches as any).default
  const cacheKey = new Request(incoming.toString(), { method: 'GET' })
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const upstream = await fetch(target.toString(), { headers: { Accept: 'application/json' } })

  const response = new Response(upstream.body, upstream)
  response.headers.set('Cache-Control', 'public, max-age=3600')
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.delete('set-cookie')

  if (upstream.ok) waitUntil(cache.put(cacheKey, response.clone()))
  return response
}
