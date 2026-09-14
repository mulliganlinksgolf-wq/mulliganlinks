import { NextRequest, NextResponse } from 'next/server'
import { getCourseByInviteToken } from '@/lib/db/courses'
import { ONBOARDING_COOKIE } from '@/lib/auth/onboarding'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const course = token ? await getCourseByInviteToken(token) : null
  if (!token || !course || course.invite_used || course.onboarding_complete) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  const step = Math.min(5, Math.max(1, course.onboarding_step ?? 1))
  const response = NextResponse.redirect(new URL(`/onboarding/${course.id}/step-${step}`, request.url))
  response.cookies.set(ONBOARDING_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/onboarding', maxAge: 24 * 60 * 60,
  })
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('Cache-Control', 'no-store')
  return response
}
