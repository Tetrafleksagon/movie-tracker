import { useState } from 'react'

type Props = {
  userId: string
  onClose: () => void
}

export function ShareModal({ userId, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/${userId}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Моя библиотека фильмов — Movie Tracker', url: shareUrl })
    } else {
      copyLink()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white text-center mb-1">Поделиться библиотекой</h2>
        <p className="text-sm text-gray-400 text-center mb-4">
          Скопируй ссылку или поделись в соцсетях
        </p>

        <div className="bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-200 mb-4 break-all select-all cursor-text">
          {shareUrl}
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={copyLink}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? '✓ Скопировано!' : '📋 Копировать'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
          >
            Закрыть
          </button>
        </div>

        <button
          onClick={shareNative}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
        >
          ✈️ Поделиться
        </button>
      </div>
    </div>
  )
}
