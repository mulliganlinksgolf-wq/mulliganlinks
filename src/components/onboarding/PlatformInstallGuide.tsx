'use client'

import { useState } from 'react'

type Platform = 'wordpress' | 'squarespace' | 'wix' | 'webflow' | 'none'

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'wordpress',   label: 'WordPress' },
  { value: 'squarespace', label: 'Squarespace' },
  { value: 'wix',         label: 'Wix' },
  { value: 'webflow',     label: 'Webflow' },
  { value: 'none',        label: 'No website' },
]

type Props = {
  courseSlug: string
}

export default function PlatformInstallGuide({ courseSlug }: Props) {
  const [platform, setPlatform] = useState<Platform>('wordpress')
  const [copied, setCopied] = useState(false)

  const embedSnippet = `<script src="https://app.teeahead.com/widget.js" data-course="${courseSlug}"></script>`
  const bookingUrl = `teeahead.com/book/${courseSlug}`

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLabel = copied ? 'Copied!' : undefined

  return (
    <div className="flex flex-col gap-5">
      {/* Platform picker */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setPlatform(value); setCopied(false) }}
            className={
              platform === value
                ? 'bg-[#EAF3DE] border-[#639922] text-[#3B6D11] border rounded-lg px-3 py-1.5 text-sm font-medium'
                : 'bg-white border-gray-200 border rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300'
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Install card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {platform === 'wordpress' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-900">Install the TeeAhead plugin:</p>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>Go to Dashboard → Plugins → Add New</li>
              <li>Search "TeeAhead" → Install &amp; Activate</li>
              <li>Go to Settings → TeeAhead → paste your Course ID</li>
              <li>Add <code className="bg-gray-100 px-1 rounded text-xs">[teeahead_booking]</code> shortcode to your Tee Times page</li>
            </ol>
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Your Course ID:</p>
              <div className="flex items-center gap-2">
                <code className="font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {courseSlug}
                </code>
                <button
                  type="button"
                  onClick={() => copy(courseSlug)}
                  className="text-xs text-[#3B6D11] hover:underline"
                >
                  {copyLabel ?? 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {(platform === 'squarespace' || platform === 'wix' || platform === 'webflow') && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-900">Add the booking widget:</p>
            {platform === 'squarespace' && (
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Open your Tee Times page → Edit</li>
                <li>Add a Code Block where you want the booking widget</li>
                <li>Paste the embed code below and save</li>
              </ol>
            )}
            {platform === 'wix' && (
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Open your Tee Times page in the Wix Editor</li>
                <li>Add → Embed → Custom Code</li>
                <li>Paste the embed code below and publish</li>
              </ol>
            )}
            {platform === 'webflow' && (
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Open your Tee Times page in Webflow Designer</li>
                <li>Add an Embed element where you want the booking widget</li>
                <li>Paste the embed code below and publish</li>
              </ol>
            )}
            <div className="mt-2">
              <div className="flex items-start gap-2">
                <code className="font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm break-all">
                  {embedSnippet}
                </code>
                <button
                  type="button"
                  onClick={() => copy(embedSnippet)}
                  className="text-xs text-[#3B6D11] hover:underline whitespace-nowrap"
                >
                  {copyLabel ?? 'Copy code'}
                </button>
              </div>
            </div>
          </div>
        )}

        {platform === 'none' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              We&apos;ve created a hosted booking page for you. You can link to it from your Google
              Business Profile, Instagram bio, and anywhere else you promote your course.
            </p>
            <div>
              <p className="text-xs text-gray-500 mb-1">Your booking page:</p>
              <div className="flex items-center gap-2">
                <code className="font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {bookingUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copy(`https://${bookingUrl}`)}
                  className="text-xs text-[#3B6D11] hover:underline"
                >
                  {copyLabel ?? 'Copy link'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Add this link to your Google Business Profile and Instagram bio to start getting
              bookings immediately.
            </p>
          </div>
        )}
      </div>

      {/* Help link */}
      <p className="text-sm text-gray-500">
        Need help? We&apos;ll set this up for you on a 15-minute screen share.{' '}
        <a
          href="https://cal.com/teeahead/widget-setup"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3B6D11] hover:underline font-medium"
        >
          Book a setup call →
        </a>
      </p>
    </div>
  )
}
