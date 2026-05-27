import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { KbArticleForm } from '@/components/admin/KbArticleForm'
import { createKbArticle } from '@/app/actions/knowledgeBase'

export const metadata = { title: 'New Article' }

export default async function NewKbArticlePage() {
  const admin = createAdminClient()
  const { data: categories } = await admin
    .from('kb_categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/knowledge-base" className="text-sm text-slate-500 hover:text-slate-800">
          ← Knowledge Base
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-2">New Article</h1>
      </div>
      <KbArticleForm action={createKbArticle} categories={categories ?? []} />
    </div>
  )
}
