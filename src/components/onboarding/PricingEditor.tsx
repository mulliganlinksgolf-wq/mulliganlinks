'use client'

import { useState } from 'react'

export type PricingRow = {
  id: string          // client-side uuid for React key
  rateName: string
  greenFeeCents: number
  cartFeeCents: number
}

export const DEFAULT_PRICING: PricingRow[] = [
  { id: crypto.randomUUID(), rateName: 'Weekday 18-hole',      greenFeeCents: 6500, cartFeeCents: 1800 },
  { id: crypto.randomUUID(), rateName: 'Weekend 18-hole',      greenFeeCents: 8500, cartFeeCents: 1800 },
  { id: crypto.randomUUID(), rateName: 'Twilight (after 3pm)', greenFeeCents: 4200, cartFeeCents: 1800 },
  { id: crypto.randomUUID(), rateName: '9-hole',               greenFeeCents: 3500, cartFeeCents: 1200 },
]

function centsToDisplay(cents: number): string {
  const dollars = cents / 100
  // Show decimals only if needed (e.g. $65.50, not $65.00)
  if (dollars % 1 === 0) return `$${dollars}`
  return `$${dollars.toFixed(2)}`
}

function displayToCents(display: string): number {
  const cleaned = display.replace(/[$,]/g, '').trim()
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

// ---- DollarInput ----
type DollarInputProps = {
  cents: number
  onChange: (cents: number) => void
  className?: string
}

function DollarInput({ cents, onChange, className = '' }: DollarInputProps) {
  const [display, setDisplay] = useState(() => centsToDisplay(cents))

  // Keep display in sync if cents prop changes externally (e.g. row reset)
  // We only sync on blur, not on every render, to allow free typing.

  return (
    <input
      type="text"
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={() => {
        const newCents = displayToCents(display)
        onChange(newCents)
        setDisplay(centsToDisplay(newCents))
      }}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] ${className}`}
    />
  )
}

// ---- PricingEditor ----
type Props = {
  value: PricingRow[]
  onChange: (rows: PricingRow[]) => void
}

export default function PricingEditor({ value, onChange }: Props) {
  function updateRow(id: string, patch: Partial<PricingRow>) {
    onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    if (value.length <= 1) return
    onChange(value.filter((row) => row.id !== id))
  }

  function addRow() {
    const newRow: PricingRow = {
      id: crypto.randomUUID(),
      rateName: '',
      greenFeeCents: 0,
      cartFeeCents: 0,
    }
    onChange([...value, newRow])
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_120px_auto] gap-2 items-center">
        <span className="text-xs text-gray-400">Rate name</span>
        <span className="text-xs text-gray-400">Green fee</span>
        <span className="text-xs text-gray-400">Cart fee</span>
        <span className="w-8" />
      </div>

      {value.map((row) => (
        <div key={row.id} className="grid grid-cols-[1fr_120px_120px_auto] gap-2 items-center">
          {/* Rate name */}
          <input
            type="text"
            value={row.rateName}
            onChange={(e) => updateRow(row.id, { rateName: e.target.value })}
            placeholder="e.g. Weekday 18-hole"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11]"
          />

          {/* Green fee */}
          <DollarInput
            cents={row.greenFeeCents}
            onChange={(cents) => updateRow(row.id, { greenFeeCents: cents })}
          />

          {/* Cart fee */}
          <DollarInput
            cents={row.cartFeeCents}
            onChange={(cents) => updateRow(row.id, { cartFeeCents: cents })}
          />

          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            disabled={value.length <= 1}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
            aria-label="Remove row"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 self-start bg-white text-gray-500 border border-gray-300 rounded-lg px-5 py-2.5 text-sm hover:bg-gray-50"
      >
        + Add rate category
      </button>
    </div>
  )
}
