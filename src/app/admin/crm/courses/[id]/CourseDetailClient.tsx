'use client'

import { useState } from 'react'
import { InlineEditField } from '@/components/crm/InlineEditField'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { EmailComposerModal } from '@/components/crm/EmailComposerModal'
import { GenerateDocModal } from '@/components/crm/GenerateDocModal'
import { updateCourse, deleteCourse } from '@/app/actions/crm/courses'
import { useRouter } from 'next/navigation'
import type { CrmCourse } from '@/lib/crm/types'

interface Props {
  course: CrmCourse
}

export function CourseDetailClient({ course }: Props) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function save(field: string, value: string) {
    await updateCourse(course.id, { [field]: value || null } as Parameters<typeof updateCourse>[1])
    router.refresh()
  }

  async function handleDelete() {
    await deleteCourse(course.id)
    router.push('/admin/crm/courses')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Details</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowActivityModal(true)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Log Activity
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Send Email
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Generate Doc
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InlineEditField label="Contact Name" value={course.contact_name} onSave={(v) => save('contact_name', v)} />
          <InlineEditField label="Contact Email" value={course.contact_email} onSave={(v) => save('contact_email', v)} type="email" />
          <InlineEditField label="Contact Phone" value={course.contact_phone} onSave={(v) => save('contact_phone', v)} type="tel" />
          <InlineEditField label="Estimated Value" value={course.estimated_value?.toString() ?? null} onSave={(v) => save('estimated_value', v)} type="number" />
          <InlineEditField label="City" value={course.city} onSave={(v) => save('city', v)} />
          <InlineEditField label="State" value={course.state} onSave={(v) => save('state', v)} />
          <InlineEditField label="Address" value={course.address} onSave={(v) => save('address', v)} />
          <InlineEditField label="ZIP" value={course.zip} onSave={(v) => save('zip', v)} />
          <div className="col-span-2">
            <InlineEditField label="Notes" value={course.notes} onSave={(v) => save('notes', v)} type="textarea" />
          </div>
        </div>
      </div>

      {showActivityModal && (
        <LogActivityModal
          recordType="course"
          recordId={course.id}
          assignee={course.assigned_to ?? 'neil'}
          onClose={() => setShowActivityModal(false)}
          onLogged={() => router.refresh()}
        />
      )}

      {showDocModal && (
        <GenerateDocModal
          recordType="course"
          recordId={course.id}
          createdBy={course.assigned_to ?? 'neil'}
          onClose={() => setShowDocModal(false)}
          onGenerated={() => router.refresh()}
        />
      )}

      {showEmailModal && (
        <EmailComposerModal
          recordType="course"
          recordId={course.id}
          toEmail={course.contact_email}
          sentBy={course.assigned_to ?? 'neil'}
          onClose={() => setShowEmailModal(false)}
          onSent={() => router.refresh()}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete {course.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this course and all its activity history.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
