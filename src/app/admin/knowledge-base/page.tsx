import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { DeleteArticleButton } from '@/components/admin/DeleteArticleButton'
import type { KbArticle, KbCategory } from '@/types/knowledge-base'

type ArticleRow = KbArticle & { kb_categories: { title: string } | null }

export const metadata = { title: 'Knowledge Base' }

export default async function AdminKnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'articles' } = await searchParams
  const admin = createAdminClient()

  const [{ data: rawArticles }, { data: categories }] = await Promise.all([
    admin
      .from('kb_articles')
      .select('*, kb_categories(title)')
      .order('updated_at', { ascending: false }),
    admin
      .from('kb_categories')
      .select('*')
      .order('sort_order'),
  ])

  const articles = (rawArticles ?? []) as ArticleRow[]

  const countMap: Record<string, number> = {}
  for (const a of articles) {
    if (a.category_id) {
      countMap[a.category_id] = (countMap[a.category_id] ?? 0) + 1
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
        {tab === 'articles' && (
          <Link
            href="/admin/knowledge-base/new"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            New Article
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-200 mb-6">
        {(['articles', 'categories'] as const).map(t => (
          <Link
            key={t}
            href={`/admin/knowledge-base?tab=${t}`}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${
              tab === t
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === 'articles' && (
        <ArticlesTable articles={articles} />
      )}
      {tab === 'categories' && (
        <CategoriesTable
          categories={(categories ?? []) as KbCategory[]}
          countMap={countMap}
        />
      )}
    </div>
  )
}

function ArticlesTable({ articles }: { articles: ArticleRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {articles.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No articles yet</td>
            </tr>
          )}
          {articles.map(a => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{a.title}</td>
              <td className="px-4 py-3 text-slate-500">{a.kb_categories?.title ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  a.is_published
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {a.is_published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {new Date(a.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3 justify-end">
                  <Link href={`/admin/knowledge-base/${a.id}/edit`} className="text-emerald-700 hover:underline text-sm">Edit</Link>
                  <DeleteArticleButton articleId={a.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoriesTable({ categories, countMap }: { categories: KbCategory[]; countMap: Record<string, number> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Articles</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Sort</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No categories yet</td>
            </tr>
          )}
          {categories.map(cat => (
            <tr key={cat.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{cat.title}</td>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">{cat.slug}</td>
              <td className="px-4 py-3 text-slate-500">{countMap[cat.id] ?? 0}</td>
              <td className="px-4 py-3 text-slate-400">{cat.sort_order}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
        To edit or delete categories, use the Supabase dashboard or add an edit form in a future iteration.
      </div>
    </div>
  )
}
