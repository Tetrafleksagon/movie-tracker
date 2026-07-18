// Compact loading indicator styled as a strip of 35 mm movie film — a dark
// bar with white "sprocket holes" top and bottom, and a blue highlight that
// slides across the frame band. Pure CSS (one keyframe on background-position);
// no JS timer, no SVG, no external animation lib.

import { useTranslation } from 'react-i18next'

// Both the sprocket rows and the sliding highlight are baked into
// `backgroundImage` layers so the whole thing is a single <div>.
const STRIP: React.CSSProperties = {
  width: 240,
  height: 40,
  borderRadius: 4,
  // Layers, top to bottom:
  //   1. Sliding blue highlight (only visible over the middle band).
  //   2. Top sprocket-hole row (white squares on gray).
  //   3. Bottom sprocket-hole row.
  //   4. Dark base for the middle band.
  backgroundImage: [
    'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.55) 45%, rgba(59,130,246,0.9) 50%, rgba(59,130,246,0.55) 55%, transparent 100%)',
    'repeating-linear-gradient(90deg, #e5e7eb 0 6px, transparent 6px 12px)',
    'repeating-linear-gradient(90deg, #e5e7eb 0 6px, transparent 6px 12px)',
    'linear-gradient(#111827, #111827)',
  ].join(','),
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '-100% center, 0 top, 0 bottom, 0 center',
  backgroundSize: '200% 60%, 100% 8px, 100% 8px, 100% 100%',
  animation: 'film-strip-scan 1.6s linear infinite',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
}

const KEYFRAMES = `
@keyframes film-strip-scan {
  0%   { background-position: -100% center, 0 top, 0 bottom, 0 center; }
  100% { background-position: 200% center,  0 top, 0 bottom, 0 center; }
}
`

export function FilmStripLoader({ label }: { label?: string }) {
  const { t } = useTranslation()
  const text = label ?? t('common.loading')

  return (
    // Occupy a viewport-height slice so the strip lands in the visual middle
    // of the content area on any screen (not stuck to the top of a tiny box).
    // 50vh reads as "center of the visible area" once the fixed header is
    // subtracted, without depending on the parent page's own height.
    <div
      className="flex flex-col items-center justify-center gap-3 min-h-[50vh] py-8"
      role="status"
      aria-live="polite"
    >
      <style>{KEYFRAMES}</style>
      {/* Semi-transparent for a subtle, atmospheric feel — the sliding
          highlight still reads clearly against the app's dark background. */}
      <div style={{ ...STRIP, opacity: 0.75 }} className="relative" aria-hidden="true">
        <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 font-medium select-none drop-shadow-sm">
          {text}
        </span>
      </div>
    </div>
  )
}
