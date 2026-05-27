import { requireManager } from '@/lib/courseRole'
import PlatformInstallGuide from '@/components/onboarding/PlatformInstallGuide'

export default async function InstallPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Website Integration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add TeeAhead booking to your website in minutes. Choose your platform below.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <PlatformInstallGuide courseSlug={slug} />
      </div>

      <div className="bg-[#F0F9E8] border border-[#C3E6A0] rounded-xl p-5">
        <p className="text-sm font-medium text-[#1B4332]">Need help setting this up?</p>
        <p className="text-sm text-[#3B6D11] mt-1">
          We'll do it for you on a 15-minute screen share — no technical knowledge needed.
        </p>
        <a
          href="https://cal.com/teeahead/widget-setup"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm font-semibold text-[#1B4332] underline hover:no-underline"
        >
          Book a free setup call →
        </a>
      </div>
    </div>
  )
}
