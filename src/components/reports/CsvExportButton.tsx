'use client'

interface CsvExportButtonProps {
  data: Record<string, string | number | null>[]
  filename: string
  label?: string
}

export default function CsvExportButton({ data, filename, label = 'Export CSV' }: CsvExportButtonProps) {
  function download() {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(h => {
        const v = row[h]
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    )
    const quoteIfNeeded = (s: string) =>
      s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    const csv = [headers.map(quoteIfNeeded).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={download}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1A1A1A] transition-colors">
      {label}
    </button>
  )
}
