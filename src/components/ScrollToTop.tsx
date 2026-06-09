import { useState, useEffect } from 'react'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const toggle = () => window.pageYOffset > 100 ? setIsVisible(true) : setIsVisible(false)
    window.addEventListener('scroll', toggle)
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  if (!isVisible) return null
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition">
      ↑
    </button>
  )
}