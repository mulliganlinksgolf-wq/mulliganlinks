import { NextResponse } from 'next/server'
import { getChannels } from '@/lib/buffer'

export async function GET() {
  const apiKey = process.env.BUFFER_API_KEY
  const orgId = process.env.BUFFER_ORG_ID

  const result: Record<string, unknown> = {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length ?? 0,
    apiKeyPrefix: apiKey?.slice(0, 5) ?? null,
    hasOrgId: !!orgId,
    orgIdValue: orgId ?? null,
  }

  try {
    const channels = await getChannels(orgId ?? '')
    result.channelsCount = channels.length
    result.channels = channels.map(c => ({ id: c.id, service: c.service, name: c.name }))
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(result)
}
