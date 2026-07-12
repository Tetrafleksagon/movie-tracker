import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useMyProfile, updateDisplayName, displayNameOf, removeAvatar } from '../lib/profile'
import { useSubscription } from '../lib/subscription'
import { Avatar } from './Avatar'
import { PremiumBadge } from './PremiumBadge'
import { PremiumNotice } from './PremiumNotice'
import { AvatarUploadModal } from './AvatarUploadModal'

export function Profile() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { profile, loading } = useMyProfile()
  const { isPremium, hasFeatures } = useSubscription()
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [nameMsg, setNameMsg] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState<{ text: string; error?: boolean } | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  useEffect(() => {
    if (profile) setName(profile.display_name ?? '')
  }, [profile])

  const saveName = async () => {
    setSavingName(true)
    setNameMsg('')
    const { error } = await updateDisplayName(name)
    setSavingName(false)
    if (error) { setNameMsg('❌ ' + t('profile.error')); return }
    setNameMsg('✓ ' + t('profile.saved'))
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  }

  const deleteAvatar = async () => {
    if (!confirm(t('avatar.confirm_remove'))) return
    setRemovingAvatar(true)
    const res = await removeAvatar()
    setRemovingAvatar(false)
    if ('error' in res && res.error) { alert(t('avatar.err_upload')); return }
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  }

  const savePassword = async () => {
    if (pw1.length < 6) { setPwMsg({ text: t('profile.password_short'), error: true }); return }
    if (pw1 !== pw2) { setPwMsg({ text: t('profile.password_mismatch'), error: true }); return }
    setSavingPw(true)
    setPwMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    setSavingPw(false)
    if (error) { setPwMsg({ text: error.message, error: true }); return }
    setPw1(''); setPw2('')
    setPwMsg({ text: t('profile.password_changed') })
  }

  if (loading) {
    return <p className="text-center text-gray-400 py-16 animate-pulse">{t('common.loading')}</p>
  }

  const shownName = displayNameOf(profile, email)

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-100">{t('profile.title')}</h1>

      {/* Identity */}
      <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
        <Avatar name={shownName} size={64} premium={isPremium} url={profile?.avatar_url} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-semibold text-white truncate">{shownName}</p>
            {isPremium && <PremiumBadge />}
          </div>
          <p className="text-sm text-gray-400 truncate">{email}</p>
        </div>
      </div>

      {/* Avatar */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">{t('avatar.section')}</h2>
        {hasFeatures ? (
          <div className="flex gap-2">
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              {profile?.avatar_url ? t('avatar.change') : t('avatar.upload')}
            </button>
            {profile?.avatar_url && (
              <button
                onClick={deleteAvatar}
                disabled={removingAvatar}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition disabled:opacity-50"
              >
                {t('avatar.remove')}
              </button>
            )}
          </div>
        ) : (
          <PremiumNotice title={t('avatar.locked_title')} desc={t('avatar.locked_desc')} />
        )}
      </section>

      <AvatarUploadModal open={avatarModalOpen} onClose={() => setAvatarModalOpen(false)} />

      {/* Display name */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">{t('profile.display_name')}</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('profile.display_name_placeholder')}
            maxLength={40}
            className="flex-1 min-w-0 py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={saveName}
            disabled={savingName}
            className="px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition"
          >
            {t('profile.save')}
          </button>
        </div>
        {nameMsg && <p className="text-xs text-gray-400">{nameMsg}</p>}
      </section>

      {/* Password */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">{t('profile.password')}</h2>
        <input
          type="password"
          value={pw1}
          onChange={e => setPw1(e.target.value)}
          placeholder={t('profile.password')}
          className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <input
          type="password"
          value={pw2}
          onChange={e => setPw2(e.target.value)}
          placeholder={t('profile.password_confirm')}
          className="w-full py-2 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={savePassword}
          disabled={savingPw || !pw1 || !pw2}
          className="w-full py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 transition"
        >
          {t('profile.password_save')}
        </button>
        {pwMsg && (
          <p className={`text-xs ${pwMsg.error ? 'text-red-400' : 'text-green-400'}`}>{pwMsg.text}</p>
        )}
      </section>
    </main>
  )
}
