import Link from 'next/link'
import EditTierModal from '@/components/admin/EditTierModal'
import CancelMembershipModal from '@/components/admin/CancelMembershipModal'

interface MemberDetailHeaderProps {
  userId: string
  fullName: string | null
  email: string
  joinDate: string
  tier: string | null
  status: string | null
  isFoundingMember: boolean
  periodEndDate: string | null
  hasMembership: boolean
}

const tierColor: Record<string, string> = {
  ace: 'bg-[#1B4332] text-[#FAF7F2]',
  eagle: 'bg-[#E0A800] text-[#1A1A1A]',
  fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
}
const statusColor: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  canceled: 'bg-red-50 text-red-700',
  past_due: 'bg-amber-50 text-amber-700',
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function MemberDetailHeader({
  userId, fullName, email, joinDate, tier, status, isFoundingMember, periodEndDate, hasMembership,
}: MemberDetailHeaderProps) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-14 w-14 rounded-full bg-[#1B4332] flex items-center justify-center text-[#FAF7F2] font-bold text-xl">
          {initials(fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[#1A1A1A]">{fullName || '—'}</h1>
            {tier && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tierColor[tier] ?? tierColor.fairway}`}>
                {tier}
              </span>
            )}
            {status && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[status] ?? 'bg-gray-50 text-gray-700'}`}>
                {status.replace('_', ' ')}
              </span>
            )}
            {isFoundingMember && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700">
                ★ Founding
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7770]">{email}</p>
          <p className="text-xs text-[#6B7770] mt-0.5">
            Joined {new Date(joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/admin/users" className="text-sm text-[#6B7770] hover:text-[#1A1A1A] mr-2">← All members</Link>
          <EditTierModal userId={userId} currentTier={tier} />
          <CancelMembershipModal userId={userId} periodEndDate={periodEndDate} hasMembership={hasMembership} />
        </div>
      </div>
    </div>
  )
}
