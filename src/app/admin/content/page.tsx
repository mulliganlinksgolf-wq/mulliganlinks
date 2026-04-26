import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Edit Content' }

async function saveBlock(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const key = formData.get('key') as string
  const value = formData.get('value') as string
  await supabase.from('content_blocks').update({ value }).eq('key', key)
  revalidatePath('/')
  revalidatePath('/admin/content')
  redirect('/admin/content?saved=1')
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const supabase = await createClient()
  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('*')
    .order('key')

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Site copy</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          Changes take effect immediately. Each block is saved individually.
        </p>
      </div>

      {saved && (
        <div className="bg-[#1B4332]/10 border border-[#1B4332]/20 rounded-lg px-4 py-3 text-sm text-[#1B4332] font-medium">
          ✓ Saved successfully
        </div>
      )}

      <div className="space-y-6">
        {blocks?.map((block: any) => (
          <form key={block.key} action={saveBlock} className="bg-white rounded-xl ring-1 ring-black/5 p-6 space-y-4">
            <input type="hidden" name="key" value={block.key} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-[#1A1A1A]">{block.key}</label>
                <span className="text-xs text-[#6B7770] bg-[#FAF7F2] px-2 py-0.5 rounded">{block.type}</span>
              </div>
              {block.description && (
                <p className="text-xs text-[#6B7770] mb-2">{block.description}</p>
              )}
              {block.type === 'text' ? (
                <input
                  name="value"
                  type="text"
                  defaultValue={block.value}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              ) : (
                <textarea
                  name="value"
                  rows={4}
                  defaultValue={block.value}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 resize-y"
                />
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
