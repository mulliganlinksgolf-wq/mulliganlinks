import { getSiteConfig } from '@/lib/site-config'
import ConfigForm from '@/components/admin/ConfigForm'

export const metadata = { title: 'Configuration' }

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const config = await getSiteConfig()

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
    </div>
  )
}
