'use client'

import { OutingTable } from '@/components/crm/OutingTable'
import { exportCsv } from '@/lib/crm/csv'
import type { CrmOuting } from '@/lib/crm/types'

export function OutingsTableWrapper({ outings }: { outings: CrmOuting[] }) {
  function handleExport() {
    exportCsv(
      outings.map((o) => ({
        contact_name: o.contact_name,
        contact_email: o.contact_email,
        contact_phone: o.contact_phone,
        event_date: o.event_date,
        num_golfers: o.num_golfers,
        preferred_course: o.preferred_course,
        budget_estimate: o.budget_estimate,
        status: o.status,
        assigned_to: o.assigned_to,
      })),
      'teeahead-outings'
    )
  }
  return <OutingTable initialOutings={outings} onExportCsv={handleExport} />
}
