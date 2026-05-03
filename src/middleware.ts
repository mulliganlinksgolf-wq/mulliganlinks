import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Allow /book/* to be embedded as iframes on course websites
  if (request.nextUrl.pathname.startsWith('/book/')) {
    response.headers.delete('X-Frame-Options')
    response.headers.set('Content-Security-Policy', "frame-ancestors *")
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
