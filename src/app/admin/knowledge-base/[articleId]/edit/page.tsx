import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { KbArticleForm } from '@/components/admin/KbArticleForm'
import { updateKbArticle } from '@/app/actions/knowledgeBase'

export const metadata = { title: 'Edit Article' }

export default async function EditKbArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>
}) {
  const { articleId } = await params
  const admin = createAdminClient()

  const [{ data: article }, { data: categories }] = await Promise.all([
    admin.from('kb_articles').select('*').eq('id', articleId).single(),
    admin.from('kb_categories').select('*').order('sort_order'),
  ])

  if (!article) notFound()

  async function boundUpdate(
    prev: { error?: string; success?: boolean },
    formData: FormData
  ) {
    'use server'
    return updateKbArticle(prev, { id: articleId, formData })
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/knowledge-base" className="text-sm text-slate-500 hover:text-slate-800">
          ← Knowledge Base
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-2">Edit Article</h1>
      </div>
      <KbArticleForm
        action={boundUpdate}
        categories={categories ?? []}
        article={article}
        isEdit
      />
    </div>
  )
}
