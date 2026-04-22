"use client";

import Link from 'next/link';
import { createCourseAction } from '@/lib/actions/courses';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { AREAS_TRABAJO } from '@/lib/types/database';
import { ChevronDown } from 'lucide-react';

// ── Selector de área objetivo ──────────────────────────────

interface AreaTargetSelectorProps {
  mode: 'all' | 'select'
  selectedAreas: string[]
  onModeChange: (mode: 'all' | 'select') => void
  onAreasChange: (areas: string[]) => void
}

function AreaTargetSelector({
  mode,
  selectedAreas,
  onModeChange,
  onAreasChange,
}: AreaTargetSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function toggleArea(area: string) {
    if (selectedAreas.includes(area)) {
      onAreasChange(selectedAreas.filter((a) => a !== area))
    } else {
      onAreasChange([...selectedAreas, area])
    }
  }

  const triggerText =
    selectedAreas.length === 0
      ? 'Selecciona las áreas...'
      : selectedAreas.length === 1
      ? selectedAreas[0]
      : `${selectedAreas.length} áreas seleccionadas`

  return (
    <div className="space-y-3">

      {/* Botones modo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange('all')}
          className={`flex-1 text-center rounded-xl border px-4 py-3 font-medium text-sm cursor-pointer transition-colors ${
            mode === 'all'
              ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
              : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
          }`}
        >
          Todas las áreas
        </button>
        <button
          type="button"
          onClick={() => onModeChange('select')}
          className={`flex-1 text-center rounded-xl border px-4 py-3 font-medium text-sm cursor-pointer transition-colors ${
            mode === 'select'
              ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
              : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
          }`}
        >
          Seleccionar áreas
        </button>
      </div>

      {/* Dropdown multi-select */}
      {mode === 'select' && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm flex items-center justify-between hover:border-[#2B4FA0] transition-colors"
          >
            <span className={selectedAreas.length === 0 ? 'text-[#6B7280]' : 'text-[#1A1A2E]'}>
              {triggerText}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 w-full bg-white rounded-xl border shadow-lg mt-1">
              <div className="max-h-60 overflow-y-auto py-1">
                {AREAS_TRABAJO.map((area) => {
                  const isSelected = selectedAreas.includes(area)
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0F4FF] cursor-pointer text-sm w-full text-left"
                    >
                      <div
                        className={`h-4 w-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#2B4FA0]' : 'border-2 border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-[#1A1A2E]">{area}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t">
                <span className="text-xs text-[#6B7280]">
                  {selectedAreas.length}{' '}
                  {selectedAreas.length === 1 ? 'área seleccionada' : 'áreas seleccionadas'}
                </span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="text-[#2B4FA0] font-semibold text-sm"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────

export default function NuevoCursoPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [mode, setMode] = useState<'all' | 'select'>('all');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await createCourseAction(formData);

    if (result.success && result.id) {
      router.push(`/admin/cursos/${result.id}/editar`);
    } else {
      setIsPending(false);
      alert(result.error || "Ocurrió un error al crear el curso");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">
          Crear nuevo curso
        </h1>
        <p className="text-[#6B7280] mt-1 text-sm">
          Completa los datos básicos. Luego podrás agregar módulos y evaluaciones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">

        {/* Inputs hidden para target_areas */}
        {mode === 'select' && selectedAreas.map((area) => (
          <input key={area} type="hidden" name="target_areas" value={area} />
        ))}

        {/* Datos del curso */}
        <div className="bg-white rounded-xl border p-4 lg:p-6 space-y-4 lg:space-y-5">

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Título del curso *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ej: Cuidado integral del adulto mayor"
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Describe brevemente el contenido y objetivos del curso"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors resize-none"
            />
          </div>

          <div className="h-px bg-border"/>

          {/* Fecha límite */}
          <div className="space-y-1.5">
            <label htmlFor="deadline" className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Fecha límite de cumplimiento
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>

          {/* Descripción del plazo */}
          <div className="space-y-1.5">
            <label htmlFor="deadline_description" className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Descripción del plazo
            </label>
            <input
              id="deadline_description"
              name="deadline_description"
              type="text"
              placeholder="Ej: Obligatorio antes de auditoría SENAMA"
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>

          <div className="h-px bg-border"/>

          {/* Área objetivo */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Área objetivo
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                ¿A quién va dirigido este curso?
              </p>
            </div>
            <AreaTargetSelector
              mode={mode}
              selectedAreas={selectedAreas}
              onModeChange={setMode}
              onAreasChange={setSelectedAreas}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/admin/cursos"
            className="flex-1 h-12 rounded-lg border text-base font-medium text-[#6B7280] hover:bg-gray-50 transition-colors flex items-center justify-center min-h-[48px]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 h-12 rounded-lg bg-[#2B4FA0] text-white text-base font-bold hover:bg-[#1A2F6B] transition-colors min-h-[48px] disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear y agregar módulos →"}
          </button>
        </div>
      </form>
    </div>
  );
}
