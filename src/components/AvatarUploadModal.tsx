import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { processAvatar, MAX_UPLOAD_BYTES } from '../lib/avatar-processing'
import { uploadAvatar } from '../lib/profile'

type Props = { open: boolean; onClose: () => void }

// Modal for picking, previewing and uploading a new custom avatar. Also
// supports drag-and-drop onto the picker area. Non-premium gating happens in
// the caller — this component assumes the user has access.
export function AvatarUploadModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Free the object URL when we swap it for another or unmount, so the browser
  // isn't left holding decoded image bytes forever.
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => {
    if (busy) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setProcessedBlob(null)
    setError(null)
    setDragging(false)
    onClose()
  }

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    setError(null)
    setBusy(true)
    const result = await processAvatar(file)
    setBusy(false)
    if (!result.ok) {
      const e = result.error
      const key =
        e.kind === 'too-big' ? 'avatar.err_too_big' :
        e.kind === 'wrong-type' ? 'avatar.err_wrong_type' :
        'avatar.err_decode'
      setError(t(key))
      return
    }
    // Replace any previously-selected preview.
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(result.previewUrl)
    setProcessedBlob(result.blob)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const save = async () => {
    if (!processedBlob) return
    setBusy(true)
    setError(null)
    const res = await uploadAvatar(processedBlob)
    setBusy(false)
    if (res.error) { setError(t('avatar.err_upload')); return }
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    close()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          disabled={busy}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-700/90 hover:bg-gray-600 border border-gray-400/70 text-white text-lg leading-none flex items-center justify-center transition disabled:opacity-50"
        >×</button>

        <h2 className="text-lg font-bold text-white mb-1">🖼️ {t('avatar.title')}</h2>
        <p className="text-xs text-gray-400 mb-4">{t('avatar.subtitle')}</p>

        {/* Drop-zone / picker */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition
            ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-900/40'}
            ${busy ? 'opacity-60 cursor-wait' : ''}
          `}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              width={128}
              height={128}
              style={{ width: 128, height: 128, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="text-4xl">📷</div>
          )}
          <p className="text-sm text-gray-300 text-center">
            {previewUrl ? t('avatar.picked') : t('avatar.drop_or_click')}
          </p>
          <p className="text-[11px] text-gray-500 text-center">
            {t('avatar.limits', { mb: Math.round(MAX_UPLOAD_BYTES / 1024 / 1024) })}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            onClick={close}
            disabled={busy}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition disabled:opacity-50"
          >
            {t('common.close')}
          </button>
          <button
            onClick={save}
            disabled={!processedBlob || busy}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white transition"
          >
            {busy ? t('avatar.saving') : t('avatar.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
