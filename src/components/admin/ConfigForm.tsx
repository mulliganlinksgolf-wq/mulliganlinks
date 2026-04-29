import { saveConfigValue } from '@/app/admin/config/actions'

interface ConfigFormProps {
  config: Record<string, string>
}

export default function ConfigForm({ config }: ConfigFormProps) {
  const isLive = config['launch_mode'] === 'live'

  function ConfigField({ label, configKey, type = 'text', hint }: { label: string; configKey: string; type?: string; hint?: string }) {
    return (
      <form action={saveConfigValue} className="flex items-center justify-between gap-4">
        <input type="hidden" name="key" value={configKey} />
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
          {hint && <p className="text-xs text-[#6B7770]">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            name="value"
            type={type}
            defaultValue={config[configKey] ?? ''}
            className="w-44 rounded-lg border border-black/15 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
          <button type="submit" className="rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1B4332]/90">
            Save
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-10">
      {/* Launch Mode */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Launch Mode</h2>
        <div className="flex items-center justify-between bg-white rounded-xl ring-1 ring-black/5 p-5">
          <div>
            <p className="font-medium text-[#1A1A1A]">Site Mode</p>
            <p className="text-xs text-[#6B7770] mt-0.5">
              {isLive
                ? 'Live Mode — full product active. Bookings and signups enabled.'
                : 'Waitlist Mode — coming-soon page shown. Bookings and signups disabled.'}
            </p>
          </div>
          <form action={saveConfigValue}>
            <input type="hidden" name="key" value="launch_mode" />
            <input type="hidden" name="value" value={isLive ? 'waitlist' : 'live'} />
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isLive
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-[#1B4332] text-white hover:bg-[#1B4332]/90'
              }`}
            >
              {isLive ? 'Switch to Waitlist Mode' : 'Go Live ✓'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <ConfigField label="Metro Area Name" configKey="metro_area_name" />
          <ConfigField label="Founding Golfer Cap" configKey="founding_golfer_cap" type="number" />
        </div>
      </section>

      {/* Membership Pricing Display */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Membership Pricing Display</h2>
        <p className="text-xs text-[#6B7770]">Display values only. Stripe product prices are managed in the Stripe dashboard.</p>
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <ConfigField label="Eagle annual price ($/yr)" configKey="price_eagle_annual" type="number" />
          <ConfigField label="Ace annual price ($/yr)" configKey="price_ace_annual" type="number" />
          <ConfigField label="Eagle monthly credit value ($)" configKey="price_eagle_monthly_credit" type="number" />
          <ConfigField label="Ace monthly credit value ($)" configKey="price_ace_monthly_credit" type="number" />
        </div>
      </section>

      {/* Platform Fees */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Platform Fees</h2>
        <p className="text-xs text-[#6B7770]">Changes take effect immediately for new bookings.</p>
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <ConfigField label="Fairway tier per-booking fee ($)" configKey="fee_fairway_booking" type="number" />
          <ConfigField label="Eagle / Ace per-booking fee ($)" configKey="fee_paid_booking" type="number" hint="Expected: $0.00" />
        </div>
      </section>

      {/* Feature Flags */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Feature Flags</h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-black/5">
          {[
            { label: 'Golfer Waitlist', key: 'flag_golfer_waitlist', desc: 'Show/hide the golfer waitlist signup form' },
            { label: 'Course Partner Waitlist', key: 'flag_course_waitlist', desc: 'Show/hide the course partner application' },
            { label: 'Membership Signups', key: 'flag_membership_signups', desc: 'Enable/disable new membership checkout' },
            { label: 'Tee Time Bookings', key: 'flag_tee_time_bookings', desc: 'Enable/disable tee time booking for members' },
          ].map(flag => {
            const isOn = config[flag.key] === 'true'
            return (
              <div key={flag.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{flag.label}</p>
                  <p className="text-xs text-[#6B7770]">{flag.desc}</p>
                </div>
                <form action={saveConfigValue}>
                  <input type="hidden" name="key" value={flag.key} />
                  <input type="hidden" name="value" value={isOn ? 'false' : 'true'} />
                  <button
                    type="submit"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? 'bg-[#1B4332]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
