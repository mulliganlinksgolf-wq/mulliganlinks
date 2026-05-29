import {
  BARTER_TEE_TIMES_PER_DAY,
  OPERATING_DAYS,
  TYPICAL_PEAK_RATE,
  TYPICAL_ANNUAL_BARTER_LABEL,
} from '@/lib/barter-math'

// One bookable tee time = one rack-rate unit. Every number below derives from the
// shared barter-math constants so the receipt reconciles with the hero headline:
// barter slots/day x rack rate x operating days = the displayed annual figure.
const RACK = TYPICAL_PEAK_RATE // $/tee time

const SLOTS = [
  { t: '6:20', name: 'Mahoney',        barter: false },
  { t: '6:30', name: 'GolfNow barter', barter: true },
  { t: '6:40', name: 'Cohen',          barter: false },
  { t: '6:50', name: 'Reuther',        barter: false },
  { t: '7:00', name: 'Patel',          barter: false },
  { t: '7:10', name: 'Hernandez',      barter: false },
  { t: '7:20', name: 'GolfNow barter', barter: true },
  { t: '7:30', name: 'Spadafora',      barter: false },
  { t: '7:40', name: 'Bauer',          barter: false },
]

const bookedCount = SLOTS.filter((s) => !s.barter).length
const subtotal = bookedCount * RACK // kept revenue for the wave
const lostPerDay = BARTER_TEE_TIMES_PER_DAY * RACK // barter slots x rack rate

export function ReceiptCard() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="w-full max-w-[340px] relative font-mono px-6 pt-5 pb-6"
        style={{
          background: '#EFE2C4',
          boxShadow:
            '0 22px 50px rgba(15,61,46,0.28), inset 0 0 0 1px rgba(15,61,46,0.18)',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(15,61,46,0.015) 0 1px, transparent 1px 4px)',
        }}
      >
        <div
          aria-hidden
          className="absolute -top-[6px] left-0 right-0 h-[6px]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 6px 6px, transparent 3px, #EFE2C4 3.5px)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 -6px',
          }}
        />

        <div className="text-center pb-3 border-b border-dashed border-[#0F3D2E]">
          <p
            className="font-display text-[18px] text-[#0F3D2E] tracking-[-0.01em]"
            style={{ fontWeight: 400 }}
          >
            Plum Hollow CC
          </p>
          <p className="mt-1 text-[9px] tracking-[0.22em] uppercase text-[#6B7770] font-semibold">
            Today · Sat 21 May · Wave 01
          </p>
        </div>

        <div className="grid grid-cols-[38px_1fr_50px] pt-2.5 pb-1.5 text-[8px] tracking-[0.2em] uppercase font-bold text-[#6B7770] border-b border-[#0F3D2E]/40">
          <span>Time</span>
          <span>Booking</span>
          <span className="text-right">$</span>
        </div>

        {SLOTS.map((r) => (
          <div
            key={r.t}
            className="grid grid-cols-[38px_1fr_50px] py-1.5 border-b border-dotted border-[#0F3D2E]/30 items-baseline"
            style={
              r.barter
                ? { background: 'rgba(194,74,59,0.10)', margin: '0 -8px', padding: '6px 8px' }
                : {}
            }
          >
            <span className="text-[10.5px] text-[#0F3D2E] font-bold">{r.t}</span>
            <span
              className={
                r.barter
                  ? 'text-[11px] text-[#C24A3B] font-bold uppercase tracking-[0.05em]'
                  : 'text-[11px] text-[#1A1A1A] font-medium'
              }
            >
              {r.name}
            </span>
            <span
              className={`text-[11px] font-bold text-right ${
                r.barter ? 'text-[#C24A3B] line-through decoration-[#C24A3B]' : 'text-[#0F3D2E]'
              }`}
            >
              {r.barter ? `— ${RACK}` : RACK}
            </span>
          </div>
        ))}

        <div className="mt-2.5 pt-2.5 border-t-2 border-[#0F3D2E]">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] tracking-[0.2em] uppercase text-[#6B7770] font-bold">
              Today subtotal
            </span>
            <span
              className="font-display text-[22px] text-[#0F3D2E]"
              style={{ fontWeight: 400 }}
            >
              ${subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-[9px] tracking-[0.2em] uppercase text-[#C24A3B] font-bold">
              Lost to barter
            </span>
            <span
              className="font-display text-[18px] text-[#C24A3B]"
              style={{ fontWeight: 400 }}
            >
              − ${lostPerDay.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-3.5 px-3 py-2.5 bg-[#082419] text-[#F4F1EA] text-center">
          <p className="text-[8.5px] tracking-[0.22em] uppercase text-[#F4F1EA]/65 font-bold mb-1">
            × {OPERATING_DAYS} days =
          </p>
          <p
            className="font-display text-[26px] tracking-[-0.02em]"
            style={{ fontWeight: 400 }}
          >
            {TYPICAL_ANNUAL_BARTER_LABEL}<span className="text-[#E0A800]">/yr</span>
          </p>
        </div>

        <p className="mt-3 text-center text-[8.5px] italic text-[#6B7770]">
          Receipt, Plum Hollow CC, today&apos;s wave
        </p>
      </div>
    </div>
  )
}
