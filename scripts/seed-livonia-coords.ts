// One-off script to backfill latitude/longitude for Livonia, MI courses so the
// nightly sunrise/sunset cron has data to work with. Idempotent.
//
// Usage: npx tsx scripts/seed-livonia-coords.ts

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

// Metro Detroit courses. Courses that don't exist yet are skipped silently
// so this stays safe to re-run as new founding partners are onboarded.
const courses = [
  { slug: 'pilot-course', latitude: 42.5836, longitude: -83.2455 }, // Fieldstone Golf Club, Bloomfield Hills
  { slug: 'fox-creek', latitude: 42.4267, longitude: -83.3838 },
  { slug: 'whispering-willows', latitude: 42.4119, longitude: -83.3697 },
  { slug: 'idyl-wyld', latitude: 42.3947, longitude: -83.3603 },
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const c of courses) {
    const { data: existing, error: fetchErr } = await supabase
      .from('courses')
      .select('id, slug, latitude, longitude')
      .eq('slug', c.slug)
      .maybeSingle()

    if (fetchErr) {
      console.error(`[${c.slug}] fetch error:`, fetchErr.message)
      continue
    }
    if (!existing) {
      console.warn(`[${c.slug}] not found — skipping`)
      continue
    }

    const { error: updErr } = await supabase
      .from('courses')
      .update({
        latitude: c.latitude,
        longitude: c.longitude,
        timezone: 'America/Detroit',
      })
      .eq('id', existing.id)

    if (updErr) {
      console.error(`[${c.slug}] update error:`, updErr.message)
    } else {
      console.log(`[${c.slug}] set ${c.latitude}, ${c.longitude}`)
    }
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e)
  process.exit(1)
})
