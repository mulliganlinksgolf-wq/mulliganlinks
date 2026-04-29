import { createAdminClient } from '@/lib/supabase/admin'
import { saveBlock } from '@/app/admin/content/actions'
import AddContentBlockModal from '@/components/admin/AddContentBlockModal'
import Link from 'next/link'

export const metadata = { title: 'Content' }

const PAGE_GROUPS = [
  // Marketing
  { key: 'home', label: 'Homepage', path: '/', category: 'Marketing' },
  { key: 'pricing', label: 'Pricing / Tiers', path: '/pricing', category: 'Marketing' },
  { key: 'golfnow', label: 'GolfNow Alternative', path: '/golfnow-alternative', category: 'Marketing' },
  { key: 'barter', label: 'How Barter Works', path: '/how-barter-works', category: 'Marketing' },
  { key: 'software_cost', label: 'Software Cost', path: '/software-cost', category: 'Marketing' },
  // Waitlist
  { key: 'waitlist', label: 'Golfer Signup', path: '/waitlist', category: 'Waitlist' },
  { key: 'waitlist_course', label: 'Course Signup', path: '/waitlist/course', category: 'Waitlist' },
  // Site-wide
  { key: 'nav', label: 'Nav & Footer', path: null, category: 'Site-wide' },
  { key: 'contact', label: 'Contact Info', path: null, category: 'Site-wide' },
  // Legal
  { key: 'legal', label: 'Privacy / Terms', path: '/privacy-policy', category: 'Legal' },
]

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; saved?: string }>
}) {
  const { group = 'home', saved } = await searchParams
  const activeGroup = PAGE_GROUPS.find(g => g.key === group) ?? PAGE_GROUPS[0]

  const admin = createAdminClient()
  const { data: blocks } = await admin
    .from('content_blocks')
    .select('*')
    .ilike('key', `${activeGroup.key}.%`)
    .order('key')

  return (
    <div className="flex gap-6 min-h-[60vh]">
      {/* Sidebar */}
      <nav className="w-48 shrink-0 space-y-4">
        {(['Marketing', 'Waitlist', 'Site-wide', 'Legal'] as const).map(cat => (
          <div key={cat}>
            <p className="text-[10px] font-semibold text-[#6B7770] uppercase tracking-widest px-3 mb-1">{cat}</p>
            {PAGE_GROUPS.filter(g => g.category === cat).map(g => (
              <Link
                key={g.key}
                href={`/admin/content?group=${g.key}`}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  g.key === activeGroup.key
                    ? 'bg-[#1B4332] text-white'
                    : 'text-[#6B7770] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Content panel */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">{activeGroup.label}</h1>
            {activeGroup.path && (
              <a
                href={activeGroup.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6B7770] hover:text-[#1B4332]"
              >
                View live page ↗
              </a>
            )}
          </div>
          {saved && (
            <span className="text-sm text-emerald-700 font-medium bg-emerald-50 rounded-lg px-3 py-1.5">✓ Saved</span>
          )}
        </div>

        {(blocks ?? []).length === 0 && (
          <p className="text-sm text-[#6B7770]">No content blocks for this page yet. Add one below.</p>
        )}

        <div className="space-y-4">
          {(blocks ?? []).map((block: any) => (
            <form key={block.key} action={saveBlock} className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
              <input type="hidden" name="key" value={block.key} />
              <input type="hidden" name="group" value={activeGroup.key} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{block.description || block.key}</p>
                  <p className="text-xs text-[#6B7770] font-mono mt-0.5">{block.key}</p>
                </div>
                <span className="text-xs text-[#6B7770] bg-[#FAF7F2] px-2 py-0.5 rounded">{block.type}</span>
              </div>
              {block.type === 'text' ? (
                <input
                  name="value"
                  type="text"
                  defaultValue={block.value ?? ''}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              ) : (
                <textarea
                  name="value"
                  rows={4}
                  defaultValue={block.value ?? ''}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none resize-y focus:ring-2 focus:ring-[#1B4332]/30"
                />
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B7770]">
                  {block.updated_at ? `Last updated ${new Date(block.updated_at).toLocaleDateString()}` : ''}
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1B4332] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1B4332]/90"
                >
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>

        <AddContentBlockModal group={activeGroup.key} />
      </div>
    </div>
  )
}
