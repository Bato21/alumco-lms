'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, Loader2 } from 'lucide-react'
import { updateWorkerAction, suspendWorkerAction } from '@/lib/actions/trabajadores'
import { AREAS_TRABAJO } from '@/lib/types/database'
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog'

interface WorkerEditPanelProps {
  profileId: string
  fullName: string
  rut: string | null
  sede: string
  areas: string[]
  sedes: { id: string; nombre: string }[]
  onClose: () => void
}

export function WorkerEditPanel({
  profileId,
  fullName: initialFullName,
  rut: initialRut,
  sede: initialSede,
  areas,
  sedes,
  onClose,
}: WorkerEditPanelProps) {
  const [fullName, setFullName] = useState(initialFullName)
  const [rut, setRut] = useState(initialRut ?? '')
  const [sede, setSede] = useState(initialSede)
  const [selectedAreas, setSelectedAreas] = useState<string[]>(areas)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSuspendPending, startSuspendTransition] = useTransition()

  const dropdownRef = useRef<HTMLDivElement>(null)
  // A11Y-12 · el panel se monta ya abierto: el padre controla su ciclo de vida,
  // así que el estado «abierto» es constante y el cierre es `onClose`.
  const dialogRef = useAccessibleDialog<HTMLElement>(true, onClose)

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
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const triggerText =
    selectedAreas.length === 0
      ? 'Selecciona las áreas...'
      : selectedAreas.length === 1
      ? selectedAreas[0]
      : `${selectedAreas.length} áreas seleccionadas`

  function handleSave() {
    setError(null)
    const fd = new FormData()
    fd.append('full_name', fullName)
    fd.append('rut', rut ?? '')
    fd.append('sede', sede)
    selectedAreas.forEach(a => fd.append('area_trabajo', a))

    startTransition(async () => {
      const result = await updateWorkerAction(profileId, fd)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  function handleSuspend() {
    if (!window.confirm(`¿Suspender la cuenta de ${fullName}? El trabajador no podrá iniciar sesión.`)) return
    setError(null)

    startSuspendTransition(async () => {
      const result = await suspendWorkerAction(profileId)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const isLoading = isPending || isSuspendPending

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <aside
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Editar trabajador ${fullName}`}
        className="fixed right-0 top-0 h-screen w-full sm:w-[480px] md:w-[520px] bg-white z-[70] shadow-2xl border-l-4 border-[#2B4FA0] flex flex-col"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A2E] leading-tight">Editar trabajador</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">Modifica los datos del perfil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar panel"
          >
            <X className="h-5 w-5 text-[#6B7280]" aria-hidden="true" />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-[var(--peligro)] rounded-lg px-4 py-3 text-sm text-[var(--peligro)]" role="alert">
              {error}
            </div>
          )}

          {/* Nombre completo */}
          <div className="space-y-2">
            <label htmlFor="edit-full-name" className="block text-sm font-semibold text-[#1A1A2E]">
              Nombre completo
            </label>
            <input
              id="edit-full-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus-visible:border-[#2B4FA0] transition-colors disabled:opacity-60"
            />
          </div>

          {/* RUT */}
          <div className="space-y-2">
            <label htmlFor="edit-rut" className="block text-sm font-semibold text-[#1A1A2E]">
              RUT <span className="text-[#6B7280] font-normal">(opcional)</span>
            </label>
            <input
              id="edit-rut"
              type="text"
              value={rut}
              onChange={e => setRut(e.target.value)}
              disabled={isLoading}
              placeholder="12.345.678-9"
              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus-visible:border-[#2B4FA0] transition-colors disabled:opacity-60"
            />
          </div>

          {/* Sede */}
          <div className="space-y-2">
            <label htmlFor="edit-sede" className="block text-sm font-semibold text-[#1A1A2E]">
              Sede
            </label>
            <select
              id="edit-sede"
              value={sede}
              onChange={e => setSede(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm focus-visible:border-[#2B4FA0] transition-colors disabled:opacity-60"
            >
              {sedes.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Áreas de trabajo — dropdown multi-select */}
          <div className="space-y-2">
            {/* El control no es un <input> sino el <button> del desplegable,
                así que el rótulo se enlaza con aria-labelledby en lugar de
                `for`: un <label> sin `for` no lo anuncia ningún lector. */}
            <span id="wep-areas-rotulo" className="block text-sm font-semibold text-[#1A1A2E]">
              Áreas de trabajo
            </span>

            {/* Inputs hidden para el submit */}
            {selectedAreas.map(a => (
              <input key={a} type="hidden" name="area_trabajo" value={a} />
            ))}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="wep-areas-boton"
                onClick={() => setDropdownOpen(v => !v)}
                disabled={isLoading}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                // Se anuncia «Áreas de trabajo, <selección actual>».
                aria-labelledby="wep-areas-rotulo wep-areas-boton"
                className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm flex items-center justify-between hover:border-[#2B4FA0] focus-visible:border-[#2B4FA0] transition-colors disabled:opacity-60"
              >
                <span className={`truncate ${selectedAreas.length === 0 ? 'text-[#6B7280]' : 'text-[#1A1A2E]'}`}>
                  {triggerText}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-[#6B7280] shrink-0 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute z-50 w-full bg-white rounded-xl border border-gray-200 shadow-lg mt-1"
                  role="listbox"
                  aria-multiselectable="true"
                >
                  <div className="max-h-48 overflow-y-auto py-1">
                    {AREAS_TRABAJO.map(area => {
                      const isSelected = selectedAreas.includes(area)
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          role="option"
                          aria-selected={isSelected}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0F4FF] cursor-pointer text-sm w-full text-left"
                        >
                          <div
                            className={`h-4 w-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#2B4FA0]' : 'border-2 border-slate-300'
                            }`}
                            aria-hidden="true"
                          >
                            {isSelected && (
                              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-[#1A1A2E] leading-snug">{area}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                    <span className="text-[10px] text-[#6B7280]">
                      {selectedAreas.length}{' '}
                      {selectedAreas.length === 1 ? 'área seleccionada' : 'áreas seleccionadas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(false)}
                      className="text-[#2B4FA0] font-semibold text-xs hover:underline"
                    >
                      Listo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-5 bg-[#F8F9FA] border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || fullName.trim().length < 2}
            aria-busy={isPending}
            // Blanco sobre #b9740f daba 3.77:1; sobre #b45309 da 5.02:1.
            className="w-full h-12 flex items-center justify-center rounded-lg bg-[#b45309] text-white font-bold text-sm hover:bg-[#8f4207] transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>

          <button
            type="button"
            onClick={handleSuspend}
            disabled={isLoading}
            aria-busy={isSuspendPending}
            className="w-full h-12 flex items-center justify-center rounded-lg border-2 border-[var(--peligro)] text-[var(--peligro)] font-bold text-sm hover:bg-[var(--peligro)]/5 transition-colors disabled:opacity-50"
          >
            {isSuspendPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Suspendiendo...
              </>
            ) : (
              'Suspender trabajador'
            )}
          </button>
        </div>
      </aside>
    </>,
    document.body
  )
}
