import { getCourseById } from '@/lib/db/courses'
import Step5Page from './Step5Page'

export default async function Step5ServerPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)
  const courseSlug = course?.slug ?? courseId
  return <Step5Page courseId={courseId} courseSlug={courseSlug} />
}
