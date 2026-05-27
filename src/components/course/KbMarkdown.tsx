'use client'

import ReactMarkdown from 'react-markdown'

export function KbMarkdown({ content }: { content: string }) {
  return (
    <div className="text-[#1A1A1A] text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-3 [&_strong]:font-semibold [&_a]:text-[#1B4332] [&_a]:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
