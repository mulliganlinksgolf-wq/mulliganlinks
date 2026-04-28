'use client'
import { useActionState } from 'react'
import { addNote } from '@/app/admin/users/[userId]/actions'

interface Note {
  id: string; body: string; admin_email: string; created_at: string
}

export default function NotesTab({ userId, notes }: { userId: string; notes: Note[] }) {
  const [state, action, pending] = useActionState(addNote, {})

  return (
    <div className="space-y-6 max-w-2xl">
      <form action={action} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <textarea
          name="body"
          placeholder="Write a note… (not visible to the member)"
          rows={3}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30"
        />
        {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
        <button type="submit" disabled={pending} className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {pending ? 'Saving…' : 'Save Note'}
        </button>
      </form>
      {notes.length === 0 ? <p className="text-sm text-[#6B7770]">No notes yet.</p> : (
        <div className="space-y-4">
          {notes.map(n => (
            <div key={n.id} className="rounded-lg border border-black/8 bg-[#FAF7F2] p-4">
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-[#6B7770] mt-2">
                {n.admin_email} · {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
