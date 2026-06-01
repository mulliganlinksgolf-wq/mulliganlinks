import { createAdminClient } from '@/lib/supabase/admin'
import type { User } from '@supabase/supabase-js'

/**
 * Validate a Supabase access token from the Authorization: Bearer <token> header.
 * Returns the authenticated user, or null if missing/invalid.
 * Used by mobile API routes (which send tokens, not cookies).
 */
export async function getUserFromBearer(req: Request): Promise<User | null> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  if (!token) return null

  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
