'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { upsertPartnerPreferences, uploadAvatar } from '../actions'
import type {
  PartnerPreferences, PacePreference, HolePreference, SkillLevel,
  PlayStyle, Gender, OpenTo,
} from '@/types/partners'

function AvatarSection({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string | null
  onUploaded: () => void
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, startUpload] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    const fd = new FormData()
    fd.append('avatar', file)
    startUpload(async () => {
      const result = await uploadAvatar(fd)
      if (result.error) { setErr(result.error); setPreview(currentUrl) }
      else { onUploaded() }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[#8FA889] text-2xl">
              👤
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs">…</span>
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
          >
            {preview ? 'Change photo' : 'Upload photo'}
            <span className="text-red-400 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFile}
          />
          <p className="text-xs text-[#8FA889] mt-1">
            Required · JPEG, PNG or WebP · max 5 MB
          </p>
          {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
        </div>
      </div>
    </div>
  )
}

export function PreferencesForm({
  existing,
  avatarUrl,
}: {
  existing: PartnerPreferences | null
  avatarUrl: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAvatar, setHasAvatar] = useState(!!avatarUrl)

  const [handicap, setHandicap] = useState(existing?.handicap_index?.toString() ?? '')
  const [pace, setPace] = useState<PacePreference | ''>(existing?.pace_preference ?? '')
  const [walking, setWalking] = useState(existing?.prefers_walking ?? false)
  const [drinksOk, setDrinksOk] = useState(existing?.drinks_ok ?? true)
  const [smokingOk, setSmokingOk] = useState(existing?.smoking_ok ?? false)
  const [holes, setHoles] = useState<HolePreference>(existing?.preferred_holes ?? 'either')
  const [skill, setSkill] = useState<SkillLevel>(existing?.skill_level ?? 'any')
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [visible, setVisible] = useState(existing?.is_visible ?? true)
  const [playStyle, setPlayStyle] = useState<PlayStyle>(existing?.play_style ?? 'casual')
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'prefer_not_to_say')
  const [openTo, setOpenTo] = useState<OpenTo>(existing?.open_to ?? 'anyone')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (!hasAvatar) {
      setError('Please upload a profile photo before saving.')
      return
    }
    startTransition(async () => {
      const result = await upsertPartnerPreferences({
        handicap_index: handicap ? parseFloat(handicap) : null,
        pace_preference: pace || null,
        prefers_walking: walking,
        drinks_ok: drinksOk,
        smoking_ok: smokingOk,
        preferred_holes: holes,
        skill_level: skill,
        bio: bio || null,
        is_visible: visible,
        play_style: playStyle,
        gender,
        open_to: openTo,
      })
      if (result.error) { setError(result.error) } else { setSaved(true) }
    })
  }

  const paceOptions: PacePreference[] = ['relaxed', 'moderate', 'fast']
  const holeOptions: HolePreference[] = ['9', '18', 'either']
  const skillOptions: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'any']
  const playStyleOptions: { value: PlayStyle; label: string }[] = [
    { value: 'casual', label: 'Casual' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'competitive', label: 'Competitive' },
  ]
  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]
  const openToOptions: { value: OpenTo; label: string; desc: string }[] = [
    { value: 'anyone', label: 'Anyone', desc: 'Open to playing with anyone' },
    { value: 'same_gender_only', label: 'Same gender only', desc: 'Only show me to members with my gender' },
    { value: 'men_only', label: 'Men only', desc: "Only show me men's availability" },
    { value: 'women_only', label: 'Women only', desc: "Only show me women's availability" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">

      {/* Photo */}
      <AvatarSection currentUrl={avatarUrl} onUploaded={() => setHasAvatar(true)} />

      {/* Play style */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Play Style</span>
        <div className="flex gap-2 flex-wrap">
          {playStyleOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPlayStyle(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                playStyle === value ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8FA889] mt-1">
          {playStyle === 'casual' ? 'Here to have fun and enjoy the round.' : playStyle === 'moderate' ? 'Enjoy the game and play well.' : 'Focused on score and performance.'}
        </p>
      </div>

      {/* Gender */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">I identify as</span>
        <div className="flex flex-wrap gap-2">
          {genderOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGender(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                gender === value ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Open to */}
      <div>
        <span className="block text-sm font-medium text-white mb-1">I want to play with</span>
        <p className="text-xs text-[#8FA889] mb-2">Controls both who you see and who sees you.</p>
        <div className="space-y-2">
          {openToOptions.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOpenTo(value)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                openTo === value
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/10 text-[#8FA889] hover:bg-white/5'
              }`}
            >
              <span className="font-medium">{label}</span>
              <span className="block text-xs opacity-70 mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Handicap */}
      <div>
        <label htmlFor="handicap" className="block text-sm font-medium text-white mb-1">
          Handicap Index
        </label>
        <input
          id="handicap"
          type="number"
          min={0}
          max={54}
          step={0.1}
          value={handicap}
          onChange={e => setHandicap(e.target.value)}
          placeholder="e.g. 14.2"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889]"
        />
      </div>

      {/* Pace */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Pace</span>
        <div className="flex gap-2">
          {paceOptions.map(p => (
            <button key={p} type="button" onClick={() => setPace(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${pace === p ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      {[
        { label: 'Prefer to walk', value: walking, set: setWalking },
        { label: 'Drinks OK', value: drinksOk, set: setDrinksOk },
        { label: 'Smoking OK', value: smokingOk, set: setSmokingOk },
      ].map(({ label, value, set }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{label}</span>
          <button type="button" role="switch" aria-checked={value} onClick={() => set(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#52B788]' : 'bg-white/20'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      ))}

      {/* Holes */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Holes</span>
        <div className="flex gap-2">
          {holeOptions.map(h => (
            <button key={h} type="button" onClick={() => setHoles(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${holes === h ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'}`}>
              {h === 'either' ? 'Either' : `${h} holes`}
            </button>
          ))}
        </div>
      </div>

      {/* Skill */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Skill Level</span>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map(s => (
            <button key={s} type="button" onClick={() => setSkill(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${skill === s ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white mb-1">Bio</label>
        <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={280} rows={3}
          placeholder="Tell other golfers a bit about your game..."
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none" />
        <p className="text-xs text-[#8FA889] mt-1 text-right">{bio.length} / 280</p>
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white">Visible in Partner Finder</span>
          <p className="text-xs text-[#8FA889]">Turn off to hide from other members</p>
        </div>
        <input id="visible-toggle" type="checkbox" aria-label="Visible in Partner Finder"
          checked={visible} onChange={e => setVisible(e.target.checked)}
          className="w-5 h-5 rounded accent-[#52B788]" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {saved ? (
        <div className="space-y-3">
          <p className="text-[#52B788] text-sm">Preferences saved!</p>
          <Link
            href="/app/partners"
            className="block w-full text-center bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2]"
          >
            ← Back to Find a Partner
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="block w-full text-center text-[#8FA889] hover:text-white text-sm py-2"
          >
            Save again
          </button>
        </div>
      ) : (
        <button type="submit" disabled={isPending}
          className="w-full bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2] disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save Preferences'}
        </button>
      )}
    </form>
  )
}
