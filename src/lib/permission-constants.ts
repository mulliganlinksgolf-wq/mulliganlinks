// Server-safe permission constants and types.
// Lives separately from src/lib/permissions.ts so client components can
// import these without pulling in next/headers via supabase/server.

export const COURSE_PERMISSIONS = [
  'view_tee_sheet',
  'manage_bookings',
  'check_in_golfers',
  'view_payments',
  'void_transaction',
  'override_price',
  'comp_round',
  'modify_member_tier',
  'delete_booking',
  'view_reports',
  'export_data',
  'manage_staff',
  'manage_course_settings',
  'manage_outings',
] as const

export type CoursePermission = typeof COURSE_PERMISSIONS[number]

export const PERMISSION_LABELS: Record<CoursePermission, string> = {
  view_tee_sheet:         'View tee sheet',
  manage_bookings:        'Create and edit bookings',
  check_in_golfers:       'Check in golfers (QR scan)',
  view_payments:          'View payments and revenue',
  void_transaction:       'Void or refund a transaction',
  override_price:         'Override the default rate on a booking',
  comp_round:             'Comp a round (zero charge)',
  modify_member_tier:     "Change a member's Eagle/Ace tier",
  delete_booking:         'Permanently delete a booking',
  view_reports:           'View reports dashboard',
  export_data:            'Export CSV data',
  manage_staff:           'Invite, remove, and manage staff',
  manage_course_settings: 'Edit course settings and integrations',
  manage_outings:         'Approve and manage outings',
}
