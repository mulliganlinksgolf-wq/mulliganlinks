import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

// Mailboxes to sync — add more entries to expand coverage
const MAILBOXES = [
  {
    mailbox: 'neil@teeahead.com',
    user: 'neil@teeahead.com',
    passwordEnv: 'NEIL_IMAP_PASSWORD',
    sentBy: 'neil',
  },
  {
    mailbox: 'billy@teeahead.com',
    user: 'billy@teeahead.com',
    passwordEnv: 'BILLY_IMAP_PASSWORD',
    sentBy: 'billy',
  },
]

const IMAP_HOST = 'mail.privateemail.com'
const IMAP_PORT = 993
const SENT_FOLDER = 'Sent'

type RecordType = 'course' | 'outing' | 'member'

interface ContactMatch {
  record_type: RecordType
  record_id: string
  email: string
}

async function findContactByEmail(admin: ReturnType<typeof createAdminClient>, email: string): Promise<ContactMatch | null> {
  const lower = email.toLowerCase()

  const [courses, outings, members] = await Promise.all([
    admin.from('crm_courses').select('id, contact_email').ilike('contact_email', lower).limit(1),
    admin.from('crm_outings').select('id, contact_email').ilike('contact_email', lower).limit(1),
    admin.from('crm_members').select('id, email').ilike('email', lower).limit(1),
  ])

  if (courses.data?.[0]) return { record_type: 'course', record_id: courses.data[0].id, email: courses.data[0].contact_email }
  if (outings.data?.[0]) return { record_type: 'outing', record_id: outings.data[0].id, email: outings.data[0].contact_email }
  if (members.data?.[0]) return { record_type: 'member', record_id: members.data[0].id, email: members.data[0].email }
  return null
}

async function syncMailbox(
  admin: ReturnType<typeof createAdminClient>,
  config: (typeof MAILBOXES)[number]
): Promise<{ logged: number; skipped: number; errors: string[] }> {
  const password = process.env[config.passwordEnv]
  if (!password) {
    return { logged: 0, skipped: 0, errors: [`${config.passwordEnv} not set`] }
  }

  // Load last synced UID
  const { data: state } = await admin
    .from('crm_imap_sync_state')
    .select('last_uid')
    .eq('mailbox', config.mailbox)
    .single()

  const lastUid = state?.last_uid ?? 0

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: config.user, pass: password },
    logger: false,
  })

  let logged = 0
  let skipped = 0
  const errors: string[] = []
  let maxUid = lastUid

  try {
    await client.connect()
    const lock = await client.getMailboxLock(SENT_FOLDER)

    try {
      // Fetch all messages with UID > lastUid
      const searchRange = lastUid > 0 ? `${lastUid + 1}:*` : '1:*'
      for await (const msg of client.fetch({ uid: searchRange }, { envelope: true, uid: true })) {
        const uid = msg.uid
        if (uid <= lastUid) continue
        if (uid > maxUid) maxUid = uid

        const envelope = msg.envelope
        if (!envelope) continue
        const messageId = envelope.messageId
        const subject = envelope.subject ?? '(no subject)'
        const sentDate = envelope.date ?? new Date()
        const toAddresses = envelope.to ?? []

        for (const addr of toAddresses) {
          const toEmail = addr.address?.toLowerCase()
          if (!toEmail) continue

          // Skip internal teeahead addresses
          if (toEmail.endsWith('@teeahead.com')) continue

          const contact = await findContactByEmail(admin, toEmail)
          if (!contact) {
            skipped++
            continue
          }

          // Build body summary
          const body = `Subject: ${subject}\nTo: ${toEmail}\nSent: ${sentDate.toISOString()}\n\n(Logged via IMAP sync — sent from ${config.mailbox})`

          const { error } = await admin.from('crm_activity_log').insert({
            record_type: contact.record_type,
            record_id: contact.record_id,
            type: 'email',
            body,
            created_by: config.sentBy,
            from_email: config.mailbox,
            imap_message_id: messageId ? `${messageId}-${toEmail}` : null,
            created_at: sentDate.toISOString(),
          })

          if (error) {
            if (error.code === '23505') {
              // Duplicate — already logged
              skipped++
            } else {
              errors.push(`insert error for UID ${uid}: ${error.message}`)
            }
          } else {
            logged++
          }
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
  } catch (err) {
    errors.push((err as Error).message)
  }

  // Persist new high-water mark
  if (maxUid > lastUid) {
    await admin.from('crm_imap_sync_state').upsert({
      mailbox: config.mailbox,
      last_uid: maxUid,
      synced_at: new Date().toISOString(),
    })
  }

  return { logged, skipped, errors }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const results: Record<string, { logged: number; skipped: number; errors: string[] }> = {}

  for (const config of MAILBOXES) {
    console.log(`[imap-sync] syncing ${config.mailbox}`)
    results[config.mailbox] = await syncMailbox(admin, config)
    console.log(`[imap-sync] ${config.mailbox}:`, results[config.mailbox])
  }

  const totalLogged = Object.values(results).reduce((s, r) => s + r.logged, 0)
  return NextResponse.json({ ok: true, results, totalLogged })
}
