'use client'

import { useState, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { CourseKanbanCard } from './CourseKanbanCard'
import { updateCourseStage } from '@/app/actions/crm/courses'
import type { CrmCourse, CrmCourseStage } from '@/lib/crm/types'

const STAGES: { id: CrmCourseStage; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'demo', label: 'Demo' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'partner', label: 'Partner' },
  { id: 'churned', label: 'Churned' },
]

const PAGE_SIZE = 25
const EMPTY_PAGES: Record<CrmCourseStage, number> = {
  lead: 0, contacted: 0, demo: 0, negotiating: 0, partner: 0, churned: 0,
}

function parseNote(notes: string | null | undefined, key: string): string | null {
  if (!notes) return null
  const m = notes.match(new RegExp(key + ': ([^|]+)'))
  return m ? m[1].trim() : null
}

interface Props {
  initialCourses: CrmCourse[]
}

export function CourseKanban({ initialCourses }: Props) {
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterMetro, setFilterMetro] = useState('')
  const [filterHotDeals, setFilterHotDeals] = useState('')
  const [pages, setPages] = useState<Record<CrmCourseStage, number>>(EMPTY_PAGES)

  const filtered = useMemo(() => {
    let list = courses
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.contact_name ?? '').toLowerCase().includes(q)
    )
    if (filterTier) list = list.filter(c => parseNote(c.notes, 'Outreach Tier')?.includes(filterTier))
    if (filterMetro) list = list.filter(c => parseNote(c.notes, 'Metro Detroit') === filterMetro)
    if (filterHotDeals) list = list.filter(c => parseNote(c.notes, 'Does Hot Deals') === filterHotDeals)
    return list
  }, [courses, search, filterTier, filterMetro, filterHotDeals])

  function groupByStage(): Record<CrmCourseStage, CrmCourse[]> {
    const grouped = {} as Record<CrmCourseStage, CrmCourse[]>
    for (const s of STAGES) grouped[s.id] = []
    for (const c of filtered) grouped[c.stage].push(c)
    return grouped
  }

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const newStage = destination.droppableId as CrmCourseStage
    setCourses((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, stage: newStage } : c))
    )
    const res = await updateCourseStage(draggableId, newStage)
    if (res.error) setCourses(initialCourses)
  }

  function resetFilters() {
    setSearch('')
    setFilterTier('')
    setFilterMetro('')
    setFilterHotDeals('')
    setPages(EMPTY_PAGES)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPages(EMPTY_PAGES)
  }

  function handleFilter(setter: (v: string) => void, value: string) {
    setter(value)
    setPages(EMPTY_PAGES)
  }

  const hasActiveFilters = search || filterTier || filterMetro || filterHotDeals
  const grouped = groupByStage()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search courses or contacts…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-64 pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs leading-none"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filterTier}
          onChange={e => handleFilter(setFilterTier, e.target.value)}
          className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
        >
          <option value="">All Tiers</option>
          <option value="Tier 1">Tier 1 — GolfNow/Lightspeed</option>
          <option value="Tier 2">Tier 2 — Paid SaaS</option>
          <option value="Tier 3">Tier 3 — Manual/Unknown</option>
        </select>

        <select
          value={filterMetro}
          onChange={e => handleFilter(setFilterMetro, e.target.value)}
          className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
        >
          <option value="">Metro Detroit</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <select
          value={filterHotDeals}
          onChange={e => handleFilter(setFilterHotDeals, e.target.value)}
          className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
        >
          <option value="">Hot Deals</option>
          <option value="YES">Active</option>
          <option value="NO">No</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(({ id, label }) => {
            const all = grouped[id]
            const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
            const currentPage = Math.min(pages[id], totalPages - 1)
            const paginated = all.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

            return (
              <div key={id} className="flex-shrink-0 w-52 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
                  <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5">{all.length}</span>
                </div>

                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-24 rounded-xl p-2 space-y-2 transition-colors
                        ${snapshot.isDraggingOver ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}
                      `}
                    >
                      {paginated.map((course, index) => (
                        <Draggable key={course.id} draggableId={course.id} index={index}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <CourseKanbanCard course={course} isDragging={snap.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-2 px-1">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setPages(p => ({ ...p, [id]: currentPage - 1 }))}
                      className="text-xs text-slate-500 disabled:opacity-30 hover:text-slate-800 disabled:cursor-default"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-slate-400">{currentPage + 1} / {totalPages}</span>
                    <button
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setPages(p => ({ ...p, [id]: currentPage + 1 }))}
                      className="text-xs text-slate-500 disabled:opacity-30 hover:text-slate-800 disabled:cursor-default"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
