// Single source of truth for media statuses, their colors, icons and the
// personal-rating palette — previously duplicated across Search, MovieModal,
// MediaCard, SharedLibrary and Stats.

export type MediaStatus = 'planned' | 'watching' | 'watched' | 'dropped'

export type StatusHistory = { status: MediaStatus | string; time: string }[]

// Ordered for display in <select> menus.
export const STATUS_OPTIONS: { value: MediaStatus; icon: string }[] = [
  { value: 'planned', icon: '📋' },
  { value: 'watching', icon: '👀' },
  { value: 'watched', icon: '✅' },
  { value: 'dropped', icon: '❌' },
]

const STATUS_COLORS: Record<string, string> = {
  planned: '#4b5563',
  watching: '#2563eb',
  watched: '#16a34a',
  dropped: '#dc2626',
}

// Falls back to a neutral gray for empty / unknown status.
export function getStatusColor(status: string | null | undefined): string {
  return (status && STATUS_COLORS[status]) || '#374151'
}

export function getStatusIcon(status: string): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.icon || ''
}

// Personal rating 1–10 → color scale (red → amber → green).
export const RATING_COLORS: Record<number, string> = {
  1: '#7f1d1d', 2: '#991b1b', 3: '#b91c1c',
  4: '#92400e', 5: '#b45309', 6: '#d97706',
  7: '#166534', 8: '#15803d', 9: '#16a34a', 10: '#22c55e',
}
