// Usage: npx ts-node scripts/createCourseInvite.ts "Woodland Hills Golf Club" "mike@woodlandhillsgc.com"
// Outputs: https://app.teeahead.com/onboarding?token=abc123xyz
//
// Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Loaded from .env.local via dotenv

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createAdminClient } from '../src/lib/supabase/admin'
import { generateSlug } from '../src/lib/utils/generateSlug'
import { generateInviteToken } from '../src/lib/utils/generateInviteToken'

async function main() {
  const courseName = process.argv[2]
  const email = process.argv[3]

  if (!courseName || !email) {
    console.error('Usage: npx ts-node scripts/createCourseInvite.ts "Course Name" "email@example.com"')
    process.exit(1)
  }

  const slug = generateSlug(courseName)
  const token = generateInviteToken()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.teeahead.com'

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('courses')
    .insert({
      name: courseName,
      slug,
      email,
      status: 'pending',
      invite_token: token,
      invite_used: false,
      onboarding_step: 1,
      onboarding_complete: false,
      is_live: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error inserting course:', error.message)
    process.exit(1)
  }

  console.log(`${appUrl}/onboarding?token=${token}`)
  console.log(`Course ID: ${data.id}`)
  console.log(`Slug: ${slug}`)
}

main()
