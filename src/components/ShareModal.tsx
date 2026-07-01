import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useMyProfile, displayNameOf } from '../lib/profile'
import { useSubscription } from '../lib/subscription'
import { Avatar } from './Avatar'
import { PremiumBadge } from './PremiumBadge'

type Props = {
  userId: string
  onClose: () => void
}

export function ShareModal({ userId, onClose }: Props) {
  const { t } = useTranslation()
  const { profile } = useMyProfile()
  const { isPremium } = useSubscription()
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/${userId}`
  const shownName = displayNameOf(profile, email)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: t('share.title'), url: shareUrl })
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
        <h2 className="text-lg font-bold text-white text-center mb-1">{t('share.title')}</h2>
        <p className="text-sm text-gray-400 text-center mb-4">{t('share.description')}</p>

        {/* Identity preview — how the shared page is presented */}
        <div className="flex items-center gap-3 bg-gray-700/40 border border-gray-700 rounded-lg p-3 mb-4">
          <Avatar name={shownName} size={40} premium={isPremium} />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate flex items-center gap-2">
              {shownName}
              {isPremium && <PremiumBadge />}
            </p>
            <p className="text-xs text-gray-500 truncate">{t('public_library.title_named', { name: shownName })}</p>
          </div>
        </div>

        <div className="bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-200 mb-4 break-all select-all cursor-text">
          {shareUrl}
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={copyLink}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? t('share.copied') : t('share.copy')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
          >
            {t('share.close')}
          </button>
        </div>

        <button
          onClick={shareNative}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
        >
          {t('share.share')}
        </button>
      </div>
    </div>
  )
}
