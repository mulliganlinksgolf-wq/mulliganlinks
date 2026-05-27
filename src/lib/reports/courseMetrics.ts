import { createAdminClient } from '@/lib/supabase/admin'

export function calcWaitlistFillRate({ fills, totalCancellations }: { fills: number; totalCancellations: number }): number {
  if (totalCancellations === 0) return 0
  return Math.round((fills / totalCancellations) * 100 * 10) / 10
}

export function calcStaffHoursSaved(waitlistFills: number): number {
  return Math.round((waitlistFills * 15) / 60 * 10) / 10
}

export interface CourseReportKpis {
  roundsThisMonth: number
  revenueThisMonth: number
  membersTotal: number
  waitlistFillsThisMonth: number
  avgGreenFee: number
}

export async function getCourseReportKpis(
  courseId: string,
  from?: string,
  to?: string,
): Promise<CourseReportKpis> {
  const admin = createAdminClient()

  let query = admin.from('crm_course_metrics').select('*').eq('course_id', courseId)
  if (from && to) {
    query = query.gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7))
  } else {
    query = query.eq('month', new Date().toISOString().slice(0, 7))
  }

  const { data, error } = await query
  if (error) throw new Error(`[getCourseReportKpis] metrics query failed: ${error.message}`)

  const rows = data ?? []
  const totalRevenue = rows.reduce((s, r) => s + Number(r.green_fee_revenue ?? 0), 0)
  const totalRounds = rows.reduce((s, r) => s + (r.rounds_booked ?? 0), 0)
  const avgGreenFee = totalRounds > 0 ? totalRevenue / totalRounds : 0

  return {
    roundsThisMonth: totalRounds,
    revenueThisMonth: totalRevenue,
    membersTotal: rows.reduce((s, r) => s + (r.members_attributed ?? 0), 0),
    waitlistFillsThisMonth: rows.reduce((s, r) => s + (r.waitlist_fills ?? 0), 0),
    avgGreenFee,
  }
}

export interface CourseMetricRow {
  month: string
  rounds_booked: number
  green_fee_revenue: number
  avg_green_fee: number
  members_attributed: number
  points_earned: number
  points_redeemed: number
  waitlist_fills: number
  total_cancellations: number
  cancellations_recovered_revenue: number
}

export async function getCourseMetricHistory(
  courseId: string,
  months = 12,
  from?: string,
  to?: string,
): Promise<CourseMetricRow[]> {
  const admin = createAdminClient()

  if (from && to) {
    const { data, error } = await admin
      .from('crm_course_metrics')
      .select('*')
      .eq('course_id', courseId)
      .gte('month', from.slice(0, 7))
      .lte('month', to.slice(0, 7))
      .order('month', { ascending: true })
    if (error) throw new Error(`[getCourseMetricHistory] query failed: ${error.message}`)
    return (data ?? []) as CourseMetricRow[]
  }

  const { data, error } = await admin
    .from('crm_course_metrics')
    .select('*')
    .eq('course_id', courseId)
    .order('month', { ascending: false })
    .limit(months)
  if (error) throw new Error(`[getCourseMetricHistory] query failed: ${error.message}`)
  return ((data ?? []).reverse() as CourseMetricRow[])
}

// ── Utilization ────────────────────────────────────────────────────────────────

function formatPeakSlot(hour: number): string {
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h}:00 ${hour >= 12 ? 'PM' : 'AM'}`
}

export interface UtilizationCell {
  dayOfWeek: number   // 0=Sun … 6=Sat (JS convention)
  hourSlot: number    // local hour 0–23
  count: number
  avgParty: number
}

export interface UtilizationData {
  cells: UtilizationCell[]
  peakDay: string
  peakSlot: string
  avgPartySize: number
  offPeakPct: number
  monthlySummary: Array<{ month: string; rounds: number; peakDay: string; peakSlot: string; avgPartySize: number }>
}

const TZ = 'America/Detroit'
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function localDayOfWeek(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ })
    .formatToParts(new Date(iso))
  const day = parts.find(p => p.type === 'weekday')?.value ?? 'Sun'
  return DAY_NAMES.indexOf(day)
}

function localHour(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: TZ })
    .formatToParts(new Date(iso))
  return Number(parts.find(p => p.type === 'hour')?.value ?? 0)
}

export function aggregateUtilizationCells(
  slots: Array<{ scheduled_at: string; confirmedPlayers: number[] }>
): UtilizationCell[] {
  const map = new Map<string, { count: number; totalParty: number }>()
  for (const slot of slots) {
    if (slot.confirmedPlayers.length === 0) continue
    const day = localDayOfWeek(slot.scheduled_at)
    const hour = localHour(slot.scheduled_at)
    const key = `${day}:${hour}`
    const existing = map.get(key) ?? { count: 0, totalParty: 0 }
    const players = slot.confirmedPlayers.reduce((s, p) => s + p, 0)
    map.set(key, {
      count: existing.count + slot.confirmedPlayers.length,
      totalParty: existing.totalParty + players,
    })
  }
  return Array.from(map.entries()).map(([key, val]) => {
    const [day, hour] = key.split(':').map(Number)
    return {
      dayOfWeek: day,
      hourSlot: hour,
      count: val.count,
      avgParty: val.count > 0 ? Math.round((val.totalParty / val.count) * 10) / 10 : 0,
    }
  })
}

export function calcOffPeakPct(cells: UtilizationCell[]): number {
  const total = cells.reduce((s, c) => s + c.count, 0)
  if (total === 0) return 0
  const offPeak = cells
    .filter(c => c.hourSlot < 10 || c.hourSlot >= 15)
    .reduce((s, c) => s + c.count, 0)
  return Math.round((offPeak / total) * 100)
}

export async function getUtilizationData(
  courseId: string,
  from: string,
  to: string,
): Promise<UtilizationData> {
  const admin = createAdminClient()
  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(players, status)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)
  if (error) throw new Error(`[getUtilizationData] ${error.message}`)

  const normalized = (slots ?? []).map(s => ({
    scheduled_at: s.scheduled_at as string,
    confirmedPlayers: (s.bookings as Array<{ players: number; status: string }>)
      .filter(b => b.status === 'confirmed')
      .map(b => b.players),
  }))

  const cells = aggregateUtilizationCells(normalized)

  const byDay = new Map<number, number>()
  for (const c of cells) byDay.set(c.dayOfWeek, (byDay.get(c.dayOfWeek) ?? 0) + c.count)
  let peakDayNum = -1, peakDayCount = 0
  for (const [d, cnt] of byDay) { if (cnt > peakDayCount) { peakDayCount = cnt; peakDayNum = d } }
  const peakDay = DAY_FULL[peakDayNum] ?? '—'

  const topCell = [...cells].sort((a, b) => b.count - a.count)[0]
  const ph = topCell?.hourSlot ?? 0
  const peakSlotLabel = topCell ? formatPeakSlot(ph) : '—'

  const allBookings = cells.reduce((s, c) => s + c.count, 0)
  const totalParty = normalized.flatMap(s => s.confirmedPlayers).reduce((s, p) => s + p, 0)
  const avgPartySize = allBookings > 0 ? Math.round((totalParty / allBookings) * 10) / 10 : 0
  const offPeakPct = calcOffPeakPct(cells)

  // Group slots by month for per-month peak day/slot computation
  const monthSlotMap = new Map<string, Array<{ scheduled_at: string; confirmedPlayers: number[] }>>()
  for (const slot of normalized) {
    if (slot.confirmedPlayers.length === 0) continue
    const month = slot.scheduled_at.slice(0, 7)
    const existing = monthSlotMap.get(month) ?? []
    existing.push(slot)
    monthSlotMap.set(month, existing)
  }

  const monthMap = new Map<string, { rounds: number; totalParty: number }>()
  for (const slot of normalized) {
    if (slot.confirmedPlayers.length === 0) continue
    const month = slot.scheduled_at.slice(0, 7)
    const existing = monthMap.get(month) ?? { rounds: 0, totalParty: 0 }
    monthMap.set(month, {
      rounds: existing.rounds + slot.confirmedPlayers.length,
      totalParty: existing.totalParty + slot.confirmedPlayers.reduce((s, p) => s + p, 0),
    })
  }
  const monthlySummary = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, val]) => {
      // Compute peak day and peak slot for this month
      const monthCells = aggregateUtilizationCells(monthSlotMap.get(month) ?? [])
      const mByDay = new Map<number, number>()
      for (const c of monthCells) mByDay.set(c.dayOfWeek, (mByDay.get(c.dayOfWeek) ?? 0) + c.count)
      let mPeakDayNum = -1, mPeakDayCount = 0
      for (const [d, cnt] of mByDay) { if (cnt > mPeakDayCount) { mPeakDayCount = cnt; mPeakDayNum = d } }
      const mPeakDay = DAY_FULL[mPeakDayNum] ?? '—'
      const mTopCell = [...monthCells].sort((a, b) => b.count - a.count)[0]
      const mph = mTopCell?.hourSlot ?? 0
      const mPeakSlot = mTopCell ? formatPeakSlot(mph) : '—'
      return {
        month,
        rounds: val.rounds,
        peakDay: mPeakDay,
        peakSlot: mPeakSlot,
        avgPartySize: val.rounds > 0 ? Math.round((val.totalParty / val.rounds) * 10) / 10 : 0,
      }
    })

  return { cells, peakDay, peakSlot: peakSlotLabel, avgPartySize, offPeakPct, monthlySummary }
}

// ── Loyalty ────────────────────────────────────────────────────────────────────

export interface LoyaltyAggregate {
  visitsByUser: Map<string, number>
  avgVisitsPerMember: number
  singleVisitCount: number
  threeOrMorePct: number
}

export function aggregateLoyaltyData(
  bookings: Array<{ user_id: string | null; players: number }>
): LoyaltyAggregate {
  const map = new Map<string, number>()
  for (const b of bookings) {
    if (!b.user_id) continue
    map.set(b.user_id, (map.get(b.user_id) ?? 0) + 1)
  }
  const counts = Array.from(map.values())
  const total = counts.reduce((s, c) => s + c, 0)
  const avgVisitsPerMember = map.size > 0 ? Math.round((total / map.size) * 10) / 10 : 0
  const singleVisitCount = counts.filter(c => c === 1).length
  const threeOrMorePct = map.size > 0
    ? Math.round((counts.filter(c => c >= 3).length / map.size) * 100)
    : 0
  return { visitsByUser: map, avgVisitsPerMember, singleVisitCount, threeOrMorePct }
}

export interface LoyaltyVisitor {
  userId: string
  fullName: string
  tier: string
  totalVisits: number
  lastVisit: string
}

export interface LoyaltyData {
  avgVisitsPerMember: number
  threeOrMorePct: number
  singleVisitCount: number
  topVisitors: LoyaltyVisitor[]
  frequencyBuckets: Array<{ label: string; count: number }>
}

export async function getLoyaltyData(
  courseId: string,
  from: string,
  to: string,
): Promise<LoyaltyData> {
  const admin = createAdminClient()
  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(user_id, players, status)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)
  if (error) throw new Error(`[getLoyaltyData] ${error.message}`)

  const flatBookings = (slots ?? []).flatMap(s =>
    (s.bookings as Array<{ user_id: string | null; players: number; status: string }>)
      .filter(b => b.status === 'confirmed' && b.user_id)
      .map(b => ({ user_id: b.user_id!, players: b.players, scheduled_at: s.scheduled_at as string }))
  )

  const agg = aggregateLoyaltyData(flatBookings)

  const lastVisitMap = new Map<string, string>()
  for (const b of flatBookings) {
    const existing = lastVisitMap.get(b.user_id) ?? ''
    if (b.scheduled_at > existing) lastVisitMap.set(b.user_id, b.scheduled_at)
  }

  const sorted = Array.from(agg.visitsByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  let topVisitors: LoyaltyVisitor[] = []
  if (sorted.length > 0) {
    const userIds = sorted.map(([id]) => id)
    const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
    const { data: memberships } = await admin.from('memberships').select('user_id, tier').in('user_id', userIds).eq('status', 'active')
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.full_name ?? 'Member']))
    const tierMap = new Map((memberships ?? []).map(m => [m.user_id, m.tier as string]))
    topVisitors = sorted.map(([userId, visits]) => ({
      userId,
      fullName: profileMap.get(userId) ?? 'Member',
      tier: tierMap.get(userId) ?? 'fairway',
      totalVisits: visits,
      lastVisit: lastVisitMap.get(userId)?.slice(0, 10) ?? '',
    }))
  }

  const frequencyBuckets = [
    { label: '1×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 1).length },
    { label: '2×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 2).length },
    { label: '3×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 3).length },
    { label: '4×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 4).length },
    { label: '5+×', count: Array.from(agg.visitsByUser.values()).filter(v => v >= 5).length },
  ]

  return {
    avgVisitsPerMember: agg.avgVisitsPerMember,
    threeOrMorePct: agg.threeOrMorePct,
    singleVisitCount: agg.singleVisitCount,
    topVisitors,
    frequencyBuckets,
  }
}

// ── Comp Rounds ────────────────────────────────────────────────────────────────

const DEFAULT_GREEN_FEE_CENTS = 4500 // fallback when no paid rounds exist in range

export interface CompAggregate {
  redeemed: number
  estimatedCostCents: number
}

export function aggregateCompData(
  bookings: Array<{ redemption_type: string | null; total_paid: number }>
): CompAggregate {
  const comps = bookings.filter(b => b.redemption_type === 'complimentary')
  const estimatedCostCents = comps.reduce((s, b) => s + Math.round(b.total_paid * 100), 0)
  return { redeemed: comps.length, estimatedCostCents }
}

export interface CompMonthRow {
  month: string
  redeemed: number
}

export interface CompData {
  totalRedeemed: number
  estimatedCostCents: number
  membersUsingComps: number
  avgCompsPerMember: number
  monthly: CompMonthRow[]
  perMember: Array<{ userId: string; fullName: string; tier: string; redeemed: number; lastRedemption: string }>
}

export async function getCompData(
  courseId: string,
  from: string,
  to: string,
): Promise<CompData> {
  const admin = createAdminClient()
  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(user_id, status, redemption_type, total_paid)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)
  if (error) throw new Error(`[getCompData] ${error.message}`)

  const flatBookings = (slots ?? []).flatMap(s =>
    (s.bookings as Array<{ user_id: string | null; status: string; redemption_type: string | null; total_paid: number }>)
      .filter(b => b.status === 'confirmed')
      .map(b => ({ ...b, scheduled_at: s.scheduled_at as string }))
  )

  const total = flatBookings.length
  const compBookings = flatBookings.filter(b => b.redemption_type === 'complimentary')
  const totalRedeemed = compBookings.length

  const avgGreenFeeCents = total > 0
    ? Math.round(flatBookings.reduce((s, b) => s + Math.round((b.total_paid ?? 0) * 100), 0) / total)
    : DEFAULT_GREEN_FEE_CENTS
  const estimatedCostCents = totalRedeemed * avgGreenFeeCents

  const monthMap = new Map<string, number>()
  for (const b of compBookings) {
    const month = b.scheduled_at.slice(0, 7)
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1)
  }
  const monthly: CompMonthRow[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month,
      redeemed: count,
    }))

  const userMap = new Map<string, { count: number; lastRedemption: string }>()
  for (const b of compBookings) {
    if (!b.user_id) continue
    const existing = userMap.get(b.user_id) ?? { count: 0, lastRedemption: '' }
    userMap.set(b.user_id, {
      count: existing.count + 1,
      lastRedemption: b.scheduled_at > existing.lastRedemption ? b.scheduled_at.slice(0, 10) : existing.lastRedemption,
    })
  }

  let perMember: CompData['perMember'] = []
  if (userMap.size > 0) {
    const userIds = Array.from(userMap.keys())
    const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
    const { data: memberships } = await admin.from('memberships').select('user_id, tier').in('user_id', userIds).eq('status', 'active')
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.full_name ?? 'Member']))
    const tierMap = new Map((memberships ?? []).map(m => [m.user_id, m.tier as string]))
    perMember = Array.from(userMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([userId, val]) => ({
        userId,
        fullName: profileMap.get(userId) ?? 'Member',
        tier: tierMap.get(userId) ?? 'fairway',
        redeemed: val.count,
        lastRedemption: val.lastRedemption,
      }))
  }

  const membersUsingComps = userMap.size
  const avgCompsPerMember = membersUsingComps > 0 ? Math.round((totalRedeemed / membersUsingComps) * 10) / 10 : 0

  return { totalRedeemed, estimatedCostCents, membersUsingComps, avgCompsPerMember, monthly, perMember }
}

// ── Guest Passes & Referrals ───────────────────────────────────────────────────

export interface GuestData {
  passesRedeemed: number
  guestToMemberConversions: number
  membersViaReferral: number
  totalAttributions: number
  monthly: Array<{ month: string; redemptions: number }>
  details: Array<{ userId: string; fullName: string; source: string; joinDate: string; tier: string }>
}

export async function getGuestData(
  courseId: string,
  from: string,
  to: string,
): Promise<GuestData> {
  const admin = createAdminClient()

  const { data: slots } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(guest_pass_id, status, user_id)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)

  const passBookings = (slots ?? []).flatMap(s =>
    (s.bookings as Array<{ guest_pass_id: string | null; status: string; user_id: string | null }>)
      .filter(b => b.status === 'confirmed' && b.guest_pass_id)
      .map(b => ({ ...b, month: (s.scheduled_at as string).slice(0, 7) }))
  )
  const passesRedeemed = passBookings.length

  const monthMap = new Map<string, number>()
  for (const b of passBookings) monthMap.set(b.month, (monthMap.get(b.month) ?? 0) + 1)
  const monthly = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, redemptions: count }))

  // course_referrals table (profile_id = member who was referred)
  const { data: referrals } = await admin
    .from('course_referrals')
    .select('profile_id, attributed_at')
    .eq('course_id', courseId)
    .gte('attributed_at', `${from}T00:00:00`)
    .lte('attributed_at', `${to}T23:59:59`)

  const membersViaReferral = (referrals ?? []).length

  const guestUserIds = [...new Set(passBookings.map(b => b.user_id).filter(Boolean))] as string[]
  let guestToMemberConversions = 0
  let details: GuestData['details'] = []

  if (guestUserIds.length > 0 || membersViaReferral > 0) {
    const referralProfileIds = (referrals ?? []).map(r => r.profile_id as string)
    const allUserIds = [...new Set([...guestUserIds, ...referralProfileIds])]
    const { data: profiles } = await admin.from('profiles').select('id, full_name, created_at').in('id', allUserIds)
    const { data: memberships } = await admin.from('memberships').select('user_id, tier').in('user_id', allUserIds).eq('status', 'active')
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    const tierMap = new Map((memberships ?? []).map(m => [m.user_id, m.tier as string]))

    guestToMemberConversions = guestUserIds.filter(id => tierMap.has(id)).length

    details = [
      ...guestUserIds.map(id => ({
        userId: id,
        fullName: (profileMap.get(id) as any)?.full_name ?? 'Member',
        source: 'Guest Pass',
        joinDate: (profileMap.get(id) as any)?.created_at?.slice(0, 10) ?? '',
        tier: tierMap.get(id) ?? 'fairway',
      })),
      ...referralProfileIds.map(id => ({
        userId: id,
        fullName: (profileMap.get(id) as any)?.full_name ?? 'Member',
        source: 'Referral Link',
        joinDate: (profileMap.get(id) as any)?.created_at?.slice(0, 10) ?? '',
        tier: tierMap.get(id) ?? 'fairway',
      })),
    ]
  }

  return {
    passesRedeemed,
    guestToMemberConversions,
    membersViaReferral,
    totalAttributions: guestToMemberConversions + membersViaReferral,
    monthly,
    details,
  }
}

// ── League Performance ─────────────────────────────────────────────────────────

export interface LeagueRow {
  id: string
  name: string
  memberCount: number
  roundsPlayed: number
  holes: number
  lastActivity: string
  estRevenueCents: number
}

export interface LeagueData {
  activeLeagues: number
  totalRounds: number
  totalMembers: number
  estRevenueCents: number
  leagues: LeagueRow[]
}

export async function getLeagueData(
  courseId: string,
  from: string,
  to: string,
): Promise<LeagueData> {
  const admin = createAdminClient()

  const { data: leagues, error } = await admin
    .from('leagues')
    .select('id, name, holes, league_members(user_id)')
    .eq('course_id', courseId)
    .eq('is_active', true)
  if (error) throw new Error(`[getLeagueData] ${error.message}`)

  const { data: slots } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(user_id, status)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)

  const { data: kpisRow } = await admin
    .from('crm_course_metrics')
    .select('avg_green_fee, month')
    .eq('course_id', courseId)
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle()
  const avgGreenFeeCents = Math.round(((kpisRow as any)?.avg_green_fee ?? 45) * 100)

  const confirmedUserIds = new Set(
    (slots ?? []).flatMap(s =>
      (s.bookings as Array<{ user_id: string | null; status: string }>)
        .filter(b => b.status === 'confirmed' && b.user_id)
        .map(b => b.user_id!)
    )
  )

  let totalRounds = 0
  let totalMembers = 0

  const leagueRows: LeagueRow[] = await Promise.all(
    (leagues ?? []).map(async (league) => {
      const memberIds = new Set(
        (league.league_members as Array<{ user_id: string }>).map(m => m.user_id)
      )
      const memberCount = memberIds.size
      const roundsPlayed = Array.from(confirmedUserIds).filter(id => memberIds.has(id)).length

      const lastBookingSlot = (slots ?? [])
        .filter(s =>
          (s.bookings as Array<{ user_id: string | null; status: string }>)
            .some(b => b.status === 'confirmed' && b.user_id && memberIds.has(b.user_id))
        )
        .sort((a, b) => (b.scheduled_at as string).localeCompare(a.scheduled_at as string))[0]

      totalRounds += roundsPlayed
      totalMembers += memberCount

      return {
        id: league.id,
        name: league.name,
        memberCount,
        roundsPlayed,
        holes: league.holes ?? 18,
        lastActivity: lastBookingSlot ? (lastBookingSlot.scheduled_at as string).slice(0, 10) : '—',
        estRevenueCents: roundsPlayed * avgGreenFeeCents,
      }
    })
  )

  return {
    activeLeagues: leagueRows.length,
    totalRounds,
    totalMembers,
    estRevenueCents: totalRounds * avgGreenFeeCents,
    leagues: leagueRows,
  }
}
