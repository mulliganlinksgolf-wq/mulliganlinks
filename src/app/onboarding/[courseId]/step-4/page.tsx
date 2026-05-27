import { getCourseById } from '@/lib/db/courses'
import Step4Form from './Step4Form'

export default async function Step4Page({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)
  return <Step4Form courseId={courseId} course={course} />
}
