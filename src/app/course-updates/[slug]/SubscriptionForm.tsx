'use client'
import { useActionState } from 'react'
import { updateSubscription } from './actions'
export default function SubscriptionForm({
  slug,
  subscribed,
  email,
}: {
  slug: string
  subscribed: boolean
  email: string
}) {
  const [state, action, pending] = useActionState(
    updateSubscription.bind(null, slug),
    {},
  )
  return (
    <form action={action} className="space-y-5">
      <p className="text-sm text-[#6B7770] break-all">Updates go to {email}.</p>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="subscribed"
          value="yes"
          defaultChecked={subscribed}
          className="mt-1"
        />
        <span className="text-sm">
          Email me course news, tee-time offers, league announcements, and
          clubhouse promotions. I can unsubscribe anytime.
        </span>
      </label>
      <button
        disabled={pending}
        className="w-full bg-[#1B4332] text-white rounded-lg px-5 py-3 font-semibold disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save email preference'}
      </button>
      {state.message && (
        <p role="status" className="text-sm text-green-800">
          {state.message}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  )
}
