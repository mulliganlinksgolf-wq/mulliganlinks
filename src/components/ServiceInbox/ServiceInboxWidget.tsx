'use client'

import { useEffect, useState, useCallback, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RequestCard } from '@/components/ServiceInbox/RequestCard'
import { toggleServiceRequests } from '@/app/actions/serviceRequests'

interface ServiceRequest {
  id: string
  golfer_name: string | null
  category: string
  note: string | null
  estimated_hole: number | null
  created_at: string
  status: 'open' | 'acknowledged' | 'resolved'
  acknowledged_at: string | null
}

type Tab = 'open' | 'acknowledged'

function playChime() {
  const ctx = new AudioContext()

  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.frequency.value = 880
  gain1.gain.setValueAtTime(0.3, ctx.currentTime)
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc1.start(ctx.currentTime)
  osc1.stop(ctx.currentTime + 0.15)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.frequency.value = 1100
  gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.1)
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc2.start(ctx.currentTime + 0.1)
  osc2.stop(ctx.currentTime + 0.3)
}

async function fetchRequests(
  courseId: string,
  status: 'open' | 'acknowledged',
): Promise<ServiceRequest[]> {
  const res = await fetch(
    `/api/service-requests/list?status=${status}&course_id=${encodeURIComponent(courseId)}`,
  )
  if (!res.ok) return []
  return res.json()
}

interface ServiceInboxWidgetProps {
  courseId: string
  serviceRequestsEnabled: boolean
}

export function ServiceInboxWidget({
  courseId,
  serviceRequestsEnabled: initialEnabled,
}: ServiceInboxWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isOpenRef = useRef(isOpen)
  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  const [openRequests, setOpenRequests] = useState<ServiceRequest[]>([])
  const [acknowledgedRequests, setAcknowledgedRequests] = useState<ServiceRequest[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('open')
  const [hasPulse, setHasPulse] = useState(false)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  // Initial data load
  useEffect(() => {
    Promise.all([
      fetchRequests(courseId, 'open'),
      fetchRequests(courseId, 'acknowledged'),
    ]).then(([open, acknowledged]) => {
      setOpenRequests(open)
      setAcknowledgedRequests(acknowledged)
    })
  }, [courseId])

  const refetchOpen = useCallback(async () => {
    const open = await fetchRequests(courseId, 'open')
    setOpenRequests(open)
  }, [courseId])

  const handleAcknowledged = useCallback((id: string) => {
    setOpenRequests((prev) => {
      const req = prev.find((r) => r.id === id)
      if (req) {
        const updated: ServiceRequest = {
          ...req,
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        }
        setAcknowledgedRequests((ack) => [updated, ...ack])
      }
      return prev.filter((r) => r.id !== id)
    })
  }, [])

  // Supabase Realtime — stable subscription (no isOpen in deps, uses ref instead)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`service_requests_widget_${courseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          refetchOpen()
          playChime()
          if (!isOpenRef.current) setHasPulse(true)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          const updated = payload.new as ServiceRequest

          if (updated.status === 'acknowledged') {
            setOpenRequests((prev) => prev.filter((r) => r.id !== updated.id))
            setAcknowledgedRequests((prev) => {
              const exists = prev.some((r) => r.id === updated.id)
              if (exists) return prev.map((r) => (r.id === updated.id ? updated : r))
              return [updated, ...prev]
            })
          } else {
            setOpenRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r)),
            )
            setAcknowledgedRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r)),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseId, refetchOpen])

  const openCount = openRequests.length
  const displayedRequests =
    activeTab === 'open'
      ? [...openRequests].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      : [...acknowledgedRequests].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )

  function handleOpen() {
    setIsOpen((v) => !v)
    setHasPulse(false)
  }

  function handleToggleEnabled() {
    const next = !enabled
    setEnabled(next) // optimistic
    startTransition(async () => {
      const result = await toggleServiceRequests(courseId, next)
      if (result.error) setEnabled(!next) // revert on error
    })
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring on new unread request */}
        {hasPulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-40"
            style={{ background: '#1B4332' }}
          />
        )}
        <button
          onClick={handleOpen}
          className="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ background: '#1B4332' }}
          aria-label="Service requests inbox"
        >
          <span className="text-2xl leading-none select-none">🛎️</span>

          {/* Unread badge */}
          {openCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow">
              {openCount > 99 ? '99+' : openCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[540px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden">

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: '#1B4332' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm leading-none">
                🛎️ Service Requests
              </span>
              {openCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5 leading-none">
                  {openCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white shrink-0">
            <button
              onClick={() => setActiveTab('open')}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === 'open'
                  ? 'text-[#1B4332] border-b-2 border-[#1B4332] -mb-px'
                  : 'text-[#6B7770] hover:text-[#1A1A1A]',
              ].join(' ')}
            >
              Open{openCount > 0 ? ` (${openCount})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('acknowledged')}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === 'acknowledged'
                  ? 'text-[#1B4332] border-b-2 border-[#1B4332] -mb-px'
                  : 'text-[#6B7770] hover:text-[#1A1A1A]',
              ].join(' ')}
            >
              Acknowledged
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {!enabled && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                <p className="text-xs text-amber-700 font-medium">
                  Service requests are off — members can&apos;t reach you right now.
                </p>
              </div>
            )}

            {displayedRequests.length === 0 ? (
              <p className="text-sm text-[#6B7770] py-8 text-center">
                {activeTab === 'open'
                  ? 'All clear — no requests right now.'
                  : 'No acknowledged requests.'}
              </p>
            ) : (
              displayedRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  id={req.id}
                  golfer_name={req.golfer_name}
                  category={req.category}
                  note={req.note}
                  estimated_hole={req.estimated_hole}
                  created_at={req.created_at}
                  status={req.status}
                  acknowledged_at={req.acknowledged_at}
                  onAcknowledged={handleAcknowledged}
                />
              ))
            )}
          </div>

          {/* Footer — enable/disable toggle */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
            <div>
              <p className="text-xs font-medium text-[#1A1A1A]">Members can request help</p>
              <p className="text-[10px] text-[#6B7770] mt-0.5">
                {enabled ? 'Button visible to golfers mid-round' : 'Button hidden for all golfers'}
              </p>
            </div>
            <button
              onClick={handleToggleEnabled}
              disabled={isPending}
              role="switch"
              aria-checked={enabled}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                enabled ? 'bg-[#1B4332]' : 'bg-gray-300',
                isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                  enabled ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
