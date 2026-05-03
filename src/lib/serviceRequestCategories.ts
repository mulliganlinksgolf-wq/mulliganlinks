export const SERVICE_REQUEST_CATEGORIES = [
  { value: 'cart_issue',     label: 'Cart issue',                  icon: '🛺' },
  { value: 'lost_club',      label: 'Left a club on the course',   icon: '🏌️' },
  { value: 'beverage_cart',  label: 'Beverage cart request',       icon: '🥤' },
  { value: 'pace_of_play',   label: 'Pace of play concern',        icon: '⏱️' },
  { value: 'ranger_needed',  label: 'Ranger requested',            icon: '📍' },
  { value: 'other',          label: 'Other request',               icon: '💬' },
] as const

export type ServiceRequestCategory =
  typeof SERVICE_REQUEST_CATEGORIES[number]['value']

export function isValidCategory(value: string): value is ServiceRequestCategory {
  return SERVICE_REQUEST_CATEGORIES.some(c => c.value === value)
}
