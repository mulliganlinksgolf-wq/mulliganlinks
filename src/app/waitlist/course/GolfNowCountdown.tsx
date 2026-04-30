'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GolfNowCountdownProps {
  expiryDate: string
  onExpiryChange: (value: string) => void
}

export function GolfNowCountdown({ expiryDate, onExpiryChange }: GolfNowCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number
  } | null>(null)

  useEffect(() => {
    if (!expiryDate) { setTimeLeft(null); return }
    const target = new Date(expiryDate + 'T00:00:00').getTime()
    function tick() {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiryDate])

  return (
    <div className="max-w-3xl mx-auto text-center space-y-6">
      <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">GolfNow Contract Expiry Countdown</p>
      <h2 className="font-display font-black text-[#0F3D2E] text-2xl">How long until you can switch?</h2>
      <div className="max-w-xs mx-auto space-y-1.5 text-left">
        <Label htmlFor="golfnow_expiry_preview">Your GolfNow contract expiry date</Label>
        <Input
          id="golfnow_expiry_preview"
          type="date"
          value={expiryDate}
          onChange={e => onExpiryChange(e.target.value)}
        />
      </div>
      {timeLeft ? (
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#0F3D2E] rounded-xl p-4 text-center">
              <p className="font-display font-black text-[#F4F1EA] text-3xl leading-none">{String(value).padStart(2, '0')}</p>
              <p className="text-xs text-[#F4F1EA]/60 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto opacity-30">
          {['Days', 'Hours', 'Minutes', 'Seconds'].map(label => (
            <div key={label} className="bg-[#0F3D2E] rounded-xl p-4 text-center">
              <p className="font-display font-black text-[#F4F1EA] text-3xl leading-none">--</p>
              <p className="text-xs text-[#F4F1EA]/60 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-[#6B7770]">We&apos;ll remind you at 6 months, 3 months, 1 month &amp; more…</p>
    </div>
  )
}
