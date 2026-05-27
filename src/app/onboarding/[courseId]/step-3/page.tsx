import { getCourseById } from '@/lib/db/courses'
import { getTeeSheetConfig, getCoursePricing } from '@/lib/db/onboarding'
import Step3Form from './Step3Form'

export default async function Step3Page({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const [course, config, pricing] = await Promise.all([
    getCourseById(courseId),
    getTeeSheetConfig(courseId),
    getCoursePricing(courseId),
  ])
  return <Step3Form courseId={courseId} course={course} config={config} dbPricing={pricing} />
}
