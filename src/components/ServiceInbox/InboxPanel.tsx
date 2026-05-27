'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RequestCard } from '@/components/ServiceInbox/RequestCard'

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

  // First tone: 880Hz, 0.15s
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.frequency.value = 880
  gain1.gain.setValueAtTime(0.3, ctx.currentTime)
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc1.start(ctx.currentTime)
  osc1.stop(ctx.currentTime + 0.15)

  // Second tone: 1100Hz, starts 0.1s later, 0.2s long
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

async function fetchRequests(status: 'open' | 'acknowledged'): Promise<ServiceRequest[]> {
  const res = await fetch(`/api/service-requests/list?status=${status}`)
  if (!res.ok) return []
  return res.json()
}

export function InboxPanel({ courseId }: { courseId: string }) {
  const [openRequests, setOpenRequests] = useState<ServiceRequest[]>([])
  const [acknowledgedRequests, setAcknowledgedRequests] = useState<ServiceRequest[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('open')

  // Initial data load
  useEffect(() => {
    Promise.all([fetchRequests('open'), fetchRequests('acknowledged')]).then(
      ([open, acknowledged]) => {
        setOpenRequests(open)
        setAcknowledgedRequests(acknowledged)
      }
    )
  }, [])

  // Re-fetch open requests (used after INSERT to get golfer_name)
  const refetchOpen = useCallback(async () => {
    const open = await fetchRequests('open')
    setOpenRequests(open)
  }, [])

  // Optimistic move on acknowledge
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

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('service_requests_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests',
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          // Re-fetch to get full data including golfer_name
          refetchOpen()
          playChime()
        }
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
            // Move from open to acknowledged
            setOpenRequests((prev) => prev.filter((r) => r.id !== updated.id))
            setAcknowledgedRequests((prev) => {
              const exists = prev.some((r) => r.id === updated.id)
              if (exists) {
                return prev.map((r) => (r.id === updated.id ? updated : r))
              }
              return [updated, ...prev]
            })
          } else {
            // Update in place in whichever list contains it
            setOpenRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            )
            setAcknowledgedRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseId, refetchOpen])

  const displayedRequests =
    activeTab === 'open'
      ? [...openRequests].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : [...acknowledgedRequests].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

  const openCount = openRequests.length

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#1A1A1A]">Service requests</h2>
        {openCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-[#1B4332] text-white text-xs font-bold px-2 py-0.5 min-w-[20px]">
            {openCount}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('open')}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'open'
              ? 'text-[#1B4332] border-b-2 border-[#1B4332] -mb-px'
              : 'text-[#6B7770] hover:text-[#1A1A1A]',
          ].join(' ')}
        >
          Open
        </button>
        <button
          onClick={() => setActiveTab('acknowledged')}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'acknowledged'
              ? 'text-[#1B4332] border-b-2 border-[#1B4332] -mb-px'
              : 'text-[#6B7770] hover:text-[#1A1A1A]',
          ].join(' ')}
        >
          Acknowledged
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {displayedRequests.length === 0 ? (
          activeTab === 'open' ? (
            <p className="text-sm text-[#6B7770] py-4 text-center">
              All clear — no requests right now.
            </p>
          ) : (
            <p className="text-sm text-[#6B7770] py-4 text-center">
              No acknowledged requests.
            </p>
          )
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
    </div>
  )
}
