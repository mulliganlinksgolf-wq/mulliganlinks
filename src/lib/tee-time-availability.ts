import { createClient } from '@/lib/supabase/server';

export type OccupancyRow = {
  tee_time_id: string;
  scheduled_at: string;
  max_players: number;
  players_booked: number;
  spots_remaining: number;
  has_self_grouped_bookings: boolean;
};

export type TeeTimeAvailability = {
  teeTimeId: string;
  scheduledAt: string;
  spotsRemaining: number;
  isFull: boolean;
  isPartiallyBooked: boolean;
  hasSelfGroupedBookings: boolean;
};

export function computeAvailability(row: OccupancyRow): TeeTimeAvailability {
  const spots = Math.max(0, row.spots_remaining);
  return {
    teeTimeId: row.tee_time_id,
    scheduledAt: row.scheduled_at,
    spotsRemaining: spots,
    isFull: spots === 0,
    isPartiallyBooked: row.players_booked > 0 && spots > 0,
    hasSelfGroupedBookings: !!row.has_self_grouped_bookings,
  };
}

export async function getAvailability(params: {
  courseId: string;
  date: string; // YYYY-MM-DD, interpreted UTC
}): Promise<TeeTimeAvailability[]> {
  const supabase = await createClient();
  const start = `${params.date}T00:00:00Z`;
  const end = `${params.date}T23:59:59Z`;

  const { data, error } = await supabase
    .from('tee_time_occupancy')
    .select('tee_time_id, scheduled_at, max_players, players_booked, spots_remaining, has_self_grouped_bookings')
    .eq('course_id', params.courseId)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at');

  if (error) throw error;
  return (data ?? []).map(computeAvailability);
}
