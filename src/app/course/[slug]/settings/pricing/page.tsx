import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireManager } from '@/lib/courseRole'
import { RuleEditor } from './RuleEditor'
import { PricingPreviewCalendar } from './PricingPreviewCalendar'

export default async function PricingSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, name')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const { data: rules } = await supabase
    .from('rate_rules')
    .select('*')
    .eq('course_id', course.id)
    .order('priority')

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/course/${slug}/settings`} className="text-[#1B4332] hover:underline">
            ← Settings
          </Link>
        </div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Pricing Rules</h1>
        <p className="text-sm text-[#6B7770] max-w-3xl">
          Rules apply in priority order (lowest number first) and adjust your rack rate up or
          down based on conditions you control. A safety floor at 50% of rack and ceiling at 3×
          rack prevent accidents. Rules in the &quot;twilight&quot; or &quot;off_peak&quot; category will NOT display
          as &quot;Hot Deals&quot; in the golfer UI — TeeAhead protects your price integrity by design.
        </p>
      </header>

      <RuleEditor courseSlug={slug} initialRules={rules ?? []} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[#1A1A1A]">Preview Next 7 Days</h2>
        <p className="text-xs text-[#6B7770]">
          Each cell shows the computed rate after rules apply. Hover for the rule label.
        </p>
        <PricingPreviewCalendar courseId={course.id} />
      </section>
    </div>
  )
}
