'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Course {
  id: string; slug: string; name: string; address: string | null;
  city: string | null; state: string | null; zip: string | null;
  phone: string | null; email: string | null; website: string | null;
  base_green_fee: number | null;
}

export function CourseSettingsForm({ course, admins }: { course: Course; admins: any[] }) {
  const [form, setForm] = useState({
    name: course.name ?? '',
    address: course.address ?? '',
    city: course.city ?? '',
    state: course.state ?? '',
    zip: course.zip ?? '',
    phone: course.phone ?? '',
    email: course.email ?? '',
    website: course.website ?? '',
    base_green_fee: course.base_green_fee?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)

    const { error } = await supabase
      .from('courses')
      .update({
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        phone: form.phone,
        email: form.email,
        website: form.website,
        base_green_fee: parseFloat(form.base_green_fee) || null,
      })
      .eq('id', course.id)

    setSaving(false)
    if (error) setError(error.message)
    else setSaved(true)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader className="pb-3"><CardTitle className="text-base">Course Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Course name</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => update('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label>City</Label>
                <Input value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.state} onChange={e => update('state', e.target.value)} maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => update('zip', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => update('email', e.target.value)} type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => update('website', e.target.value)} type="url" placeholder="https://" />
              </div>
              <div className="space-y-1.5">
                <Label>Base green fee ($)</Label>
                <Input value={form.base_green_fee} onChange={e => update('base_green_fee', e.target.value)} type="number" min="0" step="0.01" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-[#1B4332]">&#10003; Settings saved.</p>}
            <Button type="submit" disabled={saving} className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admins list */}
      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader className="pb-3"><CardTitle className="text-base">Team Access</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {admins.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-[#1A1A1A]">{(a.profiles as any)?.full_name ?? '—'}</span>
                <span className="text-xs text-[#6B7770] capitalize">{a.role}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6B7770] mt-4">To add or remove team members, contact TeeAhead support.</p>
        </CardContent>
      </Card>
    </div>
  )
}
