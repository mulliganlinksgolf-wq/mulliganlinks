'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import HoursEditor from '@/components/onboarding/HoursEditor'
import type { DayHours } from '@/components/onboarding/HoursEditor'
import PricingEditor from '@/components/onboarding/PricingEditor'
import type { PricingRow } from '@/components/onboarding/PricingEditor'
import type { TeeSheetConfig } from '@/lib/db/onboarding'
import {
  updateCourseHours,
  updateCoursePricing,
  updateTeeSheetConfig,
} from '@/lib/actions/teeSheetSettings'

interface Props {
  courseId: string
  initialHours: DayHours[]
  initialPricing: PricingRow[]
  initialConfig: TeeSheetConfig
}

type SectionState = {
  open: boolean
  saving: boolean
  success: boolean
  error: string | null
}

function useSectionState(): [SectionState, {
  toggle: () => void
  setSaving: (v: boolean) => void
  setSuccess: () => void
  setError: (msg: string) => void
  clearStatus: () => void
}] {
  const [state, setState] = useState<SectionState>({
    open: true,
    saving: false,
    success: false,
    error: null,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const toggle = () => setState(s => ({ ...s, open: !s.open }))
  const setSaving = (v: boolean) => setState(s => ({ ...s, saving: v }))
  const setSuccess = () => {
    setState(s => ({ ...s, success: true, error: null }))
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setState(s => ({ ...s, success: false })), 2000)
  }
  const setError = (msg: string) => setState(s => ({ ...s, error: msg, success: false }))
  const clearStatus = () => setState(s => ({ ...s, error: null, success: false }))

  return [state, { toggle, setSaving, setSuccess, setError, clearStatus }]
}

export function TeeSheetSettingsForm({ courseId, initialHours, initialPricing, initialConfig }: Props) {
  const [hours, setHours] = useState<DayHours[]>(initialHours)
  const [pricing, setPricing] = useState<PricingRow[]>(initialPricing)
  const [config, setConfig] = useState<TeeSheetConfig>(initialConfig)

  const [hoursSection, hoursActions] = useSectionState()
  const [pricingSection, pricingActions] = useSectionState()
  const [configSection, configActions] = useSectionState()

  async function saveHours() {
    hoursActions.setSaving(true)
    hoursActions.clearStatus()
    const result = await updateCourseHours(courseId, hours)
    hoursActions.setSaving(false)
    if (result.error) hoursActions.setError(result.error)
    else hoursActions.setSuccess()
  }

  async function savePricing() {
    pricingActions.setSaving(true)
    pricingActions.clearStatus()
    const result = await updateCoursePricing(courseId, pricing)
    pricingActions.setSaving(false)
    if (result.error) pricingActions.setError(result.error)
    else pricingActions.setSuccess()
  }

  async function saveConfig() {
    configActions.setSaving(true)
    configActions.clearStatus()
    const result = await updateTeeSheetConfig(courseId, config)
    configActions.setSaving(false)
    if (result.error) configActions.setError(result.error)
    else configActions.setSuccess()
  }

  function updateConfig(patch: Partial<TeeSheetConfig>) {
    setConfig(c => ({ ...c, ...patch }))
  }

  return (
    <div className="space-y-4">
      {/* Section 1: Hours of Operation */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-none">
        <button
          type="button"
          onClick={hoursActions.toggle}
          aria-expanded={hoursSection.open}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-base font-semibold text-[#1A1A1A]">Hours of Operation</span>
          {hoursSection.open ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {hoursSection.open && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="pt-4">
              <HoursEditor value={hours} onChange={setHours} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={saveHours}
                disabled={hoursSection.saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {hoursSection.saving ? 'Saving...' : 'Save Hours'}
              </button>
              {hoursSection.success && (
                <span className="text-sm text-green-700 font-medium">Saved!</span>
              )}
              {hoursSection.error && (
                <span className="text-sm text-red-600">{hoursSection.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Pricing Tiers */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-none">
        <button
          type="button"
          onClick={pricingActions.toggle}
          aria-expanded={pricingSection.open}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-base font-semibold text-[#1A1A1A]">Pricing Tiers</span>
          {pricingSection.open ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {pricingSection.open && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="pt-4">
              <PricingEditor value={pricing} onChange={setPricing} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={savePricing}
                disabled={pricingSection.saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pricingSection.saving ? 'Saving...' : 'Save Pricing'}
              </button>
              {pricingSection.success && (
                <span className="text-sm text-green-700 font-medium">Saved!</span>
              )}
              {pricingSection.error && (
                <span className="text-sm text-red-600">{pricingSection.error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Tee Sheet Config */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-none">
        <button
          type="button"
          onClick={configActions.toggle}
          aria-expanded={configSection.open}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-base font-semibold text-[#1A1A1A]">Tee Sheet Configuration</span>
          {configSection.open ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {configSection.open && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="pt-4 space-y-4">
              {/* Interval between tee times */}
              <div className="space-y-1.5">
                <label htmlFor="interval_minutes" className="block text-sm font-medium text-gray-700">
                  Interval between tee times (minutes)
                </label>
                <input
                  id="interval_minutes"
                  type="number"
                  min={5}
                  max={60}
                  value={config.interval_minutes}
                  onChange={e => updateConfig({ interval_minutes: parseInt(e.target.value, 10) || 10 })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-32"
                />
              </div>

              {/* Max players per slot */}
              <div className="space-y-1.5">
                <label htmlFor="max_players" className="block text-sm font-medium text-gray-700">
                  Max players per slot
                </label>
                <input
                  id="max_players"
                  type="number"
                  min={1}
                  max={8}
                  value={config.max_players}
                  onChange={e => updateConfig({ max_players: parseInt(e.target.value, 10) || 4 })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-32"
                />
              </div>

              {/* Advance booking days */}
              <div className="space-y-1.5">
                <label htmlFor="advance_booking_days" className="block text-sm font-medium text-gray-700">
                  Advance booking days
                </label>
                <input
                  id="advance_booking_days"
                  type="number"
                  min={1}
                  max={365}
                  value={config.advance_booking_days}
                  onChange={e => updateConfig({ advance_booking_days: parseInt(e.target.value, 10) || 7 })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-32"
                />
              </div>

              {/* Cart policy */}
              <div className="space-y-1.5">
                <label htmlFor="cart_policy" className="block text-sm font-medium text-gray-700">
                  Cart policy
                </label>
                <select
                  id="cart_policy"
                  value={config.cart_policy}
                  onChange={e => updateConfig({ cart_policy: e.target.value as TeeSheetConfig['cart_policy'] })}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-64"
                >
                  <option value="optional">Optional (members choose)</option>
                  <option value="mandatory">Required (cart required)</option>
                  <option value="walking_only">Walking only (no carts)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={saveConfig}
                disabled={configSection.saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {configSection.saving ? 'Saving...' : 'Save Configuration'}
              </button>
              {configSection.success && (
                <span className="text-sm text-green-700 font-medium">Saved!</span>
              )}
              {configSection.error && (
                <span className="text-sm text-red-600">{configSection.error}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
