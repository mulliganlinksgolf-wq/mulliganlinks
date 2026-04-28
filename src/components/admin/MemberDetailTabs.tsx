'use client'
import { useState } from 'react'
import ProfileTab from '@/components/admin/tabs/ProfileTab'
import MembershipTab from '@/components/admin/tabs/MembershipTab'
import PaymentsTab from '@/components/admin/tabs/PaymentsTab'
import BookingsTab from '@/components/admin/tabs/BookingsTab'
import CreditsTab from '@/components/admin/tabs/CreditsTab'
import PointsTab from '@/components/admin/tabs/PointsTab'
import NotesTab from '@/components/admin/tabs/NotesTab'

const TABS = ['Profile', 'Membership', 'Payments', 'Bookings', 'Credits', 'Points', 'Notes'] as const
type Tab = typeof TABS[number]

interface MemberDetailTabsProps {
  userId: string
  profile: any
  membership: any
  bookings: any[]
  credits: any[]
  points: any[]
  notes: any[]
  courses: { id: string; name: string }[]
  homeCourse: { id: string; name: string } | null
}

export default function MemberDetailTabs({
  userId, profile, membership, bookings, credits, points, notes, courses, homeCourse,
}: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile')

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
      <div className="flex border-b border-black/5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[#1B4332] text-[#1B4332]'
                : 'text-[#6B7770] hover:text-[#1A1A1A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === 'Profile' && <ProfileTab userId={userId} profile={profile} courses={courses} homeCourse={homeCourse} />}
        {activeTab === 'Membership' && <MembershipTab membership={membership} isFoundingMember={profile.founding_member} />}
        {activeTab === 'Payments' && <PaymentsTab bookings={bookings} membership={membership} />}
        {activeTab === 'Bookings' && <BookingsTab bookings={bookings} />}
        {activeTab === 'Credits' && <CreditsTab userId={userId} credits={credits} />}
        {activeTab === 'Points' && <PointsTab userId={userId} points={points} />}
        {activeTab === 'Notes' && <NotesTab userId={userId} notes={notes} />}
      </div>
    </div>
  )
}
