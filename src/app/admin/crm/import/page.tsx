import { ImportClient } from './ImportClient'

export const metadata = { title: 'Import Courses' }

export default function ImportPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Import Courses</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          Upload a CSV to bulk-create course pipeline records. Duplicates (matched by email) are skipped.
        </p>
      </div>
      <ImportClient />
    </div>
  )
}
