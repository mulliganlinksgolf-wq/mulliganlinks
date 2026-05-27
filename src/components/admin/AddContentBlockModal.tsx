'use client'
import { useState, useActionState } from 'react'
import { addBlock } from '@/app/admin/content/actions'

export default function AddContentBlockModal({ group }: { group: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      const result = await addBlock(formData)
      return result ?? {}
    },
    {}
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-black/20 px-4 py-2 text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
      >
        + Add new content block
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl p-6 space-y-4 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#1A1A1A]">Add Content Block</h3>
          <button onClick={() => setOpen(false)} className="text-[#6B7770] hover:text-[#1A1A1A] text-sm">✕</button>
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="group" value={group} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Key</label>
            <input
              name="key"
              type="text"
              required
              defaultValue={`${group}.`}
              placeholder={`${group}.my_block`}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
            <p className="text-xs text-[#6B7770]">Format: group.block_name (lowercase)</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Label / Description</label>
            <input
              name="description"
              type="text"
              placeholder="e.g. Homepage headline"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Type</label>
            <select name="type" className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="text">text</option>
              <option value="markdown">markdown</option>
              <option value="html">html</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Initial value</label>
            <textarea
              name="value"
              rows={2}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
          {state.error && <p className="text-red-600 text-xs">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Adding…' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
