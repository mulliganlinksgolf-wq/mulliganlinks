import { getCourseById } from '@/lib/db/courses'
import Step5Page from './Step5Page'
import { notFound } from 'next/navigation'

export default async function Step5ServerPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)
  if (!course?.slug) notFound()
  return <Step5Page courseId={courseId} courseSlug={course.slug} />
}
