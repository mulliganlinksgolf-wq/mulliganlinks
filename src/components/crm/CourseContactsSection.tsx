'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCourseContact, updateCourseContact, deleteCourseContact } from '@/app/actions/crm/contacts'
import type { CrmCourseContact } from '@/lib/crm/types'

interface Props {
  courseId: string
  contacts: CrmCourseContact[]
}

export function CourseContactsSection({ courseId, contacts }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Contacts</h3>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>
      {showAdd && <AddContactForm courseId={courseId} onDone={() => setShowAdd(false)} />}
      {contacts.length === 0 && !showAdd ? (
        <p className="text-xs text-slate-400 italic">No contacts yet. Add a GM, owner, or head pro.</p>
      ) : (
        <div className="space-y-2 mt-2">
          {contacts.map(c => <ContactRow key={c.id} contact={c} courseId={courseId} />)}
        </div>
      )}
    </div>
  )
}

function AddContactForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      await createCourseContact({
        course_id: courseId,
        name: name.trim(),
        role: role.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      })
      router.refresh()
      onDone()
    })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg mb-2">
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *"
        className="px-2 py-1.5 text-sm border border-slate-200 rounded col-span-1"
      />
      <input
        value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (GM, Owner, Head Pro)"
        className="px-2 py-1.5 text-sm border border-slate-200 rounded col-span-1"
      />
      <input
        value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
        className="px-2 py-1.5 text-sm border border-slate-200 rounded col-span-1"
      />
      <input
        value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel"
        className="px-2 py-1.5 text-sm border border-slate-200 rounded col-span-1"
      />
      <button
        type="submit" disabled={pending || !name.trim()}
        className="col-span-2 px-3 py-1.5 bg-emerald-700 text-white text-sm rounded-lg hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save Contact'}
      </button>
    </form>
  )
}

function ContactRow({ contact, courseId }: { contact: CrmCourseContact; courseId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function setPrimary() {
    startTransition(async () => {
      await updateCourseContact(contact.id, courseId, { is_primary: !contact.is_primary })
      router.refresh()
    })
  }

  function remove() {
    if (!confirm(`Delete ${contact.name}?`)) return
    startTransition(async () => {
      await deleteCourseContact(contact.id, courseId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-start justify-between gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{contact.name}</span>
          {contact.role && <span className="text-xs text-slate-500">· {contact.role}</span>}
          {contact.is_primary && <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">Primary</span>}
        </div>
        <div className="flex gap-3 text-xs text-slate-500 mt-1 flex-wrap">
          {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-emerald-700">{contact.email}</a>}
          {contact.phone && <a href={`tel:${contact.phone}`} className="hover:text-emerald-700">{contact.phone}</a>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={setPrimary} disabled={pending} className="text-xs text-slate-400 hover:text-emerald-700 px-2 py-1">
          {contact.is_primary ? 'Unstar' : 'Star'}
        </button>
        <button onClick={remove} disabled={pending} className="text-xs text-slate-400 hover:text-red-500 px-2 py-1">×</button>
      </div>
    </div>
  )
}
