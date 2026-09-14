'use client'

import { useCallback, useSyncExternalStore } from 'react'

const CHANGED = 'teeahead-storage-changed'
function subscribe(notify: () => void) {
  window.addEventListener('storage', notify)
  window.addEventListener(CHANGED, notify)
  return () => {
    window.removeEventListener('storage', notify)
    window.removeEventListener(CHANGED, notify)
  }
}

/** Browser storage is an external store; the server always starts with no value. */
export function useStoredValue(key: string) {
  const snapshot = useCallback(() => {
    try { return window.localStorage.getItem(key) } catch { return null }
  }, [key])
  const value = useSyncExternalStore(subscribe, snapshot, () => null)
  const setValue = useCallback((next: string) => {
    try { window.localStorage.setItem(key, next) } catch { /* Storage may be disabled. */ }
    window.dispatchEvent(new Event(CHANGED))
  }, [key])
  return [value, setValue] as const
}
