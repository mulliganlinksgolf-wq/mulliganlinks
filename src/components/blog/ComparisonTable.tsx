export function ComparisonTable({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="not-prose my-6 max-w-full overflow-x-auto rounded-xl ring-1 ring-black/5"
      tabIndex={0}
      role="region"
      aria-label="Comparison table, scroll horizontally to view all columns"
    >
      <table className="w-full min-w-[600px] text-sm text-left">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="bg-[#0F3D2E] text-[#F4F1EA] font-semibold px-4 py-3 first:rounded-tl-xl last:rounded-tr-xl">
      {children}
    </th>
  );
}

export function Td({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 border-b border-black/5 ${highlight ? "text-[#0F3D2E] font-semibold" : "text-gray-700"}`}
    >
      {children}
    </td>
  );
}
