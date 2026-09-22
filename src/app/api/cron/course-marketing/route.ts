import { processCourseMarketing } from '@/lib/course-marketing/server'
export const runtime = 'nodejs'
export const maxDuration = 60
export async function GET(request: Request) {
  const secret = process.env.COURSE_WORKER_SECRET || process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`)
    return new Response('Unauthorized', { status: 401 })
  try {
    return Response.json(await processCourseMarketing())
  } catch (error) {
    console.error('[course-marketing]', error)
    return Response.json(
      { error: 'Campaign processing failed; pending emails remain queued.' },
      { status: 500 },
    )
  }
}
export const POST = GET
