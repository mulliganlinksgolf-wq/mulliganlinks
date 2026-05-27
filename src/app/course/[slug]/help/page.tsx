import { createAdminClient } from '@/lib/supabase/admin'
import { KbSearch } from '@/components/course/KbSearch'
import type { KbCategory } from '@/types/knowledge-base'

export const metadata = { title: 'Help Center' }

export default async function CourseHelpPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: categories } = await admin
    .from('kb_categories')
    .select('*')
    .order('sort_order')

  const { data: counts } = await admin
    .from('kb_articles')
    .select('category_id')
    .eq('is_published', true)

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    if (row.category_id) countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
  }

  const totalPublished = Object.values(countMap).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Help Center</h1>
        <p className="mt-1 text-sm text-[#6B7770]">
          Best practices and how-to guides for your TeeAhead dashboard
        </p>
      </div>

      <div className="mb-8">
        <KbSearch courseSlug={slug} />
      </div>

      {totalPublished === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-8 py-16 text-center">
          <p className="text-gray-500">We&apos;re building out the help center — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(categories ?? []).map((cat: KbCategory) => {
            const articleCount = countMap[cat.id] ?? 0
            if (articleCount === 0) return null
            return (
              <a
                key={cat.id}
                href={`/course/${slug}/help/${cat.slug}`}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 hover:border-[#1B4332] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <h2 className="font-semibold text-[#1A1A1A]">{cat.title}</h2>
                </div>
                {cat.description && (
                  <p className="text-sm text-[#6B7770] leading-relaxed">{cat.description}</p>
                )}
                <p className="text-xs text-[#6B7770] mt-auto pt-2 border-t border-gray-100">
                  {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                </p>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
