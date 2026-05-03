export function estimateHole(teeTime: Date, now: Date): number | null {
  // Returns estimated current hole (1-18) based on elapsed time
  // Assumes 12 minutes per hole as default pace
  // If elapsed time is negative (before tee time), return null
  // If elapsed time > 216 minutes (18 holes), return 18
  // Round to nearest whole hole, clamp between 1 and 18

  const elapsedMinutes = (now.getTime() - teeTime.getTime()) / 60000
  if (elapsedMinutes < 0) return null
  const hole = Math.round(elapsedMinutes / 12) + 1
  return Math.min(Math.max(hole, 1), 18)
}
