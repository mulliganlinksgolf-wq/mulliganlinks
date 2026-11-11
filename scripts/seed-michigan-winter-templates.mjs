// Preview by default. --apply requires an explicit project ref matching .env.local.
// This script only inserts template rows; it cannot send or schedule email.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const templates = JSON.parse(await readFile(new URL('./data/michigan-winter-2026-templates.json', import.meta.url), 'utf8'))
const allowedVariables = new Set(['first_name', 'course_name', 'sender_name'])
const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const rows = templates.map(({ id, name, subject, body }) => {
  assert.match(id, /^[0-9a-f-]{36}$/)
  assert.ok(name.startsWith('Michigan Winter: '))
  assert.ok(subject && body)
  for (const [, variable] of `${subject} ${body}`.matchAll(/\{\{(\w+)\}\}/g)) {
    assert.ok(allowedVariables.has(variable), `Unsupported variable: ${variable}`)
  }
  return { id, name, subject, body_html: body.split('\n\n').map(p => `<p>${escapeHtml(p).replaceAll('\n', '<br>')}</p>`).join('\n'), record_type: 'course', status: 'active', version: 1 }
})
assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
assert.equal(new Set(rows.map(row => row.name)).size, rows.length)

if (!process.argv.includes('--apply')) {
  for (const template of templates) console.log(`${template.name}\nUse: ${template.use_when}\nSubject: ${template.subject}\n${template.body}\n`)
  console.log(`Validated ${rows.length} templates. Preview only; no database changes.`)
} else {
  const projectRef = process.argv.find(arg => arg.startsWith('--project-ref='))?.split('=')[1]
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  assert.ok(projectRef, 'Provide --project-ref=<intended Supabase project ref>')
  assert.equal(url.hostname, `${projectRef}.supabase.co`, 'Project ref must match the configured Supabase URL')
  assert.equal(url.protocol, 'https:')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  assert.ok(key, 'Missing SUPABASE_SERVICE_ROLE_KEY')
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const fields = 'id,name,subject,body_html,record_type,status,version'
  async function request(path, options = {}) {
    const response = await fetch(new URL(`/rest/v1/${path}`, url), { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Template request failed (${response.status}): ${await response.text()}`)
    return response.json()
  }
  const existing = await request(`crm_email_templates?select=${fields}&name=like.Michigan%20Winter%3A*`)
  // Refuse name collisions or modified rows instead of overwriting human edits.
  for (const row of rows) {
    const matches = existing.filter(item => item.id === row.id || item.name === row.name)
    for (const match of matches) assert.deepEqual(match, row, `Existing template differs: ${row.name}`)
  }
  const missing = rows.filter(row => !existing.some(item => item.id === row.id))
  if (missing.length) {
    await request('crm_email_templates?on_conflict=id&select=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify(missing),
    })
  }
  const verified = await request(`crm_email_templates?select=${fields}&id=in.(${rows.map(row => row.id).join(',')})`)
  assert.equal(verified.length, rows.length)
  for (const row of rows) assert.deepEqual(verified.find(item => item.id === row.id), row, `Readback failed: ${row.name}`)
  console.log(`Inserted ${missing.length}; verified all ${rows.length} active course templates in ${projectRef}. No emails sent or scheduled.`)
}
