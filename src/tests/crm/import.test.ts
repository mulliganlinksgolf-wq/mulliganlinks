import { describe, it, expect } from 'vitest'

type CsvRow = Record<string, string>
type ColumnMap = Record<string, string> // csvHeader -> crmField

interface CourseImportRow {
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: string
  assigned_to: string | null
  notes: string | null
}

const VALID_STAGES = ['lead','contacted','demo','negotiating','partner','churned']
const VALID_ASSIGNEES = ['neil','billy']

function mapRow(row: CsvRow, columnMap: ColumnMap, defaultAssignee: string): CourseImportRow | null {
  const name = row[columnMap['name']]?.trim()
  if (!name) return null

  const stageRaw = row[columnMap['stage']]?.trim().toLowerCase() ?? ''
  const stage = VALID_STAGES.includes(stageRaw) ? stageRaw : 'lead'

  const assigneeRaw = row[columnMap['assigned_to']]?.trim().toLowerCase() ?? ''
  const assigned_to = VALID_ASSIGNEES.includes(assigneeRaw) ? assigneeRaw : defaultAssignee

  return {
    name,
    contact_name: row[columnMap['contact_name']]?.trim() || null,
    contact_email: row[columnMap['contact_email']]?.trim() || null,
    contact_phone: row[columnMap['contact_phone']]?.trim() || null,
    stage,
    assigned_to,
    notes: row[columnMap['notes']]?.trim() || null,
  }
}

describe('mapRow', () => {
  const columnMap = {
    name: 'Course Name',
    contact_name: 'Contact',
    contact_email: 'Email',
    contact_phone: 'Phone',
    stage: 'Stage',
    assigned_to: 'Assigned',
    notes: 'Notes',
  }

  it('maps a complete row', () => {
    const row: CsvRow = {
      'Course Name': 'Pine Hills Golf Club',
      Contact: 'John Smith',
      Email: 'john@pinehills.com',
      Phone: '555-1234',
      Stage: 'contacted',
      Assigned: 'neil',
      Notes: 'Called twice',
    }
    expect(mapRow(row, columnMap, 'neil')).toEqual({
      name: 'Pine Hills Golf Club',
      contact_name: 'John Smith',
      contact_email: 'john@pinehills.com',
      contact_phone: '555-1234',
      stage: 'contacted',
      assigned_to: 'neil',
      notes: 'Called twice',
    })
  })

  it('defaults stage to lead for unrecognized value', () => {
    const row: CsvRow = { 'Course Name': 'Test Course', Stage: 'prospect', Email: '', Contact: '', Phone: '', Assigned: '', Notes: '' }
    expect(mapRow(row, columnMap, 'neil')?.stage).toBe('lead')
  })

  it('defaults assigned_to to caller when blank', () => {
    const row: CsvRow = { 'Course Name': 'Test Course', Stage: '', Email: '', Contact: '', Phone: '', Assigned: '', Notes: '' }
    expect(mapRow(row, columnMap, 'billy')?.assigned_to).toBe('billy')
  })

  it('returns null when name is blank', () => {
    const row: CsvRow = { 'Course Name': '', Stage: '', Email: '', Contact: '', Phone: '', Assigned: '', Notes: '' }
    expect(mapRow(row, columnMap, 'neil')).toBeNull()
  })
})
