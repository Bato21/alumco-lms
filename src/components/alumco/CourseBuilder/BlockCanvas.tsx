'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { reorderModulesAction, deleteModuleAction } from '@/lib/actions/courses'
import { BlockCard } from './BlockCard'
import { BlockPropertiesPanel } from './BlockPropertiesPanel'
import { type ModuleBlock } from './CourseBuilder'
import { GraduationCap } from 'lucide-react'

interface BlockCanvasProps {
  courseId: string
  modules: ModuleBlock[]
  onModulesChange: (modules: ModuleBlock[]) => void
}

export function BlockCanvas({
  courseId,
  modules,
  onModulesChange,
}: BlockCanvasProps) {
  const [selectedModule, setSelectedModule] = useState<ModuleBlock | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex((m) => m.id === active.id)
    const newIndex = modules.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(modules, oldIndex, newIndex).map(
      (m, i) => ({ ...m, order_index: i + 1 })
    )

    // Actualización optimista
    onModulesChange(reordered)

    startTransition(async () => {
      await reorderModulesAction(
        courseId,
        reordered.map(({ id, order_index }) => ({ id, order_index }))
      )
    })
  }

  function handleDelete(moduleId: string) {
    if (!confirm('¿Eliminar este bloque?')) return
    const updated = modules
      .filter((m) => m.id !== moduleId)
      .map((m, i) => ({ ...m, order_index: i + 1 }))
    onModulesChange(updated)

    startTransition(async () => {
      await deleteModuleAction(moduleId, courseId)
    })
  }

  function handleSelect(module: ModuleBlock) {
    setSelectedModule(module.id === selectedModule?.id ? null : module)
  }

  function handleModuleUpdated(updated: ModuleBlock) {
    onModulesChange(
      modules.map((m) => (m.id === updated.id ? updated : m))
    )
    setSelectedModule(updated)
  }

  return (
    <div className="space-y-3 lg:space-y-4">

      {/* Instrucción */}
      <div className="bg-white rounded-xl border px-4 lg:px-6 py-3 lg:py-4">
        <p className="text-xs lg:text-sm text-muted-foreground text-center">
          Arrastra los bloques para reordenar la ruta de aprendizaje
        </p>
      </div>

      {/* Lista de bloques */}
      {modules.length === 0 ? (
        <div className="bg-white rounded-xl border px-4 lg:px-6 py-12 lg:py-16 flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="font-medium text-[#1A1A2E]">
            Este curso no tiene módulos aún
          </p>
          <p className="text-sm text-muted-foreground">
            Agrega bloques desde el panel lateral
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1 lg:space-y-2">
              {modules.map((module, index) => (
                <div key={module.id}>
                  <BlockCard
                    module={module}
                    isSelected={selectedModule?.id === module.id}
                    onSelect={() => handleSelect(module)}
                    onDelete={() => handleDelete(module.id)}
                  />

                  {/* Conector entre bloques */}
                  {index < modules.length - 1 && (
                    <div className="flex justify-center my-1" aria-hidden="true">
                      <svg
                        className="h-4 w-4 text-muted-foreground/40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Panel de propiedades del bloque seleccionado */}
      {selectedModule && (
        <BlockPropertiesPanel
          module={selectedModule}
          courseId={courseId}
          onClose={() => setSelectedModule(null)}
          onUpdated={handleModuleUpdated}
        />
      )}
    </div>
  )
}
