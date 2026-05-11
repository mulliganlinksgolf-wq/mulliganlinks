export function ComparisonTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl ring-1 ring-black/5">
      <table className="w-full text-sm text-left">
        {children}
      </table>
    </div>
  )
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="bg-[#0F3D2E] text-[#F4F1EA] font-semibold px-4 py-3 first:rounded-tl-xl last:rounded-tr-xl">
      {children}
    </th>
  )
}

export function Td({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td className={`px-4 py-3 border-b border-black/5 ${highlight ? 'text-[#0F3D2E] font-semibold' : 'text-gray-700'}`}>
      {children}
    </td>
  )
}
