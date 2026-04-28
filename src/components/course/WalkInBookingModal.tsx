'use client'

import { useState, useTransition } from 'react'
import { createWalkInBooking, sendWalkInEmail } from '@/app/actions/teeTime'

type PaymentMode = 'group' | 'split'
type PaymentMethod = 'cash' | 'card' | 'unpaid'

interface GolferEntry {
  name: string
  phone: string
  amount: string
}

interface Props {
  teeTimeId: string
  availablePlayers: number
  basePrice: number
  scheduledAt: string
  courseName: string
  onClose: () => void
  onSuccess: () => void
}

export function WalkInBookingModal({
  teeTimeId,
  availablePlayers,
  basePrice,
  scheduledAt,
  courseName,
  onClose,
  onSuccess,
}: Props) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('group')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  // Group mode fields
  const [groupName, setGroupName] = useState('')
  const [groupPhone, setGroupPhone] = useState('')
  const [groupEmail, setGroupEmail] = useState('')
  const [playerCount, setPlayerCount] = useState(1)
  const [groupAmount, setGroupAmount] = useState(basePrice.toFixed(2))

  // Split mode fields
  const [golfers, setGolfers] = useState<GolferEntry[]>([
    { name: '', phone: '', amount: basePrice.toFixed(2) },
  ])

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Detroit',
    })

  function handlePlayerCountChange(n: number) {
    setPlayerCount(n)
    setGroupAmount((basePrice * n).toFixed(2))
  }

  function addGolfer() {
    if (golfers.length < availablePlayers) {
      setGolfers([...golfers, { name: '', phone: '', amount: basePrice.toFixed(2) }])
    }
  }

  function removeGolfer(i: number) {
    if (golfers.length > 1) {
      setGolfers(golfers.filter((_, idx) => idx !== i))
    }
  }

  function updateGolfer(i: number, field: keyof GolferEntry, value: string) {
    const updated = [...golfers]
    updated[i] = { ...updated[i], [field]: value }
    setGolfers(updated)
  }

  function handleSubmit() {
    setError(null)

    if (paymentMode === 'group') {
      if (!groupName.trim()) {
        setError('Golfer name is required')
        return
      }
      startTransition(async () => {
        const result = await createWalkInBooking({
          teeTimeId,
          guestName: groupName.trim(),
          guestPhone: groupPhone.trim(),
          guestEmail: groupEmail.trim() || undefined,
          players: playerCount,
          totalPaid: parseFloat(groupAmount) || 0,
          paymentMethod,
        })
        if (result?.error) {
          setError(result.error)
          return
        }
        if (groupEmail.trim()) {
          sendWalkInEmail({
            guestName: groupName.trim(),
            guestEmail: groupEmail.trim(),
            courseName,
            teeTimeIso: scheduledAt,
            players: playerCount,
            totalPaid: parseFloat(groupAmount) || 0,
            paymentMethod,
          }).catch(() => {/* fire and forget */})
        }
        onSuccess()
      })
    } else {
      const missing = golfers.findIndex(g => !g.name.trim())
      if (missing !== -1) {
        setError(`Name required for golfer ${missing + 1}`)
        return
      }
      startTransition(async () => {
        for (const golfer of golfers) {
          const result = await createWalkInBooking({
            teeTimeId,
            guestName: golfer.name.trim(),
            guestPhone: golfer.phone.trim(),
            players: 1,
            totalPaid: parseFloat(golfer.amount) || 0,
            paymentMethod,
          })
          if (result?.error) {
            setError(result.error)
            return
          }
        }
        onSuccess()
      })
    }
  }

  const splitTotal = golfers.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0)
  const spotsLabel = `${availablePlayers} spot${availablePlayers !== 1 ? 's' : ''} available`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1A1A1A]">Book Walk-in</p>
            <p className="text-xs text-[#6B7770] mt-0.5">
              {formatTime(scheduledAt)} · {spotsLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#6B7770] hover:text-[#1A1A1A] text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Payment mode toggle */}
          <div>
            <p className="text-xs font-medium text-[#6B7770] uppercase tracking-wide mb-2">
              Payment mode
            </p>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setPaymentMode('group')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  paymentMode === 'group'
                    ? 'bg-[#1B4332] text-[#FAF7F2]'
                    : 'text-[#6B7770] hover:bg-gray-50'
                }`}
              >
                Group pays together
              </button>
              <button
                onClick={() => setPaymentMode('split')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  paymentMode === 'split'
                    ? 'bg-[#1B4332] text-[#FAF7F2]'
                    : 'text-[#6B7770] hover:bg-gray-50'
                }`}
              >
                Split per golfer
              </button>
            </div>
          </div>

          {paymentMode === 'group' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6B7770] block mb-1">Name *</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Lead golfer name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7770] block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={groupPhone}
                    onChange={e => setGroupPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7770] block mb-1">
                  Email <span className="text-[#9DAA9F] font-normal">(sends confirmation)</span>
                </label>
                <input
                  type="email"
                  value={groupEmail}
                  onChange={e => setGroupEmail(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6B7770] block mb-1">Players</label>
                  <select
                    value={playerCount}
                    onChange={e => handlePlayerCountChange(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  >
                    {Array.from({ length: availablePlayers }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>
                        {n} player{n !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7770] block mb-1">
                    Amount paid ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={groupAmount}
                    onChange={e => setGroupAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {golfers.map((g, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[#1A1A1A]">Golfer {i + 1}</p>
                    {golfers.length > 1 && (
                      <button
                        onClick={() => removeGolfer(i)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={g.name}
                      onChange={e => updateGolfer(i, 'name', e.target.value)}
                      placeholder="Name *"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                    />
                    <input
                      type="tel"
                      value={g.phone}
                      onChange={e => updateGolfer(i, 'phone', e.target.value)}
                      placeholder="Phone"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={g.amount}
                      onChange={e => updateGolfer(i, 'amount', e.target.value)}
                      placeholder="$0.00"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                    />
                  </div>
                </div>
              ))}
              {golfers.length < availablePlayers && (
                <button
                  onClick={addGolfer}
                  className="w-full py-2 text-sm text-[#1B4332] border border-dashed border-[#1B4332]/40 rounded-lg hover:bg-[#1B4332]/5 transition-colors"
                >
                  + Add golfer
                </button>
              )}
              <p className="text-xs text-right text-[#6B7770]">
                Total: ${splitTotal.toFixed(2)}
              </p>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-xs font-medium text-[#6B7770] uppercase tracking-wide mb-2">
              Payment method
            </p>
            <div className="flex gap-2">
              {(['cash', 'card'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    paymentMethod === m
                      ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                      : 'text-[#6B7770] border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-[#6B7770] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-[#1B4332] text-[#FAF7F2] rounded-lg hover:bg-[#1B4332]/90 disabled:opacity-50"
          >
            {isPending
              ? 'Booking…'
              : paymentMode === 'split'
              ? `Book ${golfers.length} golfer${golfers.length !== 1 ? 's' : ''}`
              : `Book ${playerCount} player${playerCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
