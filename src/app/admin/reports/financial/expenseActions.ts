'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/reports/financial'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin, email').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Forbidden')
  return profile.email ?? user.email ?? 'admin'
}

export async function saveExpenses(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  let createdBy: string
  try { createdBy = await assertAdmin() } catch { return { error: 'Unauthorized' } }

  const month = formData.get('month') as string
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return { error: 'Invalid month format (YYYY-MM required)' }

  const admin = createAdminClient()
  const upserts = EXPENSE_CATEGORIES.map(category => ({
    category,
    month,
    amount: Number(formData.get(`expense_${category}`) ?? 0),
    notes: (formData.get(`notes_${category}`) as string) ?? '',
    created_by: createdBy,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await admin.from('crm_expenses').upsert(upserts, { onConflict: 'category,month' })
  if (error) return { error: error.message }

  revalidatePath('/admin/reports/financial')
  return { success: true }
}
