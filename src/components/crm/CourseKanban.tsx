'use client'

import { useState } from 'react'
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

interface Props {
  initialCourses: CrmCourse[]
}

export function CourseKanban({ initialCourses }: Props) {
  const [courses, setCourses] = useState(initialCourses)

  function groupByStage(): Record<CrmCourseStage, CrmCourse[]> {
    const grouped = {} as Record<CrmCourseStage, CrmCourse[]>
    for (const s of STAGES) grouped[s.id] = []
    for (const c of courses) grouped[c.stage].push(c)
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
    if (res.error) {
      setCourses(initialCourses)
    }
  }

  const grouped = groupByStage()

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(({ id, label }) => (
          <div key={id} className="flex-shrink-0 w-52">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5">{grouped[id].length}</span>
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
                  {grouped[id].map((course, index) => (
                    <Draggable key={course.id} draggableId={course.id} index={index}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <CourseKanbanCard course={course} isDragging={snap.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
