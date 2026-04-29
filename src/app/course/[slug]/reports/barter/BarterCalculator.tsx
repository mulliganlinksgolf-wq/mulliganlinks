'use client'

import { useState } from 'react'
import { calcBarterSavings, GOLFNOW_BARTER_RATE } from '@/lib/reports/barter'

export default function BarterCalculator({
  defaultRounds,
  defaultAvgGreenFee,
  monthsElapsed,
}: {
  defaultRounds: number
  defaultAvgGreenFee: number
  monthsElapsed: number
}) {
  const [rounds, setRounds] = useState(defaultRounds)
  const [avgGreenFee, setAvgGreenFee] = useState(defaultAvgGreenFee)

  const savings = calcBarterSavings({ rounds, avgGreenFee, waitlistFills: 0, monthsElapsed })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
            Total rounds this month
          </label>
          <input
            type="number"
            value={rounds}
            onChange={e => setRounds(Number(e.target.value))}
            min={0}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
            Avg green fee ($)
          </label>
          <input
            type="number"
            value={avgGreenFee}
            onChange={e => setAvgGreenFee(Number(e.target.value))}
            min={0}
            step={0.01}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-center">
        <p className="text-sm text-amber-800 mb-2">
          If you were still on GolfNow ({Math.round(GOLFNOW_BARTER_RATE * 100)}% barter), you would have surrendered approximately
        </p>
        <div className="text-4xl font-bold text-amber-700 my-3">
          ${savings.golfnowCostMtd.toLocaleString()}
        </div>
        <p className="text-sm text-amber-700">in tee time value this month</p>
        {monthsElapsed > 1 && (
          <p className="text-xs text-amber-600 mt-2">
            YTD barter cost avoided: <strong>${savings.golfnowCostYtd.toLocaleString()}</strong>
          </p>
        )}
      </div>

      <div className="bg-[#1B4332] rounded-xl p-6 text-center text-[#FAF7F2]">
        <p className="text-sm text-[#FAF7F2]/70 mb-1">Your TeeAhead cost this month</p>
        <div className="text-5xl font-bold">$0</div>
      </div>
    </div>
  )
}
