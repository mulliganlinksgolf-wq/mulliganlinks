import { ImapFlow } from 'imapflow'
import { createAdminClient } from '@/lib/supabase/admin'

export const MAILBOXES = [
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
] as const

const IMAP_HOST = 'mail.privateemail.com'
const IMAP_PORT = 993
const SENT_FOLDER_CANDIDATES = ['Sent', 'Sent Items', 'INBOX.Sent', 'INBOX/Sent']

async function findSentFolder(client: ImapFlow): Promise<string | null> {
  const list = await client.list()
  // Prefer special-use \Sent flag
  const flagged = list.find(m => m.specialUse === '\\Sent')
  if (flagged) return flagged.path
  // Fall back to common names
  for (const name of SENT_FOLDER_CANDIDATES) {
    if (list.some(m => m.path === name)) return name
  }
  return null
}

type RecordType = 'course' | 'outing' | 'member'

interface ContactMatch {
  record_type: RecordType
  record_id: string
  email: string
}

async function findContactByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<ContactMatch | null> {
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

export interface SyncResult {
  logged: number
  skipped: number
  errors: string[]
  diagnostics?: {
    folders?: string[]
    sentFolder?: string
    lastUid?: number
    maxUid?: number
    messagesSeen?: number
  }
}

export async function syncMailbox(config: (typeof MAILBOXES)[number]): Promise<SyncResult> {
  const password = process.env[config.passwordEnv]
  if (!password) {
    return { logged: 0, skipped: 0, errors: [`${config.passwordEnv} not set`] }
  }

  const admin = createAdminClient()

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
  let messagesSeen = 0
  let folderList: string[] = []
  let sentFolder: string | null = null

  try {
    await client.connect()
    folderList = (await client.list()).map(m => `${m.path}${m.specialUse ? ' ' + m.specialUse : ''}`)
    sentFolder = await findSentFolder(client)
    if (!sentFolder) {
      errors.push(`No Sent folder found. Available: ${folderList.join(', ')}`)
      await client.logout()
      return { logged, skipped, errors, diagnostics: { folders: folderList, lastUid, maxUid, messagesSeen } }
    }
    console.log(`[imap-sync] ${config.mailbox} using Sent folder: ${sentFolder}`)
    const lock = await client.getMailboxLock(sentFolder)

    try {
      const searchRange = lastUid > 0 ? `${lastUid + 1}:*` : '1:*'
      for await (const msg of client.fetch({ uid: searchRange }, { envelope: true, uid: true })) {
        messagesSeen++
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
          if (toEmail.endsWith('@teeahead.com')) continue

          const contact = await findContactByEmail(admin, toEmail)
          if (!contact) {
            skipped++
            continue
          }

          // If sendCrmEmail already logged this outbound (same message_id on the
          // same record), don't double-log it. We set Message-ID explicitly on
          // outbound mail, then append a copy to the Sent folder via IMAP — so
          // this sync would otherwise insert a second row for our own send.
          if (messageId) {
            const { data: existing } = await admin
              .from('crm_activity_log')
              .select('id')
              .eq('record_type', contact.record_type)
              .eq('record_id', contact.record_id)
              .eq('message_id', messageId)
              .limit(1)
              .maybeSingle()
            if (existing) { skipped++; continue }
          }

          const body = `Subject: ${subject}\nTo: ${toEmail}\nSent: ${sentDate.toISOString()}\n\n(Logged via IMAP sync — sent from ${config.mailbox})`

          const { error } = await admin.from('crm_activity_log').insert({
            record_type: contact.record_type,
            record_id: contact.record_id,
            type: 'email',
            body,
            created_by: config.sentBy,
            from_email: config.mailbox,
            imap_message_id: messageId ? `${messageId}-${toEmail}` : null,
            message_id: messageId ?? null,
            in_reply_to: envelope.inReplyTo ?? null,
            created_at: sentDate.toISOString(),
          })

          if (error) {
            if (error.code === '23505') skipped++
            else errors.push(`insert error for UID ${uid}: ${error.message}`)
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

  if (maxUid > lastUid) {
    await admin.from('crm_imap_sync_state').upsert({
      mailbox: config.mailbox,
      last_uid: maxUid,
      synced_at: new Date().toISOString(),
    })
  }

  return {
    logged,
    skipped,
    errors,
    diagnostics: {
      folders: folderList,
      sentFolder: sentFolder ?? undefined,
      lastUid,
      maxUid,
      messagesSeen,
    },
  }
}

// Build an RFC 822 compliant message and append it to the sender's Sent folder.
// Returns null on success, or an error string. Best-effort: failures are logged
// but never block the actual email send.
export async function appendToSentFolder(args: {
  fromHeader: string  // "Neil Barris <neil@teeahead.com>"
  fromEmail: string   // "neil@teeahead.com"
  to: string
  subject: string
  html: string
  messageId?: string
  inReplyTo?: string | null
}): Promise<string | null> {
  const config = MAILBOXES.find(m => m.mailbox === args.fromEmail)
  if (!config) return `No IMAP config for sender ${args.fromEmail}`
  const password = process.env[config.passwordEnv]
  if (!password) return `${config.passwordEnv} not set`

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: config.user, pass: password },
    logger: false,
  })

  try {
    await client.connect()
    const sentFolder = await findSentFolder(client)
    if (!sentFolder) {
      await client.logout()
      return 'No Sent folder found'
    }

    const messageId = args.messageId ?? `<${crypto.randomUUID()}@teeahead.com>`
    const date = new Date().toUTCString()
    const headerLines = [
      `Message-ID: ${messageId}`,
      `Date: ${date}`,
      `From: ${args.fromHeader}`,
      `To: ${args.to}`,
      `Subject: ${args.subject}`,
    ]
    if (args.inReplyTo) {
      headerLines.push(`In-Reply-To: ${args.inReplyTo}`)
      headerLines.push(`References: ${args.inReplyTo}`)
    }
    headerLines.push(
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      args.html,
    )
    const rfc822 = headerLines.join('\r\n')

    await client.append(sentFolder, Buffer.from(rfc822, 'utf-8'), ['\\Seen'])
    await client.logout()
    return null
  } catch (err) {
    try { await client.logout() } catch {}
    return (err as Error).message
  }
}

export async function syncAllMailboxes(): Promise<Record<string, SyncResult>> {
  const results: Record<string, SyncResult> = {}
  for (const config of MAILBOXES) {
    console.log(`[imap-sync] syncing ${config.mailbox}`)
    results[config.mailbox] = await syncMailbox(config)
    console.log(`[imap-sync] ${config.mailbox}:`, results[config.mailbox])
  }
  return results
}
