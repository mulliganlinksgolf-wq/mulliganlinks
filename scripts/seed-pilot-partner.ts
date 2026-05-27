// Usage: PILOT_COURSE_PASSWORD=yourpw npx tsx scripts/seed-pilot-partner.ts
import { createAdminClient } from '../src/lib/supabase/admin'

async function main() {
  const password = process.env.PILOT_COURSE_PASSWORD
  if (!password) throw new Error('PILOT_COURSE_PASSWORD env var required')

  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses').select('id').eq('slug', 'pilot-course').single()
  if (!course) throw new Error('pilot-course not found — run course seed first')

  const email = 'pilot@teeahead.com'

  const { data: { users } } = await admin.auth.admin.listUsers()
  const existing = users.find(u => u.email === email)

  let userId: string
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password })
    userId = existing.id
    console.log('Updated existing user password')
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !data.user) throw new Error(error?.message ?? 'Failed to create user')
    userId = data.user.id
    console.log('Created auth user:', userId)
  }

  const { error } = await admin.from('crm_course_users').upsert(
    { user_id: userId, course_id: course.id, name: 'Pilot GM', email, role: 'owner', setup_token: null, setup_token_expires_at: null },
    { onConflict: 'email' },
  )
  if (error) throw new Error(error.message)

  console.log('Done. Login at /course/pilot-course/login with', email)
}

main().catch(e => { console.error(e); process.exit(1) })
