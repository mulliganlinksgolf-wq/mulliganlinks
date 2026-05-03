import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { token, platform } = await req.json()

    // Validate required fields
    if (!token || !platform) {
      return NextResponse.json(
        { error: 'token and platform are required' },
        { status: 400 }
      )
    }

    // Validate platform value
    if (!['web', 'expo', 'ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be one of: web, expo, ios, android' },
        { status: 400 }
      )
    }

    // Upsert the token
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
        },
        {
          onConflict: 'user_id,platform',
        }
      )

    if (error) {
      console.error('[push-tokens]', error)
      return NextResponse.json(
        { error: 'Failed to save push token' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push-tokens]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
