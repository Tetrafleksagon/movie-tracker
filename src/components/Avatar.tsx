import { useState, useEffect } from 'react'

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#16a34a', '#d97706', '#0891b2', '#dc2626', '#4f46e5']

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function colorFor(s: string): string {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

// Round user avatar. Renders <img> when a valid `url` is supplied, otherwise
// falls back to deterministic initials on a colored circle. On <img> load
// failure (deleted file, stale URL) it silently falls back to initials so the
// UI never shows a broken-image icon. Premium owners get a gold ring + star.
export function Avatar({
  name,
  size = 28,
  premium = false,
  url = null,
}: { name: string; size?: number; premium?: boolean; url?: string | null }) {
  const key = name || '?'
  const badge = Math.max(12, Math.round(size * 0.42))

  // Reset the "image failed" state whenever the URL actually changes — e.g.
  // after a re-upload the same user gets a new cache-busted URL and we should
  // try loading again instead of remembering the previous failure.
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [url])

  const showImage = !!url && !failed

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {showImage ? (
        <img
          src={url!}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            boxShadow: premium ? '0 0 0 2px #f59e0b' : undefined,
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center font-semibold text-white select-none"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: colorFor(key),
            fontSize: Math.round(size * 0.4),
            lineHeight: 1,
            boxShadow: premium ? '0 0 0 2px #f59e0b' : undefined,
          }}
          aria-hidden="true"
        >
          {initials(key)}
        </div>
      )}
      {premium && (
        <span
          className="absolute flex items-center justify-center rounded-full text-white"
          style={{
            right: -3,
            bottom: -3,
            width: badge,
            height: badge,
            fontSize: Math.round(badge * 0.6),
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 0 2px #1f2937',
          }}
          aria-label="Premium"
        >
          ★
        </span>
      )}
    </div>
  )
}
