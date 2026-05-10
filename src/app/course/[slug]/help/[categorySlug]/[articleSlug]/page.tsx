import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { KbMarkdown } from '@/components/course/KbMarkdown'
import { KbHelpfulWidget } from '@/components/course/KbHelpfulWidget'

export default async function CourseArticlePage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string; articleSlug: string }>
}) {
  const { slug, categorySlug, articleSlug } = await params
  const admin = createAdminClient()

  const { data: article } = await admin
    .from('kb_articles')
    .select('*, kb_categories(title, slug)')
    .eq('slug', articleSlug)
    .eq('is_published', true)
    .single()

  if (!article) notFound()

  const category = (article as typeof article & { kb_categories: { title: string; slug: string } | null }).kb_categories

  return (
    <div className="max-w-3xl">
      <nav className="flex items-center gap-2 text-sm text-[#6B7770] mb-6 flex-wrap">
        <Link href={`/course/${slug}/help`} className="hover:text-[#1A1A1A]">Help Center</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/course/${slug}/help/${categorySlug}`} className="hover:text-[#1A1A1A]">
              {category.title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#1A1A1A] font-medium">{article.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{article.title}</h1>
      <p className="text-xs text-[#6B7770] mb-8">
        Last updated{' '}
        {new Date(article.updated_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <KbMarkdown content={article.content} />
      </div>

      <KbHelpfulWidget articleId={article.id} />

      <div className="mt-8">
        <Link href={`/course/${slug}/help/${categorySlug}`} className="text-sm text-[#1B4332] hover:underline">
          ← Back to {category?.title ?? 'category'}
        </Link>
      </div>
    </div>
  )
}
