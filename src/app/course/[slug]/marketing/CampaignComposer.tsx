'use client'
import { useActionState, useState } from 'react'
import {
  AUDIENCES,
  STARTERS,
  type Audience,
} from '@/lib/course-marketing/content'
import { queueCampaign } from './actions'

const inputClass =
  'w-full rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]'
export default function CampaignComposer({
  slug,
  courseName,
  address,
  counts,
  campaignId,
}: {
  slug: string
  courseName: string
  address: string
  counts: Record<Audience, number>
  campaignId: string
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [reviewing, setReviewing] = useState(false)
  const [state, action, pending] = useActionState(
    queueCampaign.bind(null, slug),
    {},
  )
  if (state.success)
    return (
      <div
        className="rounded-xl border border-green-200 bg-green-50 p-6"
        role="status"
      >
        <h2 className="font-semibold">Your campaign is queued</h2>
        <p className="mt-2 text-sm">{state.success}</p>
        <a
          className="mt-4 inline-block underline"
          href={`/course/${slug}/marketing`}
        >
          Back to marketing
        </a>
      </div>
    )
  return (
    <form
      action={action}
      className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7 space-y-5"
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <h2 className="text-xl font-semibold">
        {reviewing ? 'Review your email' : 'Write to your golfers'}
      </h2>
      {!reviewing && (
        <div>
          <p className="text-sm text-[#6B7770] mb-2">
            Start fresh or use a starting point.
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter.name}
                type="button"
                className="rounded-full border border-[#1B4332]/20 px-3 py-2 text-xs hover:bg-[#FAF7F2]"
                onClick={() => {
                  setSubject(starter.subject)
                  setBody(starter.body)
                }}
              >
                {starter.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-2" htmlFor="audience">
          Audience
        </label>
        <select
          id="audience"
          name="audience"
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value as Audience)
            setReviewing(false)
          }}
          className={inputClass}
        >
          {Object.entries(AUDIENCES).map(([key, label]) => (
            <option key={key} value={key}>
              {label} · {counts[key as Audience]} subscribers
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-[#6B7770]">
          Only golfers who subscribed to {courseName}. Tier filters use their
          current active membership.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value)
            setReviewing(false)
          }}
          maxLength={150}
          required
          className={inputClass}
          placeholder="Give them a reason to open it"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2" htmlFor="body">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setReviewing(false)
          }}
          maxLength={10000}
          required
          rows={9}
          className={inputClass}
          placeholder="Share an offer, an update, or an invitation…"
        />
        <p className="text-xs text-[#6B7770] mt-1">
          Plain text. Include any booking link and offer dates in your message.
        </p>
      </div>
      {reviewing && (
        <section
          aria-label="Email preview"
          className="rounded-xl bg-[#FAF7F2] p-5 space-y-4 break-words"
        >
          <p className="text-xs uppercase tracking-widest text-[#6B7770]">
            Email preview
          </p>
          <h3 className="font-semibold text-xl">{courseName}</h3>
          <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
          <footer className="border-t border-black/10 pt-4 text-xs text-[#6B7770]">
            {courseName} · {address}
            <br />
            You subscribed to course news and offers.
            <br />
            <span className="underline">Unsubscribe from this course</span> ·
            Sent with TeeAhead
          </footer>
        </section>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {counts[audience] === 0 && (
        <p className="text-sm text-[#6B7770]">
          No subscribers in this audience yet. Share your signup link below to
          start your list.
        </p>
      )}
      {reviewing ? (
        <>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="reviewed"
              value="yes"
              required
              className="mt-1"
            />
            I’ve checked the message and want to send it to {counts[audience]}{' '}
            subscribers.
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending || !counts[audience]}
              className="rounded-lg bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Queuing…' : 'Send campaign'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setReviewing(false)}
              className="px-4 py-3 text-sm underline"
            >
              Keep editing
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          disabled={!subject.trim() || !body.trim() || !counts[audience]}
          onClick={() => setReviewing(true)}
          className="rounded-lg bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Preview email
        </button>
      )}
    </form>
  )
}
