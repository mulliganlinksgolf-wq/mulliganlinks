'use client'

import { useState, useTransition } from 'react'
import { upsertPartnerPreferences } from '../actions'
import type { PartnerPreferences, PacePreference, HolePreference, SkillLevel } from '@/types/partners'

export function PreferencesForm({ existing }: { existing: PartnerPreferences | null }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [handicap, setHandicap] = useState(existing?.handicap_index?.toString() ?? '')
  const [pace, setPace] = useState<PacePreference | ''>(existing?.pace_preference ?? '')
  const [walking, setWalking] = useState(existing?.prefers_walking ?? false)
  const [drinksOk, setDrinksOk] = useState(existing?.drinks_ok ?? true)
  const [smokingOk, setSmokingOk] = useState(existing?.smoking_ok ?? false)
  const [holes, setHoles] = useState<HolePreference>(existing?.preferred_holes ?? 'either')
  const [skill, setSkill] = useState<SkillLevel>(existing?.skill_level ?? 'any')
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [visible, setVisible] = useState(existing?.is_visible ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
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
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const paceOptions: PacePreference[] = ['relaxed', 'moderate', 'fast']
  const holeOptions: HolePreference[] = ['9', '18', 'either']
  const skillOptions: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'any']

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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
            <button
              key={p}
              type="button"
              onClick={() => setPace(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                pace === p ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
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
          <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => set(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              value ? 'bg-[#52B788]' : 'bg-white/20'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      ))}

      {/* Holes */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Holes</span>
        <div className="flex gap-2">
          {holeOptions.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setHoles(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                holes === h ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
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
            <button
              key={s}
              type="button"
              onClick={() => setSkill(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                skill === s ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Tell other golfers a bit about your game..."
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
        />
        <p className="text-xs text-[#8FA889] mt-1 text-right">{bio.length} / 280</p>
      </div>

      {/* Visible toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white">Visible in Partner Finder</span>
          <p className="text-xs text-[#8FA889]">Turn off to hide from other members</p>
        </div>
        <input
          id="visible-toggle"
          type="checkbox"
          aria-label="Visible in Partner Finder"
          checked={visible}
          onChange={e => setVisible(e.target.checked)}
          className="w-5 h-5 rounded accent-[#52B788]"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-[#52B788] text-sm">Preferences saved!</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2] disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save Preferences'}
      </button>
    </form>
  )
}
