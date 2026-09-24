import { describe, expect, it } from 'vitest'
import { courseTaskMap, detroitDate, filterWorkspaceCourses, isMetroCourse, phoneHref, type WorkspaceCourse } from './workspace'
import type { CrmTask } from './types'

const course = (id: string, extra: Partial<WorkspaceCourse> = {}): WorkspaceCourse => ({ id, name: id, city: 'Detroit', state: 'MI', contact_name: null, contact_email: null, contact_phone: null, stage: 'lead', assigned_to: 'billy', notes: null, last_activity_at: '2026-09-01T12:00:00Z', ...extra })
const task = (id: string, record_id: string, due_date: string | null, extra: Partial<CrmTask> = {}): CrmTask => ({ id, record_id, record_type: 'course', due_date, title: id, notes: null, assigned_to: 'billy', completed_at: null, created_at: '', updated_at: '', ...extra })
const filters = { today: '2026-09-24', owner: 'all' as const, view: 'all' as const, search: '', metroOnly: false }

describe('daily outreach', () => {
  it('uses Detroit dates across UTC midnight and daylight savings', () => {
    expect(detroitDate(new Date('2026-09-25T02:00:00Z'))).toBe('2026-09-24')
    expect(detroitDate(new Date('2026-01-25T04:30:00Z'))).toBe('2026-01-24')
  })
  it('prioritizes overdue tasks before metro courses and excludes terminal stages', () => {
    const courses = [course('metro', { notes: 'Priority: High | Metro Detroit: Yes | Tier: 1' }), course('due'), course('late'), course('won', { stage: 'partner' }), course('lost', { stage: 'churned' })]
    expect(filterWorkspaceCourses(courses, [task('a', 'due', '2026-09-24'), task('b', 'late', '2026-09-20')], filters).map(c => c.id)).toEqual(['late', 'due', 'metro'])
  })
  it('does not count completed, future or undated tasks as due', () => {
    const tasks = [task('done', 'a', '2026-09-01', { completed_at: '2026-09-02' }), task('future', 'b', '2026-10-01'), task('undated', 'c', null)]
    const courses = ['a','b','c'].map(id => course(id))
    expect(filterWorkspaceCourses(courses, tasks, { ...filters, view: 'due' })).toEqual([])
    expect(filterWorkspaceCourses(courses, tasks, { ...filters, view: 'unplanned' }).map(c => c.id)).toEqual(['a'])
  })
  it('combines owner, search and explicit location markers', () => {
    const courses = [course('a', { contact_name: 'Jordan', notes: 'Metro Detroit: Yes' }), course('b', { contact_name: 'Jordan', notes: 'Metro Detroit: Yes', assigned_to: 'neil' }), course('c', { contact_name: 'Jordan', notes: 'Metro Detroit: No' })]
    expect(filterWorkspaceCourses(courses, [], { ...filters, search: 'JORDAN', owner: 'billy', metroOnly: true }).map(c => c.id)).toEqual(['a'])
    expect(isMetroCourse(course('x', { notes: 'Not Metro Detroit: Yes' }))).toBe(false)
  })
  it('orders dated before undated tasks and ignores noncourse tasks', () => {
    expect(courseTaskMap([task('undated','a',null),task('due','a','2026-09-24'),task('outing','a','2026-09-01',{ record_type:'outing' })]).get('a')?.map(t => t.id)).toEqual(['due','undated'])
  })
  it('keeps phone extensions separate from the number', () => {
    expect(phoneHref('(248) 555-0100 ext. 102')).toBe('tel:2485550100;ext=102')
  })
})
