'use client'

import { useState, useTransition } from 'react'
import { createOrUpdateRuleAction, deleteRuleAction, type RuleInput } from './actions'

type RuleRow = {
  id: string
  name: string
  category: RuleInput['category']
  enabled: boolean
  days_of_week: number[] | null
  start_time: string | null
  end_time: string | null
  is_holiday: boolean | null
  min_days_out: number | null
  max_days_out: number | null
  min_occupancy_pct: number | null
  max_occupancy_pct: number | null
  action_type: RuleInput['actionType']
  action_value: number
  priority: number
  display_label: string | null
  internal_note: string | null
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CATEGORIES: RuleInput['category'][] = [
  'peak', 'twilight', 'off_peak', 'holiday', 'occupancy', 'days_out', 'custom',
]

const ACTION_TYPES: { value: RuleInput['actionType']; label: string }[] = [
  { value: 'percent_adjust',       label: '% adjust (e.g. +25 or -20)' },
  { value: 'fixed_amount_adjust',  label: '$ adjust (e.g. +15 or -10)' },
  { value: 'fixed_price_override', label: 'Set fixed price (e.g. 99)' },
]

function emptyDraft(priority: number): RuleInput {
  return {
    name: '',
    category: 'custom',
    enabled: true,
    daysOfWeek: null,
    startTime: null,
    endTime: null,
    isHoliday: null,
    minDaysOut: null,
    maxDaysOut: null,
    minOccupancyPct: null,
    maxOccupancyPct: null,
    actionType: 'percent_adjust',
    actionValue: 0,
    priority,
    displayLabel: null,
    internalNote: null,
  }
}

function rowToDraft(r: RuleRow): RuleInput {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    enabled: r.enabled,
    daysOfWeek: r.days_of_week,
    startTime: r.start_time,
    endTime: r.end_time,
    isHoliday: r.is_holiday,
    minDaysOut: r.min_days_out,
    maxDaysOut: r.max_days_out,
    minOccupancyPct: r.min_occupancy_pct,
    maxOccupancyPct: r.max_occupancy_pct,
    actionType: r.action_type,
    actionValue: Number(r.action_value),
    priority: r.priority,
    displayLabel: r.display_label,
    internalNote: r.internal_note,
  }
}

export function RuleEditor({
  courseSlug,
  initialRules,
}: {
  courseSlug: string
  initialRules: RuleRow[]
}) {
  const [drafts, setDrafts] = useState<RuleInput[]>(initialRules.map(rowToDraft))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function update(idx: number, patch: Partial<RuleInput>) {
    setDrafts(prev => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  function toggleDay(idx: number, day: number) {
    const cur = drafts[idx].daysOfWeek ?? []
    const next = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day].sort()
    update(idx, { daysOfWeek: next.length ? next : null })
  }

  function addBlank() {
    const maxPriority = drafts.reduce((m, d) => Math.max(m, d.priority), 0)
    setDrafts(prev => [...prev, emptyDraft(maxPriority + 10)])
  }

  function save(idx: number) {
    setError(null)
    const d = drafts[idx]
    startTransition(async () => {
      const res = await createOrUpdateRuleAction(courseSlug, d)
      if (res.error) { setError(res.error); return }
      if (res.id && !d.id) {
        setDrafts(prev => prev.map((x, i) => i === idx ? { ...x, id: res.id } : x))
      }
    })
  }

  function remove(idx: number) {
    setError(null)
    const d = drafts[idx]
    if (!d.id) {
      setDrafts(prev => prev.filter((_, i) => i !== idx))
      return
    }
    if (!confirm(`Delete rule "${d.name || 'untitled'}"?`)) return
    startTransition(async () => {
      const res = await deleteRuleAction(courseSlug, d.id!)
      if (res.error) { setError(res.error); return }
      setDrafts(prev => prev.filter((_, i) => i !== idx))
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 ring-1 ring-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {drafts.length === 0 && (
        <p className="text-sm text-[#6B7770]">No rules yet. Add one to get started.</p>
      )}

      {drafts.map((d, idx) => (
        <div key={d.id ?? `new-${idx}`} className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Name</label>
              <input
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.name}
                onChange={e => update(idx, { name: e.target.value })}
                placeholder="Weekend Morning Peak"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Category</label>
              <select
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.category}
                onChange={e => update(idx, { category: e.target.value as RuleInput['category'] })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Display label (shown to golfers)</label>
              <input
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.displayLabel ?? ''}
                onChange={e => update(idx, { displayLabel: e.target.value || null })}
                placeholder="Weekend Morning"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id={`enabled-${idx}`}
                type="checkbox"
                checked={d.enabled}
                onChange={e => update(idx, { enabled: e.target.checked })}
              />
              <label htmlFor={`enabled-${idx}`} className="text-sm text-[#1A1A1A]">Enabled</label>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#6B7770] mb-1">Days of week (none = any)</div>
            <div className="flex gap-1">
              {DAY_LABELS.map((lbl, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx, day)}
                  className={`px-3 py-1 text-xs rounded-full ring-1 ${
                    (d.daysOfWeek ?? []).includes(day)
                      ? 'bg-[#1B4332] text-white ring-[#1B4332]'
                      : 'bg-white text-[#1A1A1A] ring-slate-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Start time</label>
              <input
                type="time"
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.startTime ?? ''}
                onChange={e => update(idx, { startTime: e.target.value || null })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">End time (exclusive)</label>
              <input
                type="time"
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.endTime ?? ''}
                onChange={e => update(idx, { endTime: e.target.value || null })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Holiday?</label>
              <select
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.isHoliday === null ? '' : d.isHoliday ? 'true' : 'false'}
                onChange={e => update(idx, {
                  isHoliday: e.target.value === '' ? null : e.target.value === 'true',
                })}
              >
                <option value="">Any</option>
                <option value="true">Yes (holiday only)</option>
                <option value="false">No (non-holiday only)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Priority</label>
              <input
                type="number"
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.priority}
                onChange={e => update(idx, { priority: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Min days out</label>
              <input
                type="number"
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.minDaysOut ?? ''}
                onChange={e => update(idx, { minDaysOut: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Max days out</label>
              <input
                type="number"
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.maxDaysOut ?? ''}
                onChange={e => update(idx, { maxDaysOut: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Min occupancy %</label>
              <input
                type="number" min={0} max={100}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.minOccupancyPct ?? ''}
                onChange={e => update(idx, { minOccupancyPct: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Max occupancy %</label>
              <input
                type="number" min={0} max={100}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.maxOccupancyPct ?? ''}
                onChange={e => update(idx, { maxOccupancyPct: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Action type</label>
              <select
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.actionType}
                onChange={e => update(idx, { actionType: e.target.value as RuleInput['actionType'] })}
              >
                {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7770]">Action value</label>
              <input
                type="number" step="0.01"
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                value={d.actionValue}
                onChange={e => update(idx, { actionValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B7770]">Internal note (staff only)</label>
            <textarea
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              value={d.internalNote ?? ''}
              onChange={e => update(idx, { internalNote: e.target.value || null })}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save(idx)}
              disabled={pending || !d.name}
              className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg disabled:opacity-50"
            >
              {d.id ? 'Save changes' : 'Create rule'}
            </button>
            <button
              type="button"
              onClick={() => remove(idx)}
              disabled={pending}
              className="px-4 py-2 text-sm bg-white text-red-700 ring-1 ring-red-200 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addBlank}
        className="text-sm font-medium text-[#1B4332] hover:underline"
      >
        + Add rule
      </button>
    </div>
  )
}
