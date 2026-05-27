import { createAdminClient } from '@/lib/supabase/admin'

export type SiteConfig = Record<string, string>

export async function getSiteConfig(): Promise<SiteConfig> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('site_config').select('key, value')
  if (error) throw new Error(`Failed to load site config: ${error.message}`)
  return Object.fromEntries((data ?? []).map(row => [row.key, row.value]))
}

export async function getConfigValue(key: string): Promise<string | null> {
  const config = await getSiteConfig()
  return config[key] ?? null
}

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  const value = await getConfigValue(`flag_${flag}`)
  return value === 'true'
}

export async function isLiveMode(): Promise<boolean> {
  const value = await getConfigValue('launch_mode')
  return value === 'live'
}
