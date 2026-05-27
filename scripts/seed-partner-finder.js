/**
 * Seed 5 test golfers for the Partner Finder feature.
 * Run: node scripts/seed-partner-finder.js
 * Delete: node scripts/seed-partner-finder.js --delete
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const COURSE_ID = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770' // Fieldstone Golf Club

// Dates: spread across the next 7 days
function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const TESTERS = [
  {
    email: 'sara.test@teeahead.com',
    fullName: 'Sara Mitchell',
    tier: 'ace',
    preferences: {
      handicap_index: 8.2,
      pace_preference: 'fast',
      prefers_walking: true,
      drinks_ok: true,
      smoking_ok: false,
      preferred_holes: '18',
      skill_level: 'advanced',
      bio: 'Competitive player, love early morning rounds. Always on pace.',
      is_visible: true,
      play_style: 'competitive',
      gender: 'female',
      open_to: 'anyone',
    },
    availability: [
      { available_date: daysFromNow(1), time_preference: 'morning', holes: '18', notes: 'Looking for a 4-some' },
      { available_date: daysFromNow(4), time_preference: 'morning', holes: '18', notes: null },
    ],
  },
  {
    email: 'mike.test@teeahead.com',
    fullName: 'Mike Torres',
    tier: 'eagle',
    preferences: {
      handicap_index: 18.5,
      pace_preference: 'relaxed',
      prefers_walking: false,
      drinks_ok: true,
      smoking_ok: false,
      preferred_holes: 'either',
      skill_level: 'intermediate',
      bio: "Here for the fun, not the scorecard. Let's grab a beer after.",
      is_visible: true,
      play_style: 'casual',
      gender: 'male',
      open_to: 'anyone',
    },
    availability: [
      { available_date: daysFromNow(2), time_preference: 'afternoon', holes: '18', notes: null },
      { available_date: daysFromNow(5), time_preference: 'flexible', holes: '9', notes: 'Quick 9 after work' },
    ],
  },
  {
    email: 'chris.test@teeahead.com',
    fullName: 'Chris Langley',
    tier: 'eagle',
    preferences: {
      handicap_index: 14.0,
      pace_preference: 'moderate',
      prefers_walking: true,
      drinks_ok: false,
      smoking_ok: false,
      preferred_holes: '18',
      skill_level: 'intermediate',
      bio: 'Walking golfer, no drinks, just vibes. Mid-handicapper working on my short game.',
      is_visible: true,
      play_style: 'moderate',
      gender: 'non_binary',
      open_to: 'anyone',
    },
    availability: [
      { available_date: daysFromNow(3), time_preference: 'morning', holes: '18', notes: null },
    ],
  },
  {
    // Tests the women_only filter — should only appear for female viewers
    email: 'jen.test@teeahead.com',
    fullName: 'Jennifer Ramos',
    tier: 'ace',
    preferences: {
      handicap_index: 22.1,
      pace_preference: 'relaxed',
      prefers_walking: false,
      drinks_ok: true,
      smoking_ok: false,
      preferred_holes: 'either',
      skill_level: 'beginner',
      bio: "New to the game, looking for a welcoming group. Women's only please.",
      is_visible: true,
      play_style: 'casual',
      gender: 'female',
      open_to: 'women_only',
    },
    availability: [
      { available_date: daysFromNow(2), time_preference: 'afternoon', holes: '9', notes: 'Just learning — patient partners welcome!' },
      { available_date: daysFromNow(6), time_preference: 'morning', holes: '9', notes: null },
    ],
  },
  {
    // Tests same_gender_only filter — should only appear for male viewers
    email: 'dave.test@teeahead.com',
    fullName: 'Dave Kowalski',
    tier: 'eagle',
    preferences: {
      handicap_index: 5.7,
      pace_preference: 'fast',
      prefers_walking: false,
      drinks_ok: true,
      smoking_ok: true,
      preferred_holes: '18',
      skill_level: 'advanced',
      bio: 'Single digit, looking for competitive rounds. Fast play only.',
      is_visible: true,
      play_style: 'competitive',
      gender: 'male',
      open_to: 'same_gender_only',
    },
    availability: [
      { available_date: daysFromNow(1), time_preference: 'morning', holes: '18', notes: null },
      { available_date: daysFromNow(3), time_preference: 'afternoon', holes: '18', notes: 'Fieldstone preferred' },
    ],
  },
]

async function deleteTestData() {
  const emails = TESTERS.map(t => t.email)
  const { data: users } = await admin.auth.admin.listUsers()
  const testUsers = (users?.users ?? []).filter(u => emails.includes(u.email))

  for (const u of testUsers) {
    await admin.auth.admin.deleteUser(u.id)
    console.log(`Deleted user: ${u.email}`)
  }
  console.log('Test data deleted.')
}

async function seedTestData() {
  for (const tester of TESTERS) {
    // 1. Create or find auth user
    const { data: existing } = await admin.auth.admin.listUsers()
    let userId = existing?.users?.find(u => u.email === tester.email)?.id

    if (!userId) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: tester.email,
        password: 'TeeAhead2026!',
        email_confirm: true,
      })
      if (error) { console.error(`Failed to create ${tester.email}:`, error.message); continue }
      userId = created.user.id
      console.log(`Created auth user: ${tester.email} (${userId})`)
    } else {
      console.log(`Auth user already exists: ${tester.email} (${userId})`)
    }

    // 2. Upsert profile
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      full_name: tester.fullName,
    }, { onConflict: 'id' })
    if (profileError) { console.error(`Profile upsert failed for ${tester.email}:`, profileError.message); continue }

    // 3. Upsert membership
    const { error: memberError } = await admin.from('memberships').upsert({
      user_id: userId,
      tier: tester.tier,
      status: 'active',
    }, { onConflict: 'user_id' })
    if (memberError) console.warn(`Membership upsert warn (${tester.email}):`, memberError.message)

    // 4. Upsert partner preferences
    const { error: prefError } = await admin.from('partner_preferences').upsert({
      profile_id: userId,
      ...tester.preferences,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })
    if (prefError) { console.error(`Preferences upsert failed for ${tester.email}:`, prefError.message); continue }

    // 5. Insert availability (skip dates already in the past or duplicates)
    for (const av of tester.availability) {
      const { error: avError } = await admin.from('partner_availability').insert({
        profile_id: userId,
        course_id: COURSE_ID,
        ...av,
        is_active: true,
      })
      if (avError) {
        if (avError.code === '23514') {
          console.warn(`  Skipped past date ${av.available_date} for ${tester.fullName}`)
        } else {
          console.warn(`  Availability insert warn (${tester.fullName} ${av.available_date}):`, avError.message)
        }
      } else {
        console.log(`  Added availability: ${tester.fullName} on ${av.available_date} (${av.time_preference})`)
      }
    }

    console.log(`✓ ${tester.fullName} seeded (${tester.tier}, ${tester.preferences.play_style}, open_to: ${tester.preferences.open_to})`)
  }

  console.log('\nAll test users seeded. Login with password: TeeAhead2026!')
  console.log('\nTest matrix:')
  console.log('  Sara Mitchell  — female, competitive, open to anyone')
  console.log('  Mike Torres    — male, casual, open to anyone')
  console.log('  Chris Langley  — non-binary, moderate, open to anyone')
  console.log('  Jennifer Ramos — female, casual, women_only (hidden from men)')
  console.log('  Dave Kowalski  — male, competitive, same_gender_only (hidden from women/non-binary)')
}

const shouldDelete = process.argv.includes('--delete')
if (shouldDelete) {
  deleteTestData().catch(console.error)
} else {
  seedTestData().catch(console.error)
}
