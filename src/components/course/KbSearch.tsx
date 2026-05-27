'use client'

import { useState, useEffect, useRef } from 'react'
import { searchKbArticles, type KbSearchResult } from '@/app/actions/knowledgeBase'

interface KbSearchProps {
  courseSlug: string
}

export function KbSearch({ courseSlug }: KbSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KbSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      const data = await searchKbArticles(query)
      setResults(data)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search help articles…"
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg divide-y divide-gray-100">
          {results.map(article => {
            const category = article.kb_categories
            const categorySlug = category?.slug ?? 'uncategorized'
            return (
              <li key={article.id}>
                <a
                  href={`/course/${courseSlug}/help/${categorySlug}/${article.slug}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  {category?.title && (
                    <div className="text-xs text-gray-400 mt-0.5">{category.title}</div>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      )}
      {open && results.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-4 py-3 text-sm text-gray-400">
          No articles found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}
