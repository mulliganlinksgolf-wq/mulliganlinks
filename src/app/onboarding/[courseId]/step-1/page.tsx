import { getCourseById } from '@/lib/db/courses'
import Step1Form from './Step1Form'

export default async function Step1Page({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)
  return <Step1Form courseId={courseId} initial={course} />
}
