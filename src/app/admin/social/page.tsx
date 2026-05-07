import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChannels, getScheduledPosts, getSentPosts } from '@/lib/buffer'
import SocialManager from '@/components/admin/SocialManager'

export const metadata = { title: 'Social' }

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isHardcoded = ADMIN_EMAILS.includes(user.email ?? '')
  if (!isHardcoded) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) redirect('/admin')
  }

  const apiKey = process.env.BUFFER_API_KEY
  const orgId = process.env.BUFFER_ORG_ID ?? ''

  if (!apiKey) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Social</h1>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 max-w-lg">
          <p className="font-bold text-amber-900 text-sm mb-1">Buffer not connected</p>
          <p className="text-amber-800 text-sm">
            Add <code className="bg-amber-100 px-1 rounded font-mono">BUFFER_API_KEY</code> and{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">BUFFER_ORG_ID</code> to your
            environment variables to enable social scheduling. Get your key at{' '}
            <span className="font-mono text-xs">publish.buffer.com/settings/api</span>
          </p>
        </div>
      </div>
    )
  }

  const [channelsResult, scheduledResult, sentResult] = await Promise.all([
    getChannels(orgId).then(c => ({ ok: true as const, data: c })).catch((e: Error) => ({ ok: false as const, error: e.message })),
    getScheduledPosts(orgId).then(d => ({ ok: true as const, data: d })).catch((e: Error) => ({ ok: false as const, error: e.message })),
    getSentPosts(orgId, 5).then(d => ({ ok: true as const, data: d })).catch((e: Error) => ({ ok: false as const, error: e.message })),
  ])

  const channels = channelsResult.ok ? channelsResult.data : []
  const scheduledPosts = scheduledResult.ok ? scheduledResult.data : []
  const sentPosts = sentResult.ok ? sentResult.data : []
  const bufferError = !channelsResult.ok ? channelsResult.error : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Social</h1>
      {bufferError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
          <p className="font-bold text-red-900 text-sm mb-1">Buffer API error</p>
          <p className="text-red-800 text-sm">{bufferError}</p>
          {bufferError.includes('429') && (
            <p className="text-red-800 text-xs mt-2">Buffer&apos;s free plan allows 100 requests per day. The limit will reset within 24 hours.</p>
          )}
        </div>
      )}
      <SocialManager
        channels={channels}
        scheduledPosts={scheduledPosts}
        sentPosts={sentPosts}
      />
    </div>
  )
}
