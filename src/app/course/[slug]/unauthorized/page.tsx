export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-4xl mb-4">🔒</div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Access restricted</h1>
      <p className="text-[#6B7770] mb-6 max-w-sm">
        You don&apos;t have permission to view this section. Contact your course manager if you need access.
      </p>
      <a
        href={`/course/${slug}`}
        className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-medium hover:bg-[#163d2a] transition-colors"
      >
        ← Back to tee sheet
      </a>
    </div>
  )
}
