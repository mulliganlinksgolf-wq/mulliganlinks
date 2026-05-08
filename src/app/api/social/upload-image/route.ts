import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024
const BUCKET = 'social-media'

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
      { error: 'File must be under 10MB' },
      { status: 400 }
    )
  }

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`

  const buffer = await file.arrayBuffer()
  const dataUrl = `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`

  const supabase = createAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    url: publicUrl,
    dataUrl,
    filename: file.name,
    mimeType: file.type,
  })
}
