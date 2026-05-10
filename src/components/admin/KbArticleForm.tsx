'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { KbArticle, KbCategory } from '@/types/knowledge-base'

type ActionState = { error?: string; success?: boolean }
type ActionFn = (prev: ActionState, formData: FormData) => Promise<ActionState>

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface KbArticleFormProps {
  action: ActionFn
  categories: KbCategory[]
  article?: KbArticle
  isEdit?: boolean
}

const initialState: ActionState = {}

export function KbArticleForm({ action, categories, article, isEdit }: KbArticleFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '')
  const [userEditedSlug, setUserEditedSlug] = useState(isEdit ? true : false)

  useEffect(() => {
    if (state.success) router.push('/admin/knowledge-base')
  }, [state.success, router])

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setTitle(val)
    if (!userEditedSlug) setSlug(slugify(val))
  }

  return (
    <form action={formAction} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            name="title"
            type="text"
            required
            value={title}
            onChange={handleTitleChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Slug
            {isEdit && (
              <span className="ml-2 text-xs text-amber-600 font-normal">
                Changing this slug breaks existing links
              </span>
            )}
          </label>
          <input
            name="slug"
            type="text"
            required
            value={slug}
            onChange={e => { setUserEditedSlug(true); setSlug(slugify(e.target.value)) }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            name="category_id"
            defaultValue={article?.category_id ?? ''}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">— Uncategorized —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={article?.sort_order ?? 0}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Excerpt
            <span className="ml-2 text-xs text-slate-400 font-normal">{excerpt.length}/200</span>
          </label>
          <textarea
            name="excerpt"
            rows={2}
            maxLength={200}
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Content <span className="text-xs text-slate-400 font-normal">Markdown supported</span>
          </label>
          <textarea
            name="content"
            defaultValue={article?.content ?? ''}
            rows={16}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            id="is_published"
            value="true"
            defaultChecked={article?.is_published ?? false}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-slate-700">
            Published
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Article'}
        </button>
        <a
          href="/admin/knowledge-base"
          className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
