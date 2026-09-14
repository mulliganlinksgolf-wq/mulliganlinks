'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeMotion(notify: () => void) {
  const media = window.matchMedia(motionQuery)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function useAnimatedNumber(target: number) {
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false)
  const [displayed, setDisplayed] = useState(target)
  const latest = useRef(target)
  useEffect(() => {
    if (reduced) { latest.current = target; return }
    const start = latest.current
    const startedAt = performance.now()
    let frame: number
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 600, 1)
      latest.current = Math.round(start + (target - start) * (1 - Math.pow(1 - progress, 3)))
      setDisplayed(latest.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, reduced])
  return reduced ? target : displayed
}
