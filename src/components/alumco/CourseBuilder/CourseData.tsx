'use client'

import { AREAS_TRABAJO } from '@/lib/types/database'

interface TargetAreasGridProps {
  selectedAreas: string[]
  onChange: (areas: string[]) => void
}

export function TargetAreasGrid({ selectedAreas, onChange }: TargetAreasGridProps) {
  const allSelected = selectedAreas.length === 0

  function toggleArea(area: string) {
    if (selectedAreas.includes(area)) {
      onChange(selectedAreas.filter((a) => a !== area))
    } else {
      onChange([...selectedAreas, area])
    }
  }

  return (
    <div className="space-y-2">
      {/* Grid de áreas específicas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {AREAS_TRABAJO.map((area) => {
          const isChecked = selectedAreas.includes(area)
          return (
            <label
              key={area}
              className={`flex items-center gap-2 cursor-pointer rounded-lg border p-3 transition-colors min-h-[44px] ${
                isChecked
                  ? 'border-[#2B4FA0] bg-[#F0F4FF]'
                  : 'border-input bg-white hover:border-[#2B4FA0]/40'
              }`}
            >
              <input
                type="checkbox"
                name="target_areas"
                value={area}
                checked={isChecked}
                onChange={() => toggleArea(area)}
                className="accent-[#2B4FA0] h-4 w-4 shrink-0"
              />
              <span className="text-sm font-medium text-[#1A1A2E] leading-snug">
                {area}
              </span>
            </label>
          )
        })}
      </div>

      {/* Opción especial: Todos los colaboradores */}
      <label
        className={`flex items-center gap-2 cursor-pointer rounded-lg border p-3 transition-colors min-h-[44px] w-full ${
          allSelected
            ? 'border-[#2B4FA0] bg-[#F0F4FF]'
            : 'border-input bg-white hover:border-[#2B4FA0]/40'
        }`}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => onChange([])}
          className="accent-[#2B4FA0] h-4 w-4 shrink-0"
        />
        <span className="text-sm font-medium text-[#1A1A2E]">
          Todos los colaboradores
        </span>
        <span className="ml-auto text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider">
          Por defecto
        </span>
      </label>
    </div>
  )
}
