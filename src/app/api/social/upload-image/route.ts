import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'File must be JPEG, PNG, or WebP' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File must be under 5MB' },
      { status: 400 }
    )
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  // TODO: Replace dataUrl with a public URL once image hosting is configured.
  // Buffer requires a publicly accessible URL for mediaUrls. Options:
  // - Supabase Storage: supabase.storage.from('social-images').upload(...)
  // - Cloudflare Images: POST to api.cloudflare.com/client/v4/accounts/{id}/images/v1
  // For MVP: return dataUrl for preview only. Text-only posts are sent to Buffer.

  return NextResponse.json({
    dataUrl,
    filename: file.name,
    mimeType: file.type,
  })
}
