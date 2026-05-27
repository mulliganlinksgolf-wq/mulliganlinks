import '@testing-library/jest-dom'

// jsdom doesn't ship IntersectionObserver; stub it so components using FadeIn
// (or any scroll-reveal pattern) can render in tests.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  root = null
  rootMargin = ''
  thresholds: number[] = []
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IntersectionObserver = MockIntersectionObserver
}

// Node 25 ships an experimental built-in `localStorage`/`sessionStorage` on
// the global, which shadows jsdom's Storage implementation inside the vitest
// jsdom environment. The result is `window.localStorage` exists but has no
// Storage methods (`setItem`, `getItem`, `clear`, etc.). Patch in a minimal
// in-memory Storage so tests can rely on the standard API.
function createMemoryStorage(): Storage {
  let store = new Map<string, string>()
  return {
    get length() { return store.size },
    clear() { store = new Map() },
    getItem(key: string) { return store.has(key) ? (store.get(key) as string) : null },
    key(index: number) { return Array.from(store.keys())[index] ?? null },
    removeItem(key: string) { store.delete(key) },
    setItem(key: string, value: string) { store.set(key, String(value)) },
  }
}
if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.setItem !== 'function')) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  })
}
if (typeof window !== 'undefined' && (!window.sessionStorage || typeof window.sessionStorage.setItem !== 'function')) {
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: createMemoryStorage(),
  })
}
