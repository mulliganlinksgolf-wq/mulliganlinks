import { getSiteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConfigForm from '@/components/admin/ConfigForm'
import { saveAdminSignature } from './actions'

export const metadata = { title: 'Configuration' }

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const config = await getSiteConfig()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminClient = createAdminClient()
  const { data: profile } = user
    ? await adminClient.from('profiles').select('signature').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Configuration</h1>
        <p className="text-[#6B7770] text-sm mt-1">Site-wide settings and feature flags. Changes take effect immediately.</p>
      </div>
      {saved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
          ✓ Saved
        </div>
      )}
      <ConfigForm config={config} />

      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Email Signature</h2>
        <p className="text-[#6B7770] text-sm mb-4">
          Appended automatically to CRM emails you send. Plain text only.
        </p>
        <form action={saveAdminSignature}>
          <textarea
            name="signature"
            defaultValue={profile?.signature ?? ''}
            rows={4}
            placeholder={'Neil Barris\nneil@teeahead.com\nteeahead.com'}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="mt-3 px-4 py-2 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#155728]"
          >
            Save signature
          </button>
        </form>
      </div>
    </div>
  )
}
