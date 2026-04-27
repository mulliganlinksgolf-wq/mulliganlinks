import { getCourseById } from '@/lib/db/courses'
import { getTeeSheetConfig, getCourseHours } from '@/lib/db/onboarding'
import Step2Form from './Step2Form'

export default async function Step2Page({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const [course, config, hours] = await Promise.all([
    getCourseById(courseId),
    getTeeSheetConfig(courseId),
    getCourseHours(courseId),
  ])
  return <Step2Form courseId={courseId} course={course} config={config} dbHours={hours} />
}
