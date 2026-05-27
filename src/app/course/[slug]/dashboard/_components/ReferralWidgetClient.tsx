'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ReferralWidgetClientProps {
  referralUrl: string
  qrDataUrl: string
}

export function ReferralWidgetClient({ referralUrl, qrDataUrl }: ReferralWidgetClientProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Referral link */}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-[#F4F1EA] border border-black/10 rounded px-3 py-2 truncate text-[#0F3D2E]">
          {referralUrl}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 text-xs font-semibold px-3 py-2 bg-[#0F3D2E] text-white rounded hover:bg-[#0F3D2E]/90 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* QR code */}
      <div className="flex justify-center">
        <Image src={qrDataUrl} alt="Referral QR code" width={140} height={140} className="rounded border border-black/10" />
      </div>
      <p className="text-xs text-center text-[#6B7770]">Print and post at the clubhouse</p>
    </div>
  )
}
