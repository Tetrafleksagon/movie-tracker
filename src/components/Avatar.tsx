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

// Generated initials avatar — a colored circle derived deterministically from
// the name. (avatar_url image upload is a future enhancement.)
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const key = name || '?'
  return (
    <div
      className="flex items-center justify-center font-semibold text-white select-none flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: colorFor(key),
        fontSize: Math.round(size * 0.4),
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {initials(key)}
    </div>
  )
}
