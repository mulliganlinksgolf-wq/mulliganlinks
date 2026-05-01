import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // Verify the requester is a TeeAhead admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: targetUser, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError || !targetUser.user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const email = targetUser.user.email
  if (!email) return NextResponse.json({ error: 'User has no email address' }, { status: 400 })

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${req.nextUrl.origin}/app` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message ?? 'Failed to generate link' }, { status: 500 })
  }

  return NextResponse.json({ url: linkData.properties.action_link })
}
