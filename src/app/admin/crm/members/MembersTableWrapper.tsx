'use client'

import { MemberTable } from '@/components/crm/MemberTable'
import { exportCsv } from '@/lib/crm/csv'
import type { CrmMember } from '@/lib/crm/types'

export function MembersTableWrapper({ members }: { members: CrmMember[] }) {
  function handleExport() {
    exportCsv(
      members.map((m) => ({
        name: m.name,
        email: m.email,
        phone: m.phone,
        membership_tier: m.membership_tier,
        home_course: m.home_course,
        join_date: m.join_date,
        lifetime_spend: m.lifetime_spend,
        status: m.status,
      })),
      'teeahead-members'
    )
  }
  return <MemberTable initialMembers={members} onExportCsv={handleExport} />
}
