import { type NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  const dest = new URL('/waitlist/golfer', request.nextUrl.origin)
  if (ref) dest.searchParams.set('ref', ref)
  return NextResponse.redirect(dest, 301)
}
