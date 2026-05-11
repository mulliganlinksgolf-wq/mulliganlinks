import { AUTHORS, type AuthorKey } from '@/lib/authors'

export function AuthorBio({ authorKey }: { authorKey: AuthorKey }) {
  const author = AUTHORS[authorKey]
  const initials = author.name.split(' ').map(n => n[0]).join('')
  return (
    <div className="mt-12 pt-8 border-t border-black/10 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-[#0F3D2E] flex items-center justify-center text-[#E0A800] font-bold text-lg flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="font-semibold text-[#0F3D2E]">{author.name}</p>
        <p className="text-sm text-gray-500 mb-1">{author.title}, TeeAhead</p>
        <p className="text-sm text-gray-600">{author.bio}</p>
      </div>
    </div>
  )
}
