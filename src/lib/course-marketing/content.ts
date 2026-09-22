export const AUDIENCES = {
  all: 'All subscribers',
  fairway: 'Fairway',
  eagle: 'Eagle',
  ace: 'Ace',
  eagle_ace: 'Eagle + Ace',
} as const
export type Audience = keyof typeof AUDIENCES
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function validateCampaign(
  subject: string,
  body: string,
  audience: string,
) {
  if (!subject.trim() || subject.trim().length > 150 || /[\r\n]/.test(subject))
    return 'Enter a subject of 1–150 characters on one line.'
  if (!body.trim() || body.trim().length > 10000)
    return 'Enter a message of 1–10,000 characters.'
  if (!Object.hasOwn(AUDIENCES, audience)) return 'Choose a valid audience.'
  return null
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  )
}
export function renderCampaign(input: {
  sender: string
  address: string
  body: string
  unsubscribeUrl: string
}) {
  return `<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#1a3025;padding:24px"><h2>${escapeHtml(input.sender)}</h2><div style="white-space:pre-wrap;line-height:1.7">${escapeHtml(input.body)}</div><hr style="border:0;border-top:1px solid #ddd;margin:28px 0"><p style="font-size:12px;color:#666">${escapeHtml(input.sender)} · ${escapeHtml(input.address)}<br>You subscribed to course news and offers.<br><a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe from this course</a> · Sent with TeeAhead</p></div>`
}
export const STARTERS = [
  {
    name: 'Open tee times',
    subject: 'There’s room for your next round',
    body: 'Looking to get out this week? We have tee times available and would love to see you.\n\nCheck our booking page for the latest times and rates.\n\nSee you at the course!',
  },
  {
    name: 'League signups',
    subject: 'Make this your league season',
    body: 'Ready for a regular round with a great group? Get in touch to learn about our upcoming leagues, available spots, and how to join.\n\nWe’d love to help you find the right fit.',
  },
  {
    name: 'Shop & clubhouse',
    subject: 'A reason to stop by the clubhouse',
    body: 'We have something new to share from the pro shop and clubhouse.\n\nAdd your offer, dates, and any details here before sending.\n\nStop in or give us a call to learn more.',
  },
  {
    name: 'Spring update',
    subject: 'Looking ahead to another season',
    body: 'We’re looking forward to welcoming you back.\n\nWatch for updates on opening day, league signups, and what’s new at the course.\n\nThanks for being part of our golf community.',
  },
]
