'use client'

import { CourseTable } from '@/components/crm/CourseTable'
import { exportCsv } from '@/lib/crm/csv'
import type { CrmCourse } from '@/lib/crm/types'

interface Props { courses: CrmCourse[] }

export function CoursesTableWrapper({ courses }: Props) {
  function handleExport() {
    exportCsv(
      courses.map((c) => ({
        name: c.name,
        city: c.city,
        state: c.state,
        contact_name: c.contact_name,
        contact_email: c.contact_email,
        contact_phone: c.contact_phone,
        stage: c.stage,
        estimated_value: c.estimated_value,
        assigned_to: c.assigned_to,
        last_activity_at: c.last_activity_at,
      })),
      'teeahead-courses'
    )
  }
  return <CourseTable initialCourses={courses} onExportCsv={handleExport} />
}
