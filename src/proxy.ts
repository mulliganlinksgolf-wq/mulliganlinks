import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  if (request.nextUrl.pathname.startsWith('/book/')) {
    // Allow /book/* to be embedded as iframes on course websites
    response.headers.set('Content-Security-Policy', "frame-ancestors *")
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
