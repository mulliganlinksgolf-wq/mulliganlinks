import type { CrmCourse, CrmTask, CrmAssignee } from './types'

export type WorkspaceCourse = Pick<CrmCourse, 'id' | 'name' | 'city' | 'state' | 'contact_name' | 'contact_email' | 'contact_phone' | 'stage' | 'assigned_to' | 'notes' | 'last_activity_at'>
export type WorkspaceView = 'all' | 'due' | 'unplanned' | 'new' | 'review'
export type WorkspaceOwner = 'all' | 'unassigned' | CrmAssignee

export function detroitDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function isMetroCourse(course: WorkspaceCourse) {
  return /(?:^|[|\n])\s*Metro Detroit:\s*Yes\s*(?:[|\n]|$)/i.test(course.notes ?? '')
}

export function courseTaskMap(tasks: CrmTask[]) {
  const map = new Map<string, CrmTask[]>()
  for (const task of tasks) {
    if (task.completed_at || task.record_type !== 'course' || !task.record_id) continue
    const group = map.get(task.record_id) ?? []
    group.push(task)
    map.set(task.record_id, group)
  }
  for (const group of map.values()) group.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.id.localeCompare(b.id))
  return map
}

export function filterWorkspaceCourses(courses: WorkspaceCourse[], tasks: CrmTask[], filters: {
  today: string; owner: WorkspaceOwner; view: WorkspaceView; search: string; metroOnly: boolean
}) {
  const map = courseTaskMap(tasks)
  const search = filters.search.trim().toLowerCase()
  const isDue = (course: WorkspaceCourse) => {
    const date = map.get(course.id)?.[0]?.due_date
    return !!date && date <= filters.today
  }
  return courses.filter(course => {
    if (course.stage === 'partner' || course.stage === 'churned') return false
    if (filters.owner !== 'all' && (course.assigned_to ?? 'unassigned') !== filters.owner) return false
    if (filters.metroOnly && !isMetroCourse(course)) return false
    if (search && ![course.name, course.city, course.contact_name, course.contact_email].some(value => value?.toLowerCase().includes(search))) return false
    if (filters.view === 'due') return isDue(course)
    if (filters.view === 'unplanned') return !map.has(course.id)
    if (filters.view === 'new') return course.stage === 'lead'
    if (filters.view === 'review') return course.stage === 'demo' || course.stage === 'negotiating'
    return true
  }).sort((a, b) => {
    const due = Number(isDue(b)) - Number(isDue(a))
    if (due) return due
    if (isDue(a) && isDue(b)) {
      const date = map.get(a.id)![0].due_date!.localeCompare(map.get(b.id)![0].due_date!)
      if (date) return date
    }
    return Number(isMetroCourse(b)) - Number(isMetroCourse(a))
      || Number(map.has(a.id)) - Number(map.has(b.id))
      || (a.last_activity_at ?? '').localeCompare(b.last_activity_at ?? '')
      || a.name.localeCompare(b.name)
  })
}

export function phoneHref(phone: string) {
  const [number, extension] = phone.split(/\s*(?:ext\.?|extension|x|#)\s*/i)
  return `tel:${number.replace(/[^+\d]/g, '')}${extension?.match(/^\d+/) ? `;ext=${extension.match(/^\d+/)![0]}` : ''}`
}
