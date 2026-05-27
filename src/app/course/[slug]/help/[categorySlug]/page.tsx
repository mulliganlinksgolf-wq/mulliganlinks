import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { KbArticle } from '@/types/knowledge-base'

export default async function CourseCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>
}) {
  const { slug, categorySlug } = await params
  const admin = createAdminClient()

  const { data: category } = await admin
    .from('kb_categories')
    .select('*')
    .eq('slug', categorySlug)
    .single()

  if (!category) notFound()

  const { data: articles } = await admin
    .from('kb_articles')
    .select('id, title, slug, excerpt, updated_at')
    .eq('category_id', category.id)
    .eq('is_published', true)
    .order('sort_order')

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-[#6B7770] mb-6">
        <Link href={`/course/${slug}/help`} className="hover:text-[#1A1A1A]">Help Center</Link>
        <span>/</span>
        <span className="text-[#1A1A1A] font-medium">{category.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{category.title}</h1>
      {category.description && (
        <p className="text-sm text-[#6B7770] mb-8">{category.description}</p>
      )}

      {(articles ?? []).length === 0 ? (
        <p className="text-[#6B7770] text-sm">No articles in this category yet.</p>
      ) : (
        <ul className="space-y-3">
          {(articles ?? []).map((article: Pick<KbArticle, 'id' | 'title' | 'slug' | 'excerpt' | 'updated_at'>) => (
            <li key={article.id}>
              <Link
                href={`/course/${slug}/help/${categorySlug}/${article.slug}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-[#1B4332] hover:shadow-sm transition-all"
              >
                <div className="font-medium text-[#1A1A1A]">{article.title}</div>
                {article.excerpt && (
                  <div className="text-sm text-[#6B7770] mt-1">{article.excerpt}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Updated {new Date(article.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link href={`/course/${slug}/help`} className="text-sm text-[#1B4332] hover:underline">
          ← Back to Help Center
        </Link>
      </div>
    </div>
  )
}
