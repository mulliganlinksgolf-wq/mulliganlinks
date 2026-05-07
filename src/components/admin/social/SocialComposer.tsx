'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import type { BufferChannel } from '@/lib/buffer'
import { schedulePost, saveIdea } from '@/app/admin/social/actions'

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter'

type CaptionData = {
  caption: string
  bestTime: string
  growthNote: string
}

type Props = {
  channels: BufferChannel[]
  fillSaturdaySlot: boolean
  onFillHandled: () => void
  onToast: (msg: string) => void
}

const PILLARS = [
  { value: 'Education/Outrage (35%)', label: 'Education/Outrage', pct: '35%' },
  { value: 'Detroit Pride (25%)', label: 'Detroit Pride', pct: '25%' },
  { value: 'FOMO/Social Proof (25%)', label: 'FOMO/Social Proof', pct: '25%' },
  { value: 'Direct Conversion (15%)', label: 'Direct Conversion', pct: '15%' },
]

const PLATFORM_BADGES: Record<Platform, string> = {
  instagram: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white',
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-black text-white',
}

function getNextSaturday8am(): Date {
  const now = new Date()
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  sat.setHours(8, 0, 0, 0)
  return sat
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SocialComposer({ channels, fillSaturdaySlot, onFillHandled, onToast }: Props) {
  const composerRef = useRef<HTMLDivElement>(null)

  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState<'Course Operators' | 'Golfers'>('Course Operators')
  const [pillar, setPillar] = useState(PILLARS[0].value)
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(['instagram', 'facebook']))
  const [activeTab, setActiveTab] = useState<Platform>('instagram')
  const [captions, setCaptions] = useState<Partial<Record<Platform, CaptionData>>>({})
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageFilename, setImageFilename] = useState<string>('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'queue' | 'custom'>('queue')
  const [scheduledAt, setScheduledAt] = useState(toLocalDatetimeValue(getNextSaturday8am()))
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [isScheduling, startScheduling] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fill Saturday slot when triggered from queue panel
  useEffect(() => {
    if (fillSaturdaySlot) {
      setScheduleMode('custom')
      setScheduledAt(toLocalDatetimeValue(getNextSaturday8am()))
      composerRef.current?.scrollIntoView({ behavior: 'smooth' })
      onFillHandled()
    }
  }, [fillSaturdaySlot, onFillHandled])

  // Default selected channels to match checked platforms
  useEffect(() => {
    const matching = channels
      .filter(ch => platforms.has(ch.service as Platform))
      .map(ch => ch.id)
    setSelectedChannelIds(matching)
  }, [platforms, channels])

  function togglePlatform(p: Platform) {
    setPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(p)) {
        next.delete(p)
      } else {
        next.add(p)
        setActiveTab(p)
      }
      return next
    })
  }

  function updateCaption(platform: Platform, text: string) {
    setCaptions(prev => ({
      ...prev,
      [platform]: { ...prev[platform]!, caption: text },
    }))
  }

  async function handleGenerateCaptions() {
    if (!topic.trim()) return
    setGenerating(true)
    setCaptionError(null)
    try {
      const res = await fetch('/api/social/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          pillar,
          platforms: Array.from(platforms),
          audience,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setCaptionError('Caption generation failed — write it manually')
      } else {
        setCaptions(data.captions)
      }
    } catch {
      setCaptionError('Caption generation failed — write it manually')
    } finally {
      setGenerating(false)
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)

    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch('/api/social/upload-image', { method: 'POST', body: fd })
    const data = await res.json()

    if (data.error) {
      setImageError(data.error)
    } else {
      setImageDataUrl(data.dataUrl)
      setImageFilename(data.filename)
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSchedulePost() {
    const activePlatform = activeTab
    const text = captions[activePlatform]?.caption ?? ''
    if (!text.trim() || selectedChannelIds.length === 0) return

    const fd = new FormData()
    fd.append('text', text)
    fd.append('channelIds', JSON.stringify(selectedChannelIds))
    fd.append('mode', scheduleMode === 'custom' ? 'customScheduled' : 'addToQueue')
    if (scheduleMode === 'custom' && scheduledAt) {
      fd.append('dueAt', new Date(scheduledAt).toISOString())
    }

    startScheduling(async () => {
      const result = await schedulePost(fd)
      if (result.success) {
        const msg =
          scheduleMode === 'custom'
            ? `Scheduled for ${new Date(scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ✓`
            : 'Added to queue ✓'
        onToast(msg)
      } else {
        onToast(result.error ?? 'Scheduling failed')
      }
    })
  }

  function handleSaveAsIdea() {
    const text = captions[activeTab]?.caption ?? ''
    if (!text.trim()) return
    const fd = new FormData()
    fd.append('title', topic.slice(0, 80))
    fd.append('text', text)
    startScheduling(async () => {
      const result = await saveIdea(fd)
      onToast(result.success ? 'Idea saved to Buffer backlog ✓' : (result.error ?? 'Failed to save idea'))
    })
  }

  const activePlatforms = (Object.keys(PLATFORM_BADGES) as Platform[]).filter(p => platforms.has(p))

  return (
    <div ref={composerRef} className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-5">
      <h2 className="font-bold text-[#1A1A1A]">Compose Post</h2>

      {/* Topic */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1A1A1A]">What&apos;s this post about?</label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Fox Hills just signed as a Founding Partner"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
      </div>

      {/* Audience */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1A1A1A]">Audience</label>
        <div className="flex rounded-lg border border-black/15 overflow-hidden text-sm">
          {(['Course Operators', 'Golfers'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`flex-1 py-1.5 text-center transition-colors ${
                audience === a
                  ? 'bg-[#1B4332] text-white font-medium'
                  : 'text-[#6B7770] hover:bg-[#FAF7F2]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A1A1A]">Content Pillar</label>
        <div className="space-y-1.5">
          {PILLARS.map(p => (
            <label key={p.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pillar"
                value={p.value}
                checked={pillar === p.value}
                onChange={() => setPillar(p.value)}
                className="text-[#1B4332]"
              />
              <span className="text-sm text-[#1A1A1A]">{p.label}</span>
              <span className="text-xs text-[#6B7770]">{p.pct}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A1A1A]">Post to</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(PLATFORM_BADGES) as [Platform, string][]).map(([p, style]) => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                platforms.has(p)
                  ? `${style} border-transparent`
                  : 'border-black/15 text-[#6B7770] hover:border-black/30'
              }`}
            >
              {platforms.has(p) ? '✓ ' : ''}{p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Caption tabs */}
      {activePlatforms.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-1 border-b border-black/10">
            {activePlatforms.map(p => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
                  activeTab === p
                    ? 'border-b-2 border-[#1B4332] text-[#1B4332]'
                    : 'text-[#6B7770] hover:text-[#1A1A1A]'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          {activePlatforms.includes(activeTab) && (
            <div className="space-y-1">
              <textarea
                rows={5}
                value={captions[activeTab]?.caption ?? ''}
                onChange={e => updateCaption(activeTab, e.target.value)}
                placeholder={`Write your ${activeTab} caption here, or generate one below...`}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {captions[activeTab]?.bestTime && (
                <p className="text-xs text-[#6B7770]">
                  Best time: {captions[activeTab]!.bestTime}
                </p>
              )}
              {captions[activeTab]?.growthNote && (
                <p className="text-xs text-[#6B7770] italic">
                  {captions[activeTab]!.growthNote}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generate captions */}
      <div className="space-y-1">
        <button
          onClick={handleGenerateCaptions}
          disabled={!topic.trim() || generating}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B4332]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            '✨ Generate Captions'
          )}
        </button>
        {captionError && (
          <p className="text-xs text-[#6B7770]">{captionError}</p>
        )}
      </div>

      {/* Image attachment */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1A1A1A]">Image (optional)</label>
        {imageDataUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt={imageFilename} className="h-24 w-24 rounded-lg object-cover border border-black/10" />
            <button
              onClick={() => setImageDataUrl(null)}
              className="absolute -top-1.5 -right-1.5 bg-white border border-black/15 rounded-full w-5 h-5 text-xs text-[#6B7770] hover:text-[#1A1A1A] flex items-center justify-center shadow"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-black/15 rounded-lg p-4 text-center cursor-pointer hover:border-[#1B4332]/40 transition-colors"
          >
            <p className="text-sm text-[#6B7770]">
              Drag &amp; drop or{' '}
              <span className="text-[#1B4332] font-medium">Browse</span>
            </p>
            <p className="text-xs text-[#6B7770] mt-0.5">JPEG, PNG, WebP · max 5MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageSelect}
        />
        {imageError && <p className="text-xs text-red-600">{imageError}</p>}
        <div className="space-y-1">
          <a
            href="https://canva.com/create/social-media"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[#1B4332] hover:underline"
          >
            Open Canva →
          </a>
          <p className="text-xs text-[#6B7770]">Design in Canva, download, then upload here</p>
          <a
            href="https://www.canva.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[#1B4332] hover:underline"
          >
            Browse your Canva designs →
          </a>
        </div>
        <p className="text-xs text-[#6B7770]">
          📌 Image preview only — image hosting required to attach images to Buffer posts. Coming in a future update.
        </p>
      </div>

      {/* Schedule controls */}
      <div className="space-y-2">
        <div className="flex rounded-lg border border-black/15 overflow-hidden text-sm">
          {(['queue', 'custom'] as const).map(m => (
            <button
              key={m}
              onClick={() => setScheduleMode(m)}
              className={`flex-1 py-1.5 text-center transition-colors ${
                scheduleMode === m
                  ? 'bg-[#1B4332] text-white font-medium'
                  : 'text-[#6B7770] hover:bg-[#FAF7F2]'
              }`}
            >
              {m === 'queue' ? 'Add to queue' : 'Schedule for specific time'}
            </button>
          ))}
        </div>

        {scheduleMode === 'custom' && (
          <div className="space-y-1">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
            <p className="text-xs text-[#6B7770]">💡 Saturday 8am is your highest-value Instagram slot</p>
          </div>
        )}

        {/* Channel selector */}
        {channels.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770]">Channels</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {channels.map(ch => (
                <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannelIds.includes(ch.id)}
                    onChange={e => {
                      setSelectedChannelIds(prev =>
                        e.target.checked ? [...prev, ch.id] : prev.filter(id => id !== ch.id)
                      )
                    }}
                    className="text-[#1B4332]"
                  />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${PLATFORM_BADGES[ch.service as Platform] ?? 'bg-gray-200 text-gray-800'}`}
                  >
                    {ch.service}
                  </span>
                  <span className="text-sm text-[#1A1A1A]">{ch.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSchedulePost}
          disabled={isScheduling || selectedChannelIds.length === 0 || !captions[activeTab]?.caption}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B4332]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScheduling ? 'Scheduling...' : 'Schedule Post'}
        </button>
        <button
          onClick={handleSaveAsIdea}
          disabled={isScheduling || !captions[activeTab]?.caption}
          className="w-full text-sm text-[#1B4332] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save as Idea instead →
        </button>
      </div>
    </div>
  )
}
