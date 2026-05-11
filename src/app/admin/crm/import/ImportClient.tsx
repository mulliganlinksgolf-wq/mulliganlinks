'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { importCourses } from '@/app/actions/crm/import'
import type { CsvCourseRow, ImportResult } from '@/app/actions/crm/import'

const CRM_FIELDS = [
  { key: 'name', label: 'Course name', required: true },
  { key: 'contact_name', label: 'Contact name' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'contact_phone', label: 'Contact phone' },
  { key: 'stage', label: 'Pipeline stage' },
  { key: 'assigned_to', label: 'Assigned to' },
  { key: 'notes', label: 'Notes' },
] as const

type CrmFieldKey = typeof CRM_FIELDS[number]['key']

export function ImportClient() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap] = useState<Partial<Record<CrmFieldKey, string>>>({})
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? []
        setHeaders(cols)
        setAllRows(results.data)
        setPreview(results.data.slice(0, 5))
        setResult(null)
        setError(null)
        // Auto-map obvious headers
        const auto: Partial<Record<CrmFieldKey, string>> = {}
        for (const col of cols) {
          const lower = col.toLowerCase().replace(/\s+/g, '_')
          if (lower.includes('email')) auto.contact_email = col
          else if (lower.includes('phone')) auto.contact_phone = col
          else if (lower.includes('contact_name') || lower === 'contact') auto.contact_name = col
          else if (lower.includes('course') || lower === 'name') auto.name = col
          else if (lower.includes('stage')) auto.stage = col
          else if (lower.includes('assign')) auto.assigned_to = col
          else if (lower.includes('note')) auto.notes = col
        }
        setColumnMap(auto)
      },
    })
  }

  async function handleImport() {
    if (!columnMap.name) {
      setError('You must map the "Course name" column before importing.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows: CsvCourseRow[] = allRows.map(row => ({
        name: row[columnMap.name!] ?? '',
        contact_name: columnMap.contact_name ? row[columnMap.contact_name] ?? null : null,
        contact_email: columnMap.contact_email ? row[columnMap.contact_email] ?? null : null,
        contact_phone: columnMap.contact_phone ? row[columnMap.contact_phone] ?? null : null,
        stage: columnMap.stage ? row[columnMap.stage] ?? '' : '',
        assigned_to: columnMap.assigned_to ? row[columnMap.assigned_to] ?? null : null,
        notes: columnMap.notes ? row[columnMap.notes] ?? null : null,
      }))
      const res = await importCourses(rows)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <p className="text-slate-500 text-sm">Drop a CSV here or <span className="text-emerald-700 font-medium">click to browse</span></p>
        <p className="text-slate-400 text-xs mt-1">Columns: course name, contact name, email, phone, stage, assigned to, notes</p>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Preview (first {preview.length} rows)</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="text-xs w-full">
              <thead className="bg-slate-50">
                <tr>{headers.map(h => <th key={h} className="px-3 py-2 text-left text-slate-600 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {headers.map(h => <td key={h} className="px-3 py-2 text-slate-700">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Column mapper */}
      {headers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Map columns</h2>
          <div className="grid grid-cols-2 gap-3">
            {CRM_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-36 flex-shrink-0">
                  {field.label}{'required' in field && field.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <select
                  value={columnMap[field.key] ?? ''}
                  onChange={e => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
                >
                  <option value="">— skip —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import button */}
      {headers.length > 0 && !result && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            disabled={loading || !columnMap.name}
            className="px-5 py-2 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#155728] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing…' : `Import ${allRows.length} courses`}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-2">
          <p className="text-sm font-semibold text-emerald-800">Import complete</p>
          <p className="text-sm text-emerald-700">&#10003; {result.created} courses created</p>
          {result.skipped > 0 && <p className="text-sm text-slate-500">{result.skipped} skipped (already exist)</p>}
          {result.errors.length > 0 && (
            <ul className="text-sm text-red-600 list-disc list-inside">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
